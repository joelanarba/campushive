const Joi = require("joi");
const { DateTime } = require("luxon");
const { SCHEDULING_TIMEZONE } = require("../config/availabilityConfig");
const { serviceIdSchema, paginationSchema } = require("./serviceValidators");

const availabilityIdSchema = serviceIdSchema.keys({ slotId: Joi.string().guid().required() });
const weeklyWindowSchema = Joi.object({
  weekday: Joi.number().integer().min(1).max(7).strict(),
  start_time: Joi.string().pattern(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: Joi.string().pattern(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/),
}).unknown(false).required().custom((value, helpers) => {
  if (value.start_time !== undefined && value.end_time !== undefined && value.end_time <= value.start_time) {
    return helpers.error("any.invalid");
  }
  return value;
});
const createAvailabilitySchema = weeklyWindowSchema.fork(
  ["weekday", "start_time", "end_time"], (schema) => schema.required(),
);
const patchAvailabilitySchema = weeklyWindowSchema.min(1);
const calendarDateSchema = Joi.string().pattern(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/).custom((value, helpers) => {
  const date = DateTime.fromISO(value, { zone: SCHEDULING_TIMEZONE });
  return date.isValid && date.year >= 1 && date.year <= 9999 && date.toISODate() === value
    ? value : helpers.error("any.invalid");
});
const availabilityRangeSchema = Joi.object({
  date_from: calendarDateSchema.required(),
  date_to: calendarDateSchema.required(),
}).unknown(false).required().custom((value, helpers) => {
  const from = DateTime.fromISO(value.date_from, { zone: SCHEDULING_TIMEZONE });
  const to = DateTime.fromISO(value.date_to, { zone: SCHEDULING_TIMEZONE });
  const days = to.diff(from, "days").days;
  return Number.isInteger(days) && days >= 0 && days < 31 ? value : helpers.error("any.invalid");
});
module.exports = { serviceIdSchema, availabilityIdSchema, paginationSchema,
  createAvailabilitySchema, patchAvailabilitySchema, availabilityRangeSchema };
