const { registrationSchema } = require("../validators/authValidators");
const { registerUser } = require("../services/authServices");

const validateRegistration = (input) =>
  registrationSchema.validate(input, { abortEarly: false });

const register = async (req, res, next) => {
  try {
    const { value, error } = validateRegistration(req.body);
    if (error) {
      return res.status(400).json({
        message: "Invalid registration input",
        errors: error.details.map((detail) => ({
          field:
            detail.type === "object.unknown"
              ? "unknown_field"
              : detail.path.join("."),
          message: "Field is missing, invalid, or not allowed",
        })),
      });
    }
    const data = await registerUser(value);
    return res.status(201).json({ message: "Registration successful", data });
  } catch (error) {
    next(error);
  }
};

module.exports = { register };
