# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS runtime-base

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

FROM runtime-base AS prisma-runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

FROM prisma-runtime AS pnpm-base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

FROM pnpm-base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/tsconfig/package.json ./packages/tsconfig/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS workspace-build

ARG DATABASE_URL="postgresql://justdoit:justdoit@postgres:5432/justdoit?schema=public"
ARG DIRECT_DATABASE_URL="postgresql://justdoit:justdoit@postgres:5432/justdoit?schema=public"
ARG NEXT_PUBLIC_API_URL="http://localhost:3001"
ARG API_INTERNAL_URL="http://backend:3001"

ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_DATABASE_URL=$DIRECT_DATABASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_INTERNAL_URL=$API_INTERNAL_URL

COPY . .

RUN pnpm build:packages

FROM workspace-build AS backend-build

RUN pnpm --filter @justdoit/backend build

FROM backend-build AS backend-deploy

RUN pnpm --filter @justdoit/backend deploy --prod --legacy /prod/backend \
  && cd /prod/backend \
  && mkdir -p node_modules/@prisma \
  && ln -s ../.pnpm/node_modules/@prisma/client node_modules/@prisma/client \
  && PRISMA_GENERATE_SKIP_AUTOINSTALL=1 node_modules/.pnpm/node_modules/.bin/prisma generate --schema=node_modules/@justdoit/database/prisma/schema.prisma \
  && rm -rf \
    node_modules/.pnpm/@prisma+engines@* \
    node_modules/.pnpm/@prisma+fetch-engine@* \
    node_modules/.pnpm/@prisma+get-platform@* \
    node_modules/.pnpm/prisma@* \
    node_modules/.pnpm/typescript@* \
    node_modules/.pnpm/node_modules/@prisma/engines \
    node_modules/.pnpm/node_modules/@prisma/fetch-engine \
    node_modules/.pnpm/node_modules/@prisma/get-platform \
    node_modules/.pnpm/node_modules/.bin/prisma \
    node_modules/.pnpm/node_modules/prisma \
    node_modules/.pnpm/node_modules/typescript

FROM workspace-build AS frontend-build

RUN pnpm --filter @justdoit/frontend build \
  && mkdir -p frontend/.next/standalone/frontend/.next \
  && cp -r frontend/.next/static frontend/.next/standalone/frontend/.next/static \
  && if [ -d frontend/public ]; then cp -r frontend/public frontend/.next/standalone/frontend/public; fi

FROM workspace-build AS migrate-deploy

RUN pnpm --filter @justdoit/database deploy --legacy /prod/database \
  && cd /prod/database \
  && PRISMA_GENERATE_SKIP_AUTOINSTALL=1 node_modules/.bin/prisma generate --schema=prisma/schema.prisma

FROM prisma-runtime AS migrate

ENV NODE_ENV=production

COPY --from=migrate-deploy /prod/database ./

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma && node_modules/.bin/tsx prisma/seed.ts"]

FROM prisma-runtime AS backend

ENV NODE_ENV=production

COPY --from=backend-deploy /prod/backend ./

EXPOSE 3001

CMD ["node", "dist/main.js"]

FROM runtime-base AS frontend

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=frontend-build /app/frontend/.next/standalone ./

WORKDIR /app/frontend

EXPOSE 3000

CMD ["node", "server.js"]
