# apps/web

Frontend for the Peculiar client website — Next.js (App Router), React, TypeScript,
Tailwind CSS. Talks to `apps/api` only over its REST API, never touches Postgres
directly. See the root `CLAUDE.md` and `.claude/rules/frontend.md` for project
standards, and `docs/decisions.md` for the reasoning behind non-obvious choices.

Cart state lives entirely in `localStorage` — there is no server-side cart.

## Setup

```bash
pnpm install
cp .env.example .env.local   # public (NEXT_PUBLIC_*) values only
```

## Running

```bash
pnpm dev:web   # from the repo root — http://localhost:3000
```

Run `pnpm dev:api` (repo root) alongside it — the frontend needs the API running to
show real data.

## Scripts

`pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build`, all runnable from the repo
root across every app, or from this directory directly.
