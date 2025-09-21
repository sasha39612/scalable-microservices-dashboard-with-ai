#!/usr/bin/env bash
set -euo pipefail

echo "📦 Running database migrations..."

# Example: run migrations in worker-service
docker compose exec worker-service npm run migration:run

echo "✅ Database migrations applied."
