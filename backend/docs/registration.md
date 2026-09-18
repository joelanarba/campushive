# Registration API

## Setup

From `backend/`, install dependencies, set `DATABASE_URL` and `JWT_ACCESS_SECRET`
in `.env`, then run:

```sh
npm run prisma:generate
npm run migrate:deploy
npm run dev
```

Use a cryptographically random JWT secret of at least 32 bytes. To generate one:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep the generated value in `.env`, outside version control. Startup fails when
the secret is missing. Access tokens default to 900 seconds, configurable with
`JWT_ACCESS_TTL_SECONDS`. See [login and refresh documentation](authentication.md)
for cookie sessions and protected access. Email verification is not yet implemented;
entrepreneur approval remains separate from authentication.

## POST /api/auth/register

Send `Content-Type: application/json`, `credentials: "include"`, and the same origin/CSRF headers as login. Registration sets the HttpOnly refresh cookie and creates its refresh record in the account transaction. Student request:

```json
{
  "account_type": "student",
  "full_name": "Jane Student",
  "email": "jane@example.com",
  "password": "CorrectHorse1!",
  "confirm_password": "CorrectHorse1!"
}
```

Entrepreneur request:

```json
{
  "account_type": "entrepreneur",
  "full_name": "Jane Student",
  "email": "jane@example.com",
  "password": "CorrectHorse1!",
  "confirm_password": "CorrectHorse1!",
  "business_name": "Campus Cuts",
  "description": "Student barber",
  "phone_number": "+1 (234) 567-8901",
  "location": "North campus"
}
```

Entrepreneur fields are required for entrepreneurs and forbidden for students.
Unknown fields, roles, verification flags, and caller-supplied status are rejected.
Names are limited to 150 characters, descriptions to 2,000, locations to 255,
and emails to 254. Text fields are trimmed; emails are also lowercased.
Phone numbers allow an optional leading `+`, digits, spaces, parentheses, and
hyphens, with 7–15 digits and at most 50 total characters.

Passwords need at least eight characters with uppercase, lowercase, a digit,
and a non-whitespace symbol. Passwords are preserved exactly, must match their
confirmation, and must not exceed 72 UTF-8 bytes. They are hashed with bcrypt
cost 12; neither plaintext nor confirmation is stored.

### 201 Created

```json
{
  "message": "Registration successful",
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
    "entrepreneur_profile": null,
    "access_token": "<signed JWT>",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

The nested `data.user.entrepreneur_profile` is canonical; the sibling profile is retained for compatibility. Refresh tokens are never returned in JSON.

Entrepreneurs receive `role: ["student", "entrepreneur"]` and a profile object
containing `id`, `user_id`, the four submitted business fields,
`verification_status: "pending"`, `rejection_reason: null`, and `created_at`.

JWTs use HS256 and contain `sub` (user UUID), `role`, `iat`, `exp`, configured
`iss` and `aud`, and `token_type: "access"`.
A token authenticates an account; it does not grant admin approval. Future
provider-only operations must check the current database verification status.

### Errors

- **400**: `{ "message": "Invalid registration input", "errors": [{ "field": "email", "message": "Field is missing, invalid, or not allowed" }] }`
- **400** for malformed or oversized JSON: `{ "message": "Invalid JSON request body" }`
- **403**: Authentication request origin is not allowed (same cookie-origin protection as login).
- **409**: `{ "message": "An account with this email already exists" }`
- **500**: `{ "message": "An unexpected error occurred" }`

Unknown input keys are reported as `unknown_field`. Submitted values and database
error details are never returned. Email uniqueness is checked before insertion
and enforced by the database to cover simultaneous registrations.

## Backend conventions

The application flow is `index.js -> routes -> controllers -> services`.
`index.js` owns Express setup and mounts the router directly. Each layer imports
its own dependencies; controllers call services and send HTTP responses.

Use feature-purpose filenames such as `authRoutes.js`, `authController.js`,
`authServices.js`, and `authValidators.js`. Use arrow functions for handlers,
services, and helpers. Declare routes directly on an exported router.

Validator modules contain Joi schemas only. The controller imports the schema
and performs validation through its local `validateRegistration` helper before
calling `registerUser` in the service. Services import shared Prisma configuration
directly and return results without handling HTTP responses.

These conventions are the default for future backend features. Endpoint testing
is handled by the project owner; do not add test files unless explicitly requested.
