#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Running tests for all packages..."

# Run tests in each package (backend + frontend + mobile)
for dir in backend/api-gateway backend/worker-service backend/ai-service frontend mobile; do
  if [ -d "$dir" ]; then
    echo "🔍 Testing $dir"
    (cd "$dir" && npm ci && npm test)
  fi
done

echo "✅ All tests passed."
