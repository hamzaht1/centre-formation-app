FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

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

# Switch Prisma from SQLite to MySQL
RUN sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma
RUN sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/migrations/migration_lock.toml

# Generate Prisma client for MySQL
RUN npx prisma generate

# Build Next.js standalone
RUN cd renderer && npm run build

# Debug: show standalone structure
RUN find renderer/.next/standalone -name "server.js" && \
    ls renderer/.next/standalone/ && \
    echo "---" && \
    ls renderer/.next/standalone/renderer/ 2>/dev/null || true

# --- Runner stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone server
COPY --from=builder /app/renderer/.next/standalone ./

# Copy static files directly into both possible locations
COPY --from=builder /app/renderer/.next/static ./renderer/.next/static
COPY --from=builder /app/renderer/.next/static ./.next/static

# Copy public if it exists (use a wildcard trick to avoid failure)
COPY --from=builder /app/renderer/public* ./renderer/public
COPY --from=builder /app/renderer/public* ./public

# Copy prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Install prisma CLI in runner for db push
RUN npm install prisma@5.22.0

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD npx prisma db push --skip-generate && \
    if [ -f renderer/server.js ]; then node renderer/server.js; \
    elif [ -f server.js ]; then node server.js; \
    else echo "server.js not found" && find /app -name server.js && exit 1; fi
