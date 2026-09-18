# Admin category management

The frontend route is `/dashboard/admin/categories`. The existing admin dashboard
links to it through shared navigation; entrepreneur verification remains at
`/dashboard/admin`. Both routes use the existing admin role and session-restoration
guard. Backend authorization still applies to every mutation.

## API contracts

Paths below include the configured API base path; feature methods use the existing
base URL, authentication, and access-token refresh helper.

| Frontend method | HTTP endpoint | Successful body |
| --- | --- | --- |
| `listCategories({ page, limit })` | `GET /api/categories` | `data.categories`, `data.pagination` |
| `createCategory(body)` | `POST /api/admin/categories` | 201, `data.category` |
| `updateCategory(id, body)` | `PATCH /api/admin/categories/:id` | 200, `data.category` |
| `deleteCategory(id)` | `DELETE /api/admin/categories/:id` | 200, `data.category.id` |

The public and admin lists share the same backend service and fields, so the
screen reuses the public listing method with 20 records per page. The admin list
has its own request state rather than filtering the shared options cache.

Feature methods retain the existing wrapper: success has `ok: true` and the JSON
envelope in `data`; failures carry `ok: false`, `error`, `status`, and backend
details in `data`. Successful empty responses produce `data: null`. Deletion uses
the selected category ID and does not require a response body. Validation details
are mapped to known fields while general errors retain the backend message.

Forms send trimmed `category_name`, `tag`, and `description`. All are required,
with maximum lengths of 150, 50, and 2,000 respectively. Editing sends these three
fields using PATCH. Current backend rules allow duplicate names/tags and impose
no slug format; the frontend does not add such restrictions. Referenced-category
deletion returns 409 and remains blocked. A 404 refreshes the list and removes the
known missing option without attempting another mutation.

## Shared options and feedback

`AppContext` owns category options through `useCategoryOptions`. Successful
mutations invalidate older requests, merge updated records or remove deleted IDs,
and restart option loading at page one. Created/updated records remain supplemental
options until their page is fetched. Known records are retained separately for
valid selections; absence from a partial page is not evidence of deletion.

Service forms use updated labels and explicitly clear confirmed deleted selections.
Discovery uses category IDs for new selections, preserves legacy tag URLs, and
offers a clear-filter action when a legacy tag was affected. Duplicate tags remain
group filters. Other search/provider parameters are preserved. Cache refresh
failures have separate retry feedback and do not undo successful CRUD feedback.
Cross-tab synchronization is not included.

Shared `useSessionMutation` prevents duplicate writes and ignores results after
navigation/session changes. The existing booking hook delegates to it while
preserving its previous behavior. Modal focus handling recognizes controls disabled
by a parent fieldset.

## Files affected

- `src/App.jsx`, `src/components/AdminNavigation.jsx`, and
  `src/pages/dashboard/AdminDashboard.jsx`: protected route and navigation.
- `src/pages/dashboard/AdminCategories.jsx`: list, forms, deletion confirmation,
  validation, feedback, and pagination.
- `src/services/api.js`: authenticated category CRUD methods.
- `src/context/AppContext.jsx` and `src/hooks/useCategoryOptions.js`: shared cache.
- `src/pages/dashboard/ServiceForm.jsx` and `src/pages/public/ServicesSearch.jsx`:
  selection preservation, labels, deletion notices, and filters.
- `src/hooks/useSessionMutation.js`, `src/hooks/useBookingMutation.js`, and
  `src/components/Modal.jsx`: shared mutation and pending-dialog behavior.

## Manual verification pending

No endpoint, browser, or concurrency tests were run; no test files were added.

- Admin, non-admin, multi-role, unauthenticated, and restoring-session access.
- Blank/whitespace fields, length limits, duplicate names/tags, preserved failed
  drafts, cancelled edits, and backend validation messages.
- Create, edit, delete, repeated clicks, 404 responses, and referenced-category 409s.
- More than 20 categories, page retries, and deletion of the last item on a page.
- New categories beyond page one, renamed labels, deleted options, existing service
  selections, legacy tag links, and search/provider URL parameters.
- Delayed option requests during mutations, failed refreshes after successful CRUD,
  and navigation/logout while saving.
- Keyboard focus, mobile layout, light/dark themes, and unchanged entrepreneur
  verification and booking flows.

No backend changes, migrations, dependency changes, or deployment are part of this
frontend integration. The existing category API must be available before rollout.
