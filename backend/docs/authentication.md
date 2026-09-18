# Login, logout and JWT authentication — issue #6

> Integration update: registration now creates a refresh session, logout revokes the current family, and all session responses include the safe dashboard user. See [integration changes and manual checks](integration-fixes.md). No new migration is needed for these fixes.

## Setup and migration

From `backend/`, apply the committed additive migration and regenerate the client:

```sh
npm run migrate:deploy
npm run prisma:generate
npm run dev
```

The migration adds `refresh_tokens` only, with a UUID primary key and user foreign
key, SHA-256 token hash, family UUID, expiration, consumed/revoked timestamps, and
creation timestamp. Existing tables are not reset. Deleting a user cascades to
their refresh tokens. Keep consumed records for replay detection; no automatic
cleanup is provided in this issue.

Environment variables (also documented in `.env.example`):

| Variable                          | Default / requirement                                          |
| --------------------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`                    | Existing PostgreSQL connection                                 |
| `JWT_ACCESS_SECRET`               | Required, no fallback; keep the existing random secret         |
| `JWT_ACCESS_TTL_SECONDS`          | `900` (15 minutes)                                             |
| `JWT_ISSUER`                      | `campushive-api`                                               |
| `JWT_AUDIENCE`                    | `campushive-client`                                            |
| `REFRESH_TOKEN_TTL_SECONDS`       | `604800` (7 days from each issuance)                           |
| `AUTH_COOKIE_SAME_SITE`           | `lax`; supports `none` for cross-site HTTPS                    |
| `CLIENT_URL`                      | `http://localhost:5173`; comma-separated exact origins allowed |
| `NODE_ENV`                        | Set to `production` for Secure cookies                         |
| `LOGIN_RATE_LIMIT_MAX`            | `10` login requests per IP per window                          |
| `LOGIN_RATE_LIMIT_WINDOW_SECONDS` | `900`                                                          |

The in-memory login limiter is per process and resets on restart. Before running
multiple API instances, use a shared rate-limit store. Behind a reverse proxy,
configure Express trust proxy for the actual trusted proxy topology; do not blindly
trust arbitrary forwarded IP headers.

## Manual endpoint requests

### POST /api/auth/login

Send `Content-Type: application/json`:

```json
{ "email": "jane@example.com", "password": "CorrectHorse1!" }
```

Email is trimmed and lowercased. Passwords are not modified. No role selection is
accepted. Login validates presence and bcrypt's 72-byte limit without reapplying
registration complexity rules. Unknown fields are rejected.

**200 response**:

```json
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": "f0915c73-41c2-4b62-a76b-62f14f893fec",
      "full_name": "Jane Student",
      "email": "jane@example.com",
      "role": ["student"],
      "is_email_verified": false,
      "created_at": "2026-09-15T12:00:00.000Z",
      "entrepreneur_profile": null,
      "entrepreneur_profile_issue": null
    },
    "access_token": "<JWT>",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

The response sets `campushive_refresh` as a host-only HttpOnly cookie with
`Path=/api/auth`, a seven-day default Max-Age, and SameSite=Lax. It is Secure in
production. The raw refresh token is never returned in JSON or stored in the
database. Keep your HTTP client's cookie jar enabled.

- Invalid email/password fields: **400**, `Invalid login input` plus field errors.
- Unknown email or incorrect password: **401**, `Invalid email or password`.
- Exceeded login limit: **429**, `Too many login attempts. Please try again later.`
- Unexpected failures: **500**, `An unexpected error occurred`.

### POST /api/auth/refresh

Send the stored cookie. No request body or Authorization header is required;
refresh works after the access token expires.

**200** returns the same `data` shape as login with `message: "Token refreshed"`
and replaces the refresh cookie. Its lifetime restarts on rotation.

Missing, malformed, unknown, expired, revoked, or consumed tokens return **401**:

```json
{ "message": "Invalid or expired refresh token" }
```

The invalid cookie is cleared with matching path/security/SameSite options.
Consumed-token reuse revokes the entire family. Family-level PostgreSQL advisory
locks serialize rotations, and consumption/replacement are committed atomically.
Two simultaneous uses of one token cannot both succeed: the loser detects reuse
and revokes the family, including the winner's replacement. Clients must serialize
refresh calls and log in again after reuse; do not retry an old refresh token.

### POST /api/auth/logout

Send the stored refresh cookie and the same origin/CSRF headers as refresh. An access
token is not required. The service hashes the token, obtains the same family advisory
lock used by rotation, and revokes all unrevoked records in the family, including
replacement tokens and families identified by a consumed/expired cookie.

**204** clears the host-only cookie with matching path, Secure and SameSite options.
Missing, malformed or unknown cookies also return 204 and clear the cookie. On a
revocation/database failure, return 500 and retain the cookie for a retry. The UI clears
local identity immediately but reports a failed server logout and offers retry.
Other independent login sessions are not revoked. Previously issued access JWTs remain
valid until expiry; these changes do not introduce an access-token denylist.

### GET /api/auth/me

Send `Authorization: Bearer <access_token>`.

```json
{
  "message": "Authenticated user",
  "data": { "user": { "id": "<user UUID>", "full_name": "Jane Student", "email": "jane@example.com", "role": ["student"], "is_email_verified": false, "created_at": "2026-09-15T12:00:00.000Z", "entrepreneur_profile": null, "entrepreneur_profile_issue": null } }
}
```

Missing, malformed, expired, wrong-signature, wrong-issuer/audience, wrong-algorithm,
or non-access tokens return **401** with `Invalid or missing access token`.
The middleware looks up the account via the service layer and attaches only the
current UUID and roles to `req.user`. A deleted user is rejected. There are no
inactive/deleted flags in the current User schema. Email verification and business
approval do not restrict account authentication; role authorization is issue #7.

## Cookies, CORS, and CSRF

Use `credentials: "include"` in browser registration, login, refresh and logout requests. For local
same-site use, keep `AUTH_COOKIE_SAME_SITE=lax`. Requests with an Origin header
must match an explicit `CLIENT_URL` entry; cross-site fetches are rejected in lax
mode. Requests from nonbrowser clients without Origin are allowed in lax mode.

For a cross-site frontend/API deployment, set `AUTH_COOKIE_SAME_SITE=none` and
use HTTPS. Secure cookies are forced. Configure exact frontend origins in
`CLIENT_URL` and send `X-CSRF-Protection: 1` on registration, login, refresh and logout. Both an allowed
Origin and this custom header are required; CORS preflight prevents unauthorized
sites from supplying the header. Rejected origins/CSRF checks return **403** with
`Authentication request origin is not allowed`. Wildcard origins are rejected at
startup. Browser third-party cookie restrictions may still prevent cross-site cookies.

## Token compatibility and application flow

Access tokens are signed/verified with HS256, issuer, audience, expiration, UUID
subject, and `token_type: "access"`. Roles are included, but protected requests use
the current roles from PostgreSQL. Opaque refresh tokens cannot authenticate as JWTs.

Previously issued access tokens from this implementation remain valid until expiry
after refresh-family revocation: middleware checks account existence, not session
revocation. Tokens created by the earlier registration implementation lack issuer,
audience, and token type and are rejected by the new verifier. Log in to obtain a
new token. New registration tokens use the same signing configuration as login;
registration now sets the same refresh cookie as login and creates the account and
initial refresh record atomically. The existing sibling `data.entrepreneur_profile`
remains as a compatibility alias; use `data.user.entrepreneur_profile` going forward.

Flow remains `index.js -> authRoutes.js -> authController.js -> authServices.js`.
Controllers validate Joi schemas and send responses; services use the shared Prisma
client. `authMiddleware.js` handles access authentication, login throttling, and
cookie-origin protection; `tokenServices.js` handles token signing/verification and
opaque token creation. There are no factory routes or new app entry files.

No endpoint tests or test files were run/created. For manual checks, try both account
types, wrong credentials, refresh-cookie rotation/reuse, missing and expired tokens,
protected access, and login throttling. Existing registration remains public.

Implementation references: [jsonwebtoken verification options](https://github.com/auth0/node-jsonwebtoken)
and [express-rate-limit configuration](https://express-rate-limit.mintlify.app/reference/configuration).

## Frontend session coordination

Startup restoration and protected-request 401 handling share one refresh promise per
application instance, including React StrictMode remount effects. A protected request
retries at most once; a late 401 reuses an already replaced access token. Public calls,
403 responses and login/register/refresh/logout failures do not trigger refresh.
A failed refresh clears identity; protected routes return to login.

Login, refresh and user responses carry a local generation guard. Logout increments
that generation, blocks refresh, clears identity, waits for any cookie-writing login
or refresh response, and then revokes the current cookie session. No token is placed
in browser persistent storage. Coordination is within an application instance; separate
browser tabs can still race refresh rotation and must reauthenticate if reuse protection
revokes their family. Cross-site cookie support remains subject to browser settings.

The safe user object is shared by registration, login, refresh and /me. A single owned
profile includes business fields, verification status and rejection reason. Missing
profiles return null; entrepreneur accounts receive PROFILE_NOT_FOUND or MULTIPLE_PROFILES
in entrepreneur_profile_issue for missing or duplicate profiles. Student actions remain
available, while provider operations retain their explicit 404/409 profile checks.
