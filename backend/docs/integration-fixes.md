# CampusHive integration fixes

## Changes and affected files

| Area                  | Change                                                                                                                              | Main files                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Booking authorization | Validated IDs/body, actor ownership, permitted transitions, conditional transactional updates using the shared scheduling locks     | src/validators/bookingValidators.js; src/routes/bookingRoutes.js; src/controllers/bookingController.js; src/controllers/serviceResponses.js; src/services/bookingServices.js; src/services/availabilityServices.js                                                                                                                                                                                                    |
| Availability          | Wrapped feature calls, correct response extraction, loading/error/success states, refetch and pagination                            | frontend/src/services/api.js; frontend/src/pages/dashboard/AvailabilityManager.jsx                                                                                                                                                                                                                                                                                                                                    |
| Incoming bookings     | Existing single-profile resolver replaces invalid unique query; missing/duplicate profiles remain explicit; independent list errors | src/services/bookingServices.js; frontend/src/pages/dashboard/EntrepreneurDashboard.jsx                                                                                                                                                                                                                                                                                                                               |
| Sessions              | Registration refresh session, family logout, shared refresh with one retry, generation guards and failed-logout feedback            | src/routes/authRoutes.js; src/controllers/authController.js; src/services/authServices.js; frontend/src/services/api.js; frontend/src/context/AppContext.jsx; frontend/src/components/Navbar.jsx; frontend/src/components/ProtectedRoute.jsx; frontend/src/pages/public/Login.jsx; frontend/src/pages/public/Register.jsx                                                                                             |
| Dashboard user        | Explicit safe user shape with owned verification details and profile issue codes                                                    | src/services/authServices.js; src/controllers/authController.js; frontend/src/pages/dashboard/EntrepreneurDashboard.jsx; frontend/src/pages/dashboard/StudentDashboard.jsx                                                                                                                                                                                                                                            |
| Pagination/forms      | Bounded service/category/admin/availability/booking navigation, server search, true totals, preserved filters, working form fields  | src/validators/serviceValidators.js; src/services/serviceServices.js; frontend/src/hooks/usePagedList.js; frontend/src/components/Pagination.jsx; frontend/src/components/RequestError.jsx; frontend/src/components/FormField.jsx; frontend/src/pages/public/ServicesSearch.jsx; frontend/src/pages/public/Landing.jsx; frontend/src/pages/dashboard/AdminDashboard.jsx; frontend/src/pages/dashboard/ServiceForm.jsx |
| Booking screen        | Visible availability errors, stale-response protection, clear confirmation and disabled duplicate submission                        | frontend/src/pages/public/ServiceDetails.jsx                                                                                                                                                                                                                                                                                                                                                                          |

Backend paths in the table are relative to backend/. Frontend paths are relative to the repository root.

## Booking API

POST /api/bookings takes exactly service_id, slot_id (UUIDs), slot_version (positive
integer), and starts_at (ISO instant with Z or an explicit offset). The current student
role is required, including multi-role entrepreneur accounts; admin-only accounts cannot
create bookings. Identity comes only
from authentication. Creation preserves the existing visibility, version and capacity
checks; availability conflicts return 409 and unavailable services return 404.

PATCH /api/bookings/:id accepts exactly { "status": "..." }. IDs must be UUIDs.
No acting-user, ownership or service identifiers are accepted in the body.

| Relationship and current role        | Permitted transitions                                              |
| ------------------------------------ | ------------------------------------------------------------------ |
| Booking customer with student role   | pending -> cancelled; confirmed -> cancelled                       |
| Service owner with entrepreneur role | pending -> confirmed; pending -> cancelled; confirmed -> completed |

No same-status updates, terminal-state changes, or reopening. There are no new time
cutoffs. Multi-role accounts use only actions justified by their relationship to the
booking; admins have no special mutation privileges. Provider actions follow the existing
one-profile rule (missing profile 404; duplicate profiles 409).

Updates use ReadCommitted transactions, lock profile then service then booking, re-read
ownership/status, and condition the update on ownership, service and the observed status.
Pending/confirmed reserve capacity; cancelled/completed release it. Booking creation and
availability mutations share the same profile/service locks. Status changes never restore
released capacity. This preserves the user's existing timing rules, including allowing
completion before the scheduled end.

Errors: malformed input 400; unauthenticated 401; impermissible actor action 403;
missing/unrelated booking 404; invalid or stale transition 409. Admin-only accounts receive
403 without looking up booking details. Errors never include unrelated booking data.

GET /api/bookings/me and GET /api/bookings/provider now accept page and limit using the
existing pagination validation (default 1/20, maximum limit 100). Both retain data.bookings
and add data.pagination: { page, limit, total, total_pages }. Ordering is starts_at descending
then id ascending. The provider response also includes data.summary.upcoming, counting
all pending/confirmed bookings whose ends_at is in the future (including ongoing bookings).
Provider queries remain scoped to both the resolved profile and its authenticated owner.
The frontend uses these totals, not the visible page length, for dashboard counts.

## Session and list contracts

See [authentication](authentication.md) for POST /api/auth/logout (204), registration's
refresh cookie, safe user responses, rotation and access-token expiry limitations.
The frontend low-level HTTP methods return JSON (or null for successful empty bodies);
feature methods return { ok, data } or { ok: false, error, status, data }.
Only explicitly protected calls participate in automatic refresh.

See [services](service-management.md) for q/category_tag search and pagination. List pages
use Previous/Next; category options use explicit Load more. Search and active filters stay
in the URL. Mutations refetch the affected page and clamp it to the last valid page when
records disappear. Error states provide retry instead of incorrectly showing an empty list.
The existing schema intentionally remains untouched: one-profile application assumptions
and the one-to-many database relationship are reported, not repaired by deleting records
or adding a unique constraint.

## Manual verification checklist (project owner)

Use disposable development/staging accounts and data. Do not modify live bookings to
prove authorization. No endpoint or browser tests have been performed for this change.

- [ ] Use two students, two providers, a multi-role account and an admin-only account.
      Check own/unrelated/missing booking IDs, invalid UUIDs, extra fields and every allowed
      and rejected transition. Students cannot confirm/complete; providers cannot control
      another provider's bookings; admins receive no implicit access.
- [ ] Race accept/cancel/complete requests and reservation attempts against each other and
      against availability edits/archive. Expect stale/invalid transitions to conflict,
      and no overlap in pending/confirmed capacity. Check terminal states cannot reopen.
- [ ] Availability: load existing slots; create/archive successfully; reject overlapping,
      invalid or booking-conflicting changes. Check errors, retries, empty lists, loading,
      duplicate-submit controls and changing services/pages during a pending request.
- [ ] Provider lists: zero, one and duplicate profiles; own incoming bookings only;
      distinguish an empty successful response from authorization/database/network failure.
- [ ] Registration and login: names and role arrays are correct; registration survives
      reload; pending/rejected/suspended profile details display without changing public
      service visibility. Verify password hashes and token records never appear in JSON.
- [ ] Expire access tokens and trigger several protected requests together: one refresh
      and at most one retry each. Invalid login, 403 and failed refresh/logout must not loop.
      A failed refresh clears identity and protected pages require login.
- [ ] Logout with expired access, during refresh, and during login; reload after success.
      A late response must not restore local identity. Simulate revocation failure: retain
      the cookie, display the failure and allow retry. Check cookie flags/path and rotation
      reuse protection. Separate-tab refresh races may require reauthentication.
- [ ] Use more than 20 services, categories, availability slots, verification requests and
      bookings. Navigate all pages; verify full totals, filter resets, URL/back navigation,
      search matches on later pages, category/provider landing links and end-of-list controls.
- [ ] Mutate the last item on a filtered page and verify fallback to a valid page. Edit a
      service whose category is beyond the first category page: preserve its selection,
      load more options, and verify the service form submits its visible inputs.

## Checks and rollout

Allowed verification is limited to production frontend build, backend syntax checks,
Prisma schema validation, frontend static scope analysis and git diff --check. No test
files, endpoint tests, dependency upgrades, schema changes, migrations, database writes,
resets or deployments are part of this implementation. Runtime, browser, concurrency and
endpoint behavior await the checklist above; static checks do not establish those results.

Deploy the backend first, then the frontend, after manual acceptance. Existing array keys
and the registration sibling profile alias are retained, but old booking clients will
receive the default first page until upgraded. Coordinate the frontend release so users
can reach later pages and use real logout. No new migration or environment variable is
required. Monitor failed refresh/logout requests, profile 404/409 errors, booking conflicts
and list-request failures through existing API/application logs during rollout.

### Checks actually performed (2026-09-18)

- npm.cmd run build --prefix frontend: passed (Vite production build).
- node --check across backend/src JavaScript files: passed; the final booking-route edit was rechecked.
- npm.cmd run prisma:validate --prefix backend: passed.
- Static Babel parsing/scope analysis of 18 changed/new frontend source files: passed, no unresolved identifiers.
- git diff --check: passed.
- No endpoint, browser or concurrency tests were run and no test files were created.

## Booking rollback compatibility fix

The installed Prisma 7.10 client supports nested interactive transactions, so a valid
transaction client exposes $transaction. The availability helper previously rejected
any client with that method, causing POST /api/bookings to roll back before slot validation.
It now rejects root clients using their connection lifecycle methods ($connect/$disconnect)
instead. The ReadCommitted check, profile/service row locks, slot version and capacity
validation remain in place. This was diagnosed from the installed Prisma runtime source;
no booking or endpoint was exercised to reproduce it.

Unexpected server errors now log only an allowlisted error type and code (Prisma P-codes,
BOOKING_TRANSACTION_REQUIRED, BOOKING_ISOLATION_REQUIRED, or UNCLASSIFIED), alongside the
request method/path. Raw messages, stack traces, request bodies and database metadata are
not logged by this handler. Client responses remain generic 500 errors.

After restarting the backend, manually retry a current available slot. Expected result:
201 with data.booking; a stale/taken slot should return 409. Confirm a second conflicting
reservation cannot succeed. Runtime and concurrency verification remains with the owner.
