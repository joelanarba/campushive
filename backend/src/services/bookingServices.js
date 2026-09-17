const { prisma } = require("../config/db");
const { domainError } = require("./serviceServices");
const { validateBookingAvailability } = require("../services/availabilityServices");
const crypto = require("crypto");

const createBooking = async (userId, payload) => prisma.$transaction(async (tx) => {
  // Validate availability using the built-in helper
  const validated = await validateBookingAvailability(tx, {
    serviceId: payload.service_id,
    slotId: payload.slot_id,
    slotVersion: payload.slot_version,
    startsAt: payload.starts_at,
  });

  // Get service name for snapshot
  const service = await tx.service.findUnique({
    where: { id: payload.service_id },
    select: { title: true }
  });

  const ref = crypto.randomBytes(4).toString('hex').toUpperCase();

  const booking = await tx.booking.create({
    data: {
      service_id: validated.service_id,
      slot_id: validated.slot_id,
      user_id: userId,
      booking_reference: ref,
      status: 'pending',
      service_name_snapshot: service.title,
      starts_at: validated.starts_at,
      ends_at: validated.ends_at
    }
  });

  return booking;
}, { isolationLevel: "ReadCommitted" });

const listStudentBookings = async (userId) => {
  return prisma.booking.findMany({
    where: { user_id: userId },
    include: {
      service: {
        include: {
          entrepreneur: {
            select: { business_name: true, phone_number: true }
          }
        }
      }
    },
    orderBy: { starts_at: 'desc' }
  });
};

const listEntrepreneurBookings = async (userId) => {
  const profile = await prisma.entrepreneurProfile.findUnique({
    where: { user_id: userId }
  });
  if (!profile) return [];

  return prisma.booking.findMany({
    where: { service: { entrepreneur_id: profile.id } },
    include: {
      user: {
        select: { full_name: true, email: true }
      },
      service: {
        select: { title: true, price: true }
      }
    },
    orderBy: { starts_at: 'desc' }
  });
};

const updateBookingStatus = async (userId, bookingId, status) => {
  // We'll let both entrepreneur (to confirm/complete) and student (to cancel) use this for now
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: { select: { entrepreneur_id: true } } }
  });
  if (!booking) throw domainError("BOOKING_NOT_FOUND");

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status }
  });
};

module.exports = {
  createBooking,
  listStudentBookings,
  listEntrepreneurBookings,
  updateBookingStatus
};
