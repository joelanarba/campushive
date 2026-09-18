const {
  serviceIdSchema,
  categoryIdSchema,
  paginationSchema,
  adminServiceQuerySchema,
  createCategorySchema,
  patchCategorySchema,
} = require("./serviceValidators");

const Joi = require("joi");

const listUsersSchema = Joi.object({
  page: Joi.string()
    .pattern(/^[1-9][0-9]*$/)
    .default("1"),
  limit: Joi.string()
    .pattern(/^[1-9][0-9]*$/)
    .default("20"),
  role: Joi.string().valid("student", "entrepreneur", "admin"),
})
  .unknown(false)
  .custom((value, helpers) => {
    const page = Number(value.page);
    const limit = Number(value.limit);
    const offset = (page - 1) * limit;
    // Prisma pagination uses signed 32-bit integers.
    if (
      !Number.isSafeInteger(page) ||
      limit > 100 ||
      !Number.isSafeInteger(offset) ||
      offset > 2147483647
    ) {
      return helpers.error("any.invalid");
    }
    return { ...value, page, limit };
  });

const listEntrepreneursSchema = Joi.object({
  page: Joi.string().pattern(/^[1-9][0-9]*$/).default("1"),
  limit: Joi.string().pattern(/^[1-9][0-9]*$/).default("20"),
  status: Joi.string().valid("pending", "verified", "rejected", "suspended"),
}).unknown(false).custom((value, helpers) => {
  const page = Number(value.page);
  const limit = Number(value.limit);
  const offset = (page - 1) * limit;
  if (!Number.isSafeInteger(page) || limit > 100 || !Number.isSafeInteger(offset) || offset > 2147483647) {
    return helpers.error("any.invalid");
  }
  return { ...value, page, limit };
});

const entrepreneurIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const updateVerificationSchema = Joi.object({
  verification_status: Joi.string().valid("verified", "rejected").required(),
  rejection_reason: Joi.string().when("verification_status", {
    is: "rejected",
    then: Joi.required(),
    otherwise: Joi.optional().allow(""),
  }),
});

module.exports = {
  listUsersSchema,
  listEntrepreneursSchema,
  entrepreneurIdSchema,
  updateVerificationSchema,
  serviceIdSchema,
  categoryIdSchema,
  paginationSchema,
  adminServiceQuerySchema,
  createCategorySchema,
  patchCategorySchema,
};
