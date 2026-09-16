# Service management - issue #9

## Endpoints

Use the existing API host (default `http://localhost:5000`). Protected requests need
`Authorization: Bearer <access_token>`. JSON writes need `Content-Type: application/json`.

| Access       | Method | Path                                      | Success       |
| ------------ | ------ | ----------------------------------------- | ------------- |
| Entrepreneur | POST   | /api/entrepreneurs/me/services            | 201           |
| Entrepreneur | GET    | /api/entrepreneurs/me/services            | 200           |
| Entrepreneur | GET    | /api/entrepreneurs/me/services/:serviceId | 200           |
| Entrepreneur | PATCH  | /api/entrepreneurs/me/services/:serviceId | 200           |
| Entrepreneur | DELETE | /api/entrepreneurs/me/services/:serviceId | 200 (archive) |
| Public       | GET    | /api/services                             | 200           |
| Public       | GET    | /api/services/:serviceId                  | 200           |
| Public       | GET    | /api/categories                           | 200           |
| Admin        | GET    | /api/admin/services                       | 200           |
| Admin        | GET    | /api/admin/services/:serviceId            | 200           |
| Admin        | GET    | /api/admin/categories                     | 200           |
| Admin        | GET    | /api/admin/categories/:categoryId         | 200           |
| Admin        | POST   | /api/admin/categories                     | 201           |
| Admin        | PATCH  | /api/admin/categories/:categoryId         | 200           |
| Admin        | DELETE | /api/admin/categories/:categoryId         | 200           |

Admin-only accounts cannot use entrepreneur management endpoints. Accounts with both
roles can manage only their own services through those endpoints. Admin service oversight
is read-only; category CRUD is admin-only.

## Service input and examples

Create a category as an admin first, or obtain its UUID from GET /api/categories:

```json
{
  "category_name": "Hair and grooming",
  "tag": "hair",
  "description": "Haircuts, styling, and grooming services."
}
```

Create a service as an entrepreneur:

```json
{
  "title": "Student haircut",
  "description": "A haircut by appointment on campus.",
  "category_id": "<existing category UUID>",
  "location_type": "provider_location",
  "price": "25.00",
  "duration_minutes": 30,
  "is_active": true
}
```

| Field            | Rule                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| title            | Required trimmed string, 1-150 characters                                                            |
| description      | Required trimmed string, 1-2,000 characters                                                          |
| category_id      | Required existing category UUID                                                                      |
| location_type    | Required: online, provider_location, or customer_location                                            |
| price            | Required JSON number or plain decimal string, 0 through 9999999999.99, at most two fractional digits |
| duration_minutes | Required JSON integer, 1 through 2147483647                                                          |
| is_active        | Optional JSON boolean; defaults to true on creation only                                             |

Prices are converted through Prisma Decimal and returned as strings with exactly two
decimal places. Free services are supported. Decimal strings cannot contain whitespace,
signs, exponent notation, or leading zeroes other than zero itself. JSON numeric values
are validated after JSON parsing; use strings to preserve the exact decimal input.
Invalid precision is rejected rather than rounded.

PATCH accepts any nonempty subset of these same fields and does not apply creation
defaults. Example:

```json
{ "price": "30.50", "duration_minutes": 45 }
```

Omitted fields remain unchanged. Null, blank strings, unknown fields, invalid types,
and empty updates return 400. All editable values are nonnullable. Owner IDs, profile
IDs, timestamps, verification fields, roles, and nested relation writes are rejected.
Service ownership is resolved only through the authenticated user's profile.

A missing profile returns 404; multiple profiles return 409. Pending, rejected, and
suspended providers may manage their own services. Ownership is included in database
queries for reads and writes; foreign service IDs return the same 404 as missing IDs.

## Archive and category rules

DELETE on an owned service sets is_active=false; it does not remove the service,
availability slots, or bookings. The response contains the archived service. Repeating
DELETE succeeds for an existing owned inactive service. To reactivate:

```json
{ "is_active": true }
```

Reactivation alone does not make an unverified provider publicly visible. Owners and
admins continue to see archived services. Historical records are not rewritten by
service edits, category edits, or archival.

Category creation requires category_name (1-150), tag (1-50), and description (1-2,000),
all trimmed strings. Category PATCH accepts a nonempty subset, for example:

```json
{ "description": "Campus haircuts and styling." }
```

All existing categories are selectable; the schema has no availability flag. Category
names and tags are not unique in the schema, and no new uniqueness rule is introduced.
Entrepreneurs cannot create categories by name. Invalid category references return 400.

Category DELETE removes an unused category and returns data.category.id. Referenced
categories return 409, even when every referencing service is archived. PostgreSQL's
existing RESTRICT foreign key also protects against concurrent reference creation.
No automatic reassignment, cascading deletion, or schema migration is performed.

## Public visibility and safe responses

Public lists and exact-ID lookups always require both is_active=true and the related
profile's current verification_status=verified. Pending, rejected, suspended, and inactive
services are hidden. Hidden detail requests return 404, even with an authenticated owner
or admin token; use the corresponding protected endpoint to inspect them.

The same mandatory filter applies when filtering by category or provider. Verification
withdrawal takes effect on the next request without a service edit. New controllers send
Cache-Control: no-store. No verification-management endpoint or text-search endpoint is
introduced in this issue.

Responses follow `{ message, data }`. Single-service responses use data.service;
category responses use data.category. Service fields selected are id, title, description,
entrepreneur_id, category_id, is_active, location_type, price, duration_minutes, created_at,
updated_at, and category (id, category_name, tag, description, created_at).

Public service responses additionally include entrepreneur with id, business_name, and
location. Admin responses additionally include entrepreneur.verification_status and
entrepreneur.user with id, full_name, and email. Public responses never include owner
email, rejection reasons, authentication secrets, or booking records.

## Lists and filters

Every list endpoint accepts page (default 1) and limit (default 20, maximum 100).
Both must be positive decimal integers; unsafe values and offsets over 2147483647 fail.
Reject unknown/repeated parameters, arrays/objects, invalid UUIDs, and invalid enums.
Boolean query filters accept only the exact strings true and false.

| List            | Additional filters                                           |
| --------------- | ------------------------------------------------------------ |
| Public services | category_id, entrepreneur_id                                 |
| Owner services  | category_id, is_active                                       |
| Admin services  | category_id, entrepreneur_id, is_active, verification_status |
| Categories      | None                                                         |

entrepreneur_id means the profile UUID, not the user UUID. verification_status accepts
pending, verified, rejected, or suspended. A valid but nonexistent filter UUID returns
an empty list. Unknown query parameters, including attempts to set public is_active or
verification_status, return 400 rather than overriding the visibility rules.

Example: GET /api/admin/services?page=1&limit=20&verification_status=pending&is_active=true

Lists return data.services or data.categories plus data.pagination:

```json
{ "page": 1, "limit": 20, "total": 42, "total_pages": 3 }
```

Services sort by created_at descending then id ascending. Categories sort by category_name
ascending then id ascending. Count and rows share a RepeatableRead transaction. Empty
results have total_pages=0; pages beyond the end contain an empty array. Different page
requests can reflect intervening database changes.

## Manual checks and errors

No test files or endpoint tests were created or run. JavaScript syntax and diff checks
are the implementation checks. Use these scenarios for manual endpoint testing:

- Create valid services with and without is_active; verify 201, owner assignment,
  default active state, exact two-decimal price, and safe fields.
- Try free services and maximum prices; reject negative, excessive precision/size,
  invalid enums, numeric-string durations, nonboolean activity, missing required fields,
  unknown/ownership fields, and malformed UUIDs (400).
- PATCH one field and confirm all omitted values stay unchanged. Reject {}, null,
  blank strings, unsupported fields, and unknown category references (400).
- Use two entrepreneur accounts: foreign reads, edits, and archives must return 404
  and leave records unchanged. Check missing profiles (404) and duplicate profiles (409).
- Missing/invalid token returns 401; incorrect role returns 403. Admin-only users cannot
  manage services, while admins can inspect hidden services and safe owner information.
- Verify active+verified services appear publicly in list, filtered list, and detail.
  For all other verification statuses and inactive services, expect exclusion and 404
  on public detail. Check visibility immediately after an externally managed status change.
- Archive a service with bookings and slots: verify 200, unchanged related records,
  disappearance from public discovery, and continued owner/admin visibility.
  Repeat archival, then reactivate through PATCH and recheck verification-dependent visibility.
- Exercise admin category create/list/detail/PATCH/delete. Nonadmins receive 403.
  Delete a referenced category (409); delete an unused category (200); missing category (404).
- Verify defaults, page boundaries, maximum limit, sort order, metadata, and invalid or
  repeated query parameters (400). Compare owner/public/admin filters for hidden-data leaks.
- Recheck registration, login, refresh, /api/auth/me, admin user listing, and profile PATCH.
  Profile edits must still preserve verification metadata and reject duplicate profiles.

Unexpected failures use the existing shared 500 handler. Expected service/category
conflicts are handled in controllers and do not use its email-specific 409 response.
This issue does not seed categories, change account roles, modify verification statuses,
run migrations, or implement frontend or booking operations.
