# Build stage
FROM node:20-alpine AS builder

# Upgrade busybox to fix security vulnerabilities
RUN apk upgrade --no-cache busybox busybox-binsh ssl_client

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy root workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package files
COPY frontend/package.json ./frontend/package.json
COPY frontend/tsconfig.json ./frontend/tsconfig.json
COPY frontend/next.config.mjs ./frontend/next.config.mjs
COPY frontend/postcss.config.mjs ./frontend/postcss.config.mjs
COPY frontend/tailwind.config.ts ./frontend/tailwind.config.ts

# Copy source code
COPY frontend/app ./frontend/app
COPY frontend/components ./frontend/components
COPY frontend/hooks ./frontend/hooks
COPY frontend/styles ./frontend/styles
COPY frontend/utils ./frontend/utils
COPY frontend/global.d.ts ./frontend/global.d.ts

# Install dependencies from workspace root
RUN pnpm install --frozen-lockfile

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm --filter frontend build

# Production stage
FROM node:20-alpine

# Upgrade busybox to fix security vulnerabilities
RUN apk upgrade --no-cache busybox busybox-binsh ssl_client

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy root workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package files
COPY frontend/package.json ./frontend/package.json
COPY frontend/next.config.mjs ./frontend/next.config.mjs

# Install only production dependencies from workspace root
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built application from builder
COPY --from=builder /app/frontend/.next ./frontend/.next

# Set working directory to frontend for runtime
WORKDIR /app/frontend

# Set environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "start"]
