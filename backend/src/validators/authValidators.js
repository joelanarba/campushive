const Joi = require("joi");
const password = Joi.string()
  .min(8)
  .custom((value, helpers) => {
    if (
      Buffer.byteLength(value, "utf8") > 72 ||
      !/[A-Z]/.test(value) ||
      !/[a-z]/.test(value) ||
      !/[0-9]/.test(value) ||
      !/[^A-Za-z0-9\s]/.test(value)
    ) {
      return helpers.error("any.invalid");
    }
    return value;
  })
  .required();
const registrationSchema = Joi.object({
  account_type: Joi.string().valid("student", "entrepreneur").required(),
  full_name: Joi.string().trim().min(1).max(150).required(),
  email: Joi.string()
    .trim()
    .lowercase()
    .max(254)
    .email({ tlds: { allow: false } })
    .required(),
  password,
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
      }).required(),
    otherwise: Joi.forbidden(),
  }),
})
  .required()
  .unknown(false);


module.exports = { registrationSchema };
