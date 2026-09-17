const Joi = require("joi");

const bookingIdSchema = Joi.object({
  id: Joi.string().guid().required(),
}).unknown(false);
const patchBookingSchema = Joi.object({
  status: Joi.string().valid("confirmed", "completed", "cancelled").required(),
})
  .unknown(false)
  .required();

module.exports = { bookingIdSchema, patchBookingSchema };
