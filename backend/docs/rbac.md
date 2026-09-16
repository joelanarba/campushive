# Role-based access control - issue #7

## Roles and authorization

Public registration accepts only `student` and `entrepreneur`. Server mapping assigns
`["student"]` or `["student", "entrepreneur"]`, respectively. Public `admin` registration,
`role`, `roles`, and all other unknown fields return 400. Entrepreneur profiles remain
`pending`: having the entrepreneur role does not mean business approval.

`authorizeRoles(...allowedRoles)` follows `authenticate` and permits any explicitly
allowed role from the current database-backed `req.user.role`. Missing authentication
returns 401; missing, malformed, empty, or insufficient roles return 403. An empty or
invalid allowed-role list denies access. JWT role claims and client role inputs do not
authorize requests. `/api/auth/me` remains available to all authenticated accounts.

## Admin user list

`GET /api/admin/users?page=1&limit=20&role=entrepreneur`

Send `Authorization: Bearer <access_token>`. Only current admins may access this route,
including admins who also have student/entrepreneur roles. Without a filter, all account
types are included. Role filtering means array membership, not exact role-array equality.

Query parameters:

- `page`: positive decimal integer, default 1.
- `limit`: positive decimal integer from 1 through 100, default 20.
- `role`: optional `student`, `entrepreneur`, or `admin`.

Unknown/repeated parameters, arrays/objects, zero, negative numbers, fractions, exponent
notation, whitespace, leading zeroes, unsafe integers, and offsets above 2147483647
return 400. Authorization happens before query validation. Missing/invalid tokens return
401; authenticated nonadmins return 403 (`Insufficient permissions`).

Successful responses use `Cache-Control: no-store`:

```json
{
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "<UUID>",
        "full_name": "Example User",
        "email": "user@example.com",
        "role": ["student", "entrepreneur"],
        "is_email_verified": false,
        "created_at": "2026-09-16T00:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1 }
  }
}
```

Only the six illustrated user fields are selected. No account-status field exists;
email verification is returned as stored, not interpreted as active/suspended status.
Password hashes and refresh-token records are never selected. Results sort by creation
date descending and UUID ascending. Count and rows share a RepeatableRead snapshot.
An empty result has total_pages 0; a page beyond the end returns an empty users array.
Separate page requests can reflect intervening database changes.

## Trusted role tools

Run from `backend/`, using the configured DATABASE_URL. On PowerShell systems where
npm.ps1 is blocked, use `npm.cmd` in place of `npm`. Tools do not start the HTTP server
or require JWT signing configuration. Restrict database credentials to trusted operators.

```sh
npm run admin:audit
npm run admin:grant -- --user-id <EXACT-ACCOUNT-UUID>
npm run admin:revoke -- --user-id <EXACT-CONFIRMED-ACCOUNT-UUID>
npm run admin:revoke -- --user-id <EXACT-CONFIRMED-ACCOUNT-UUID> --apply
```

`admin:audit` is read-only and lists admin IDs, names, emails, roles, creation timestamps,
entrepreneur-role/profile indicators, and review-candidate counts. Overlap is a candidate
for investigation, not proof of an incorrect grant. Audit output contains personal data;
keep it in a trusted review channel rather than committing account records.

`admin:grant` is manually invoked, targets a single UUID, fails for an unknown account,
and atomically adds admin while preserving other roles. Repeating it does not duplicate
admin. It creates neither accounts nor credentials. There is no public admin-creation
endpoint or startup promotion. Future trusted creation of a new admin-only account must
assign `["admin"]`; this command promotes existing accounts only.

`admin:revoke` previews current/proposed roles unless `--apply` is explicitly supplied.
Confirm the exact account UUID and legitimate roles with the owner before applying.
Application atomically removes only admin, preserves other roles, and refuses to leave
an account with no roles. If no admin role is present, existing nonempty roles remain
unchanged. No bulk removal is provided. An interrupted/timed-out write has uncertain
outcome; rerun the read-only audit before retrying.

## History and account review

Git history shows registration initially assigned entrepreneurs student + entrepreneur
in `d2f39b8`. Commit `b4368fc` introduced the additional admin role. No role-grant audit
model or existing provisioning mechanism was found. Creation timestamps and role/profile
overlap cannot prove which accounts were affected, deployment timing, or operator intent.
Existing legitimate admins may also be entrepreneurs. No correction IDs are confirmed.

No grant or revoke command was run during implementation. No existing account roles
were changed, and no migrations, database resets, or account deletions were performed.

## Manual verification checklist

No test files or endpoint tests were created/run for this issue. Syntax checks and diff
review are the implementation checks; the following endpoint checks are for manual use.

- Register a student and entrepreneur; verify exact role arrays and pending business profile.
- Attempt account_type admin and submitted role/roles fields; expect 400 and no account creation.
- Check existing registration, login, refresh rotation, and authenticated `/api/auth/me` behavior.
- Call the admin endpoint without a token, with an expired/invalid token, and with student-only
  or student + entrepreneur tokens: expect 401, 401, and 403 respectively.
- With a trusted admin, list all users and each role filter, including other admins.
- Check defaults, limit 1/100, pagination totals, deterministic ordering, and beyond-last-page results.
- Check bad role, repeated query keys, unknown keys, malformed numeric values, and oversized offsets: 400.
- Inspect every returned user for exactly the documented fields and no authentication secrets.
- On a designated disposable account, retain an unexpired student JWT; manually grant admin
  through the trusted command and reuse that JWT: the admin list should now return 200.
  After confirming that same disposable UUID, remove admin with the correction command;
  reuse an unexpired JWT issued while it was an admin: expect 403. `/me` reflects current roles.
- Check provisioning idempotence and preservation of other roles; preview corrections before applying.
  Confirm unknown IDs fail and admin-only revocation is refused.

Architecture remains index -> routes -> controllers -> services, with direct imports,
arrow functions, schema-only validators, and controller-owned request validation.
Business approval, ownership checks, frontend work, deletion, and suspension are outside scope.

### Audit performed during implementation

On 2026-09-16, `npm.cmd run admin:audit` completed successfully against the configured
database and returned 0 admin accounts and 0 review candidates. This describes only
that database at that time, not other environments or previously changed/deleted accounts.
No account-level corrections are indicated by this audit, and no role writes were performed.
