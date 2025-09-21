#!/usr/bin/env bash
set -euo pipefail

echo "🌱 Seeding database..."

# List all services that need seeding
SERVICES=("worker-service" "api-gateway")  # Add more if needed

for service in "${SERVICES[@]}"; do
  echo "🔹 Seeding $service..."
  
  # Start container if not running
  if ! docker compose ps "$service" >/dev/null 2>&1; then
    echo "⚠ $service container not running. Starting..."
    docker compose up -d "$service"
  fi

  # Run seed inside container
  docker compose exec "$service" npm run seed
done

echo "✅ Database seeding complete for all services."
