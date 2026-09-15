# Database migrations

Run these commands from `backend/`, with `DATABASE_URL` set in `backend/.env`.

```sh
npm run prisma:validate
npm run migrate:dev -- --name describe_change
npm run prisma:generate
npm run migrate:status
```

To apply committed migrations in a deployment, use `npm run migrate:deploy`.
Commit the schema and migration files together. Never reset a database that
contains data you need to keep.

## Schema choices

- All primary and foreign keys use PostgreSQL UUID columns. Prisma generates
  primary keys with `uuid()`; raw SQL inserts must supply their own UUIDs.
- Database tables and fields retain the supplied snake_case names. Prisma
  models use singular PascalCase names.
- `role` is an enum array with a default of `[student]`.
- Emails and booking references are unique. Rejection reasons are nullable.
- Prices use `Decimal(12, 2)`, durations use integer minutes, and audit timestamps
  use `timestamptz(3)`. Slot dates and times use separate `date` and `time` columns.
- Foreign-key deletion is restricted to preserve dependent records.
- The supplied many-to-one relationships are preserved, including multiple
  entrepreneur profiles per user and multiple booking records per slot.

Before implementing booking endpoints, enforce that the selected slot belongs
to the selected service and prevent concurrent active bookings for the same
slot. Booking cancellation/rebooking rules and the timezone used to interpret
slot dates and times still need to be defined.
