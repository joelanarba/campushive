const { prisma } = require("../config/db");
const { domainError } = require("./serviceServices");
const { validateBookingAvailability, lockSchedulingRows } = require("./availabilityServices");
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

const listBookings = async (where, include, { page, limit }, provider = false) => {
  const queries = [
    prisma.booking.count({ where }),
    prisma.booking.findMany({ where, include, skip: (page - 1) * limit, take: limit,
      orderBy: [{ starts_at: "desc" }, { id: "asc" }] }),
  ];
  if (provider) queries.push(prisma.booking.count({ where: { AND: [where, { status: { in: ["pending", "confirmed"] }, ends_at: { gt: new Date() } }] } }));
  const [total, bookings, upcoming] = await prisma.$transaction(queries, { isolationLevel: "RepeatableRead" });
  return { bookings, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    ...(provider ? { summary: { upcoming } } : {}) };
};

const listStudentBookings = (userId, query) => listBookings({ user_id: userId }, {
  service: { include: { entrepreneur: { select: { business_name: true, phone_number: true } } } },
}, query);

const listEntrepreneurBookings = async (userId, query) => {
  const profile = await resolveOwnProfile(userId);
  return listBookings({ service: { entrepreneur_id: profile.id, entrepreneur: { user_id: userId } } }, {
    user: { select: { full_name: true, email: true } },
    service: { select: { title: true, price: true } },
  }, query, true);
};

const updateBookingStatus = async (actor, bookingId, status) =>
  prisma.$transaction(async (tx) => {
    const relationships = [];
    if (actor.role.includes("student")) relationships.push({ user_id: actor.id });
    if (actor.role.includes("entrepreneur")) {
      relationships.push({ service: { entrepreneur: { user_id: actor.id } } });
    }
    if (!relationships.length) throw domainError("BOOKING_FORBIDDEN");
    const scope = { id: bookingId, OR: relationships };
    const include = { service: { select: { entrepreneur_id: true, entrepreneur: { select: { user_id: true } } } } };
    const initial = await tx.booking.findFirst({ where: scope, include });
    if (!initial) throw domainError("BOOKING_NOT_FOUND");

    // Use the same profile-first protocol as reservation and availability writers.
    await lockSchedulingRows(tx, initial.service.entrepreneur_id, initial.service_id);
    await tx.$queryRaw`SELECT id FROM bookings WHERE id = ${bookingId}::uuid FOR UPDATE`;
    const booking = await tx.booking.findFirst({ where: scope, include });
    if (!booking) throw domainError("BOOKING_NOT_FOUND");
    if (booking.status !== initial.status || booking.status === status ||
        ["cancelled", "completed"].includes(booking.status) || status === "pending") {
      throw domainError("BOOKING_CONFLICT");
    }

    const customer = actor.role.includes("student") && booking.user_id === actor.id;
    const provider = actor.role.includes("entrepreneur") && booking.service.entrepreneur.user_id === actor.id;
    // Match the rest of provider management: never pick one of duplicate profiles.
    if (provider && !(customer && status === "cancelled")) {
      const profile = await resolveOwnProfile(actor.id, tx);
      if (profile.id !== booking.service.entrepreneur_id) throw domainError("BOOKING_NOT_FOUND");
    }
    if (!(customer && status === "cancelled") && !(provider && ["confirmed", "cancelled", "completed"].includes(status))) {
      throw domainError("BOOKING_FORBIDDEN");
    }
    const allowed = (booking.status === "pending" && ["confirmed", "cancelled"].includes(status)) ||
      (booking.status === "confirmed" && ((customer && status === "cancelled") || (provider && status === "completed")));
    if (!allowed) throw domainError("BOOKING_CONFLICT");
    const result = await tx.booking.updateMany({
      where: { ...scope, status: initial.status, service_id: initial.service_id }, data: { status },
    });
    if (result.count !== 1) throw domainError("BOOKING_CONFLICT");
    return tx.booking.findUnique({ where: { id: bookingId } });
  }, { isolationLevel: "ReadCommitted" });

module.exports = {
  createBooking,
  listStudentBookings,
  listEntrepreneurBookings,
  updateBookingStatus
};
