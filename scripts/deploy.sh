#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Starting full deployment..."

# ----------------------------
# Load environment variables
# ----------------------------
if [ -f .env ]; then
  echo "📄 Loading environment variables from .env"
  set -a
  source .env
  set +a
fi

# ----------------------------
# Navigate to backend folder
# ----------------------------
cd backend

# ----------------------------
# Build Docker images
# ----------------------------
echo "🔨 Building Docker images for all services..."
docker compose build

# ----------------------------
# Deploy containers
# ----------------------------
echo "🚀 Deploying containers..."
docker compose up -d

# ----------------------------
# Run migrations
# ----------------------------
if [ -f ./migrate-db.sh ]; then
  echo "📦 Running database migrations..."
  ./migrate-db.sh
else
  echo "⚠ migrate-db.sh not found, skipping migrations."
fi

# ----------------------------
# Seed the database
# ----------------------------
if [ -f ./seed-data.sh ]; then
  echo "🌱 Seeding database..."
  ./seed-data.sh
else
  echo "⚠ seed-data.sh not found, skipping database seeding."
fi

# ----------------------------
# Done
# ----------------------------
echo "✅ Full deployment complete."
