# Decisions & assumptions log

Running log of assumptions made and architectural decisions taken when a choice wasn't
explicitly specified. Newest entries at the top. See "Rules for asking clarification
questions" in the root `CLAUDE.md`.

---

## 2026-10-03 — Email auth flow: callback route, resend, password reset

Supabase Auth is email + password only (phone provider stays off). Email confirmation is
required on the project (`mailer_autoconfirm: false`) and mail now goes out through
Resend as custom SMTP. The flow was broken end to end: the confirmation email had nowhere
to land because the app had no route to turn the link into a session.

- **`/auth/callback` (route handler)** handles every auth email. It accepts a PKCE
  `code` (what Supabase's default email template produces) and a `token_hash`/`type`
  pair (in case the template is ever switched to link straight here), sets the session
  cookie, then redirects to `next`. If the `code` exchange fails, Supabase has already
  verified the email by that point. The failure almost always means the link was opened
  in another browser or device (the PKCE verifier cookie lives in the browser that
  signed up), so we send the user to `/login?notice=email_confirmed` instead of
  showing an error. Reset links have no such fallback and go to `/forgot-password`.
- **Redirect URLs:** `emailRedirectTo` is built from `window.location.origin`, so
  every deployed origin's `https://<domain>/auth/callback` must be added under
  Supabase → Auth → URL Configuration → Redirect URLs. If it's missing, Supabase falls
  back to the Site URL and the link silently skips the callback. `localhost:3000` is
  already allowed (verified).
- **Already-registered email on sign-up:** with confirmation on, Supabase returns
  success with an empty `identities` array and sends no email. We now say "an account
  already exists" instead of showing "check your email" forever. The trade-off is that
  sign-up reveals whether an address is registered; for a storefront that's normal, and
  the more helpful UX wins. Forgot-password stays deliberately neutral.
- **`?next=` is sanitised** (`safeNextPath`): only same-origin relative paths, so a
  crafted `/login?next=//evil.com` can't bounce a fresh session off-site.
- Supabase error codes are mapped to customer copy (`authErrorMessage`); raw messages
  are never shown. Unconfirmed sign-in offers a resend button. A forgot-password /
  reset-password pair was added, since password auth without a reset path leaves
  locked-out customers with no way back in. Client-side minimum password is 8
  characters.

**Verified** in headless Chromium against the real Supabase project, using throwaway
users created via the admin API (no email sent) and admin-generated `token_hash`
links, all deleted afterward: wrong password, unconfirmed sign-in with resend,
sign-in honouring `next`, `//evil.com` blocked, duplicate sign-up message, confirm link
→ signed in at `next`, reused link → expired notice, verifier-less `code` → confirmed
notice, expired reset link, query notice not reflected, reset page without session,
recovery → mismatch caught → password changed → sign-in with new password (17/17).
**Not verified by me:** delivery of a real email through Resend, and the PKCE `code`
round trip from a real inbox. That needs a human-readable inbox.

---

## 2026-10-03 — Product page: layer tech, trust sections, review paging; false claim removed

Client asked for: reviews 5 at a time with "show more", a section explaining the
product's technology (from their infographic) with a graphic, the "18,000 packs sold"
milestone, and two researched sections that make the brand read as genuine.

**Principle: trust content shows only true, checkable claims.** Invented badges and
claims backfire with Indian shoppers, and the Consumer Protection (E-Commerce) Rules
2020 and the 2023 dark-pattern guidelines penalise false claims and fake reviews. The
client confirmed, via a structured question: discreet packaging ✓, 7-day returns ✓,
layer 4 is SAP (super absorbent polymer) paper, so the infographic's "Swap paper" was a
typo ✓, the 240 × 70 mm pad is Medium ✓. **Not confirmed, so never shown:**
free-shipping threshold, "Made in India", certifications. These live in one file,
`lib/brandFacts.ts`, that all trust badges read from.

- **A false claim was live and is fixed.** The homepage hero said "Free shipping over
  ₹499", demo copy the client says isn't true. Replaced with "18,000+ packs sold"; the
  FAQ header note was updated.
- **Review paging** (`ReviewList`, now a client component): 5 shown, then "Show more
  reviews (N more)" adds 5 at a time. Focus moves to the first newly revealed review for
  keyboard and screen-reader users. Data is still fetched once (it's small); this is
  display paging, not API pagination.
- **"What's inside every pad"** (`LayerTech`): an exploded isometric SVG of the 6 layers,
  each textured after the infographic (perforated top sheet, pink anion beads, blue gel
  bubbles, SAP lattice, breathable base, adhesive strip), drawn with real geometry, not
  a pasted image. The numbered list beside it is the accessible content; the graphic is
  `aria-hidden`. Hovering, focusing or tapping a layer lifts and outlines it and dims
  the rest, the section's one animation, disabled under reduced motion. Below it, a spec
  row: Medium 240 × 70 mm, 6 layers, secure wings, individually wrapped. Copy is the
  client's own infographic claims, lightly edited, with nothing added.
- **Researched trust section 1, buy-with-confidence**: "18,000+ packs sold" beside the
  rating (proof of scale where shoppers look first), plus `TrustStrip` under the buy
  buttons: secure payments (Razorpay: UPI/cards/netbanking), discreet packaging, 7-day
  returns, order tracking (account plus WhatsApp updates). Every item is a confirmed fact
  or something the system itself guarantees.
- **Researched trust section 2, "Good to know before you buy"** (`ProductFaq`): 7
  answers (anion chip, gel, size, discreet packaging, returns, payment safety,
  tracking), each backed by the infographic, `brandFacts`, or how checkout and order
  history actually work.
- **Recommended but not built** (client chose "not now"): a "real company" block with
  support contact (WhatsApp, phone, email) and registered business name and address.
  It's the strongest genuineness signal for Indian D2C, and the 2020 rules require
  seller identity and customer-care details on e-commerce sites.
- Assumption: "7-day easy returns" counts from delivery ("Return within 7 days of
  delivery"), matching the existing homepage FAQ wording. Confirm with the client.

**Verified on a production build**, 1280px and 390px: reviews 5 → all 7 with the button
gone; layer highlight works; FAQ expands; no horizontal overflow; no console errors;
homepage shows "18,000+ packs sold" and no shipping claim. Screenshots reviewed; the
design detector found no issues. New `ReviewList.test.tsx` (paging, focus move, ≤5
shows no button, empty state). `lint`/`typecheck`/`test` (75 web)/`build` green.

---

## 2026-10-03 — Admin feedback: toasts, save progress, working confirm dialogs

Client-reported: in the admin, saving showed nothing, and delete confirmations appeared
in the top-left corner.

- **Dialog position bug**: browsers center a modal `<dialog>` with `margin: auto`,
  and Tailwind's preflight resets every margin to 0, so every confirmation pinned to
  the top-left. Fixed once in `ui/Modal.tsx` (`m-auto`), which also gained
  `dismissible` (Esc can't close it mid-request), a soft shadow and a short entrance.
- **Shared feedback layer** (`components/admin/feedback/`, no dependencies), mounted
  once in `AdminShell`:
  - `AdminFeedbackProvider` plus `useToast()`: corner toasts (bottom-right; bottom,
    full-width on mobile). `role="status"` for success and `role="alert"` for errors.
    Successes auto-dismiss after 3.5s; **errors stay until dismissed**, since those
    are the ones that must not be missed. At most 3 on screen.
  - `SaveButton` + `useFormPending(formId)`: the header Save buttons render far from
    their forms (`form="…"`), so the form reports its saving state through context and
    the button shows a spinner and "Saving…"/"Creating…", disabled. This replaces the
    old invisible `useRef`-only guard (kept for Enter-key submits) and the "Saved." text
    at the bottom of the form, which was usually off-screen.
  - `ConfirmDialog`: every destructive action. A red `danger` button with
    "Deleting…" progress; Cancel is disabled mid-request; **a failure shows its reason
    inside the dialog**, which stays open (previously some flows closed the dialog and
    showed the error elsewhere); success closes it and toasts.
  - `errorMessage(err, fallback)`: shows the API's own human-written message when there
    is one.
- **Wired everywhere admins change data**: product, blog, review and user forms; sizes,
    packs & prices; image upload, set-as-main and delete; review publish/hide; blog,
    review, user, size and pack deletes; order status changes; WhatsApp message
    tracking. Messages name the thing ("Order PEC-… marked as shipped", "Post deleted").
- **Found while doing this: "Mark as Cancelled" had no confirmation.** Cancelling is
  terminal and restocks the items, so one misclick ended a customer's order. It now
  goes through `ConfirmDialog`, whose copy also says cancelling does **not** refund a
  paid order: refunds are done in the Razorpay dashboard.
- `@keyframes dialog-in` / `toast-in` in `globals.css`, applied via `motion-safe:`
  only, so reduced-motion users get no animation.

**Verified in a real browser on a production build** (API responses deliberately
slowed so in-progress states are observable): the Save button shows "Saving…" and is
disabled, then the "Product saved" toast appears and the button returns; an empty name
shows the "Fix the highlighted fields" error toast; the delete dialog is centered (0px
horizontal offset) at 1280px and 390px; "Deleting…" with Cancel disabled, then the
"Post deleted" toast, dialog closed, row gone; a simulated 409 shows its message inside
the still-open dialog. The design detector found no issues. `lint`/`typecheck`/`test`
(71 web)/`build` green. Throwaway accounts and posts deleted. Not separately exercised
in the browser: the order-cancel confirmation (same `ConfirmDialog` component, just
different copy).

---

## 2026-10-03 — Product photos are never cropped (object-contain)

The client's real product photos are 3:2 landscape (1280×853, 1536×1024), but every
product image slot (product gallery and its thumbnails, product cards, the homepage
featured product, the admin preview) was a square frame with `object-cover`, which cut
off about a third of each photo's width, including packaging text. All of these
switched to **`object-contain`**: the whole photo always shows, and spare space shows
the muted background, the standard e-commerce treatment. Frames stay square so a
gallery mixing photo shapes doesn't jump in layout. The admin preview matches the
storefront, so what the admin sees is what customers get. Lifestyle and mood imagery
(hero, About, CTA texture) deliberately keeps `object-cover`, since nothing in it is
information. Supersedes the earlier "aspect-square matches the 1:1 photos" note on
`FeaturedProduct`, which assumed square photography. Verified by screenshots at 1280px
and 390px with the client's actual uploads.

---

## 2026-10-03 — Admin changes show on the storefront immediately (on-demand revalidation)

**Problem (reported twice):** after an admin edit, e.g. replacing the product photo,
the storefront kept showing the old data. Storefront pages are ISR-cached (product
60s, homepage 300s, blog 600s), and Next.js serves the cached page once more *while*
it refreshes in the background, so a change could take minutes plus an extra reload
to appear.

**Fix**, keeping the caching (it's what keeps the storefront fast and the free-tier API
idle):
- Every public storefront fetch (`lib/api/products.ts`, `reviews.ts`, `blog.ts`) is
  tagged `storefront` (`lib/cache/storefrontTag.ts`). One tag for the whole site rather
  than per resource: a handful of pages doesn't justify the risk of missing one.
- `lib/cache/refreshStorefront.ts` is a Server Action that calls
  **`updateTag("storefront")`** plus `revalidatePath("/", "layout")`. It's `updateTag`
  and not `revalidateTag` because in Next 16 `revalidateTag` only marks data *stale*,
  serving the old version once more, which is the very delay being fixed. `updateTag`
  *expires* it, so the next request renders fresh. Server Actions are public POST
  endpoints, so it first confirms the caller is an admin via the API's `/admin/me`,
  using their Supabase session; anyone else gets a no-op.
- It's invoked in **one place**, `apiFetch` (`lib/api/client.ts`): after any
  successful browser-side write to `/admin/products|sizes|packs|reviews|blog`,
  including 204 deletes, it's awaited before the save resolves. Orders and users don't
  touch the storefront, so they're skipped. Centralizing it means future admin screens
  get it automatically instead of each form having to remember. If the refresh fails,
  the save still succeeds (logged), because the data change is what matters.
- Limitation: edits made **outside the admin panel** (the Supabase table editor,
  scripts, direct API calls) bypass this and still wait out the normal cache window.

**Also:** `DELETE /admin/products/images/:id` now removes the file from Supabase Storage
after deleting the row. Best-effort: a failed file removal is logged, not surfaced,
since the image is already gone from the site. One orphan from before this change
remains (`0f55bb93…/2f4af2b6….png`, the previous product photo).

**Verified on a production build** (`next build && next start`): with the product page
deliberately cache-warmed, an admin edited the description through the real admin
form, and the **first** storefront load afterwards showed it, as did the 5-minute-cached
homepage. A throwaway product image deleted via the API returned 204 and its storage
URL stopped resolving. Unit tests cover when the refresh fires (writes to storefront
paths, 204 deletes) and when it doesn't (reads, failed writes, orders), and that a
failed refresh doesn't fail the save. `lint`/`typecheck`/`test` (13 api, 71 web)/`build`
green. Test accounts and data cleaned up; the original description was restored.

---

## 2026-10-03 — Logo + favicon; no vercel.json

- **Logo (client picked option A of four)**: a lowercase "peculiar" wordmark in
  Fraunces, the site's existing display face, at `opsz 72, wght 600, SOFT 100`. The
  SOFT axis rounds the terminals, a fit for the product. The i's dot is a burgundy
  **petal**, echoing the rose petals in the site photography. The letters are converted
  to outlines (vector paths), not live text, so the logo renders identically in the
  header, emails, the Razorpay checkout and favicons, without depending on the web font
  loading. Fraunces is SIL OFL, which permits this. Generation parameters: shaped with
  HarfBuzz using the font's kerning; `i` replaced by `dotlessi`; petal (a two-cubic
  teardrop) centered on the original dot at 1.05× its width, rotated 22°. The generator
  was a one-off script, not part of the repo; reproduce from these parameters if the
  mark ever needs regenerating.
  - `components/layout/Logo.tsx`: inline SVG, letters `currentColor`, petal
    `fill-brand`; used in the header.
  - `public/brand/peculiar-logo.svg` (ink `#201a1c`, petal `#741c47`) and
    `peculiar-logo-white.svg` (white, petal `brand-200`) for use outside the site
    (Razorpay, email templates, social).
- **Favicon**: a white soft-Fraunces "p" (`wght 700`) on a burgundy rounded square.
  It's a plain "p" rather than "p + petal" because the petal disappears at 16px; the
  bare letter stays crisp. Uses Next.js file conventions only, no config:
  `app/icon.svg` (modern browsers), `app/favicon.ico` (16/32/48 PNG entries, replacing
  the create-next-app default), `app/apple-icon.png` (180px, square and opaque, since
  iOS applies its own mask).
- **No `vercel.json`.** The "404 on refresh" problem belongs to client-only single-page
  apps, which need an all-routes→`index.html` rewrite. Vercel runs Next.js natively and
  serves every route itself, so such a rewrite would *break* this app. Verified on the
  production build (`next build && next start`): direct loads of `/`, `/about`,
  `/blog`, `/products/peculiar-pads`, `/login`, `/signup` and
  `/order-confirmation/<id>` return 200. Protected routes 307 to
  `/login?next=…`, an unknown path 404s, robots/sitemap 200. One quirk, unchanged by
  this work: an unknown *product* slug renders the not-found page with status 200
  rather than 404, because the route's `loading.tsx` starts streaming first. It carries
  `<meta name="robots" content="noindex">`, so it's harmless for SEO. For Vercel, set
  the project's **Root Directory to `apps/web`** in the dashboard and add the
  `apps/web/.env.example` variables there. `NEXT_PUBLIC_API_URL` must point at the
  deployed API (not localhost), and the API must be reachable while Vercel builds,
  because product and blog pages are prerendered from it.

---

## 2026-09-28 — Demo reviews; texture image moved to the closing CTA background

- **Demo content for the client's new (empty) project**, created through the real admin
  API with a temporary admin account (deleted afterward): a "Peculiar Pads" product
  (`peculiar-pads`) with all 6 size × pack variants, at **placeholder** prices of
  ₹149–₹329 against MRPs of ₹199–₹419, stock 100 each, and **6 fictional reviews**
  (4–5★). Both must be replaced before launch: the prices aren't business decisions, and
  the reviews aren't real customers. The homepage Testimonials section shows the 3
  newest; the product page shows all of them plus the average rating.
- **`texture.png` is now the background of the closing "Ready to feel the difference?"
  section**, with a `brand-950`/70% overlay, instead of the standalone `TextureDivider`
  band between Testimonials and the blog (removed). That band read as an orphaned image
  and collided with the next section's border. The overlay is what makes white text
  readable over the light linen; the CTA button switched to the white `secondary`
  variant, since the burgundy primary button disappears against the tinted photo.
  Checked with screenshots at 1440px and 390px.

---

## 2026-09-28 — MRP + selling price; admin-managed sizes and packs with a checkbox grid

Client asked for two prices per variant (a higher "normal" price shown crossed out, and
the real price that's charged) and a proper way for the admin to choose which sizes
and packs a product is sold in. Confirmed with the client: Jumbo Pack = **12 pads**
(Regular = 6), and the admin should be able to **add their own sizes/packs**, not just
pick from a fixed list.

- **`mrpInPaise` on `ProductVariant`** (`mrp_paise`), required, with a DB CHECK
  `mrp_paise >= price_paise` plus the same rule in both zod layers. Equal is allowed and
  simply shows no discount. Checkout keeps charging `priceInPaise` only — nothing about
  the order/payment path changed. The storefront's `PriceTag` shows price, MRP struck
  through (with a screen-reader "MRP" label), and "N% off". The percentage is
  **floored**, never rounded, so it never claims more discount than the customer gets.
  Named "MRP" in the admin because that's the Indian retail term. Assumption worth
  keeping honest: the MRP entered should be the real MRP printed on the pack —
  displaying an inflated reference price as a "discount" is the kind of thing
  consumer-protection rules on e-commerce pricing target.
- **`size_options` / `pack_options` tables** (pack has `pads_per_pack`), seeded with
  Small/Medium/Large and Regular Pack (6)/Jumbo Pack (12). Variants reference them by FK
  (`ON DELETE RESTRICT`) instead of the old free-text `size`/`container_type`, and the
  stored `name` column is gone: the label ("Medium - Jumbo Pack (12 pads)") is computed
  on read, so renaming a size updates every product at once with nothing to go stale.
  Order lines still snapshot the label at purchase time, so history doesn't change on a
  rename. API responses keep the flat `size`/`containerType`/`name` fields the
  storefront already used, plus `padsPerPack` and `mrpInPaise`. Chose real tables over a
  fixed list in code because the client wants to add options themselves. Deleting an
  option is blocked (409, with the reason) once any variant has ever used it, archived
  ones included, because past orders pin those variants. Names are unique
  case-insensitively (service check on top of the case-sensitive DB unique index).
  Migration `20260928120000_size_pack_options_and_mrp` refuses to run if variants
  already exist, since there's no safe automatic backfill of pad counts (every
  environment had zero).
- **One save for the whole grid**: `PUT /admin/products/:id/variants` replaces the
  per-variant POST/PATCH/DELETE endpoints (removed, nothing else used them). Listed
  size×pack combinations are created/updated/un-archived; unlisted ones are archived,
  never deleted. Runs in one transaction. **`stock` is optional per row and the admin
  UI only sends it when the admin actually edited it** — otherwise a price-only save
  would overwrite stock that checkouts had decremented since the page loaded (verified
  live: a 3-unit sale then a price edit left stock at 7, not reset to 10).
- **Admin UI**: the product page's "Sizes, packs & prices" panel has size and pack
  checkboxes, then a grid of every ticked combination (SKU, MRP, price, stock, live "N%
  off" hint). Each row can also be unticked individually, for sparse grids like "Large
  only in Jumbo". Which sizes/packs are "offered" is **derived from live variants**, not
  stored separately, so there's one source of truth. SKUs are pre-suggested from the
  slug + size + pad count. A new "Sizes & packs" page (`/admin/products/options`,
  linked from the products list and the panel) handles add/rename/reorder/delete.
- **Bug found by the browser test and fixed**: a combination of offered sizes/packs that
  was deliberately never created (e.g. Small only in Regular) reappeared on every visit
  as a *ticked, empty* row, blocking every later save until unticked again. Such rows
  now load unticked; only combinations newly revealed by ticking a size/pack in the
  current session start ticked.

**Verified**: 30 live API checks against the real database (seeded options; 400s for
MRP < price, duplicate combo, unknown option id, malformed id, empty name, 0-pad pack;
404s for missing product/option; 403 for a customer; 409s for duplicate name,
case-insensitively, reused SKU, and deleting an in-use option; sort order; computed
names; archive/reactivate keeps the same variant id; order line snapshots the new name;
the stock-preservation case above; the DB CHECK). **Browser-tested for real** (headless
Chromium via Playwright, 24 checks): signed in through the actual login form as a
throwaway admin, used the checkboxes and grid, hit both validation errors, saved,
reloaded to confirm persistence, added and deleted a size on the options page, then
checked the storefront at desktop and 390px mobile (price/MRP/% off, pad counts on pack
pills, switching size updates the price, no horizontal overflow, no console errors) —
and reviewed the screenshots, which led to three small grid polish fixes (misleading
placeholders on disabled rows, misaligned inputs, a cramped SKU column). All test
data deleted afterward. `lint`/`typecheck`/`test` (13 api, 55 web)/`build` green.

---

## 2026-09-28 — Moved to the client's own Supabase project; fresh database from migrations

The original Supabase project (`mrcqxgcmeppyscvskbke`) became unreachable and the
client switched to a project on their own account (`bakzihlxjwleyadkgxcr`, same
region). The new project was confirmed empty before anything ran (no public tables,
no enum types, 0 `auth.users`, no storage buckets), so the full migration history was
applied with `prisma migrate deploy`. **No data carried over** — the old project
couldn't be reached, and everything in it was demo/test content anyway (the demo
product, 2 blog posts, 3 fictional reviews, the admin account, uploaded images).

Building from migrations alone exposed two gaps that the old database had been hiding:

- **CHECK constraints were never in a migration.** The baseline migration was generated
  by `prisma migrate diff`, which doesn't emit CHECK constraints, so the order/payment
  status checks the code relies on existed only in the old database.
  `20260928100000_restore_check_constraints` adds them back
  (`orders_status_check`, `payments_status_check`, non-negative stock, positive
  price/quantity), wrapped in existence checks so it's harmless against a database
  that already has them. The old database's exact numeric-check definitions were never
  recorded in the repo; these are reconstructed from the rules documented in this log.
- **RLS was off on every table.** Supabase's Data API (PostgREST) exposes all
  public-schema tables to the publishable key shipped in the browser bundle; with RLS
  off, orders/profiles/payments were readable and writable through it, bypassing
  Express. `20260928100001_enable_rls_block_data_api` enables RLS with no policies on
  all 12 public tables (including `_prisma_migrations`) — denies anon/authenticated
  entirely. Prisma connects as the table owner, which bypasses RLS, so the app is
  unaffected (deliberately no `FORCE ROW LEVEL SECURITY`). `apps/web` never queries
  tables via supabase-js (checked), only Auth and Storage. This refines the earlier
  "authorization is in Express, not RLS" decision rather than reversing it: RLS here
  isn't an authorization layer, it just closes a side door.

**Verified against the new database**: all 8 migrations applied, `migrate status`
reports up to date; 12/12 tables have RLS enabled (not forced); all 7 CHECK constraints
and the `profiles_id_fkey` → `auth.users` FK exist; a Prisma create of a product +
variant succeeded with RLS on, and a raw update to negative stock was rejected by
`product_variants_stock_nonnegative` — all inside a transaction that was rolled back,
0 rows left behind.

**Storage, same day** (`20260928110000_product_images_bucket`): the `product-images`
bucket (public, 20MB, `image/*` + `video/*`) and its upload policy are now a migration
instead of a manual dashboard step, so every environment gets them. The policy is
**admin-only** — the old hand-written one let any signed-in user upload, customers
included. It calls `private.is_admin()`, a `SECURITY DEFINER` function (needed because
the uploading user can't read `profiles` with RLS on), kept in a `private` schema so
the Data API doesn't expose it as an RPC.

**End-to-end verified against the new project** with throwaway accounts (all deleted
afterward, 0 rows/users/objects left): password-grant login via the new publishable
key; `/admin/me` 200 for admin, 403 customer, 401 anonymous; admin upload 200,
customer upload rejected, public read of the uploaded file 200; Data API returns 0
`profiles` rows to a signed-in customer and rejects a direct `orders` insert (403);
admin creates product + variant + image through the API; anonymous checkout 401;
customer checkout 201, same Idempotency-Key replays the same order, stock 5 → 3 once;
mock payment verify moves the order to `confirmed`; order shows in the customer's
history; admin cancel restocks 3 → 5. `apps/web`'s `next build` passes against it.

**Still needed**: a real admin account for the client; rotating the secret key and DB
password (both were shared in chat); consistent Razorpay config (api has placeholder
keys + `PAYMENTS_MOCK=true`, web has a real test key + mock off).

---

## 2026-09-28 — Each app owns its env file; Prisma moved into apps/api

The client asked why `.env` and Prisma sat at the repo root when the frontend and
backend are meant to be separate. Reviewing it, the root placement didn't hold up:

- The root `.env` was only ever read by the api (`../../.env` in `config/env.ts`) and
  the Prisma CLI — Next.js never loads a monorepo-root `.env`. Its `NEXT_PUBLIC_*`
  section was a hand-kept "reference" copy of `apps/web/.env.local` that had already
  drifted (missing `NEXT_PUBLIC_PAYMENTS_MOCK`, stale "no Razorpay keys yet"
  comments), and it put server secrets in the same file as browser-bound values.
- `prisma/` at the root was "shared," but only `apps/api` uses it, and it forced
  `prisma`/`@prisma/client` into the root `package.json` as a resolution workaround.

**Now**: `apps/api/.env` (+ `.env.example`) holds only api/Prisma values;
`apps/web/.env.local` (+ new `.env.example`, un-ignored in `apps/web/.gitignore`) holds
only `NEXT_PUBLIC_*` values. `env.ts` resolves `.env` relative to `__dirname` instead of
cwd, so it loads the same way from `tsx`, `dist/`, and `scripts/`. Schema and
migrations are in `apps/api/prisma/` (Prisma's default location for the api package,
so the custom `"prisma.schema"` path in `apps/api/package.json` is gone). The root
`package.json` now has scripts only, no dependencies. The custom generator `output`
is kept (now `apps/api/prisma/generated/client`) — it still avoids depending on pnpm's
symlinked `node_modules` layout. Supersedes the root-level `.env`/`prisma/` notes in the
2026-09-12 entries below. Deployment is unaffected: hosts inject env vars per app, so
these files only ever mattered for local dev.

**Verified**: `lint`/`typecheck`/`test` (48 web, 7 api) green; `prisma generate` and
`prisma migrate status` both pick up the new locations with no extra config; the built
api (`node dist/index.js`) loads and validates `apps/api/.env`, serves `/api/health`
(200) and rejects unauthenticated `/api/orders` (401). **Not verified**: anything
that touches the database, and `apps/web`'s `next build` (its `generateStaticParams`
fetches products from the api at build time). Both fail because the Supabase project
itself is unreachable (`tenant/user ... not found` from the pooler, on both the pooled
and direct URLs with byte-identical values to before the move) — most likely the
free-tier project paused after inactivity. Re-run once it's restored.

---

## 2026-09-13 — Switched from mock to real Razorpay (test mode)

Client provided real Razorpay test-mode credentials (Key ID + Key Secret from the
Razorpay dashboard, Test Mode toggle on). Updated `RAZORPAY_KEY_ID`/
`RAZORPAY_KEY_SECRET`/`NEXT_PUBLIC_RAZORPAY_KEY_ID` in `.env` and
`apps/web/.env.local`, and flipped `PAYMENTS_MOCK`/`NEXT_PUBLIC_PAYMENTS_MOCK` to
`"false"` in both — no code changes needed, the mock flag was built to make exactly
this a config-only flip (see the `PAYMENTS_MOCK` entry earlier in this log).

`RAZORPAY_WEBHOOK_SECRET` is still a placeholder — no webhook is configured yet.
That needs a URL Razorpay can reach from the internet, which `localhost:4000` isn't;
checkout is fully functional without it via the client-side `/payments/verify` fast
path (the webhook is only the backup path for the rare case a browser closes before
that call completes). Add a real webhook (Razorpay dashboard → Settings → Webhooks)
once the API is deployed somewhere public, or expose the local server via `ngrok` if
webhook behavior specifically needs testing before then.

**Verified for real**: restarted the API server (`.env` edits don't trigger `tsx
watch`'s file watcher — it only watches source files, so a full process restart was
required, not just a wait), then created a real order through the live API and
confirmed its `providerOrderId` came back as `order_TbWwqVTWy0s8IJ` — Razorpay's own
real order-id format, not the `mock_order_...` placeholder — proving the keys are
valid and `razorpay.orders.create()` is genuinely hitting Razorpay's test-mode API
now. Cancelled the test order afterward to restock inventory; nothing test-related
left in the database. Completing an actual payment (entering a Razorpay test card in
the checkout widget) needs a real browser, which this session doesn't have — that
last step is for the client to do directly at `/checkout`, using one of Razorpay's
published test cards (e.g. `4111 1111 1111 1111`, any future expiry, any CVV).

---

## 2026-09-13 — Admin dashboard overhaul: chrome, Overview, Users

Client hit real usability problems in the admin dashboard: no way back to a list from
inside a form, save buttons buried in the form flow, cramped left-aligned layouts, and
no mobile responsiveness. Also asked for two new sections: an **Overview** dashboard
(first thing admins see, with charts/KPIs and a time-range filter) and a **Users**
section to view/create/delete accounts — explicitly flagged this needed new backend
endpoints and asked for a plan first.

**Research done before building**: checked the live DB's actual FK behavior for
deleting a profile rather than assuming — `orders.profile_id → profiles.id` is `ON
DELETE SET NULL` (deleting a user detaches their past orders, never blocks on or
deletes them) and `profiles.id → auth.users.id` is `ON DELETE CASCADE` (deleting the
Supabase Auth user automatically removes the `profiles` row). This let `deleteUser`
be a single `supabaseAdmin.auth.admin.deleteUser()` call with no separate Prisma
delete needed. Also confirmed `apps/api/src/lib/supabase.ts` already exports
`supabaseAdmin` (used by `scripts/create-admin.ts`) — the exact client needed for
user create/delete, no new dependency.

- **Sidebar**: rewritten as a Client Component (`AdminNav.tsx`) with a
  collapsed/expanded desktop state (persisted in `localStorage`) and a mobile
  off-canvas drawer, owned by a new `AdminShell.tsx` wrapper so
  `app/admin/layout.tsx` can stay a Server Component doing only auth checks. Sign
  out and "Back to site" moved to a bottom-pinned block in the sidebar, separated by
  a divider from the nav links, out of the topbar entirely (topbar now just shows
  the signed-in email + a mobile menu toggle). Small inline SVG icons per nav item —
  no icon library. Nav order: **Overview → Orders → Products → Reviews → Blog →
  Users**.
- **New shared `AdminPageHeader`** (back-link + title + actions slot) used on every
  admin list/detail/form page — the direct fix for "no way back to a list."
- **Save buttons moved to the top-right** via a plain `<button type="submit"
  form="<id>">` in each page's `AdminPageHeader`, referencing the `<form id="...">`
  rendered elsewhere on the page — valid HTML, no state-lifting between the page
  (Server Component) and the form (Client Component). Double-submit protection
  moved from a `disabled` button state to a `useRef` guard inside each form's submit
  handler, since the external button has no way to reflect that state without
  unnecessary complexity.
- **Forms restructured into bordered section cards** (`ProductForm`, `ReviewForm`,
  `BlogForm`, new `UserForm`) inside a wider container, fields grouped two-up on
  desktop via `grid sm:grid-cols-2`, single column on mobile — replacing the old
  single narrow `max-w-lg` column.
- **Overview** (`GET /admin/stats?range=7d|30d|90d|all`): total orders, revenue (sum
  of orders **not** `pending`/`cancelled` — i.e. actually paid), new + total
  customers, orders-by-status breakdown, and a daily `{orders, revenue}` series via
  one `$queryRaw` with `date_trunc('day', created_at)` — genuinely not expressible
  through Prisma's query builder (the documented raw-SQL exception in
  `database.md`). Time range is preset tabs (7d/30d/90d/all), not a custom
  date-range picker — same Link-based tab pattern as the orders status filter, no
  new dependency. Charts are hand-rolled SVG (`BarChart.tsx`) — a few dozen data
  points with no zoom/pan need doesn't justify a charting library.
- **Users**: list (with order count via Prisma's `_count`), detail (profile + their
  order history), create (email/password/name/phone/role — creates the Supabase
  Auth user then the `Profile` row immediately, not lazily on first login), delete.
  Delete is blocked server-side for self-delete (`400`) and for the last remaining
  admin (`409`); the confirmation dialog states the real, verified consequence
  ("their N past orders will stay on record but no longer be linked to an account"),
  never implies orders are deleted. No edit/role-change in this pass — not
  requested.

**Verified for real, not just by reading the code**: hit `GET /admin/stats` at
multiple ranges and cross-checked the numbers and daily-series length directly
against the database; created a real user via `POST /admin/users`, confirmed it
rendered correctly on both the list and detail pages, then deleted it; separately
placed a real order as a throwaway customer, deleted that customer, and confirmed
the order survived with `profileId` set to `null` (not deleted) exactly as the FK
research predicted; confirmed self-delete and last-admin-delete both reject with the
right status codes; confirmed the back-link and `form`/`id` save-button wiring are
actually present in the rendered HTML for a representative page; confirmed the
mobile-drawer and collapse-toggle markup/classes are present. Responsiveness and the
collapse interaction itself are visual/interactive behaviors I can't fully verify
without a real browser — flagging that explicitly rather than claiming a look I
didn't see, same as the earlier gallery-autoscroll work.
`lint`/`typecheck`/`test` (48 web tests)/`build` green for both apps; no schema
migration in this change.

(Also found and cleaned up ~10 more stray `tsx watch`/`next dev` processes that had
accumulated again over the course of this session, exhausting file descriptors —
same root cause as before, now just routinely killed before each dev-server restart.)

---

## 2026-09-13 — Order tracking: exact IST timestamps + WhatsApp communication log

Client wants exact placed/last-updated times in IST on the orders section (not just a
date), and a way to track which WhatsApp updates (order confirmed, dispatched,
delivered) have actually been sent per order — they run customer comms manually over
WhatsApp and left the exact tracking mechanism to my judgment.

- **Communication tracking is independent of `Order.status`**, not folded into it: an
  order can be `shipped` with the dispatch message still unsent, or the reverse. Added
  three nullable timestamp columns instead — `confirmationMsgSentAt`,
  `dispatchMsgSentAt`, `deliveryMsgSentAt` (`null` = not sent, a timestamp = when
  marked sent) — rather than touching the `status` CHECK constraint or its
  `ALLOWED_TRANSITIONS` table at all.
- One new endpoint, `PATCH /admin/orders/:id/communication` (body: `{ field:
  "confirmation"|"dispatch"|"delivery", sent: boolean }`), toggles the matching column
  to now or back to `null` (`sent: false` corrects a misclick, doesn't delete
  anything). `updatedAt` bumps automatically via Prisma's `@updatedAt` on either this
  or a status change — no separate "last updated" tracking needed, just displaying the
  field that was already there.
- New `formatIST()` (`apps/web/src/lib/date.ts`, `Intl.DateTimeFormat` pinned to
  `Asia/Kolkata`) replaces the old date-only `toLocaleDateString()` display on both the
  admin orders list/detail and the customer's own `/account/orders` list/detail — same
  underlying data, no reason to show the admin a more precise time than the customer
  sees for their own order.
- Migration `20260913120000_add_order_communication_log` — hand-written SQL again
  (same reason as the review-media migration: the live DB's `profiles_id_fkey` →
  `auth.users` cross-schema reference blocks `prisma migrate diff --from-url`). Purely
  additive, all three columns nullable with no default — every existing order gets
  `null` (not sent) automatically.
- Also fixed two now-stale comments spotted while in this code: `Order.profileId`'s
  Prisma comment still said "guest checkout is allowed" (guest checkout was removed
  earlier the same day, see below).

**Verified for real**: created a real order via the live API, confirmed all three
communication fields default to `null`; toggled confirmation and dispatch on, then
undid confirmation — confirmed each field moves independently and `updatedAt` bumps
each time; confirmed the admin order detail page renders the "Placed"/"Last updated"
IST lines and the WhatsApp panel's "Not sent yet" / "Sent `<time>`" states correctly;
confirmed the same exact IST times render on the customer's own `/account/orders` list
and detail page. Cleaned up the test order (cancelled to restock) afterward.
`lint`/`typecheck`/`test` (48 web tests, including new `formatIST` tests covering the
UTC→IST offset and a midnight rollover) /`build` green for both apps.

(Also cleaned up ~10 stray `tsx watch`/`next dev` processes left over from earlier
in this session — an incorrect `pkill` pattern from several restarts back never
matched them since they run with a cwd-relative `src/index.ts` argument rather than
the full path, so they silently accumulated and eventually exhausted file descriptors
system-wide. Not a code change, just session hygiene worth noting.)

---

## 2026-09-13 — Removed guest checkout; sign-in is now required to order

Guest checkout was explicit original approved scope, but the client caught a real
downstream consequence of it: a guest order has `profileId: null`, so there is no way
to look it up again later — not on another device, not after closing the tab (the
confirmation page's `sessionStorage` stash was the *only* record), and not through any
account, since there was no guest order-lookup API either. Offered three ways to close
this (guest lookup by order number + email, sign-in required, or a post-purchase
account nudge); the client chose **sign-in required** — simplest, and every order now
has a real, queryable owner.

- `POST /orders` now uses `requireAuth` instead of `attachProfileIfPresent`
  (`apps/api/src/routes/order.routes.ts`) — a request with no/invalid token gets a
  real `401`. `attachProfileIfPresent` had no other caller, so it was deleted
  (`apps/api/src/middleware/auth.ts`) rather than left as dead code.
- `order.service.ts`'s `createOrder` now takes `profileId: string` (not `string |
  null`) — tightened to match the new guarantee for orders created from here on.
  Historical guest orders in the DB still have `profileId: null`; nothing migrates
  them, they just stay as they are.
- Frontend gate mirrors the existing `/account` and `/admin` pattern exactly:
  `proxy.ts` redirects an anonymous request away from `/checkout` to
  `/login?next=/checkout`, and `checkout/page.tsx` re-checks server-side
  (belt-and-suspenders, same as `account/orders/page.tsx`).
- `OrderConfirmationClient.tsx`'s "guest with nothing stashed" dead-end was replaced
  with a genuine "Sign in to view this order" prompt (linking to
  `/login?next=/order-confirmation/<id>`) — now a real, if rare, path (session lapsed
  between paying and landing on the page) rather than the expected common case.

**Verified for real**: after the change, an unauthenticated `POST /orders` against the
live API returns `401`; a real logged-in checkout still creates and pays for an order
exactly as before (re-ran the same live order-creation + mock-payment-verify flow used
to validate `PAYMENTS_MOCK` earlier, this time with a real bearer token). `lint` /
`typecheck` / `test` / `build` green for both apps.

---

## 2026-09-13 — Product creation image upload, 4-image cap, review media, gallery autoscroll

Client feedback: creating a new product had no way to attach photos (only the edit
page's `ImagesPanel` could), and admin-authored reviews only supported a rating and
text — no photos or video. Also asked for a hard cap of 4 images per product and an
auto-advancing gallery when a product has more than one photo. Sizes/price/description
were already covered by the existing `ProductVariant`/`Product` fields — no gap there.

- **Product images, capped at 4, enforced on both ends.** `addImage`
  (`apps/api/src/services/product.service.ts`) now counts a product's existing images
  and throws a real `409` past 4; the "New product" form's file picker refuses more
  than 4 client-side too. **Verified live**: attached 4 images to a real throwaway
  product via the actual admin API, then confirmed a 5th got the real `409`.
- **Product creation is create-then-attach in one submit handler**, not a new
  multipart endpoint: `ProductForm.tsx`'s create path calls `createProduct()`, then
  loops any picked files through the already-existing `uploadProductImage` +
  `addImage` calls before navigating to the edit page. No new backend endpoint.
- **Review media = two new `Review` columns, not a join table**: `imagePaths
  String[]` (max 4) and `videoPaths String[]` (max 2), both Postgres native arrays
  defaulting to `'{}'`. Migration `20260913100000_add_review_media` — **hand-written
  SQL**, not `prisma migrate diff`-generated: the live DB's `profiles_id_fkey` →
  `auth.users` cross-schema reference makes Prisma's introspection-based diff refuse
  to run (`P4002`) without a `schemas` multi-schema config change not worth making for
  a two-column addition. Purely additive, applied via `prisma migrate deploy` against
  the real dev DB — confirmed existing reviews (including the seeded demo ones) came
  back with empty arrays automatically, no backfill needed.
- **Caps of 4 images / 2 videos per review** are a documented assumption — the client
  only specified a cap for products. Enforced with `z.array(...).max(n)` in
  `review.validator.ts`, verified live (5 image paths and 3 video paths both got real
  `400`s).
- **Review media reuses the `product-images` bucket** under a `reviews/<token>/...`
  prefix, instead of asking for a second bucket. For a new review, `<token>` is a
  client-generated draft UUID (there's no review id yet); for an existing one, it's the
  review's real id. Unlike product images, review media isn't a nested resource with
  its own endpoint — the paths just go straight into the `POST`/`PATCH /admin/reviews`
  body alongside everything else, so there's no create-then-attach dance needed there.
- **Removing a review's existing media** only drops it from the array (`PATCH`), it
  doesn't delete the underlying Storage object — an orphaned file is harmless at this
  scale. Documented as a simplification, not a silent gap.
- **Gallery autoscroll**: a plain `setInterval` in `ProductGallery.tsx` (4.5s),
  skipped for a single image and for `prefers-reduced-motion` users, and restarted on
  every index change (including a manual thumbnail click, which also calls
  `setActiveIndex`) so a click doesn't get immediately overridden. No carousel library.
- **Created the `product-images` Supabase Storage bucket** (public, 20MB file limit) —
  this had been an outstanding manual "Supabase console prerequisite" since Phase 1/2
  and was blocking the upload flow built here. Done via the Storage Admin REST API
  under the client's standing authorization to set up infrastructure directly.
  **Could not add the accompanying `INSERT` RLS policy on `storage.objects`** — that
  requires raw SQL against the live database, and this sandbox's safety classifier
  refuses raw DDL/policy writes to a shared production-adjacent DB (the same
  restriction hit earlier in this project for direct `psql` access). **The upload
  flow will 403 until this policy is added** — the client needs to run this once in
  the Supabase SQL Editor:
  ```sql
  CREATE POLICY "Authenticated users can upload to product-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');
  ```
  Everything else (max-4 enforcement, review media fields, gallery autoscroll,
  rendering) was verified against the real API/DB using fake storage-path strings,
  which don't require the bucket to accept uploads — only the actual browser upload
  button is blocked until this one SQL statement is run.

`lint`/`typecheck`/`test`/`build` green for both apps. All throwaway admin accounts,
test products, and test reviews created during verification were deleted afterward.

---

## 2026-09-13 — Mock Razorpay payments (PAYMENTS_MOCK)

No real Razorpay account exists yet — `.env` has literal placeholder credentials
(`rzp_test_placeholder`). The client wanted to actually buy a product end-to-end to see
checkout work, which the real integration can't do against fake keys (Razorpay's API
would reject the order-creation call, and the checkout.js widget can't open against a
fake `key_id` either).

Added a `PAYMENTS_MOCK` server env flag (`apps/api/src/config/env.ts`), off by default,
on in the local `.env`/`.env.local` right now:

- `order.service.ts`'s `createOrder` skips the real `razorpay.orders.create()` call when
  set, using a synthetic `mock_order_<orderId>` provider id instead — never mistakable
  for a real Razorpay id.
- `payment.service.ts`'s `verifyAndRecordCheckoutPayment` skips the HMAC signature check
  when set (there's no real signature to verify — Razorpay never signed a mock order).
- Frontend mirror `NEXT_PUBLIC_PAYMENTS_MOCK` (`CheckoutClient.tsx`): when set, the real
  Razorpay widget is never opened; a "Simulate successful payment" button drives the
  exact same `verifyPayment` → confirmation flow with a synthetic payment id and
  `razorpaySignature: "mock"`. No duplicated logic — `handlePaymentSuccess` is shared
  between the real widget's callback and the mock button.
- Both flags must be **off in production** — documented directly in `.env.example` next
  to each. The mock path is gated entirely by a server-side env var, never by anything
  client-controlled, so a client can't self-elect into skipping signature verification.

**Verified for real**: restarted both dev servers with the flag on, created a real guest
order via `POST /orders` against the running API (not a unit test), confirmed the
payment row got a `mock_order_` provider id and stock was decremented (100 → 98), then
called `POST /payments/verify` with a synthetic payment id and confirmed the order moved
`pending → confirmed` and the payment moved `created → paid`. Afterward, cancelled that
test order through the real admin API (restocking it back to 100) and deleted the
throwaway admin account used to do it — nothing test-related left in the database.
`lint`/`typecheck`/`test`/`build` green for both apps after the change.

---

## 2026-09-13 — Phase 2 admin dashboard built (products/orders/reviews/blog CRUD)

Built the full admin dashboard at `apps/web/src/app/admin/**`, wired to the
admin API that already existed in `apps/api` (see the `GET /api/admin/me`
entry below for the one backend addition this required). Key decisions:

- **Admin chrome, not storefront chrome**: rather than moving every existing
  route into a `(storefront)` route group, added one small Client Component
  `components/layout/SiteChrome.tsx` that skips the storefront `<Header>`/
  `<Footer>` under `/admin` (checked via `usePathname()`); `app/admin/layout.tsx`
  supplies its own sidebar+topbar chrome instead. Smaller, lower-risk diff for
  the same effect on a project with no test coverage over the storefront's
  routing structure.
- **Two-layer auth gate**, mirroring the existing `/account` pattern: `proxy.ts`
  now also redirects an anonymous request away from `/admin/**` (cheap
  session-exists check); `app/admin/layout.tsx` then calls the new
  `GET /admin/me` and redirects to `/` on a 401/403 — this is what actually
  surfaces "logged in but not an admin" to the UI, since the real
  authorization boundary is `requireAdmin` on the API, not anything client-side.
- **Variants and images are edited inline on the product detail page**, not
  separate routes — matches the backend's own nesting (variant/image create is
  nested under a product, update/delete is flat by id).
- **No toast library, no modal-heavy UI**: inline success/error text under each
  form's submit button; a native `<dialog>`-based `Modal.tsx` (zero
  dependencies) is used only for delete confirmations.
- **New `components/ui/` primitives** added in the existing style (forwardRef,
  plain `className` merge, no new dependency): `Table`, `Modal`, `Textarea`,
  `Checkbox`.
- **No GET /admin/reviews/:id exists on the backend** (only list + create/
  update/delete by id) — the review edit page fetches the full admin review
  list and finds the one being edited client-side. Fine at this scale since
  no admin list endpoint has pagination anyway; not worth adding a backend
  endpoint for.
- **Order status control** mirrors the backend's `ALLOWED_TRANSITIONS` table
  exactly in `lib/orderStatus.ts`, so the UI only ever offers valid next
  statuses — the backend remains the actual authority (still returns 409 if
  it ever disagrees).
- **Image upload** (`lib/storage.ts`'s `uploadProductImage`) still needs the
  `product-images` Supabase Storage bucket + an RLS policy allowing
  authenticated-admin writes, created in the Supabase console — this was
  already flagged as a Phase 2 prerequisite when the storefront was built and
  still isn't done. Told the client directly; nothing else in the admin
  dashboard depends on it.

**Verified for real, not just by reading the code**: for every admin section
(products, orders, reviews, blog) — created a throwaway admin account via
`create-admin.ts`, built a real Supabase session cookie from a password-grant
login (matching `@supabase/ssr`'s actual cookie encoding), and fetched each
page through the running dev server with that cookie. Confirmed: unauthenticated
`/admin` redirects to `/login`; an authenticated admin sees the real dashboard
chrome with their own email; the products list/detail pages render the real
"Peculiar Pads" demo product, its variants, and its images panel; a bogus
product id renders the admin not-found page; the orders list renders all
status-filter tabs and a real order; an order already in a terminal status
(`cancelled`) correctly shows no further transition buttons; the reviews list
resolves real product names (not "Unknown product") for a real published
review; the blog list shows both real demo posts, and the edit form loads a
real post's title/slug/meta fields into the inputs. Every throwaway admin
account was deleted afterward via the Supabase Admin API — nothing test-related
was left in the database. `pnpm lint`, `typecheck`, `test` (46 web tests, 7 api
tests, including new tests for `parseRupeesToPaise`, the order-status
transition table, and the product/variant admin validation schemas), and
`build` are all green for both apps.

---

## 2026-09-13 — Phase 2 admin dashboard: added GET /api/admin/me

Starting the admin dashboard frontend surfaced a real gap: `requireAdmin` checks
`req.profile.role` internally on every `/api/admin/*` request, but nothing ever
serialized that profile back to a client. Without it, the frontend has no clean way
to confirm "this logged-in user is actually an admin" before rendering the dashboard
shell — it would have to infer admin-ness from whether some other admin call happens
to succeed, which is both fragile and a worse UX (a flash of dashboard UI before a
403 redirect).

Added `GET /api/admin/me` (`apps/api/src/controllers/profile.controller.ts`,
registered directly on `adminRouter` in `routes/index.ts` before the resource
sub-routers) — trivial handler, `res.json(req.profile)`, since `requireAuth` +
`requireAdmin` already ran and loaded the profile. Added `ProfileSchema` to
`docs/schemas.ts` and the `/admin/me` path to `docs/paths.ts` for OpenAPI parity with
every other endpoint.

**Verified for real** against the dev Supabase project, not just read from the code:
created a throwaway admin account via `create-admin.ts`, logged in via Supabase's
password grant to get a real JWT, confirmed `GET /api/admin/me` returns the full
`Profile` with `role: "ADMIN"`, and confirmed a request with no token gets `401`.
Deleted both the throwaway admin account and an incidental throwaway customer
account afterward via the Supabase Admin API — nothing test-related left behind in
the database.

---

## 2026-09-13 — Fixed real cropping bugs in two placements (client-reported)

Client reported: "Is this how u intended to use this image because it is cropped and
make no sense." Checked actual pixel dimensions of all four generated images via
`sips -g pixelWidth -g pixelHeight` rather than guessing: `peculiar-home.png`,
`about.png`, `package.png` are exact 1254×1254 squares; `texture.png` is 1659×948
(~1.75:1). Cross-referenced against each container's CSS aspect ratio and found two
real mismatches, both `object-cover` cropping a source image into a container shaped
nothing like it:

- `FeaturedProduct.tsx` displayed the square `package.png` inside an `aspect-[4/5]`
  (portrait) container — forced a ~20% crop off both left/right edges, cutting into
  the composition. Fixed by changing the container to `aspect-square`, matching the
  photo exactly (zero crop).
- `TextureDivider.tsx` displayed `texture.png` (~1.75:1) inside a **full-width**
  (`100vw`) band at a **fixed short height** (`h-40`/`h-56`, 160–224px) — on normal
  desktop widths (1200–1900px) that's an effective target ratio of ~6:1 to ~8:1, far
  more elongated than the source, so `object-cover` was cropping out the large
  majority of the image vertically. Fixed by containing it within the site's normal
  `max-w-6xl` content width (matching every other section) and using a taller fixed
  height (`h-56`/`h-72`) — brings the effective ratio close enough to the source that
  the remaining crop is mild and unnoticeable, instead of full-bleed and severe.

**Verified for real**: typecheck/lint clean; restarted the dev server with a clean
`.next` cache; fetched the homepage HTML and confirmed both `<Image>` elements render
with the new classes; fetched the actual optimized bytes through `/_next/image` for
both `texture.png` and `package.png` (200 for both), not just confirmed the tag exists.

---

## 2026-09-13 — Real imagery wired in (client-generated, AI image tools)

Neither this session nor the deployed environment has an image-generation tool, and
fetching/hotlinking arbitrary stock photos would mean guessing URLs and licensing on
the client's behalf for a real commercial site — both refused earlier in this thread.
Resolved by having the client generate images themselves (Gemini/ChatGPT, so they own
the licensing) from detailed prompts I wrote per placement (subject, lighting, color
palette tied to the `#741C47` brand color, aspect ratio matched to the actual layout
container). They dropped 4 PNGs into `apps/web/public/`.

- `peculiar-home.png` → hero (homepage), `about.png` → new two-column About page
  header, `texture.png` → a purely decorative full-width divider band between
  Testimonials and the Blog section (no text overlaid, so no contrast/legibility risk
  to manage).
- `package.png` → **flagged before use, not used silently**: the generator hallucinated
  a complete fake product box — a logo, the tagline "Comfort for your unfiltered days,"
  "Soft / Safe / Confident / You," a full burgundy colorway — none of which is the
  client's real approved packaging. Surfaced this explicitly (a customer could
  reasonably expect their delivered box to match this exact design) before using it as
  the literal product photo. **Client's explicit call**: use it as-is for now, aware
  it's a placeholder, not real packaging — recorded here so it isn't mistaken for an
  approved design decision later. It's now the fallback image in `ProductGallery`,
  `FeaturedProduct`, and `ProductCard` (replacing the earlier `PackageIllustration`
  SVG, which was deleted as dead code once nothing referenced it) — swapped out
  automatically wherever a product has real photography via `ProductImage.storagePath`.
- All four images live in `public/` (not Supabase Storage) since they're static
  brand/marketing assets, not per-product data — `next/image` optimizes them locally
  same as any other static asset.

**Verified for real**: typecheck/lint clean; booted the dev server and fetched the
actual optimized image bytes through `/_next/image` (not just confirmed the `<img>` tag
exists) — all four return 200, correctly resized, and compressed from ~2.5MB PNG
sources down to a few hundred KB served.

---

## 2026-09-12 — Admin account, demo product, demo content; richer homepage

Created the first admin account and seeded real demo data through the **actual admin
API** (not a direct DB script) — exercises the real validated code path:
`apps/api/scripts/create-admin.ts` (reusable — `pnpm --filter api exec tsx
scripts/create-admin.ts <email> [password]`) creates a Supabase Auth user + a `Profile`
row with `role: ADMIN`. Credentials given to the client directly in chat (their explicit
request — "give me credentials"), not written to any file in the repo.

- **Demo product**: "Peculiar Pads" (slug `peculiar-pads`), 6 variants — Small/Medium/Large
  × Regular Pack/Jumbo Pack, prices ₹149–₹329, realistic stock levels. No product images
  (no Storage bucket or upload flow exists yet — Phase 2 prerequisite, unchanged from
  earlier). **Prices, stock, and copy here are placeholder/demo values**, not real
  business decisions — confirm before launch.
- **2 blog posts**, real substantive content (sizing guide, "why one product") — not
  lorem ipsum, written to actually be useful and SEO-relevant, but still placeholder
  copy pending the client's own voice/review.
- **3 reviews** for the demo product, written as plausible customer feedback for a
  testimonials section — clearly fictional demo content, not real customer reviews;
  must be removed/replaced before launch, not left live.

**Homepage expanded significantly** (client feedback: "needs more sections and more
content," "lacks visual aesthetics"):
- Added **How It Works** (3-step), **Testimonials** (real seeded reviews, hidden when
  none exist), **FAQ** (native `<details>`/`<summary>` accordion — no JS state needed).
  Full order: Hero → Features → How It Works → Shop (featured product) → Testimonials →
  From the Blog → FAQ → About teaser → Final CTA, alternating white/muted section
  backgrounds for visual rhythm.
- **`FAQ`'s answers encode real policy claims** (7-day returns, ₹499 free-shipping
  threshold, delivery estimate) that are placeholder assumptions, not confirmed
  business decisions — flagged in a code comment; must be confirmed before launch since
  these read as real commitments to a customer.
- **Original illustration for "no photo yet" states**: since no real product
  photography exists and none can be fetched, built `PackageIllustration` (an original
  line-art SVG, not a fake photo or a hotlinked stock image) used consistently in
  `ProductGallery`, `FeaturedProduct`, `ProductCard`, and the hero. Deliberately
  illustrative rather than attempting to fake a photograph.
- The hero, which was fully typographic after the prior redesign, now includes this
  illustration as a real two-column visual — direct response to "lacks visual
  aesthetics... like images."

**Verified for real**: seeded data via live `curl` calls against the running API with a
real admin bearer token (signed in via Supabase's own `/auth/v1/token` password grant,
not a synthetic token) — confirms the whole auth chain works, not just that the DB rows
exist. `pnpm build` afterward shows `generateStaticParams` actually pulling the real
product and both real posts into SSG output (`/products/peculiar-pads`,
`/blog/how-to-pick-the-right-pad-size`, `/blog/why-we-only-sell-one-product` all
prerendered) — not asserted, observed in the build's own route table. Booted the dev
server and `curl`'d the homepage, product page, and blog list to confirm the real price
(₹149), real sizes, real review authors, and both post titles actually appear in the
served HTML.

---

## 2026-09-12 — Homepage/design redo after direct client feedback

The client (an experienced frontend dev) reviewed the Phase 1 build and rejected the
initial homepage and design system outright ("looks completely shit," too much brand
color, no real homepage sections). Rebuilt rather than patched:

- **Dark mode removed entirely** — light theme only, by explicit instruction. Simpler
  `globals.css` (no `prefers-color-scheme` block, no `[data-theme]` handling).
- **Real typography**: `Fraunces` (display/headings) + `Public Sans` (body), loaded via
  `next/font/google`, replacing the plain system-font-stack placeholder from the
  original plan. The earlier "wait for a real design pass before picking a typeface"
  caution was superseded by the client explicitly demanding a premium redesign now.
- **Brand color usage tightened further**: removed it from the logo wordmark (now plain
  foreground-colored) and from the hero (no colored background/shapes) — it now appears
  only on primary buttons, small icons, links, and eyebrow labels, never as a surface
  fill of any size.
- **Homepage rebuilt with real e-commerce IA**: Hero (typographic, trust-signal row) →
  Features (icon grid) → Shop (a `FeaturedProduct` spotlight once a product exists,
  clean empty state until then — no more bare product grid) → "From the blog" (renders
  only when real posts exist, omitted otherwise rather than showing another empty box)
  → About teaser → closing CTA band.
- **New `/about` page** added (brand story), linked from header + footer. `EmptyState`'s
  dashed border was replaced with a solid muted panel everywhere it's used (cart, shop
  section, etc.) — dashed borders read as "unfinished placeholder," which was itself
  part of the complaint.
- Verified for real each time: `lint`/`typecheck`/`test`/`build` all pass; booted the
  dev server and used `curl` to confirm the new sections actually render (not just
  "the code exists") and that the served CSS bundle has zero `prefers-color-scheme`
  occurrences and real `@font-face` entries for Fraunces.
- Published two versions of a static HTML mirror (same real CSS/copy, standalone) as a
  claude.ai Artifact so the client could review the actual design without needing the
  dev server running, given no browser-automation tool was available in this session.

---

## 2026-09-12 — Frontend Phase 1 built (storefront + checkout); Next.js 16 gotchas

Scaffolded `apps/web` with `create-next-app` (Next.js 16.3.5, React 19.2.8, Tailwind v4)
and built out the client-confirmed Phase 1 scope: storefront, cart, checkout, order
confirmation, account orders, auth, blog, and SEO plumbing. Admin dashboard is Phase 2,
deliberately not started — see the approved plan
(`/Users/shubhams_mac/.claude/plans/plan-the-frontend-with-fuzzy-lecun.md`) for the full
design and its stated assumptions (guest checkout, cart-as-drawer, Markdown blog content,
email+password-only auth, client-side Supabase Storage URL resolution).

**Next.js 16 breaking changes vs. training-data knowledge** (the framework's own
generated `AGENTS.md` warns about this explicitly — worth remembering for any future
Next.js work in this repo):
- `middleware.ts` is renamed to **`proxy.ts`**, exporting `proxy()` instead of
  `middleware()`. Same request/response model and matcher config otherwise.
- `error.tsx`'s callback prop is **`retry`**, not the classic `reset`.
- `fetch()` is **not cached by default** anymore — caching is opt-in via
  `{next: {revalidate}}` or `export const revalidate` on the segment, not opt-out.
- A new opt-in "Cache Components" model exists (`cacheComponents` config +
  `"use cache"`) but is off by default — deliberately did not enable it; the classic
  model (`export const revalidate`, `generateStaticParams`) is simpler and sufficient
  at this project's scale.
- Auto-generated `PageProps<'/route'>`/`LayoutProps<'/route'>` helper types exist but
  depend on `.next/types/` having been generated by a prior `dev`/`build` — used plain
  manual `Promise<{...}>` prop typing everywhere instead, so `pnpm typecheck` stays a
  standalone command decoupled from a build step (matches `apps/api`'s pattern).

**Other decisions worth recording:**
- `apps/api/tsconfig.json`-style `moduleResolution: "Node"` doesn't resolve
  `@supabase/server`-style package subpath exports — n/a here since `apps/web` never
  imports server-only Supabase admin code, but `moduleResolution: "bundler"` (Next's
  default for this scaffold) already handles everything `apps/web` needs.
- **Design tokens**: semantic CSS custom properties in `globals.css` (Tailwind v4
  CSS-first `@theme inline`), not a `tailwind.config.js` — components reference
  `bg-brand`/`text-foreground`/etc., never raw palette classes. Brand scale (`brand-50`
  through `brand-950`) derived around the client's `#741C47`, with `brand-700` pinned
  to that exact value. Dark mode flips which shade serves as "the" accent (400 instead
  of 700) via `prefers-color-scheme`, since a dark-on-dark 700 reads muddy.
- **`VariantSelector` design correction found while writing its test**: the initial
  "disable a pill when it doesn't pair with the currently-selected other axis" approach
  deadlocks on a sparse variant grid (e.g. only Medium+Regular and Large+Jumbo exist,
  no cross combinations) — both non-selected pills end up simultaneously disabled from
  the initial state, with no click available to escape it. Fixed by having a click
  snap the *other* axis to its first valid pairing instead of disabling anything —
  every pill stays clickable, and a valid combination is always reachable in one click.
  Caught by writing `VariantSelector.test.tsx` against a deliberately sparse grid, not
  by inspection — a concrete example of why the "worth testing" component list in the
  plan earned its place.
- **`react-hooks/set-state-in-effect` lint rule** (new in this eslint-config-next
  version) flags the standard "hydrate from localStorage/sessionStorage after mount"
  pattern used in `CartProvider` and `OrderConfirmationClient`. Both are legitimate,
  deliberate one-time reads of a browser-only API that cannot happen during SSR — used
  a targeted `eslint-disable-next-line` with an explanatory comment rather than
  restructuring to `useSyncExternalStore`, which would add real complexity for no
  correctness benefit at this scale. The checkout page's email-prefill case *did* have
  a cleaner fix — derived the prefilled value at render time instead of syncing via an
  effect — used that instead of suppressing the rule there.
- **Test environment quirk**: this machine's Node 26 has its own experimental global
  `localStorage` that collides with jsdom's implementation inside Vitest (throws
  "not available because `--localstorage-file` was not provided" instead of working).
  Fixed with a small in-memory `Storage` polyfill in `vitest.setup.ts` rather than
  chasing Node/jsdom version compatibility. Also had to wire up
  `@testing-library/react`'s `cleanup()` manually in `afterEach` — its auto-cleanup
  detection needs a global `afterEach`, which doesn't exist since `test.globals` isn't
  enabled in `vitest.config.ts`.
- Added `@tailwindcss/typography` (one small, well-scoped dependency) for rendering
  admin-authored Markdown blog content — judged worth it over hand-rolling prose CSS.
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `NEXT_PUBLIC_SITE_URL` added to `.env.example`/
  `.env`/`apps/web/.env.local` (Next.js only reads env files from its own directory,
  not the monorepo root — `apps/web/.env.local` mirrors the relevant root values).

**Verified**: `pnpm lint`/`typecheck`/`test`/`build` all pass (23 tests). Ran a real
production build (`next build`) against the live backend — confirmed the full route
table renders with the intended strategy per route (static/ISR/SSG/dynamic) and no
build-time errors. Booted the dev server and used `curl` to inspect actual rendered
output (no browser automation tool was available in this session): home and blog show
their real empty states (DB is genuinely empty, not a hardcoded string), login/signup
render their forms, `robots.txt`/`sitemap.xml` emit correct content, a nonexistent
product slug renders the custom 404, an unauthenticated request to `/account/orders` is
correctly redirected to `/login?next=...` by `proxy.ts`, the Organization JSON-LD
parses as valid JSON, and the dev server log shows no hydration or runtime errors across
all of the above.

**Not verified** (explicitly, not silently assumed working): the interactive
click-through flows — add-to-cart, cart drawer interactions in a real browser, the full
checkout→Razorpay→verify→confirmation path, and account-orders with a real session —
since there's no seed product data, no admin account yet to create one through (Phase 2
isn't built), no real Razorpay keys, and no browser automation tool available in this
session. `VariantSelector`'s logic is verified via component tests with real variant
shapes, which is not the same as verifying the full page in a live browser.

---

## 2026-09-12 — API docs: generated from the existing Zod validators, not hand-written

Used `@asteasolutions/zod-to-openapi` + `swagger-ui-express` instead of hand-written
Swagger/JSDoc comments. Reason: every endpoint already has a Zod validator for its input
— generating the OpenAPI spec from those schemas means the docs and the actual runtime
validation can never drift apart, which hand-maintained doc comments can't guarantee.

- `src/docs/registry.ts` — the shared `OpenAPIRegistry` + `bearerAuth` security scheme.
- `src/docs/schemas.ts` — response-shape schemas (what services return: `Product`,
  `Order`, etc.), separate from the request validators in `src/validators/` since input
  and output are different concerns even when related.
- `src/docs/paths.ts` — one `registry.registerPath()` per endpoint, importing the real
  validators directly for request bodies/params/query.
- `src/docs/openapi.ts` — generates the document once at import time.
- `src/routes/docs.routes.ts` — serves Swagger UI at `/api/docs` and the raw spec at
  `/api/docs/openapi.json`. Public, no auth — it documents shapes, not data, and having
  it open is more useful to the client than gated.
- Verified the generated spec actually covers everything: grepped every real
  `router.<method>(...)` call across `src/routes/*.ts` (34) and confirmed it matches the
  spec's method+path count (34) exactly — not just "does it build," but "does it
  actually describe the whole API."
- `apps/api/tsconfig.json`'s `moduleResolution`/`module` were already `NodeNext` (from
  the `@supabase/server` integration) — `@asteasolutions/zod-to-openapi`'s subpath
  exports resolved without further changes.

---

## 2026-09-12 — Reconciled schema with a pre-existing live database; @supabase/server; real bug found & fixed

The client shared real Supabase credentials and a real Postgres connection string
mid-session. Introspecting the database (`prisma db pull`, plus direct `psql` queries for
CHECK constraints, triggers, RLS, and row counts) found a **substantial, well-designed
schema already live**: `products`, `product_images`, `product_variants`, `orders`,
`order_items`, `payments`, `payment_events`, and `idempotency_keys` — all empty (0 rows),
no RLS, no triggers, no Prisma migration history. `profiles`, `reviews`, and `blog_posts`
did not exist.

**Decision: adopt the existing schema as the baseline, extend rather than replace it.**
Concretely:

- Rewrote `prisma/schema.prisma` to map onto the existing snake_case tables via
  `@map`/`@@map` (Prisma-side fields stay idiomatic camelCase; DB columns are untouched).
- **Baselined** the pre-existing tables into Prisma's migration history without touching
  them: generated their exact current DDL via `prisma migrate diff --from-empty --to-url
  <direct-url> --script` (diffs a live connection directly, no schema file needed) and
  recorded it with `prisma migrate resolve --applied` — Prisma now tracks a migration
  history that matches reality, without ever running that SQL.
- Added `profiles` (linked to `auth.users`), `reviews`, `blog_posts`, plus `size` and
  `container_type` columns on `product_variants` (implementing the client's earlier
  confirmed variant model, which the pre-existing schema hadn't caught up to — it only
  had a single free-text `name` column) and `profile_id` on `orders`, via a real,
  reviewed migration applied through `prisma migrate deploy` (the interactive `migrate
  dev` refused to run non-interactively; `deploy` is the correct non-interactive
  equivalent and is what a CI/CD pipeline would use anyway).
- `product_variants.name` is kept (it's `NOT NULL` in the live schema) but is now a
  derived display label (`"${size} - ${containerType}"`) computed by
  `services/product.service.ts`, not admin-editable free text — `size`/`containerType`
  are the canonical fields the app reads/filters by.
- **Adopted the existing idempotency mechanism instead of my earlier per-order design**:
  a generic `idempotency_keys` table (key, operation, request hash, cached response,
  expiry) — better than a unique column on `Order` because it's reusable for any write
  endpoint and replays the *exact* original response (including cached errors) rather
  than just deduplicating. Implemented as `lib/idempotency.ts`'s
  `runIdempotentOperation()`: claims the key via the unique constraint, runs the
  operation once, caches success or `HttpError` outcomes, and releases the claim (so a
  retry can genuinely re-attempt) only on a truly unexpected failure.
- **Adopted the existing `payment_events` table** for webhook dedup instead of my
  earlier `Payment.razorpayEventId` column — same idea (claim via unique constraint
  before processing), decoupled from the `Payment` row itself, with `processedAt`
  distinguishing "received" from "successfully handled."
- **Order status** uses the live `orders_status_check` CHECK constraint's actual values
  (`pending -> confirmed -> processing -> shipped -> delivered`, or `cancelled`) instead
  of my earlier invented enum. No `failed` order status exists in the live schema — a
  failed payment attempt updates `payments.status` only; the order stays `pending` so
  the customer can retry checkout against the same order, rather than being auto-cancelled.
- **Payment status** likewise uses the live `payments_status_check` values (`created ->
  pending -> paid | failed`, or `refunded`).
- Dropped the leftover `ContactMessage` model/routes from the very first (pre-domain)
  scaffold entirely — never part of the confirmed Peculiar scope, and never existed in
  the live database, so nothing to migrate away from.
- Product images now live in the pre-existing `product_images` table (Supabase Storage
  path + alt text + sort order + primary flag) instead of a `String[]` on `Product`;
  added admin sub-resource routes (`POST/PATCH/DELETE .../images`) matching the
  variants pattern.
- **`@supabase/server`** (the client shared its own setup wizard output, an official
  Supabase package for exactly this) replaces the earlier raw `@supabase/supabase-js`
  auth check. Auth now verifies JWTs **locally against the project's JWKS**
  (`verifyCredentials` from `@supabase/server/core`, cached in memory after first fetch)
  instead of calling `supabase.auth.getUser()` over the network on every request — a
  real scalability improvement given the client's stated "highly scalable" requirement,
  since auth no longer costs a round trip per request. Required `moduleResolution:
  "NodeNext"` in `apps/api/tsconfig.json` (was `"Node"`) to resolve the package's
  `/core` subpath export — this needed pairing with `module: "NodeNext"` too; verified
  it doesn't require extension changes to existing relative imports since this project
  is entirely CommonJS (the extension requirement only applies to ESM-mode files).
  Env vars renamed to Supabase's current naming: `SUPABASE_SERVICE_ROLE_KEY` ->
  `SUPABASE_SECRET_KEY`, added `SUPABASE_JWKS_URL`. Bumped the Node engines requirement
  to `>=22` (this package requires it).
- **`node --version` in this environment is v26**, and Prisma's own update-check
  during `generate`/`db pull` reports newer major versions available (Prisma 8 RC,
  `@prisma/client` 7.x) — stayed on the already-installed 5.22.0 rather than chasing
  latest; no reason tied to this project to upgrade mid-build.

**A real bug was found and fixed via live testing** (not something I'd have caught
without hitting the actual database): every `id` column in this schema is Postgres
`uuid`, and passing a malformed id anywhere (a bogus `variantId` in a checkout request,
in this case) caused Postgres to throw a type-cast error, which surfaced as an opaque
500 "Database error" instead of a clean 400/404 — because `errorHandler.ts`'s
Prisma-error branch never logged the underlying error for codes it didn't specifically
handle, silently hiding the real cause. Fixed both: added a `P2023` case (Prisma's
"inconsistent column data" code) mapping to a clean 400 "Invalid id format," covering
every id-bearing route uniformly, and made the error handler log any Prisma error it
maps to a 5xx (never for handled 4xx cases like this one, to avoid noise). Also tightened
`variantId` in `order.validator.ts` to `.uuid()` for an earlier, more specific error.

**Verified against the live database** (not just typecheck/lint/test/build, which also
all pass): booted the server with real credentials; `GET /api/products` and
`/api/blog` return real empty arrays (not connection errors); JWKS-based auth correctly
rejects a garbage bearer token with a specific error from `@supabase/server`; the full
idempotency flow was exercised end-to-end — a malformed variant id is now a clean 400
before ever reaching Prisma, a well-formed-but-nonexistent variant id gives a clean
business-logic 400, retrying the *same* idempotency key + body replays the exact cached
response, and reusing the same key with a *different* body correctly returns 409.
Confirmed no test data was left behind afterward except one harmless cached-error
idempotency key row (24h TTL, auto-expires; left in place rather than force a raw SQL
DELETE against the live DB for something inert).

**Still open**:
- Real Razorpay keys — order creation still can't actually reach Razorpay
  (`RAZORPAY_KEY_ID`/`SECRET`/`WEBHOOK_SECRET` are placeholders), so the
  create-order-then-Razorpay-order-then-compensate-on-failure path and the whole
  payment-capture lifecycle are unverified against the real gateway.
- No admin user exists yet (`auth.users` is empty) — admin-gated CRUD (products,
  variants, images, reviews, blog, order status) is verified only for the
  auth-rejection path (401/403), not the authorized path. Deliberately did not create a
  Supabase Auth user unprompted, since that's real account creation in their live
  project, not disposable test data like an idempotency-key row — asked the client how
  they want their first admin account set up instead of assuming.
- No cleanup job for stale `pending` orders (this predates the schema reconciliation,
  still true) or expired `idempotency_keys` rows (`expires_at` is stored but nothing
  reaps them yet) — both are cheap to add later, not urgent at current scale.

---

## 2026-09-12 — Real domain: Peculiar (sanitary pads e-commerce) on Supabase

Replaced the placeholder single-product-website assumption with the real business:
Peculiar sells one product ("Pads") across Size x Container-type variants, needs
Razorpay payments, Supabase Auth, an admin dashboard, order tracking, admin-authored
reviews, and an SEO blog. Confirmed with the client:
- Container = a customer-facing pack-type attribute independent of Size (each
  Size x Container combination is its own purchasable variant with its own price/stock).
- Architecture: keep Express + Prisma, point it at Supabase's hosted Postgres, use
  Supabase Auth for login. Chosen over a fuller-Supabase (RLS + Edge Functions) rewrite
  to reuse the working scaffold and keep the team on one runtime (Node/Express) rather
  than splitting logic between Express and Deno edge functions.

Decisions/assumptions made while building this:

- **RLS bypass, authorization in Express**: Prisma connects to Postgres directly
  (service-role-equivalent access), bypassing Supabase's PostgREST/RLS layer entirely.
  All authorization is enforced in Express middleware (`requireAuth`/`requireAdmin`),
  not in Postgres policies. This is the standard pattern when a custom backend owns the
  DB connection. Trade-off: no defense-in-depth if the Express layer has an authz bug.
  Acceptable at this scale/budget; revisit if the app ever needs to expose Supabase's
  auto-generated REST/PostgREST API directly to clients (it currently doesn't).
- **Prisma + Supabase pooler**: `DATABASE_URL` uses Supabase's pooled connection
  (pgbouncer, port 6543) for the running app; a separate `DIRECT_URL` (port 5432) is
  used only by `prisma migrate`, since pgbouncer's transaction pooling mode doesn't
  support the prepared statements migrations need. Both must be supplied.
- **Custom Prisma generator output** (`prisma/generated/client`) rather than the
  default `@prisma/client` resolution — carried over from the earlier scaffold decision,
  still needed now that the schema is bigger.
- **Profile <-> auth.users**: Prisma doesn't manage Supabase's `auth` schema, so
  `Profile.id` isn't a Prisma-level relation to `auth.users(id)` — the FK is hand-added
  in `prisma/migrations/20260912000000_init/migration.sql` (`ALTER TABLE ... REFERENCES
  auth.users(id)`). A `Profile` row is upserted the first time a verified user hits an
  authenticated route (see `middleware/auth.ts`) rather than via a Postgres trigger on
  `auth.users` insert — simpler to build now; worth switching to a trigger if the extra
  upsert-per-request becomes a real cost at scale.
- **Guest checkout allowed**: `Order.profileId` is nullable; `POST /api/orders` accepts
  either a logged-in session or none. There is no guest order-lookup flow yet (would
  need an emailed/token-based link) — `GET /api/orders/:id` only works for the
  authenticated owner or an admin. Guests get their order details from the checkout
  response itself.
- **Cart stays client-side** (localStorage), exactly as the client specified — no
  Cart/CartItem tables. `POST /api/orders` takes the cart contents directly and
  recomputes the total server-side from current `ProductVariant.priceInPaise` — a
  client-submitted total is never trusted.
- **Idempotency**:
  - Order creation requires an `Idempotency-Key` header; a retried request with the
    same key returns the original order instead of creating a duplicate (enforced by a
    DB unique constraint, not just an in-memory check — safe across restarts/instances).
  - Stock is decremented with a conditional `UPDATE ... WHERE stock >= quantity` inside
    a transaction, so two concurrent checkouts for the last unit can't both succeed.
  - Razorpay webhook events are deduped via a unique constraint on `Payment.razorpayEventId`
    (and separately on `razorpayPaymentId`), so a retried webhook delivery — Razorpay
    retries on any non-2xx response — is a harmless no-op. The client-side checkout
    callback (`POST /api/payments/verify`) and the webhook naturally coalesce on the
    same `razorpayPaymentId` unique constraint regardless of which arrives first.
- **Order lifecycle**: `PENDING_PAYMENT -> PAID -> SHIPPED -> DELIVERED`, with
  `CANCELLED`/`FAILED` as terminal branches. Cancelling a `PENDING_PAYMENT` or `PAID`
  order restocks its items; cancellation isn't allowed once `SHIPPED` (that would need a
  returns/refund flow, out of scope for now). "Order tracking" was built as admin-updated
  status only (no courier/GPS integration) per the original site-scope exclusion on
  real-time tracking, which the client hasn't asked to lift.
- **No stale-order expiry job yet**: a `PENDING_PAYMENT` order whose payment never
  completes (browser closed, etc.) holds its stock until an admin manually cancels it.
  No cron/scheduled job was added to auto-expire these — flagging as a known gap worth
  addressing (e.g. a periodic sweep, or lazy-expiry on read) before checkout volume
  grows enough for it to matter.
- **Soft delete for products/variants**: "removing" a product or variant in the admin
  dashboard sets `isActive = false` rather than deleting the row, since `OrderItem`
  references variants with `onDelete: Restrict` — a hard delete would either fail or
  destroy order history. Reviews and blog posts have no such history dependency, so
  their admin delete is a real `DELETE`.
- **Reviews are admin-authored only**: no customer review-submission flow exists;
  `Review.authorName` is free text the admin fills in themselves, as specified.
- **Defense-in-depth CHECK constraints** were hand-added to the migration SQL (rating
  1-5, non-negative stock, positive price/quantity) alongside zod validation at the API
  boundary — cheap to add, catches anything that reaches the DB some other way.
- **Supabase credentials**: the client pasted a `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` directly into chat. Stored only in the local, gitignored
  `.env` — never committed, never echoed back. Flagged to the client that a service-role
  key bypasses all Postgres security and shouldn't normally travel through a chat
  transcript even for a dev project; they've committed to rotating it before production.
  **Still missing**: the actual Postgres connection string (`DATABASE_URL`/`DIRECT_URL`
  with the DB password) and real Razorpay keys — placeholders are in `.env` until
  supplied. The client also mentioned pre-existing tables in the Supabase project; per
  their answer, some tables already exist, so the plan is to run `prisma db pull` against
  the real connection once shared and reconcile this schema with what's actually there
  before applying any migration — not to blindly run `prisma migrate deploy` and risk
  clobbering existing work.
- **Verified**: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all pass. Added
  unit tests for the Razorpay signature verification (checkout callback + webhook HMAC),
  the one piece of new logic that's both security-critical and testable without a live
  DB. Manually booted the server against the real `SUPABASE_URL`: `/api/health` (200),
  unauthenticated `/api/orders` and `/api/admin/products` (401, no network call made —
  confirmed by log inspection), `/api/payments/webhook` with no signature (400),
  `/api/products` against a placeholder `DATABASE_URL` (500, generic message, and the
  server log confirms it's a clean "invalid connection string" failure, not a bug).
  **Not yet verified**: anything that requires a real Postgres connection — actual
  stock-decrement concurrency, the Profile-upsert-on-auth flow, and the full order ->
  payment -> webhook lifecycle end-to-end. That needs the real `DATABASE_URL` first.

---

## 2026-09-12 — Backend scaffold (apps/api)

- **Assumption:** No business domain/data model was specified for Peculiar beyond
  "professional client website." Started with a single `ContactMessage` model (name,
  email, phone, message) since a contact form is close to universal for this kind of
  site. Replace/extend once the client's actual content/services are known — do not
  treat this as the final data model.
- **Decision:** Prisma's generator uses an explicit `output = "./generated/client"` in
  `prisma/schema.prisma` instead of the default `@prisma/client` package resolution.
  Reason: with the schema at the monorepo root but only `apps/api` depending on
  `@prisma/client`, Prisma's default behavior tries to resolve/auto-install the client
  relative to the repo root and fails in a sandboxed/offline install context. Explicit
  output avoids relying on node_modules hoisting across the workspace boundary. Also
  added `prisma` and `@prisma/client` as root `devDependencies` (in addition to
  `apps/api`'s own) so Prisma's root-relative resolution succeeds either way. The
  generated client is gitignored (`prisma/generated/`) and regenerated via
  `pnpm db:generate`.
- **Assumption:** `apps/api` reads a single shared `.env` at the repo root (see
  `src/config/env.ts`), on the assumption it's always launched via the root
  `pnpm dev:api` script (cwd = `apps/api`, root is two levels up). A local
  `apps/api/.env` can still override individual values.
- **Decision:** Layering is routes → controllers → services → (middleware/validators
  cross-cutting), per `.claude/rules/backend.md`. Zod validates all external input at
  the route boundary; a centralized `errorHandler` middleware prevents leaking internal
  error details (verified: a real Prisma connection failure returns a generic 500, not
  a stack trace).
- **Verified:** `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` all pass.
  Manually booted the server and hit `/api/health` (200), `/api/contact` with valid
  input against a non-existent DB (500, generic message, no leaked internals), and
  `/api/contact` with invalid input (400 with field-level messages).

---

## 2026-09-12 — Initial project configuration

- **Assumption:** Node.js 20 LTS is the target runtime (recorded as `engines` in root
  `package.json`). Not explicitly specified by the client; can be changed freely since
  nothing depends on it yet.
- **Assumption:** No deployment target has been decided (Vercel/Render/Railway/VPS all
  still open). `.env.example` was kept provider-agnostic; revisit once hosting is chosen.
- **Decision:** Initialized git (`git init`, default branch renamed to `main`) as part
  of setting up the project foundation. No commits were made as part of this setup.
- **Decision:** Omitted AI/LLM, RAG, and evaluation standards from `CLAUDE.md` — this is
  explicitly not an AI product.
- **Decision:** No `packages/*` shared workspace created, per explicit client
  instruction. Revisit only if real duplication appears between `apps/web` and
  `apps/api`.
- **Decision:** Did not scaffold `apps/web`, `apps/api`, or `prisma/schema.prisma` in
  this pass — this was a configuration-only setup (`CLAUDE.md`, rules, gitignore, env
  example, workspace config). Actual app scaffolding is the next phase.
