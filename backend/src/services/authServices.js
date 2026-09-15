const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
          role: isEntrepreneur ? ["student", "entrepreneur"] : ["student"],
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
      const access_token = jwt.sign({ role: user.role }, process.env.JWT_ACCESS_SECRET, {
        algorithm: "HS256",
        subject: user.id,
        expiresIn: 900,
      });
      return {
        user,
        entrepreneur_profile: entrepreneur_profiles[0] || null,
        access_token,
        token_type: "Bearer",
        expires_in: 900,
      };
    });
  } catch (error) {
    if (error.code === "P2002") throw duplicateEmail();
    throw error;
  }
};
module.exports = { registerUser };
