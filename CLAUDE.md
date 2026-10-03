# Peculiar — Client Website

## Project purpose and context

This repository builds the **Peculiar client website**: a real client engagement, not an
internal experiment. Prioritize a polished, reliable, production-ready result over
novelty, cleverness, or unnecessary complexity. The client has a limited budget and
timeline — every decision should be weighed against "does this earn its cost."

This is a **full-stack web application**. It is explicitly **not** an AI/LLM product —
do not introduce agents, RAG, embeddings, or LLM API calls into the product itself.
(Claude Code, the assistant working in this repo, may of course use its own tools and
skills to build the site — that is unrelated to what the *product* does.)

## Repository layout

```
knm-peculiar/
├── apps/
│   ├── web/        # Next.js frontend — all UI code lives here (own .env.local)
│   └── api/        # Express backend — all API code lives here (own .env)
│       └── prisma/ # Prisma schema + migrations — only the api talks to Postgres
├── docs/           # Assumptions, architectural decisions
├── .claude/        # Claude Code configuration (rules, this file)
├── package.json    # pnpm workspace root — scripts only, no dependencies
└── pnpm-workspace.yaml
```

The root holds only workspace plumbing and docs. Each app owns its own dependencies,
env file, and (for the api) database schema.

Two applications, cleanly separated:

- **`apps/web/`** — all frontend/UI code. Nothing backend-specific belongs here.
- **`apps/api/`** — all backend/API code. Nothing UI-specific belongs here.

**Do not create `packages/ui`, `packages/types`, `packages/config`, or any other shared
package.** Two apps duplicating a small amount of code is acceptable at this stage. Only
introduce a shared package if real, repeated duplication actually appears — and document
that decision in `docs/decisions.md` when it happens.

## Approved scope and exclusions

Peculiar sells one product — sanitary pads — as `Size x Container-type` variants (e.g.
Small/Medium/Large x Regular Pack/Jumbo Pack), each a separate purchasable SKU with its
own price and stock. Target load: ~20 concurrent users. Budget-conscious: Supabase's free
tier (Postgres + Auth) is the deliberate choice to keep this cheap to run.

Approved:
- Storefront: product/variant catalog, admin-authored reviews, SEO blog.
- Checkout: cart is frontend-only (localStorage, no server-side cart), Razorpay for
  payment, sign-in required (no guest checkout — every order is tied to an account so
  order history/tracking always works; see `docs/decisions.md`).
- Auth: Supabase Auth (customers + admin), role-based (`CUSTOMER` / `ADMIN`).
- Admin dashboard: add/edit/archive products & variants, order status management
  (no courier/GPS integration — "tracking" means admin-updated status, not real-time
  location), blog CRUD, review CRUD.
- Idempotent, correctness-first backend: this is expected to need to scale if the
  business grows, so stock/payment logic must be race-safe and side-effect-safe under
  retries from day one — see `docs/decisions.md` for the specific mechanisms
  (idempotency keys, atomic stock decrements, webhook event dedup).

Explicitly out of scope unless the client requests otherwise (ask before building any of
these):
- Google Maps integration.
- Real-time/courier-integrated order tracking (status updates only, see above).
- Customer-submitted reviews (reviews are admin-authored only).
- A second product line or a generic multi-product catalog beyond Size x Container
  variants of the one product (the schema doesn't prevent this, but don't build UI/flows
  assuming it).
- Any AI/LLM/RAG functionality in the product.

Avoid, regardless of scope: generic AI-slop visual design, excessive gradients,
unnecessary glassmorphism, animation for its own sake, fake/placeholder features,
unnecessary dependencies, and premature abstractions.

## Development workflow

- Package manager: **pnpm**, workspaces defined in `pnpm-workspace.yaml` (`apps/*`).
- Before calling anything done: run lint, type-check, tests, and build for whatever app
  you touched. Do not claim a feature works without actually exercising it (in a browser
  for `apps/web`, against a real request for `apps/api`).
- Strict TypeScript everywhere. No `any` as a shortcut past a real type.
- Environment variables are documented per app (`apps/api/.env.example`,
  `apps/web/.env.example`) and never hardcoded or committed as real secrets.
- Use the relevant scoped rule file under `.claude/rules/` for area-specific detail
  (frontend, backend, database, testing, security, git) instead of repeating it here.

## First-principles learning behavior

When explaining an unfamiliar concept, framework choice, or piece of generated code to
the client-side reader of this repo (not just producing code silently), prefer building
understanding from first principles: state the underlying problem, the mental model,
and only then the specific API/pattern. Use the `first-principles-learning` skill for
this when a genuine teaching moment comes up — not for routine, self-explanatory changes.

## Senior engineering standards

Act as a senior full-stack engineer and product-minded technical lead (the
`senior-engineering-mentor` skill formalizes this posture — use it for architecture or
risk-tradeoff questions). Concretely:

- Prefer the simplest solution that correctly satisfies the actual requirement.
- Do not design for hypothetical future requirements ("we might need multi-tenant
  later") — build for the approved scope.
- Keep business logic out of route/controller files; controllers stay thin, services
  hold the logic.
- Validate all external input at the boundary (HTTP request bodies/params/query).
- Never hardcode secrets; always go through environment variables.
- Add real loading, empty, and error states — not just the happy path.
- Avoid duplicated code, but don't abstract until duplication actually happens twice.

## Architecture and design principles

- Two independently deployable apps (`apps/web`, `apps/api`) communicating over REST.
- No shared package layer until real duplication justifies one.
- Database access goes through Prisma from `apps/api` only — `apps/web` never talks to
  Postgres directly.
- Favor boring, well-understood patterns over novel architecture. This is a client site,
  not a platform.

## Frontend standards

See `.claude/rules/frontend.md`. Summary: Next.js App Router, React, TypeScript,
Tailwind CSS, responsive and accessible by default, reusable components, and a premium
intentional visual identity — use the `impeccable` skill for actual design/UX work
rather than guessing at brand decisions. Run `npx impeccable teach` before serious visual
design work if `.impeccable.md` doesn't exist yet (it doesn't, as of this writing).

## Backend standards

See `.claude/rules/backend.md`. Summary: Node.js + Express + TypeScript, REST APIs,
clear separation of routes / controllers / services / middleware / validators. The
`nodejs-backend-patterns` skill covers general Express/Node best practice — consult it
rather than re-deriving conventions from scratch.

## Database standards

See `.claude/rules/database.md`. Summary: Supabase-hosted PostgreSQL + Prisma ORM,
schema and migrations live in `apps/api/prisma/` (the api is the only app that talks
to Postgres). Prisma connects directly to Postgres (bypassing Supabase's RLS
layer) — authorization is enforced in Express middleware, not database policies; see
`docs/decisions.md` for the full rationale. Load `supabase-postgres-best-practices`
before writing or changing schema.

## AI/LLM production standards, RAG standards, evaluation standards

**Intentionally omitted.** This product is not an AI/LLM application, so these sections
from the standard project template do not apply. Do not add LLM calls, RAG pipelines, or
model evaluation harnesses to this codebase. If that ever changes, these sections should
be added deliberately at that time, not preemptively.

## Security standards

See `.claude/rules/security.md`. Summary: secrets only via environment variables, input
validation at every external boundary, no client-supplied data trusted without checking.
Use the `security-and-hardening` skill when building anything that accepts untrusted
input, handles auth/sessions, or integrates a third party (Razorpay payments, Supabase
Auth).

## Testing standards

See `.claude/rules/testing.md`. Summary: lint, type-check, test, and build are the bar
for "done," not optional extras. Cover loading/empty/error states, not just success.

## Git standards

See `.claude/rules/git.md`. Summary: clear, conventional commit messages; no direct
force-pushes; branch per feature/fix once collaboration starts.

## Documentation standards

- Record non-obvious assumptions and architectural decisions in `docs/decisions.md` as
  they're made — not after the fact, not in scattered code comments.
- Each app (`apps/web`, `apps/api`) gets a README once it's scaffolded, covering how to
  run it locally.
- Comments in code explain *why*, never *what* — well-named code should make the "what"
  obvious.

## Rules for asking clarification questions

Per the client's direction for this repo: when something is unclear, do not repeatedly
block on basic decisions. Instead:

1. Make the simplest reasonable assumption consistent with the approved scope above.
2. Document the assumption in `docs/decisions.md`.
3. Continue working.

Reserve actual clarifying questions for decisions that are genuinely the client's to
make and hard to reverse — e.g., scope additions (payments, maps, tracking), brand/design
direction, or anything that contradicts an exclusion listed above.

## Rules for explaining assumptions and tradeoffs

When you make a nontrivial assumption or pick between competing approaches, say so
explicitly and briefly: what you chose, the main alternative, and why — one or two
sentences, not an essay. Do this in the conversation and, for anything that will matter
to future work, also in `docs/decisions.md`.
