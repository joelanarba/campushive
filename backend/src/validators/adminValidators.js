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

module.exports = { listUsersSchema };
