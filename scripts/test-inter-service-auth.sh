#!/bin/bash

# Test script for verifying inter-service authentication with API keys
# This script tests both Worker Service and AI Service authentication

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

WORKER_SERVICE_URL="${WORKER_SERVICE_URL:-http://localhost:4001}"
AI_SERVICE_URL="${AI_SERVICE_URL:-http://localhost:5000}"

echo -e "${YELLOW}Testing Inter-Service Authentication${NC}\n"

# Test 1: Worker Service without API key (should fail)
echo -e "${YELLOW}Test 1: Worker Service without API key (expected: 401)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_SERVICE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{"type":"test","payload":{}}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 401 ]; then
  echo -e "${GREEN}✓ Correctly rejected request without API key${NC}\n"
else
  echo -e "${RED}✗ Expected 401, got $HTTP_CODE${NC}\n"
fi

# Test 2: Worker Service with invalid API key (should fail)
echo -e "${YELLOW}Test 2: Worker Service with invalid API key (expected: 401)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_SERVICE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: invalid-key" \
  -d '{"type":"test","payload":{}}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 401 ]; then
  echo -e "${GREEN}✓ Correctly rejected request with invalid API key${NC}\n"
else
  echo -e "${RED}✗ Expected 401, got $HTTP_CODE${NC}\n"
fi

# Test 3: Worker Service with valid API key (should succeed)
if [ -n "$WORKER_SERVICE_API_KEY" ]; then
  echo -e "${YELLOW}Test 3: Worker Service with valid API key (expected: 200 or 201)${NC}"
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_SERVICE_URL/api/tasks" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $WORKER_SERVICE_API_KEY" \
    -d '{"type":"test","payload":{"message":"auth test"}}')
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓ Successfully authenticated with valid API key${NC}\n"
  else
    echo -e "${RED}✗ Expected 200/201, got $HTTP_CODE${NC}\n"
  fi
else
  echo -e "${RED}✗ WORKER_SERVICE_API_KEY not set${NC}\n"
fi

# Test 4: Worker Service health check (should be public)
echo -e "${YELLOW}Test 4: Worker Service health check without API key (expected: 200)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$WORKER_SERVICE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ Health endpoint is public${NC}\n"
else
  echo -e "${RED}✗ Expected 200, got $HTTP_CODE${NC}\n"
fi

# Test 5: AI Service without API key (should fail)
echo -e "${YELLOW}Test 5: AI Service without API key (expected: 401)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$AI_SERVICE_URL/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 401 ]; then
  echo -e "${GREEN}✓ Correctly rejected request without API key${NC}\n"
else
  echo -e "${RED}✗ Expected 401, got $HTTP_CODE${NC}\n"
fi

# Test 6: AI Service with invalid API key (should fail)
echo -e "${YELLOW}Test 6: AI Service with invalid API key (expected: 401)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$AI_SERVICE_URL/ai/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: invalid-key" \
  -d '{"message":"test"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 401 ]; then
  echo -e "${GREEN}✓ Correctly rejected request with invalid API key${NC}\n"
else
  echo -e "${RED}✗ Expected 401, got $HTTP_CODE${NC}\n"
fi

# Test 7: AI Service with valid API key (should succeed)
if [ -n "$AI_SERVICE_API_KEY" ]; then
  echo -e "${YELLOW}Test 7: AI Service with valid API key (expected: 200)${NC}"
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$AI_SERVICE_URL/ai/chat" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $AI_SERVICE_API_KEY" \
    -d '{"message":"hello"}')
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Successfully authenticated with valid API key${NC}\n"
  else
    echo -e "${RED}✗ Expected 200, got $HTTP_CODE${NC}\n"
  fi
else
  echo -e "${RED}✗ AI_SERVICE_API_KEY not set${NC}\n"
fi

# Test 8: AI Service health check (should be public)
echo -e "${YELLOW}Test 8: AI Service health check without API key (expected: 200)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$AI_SERVICE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ Health endpoint is public${NC}\n"
else
  echo -e "${RED}✗ Expected 200, got $HTTP_CODE${NC}\n"
fi

echo -e "${YELLOW}Inter-Service Authentication Tests Complete${NC}"
