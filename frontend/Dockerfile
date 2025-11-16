# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY frontend/package.json ./package.json
COPY frontend/tsconfig.json ./tsconfig.json
COPY frontend/next.config.mjs ./next.config.mjs
COPY frontend/postcss.config.mjs ./postcss.config.mjs
COPY frontend/tailwind.config.ts ./tailwind.config.ts

# Install dependencies
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

# Copy package files
COPY frontend/package.json ./package.json
COPY frontend/next.config.mjs ./next.config.mjs

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Set environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "start"]
