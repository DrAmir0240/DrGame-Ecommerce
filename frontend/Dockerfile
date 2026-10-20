# =============================================================================
# Stage 1: Base Alpine image
# =============================================================================
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat || true

# =============================================================================
# Stage 2: Install dependencies
# =============================================================================
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

# =============================================================================
# Stage 3: Development target (hot-reload)
# =============================================================================
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# =============================================================================
# Stage 4: Builder
# =============================================================================
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# =============================================================================
# Stage 5: Production runner
# =============================================================================
FROM node:20-alpine AS prod
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
