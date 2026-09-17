# Entrepreneur verification - issue 14

## Endpoints and authentication

All admin endpoints require `Authorization: Bearer <access_token>` and the current
database `admin` role. IDs below are entrepreneur **profile UUIDs**, not user UUIDs.
Mixed-role admins are supported. Account roles are never changed by a decision.

| Method | Path                                               | Behavior                                                             |
| ------ | -------------------------------------------------- | -------------------------------------------------------------------- |
| GET    | `/api/admin/entrepreneurs?page=1&limit=20`         | Pending profiles only, oldest creation date first, then ID ascending |
| GET    | `/api/admin/entrepreneurs/:entrepreneurId`         | One profile in any status                                            |
| PATCH  | `/api/admin/entrepreneurs/:entrepreneurId/approve` | Pending to verified; clear rejection reason                          |
| PATCH  | `/api/admin/entrepreneurs/:entrepreneurId/reject`  | Pending to rejected; store trimmed rejection reason                  |
| PATCH  | `/api/admin/entrepreneurs/:entrepreneurId/suspend` | Verified to suspended                                                |
| PATCH  | `/api/admin/entrepreneurs/:entrepreneurId/reopen`  | Suspended to pending; clear rejection reason                         |

All successful requests return `200`. Pagination defaults to page 1 and limit 20,
with a maximum limit of 100 and the existing signed-32-bit offset bound. Filtering
is by profile status, regardless of the owner's role. Reopening retains the original
creation date; no new submission timestamp is introduced.

Approve, suspend, and reopen accept no body or `{}`. Reject requires JSON:

```json
{
  "rejection_reason": "Please provide a complete business description."
}
```

Reasons must be strings of 1-2,000 characters after trimming. Missing, null,
empty, whitespace-only, non-string, and oversized reasons return `400`.
Other body fields are rejected, including verification status, reviewer identity,
ownership fields, and roles. Only page/limit are accepted as list query fields;
detail and action endpoints accept no query fields. GET bodies may be absent or empty.

Example approval response (detail and other actions return the same profile shape
with their respective message, status, and reason):

```json
{
  "message": "Entrepreneur approved successfully",
  "data": {
    "entrepreneur_profile": {
      "id": "11111111-1111-4111-8111-111111111111",
      "user_id": "22222222-2222-4222-8222-222222222222",
      "business_name": "Campus Repairs",
      "description": "Laptop repairs on campus",
      "phone_number": "0551234567",
      "location": "Campus centre",
      "created_at": "2026-09-17T09:00:00.000Z",
      "verification_status": "verified",
      "rejection_reason": null,
      "user": {
        "id": "22222222-2222-4222-8222-222222222222",
        "full_name": "Example Owner",
        "email": "owner@example.com"
      }
    }
  }
}
```

List entries have the same profile shape. An empty queue returns:

```json
{
  "message": "Pending entrepreneurs retrieved successfully",
  "data": {
    "entrepreneurs": [],
    "pagination": { "page": 1, "limit": 20, "total": 0, "total_pages": 0 }
  }
}
```

## Owner feedback and frontend integration

`GET /api/auth/me` requires the owner's access token. It now returns safe account
fields plus the current profile under `data.user.entrepreneur_profile`:

```json
{
  "message": "Authenticated user",
  "data": {
    "user": {
      "id": "22222222-2222-4222-8222-222222222222",
      "full_name": "Example Owner",
      "email": "owner@example.com",
      "role": ["student", "entrepreneur"],
      "is_email_verified": false,
      "created_at": "2026-09-17T09:00:00.000Z",
      "entrepreneur_profile": {
        "id": "11111111-1111-4111-8111-111111111111",
        "user_id": "22222222-2222-4222-8222-222222222222",
        "business_name": "Campus Repairs",
        "description": "Laptop repairs on campus",
        "phone_number": "0551234567",
        "location": "Campus centre",
        "created_at": "2026-09-17T09:00:00.000Z",
        "verification_status": "rejected",
        "rejection_reason": "Please provide a complete business description."
      }
    }
  }
}
```

The profile is `null` when absent. Multiple profiles return `409`, matching the
existing profile-management safeguards. Middleware retains its lightweight ID/role
lookup; the richer query runs only for `/auth/me`. Registration, login, and refresh
response shapes are unchanged. Fetch `/auth/me` for current dashboard feedback.

Rejection reasons are available only to the owner and authorized admins. Public
service and availability responses do not expose them. Account password hashes and
tokens are never included in these new responses.

No frontend screens were added. Refetch `/auth/me` after a review and refetch public
catalogue data to update already-open screens: the frontend currently retains a
catalogue snapshot. Admin review, `/auth/me`, and public discovery responses use
`Cache-Control: no-store`; there is no server-side visibility cache to invalidate.

## Visibility and booking behavior

Existing public checks read the current profile status from the database. Approval
makes active, otherwise eligible services discoverable and bookable. Inactive
services stay inactive and hidden. Pending, rejected, and suspended providers are
excluded from discovery, direct service details, and public availability.

Suspension preserves bookings and service settings. Entrepreneurs can still edit
their profiles, services, and availability subject to existing ownership and
scheduling constraints. Reopening alone does not restore public visibility or
permission to confirm/complete bookings; approval is required.

`PATCH /api/bookings/:id` requires authentication, a booking UUID, and only:

```json
{ "status": "confirmed" }
```

Allowed values and transitions:

| Requested status | Current booking status | Authorized actor                                                        |
| ---------------- | ---------------------- | ----------------------------------------------------------------------- |
| confirmed        | pending                | Owning entrepreneur with current entrepreneur role and verified profile |
| completed        | confirmed              | Owning entrepreneur with current entrepreneur role and verified profile |
| cancelled        | pending or confirmed   | Booking customer or owning entrepreneur with current entrepreneur role  |

Success retains `{ "message": "Booking updated", "data": { "booking": ... } }`.
The student's own booking relationship permits cancellation; an admin role alone
does not authorize changes to someone else's booking. Cancelled and completed
bookings cannot be transitioned again. Unrelated callers receive `404`.

Admin decisions use a conditional update of profile ID plus required status in a
ReadCommitted transaction. Status and rejection reason are written together, and
the response is read before releasing the update lock. Competing reviews of a
pending profile produce one success and one `409`.

Booking updates lock the profile row before the booking row, then re-read current
verification, actor role, ownership, and booking state. The profile lock coordinates
with suspension updates and the existing booking-creation lock. If a booking write
wins the lock, it may finish before suspension; if suspension wins, subsequent
confirmation/completion is blocked. Suspension does not undo a previously committed
booking write. Cancellation remains available while suspended or awaiting review.

## Expected errors

| Status | Cases                                                                                                                             |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 400    | Invalid UUID, pagination, request fields, rejection reason, or booking-status value                                               |
| 401    | Missing, invalid, or expired access token                                                                                         |
| 403    | Non-admin on admin endpoints; customer attempting confirmation/completion; owning provider attempting delivery while not verified |
| 404    | Unknown entrepreneur profile; unknown or unrelated booking; hidden public service detail/availability                             |
| 409    | Wrong profile state or repeated decision; invalid booking transition; duplicate owner profiles                                    |

Errors retain the existing `{ "message": "..." }` envelope; validation errors also
include the existing field-error array. Permission/verification checks precede
booking-transition checks. Public discovery returns an empty list when nothing is
eligible. The existing booking-creation controller maps hidden-service or changed
availability failures to `400` with its unavailable-slot message; this is unchanged.
`GET /api/bookings/provider` now uses the existing profile resolver: absent profile
returns `404`, duplicate profiles return `409`, and a valid profile with no bookings
returns an empty list.

## Manual verification checklist

Use disposable accounts/data. No endpoint tests or account decisions were run as
part of implementation.

- Exercise each admin endpoint without a token, with an invalid token, with student/
  entrepreneur tokens, and with admin/mixed-role admin tokens: expect 401, 401, 403,
  and success. Revoke an admin role and verify the old access token no longer grants access.
- Check default and bounded pagination, tied creation timestamps, empty queues,
  out-of-range pages, and unknown query/body fields. Confirm only pending profiles
  appear, including profiles whose owner's roles differ. Detail must support all statuses.
- Check unknown UUIDs (404), malformed UUIDs (400), and safe owner/profile fields.
  Confirm passwords, tokens, and unrelated private account fields are excluded.
- Approve pending profiles; confirm verified status, null rejection reason, and
  unchanged roles and service flags. Reject with padded text; confirm trimming and
  atomic storage. Exercise missing/empty/whitespace/null/non-string/oversized reasons.
- Repeat decisions and attempt every disallowed transition: expect 409. Race approve
  against reject for the same pending profile: one 200, one 409, consistent final data.
- Verify approved active services appear in public lists, filtered lists, details,
  availability, and new booking creation. Inactive services remain hidden.
- Suspend a verified provider with pending and confirmed bookings. Verify public
  exclusion, unavailable new bookings, and 403 on confirmation/completion. Verify
  existing bookings are preserved and cancellation still works.
- Reopen suspension: status becomes pending, feedback is cleared, and delivery stays
  blocked. Approve to restore eligibility, or reject to retain exclusion with feedback.
  Attempt suspension from pending/rejected/suspended and reopening from other states: 409.
- Race suspension with booking creation/confirmation/completion; verify ordering
  follows the profile lock. Race cancellation with completion; only a valid serialized
  transition may succeed, and terminal bookings cannot be reopened.
- Check unrelated users/admin-only accounts cannot change bookings, customers cannot
  confirm/complete, and providers who lost their entrepreneur role cannot act as owners.
- Fetch `/auth/me` as the owner after each decision. Check null profiles and duplicate
  profiles; inspect public responses to ensure no rejection reason leaks.
- Verify profile edits preserve each verification status and reason. Verify service
  and availability management continues while pending/suspended. Check provider booking
  lists for normal, missing, and duplicate profiles.

## Changed files and implementation checks

- `src/routes/adminRoutes.js`: six explicit admin routes.
- `src/controllers/adminController.js`: input validation and review responses.
- `src/services/adminServices.js`: safe list/detail queries and atomic transitions.
- `src/validators/adminValidators.js`: UUID, empty-request, rejection schemas.
- `src/services/authServices.js`, `src/controllers/authController.js`: owner feedback.
- `src/services/bookingServices.js`, `src/controllers/bookingController.js`,
  `src/validators/bookingValidators.js`: ownership, state, and verification enforcement.
- `src/controllers/serviceResponses.js`: verification/booking error mappings.
- `docs/entrepreneur-verification.md`: endpoint examples and manual verification guide.

Validation consists of JavaScript syntax checks and diff review. No test files were
created, no endpoint tests were run, and database/concurrency behavior still requires
the manual checks above. No migrations, seed changes, reviewer metadata, audit-log
infrastructure, frontend changes, or rejected-profile resubmission were introduced.
