const {
  availabilityRangeSchema,
} = require("../validators/availabilityValidators");
const {
  getPublicAvailability,
} = require("../services/availabilityServices");
const {
  serviceIdSchema,
  publicServiceQuerySchema,
} = require("../validators/serviceValidators");
const {
  listPublicServices,
  getPublicService,
} = require("../services/serviceServices");
const {
  validationFailure,
  serviceFailure,
} = require("./serviceResponses");

const getServices = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const query = publicServiceQuerySchema.validate(req.query, {
      abortEarly: false,
    });
    if (query.error) return validationFailure(res, query.error);
    const result = await listPublicServices(query.value);
    return res
      .status(200)
      .json({ message: "Services retrieved successfully", data: result });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const getService = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = serviceIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const result = await getPublicService(params.value.serviceId);
    return res.status(200).json({
      message: "Service retrieved successfully",
      data: { service: result },
    });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const getAvailability = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = serviceIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const query = availabilityRangeSchema.validate(req.query, { abortEarly: false });
    if (query.error) return validationFailure(res, query.error);
    const result = await getPublicAvailability(params.value.serviceId, query.value);
    return res.status(200).json({ message: "Bookable availability retrieved successfully", data: result });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

module.exports = {
  getServices,
  getService,
  getAvailability,
};
