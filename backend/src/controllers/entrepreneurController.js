const {
  availabilityIdSchema,
  createAvailabilitySchema,
  patchAvailabilitySchema,
  updateProfileSchema,
  serviceIdSchema,
  ownerServiceQuerySchema,
  createServiceSchema,
  patchServiceSchema,
} = require("../validators/entrepreneurValidators");
const {
  paginationSchema,
} = require("../validators/availabilityValidators");
const {
  createAvailability,
  listAvailability,
  patchAvailability,
  archiveAvailability,
  updateOwnProfile,
  createService,
  getServices,
  getService,
  patchService,
  archiveService,
} = require("../services/entrepreneurServices");
const {
  validationFailure,
  serviceFailure,
} = require("./serviceResponses");

const updateProfile = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const { value, error } = updateProfileSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        message: "Invalid entrepreneur profile update",
        errors: error.details.map((detail) => ({
          field:
            detail.type === "object.unknown"
              ? "unknown_field"
              : detail.path.join("."),
          message: "Field is missing, invalid, or not allowed",
        })),
      });
    }
    const profile = await updateOwnProfile(req.user.id, value);
    return res.status(200).json({
      message: "Entrepreneur profile updated successfully",
      data: { entrepreneur_profile: profile },
    });
  } catch (error) {
    if (error.code === "PROFILE_NOT_FOUND") {
      return res
        .status(404)
        .json({ message: "Entrepreneur profile not found" });
    }
    if (error.code === "MULTIPLE_PROFILES") {
      return res.status(409).json({
        message:
          "Multiple entrepreneur profiles found; resolve duplicates before updating",
      });
    }
    next(error);
  }
};

const createOwnService = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const body = createServiceSchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const result = await createService(req.user.id, body.value);
    return res
      .status(201)
      .json({
        message: "Service created successfully",
        data: { service: result },
      });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const listOwnServices = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const query = ownerServiceQuerySchema.validate(req.query, {
      abortEarly: false,
    });
    if (query.error) return validationFailure(res, query.error);
    const result = await getServices(req.user.id, query.value);
    return res
      .status(200)
      .json({ message: "Services retrieved successfully", data: result });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const getOwnService = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = serviceIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const result = await getService(req.user.id, params.value.serviceId);
    return res
      .status(200)
      .json({
        message: "Service retrieved successfully",
        data: { service: result },
      });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const updateOwnService = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = serviceIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const body = patchServiceSchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const result = await patchService(
      req.user.id,
      params.value.serviceId,
      body.value,
    );
    return res
      .status(200)
      .json({
        message: "Service updated successfully",
        data: { service: result },
      });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const deleteOwnService = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = serviceIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const result = await archiveService(req.user.id, params.value.serviceId);
    return res
      .status(200)
      .json({
        message: "Service archived successfully",
        data: { service: result },
      });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const createOwnAvailability = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = serviceIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const body = createAvailabilitySchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const result = await createAvailability(req.user.id, params.value.serviceId, body.value);
    return res.status(201).json({ message: "Weekly availability created successfully", data: { slot: result } });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const listOwnAvailability = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = serviceIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const query = paginationSchema.validate(req.query, { abortEarly: false });
    if (query.error) return validationFailure(res, query.error);
    const result = await listAvailability(req.user.id, params.value.serviceId, query.value);
    return res.status(200).json({ message: "Weekly availability retrieved successfully", data: result });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const updateOwnAvailability = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = availabilityIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const body = patchAvailabilitySchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const result = await patchAvailability(req.user.id, params.value.serviceId, params.value.slotId, body.value);
    return res.status(200).json({ message: "Weekly availability updated successfully", data: { slot: result } });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const deleteOwnAvailability = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = availabilityIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const result = await archiveAvailability(req.user.id, params.value.serviceId, params.value.slotId);
    return res.status(200).json({ message: "Weekly availability archived successfully", data: { slot: result } });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

module.exports = {
  updateProfile,
  createOwnService,
  listOwnServices,
  getOwnService,
  updateOwnService,
  deleteOwnService,
  createOwnAvailability,
  listOwnAvailability,
  updateOwnAvailability,
  deleteOwnAvailability,
};
