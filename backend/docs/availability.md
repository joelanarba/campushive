# Weekly availability - issue #11

## Deployment: migration is prepared, not applied

The original weekly-availability migration adds weekly scheduling to the existing
availability model. A booking HTTP workflow has since been integrated (see below). The implementation did not apply migrations or write database
records. The read-only inventory during planning found zero slots and zero bookings in
the configured database; other environments may contain legacy records.

Back up the target database and deploy during a window where older booking writers are
stopped: new bookings must have starts_at and ends_at after migration. From backend/:

```sh
npm ci
npm run migrate:deploy
npm run prisma:generate
npm run dev
```

On Windows PowerShell, use npm.cmd if npm.ps1 is blocked. Locally Luxon has been installed
and the Prisma client generated, but the new endpoints require the migration before use.
Do not use database reset or db push as a substitute for the committed migration.

Migration: `20260916000000_weekly_availability`. It runs in an explicit transaction,
locks legacy availability/booking tables during backfill, and preserves IDs and foreign
keys. Existing dated slots remain dated historical records; they are not converted into
weekly windows or exposed as new weekly availability.

Schema additions:

- AvailabilitySlot: nullable weekday (ISO 1-7), nullable slot_date, is_active=true,
  version=1. Exactly one of weekday and legacy slot_date must be populated.
- Weekly windows require start_time < end_time, minute precision, end before 24:00,
  and is_booked=false. Existing dated slots retain their is_booked field.
- Booking: required starts_at/ends_at timestamps, indexed for interval searches.
  Backfill interprets the original slot date/start/end in Africa/Accra, not the current
  service duration. Future service edits do not rewrite these interval snapshots.
- SQL-only checks cover slot date/weekday alternatives, weekly window validity,
  positive version, and finite positive booking intervals. Prisma schema validation
  does not execute or verify the migration SQL against a database.

The migration aborts if a legacy booking references a missing/mismatched slot service,
non-finite date, or non-positive interval. Review those exact records and confirm a
correction instead of deleting history or guessing dates. After resolving an aborted
Prisma migration, follow the normal migration recovery process and retry; do not mark
it applied without actually applying the changes.

No availability-overlap exclusion constraint is added: compliant scheduling writers
serialize through row locks. Direct SQL writers can bypass the application protocol.

## Endpoints

| Access | Method | Path | Success |
| --- | --- | --- | --- |
| Entrepreneur | POST | /api/entrepreneurs/me/services/:serviceId/availability | 201 |
| Entrepreneur | GET | /api/entrepreneurs/me/services/:serviceId/availability | 200 |
| Entrepreneur | PATCH | /api/entrepreneurs/me/services/:serviceId/availability/:slotId | 200 |
| Entrepreneur | DELETE | /api/entrepreneurs/me/services/:serviceId/availability/:slotId | 200 |
| Public | GET | /api/services/:serviceId/availability?date_from=2026-09-21&date_to=2026-09-27 | 200 |

Entrepreneur requests require `Authorization: Bearer <access_token>` with the current
entrepreneur role. Admin-only users have no scheduling privileges. Ownership comes
from the authenticated user's profile and is checked in database queries. Missing
profile: 404; multiple profiles: 409; foreign/missing service or weekly slot: 404.
Pending/rejected/suspended providers and owners of inactive services may manage windows.

JSON writes require `Content-Type: application/json`. POST body:

```json
{
  "weekday": 1,
  "start_time": "09:00",
  "end_time": "12:00"
}
```

The only editable fields are weekday (JSON integer 1=Monday through 7=Sunday), start_time,
and end_time (strict HH:mm, 00:00 through 23:59). All are required on create. PATCH accepts
a nonempty subset, for example:

```json
{ "end_time": "13:00" }
```

Omitted values remain unchanged. The service layer validates the merged interval.
Reject end <= start and overnight windows, nulls, blanks, wrong types, extra fields,
ownership/service reassignment, is_booked, is_active, and version. These return 400.

Single-window responses follow this shape:

```json
{
  "message": "Weekly availability created successfully",
  "data": {
    "slot": {
      "id": "<slot UUID>",
      "service_id": "<service UUID>",
      "weekday": 1,
      "start_time": "09:00",
      "end_time": "12:00",
      "is_active": true,
      "version": 1,
      "timezone": "Africa/Accra"
    }
  }
}
```

Owner GET lists active weekly windows only using page=1, limit=20 (maximum 100), the
existing safe-offset validation, and `data.slots` plus `data.pagination` containing
page, limit, total, and total_pages. Sort order is weekday, start_time, then ID.

## Overlaps, edits, and removal

Within a service and weekday, active duplicate/overlapping windows return 409. Adjacent
windows are allowed. Different services may have overlapping weekly windows, but actual
appointments share one capacity across the entrepreneur profile's services.

Intervals are half-open: [start, end). A booking ending at 10:00 does not block a start
at 10:00. Pending and confirmed bookings consume capacity; cancelled/completed do not.
There is no automatic expiration of pending holds.

PATCH checks all linked pending/confirmed bookings whose ends_at is still in the future,
including ongoing appointments. Return 409 if the new weekday, interval containment, or
15-minute start alignment would invalidate any of them. Ended/historical bookings keep
their own stored appointment intervals. Every successful PATCH increments version,
including a request that resubmits the same values.

DELETE returns 409 while such bookings exist. Otherwise it archives the window by
setting is_active=false and incrementing version. It never deletes bookings or the slot.
Repeating DELETE on an already archived owned weekly window returns 200 without another
version increment. PATCH on an archived window returns 404. No restoration endpoint is
provided. To offer new hours, create a new weekly window.

## Public dated availability

This endpoint follows public service discovery's access policy; student authentication
is not required. Both dates are required, must be real YYYY-MM-DD dates, and may cover
at most 31 calendar dates inclusive. Unknown/repeated query fields and invalid/reversed
ranges return 400. Past parts of a valid range simply yield no past appointments.

The service must be active and its provider currently verified. Otherwise return 404,
even when the caller supplies an owner/admin token. For a visible service with no
bookable appointments, return 200 with an empty occurrences array.

Start times advance every 15 minutes from each weekly window's start, not from a global
quarter-hour grid. A window starting 09:10 offers 09:10, 09:25, etc. Each appointment uses
the current service duration and must fit entirely within one window. Adjacent windows
are not merged to fit an appointment spanning both. Starts at/before now are excluded.

Pending/confirmed bookings across all services of the provider block overlapping
appointments on their stored dates only. A booking this Monday does not block the same
weekly window next Monday. Legacy dated bookings also participate through their
backfilled intervals. is_booked never blocks a weekly window.

```json
{
  "message": "Bookable availability retrieved successfully",
  "data": {
    "timezone": "Africa/Accra",
    "occurrences": [
      {
        "service_id": "<service UUID>",
        "slot_id": "<slot UUID>",
        "slot_version": 1,
        "date": "2026-09-21",
        "start_time": "09:00",
        "end_time": "09:30",
        "starts_at": "2026-09-21T09:00:00.000Z",
        "ends_at": "2026-09-21T09:30:00.000Z",
        "timezone": "Africa/Accra"
      }
    ]
  }
}
```

Occurrences sort by starts_at then slot_id. No customer details, booking IDs, or booking
statuses are exposed. Date/time conversion uses Luxon with the explicit IANA timezone,
never the server's local timezone. PostgreSQL TIME values use UTC-anchored Date objects
only for storage/serialization, not as appointment instants. Controllers use no-store.

## Booking integration: current implementation

Booking creation now calls this helper and writes the validated interval in the same
transaction. Status updates use the same profile/service locking protocol and enforce
ownership and transitions. Rescheduling remains unimplemented. See
[integration changes](integration-fixes.md) for current contracts and manual checks.
The helper itself does not reserve anything:

```js
validateBookingAvailability(tx, {
  serviceId,
  slotId,
  slotVersion,
  startsAt,
  entrepreneurId,     // optional expected profile UUID
  excludeBookingId,   // only an existing, already-authorized rescheduling target
});
```

It accepts only a Prisma interactive transaction client, verifies ReadCommitted isolation,
and never starts/commits an independent transaction. startsAt must be a valid Date or ISO
instant with Z/explicit offset. slotVersion must be the integer returned by discovery.
The future controller must validate IDs/input and authenticate/authorize the booking
operation before calling this service helper. Never accept a client isAvailable value.

Reservation write pattern (now used by POST /api/bookings):

```js
const booking = await prisma.$transaction(async (tx) => {
  const interval = await validateBookingAvailability(tx, {
    serviceId, slotId, slotVersion, startsAt,
  });
  return tx.booking.create({
    data: {
      ...interval,
      user_id: authenticatedUserId,
      booking_reference: serverGeneratedReference,
      service_name_snapshot: serverSelectedServiceName,
      status: "pending",
    },
  });
}, { isolationLevel: "ReadCommitted" });
```

The helper locks the entrepreneur-profile row first and service row second, then re-reads
service visibility, provider association, active weekly slot, version, duration, start
grid, future time, containment, and current capacity. It returns only service_id, slot_id,
starts_at, and ends_at. The caller must persist that exact interval before commit and
must not override these validated values with raw client input.

All availability mutations acquire the same locks in the same order. Waiting transactions
re-read committed state after obtaining locks, so two compliant booking writers cannot
both reserve overlapping capacity. Existing service/profile updates naturally conflict
with held row locks; they cannot change eligibility midway through the booking transaction.
Do not perform network work or release the transaction between validation and insertion.

Rescheduling must authorize the target booking and call the helper with excludeBookingId,
then update that booking in the same transaction. The exclusion is limited to a booking
on the same provider; it is not an authorization shortcut. Serialize target-booking updates
under the provider lock. Cross-provider transfers need a separate, consistently ordered
multi-provider locking design and are not implemented here.

Future booking creation, rescheduling, transitions into pending/confirmed, cancellations,
and other capacity changes must use the same provider-first locking protocol. Direct
writes that skip the protocol can bypass these protections. Booking creation after a slot
change/archival or a competing reservation returns AVAILABILITY_CHANGED (409); hidden
services return SERVICE_NOT_FOUND (404). Wrong transaction usage is a programmer error.

## Manual verification checklist

No test files or endpoint tests were created/run. Verification consists of JavaScript
syntax checks, Prisma schema validation/client generation, and diff review. The migration
and concurrency behavior still need manual verification after deployment.

- Register/log in as an entrepreneur; create, list, PATCH, and archive owned windows.
  Verify 201/200 responses and safe fields. Missing token: 401; wrong role: 403.
- Verify missing profile 404, duplicate profiles 409, and cross-owner service/slot 404.
- Reject missing/unknown fields, null, {}, noninteger weekday, bad HH:mm, equal/reversed
  times, overnight intervals, and invalid UUIDs (400). Check partial updates against stored values.
- Duplicate/overlapping same-service windows: 409; adjacent windows: success. Different
  services may offer the same hours. Concurrent overlapping creates should yield one winner.
- Verify listing pagination, deterministic order, and exclusion of legacy/archived slots.
- Verify 31-date limit, leap-day/date validation, reversed ranges, server-timezone independence,
  partially past ranges, current-time boundary, 15-minute starts, and whole-duration fit.
- Pending/rejected/suspended or inactive service: public 404; verified+active with no
  windows: empty 200. Withdraw verification and check the next public request.
- Once a booking write path uses the helper, confirm pending/confirmed reservations
  remove overlapping starts across services while cancelled/completed do not. The same
  weekly slot must remain bookable on other dates and adjacent appointments must work.
- Confirm edits/removal that invalidate ongoing/future active bookings return 409;
  safe expansions succeed, historical interval snapshots remain unchanged, and archival
  preserves records. Check repeated DELETE 200 and archived PATCH 404.
- During future booking integration, race reservations against each other and against
  schedule edits/archival. Check stale versions, rescheduling exclusion, unauthorized
  exclusion attempts, service archival/duration changes, and status-transition locking.
- On a disposable database with legacy rows, manually verify backfill timezone/intervals,
  preserved IDs/history, and migration rejection for mismatched services/invalid intervals.
- Recheck authentication, profile PATCH, service management, categories, and admin inspection.

Implementation references: [Luxon API](https://moment.github.io/luxon/api-docs/index.html)
and [PostgreSQL row locks](https://www.postgresql.org/docs/current/explicit-locking.html).

## Frontend integration

Availability feature methods now use the same { ok, data, error, status } wrapper as
other frontend features; the underlying HTTP methods still return parsed JSON.
Success without a response body is represented as data: null. Existing slot responses
are read from data.data.slots. Loading, empty results, errors with retry, and mutation
success are separate states. Creation/archive refetch the list; pagination falls back
to the last valid page after a removal. Existing ownership/conflict checks are unchanged.
