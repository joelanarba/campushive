const {
  serviceIdSchema,
  categoryIdSchema,
  paginationSchema,
  adminServiceQuerySchema,
  createCategorySchema,
  patchCategorySchema,
} = require("./serviceValidators");

const Joi = require("joi");

const entrepreneurIdSchema = Joi.object({
  entrepreneurId: Joi.string().guid().required(),
}).unknown(false);
const emptyRequestSchema = Joi.object({}).unknown(false);
const rejectEntrepreneurSchema = Joi.object({
  rejection_reason: Joi.string().trim().min(1).max(2000).required(),
})
  .unknown(false)
  .required();

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

module.exports = {
  entrepreneurIdSchema,
  emptyRequestSchema,
  rejectEntrepreneurSchema,
  listUsersSchema,
  serviceIdSchema,
  categoryIdSchema,
  paginationSchema,
  adminServiceQuerySchema,
  createCategorySchema,
  patchCategorySchema,
};
