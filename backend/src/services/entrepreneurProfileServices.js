const { prisma } = require("../config/db");
const { domainError } = require("./serviceServices");

const resolveOwnProfile = async (userId, db = prisma) => {
  const profiles = await db.entrepreneurProfile.findMany({
    where: { user_id: userId }, select: { id: true }, take: 2,
  });
  if (profiles.length === 0) throw domainError("PROFILE_NOT_FOUND");
  if (profiles.length > 1) throw domainError("MULTIPLE_PROFILES");
  return profiles[0];
};
module.exports = { resolveOwnProfile };
