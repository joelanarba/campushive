const Joi = require("joi");

const serviceIdSchema = Joi.object({
  serviceId: Joi.string().guid().required(),
}).unknown(false);
const categoryIdSchema = Joi.object({
  categoryId: Joi.string().guid().required(),
}).unknown(false);
const paginationSchema = Joi.object({
  page: Joi.string()
    .pattern(/^[1-9][0-9]*$/)
    .default("1"),
  limit: Joi.string()
    .pattern(/^[1-9][0-9]*$/)
    .default("20"),
})
  .unknown(false)
  .custom((value, helpers) => {
    const page = Number(value.page);
    const limit = Number(value.limit);
    const offset = (page - 1) * limit;
    if (
      !Number.isSafeInteger(page) ||
      limit > 100 ||
      !Number.isSafeInteger(offset) ||
      offset > 2147483647
    )
      return helpers.error("any.invalid");
    return { ...value, page, limit };
  });
const publicServiceQuerySchema = paginationSchema.keys({
  q: Joi.string().trim().min(1).max(200),
  category_tag: Joi.string().trim().min(1).max(50),
  category_id: Joi.string().guid(),
  entrepreneur_id: Joi.string().guid(),
});
const ownerServiceQuerySchema = paginationSchema.keys({
  category_id: Joi.string().guid(),
  is_active: Joi.string().valid("true", "false"),
});
const adminServiceQuerySchema = publicServiceQuerySchema.keys({
  is_active: Joi.string().valid("true", "false"),
  verification_status: Joi.string().valid(
    "pending",
    "verified",
    "rejected",
    "suspended",
  ),
});
const priceSchema = Joi.any().custom((value, helpers) => {
  if (typeof value !== "string" && typeof value !== "number")
    return helpers.error("any.invalid");
  const text = String(value);
  if (!/^(0|[1-9][0-9]{0,9})(\.[0-9]{1,2})?$/.test(text))
    return helpers.error("any.invalid");
  return text;
});
const editableServiceSchema = Joi.object({
  title: Joi.string().trim().min(1).max(150),
  description: Joi.string().trim().min(1).max(2000),
  category_id: Joi.string().guid(),
  location_type: Joi.string().valid(
    "online",
    "provider_location",
    "customer_location",
  ),
  price: priceSchema,
  duration_minutes: Joi.number().integer().min(1).max(2147483647).strict(),
  is_active: Joi.boolean().strict(),
})
  .unknown(false)
  .required();
const createServiceSchema = editableServiceSchema
  .fork(
    [
      "title",
      "description",
      "category_id",
      "location_type",
      "price",
      "duration_minutes",
    ],
    (schema) => schema.required(),
  )
  .keys({ is_active: Joi.boolean().strict().default(true) });
const patchServiceSchema = editableServiceSchema.min(1);
const editableCategorySchema = Joi.object({
  category_name: Joi.string().trim().min(1).max(150),
  tag: Joi.string().trim().min(1).max(50),
  description: Joi.string().trim().min(1).max(2000),
})
  .unknown(false)
  .required();
const createCategorySchema = editableCategorySchema.fork(
  ["category_name", "tag", "description"],
  (schema) => schema.required(),
);
const patchCategorySchema = editableCategorySchema.min(1);
module.exports = {
  serviceIdSchema,
  categoryIdSchema,
  paginationSchema,
  publicServiceQuerySchema,
  ownerServiceQuerySchema,
  adminServiceQuerySchema,
  createServiceSchema,
  patchServiceSchema,
  createCategorySchema,
  patchCategorySchema,
};
