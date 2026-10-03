# Database rules

Scope: schema, migrations, and query patterns for the Peculiar Postgres database.

## Stack

- Supabase-hosted PostgreSQL, accessed exclusively through Prisma ORM from `apps/api`.
- Schema and migrations live in `apps/api/prisma/` (`schema.prisma`, `migrations/`) —
  the api is the only app that talks to Postgres.
- `DATABASE_URL` is Supabase's pooled connection (pgbouncer, port 6543) for the running
  app; `DIRECT_URL` is the direct connection (port 5432), used only by `prisma migrate`
  since pgbouncer's transaction mode doesn't support the prepared statements migrations
  need. Both are required — see `apps/api/.env.example`.
- Prisma connects with direct database access, bypassing Supabase's RLS/PostgREST layer.
  Authorization is enforced in Express middleware (`requireAuth`/`requireAdmin`), not in
  Postgres row-level security policies — see `docs/decisions.md` for the rationale. Don't
  add RLS policies expecting them to be enforced; they won't be, since Prisma never goes
  through PostgREST.
- `Profile.id` matches a row in Supabase's `auth.users` (same UUID), but Prisma doesn't
  manage the `auth` schema — that FK is hand-written directly in the migration SQL, not
  modeled in `schema.prisma`. Don't try to add `auth.users` as a Prisma model.

## Skill

Load the `supabase-postgres-best-practices` skill before creating or changing anything
in `prisma/schema.prisma`, writing a migration, adding an index, or diagnosing a slow
query. It applies to any Postgres database regardless of hosting provider — its guidance
on schema design, indexing, and migrations is the reference here.

## Conventions

- Every schema change goes through a Prisma migration (`prisma migrate deploy` — this
  environment can't run the interactive `prisma migrate dev`, so generate the SQL with
  `prisma migrate diff` when needed and apply with `deploy`) — never hand-edit the
  database out of band.
- Table/column names in the live database are **snake_case** (it predates this Prisma
  schema — see `docs/decisions.md`). Model and field names in `schema.prisma` stay
  idiomatic PascalCase/camelCase via `@map`/`@@map` — don't rename the DB side to match
  Prisma's defaults, and don't drop the `@map` directives when adding fields to an
  existing model.
- Every id column is Postgres `uuid`. A malformed id (wrong format, not just
  "not found") reaching Prisma throws `P2023`, not a clean miss — this is handled
  centrally in `middleware/errorHandler.ts` (mapped to 400), so don't re-solve it with
  per-route `.uuid()` checks unless a specific field deserves an earlier, clearer error
  message (see `variantId` in `order.validator.ts` for an example of when it's worth it).
- Add indexes for fields used in `WHERE`/`ORDER BY` on tables expected to grow — but
  don't index speculatively on tables with a handful of rows.
- No raw SQL unless Prisma genuinely cannot express the query; if you do, justify why in
  a comment and in `docs/decisions.md`.

## Secrets

- `DATABASE_URL` and `DIRECT_URL` come from the environment (see `apps/api/.env.example`),
  never hardcoded, never committed with real credentials.
