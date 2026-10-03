# Frontend rules — apps/web

Scope: everything under `apps/web/`.

## Stack

- Next.js (App Router), React, TypeScript (strict), Tailwind CSS.
- No CSS-in-JS libraries, no competing styling systems — Tailwind is the one system.

## Design

- Premium, intentional, client-ready. Avoid generic AI-slop patterns: no gratuitous
  gradients, no unnecessary glassmorphism, no animation without purpose, no unnecessary
  dashboards or dead UI.
- Use the `impeccable` skill for real design/UX decisions (hierarchy, spacing, color,
  motion) rather than guessing. If `.impeccable.md` doesn't exist yet, tell the user to
  run `npx impeccable teach` before serious visual work — don't invent brand decisions.
- Every page needs real loading, empty, and error states — not just the happy path.

## Components

- Build reusable components in `apps/web` as the need appears; don't pre-build a
  component library speculatively.
- No `packages/ui` — shared pieces live in `apps/web` until real cross-app duplication
  forces the question (there is currently only one frontend app, so this is unlikely to
  come up soon).

## Accessibility & responsiveness

- Semantic HTML first; ARIA only to fill real gaps semantic HTML can't cover.
- Every page must work at mobile width and support keyboard navigation.
- Respect `prefers-color-scheme` / reduced-motion where relevant; don't force a single
  hardcoded theme if the design calls for both.

## Data access

- `apps/web` talks to the backend only via the REST API in `apps/api` — never directly
  to the database.
