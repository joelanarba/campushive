const validationFailure = (res, error) =>
  res.status(400).json({
    message: "Invalid request input",
    errors: error.details.map((detail) => ({
      field:
        detail.type === "object.unknown"
          ? "unknown_field"
          : detail.path.join("."),
      message: "Field is missing, invalid, or not allowed",
    })),
  });
const serviceFailure = (error, res, next) => {
  const errors = {
    PROFILE_NOT_FOUND: [404, "Entrepreneur profile not found"],
    MULTIPLE_PROFILES: [
      409,
      "Multiple entrepreneur profiles found; resolve duplicates before continuing",
    ],
    SERVICE_NOT_FOUND: [404, "Service not found"],
    CATEGORY_NOT_FOUND: [404, "Category not found"],
    INVALID_CATEGORY: [400, "Category does not exist or is unavailable"],
    CATEGORY_IN_USE: [
      409,
      "Category is referenced by services and cannot be deleted",
    ],
  };
  const result = Object.hasOwn(errors, error.code)
    ? errors[error.code]
    : undefined;
  if (result) return res.status(result[0]).json({ message: result[1] });
  return next(error);
};
module.exports = { validationFailure, serviceFailure };
