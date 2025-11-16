# Build stage
FROM node:20-alpine AS builder

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

# Install dependencies
WORKDIR /app/frontend
RUN pnpm install --frozen-lockfile

# Copy source code
COPY frontend/app ./app
COPY frontend/components ./components
COPY frontend/hooks ./hooks
COPY frontend/styles ./styles
COPY frontend/utils ./utils
COPY frontend/global.d.ts ./global.d.ts

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy root workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package files
COPY frontend/package.json ./frontend/package.json
COPY frontend/next.config.mjs ./frontend/next.config.mjs

# Install only production dependencies
WORKDIR /app/frontend
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public

# Set environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "start"]
