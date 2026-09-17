const { prisma } = require("../config/db");
const { domainError } = require("./serviceServices");
const { validateBookingAvailability } = require("../services/availabilityServices");
const { resolveOwnProfile } = require("./entrepreneurProfileServices");
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
  const profile = await resolveOwnProfile(userId);

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

const updateBookingStatus = (userId, bookingId, status) => prisma.$transaction(async (tx) => {
  const initial = await tx.booking.findUnique({
    where: { id: bookingId },
    select: { service: { select: { entrepreneur_id: true } } },
  });
  if (!initial) throw domainError("BOOKING_NOT_FOUND");

  // Profile first, then booking: suspension and booking creation take the same
  // profile lock. Re-read state after locking under ReadCommitted isolation.
  await tx.$queryRaw`SELECT id FROM entrepreneur_profiles
    WHERE id = ${initial.service.entrepreneur_id}::uuid FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM bookings WHERE id = ${bookingId}::uuid FOR UPDATE`;
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true, user_id: true, status: true,
      service: { select: { entrepreneur: { select: {
        user_id: true, verification_status: true,
      } } } },
    },
  });
  if (!booking) throw domainError("BOOKING_NOT_FOUND");
  const actor = await tx.user.findUnique({ where: { id: userId }, select: { role: true } });
  const provider = booking.service.entrepreneur;
  const isOwner = provider.user_id === userId && actor?.role.includes("entrepreneur");
  const isCustomer = booking.user_id === userId;
  if (!isOwner && !isCustomer) throw domainError("BOOKING_NOT_FOUND");
  if (status !== "cancelled") {
    if (!isOwner) throw domainError("BOOKING_PERMISSION_DENIED");
    if (provider.verification_status !== "verified") throw domainError("PROVIDER_NOT_VERIFIED");
  }
  const allowed = {
    confirmed: ["pending"],
    completed: ["confirmed"],
    cancelled: ["pending", "confirmed"],
  };
  if (!Object.hasOwn(allowed, status) || !allowed[status].includes(booking.status)) {
    throw domainError("BOOKING_STATUS_CONFLICT");
  }
  return tx.booking.update({
    where: { id: bookingId },
    data: { status },
  });
}, { isolationLevel: "ReadCommitted" });

module.exports = {
  createBooking,
  listStudentBookings,
  listEntrepreneurBookings,
  updateBookingStatus
};
