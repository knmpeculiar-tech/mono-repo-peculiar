# Backend rules — apps/api

Scope: everything under `apps/api/`.

## Stack

- Node.js, Express, TypeScript (strict), REST (no GraphQL, no RPC layer — keep it plain).
- The `nodejs-backend-patterns` skill covers general Express/Node conventions
  (middleware, error handling, project layout) — consult it instead of re-deriving these
  from scratch.

## Layering

Strict separation, in this direction only:

```
routes/       → wires HTTP method + path to a controller. No logic.
controllers/  → parses request, calls a service, shapes the response. No business logic.
services/     → business logic and orchestration. No knowledge of req/res.
middleware/   → cross-cutting concerns (auth, error handling, logging).
validators/   → input validation/schema checks, run before a controller uses the data.
```

- A controller should never contain a database call directly — that belongs in a
  service (which may use Prisma).
- A route file should contain no logic beyond `router.METHOD(path, validator,
  controller)`.

## Validation & errors

- Validate every external input (body, query, params, headers you rely on) before it
  reaches a service.
- Centralize error handling in middleware; don't scatter ad-hoc `try/catch` -> raw
  `res.status(500)` across controllers.
- Never leak internals (stack traces, SQL errors) in API responses.

## Data access

- All Postgres access goes through Prisma, from services in `apps/api` only.
- The Prisma schema and migrations live in `apps/api/prisma/`.

## Secrets & config

- All configuration (DB URL, ports, third-party keys) comes from environment variables,
  documented in `apps/api/.env.example`. Never hardcoded.
