# Build stage
FROM node:20-alpine AS builder

# Upgrade busybox to fix security vulnerabilities
RUN apk upgrade --no-cache busybox busybox-binsh ssl_client

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy root package files and tsconfig
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./

# Copy all backend package.json files for workspace setup
COPY backend/worker-service/package.json ./backend/worker-service/
COPY backend/common/package.json ./backend/common/

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY backend/worker-service ./backend/worker-service
COPY backend/common ./backend/common

# Build the common package first
WORKDIR /app/backend/common
RUN pnpm build

# Build the worker-service
WORKDIR /app/backend/worker-service
RUN pnpm build

# Production stage
FROM node:20-alpine

# Upgrade busybox to fix security vulnerabilities
RUN apk upgrade --no-cache busybox busybox-binsh ssl_client

WORKDIR /app

# Install curl for healthchecks and pnpm
RUN apk add --no-cache curl && \
    npm install -g pnpm

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files
COPY backend/worker-service/package.json ./backend/worker-service/
COPY backend/common/package.json ./backend/common/

# Copy built common package from builder stage BEFORE installing dependencies
# This ensures the local package is available during install
COPY --from=builder /app/backend/common/dist ./backend/common/dist

# Install only production dependencies (this will properly link the local common package)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built application from builder stage
COPY --from=builder /app/backend/worker-service/dist ./backend/worker-service/dist

WORKDIR /app/backend/worker-service

EXPOSE 3003

CMD ["node", "dist/main.js"]
