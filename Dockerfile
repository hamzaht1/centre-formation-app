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

# Copy static assets into standalone directory at both possible locations
RUN if [ -d renderer/public ]; then \
      cp -r renderer/public renderer/.next/standalone/renderer/public; \
      cp -r renderer/public renderer/.next/standalone/public; \
    fi
RUN mkdir -p renderer/.next/standalone/renderer/.next && \
    cp -r renderer/.next/static renderer/.next/standalone/renderer/.next/static
RUN mkdir -p renderer/.next/standalone/.next && \
    cp -r renderer/.next/static renderer/.next/standalone/.next/static

# --- Runner stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone server
COPY --from=builder /app/renderer/.next/standalone ./

# Copy prisma schema, migrations, and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Install prisma CLI in runner for migrate deploy
RUN npm install prisma@5.22.0

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD npx prisma db push --skip-generate && \
    if [ -f renderer/server.js ]; then node renderer/server.js; \
    elif [ -f server.js ]; then node server.js; \
    else echo "server.js not found" && find /app -name server.js && exit 1; fi
