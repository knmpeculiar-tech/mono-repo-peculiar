# Deploying the API to the VPS

The backend runs on the Hostinger VPS with Docker Compose. There are two containers:
**api** (Express) and **caddy** (HTTPS reverse proxy with automatic certificates).
The frontend is on Vercel; the database, auth and image storage are on Supabase.

```
Internet ──443──▶ caddy ──▶ api:4000 ──▶ Supabase (Postgres / Auth / Storage)
                                    └──▶ Razorpay
Vercel (frontend) calls https://<API_DOMAIN>
```

## One-time setup

**1. Point a domain at the VPS.** In your DNS provider (GoDaddy for `peculiars.in`), add
an **A record**: name `api`, value = the VPS's public IP. Wait until
`ping api.peculiars.in` shows that IP.

**2. Install Docker on the VPS.** Hostinger offers an "Ubuntu with Docker" OS template.
Otherwise, SSH in and run:

```bash
curl -fsSL https://get.docker.com | sh
```

**3. Open the firewall** (Hostinger's panel firewall too, if enabled). You need ports 22
(SSH), 80 and 443:

```bash
ufw allow 22 && ufw allow 80 && ufw allow 443/tcp && ufw allow 443/udp && ufw enable
```

**4. Get the code.** Use a deploy key or HTTPS token for the private repo:

```bash
git clone <repo-url> peculiar && cd peculiar
```

**5. Create the two env files.** These are never committed.

```bash
cp apps/api/.env.example apps/api/.env   # fill in real values (below)
cp deploy/.env.example deploy/.env       # set API_DOMAIN=api.peculiars.in
```

In `apps/api/.env`:

- `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`,
  `SUPABASE_JWKS_URL`: the same values as in local development.
- `RAZORPAY_MODE` plus the matching `RAZORPAY_TEST_*` or `RAZORPAY_LIVE_*` keys.
- `PAYMENTS_MOCK="false"`. The API refuses to start with `true` in production.
- `NODE_ENV` and `PORT` are set by Compose; no need to add them.

**6. Start it:**

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

Build on the VPS itself, not on a laptop. The build generates Prisma's engine for the
server's CPU and OS.

**7. Check it:** `https://api.peculiars.in/api/health` should return `{"status":"ok"}`.
The first request can take a few seconds while Caddy obtains the certificate.

## After the API is live

- **Vercel:** set `NEXT_PUBLIC_API_URL=https://api.peculiars.in`, then redeploy the
  frontend. The Vercel build reads products and blog posts from the API, so the API must
  be up first.
- **Razorpay webhook:** in Dashboard → Webhooks, set the URL to
  `https://api.peculiars.in/api/payments/webhook`, with events `payment.captured` and
  `payment.failed`. Put the secret in `RAZORPAY_TEST_WEBHOOK_SECRET` (or
  `RAZORPAY_LIVE_*`), then restart the API (below). Create one webhook per mode.

## Day-to-day

| Task | Command (from the repo folder) |
|---|---|
| Deploy a new version | `git pull && docker compose -f deploy/docker-compose.yml up -d --build` |
| Restart after editing `apps/api/.env` | `docker compose -f deploy/docker-compose.yml up -d --force-recreate api` |
| Live logs | `docker compose -f deploy/docker-compose.yml logs -f api` |
| Status / health | `docker compose -f deploy/docker-compose.yml ps` |
| Database migration (when a release adds one) | From a **dev machine** (with `apps/api/.env` pointing at the same Supabase DB): `pnpm db:deploy`. Run it *before* deploying the code that needs it. The image deliberately ships without the Prisma CLI and migration files. |
| Free disk from old images | `docker image prune -f` |

Containers restart on their own after a crash or a VPS reboot (`restart: unless-stopped`).

## What's in the box

- `apps/api/Dockerfile`: a multi-stage build. The final image keeps only the compiled
  API, the generated Prisma client and production dependencies. It runs as the non-root
  `node` user and has a built-in health check. Secrets aren't baked in (`.dockerignore`);
  they come from `apps/api/.env` at runtime.
- `deploy/docker-compose.yml`: the API is **not** exposed to the internet directly, only
  through Caddy. Caddy waits for the API's health check before starting.
- `deploy/Caddyfile`: HTTPS via Let's Encrypt, renewed automatically. The certificates
  live in the `caddy_data` volume; don't delete it, or renewals can hit rate limits.
- The API also pings Supabase daily so the free plan doesn't pause
  (`KEEP_ALIVE_HOURS`, see `apps/api/.env.example`).
