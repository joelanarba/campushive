const { DateTime } = require("luxon");
const { prisma } = require("../config/db");
const { SCHEDULING_TIMEZONE, START_STEP_MINUTES, RESERVING_STATUSES } = require("../config/availabilityConfig");
const { domainError, publicVisibility } = require("./serviceServices");
const { resolveOwnProfile } = require("./entrepreneurProfileServices");
const { timeText, databaseTime, localDateTime, fitsWeeklyWindow, isBookableInterval } = require("./availabilityRules");

const slotSelect = {
  id: true, service_id: true, weekday: true, start_time: true, end_time: true,
  is_active: true, version: true,
};
const schedulingServiceSelect = {
  id: true, entrepreneur_id: true, duration_minutes: true, is_active: true,
  entrepreneur: { select: { verification_status: true } },
};
const serializeSlot = (slot) => ({
  ...slot, start_time: timeText(slot.start_time), end_time: timeText(slot.end_time),
  timezone: SCHEDULING_TIMEZONE,
});

// All scheduling writers lock the profile BEFORE the service. Profile-wide locking
// serializes capacity across different services without globally blocking other providers.
const lockSchedulingRows = async (tx, profileId, serviceId) => {
  const profiles = await tx.$queryRaw`
    SELECT id FROM entrepreneur_profiles WHERE id = ${profileId}::uuid FOR UPDATE`;
  if (!profiles.length) throw domainError("SERVICE_NOT_FOUND");
  const services = await tx.$queryRaw`
    SELECT id FROM services WHERE id = ${serviceId}::uuid
      AND entrepreneur_id = ${profileId}::uuid FOR UPDATE`;
  if (!services.length) throw domainError("SERVICE_NOT_FOUND");
};
const ownedService = async (db, userId, serviceId, lock = false) => {
  const profile = await resolveOwnProfile(userId, db);
  if (lock) await lockSchedulingRows(db, profile.id, serviceId);
  const service = await db.service.findFirst({
    where: { id: serviceId, entrepreneur_id: profile.id, entrepreneur: { user_id: userId } },
    select: schedulingServiceSelect,
  });
  if (!service) throw domainError("SERVICE_NOT_FOUND");
  return service;
};
const ownedSlotWhere = (userId, serviceId, slotId) => ({
  id: slotId, service_id: serviceId, weekday: { not: null },
  service: { entrepreneur: { user_id: userId } },
});
const assertWindow = (slot) => {
  if (slot.end_time <= slot.start_time) throw domainError("INVALID_AVAILABILITY");
};
const assertNoWeeklyOverlap = async (tx, serviceId, slot, excludeId) => {
  const conflict = await tx.availabilitySlot.findFirst({
    where: {
      service_id: serviceId, weekday: slot.weekday, is_active: true,
      start_time: { lt: slot.end_time }, end_time: { gt: slot.start_time },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    }, select: { id: true },
  });
  if (conflict) throw domainError("AVAILABILITY_OVERLAP");
};
const activeSlotBookings = (tx, slotId) => tx.booking.findMany({
  where: { slot_id: slotId, status: { in: RESERVING_STATUSES }, ends_at: { gt: new Date() } },
  select: { starts_at: true, ends_at: true },
});

const createAvailability = (userId, serviceId, input) => prisma.$transaction(async (tx) => {
  await ownedService(tx, userId, serviceId, true);
  const data = {
    service_id: serviceId, weekday: input.weekday,
    start_time: databaseTime(input.start_time), end_time: databaseTime(input.end_time),
  };
  assertWindow(data);
  await assertNoWeeklyOverlap(tx, serviceId, data);
  return serializeSlot(await tx.availabilitySlot.create({ data, select: slotSelect }));
}, { isolationLevel: "ReadCommitted" });

const listAvailability = (userId, serviceId, { page, limit }) => prisma.$transaction(async (tx) => {
  await ownedService(tx, userId, serviceId);
  const where = {
    service_id: serviceId, weekday: { not: null }, is_active: true,
    service: { entrepreneur: { user_id: userId } },
  };
  const total = await tx.availabilitySlot.count({ where });
  const slots = await tx.availabilitySlot.findMany({
    where, select: slotSelect, skip: (page - 1) * limit, take: limit,
    orderBy: [{ weekday: "asc" }, { start_time: "asc" }, { id: "asc" }],
  });
  return { slots: slots.map(serializeSlot),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
}, { isolationLevel: "RepeatableRead" });

const patchAvailability = (userId, serviceId, slotId, input) => prisma.$transaction(async (tx) => {
  await ownedService(tx, userId, serviceId, true);
  const where = { ...ownedSlotWhere(userId, serviceId, slotId), is_active: true };
  const slot = await tx.availabilitySlot.findFirst({ where, select: slotSelect });
  if (!slot) throw domainError("AVAILABILITY_NOT_FOUND");
  const data = {};
  if (Object.hasOwn(input, "weekday")) data.weekday = input.weekday;
  if (Object.hasOwn(input, "start_time")) data.start_time = databaseTime(input.start_time);
  if (Object.hasOwn(input, "end_time")) data.end_time = databaseTime(input.end_time);
  const candidate = { ...slot, ...data };
  assertWindow(candidate);
  await assertNoWeeklyOverlap(tx, serviceId, candidate, slotId);
  const bookings = await activeSlotBookings(tx, slotId);
  if (bookings.some((booking) => !fitsWeeklyWindow(candidate, booking.starts_at, booking.ends_at))) {
    throw domainError("AVAILABILITY_HAS_BOOKINGS");
  }
  return serializeSlot(await tx.availabilitySlot.update({
    where, data: { ...data, version: { increment: 1 } }, select: slotSelect,
  }));
}, { isolationLevel: "ReadCommitted" });

const archiveAvailability = (userId, serviceId, slotId) => prisma.$transaction(async (tx) => {
  await ownedService(tx, userId, serviceId, true);
  const where = ownedSlotWhere(userId, serviceId, slotId);
  const slot = await tx.availabilitySlot.findFirst({ where, select: slotSelect });
  if (!slot) throw domainError("AVAILABILITY_NOT_FOUND");
  if (!slot.is_active) return serializeSlot(slot);
  if ((await activeSlotBookings(tx, slotId)).length) throw domainError("AVAILABILITY_HAS_BOOKINGS");
  return serializeSlot(await tx.availabilitySlot.update({
    where, data: { is_active: false, version: { increment: 1 } }, select: slotSelect,
  }));
}, { isolationLevel: "ReadCommitted" });

const capacityBookings = (db, profileId, from, to, excludeBookingId) => db.booking.findMany({
  where: {
    service: { entrepreneur_id: profileId }, status: { in: RESERVING_STATUSES },
    starts_at: { lt: to }, ends_at: { gt: from },
    ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
  }, select: { starts_at: true, ends_at: true },
});

const getPublicAvailability = (serviceId, { date_from, date_to }) => prisma.$transaction(async (tx) => {
  const service = await tx.service.findFirst({
    where: { AND: [{ id: serviceId }, publicVisibility] }, select: schedulingServiceSelect,
  });
  if (!service) throw domainError("SERVICE_NOT_FOUND");
  const firstDay = DateTime.fromISO(date_from, { zone: SCHEDULING_TIMEZONE });
  const lastDay = DateTime.fromISO(date_to, { zone: SCHEDULING_TIMEZONE });
  const rangeEnd = lastDay.plus({ days: 1 });
  const slots = await tx.availabilitySlot.findMany({
    where: { service_id: serviceId, weekday: { not: null }, is_active: true }, select: slotSelect,
    orderBy: [{ weekday: "asc" }, { start_time: "asc" }, { id: "asc" }],
  });
  const bookings = await capacityBookings(tx, service.entrepreneur_id, firstDay.toJSDate(), rangeEnd.toJSDate());
  const now = new Date();
  const occurrences = [];
  for (let day = firstDay; day <= lastDay; day = day.plus({ days: 1 })) {
    for (const slot of slots.filter((window) => window.weekday === day.weekday)) {
      const windowEnd = localDateTime(day.toISODate(), timeText(slot.end_time));
      for (let start = localDateTime(day.toISODate(), timeText(slot.start_time)); start < windowEnd;
        start = start.plus({ minutes: START_STEP_MINUTES })) {
        const end = start.plus({ minutes: service.duration_minutes });
        if (end > windowEnd) break;
        const startsAt = start.toJSDate();
        const endsAt = end.toJSDate();
        if (!isBookableInterval(slot, startsAt, endsAt, bookings, now)) continue;
        occurrences.push({
          service_id: serviceId, slot_id: slot.id, slot_version: slot.version,
          date: day.toISODate(), start_time: start.toFormat("HH:mm"), end_time: end.toFormat("HH:mm"),
          starts_at: start.toUTC().toISO(), ends_at: end.toUTC().toISO(), timezone: SCHEDULING_TIMEZONE,
        });
      }
    }
  }
  occurrences.sort((a, b) => a.starts_at.localeCompare(b.starts_at) || a.slot_id.localeCompare(b.slot_id));
  return { timezone: SCHEDULING_TIMEZONE, occurrences };
}, { isolationLevel: "RepeatableRead", timeout: 15000 });

// This helper MUST run in the same interactive transaction as the booking write.
// It never starts or commits a transaction. Future callers must authorize any excluded booking.
const validateBookingAvailability = async (tx, {
  serviceId, slotId, slotVersion, startsAt, entrepreneurId, excludeBookingId,
}) => {
  if (!tx || typeof tx.$queryRaw !== "function" || typeof tx.$transaction === "function") {
    throw new Error("validateBookingAvailability requires a Prisma transaction client");
  }
  const [settings] = await tx.$queryRaw`SELECT current_setting('transaction_isolation') AS isolation`;
  if (settings.isolation !== "read committed") {
    throw new Error("Booking availability requires ReadCommitted isolation");
  }
  const initial = await tx.service.findUnique({ where: { id: serviceId }, select: { entrepreneur_id: true } });
  if (!initial) throw domainError("SERVICE_NOT_FOUND");
  await lockSchedulingRows(tx, initial.entrepreneur_id, serviceId);
  const service = await tx.service.findFirst({
    where: { AND: [{ id: serviceId }, publicVisibility] }, select: schedulingServiceSelect,
  });
  if (!service) throw domainError("SERVICE_NOT_FOUND");
  if (entrepreneurId !== undefined && entrepreneurId !== service.entrepreneur_id) {
    throw domainError("AVAILABILITY_CHANGED");
  }
  const slot = await tx.availabilitySlot.findFirst({
    where: { id: slotId, service_id: serviceId, weekday: { not: null }, is_active: true }, select: slotSelect,
  });
  if (!slot || !Number.isInteger(slotVersion) || slot.version !== slotVersion) throw domainError("AVAILABILITY_CHANGED");
  // Require an unambiguous ISO instant (or a Date), never server-local wall time.
  const start = startsAt instanceof Date
    ? DateTime.fromJSDate(startsAt, { zone: SCHEDULING_TIMEZONE })
    : typeof startsAt === "string" && /(?:Z|[+-][0-9]{2}:[0-9]{2})$/.test(startsAt)
      ? DateTime.fromISO(startsAt, { zone: SCHEDULING_TIMEZONE }) : DateTime.invalid("Missing offset");
  if (!start.isValid) throw domainError("AVAILABILITY_CHANGED");
  const end = start.plus({ minutes: service.duration_minutes });
  const normalizedStart = start.toJSDate();
  const normalizedEnd = end.toJSDate();
  if (excludeBookingId) {
    const excluded = await tx.booking.findFirst({
      where: { id: excludeBookingId, service: { entrepreneur_id: service.entrepreneur_id } }, select: { id: true },
    });
    if (!excluded) throw domainError("AVAILABILITY_CHANGED");
  }
  const bookings = await capacityBookings(tx, service.entrepreneur_id, normalizedStart, normalizedEnd, excludeBookingId);
  if (!isBookableInterval(slot, normalizedStart, normalizedEnd, bookings, new Date())) {
    throw domainError("AVAILABILITY_CHANGED");
  }
  return { service_id: serviceId, slot_id: slotId, starts_at: normalizedStart, ends_at: normalizedEnd };
};

module.exports = { createAvailability, listAvailability, patchAvailability, archiveAvailability,
  getPublicAvailability, validateBookingAvailability };
