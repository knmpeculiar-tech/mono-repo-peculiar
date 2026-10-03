# Testing standards

Applies to both `apps/web` and `apps/api`.

## Bar for "done"

Before saying a change works, actually run (for whatever app you touched):

1. Lint
2. Type-check
3. Tests
4. Build

Do not claim a feature works from reading the code alone. For `apps/web`, exercise the
actual UI in a browser for the golden path and at least one edge case. For `apps/api`,
exercise the endpoint with a real request (curl, REST client, or a test) — don't infer
correctness from the code shape.

## Coverage expectations

- Every user-facing view needs a real loading state, empty state, and error state
  exercised — not just the happy path.
- Every API endpoint needs validation-failure and not-found paths tested, not just the
  success path.
- Prefer a small number of meaningful tests over exhaustive coverage of trivial code —
  this is a client site with a limited budget, not a library needing 100% coverage.

## What not to do

- Don't add a testing framework or E2E suite speculatively before there's a page/endpoint
  worth testing.
- Don't mock things that are cheap to run for real in local dev (e.g., a local Postgres
  via Prisma) unless a real speed or reliability problem shows up.
