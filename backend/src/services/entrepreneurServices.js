const {
  createAvailability,
  listAvailability,
  patchAvailability,
  archiveAvailability,
} = require("./availabilityServices");
const {
  prisma,
} = require("../config/db");
const {
  listServices,
  findService,
  createOwnedService,
  patchOwnedService,
} = require("./serviceServices");
const {
  resolveOwnProfile,
} = require("./entrepreneurProfileServices");

const profileError = (code) => {
  const error = new Error("Unable to update entrepreneur profile");
  error.code = code;
  return error;
};

const updateOwnProfile = async (userId, input) => {
  const profile = await resolveOwnProfile(userId);
  // Copy only supplied editable fields, never ownership or approval metadata.
  const data = {};
  for (const field of ["business_name", "description", "phone_number", "location"]) {
    if (Object.hasOwn(input, field)) data[field] = input[field];
  }

  try {
    return await prisma.entrepreneurProfile.update({
      where: { id: profile.id, user_id: userId },
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

const ownerScope = (profileId, userId) => ({ entrepreneur_id: profileId, entrepreneur: { user_id: userId } });
const createService = async (userId, input) => {
  const profile = await resolveOwnProfile(userId);
  return createOwnedService(profile.id, input);
};
const getServices = async (userId, query) => {
  const profile = await resolveOwnProfile(userId);
  return listServices(query, ownerScope(profile.id, userId));
};
const getService = async (userId, id) => {
  const profile = await resolveOwnProfile(userId);
  return findService(id, ownerScope(profile.id, userId));
};
const patchService = async (userId, id, input) => {
  const profile = await resolveOwnProfile(userId);
  return patchOwnedService(id, ownerScope(profile.id, userId), input);
};
const archiveService = async (userId, id) => {
  const profile = await resolveOwnProfile(userId);
  return patchOwnedService(id, ownerScope(profile.id, userId), { is_active: false });
};

module.exports = {
  updateOwnProfile,
  createService,
  getServices,
  getService,
  patchService,
  archiveService,
  createAvailability,
  listAvailability,
  patchAvailability,
  archiveAvailability,
};
