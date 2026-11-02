# =============================================================================
# Frontend Dockerfile — Next.js 14 on Node 20-alpine
# =============================================================================
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat || true

# Development target (hot-reload)
FROM base AS dev
ENV NODE_ENV=development \
    PATH="/app/node_modules/.bin:$PATH"

COPY package.json package-lock.json* ./
RUN npm install
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Builder
FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PATH="/app/node_modules/.bin:$PATH"

# Install dependencies directly in builder to avoid cross-stage copy / broken symlinks
COPY package.json package-lock.json* ./
RUN npm ci || npm install
RUN chmod -R +x /app/node_modules/.bin || true

COPY . .

ARG NEXT_PUBLIC_API_URL=https://store.gamedr.ir/api
ARG NEXT_PUBLIC_DEPLOYMENT_MODE=domestic
ARG NEXT_PUBLIC_DEFAULT_CURRENCY=IRT

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_DEPLOYMENT_MODE=$NEXT_PUBLIC_DEPLOYMENT_MODE \
    NEXT_PUBLIC_DEFAULT_CURRENCY=$NEXT_PUBLIC_DEFAULT_CURRENCY

RUN npm run build

# Production runner
FROM node:20-alpine AS prod
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    PATH="/app/node_modules/.bin:$PATH"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
RUN chmod -R +x /app/node_modules/.bin || true

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
