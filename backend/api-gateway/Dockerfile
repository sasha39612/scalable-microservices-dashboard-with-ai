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
COPY backend/api-gateway/package.json ./backend/api-gateway/
COPY backend/common/package.json ./backend/common/

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY backend/api-gateway ./backend/api-gateway
COPY backend/common ./backend/common

# Build the common package first
WORKDIR /app/backend/common
RUN pnpm build

# Build the api-gateway
WORKDIR /app/backend/api-gateway
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
COPY backend/api-gateway/package.json ./backend/api-gateway/
COPY backend/common/package.json ./backend/common/

# Copy built common package from builder stage BEFORE installing dependencies
# This ensures the local package is available during install
COPY --from=builder /app/backend/common/dist ./backend/common/dist

# Install only production dependencies (this will properly link the local common package)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built application from builder stage
COPY --from=builder /app/backend/api-gateway/dist ./backend/api-gateway/dist
COPY --from=builder /app/backend/api-gateway/schema.gql ./backend/api-gateway/schema.gql

WORKDIR /app/backend/api-gateway

EXPOSE 4000

CMD ["node", "dist/api-gateway/src/main.js"]
