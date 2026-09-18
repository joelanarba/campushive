const Joi = require("joi");
const { paginationSchema } = require("./serviceValidators");

const bookingIdSchema = Joi.object({ id: Joi.string().guid().required() }).unknown(false);
const createBookingSchema = Joi.object({
  service_id: Joi.string().guid().required(),
  slot_id: Joi.string().guid().required(),
  slot_version: Joi.number().integer().positive().max(2147483647).strict().required(),
  starts_at: Joi.string().isoDate().pattern(/(?:Z|[+-][0-9]{2}:[0-9]{2})$/).strict().required(),
}).unknown(false).required();
const patchBookingSchema = Joi.object({
  status: Joi.string().valid("pending", "confirmed", "cancelled", "completed").required(),
}).unknown(false).required();

module.exports = { bookingIdSchema, createBookingSchema, patchBookingSchema, paginationSchema };
