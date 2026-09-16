const bcrypt = require("bcrypt");
const { randomUUID, randomBytes } = require("node:crypto");
const {
  issueAccessToken,
  createRefreshToken,
  hashRefreshToken,
} = require("./tokenServices");
const { prisma } = require("../config/prismaConfig");
const userSelect = {
  id: true,
  full_name: true,
  email: true,
  role: true,
  is_email_verified: true,
  created_at: true,
  entrepreneur_profiles: {
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
      const { entrepreneur_profiles, ...user } = record;
      return {
        user,
        entrepreneur_profile: entrepreneur_profiles[0] || null,
        ...issueAccessToken(user),
      };
    });
  } catch (error) {
    if (error.code === "P2002") throw duplicateEmail();
    throw error;
  }
};

// Use the same bcrypt cost for unknown emails to avoid an obvious timing shortcut.
const dummyPasswordHash = bcrypt.hash(randomBytes(32).toString("hex"), 12);
const safeUserSelect = {
  id: true,
  full_name: true,
  email: true,
  role: true,
  is_email_verified: true,
  created_at: true,
};

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
    select: { ...safeUserSelect, password_hash: true },
  });
  const matches = await bcrypt.compare(
    password,
    user?.password_hash || dummyHash,
  );
  if (!user || !matches) throw authenticationError("INVALID_CREDENTIALS");
  const { password_hash, ...safeUser } = user;
  const refresh = createRefreshToken();
  const data = { user: safeUser, ...issueAccessToken(safeUser) };
  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: refresh.token_hash,
      expires_at: refresh.expires_at,
      family_id: randomUUID(),
    },
  });
  return { data, refreshToken: refresh.token };
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
        include: { user: { select: safeUserSelect } },
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
      const refresh = createRefreshToken();
      await tx.refreshToken.create({
        data: {
          user_id: record.user_id,
          token_hash: refresh.token_hash,
          family_id: record.family_id,
          expires_at: refresh.expires_at,
        },
      });
      return {
        data: { user: record.user, ...issueAccessToken(record.user) },
        refreshToken: refresh.token,
      };
    },
    { isolationLevel: "ReadCommitted" },
  );
  if (!result) throw authenticationError("INVALID_REFRESH_TOKEN");
  return result;
};

module.exports = {
  registerUser,
  loginUser,
  refreshSession,
  findAuthenticatedUser,
};
