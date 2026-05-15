# syntax=docker/dockerfile:1
# ============================================================================
# Multi-stage Dockerfile for DevTrack Backend
# ============================================================================

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# ── Stage 2: Production runtime ──────────────────────────────────────────────
FROM node:22-alpine AS production

RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN chown -R nodeapp:nodejs /app

USER nodeapp

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]