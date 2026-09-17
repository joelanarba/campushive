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
    VERIFICATION_CONFLICT: [
      409,
      "Entrepreneur profile is no longer in the required verification status",
    ],
    BOOKING_NOT_FOUND: [404, "Booking not found"],
    BOOKING_STATUS_CONFLICT: [
      409,
      "Booking cannot transition to the requested status",
    ],
    BOOKING_PERMISSION_DENIED: [
      403,
      "Only the owning entrepreneur may confirm or complete this booking",
    ],
    PROVIDER_NOT_VERIFIED: [
      403,
      "Provider must be verified to confirm or complete bookings",
    ],
    PROFILE_NOT_FOUND: [404, "Entrepreneur profile not found"],
    MULTIPLE_PROFILES: [
      409,
      "Multiple entrepreneur profiles found; resolve duplicates before continuing",
    ],
    INVALID_AVAILABILITY: [400, "End time must be later than start time"],
    AVAILABILITY_NOT_FOUND: [404, "Weekly availability not found"],
    AVAILABILITY_OVERLAP: [
      409,
      "Weekly availability overlaps an existing window",
    ],
    AVAILABILITY_HAS_BOOKINGS: [
      409,
      "Availability change would invalidate an ongoing or upcoming booking",
    ],
    AVAILABILITY_CHANGED: [
      409,
      "Availability has changed or is no longer bookable",
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
