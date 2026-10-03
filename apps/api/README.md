# apps/api

Backend for the Peculiar client website — Node.js, Express, TypeScript, Prisma on
Supabase Postgres. The only app that talks to the database. See the root `CLAUDE.md`
and `.claude/rules/backend.md` for project standards.

## Layout

- `src/` — routes → controllers → services, plus middleware/validators.
- `prisma/` — `schema.prisma` and `migrations/`. The generated client goes to
  `prisma/generated/` (gitignored — run `pnpm db:generate` from the repo root).
- `scripts/create-admin.ts` — create an admin account:
  `pnpm --filter api exec tsx scripts/create-admin.ts <email> [password]`.

## Setup

```bash
cp .env.example .env   # fill in real Supabase + Razorpay values
```

`.env` here is read both by the server (`src/config/env.ts`) and by the Prisma CLI.

## Running

```bash
pnpm dev:api   # from the repo root — http://localhost:4000, docs at /api/docs
```
