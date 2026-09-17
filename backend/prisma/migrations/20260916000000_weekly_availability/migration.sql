-- Apply manually after backing up the target database. No legacy rows are deleted.
BEGIN;

-- Freeze legacy scheduling data while validating and backfilling its intervals.
LOCK TABLE "availability_slots", "bookings" IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "bookings" b
    LEFT JOIN "availability_slots" s ON s.id = b.slot_id
    WHERE s.id IS NULL OR s.service_id <> b.service_id
      OR s.slot_date IS NULL OR s.end_time <= s.start_time
      OR NOT isfinite(s.slot_date)
  ) THEN
    RAISE EXCEPTION 'Weekly availability migration blocked: audit bookings joined to availability_slots by slot_id; repair missing/mismatched services, non-finite dates, or non-positive legacy intervals before retrying. No booking dates are inferred from current service duration.';
  END IF;
END $$;

ALTER TABLE "availability_slots"
  ALTER COLUMN "slot_date" DROP NOT NULL,
  ADD COLUMN "weekday" INTEGER,
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "availability_slots"
  ADD CONSTRAINT "availability_slots_date_or_weekday_check" CHECK (
    (weekday IS NULL AND slot_date IS NOT NULL) OR
    (weekday IS NOT NULL AND weekday BETWEEN 1 AND 7 AND slot_date IS NULL)
  ),
  ADD CONSTRAINT "availability_slots_weekly_window_check" CHECK (
    weekday IS NULL OR (
      start_time < end_time AND end_time < TIME '24:00:00'
      AND EXTRACT(SECOND FROM start_time) = 0
      AND EXTRACT(SECOND FROM end_time) = 0
      AND is_booked = false
    )
  ),
  ADD CONSTRAINT "availability_slots_version_check" CHECK (version > 0);

ALTER TABLE "bookings"
  ADD COLUMN "starts_at" TIMESTAMPTZ(3),
  ADD COLUMN "ends_at" TIMESTAMPTZ(3);

UPDATE "bookings" b
SET starts_at = (s.slot_date + s.start_time) AT TIME ZONE 'Africa/Accra',
    ends_at = (s.slot_date + s.end_time) AT TIME ZONE 'Africa/Accra'
FROM "availability_slots" s WHERE s.id = b.slot_id;

ALTER TABLE "bookings"
  ALTER COLUMN "starts_at" SET NOT NULL,
  ALTER COLUMN "ends_at" SET NOT NULL,
  ADD CONSTRAINT "bookings_interval_check" CHECK (
    isfinite(starts_at) AND isfinite(ends_at) AND starts_at < ends_at
  );

CREATE INDEX "availability_slots_service_id_weekday_is_active_idx"
  ON "availability_slots" (service_id, weekday, is_active);
CREATE INDEX "bookings_service_id_status_starts_at_ends_at_idx"
  ON "bookings" (service_id, status, starts_at, ends_at);
CREATE INDEX "bookings_slot_id_status_ends_at_idx"
  ON "bookings" (slot_id, status, ends_at);

COMMIT;
