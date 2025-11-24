#!/bin/bash
# Test if environment variables are properly set in containers

echo "=== Testing Environment Variables in Containers ==="
echo ""

echo "1. Checking API Gateway AI_SERVICE_API_KEY..."
docker exec api-gateway printenv AI_SERVICE_API_KEY

echo ""
echo "2. Checking AI Service AI_SERVICE_API_KEY..."
docker exec ai-service printenv AI_SERVICE_API_KEY

echo ""
echo "3. Testing AI Service health endpoint (should work without auth)..."
curl -s http://localhost:5000/health | jq .

echo ""
echo "4. Testing AI Service insights endpoint with correct API key..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 225bc4980982236851dde84625c966f7a07385f684adbd36508ff1eb63f7cb4b" \
  -d '{"insightType":"performance","data":[{"metric":"cpu","value":75}]}' \
  http://localhost:5000/ai/insights

echo ""
echo "5. Testing AI Service insights endpoint without API key (should fail)..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"insightType":"performance","data":[{"metric":"cpu","value":75}]}' \
  http://localhost:5000/ai/insights

echo ""
echo "=== Test Complete ==="
