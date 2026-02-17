FROM node:20-alpine AS base

# --- Builder stage ---
FROM base AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY renderer/package*.json ./renderer/

# Install dependencies
RUN npm ci --ignore-scripts && cd renderer && npm ci

# Copy source code
COPY . .

# Switch Prisma from SQLite to PostgreSQL
RUN sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
RUN sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/migrations/migration_lock.toml

# Generate Prisma client for PostgreSQL
RUN npx prisma generate

# Build Next.js standalone
RUN cd renderer && npm run build

# Copy static assets into standalone directory (public may not exist)
RUN if [ -d renderer/public ]; then cp -r renderer/public renderer/.next/standalone/renderer/public; fi
RUN mkdir -p renderer/.next/standalone/renderer/.next && cp -r renderer/.next/static renderer/.next/standalone/renderer/.next/static

# --- Runner stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone server
COPY --from=builder /app/renderer/.next/standalone ./

# Copy prisma schema, migrations, and client for migrate deploy
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD npx prisma migrate deploy && node renderer/server.js
