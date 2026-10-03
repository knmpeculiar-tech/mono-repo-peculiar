# Peculiar

Sanitary pads e-commerce site for the Peculiar client — pnpm monorepo with a Next.js
frontend (`apps/web`) and an Express + TypeScript + Prisma backend (`apps/api`), on
Supabase (Postgres + Auth). See `CLAUDE.md` for full project standards and scope, and
`docs/decisions.md` for the reasoning behind non-obvious choices.

## Setup

```bash
pnpm install
cp apps/api/.env.example apps/api/.env              # Supabase + Razorpay secrets
cp apps/web/.env.example apps/web/.env.local        # public NEXT_PUBLIC_* values only
pnpm db:generate
pnpm db:deploy          # applies apps/api/prisma/migrations/ to your Supabase Postgres
```

Each app owns its env file — the repo root has none. `apps/api/.env` needs, from your
Supabase project (Project Settings -> Database / API): `DATABASE_URL` (pooled, port
6543), `DIRECT_URL` (direct, port 5432 — used only by migrations), `SUPABASE_URL`,
`SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL`, plus Razorpay's `RAZORPAY_KEY_ID`,
`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. See each `.env.example` for details.

## Running

```bash
pnpm dev:api   # http://localhost:4000
pnpm dev:web   # http://localhost:3000
```

## Common scripts (run from repo root)

- `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` — run across every app.
- `pnpm db:generate` / `pnpm db:deploy` / `pnpm db:studio` — Prisma, against
  `apps/api/prisma/schema.prisma`.
