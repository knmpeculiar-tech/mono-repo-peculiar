# syntax=docker/dockerfile:1
# API image. Build from the REPO ROOT (the pnpm workspace and lockfile live
# there):  docker build -f apps/api/Dockerfile .
# Normally run via deploy/docker-compose.yml — see deploy/README.md.

FROM node:22-bookworm-slim AS base
# Prisma's query engine links against OpenSSL, which slim images don't ship.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS build
WORKDIR /repo
# Dependencies first (from the lockfile alone), so they're cached across
# builds that only change source code.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN pnpm fetch --frozen-lockfile
COPY apps/web/package.json apps/web/package.json
COPY apps/api apps/api
RUN pnpm install --offline --frozen-lockfile --filter api
# `build` = prisma generate (for this Linux image) + tsc.
RUN pnpm --filter api run build
# A self-contained copy of the api with production dependencies only.
RUN pnpm --filter api deploy --prod /out \
  && rm -rf /out/src /out/prisma \
  && mkdir -p /out/prisma \
  && cp -r apps/api/dist /out/dist \
  && cp -r apps/api/prisma/generated /out/prisma/generated

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/index.js"]
