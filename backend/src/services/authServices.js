const bcrypt = require("bcrypt");
const { randomUUID, randomBytes } = require("node:crypto");
const {
  issueAccessToken,
  createRefreshToken,
  hashRefreshToken,
} = require("./tokenServices");
const { prisma } = require("../config/db");
const userSelect = {
  id: true,
  full_name: true,
  email: true,
  role: true,
  is_email_verified: true,
  created_at: true,
  entrepreneur_profiles: {
    take: 2,
    select: {
      id: true,
      user_id: true,
      business_name: true,
      description: true,
      phone_number: true,
      location: true,
      verification_status: true,
      rejection_reason: true,
      created_at: true,
    },
  },
};
// One safe shape for all session responses; never select an arbitrary profile.
const serializeUser = (record) => {
  const profiles = record.entrepreneur_profiles || [];
  return {
    id: record.id, full_name: record.full_name, email: record.email, role: record.role,
    is_email_verified: record.is_email_verified, created_at: record.created_at,
    entrepreneur_profile: profiles.length === 1 ? profiles[0] : null,
    entrepreneur_profile_issue: record.role.includes("entrepreneur")
      ? profiles.length === 0 ? "PROFILE_NOT_FOUND" : profiles.length > 1 ? "MULTIPLE_PROFILES" : null
      : null,
  };
};

const createSession = async (db, user, familyId = randomUUID()) => {
  const refresh = createRefreshToken();
  const data = { user, ...issueAccessToken(user) };
  await db.refreshToken.create({ data: {
    user_id: user.id, token_hash: refresh.token_hash,
    expires_at: refresh.expires_at, family_id: familyId,
  } });
  return { data, refreshToken: refresh.token };
};

const duplicateEmail = () => {
  const error = new Error("An account with this email already exists");
  error.status = 409;
  return error;
};

const registerUser = async (input) => {
  const registrationRoles = new Map([
    ["student", ["student"]],
    ["entrepreneur", ["student", "entrepreneur"]],
  ]);
  const roles = registrationRoles.get(input.account_type);
  if (!roles) throw new Error("Unsupported public account type");
  if (
    await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    })
  ) {
    throw duplicateEmail();
  }
  const password_hash = await bcrypt.hash(input.password, 12);
  const isEntrepreneur = input.account_type === "entrepreneur";
  try {
    // Token-signing failure also rolls back the account.
    return await prisma.$transaction(async (tx) => {
      const record = await tx.user.create({
        data: {
          full_name: input.full_name,
          email: input.email,
          password_hash,
          role: roles,
          is_email_verified: false,
          ...(isEntrepreneur
            ? {
                entrepreneur_profiles: {
                  create: {
                    business_name: input.business_name,
                    description: input.description,
                    phone_number: input.phone_number,
                    location: input.location,
                    verification_status: "pending",
                  },
                },
              }
            : {}),
        },
        select: userSelect,
      });
      const user = serializeUser(record);
      const session = await createSession(tx, user);
      session.data.entrepreneur_profile = user.entrepreneur_profile;
      return session;
    });
  } catch (error) {
    if (error.code === "P2002") throw duplicateEmail();
    throw error;
  }
};

// Use the same bcrypt cost for unknown emails to avoid an obvious timing shortcut.
const dummyPasswordHash = bcrypt.hash(randomBytes(32).toString("hex"), 12);
const authenticationError = (code) => {
  const error = new Error("Authentication failed");
  error.status = 401;
  error.code = code;
  return error;
};

// The current User model has no inactive/deleted state. Profile approval is
// a provider authorization concern, not an account authentication restriction.
const findAuthenticatedUser = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

const loginUser = async ({ email, password }) => {
  const dummyHash = await dummyPasswordHash;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...userSelect, password_hash: true },
  });
  const matches = await bcrypt.compare(
    password,
    user?.password_hash || dummyHash,
  );
  if (!user || !matches) throw authenticationError("INVALID_CREDENTIALS");
  return prisma.$transaction((tx) => createSession(tx, serializeUser(user)));
};

const refreshSession = async (token) => {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    throw authenticationError("INVALID_REFRESH_TOKEN");
  }
  const token_hash = hashRefreshToken(token);
  const initial = await prisma.refreshToken.findUnique({
    where: { token_hash },
  });
  if (!initial) throw authenticationError("INVALID_REFRESH_TOKEN");

  const result = await prisma.$transaction(
    async (tx) => {
      // Serialize all rotation/replay operations for the family, including requests
      // involving different generations. Hash collisions only serialize extra work.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${initial.family_id}))::text`;
      const record = await tx.refreshToken.findUnique({
        where: { token_hash },
        include: { user: { select: userSelect } },
      });
      if (!record) return null;
      const now = new Date();
      if (record.consumed_at) {
        await tx.refreshToken.updateMany({
          where: { family_id: record.family_id, revoked_at: null },
          data: { revoked_at: now },
        });
        // Return instead of throwing so replay revocation is committed.
        return null;
      }
      if (record.revoked_at || record.expires_at <= now || !record.user)
        return null;
      const consumed = await tx.refreshToken.updateMany({
        where: {
          id: record.id,
          consumed_at: null,
          revoked_at: null,
          expires_at: { gt: now },
        },
        data: { consumed_at: now },
      });
      if (consumed.count !== 1) return null;
      return createSession(tx, serializeUser(record.user), record.family_id);
    },
    { isolationLevel: "ReadCommitted" },
  );
  if (!result) throw authenticationError("INVALID_REFRESH_TOKEN");
  return result;
};

const logoutSession = async (token) => {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return;
  const record = await prisma.refreshToken.findUnique({ where: { token_hash: hashRefreshToken(token) }, select: { family_id: true } });
  if (!record) return;
  await prisma.$transaction(async (tx) => {
    // Revokes replacements too, whether logout or rotation obtains the lock first.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${record.family_id}))::text`;
    await tx.refreshToken.updateMany({ where: { family_id: record.family_id, revoked_at: null }, data: { revoked_at: new Date() } });
  }, { isolationLevel: "ReadCommitted" });
};

const getCurrentUser = async (id) => {
  const record = await prisma.user.findUnique({ where: { id }, select: userSelect });
  return record ? serializeUser(record) : null;
};

module.exports = {
  logoutSession,
  getCurrentUser,
  registerUser,
  loginUser,
  refreshSession,
  findAuthenticatedUser,
};
