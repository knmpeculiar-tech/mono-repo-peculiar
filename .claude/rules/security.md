# Security standards

Applies to both `apps/web` and `apps/api`.

## Skill

Load the `security-and-hardening` skill when: building anything that accepts untrusted
input, handling authentication/sessions, integrating a third party (Razorpay, Supabase
Auth), or auditing dependencies.

## Non-negotiables

- Secrets (API keys, DB credentials, session secrets) live only in environment
  variables, documented (names only, no real values) in `apps/api/.env.example`. `apps/web` env
  vars are all `NEXT_PUBLIC_*` (shipped to the browser) and documented in
  `apps/web/.env.example` — a server secret must never go there. Never
  hardcoded, never committed.
- Validate all external input at the boundary — request bodies, query params, route
  params — before it reaches business logic.
- Never trust client-supplied data for authorization decisions; check server-side.
- Don't leak internal errors (stack traces, DB error messages, file paths) in API
  responses to the client.
- Keep dependencies minimal; before adding a new package, check it's actually needed and
  reasonably maintained.

## Payments (Razorpay)

- Never handle raw card data client-side — Razorpay's checkout widget owns that.
- Verify the checkout callback signature (`razorpay_order_id|razorpay_payment_id` HMAC
  with the key secret) *and* the webhook signature (HMAC of the raw request body with
  the separate webhook secret) server-side. See `services/payment.service.ts`.
- The webhook route needs the raw request body for signature verification — a
  re-serialized `req.body` will not byte-match what Razorpay signed. See the
  `express.json({ verify })` capture of `req.rawBody` in `app.ts`.
- All payment logic lives in `apps/api` services, never in `apps/web`.
- Razorpay retries webhook delivery on any non-2xx response — every webhook handler
  must be idempotent (dedupe by event id) rather than assuming single delivery.

## Authorization

- Prisma connects to Supabase Postgres directly, bypassing Row Level Security — there is
  no DB-level safety net. Every authenticated/admin route must go through
  `requireAuth`/`requireAdmin` (`middleware/auth.ts`); don't rely on RLS policies, they
  are not enforced on this connection path.
