const {
  createBooking,
  listStudentBookings,
  listEntrepreneurBookings,
  updateBookingStatus,
} = require("../services/bookingServices");
const { validationFailure, serviceFailure } = require("./serviceResponses");
const {
  bookingIdSchema,
  patchBookingSchema,
} = require("../validators/bookingValidators");

const create = async (req, res, next) => {
  try {
    // Basic validation
    const { service_id, slot_id, slot_version, starts_at } = req.body;
    if (!service_id || !slot_id || !slot_version || !starts_at) {
      return res
        .status(400)
        .json({ message: "Missing required booking fields" });
    }

    const booking = await createBooking(req.user.id, {
      service_id,
      slot_id,
      slot_version,
      starts_at,
    });

    return res
      .status(201)
      .json({ message: "Booking created successfully", data: { booking } });
  } catch (error) {
    if (
      error.code === "AVAILABILITY_CHANGED" ||
      error.code === "SERVICE_NOT_FOUND"
    ) {
      return res
        .status(400)
        .json({ message: "The selected time slot is no longer available." });
    }
    return serviceFailure(error, res, next);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await listStudentBookings(req.user.id);
    return res.status(200).json({ data: { bookings } });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const getProviderBookings = async (req, res, next) => {
  try {
    const bookings = await listEntrepreneurBookings(req.user.id);
    return res.status(200).json({ data: { bookings } });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const patchBooking = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = bookingIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const body = patchBookingSchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const booking = await updateBookingStatus(
      req.user.id,
      params.value.id,
      body.value.status,
    );
    return res
      .status(200)
      .json({ message: "Booking updated", data: { booking } });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

module.exports = {
  create,
  getMyBookings,
  getProviderBookings,
  patchBooking,
};
