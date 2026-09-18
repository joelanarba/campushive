const {
  createBooking,
  listStudentBookings,
  listEntrepreneurBookings,
  updateBookingStatus
} = require("../services/bookingServices");
const { validationFailure, serviceFailure } = require("./serviceResponses");
const { bookingIdSchema, createBookingSchema, patchBookingSchema, paginationSchema } = require("../validators/bookingValidators");

const create = async (req, res, next) => {
  try {
    const body = createBookingSchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const booking = await createBooking(req.user.id, body.value);
    
    return res.status(201).json({ message: "Booking created successfully", data: { booking } });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const query = paginationSchema.validate(req.query, { abortEarly: false });
    if (query.error) return validationFailure(res, query.error);
    const data = await listStudentBookings(req.user.id, query.value);
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ data });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const getProviderBookings = async (req, res, next) => {
  try {
    const query = paginationSchema.validate(req.query, { abortEarly: false });
    if (query.error) return validationFailure(res, query.error);
    const data = await listEntrepreneurBookings(req.user.id, query.value);
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ data });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const patchBooking = async (req, res, next) => {
  try {
    const params = bookingIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const body = patchBookingSchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const booking = await updateBookingStatus(req.user, params.value.id, body.value.status);
    return res.status(200).json({ message: "Booking updated", data: { booking } });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

module.exports = {
  create,
  getMyBookings,
  getProviderBookings,
  patchBooking
};
