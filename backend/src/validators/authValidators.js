const Joi = require("joi");
// const password = Joi.string()
//   .min(8)
//   .custom((value, helpers) => {
//     if (
//       Buffer.byteLength(value, "utf8") > 72 ||
//       !/[A-Z]/.test(value) ||
//       !/[a-z]/.test(value) ||
//       !/[0-9]/.test(value) ||
//       !/[^A-Za-z0-9\s]/.test(value)
//     ) {
//       return helpers.error("any.invalid");
//     }
//     return value;
//   })
//   .required();
const registrationSchema = Joi.object({
  account_type: Joi.string()
    .valid("student", "entrepreneur", "admin")
    .required(),
  full_name: Joi.string().trim().min(1).max(150).required(),
  email: Joi.string()
    .trim()
    .lowercase()
    .max(254)
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp("(?=.*[a-z])"))
    .pattern(new RegExp("(?=.*[A-Z])"))
    .pattern(new RegExp("(?=.*[0-9])"))
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password cannot exceed 128 characters",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      "any.required": "Password is required",
    }),
  confirm_password: Joi.string().valid(Joi.ref("password")).required(),
  business_name: Joi.when("account_type", {
    is: "entrepreneur",
    then: Joi.string().trim().min(1).max(150).required(),
    otherwise: Joi.forbidden(),
  }),
  description: Joi.when("account_type", {
    is: "entrepreneur",
    then: Joi.string().trim().min(1).max(2000).required(),
    otherwise: Joi.forbidden(),
  }),
  location: Joi.when("account_type", {
    is: "entrepreneur",
    then: Joi.string().trim().min(1).max(255).required(),
    otherwise: Joi.forbidden(),
  }),
  phone_number: Joi.when("account_type", {
    is: "entrepreneur",
    then: Joi.string()
      .trim()
      .max(50)
      .pattern(/^\+?[0-9 ()-]+$/)
      .custom((value, helpers) => {
        const digits = value.replace(/\D/g, "").length;
        return digits >= 7 && digits <= 15
          ? value
          : helpers.error("any.invalid");
      })
      .required(),
    otherwise: Joi.forbidden(),
  }),
})
  .required()
  .unknown(false);

const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .max(254)
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string()
    .max(72)
    .custom((value, helpers) =>
      Buffer.byteLength(value, "utf8") <= 72
        ? value
        : helpers.error("any.invalid"),
    )
    .required(),
})
  .required()
  .unknown(false);

module.exports = { registrationSchema, loginSchema };
