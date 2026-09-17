const {
  serviceIdSchema,
  ownerServiceQuerySchema,
  createServiceSchema,
  patchServiceSchema,
} = require("./serviceValidators");

const Joi = require("joi");

const updateProfileSchema = Joi.object({
  business_name: Joi.string().trim().min(1).max(150),
  description: Joi.string().trim().min(1).max(2000),
  location: Joi.string().trim().min(1).max(255),
  phone_number: Joi.string()
    .trim()
    .max(50)
    .pattern(/^\+?[0-9 ()-]+$/)
    .custom((value, helpers) => {
      const digits = value.replace(/\D/g, "").length;
      return digits >= 7 && digits <= 15 ? value : helpers.error("any.invalid");
    }),
})
  .min(1)
  .required()
  .unknown(false);

module.exports = { updateProfileSchema, serviceIdSchema, ownerServiceQuerySchema, createServiceSchema, patchServiceSchema };
