const { prisma } = require("../config/prismaConfig");

const profileError = (code) => {
  const error = new Error("Unable to update entrepreneur profile");
  error.code = code;
  return error;
};

const updateOwnProfile = async (userId, input) => {
  const profiles = await prisma.entrepreneurProfile.findMany({
    where: { user_id: userId },
    select: { id: true },
    take: 2,
  });
  if (profiles.length === 0) throw profileError("PROFILE_NOT_FOUND");
  if (profiles.length > 1) throw profileError("MULTIPLE_PROFILES");

  // Copy only supplied editable fields, never ownership or approval metadata.
  const data = {};
  for (const field of ["business_name", "description", "phone_number", "location"]) {
    if (Object.hasOwn(input, field)) data[field] = input[field];
  }

  try {
    return await prisma.entrepreneurProfile.update({
      where: { id: profiles[0].id, user_id: userId },
      data,
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
    });
  } catch (error) {
    if (error.code === "P2025") throw profileError("PROFILE_NOT_FOUND");
    throw error;
  }
};

module.exports = { updateOwnProfile };
