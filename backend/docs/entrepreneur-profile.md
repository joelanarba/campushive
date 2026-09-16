# Entrepreneur profile update - issue #8

## Request

`PATCH /api/entrepreneurs/me`

Send `Authorization: Bearer <access_token>` and `Content-Type: application/json`.
The account must currently have the entrepreneur role. Admin-only and student-only
accounts cannot use this endpoint. Authentication reloads current database roles.

```json
{
  "business_name": "Campus Cuts",
  "description": "Student haircuts available by appointment.",
  "location": "North Campus"
}
```

Only these fields are editable, using the same rules as registration:

| Field         | Validation                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| business_name | Trimmed string, 1-150 characters                                                                                      |
| description   | Trimmed string, 1-2,000 characters                                                                                    |
| location      | Trimmed string, 1-255 characters                                                                                      |
| phone_number  | Trimmed string, at most 50 characters; optional leading +, digits, spaces, parentheses and hyphens; 7-15 digits total |

At least one field is required. Omitted fields retain their stored values. Null,
empty strings, whitespace-only strings, non-object bodies, and unknown fields are
rejected. There are no clearable optional editable fields: all four are nonnullable
and required at registration. IDs, ownership, user fields, roles, verification status,
rejection reason, timestamps, and nested relations cannot be submitted, even unchanged.

## Response and ownership

Successful updates return 200 with `Cache-Control: no-store`:

```json
{
  "message": "Entrepreneur profile updated successfully",
  "data": {
    "entrepreneur_profile": {
      "id": "<profile UUID>",
      "user_id": "<authenticated user UUID>",
      "business_name": "Campus Cuts",
      "description": "Student haircuts available by appointment.",
      "phone_number": "+1 202 555 0100",
      "location": "North Campus",
      "verification_status": "pending",
      "rejection_reason": null,
      "created_at": "2026-09-16T00:00:00.000Z"
    }
  }
}
```

These nine fields are explicitly selected; no user authentication data or related
service records are returned. The profile is located using only the authenticated
user ID, and the update also constrains ownership. No profile is created implicitly.

| Status | Meaning                                                                   |
| ------ | ------------------------------------------------------------------------- |
| 400    | Empty, malformed, unsupported, or invalid update                          |
| 401    | Missing or invalid authentication                                         |
| 403    | Authenticated account lacks entrepreneur role                             |
| 404    | No owned profile exists, or it disappears/changes ownership before update |
| 409    | Multiple profiles belong to the account; none is updated                  |
| 500    | Unexpected failure, handled by the existing error handler                 |

Authentication and authorization precede controller validation. Validated requests
then check profile existence and duplicate profiles. The schema permits multiple
profiles per user; this endpoint refuses ambiguity rather than choosing one.

## Verification and discovery

Edits preserve verification_status and rejection_reason for pending, verified,
rejected, and suspended profiles. No existing edit-triggered re-verification workflow
was found, so none is introduced. Registration still creates pending profiles.

**Discovery gap:** the inspected backend has no public provider discovery endpoint
or verification workflow. Backend exclusion of unverified providers cannot be
confirmed. Frontend filtering would not establish that protection. Implementing
discovery and its verified-only policy remains outside this endpoint's scope.

## Manual checks

No test files or endpoint tests were created or run. Implementation verification
is limited to JavaScript syntax checks and diff review.

- With an entrepreneur token and one profile, update each allowed field alone and
  together. Confirm 200, trimmed values, safe response fields, and unchanged omitted fields.
- Submit {}, null, arrays, empty/whitespace values, wrong types, excessive lengths,
  and invalid phone numbers: expect 400 without a profile change.
- Submit id, user_id, role, verification_status, rejection_reason, created_at, or
  nested relations, alone or with a valid field: expect 400 and no partial write.
- Try missing/invalid tokens (401), student-only/admin-only tokens (403), and a
  mixed-role account containing entrepreneur (allowed).
- Use an entrepreneur with no profile: expect 404 and no implicit creation.
- With multiple owned profiles, expect 409 and neither profile changed.
- With two entrepreneurs, update using the first account's token; confirm the
  second account's profile is unchanged. A submitted second user's ID must fail validation.
- Confirm edits preserve verification status and rejection reason in every existing
  status; edits do not approve, unsuspend, or request re-verification.
- Confirm the existing registration profile creation remains unchanged.

Implementation follows index -> routes -> controllers -> services, with schemas in
entrepreneurValidators.js. No schema migrations or frontend changes are required.
