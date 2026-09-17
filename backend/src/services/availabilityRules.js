const { DateTime } = require("luxon");
const { SCHEDULING_TIMEZONE, START_STEP_MINUTES } = require("../config/availabilityConfig");

// Prisma represents PostgreSQL TIME as a UTC-anchored Date, not a local instant.
const timeText = (value) => value.toISOString().slice(11, 16);
const databaseTime = (value) => new Date(`1970-01-01T${value}:00.000Z`);
const minuteOfDay = (value) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
const localDateTime = (date, time) => DateTime.fromISO(`${date}T${time}`, { zone: SCHEDULING_TIMEZONE });
const overlaps = (start, end, otherStart, otherEnd) => start < otherEnd && end > otherStart;
const fitsWeeklyWindow = (slot, startsAt, endsAt) => {
  const start = DateTime.fromJSDate(startsAt, { zone: SCHEDULING_TIMEZONE });
  const end = DateTime.fromJSDate(endsAt, { zone: SCHEDULING_TIMEZONE });
  if (!start.isValid || !end.isValid || startsAt >= endsAt || start.weekday !== slot.weekday ||
      start.toISODate() !== end.toISODate() || start.second !== 0 || start.millisecond !== 0) return false;
  const lower = localDateTime(start.toISODate(), timeText(slot.start_time));
  const upper = localDateTime(start.toISODate(), timeText(slot.end_time));
  const offset = start.hour * 60 + start.minute - minuteOfDay(timeText(slot.start_time));
  return start >= lower && end <= upper && offset % START_STEP_MINUTES === 0;
};
const conflictsWithBookings = (bookings, start, end) => bookings.some((booking) =>
  overlaps(start, end, booking.starts_at, booking.ends_at));
const isBookableInterval = (slot, start, end, bookings, now) =>
  start > now && fitsWeeklyWindow(slot, start, end) && !conflictsWithBookings(bookings, start, end);

module.exports = { timeText, databaseTime, localDateTime, fitsWeeklyWindow,
  conflictsWithBookings, isBookableInterval };
