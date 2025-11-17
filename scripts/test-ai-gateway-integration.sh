#!/bin/bash

# Test AI Service and API Gateway Integration
# This script verifies that the API Gateway can successfully communicate with the AI Service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_GATEWAY_URL="${API_GATEWAY_URL:-http://localhost:4000}"
AI_SERVICE_URL="${AI_SERVICE_URL:-http://localhost:5000}"

echo "================================================"
echo "AI Service & API Gateway Integration Tests"
echo "================================================"
echo ""
echo "API Gateway URL: $API_GATEWAY_URL"
echo "AI Service URL: $AI_SERVICE_URL"
echo ""

# Function to check service health
check_health() {
    local service_name=$1
    local url=$2
    
    echo -n "Checking $service_name health... "
    
    if response=$(curl -s -f "$url/health" 2>/dev/null); then
        echo -e "${GREEN}✓ OK${NC}"
        echo "  Response: $(echo "$response" | jq -c '.')"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to test GraphQL query
test_graphql() {
    local query=$1
    local description=$2
    
    echo -n "Testing $description... "
    
    response=$(curl -s -X POST "$API_GATEWAY_URL/graphql" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\"}")
    
    if echo "$response" | jq -e '.data' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        echo "  Response: $(echo "$response" | jq -c '.data')"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Error: $(echo "$response" | jq -c '.')"
        return 1
    fi
}

# Function to test REST endpoint
test_rest_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ OK (HTTP $http_code)${NC}"
        if [ -n "$body" ] && [ "$body" != "null" ]; then
            echo "  Response: $(echo "$body" | jq -c '.' 2>/dev/null || echo "$body")"
        fi
        return 0
    else
        echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
        echo "  Error: $body"
        return 1
    fi
}

# Counter for test results
passed=0
failed=0

echo "=== Phase 1: Health Checks ==="
echo ""

if check_health "AI Service" "$AI_SERVICE_URL"; then
    ((passed++))
else
    ((failed++))
fi

if check_health "API Gateway" "$API_GATEWAY_URL"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "=== Phase 2: Direct AI Service Tests ==="
echo ""

# Test 1: Chat endpoint (AI Service direct)
if test_rest_endpoint "POST" "$AI_SERVICE_URL/ai/chat" \
    '{"message": "Hello, can you help me with system analytics?"}' \
    "AI Service - Chat endpoint"; then
    ((passed++))
else
    ((failed++))
fi

# Test 2: Insights endpoint (AI Service direct)
if test_rest_endpoint "POST" "$AI_SERVICE_URL/ai/insights" \
    '{"insightType": "analytics", "data": [{"metric": "cpu", "value": 75}, {"metric": "memory", "value": 80}]}' \
    "AI Service - Insights endpoint"; then
    ((passed++))
else
    ((failed++))
fi

# Test 3: Analyze endpoint (AI Service direct)
if test_rest_endpoint "POST" "$AI_SERVICE_URL/ai/analyze" \
    '{"query": "What is the trend?", "data": [1, 2, 3, 4, 5]}' \
    "AI Service - Analyze endpoint"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "=== Phase 3: API Gateway GraphQL AI Integration ==="
echo ""

# Test 4: Chat mutation via GraphQL
chat_query='mutation { chat(input: { messages: [{ role: user, content: \"Hello from GraphQL\" }] }) { message role timestamp } }'
if test_graphql "$chat_query" "GraphQL Chat mutation"; then
    ((passed++))
else
    ((failed++))
fi

# Test 5: Insights query via GraphQL
insights_query='query { insights(input: { type: analytics, data: {} }) { id type title description confidence } }'
if test_graphql "$insights_query" "GraphQL Insights query"; then
    ((passed++))
else
    ((failed++))
fi

# Test 6: Analyze data mutation via GraphQL
analyze_query='mutation { analyzeData(input: { dataType: metrics, data: [] }) { results confidence processedAt } }'
if test_graphql "$analyze_query" "GraphQL Analyze mutation"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "=== Phase 4: Advanced Integration Tests ==="
echo ""

# Test 7: Conversation history (if available)
conversation_id="test_$(date +%s)"
chat_data="{\"message\": \"Test conversation\", \"conversationId\": \"$conversation_id\"}"
if test_rest_endpoint "POST" "$AI_SERVICE_URL/ai/chat" "$chat_data" "Create conversation"; then
    ((passed++))
    
    # Try to get conversation history
    if test_rest_endpoint "GET" "$AI_SERVICE_URL/ai/conversation/$conversation_id" "" \
        "Get conversation history"; then
        ((passed++))
    else
        ((failed++))
    fi
else
    ((failed++))
fi

# Test 8: Batch chat
batch_data='[{"message": "First message"}, {"message": "Second message"}]'
if test_rest_endpoint "POST" "$AI_SERVICE_URL/ai/chat/batch" "$batch_data" \
    "Batch chat processing"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "================================================"
echo "Test Summary"
echo "================================================"
echo -e "Total Tests: $((passed + failed))"
echo -e "${GREEN}Passed: $passed${NC}"
echo -e "${RED}Failed: $failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    echo ""
    echo "The AI Service is properly integrated with the API Gateway."
    echo "You can now use AI features through both:"
    echo "  - GraphQL API: $API_GATEWAY_URL/graphql"
    echo "  - Direct REST: $AI_SERVICE_URL/ai/*"
    exit 0
else
    echo -e "${RED}Some tests failed! ✗${NC}"
    echo ""
    echo "Please check the service logs for more details:"
    echo "  - API Gateway logs: docker logs api-gateway"
    echo "  - AI Service logs: docker logs ai-service"
    exit 1
fi
