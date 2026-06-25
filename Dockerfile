# syntax=docker/dockerfile:1

# ---- builder: install deps and build the Next.js standalone output ----
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies from the lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

# Build the app (emits .next/standalone thanks to output: "standalone").
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: minimal runtime image ----
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Cloud Run routes traffic to $PORT; Next standalone server.js honors it.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Copy the standalone server plus the assets it serves.
# server.js does not bundle public/ or .next/static, so copy them in.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Run as the non-root "node" user that ships with the base image.
USER node

EXPOSE 8080

CMD ["node", "server.js"]
