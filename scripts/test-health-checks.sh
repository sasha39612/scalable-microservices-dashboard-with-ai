#!/bin/bash

# Health Check Test Script
# This script tests all health endpoints in the microservices architecture

echo "========================================"
echo "Health Check Integration Test"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local service=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing ${service}... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" ${url})
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP ${response})"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected HTTP ${expected_status}, got ${response})"
        ((FAILED++))
    fi
}

# Test endpoints
echo "Testing basic health endpoints:"
echo "----------------------------------------"
test_endpoint "API Gateway" "http://localhost:4000/health" 200
test_endpoint "Worker Service" "http://localhost:4001/health" 200
test_endpoint "AI Service" "http://localhost:5000/health" 200

echo ""
echo "Testing detailed health endpoint:"
echo "----------------------------------------"
test_endpoint "API Gateway Detailed" "http://localhost:4000/health/detailed" 200

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All health checks passed!${NC}"
    exit 0
else
    echo -e "${RED}Some health checks failed!${NC}"
    exit 1
fi
