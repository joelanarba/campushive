const { updateProfileSchema } = require("../validators/entrepreneurValidators");
const { updateOwnProfile } = require("../services/entrepreneurServices");

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

module.exports = { updateProfile };
