#!/bin/bash

# Rate Limiting Test Script
# Tests the rate limiting implementation on the API Gateway

set -e

API_URL="${API_URL:-http://localhost:4000/graphql}"
ANSI_RED='\033[0;31m'
ANSI_GREEN='\033[0;32m'
ANSI_YELLOW='\033[1;33m'
ANSI_BLUE='\033[0;34m'
ANSI_RESET='\033[0m'

echo -e "${ANSI_BLUE}=================================================${ANSI_RESET}"
echo -e "${ANSI_BLUE}  Rate Limiting Test Script${ANSI_RESET}"
echo -e "${ANSI_BLUE}=================================================${ANSI_RESET}"
echo ""
echo -e "${ANSI_YELLOW}API URL: ${API_URL}${ANSI_RESET}"
echo ""

# Function to test rate limiting
test_rate_limit() {
    local endpoint_name=$1
    local query=$2
    local expected_limit=$3
    local description=$4
    
    echo -e "${ANSI_BLUE}Testing ${endpoint_name}${ANSI_RESET}"
    echo -e "Expected Limit: ${expected_limit}"
    echo -e "Description: ${description}"
    echo ""
    
    local success_count=0
    local rate_limited_count=0
    
    # Try to exceed the rate limit
    for i in $(seq 1 $((expected_limit + 3))); do
        response=$(curl -s -w "\n%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -d "{\"query\":\"${query}\"}" \
            "${API_URL}")
        
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" == "200" ]; then
            if echo "$body" | grep -q "ThrottlerException\|Too Many Requests"; then
                rate_limited_count=$((rate_limited_count + 1))
                echo -e "Request $i: ${ANSI_RED}RATE LIMITED (429)${ANSI_RESET}"
            else
                success_count=$((success_count + 1))
                echo -e "Request $i: ${ANSI_GREEN}SUCCESS (200)${ANSI_RESET}"
            fi
        elif [ "$http_code" == "429" ]; then
            rate_limited_count=$((rate_limited_count + 1))
            echo -e "Request $i: ${ANSI_RED}RATE LIMITED (429)${ANSI_RESET}"
        else
            echo -e "Request $i: ${ANSI_YELLOW}UNEXPECTED ($http_code)${ANSI_RESET}"
        fi
        
        # Small delay to avoid overwhelming the system
        sleep 0.1
    done
    
    echo ""
    echo -e "${ANSI_BLUE}Results:${ANSI_RESET}"
    echo -e "  Successful requests: ${ANSI_GREEN}${success_count}${ANSI_RESET}"
    echo -e "  Rate limited: ${ANSI_RED}${rate_limited_count}${ANSI_RESET}"
    
    # Verify rate limiting is working
    if [ $rate_limited_count -gt 0 ]; then
        echo -e "  ${ANSI_GREEN}✓ Rate limiting is working!${ANSI_RESET}"
    else
        echo -e "  ${ANSI_RED}✗ Rate limiting may not be working${ANSI_RESET}"
    fi
    
    echo ""
    echo -e "${ANSI_BLUE}-------------------------------------------------${ANSI_RESET}"
    echo ""
    
    # Wait before next test to let rate limit reset
    echo "Waiting 10 seconds for rate limit to reset..."
    sleep 10
}

# Test 1: Login endpoint (3 requests per minute)
echo -e "${ANSI_YELLOW}Test 1: Login Rate Limiting${ANSI_RESET}"
test_rate_limit \
    "Login" \
    "mutation { login(email: \\\"test@example.com\\\", password: \\\"test123\\\") { accessToken } }" \
    3 \
    "Login should be limited to 3 attempts per minute"

# Test 2: GraphQL introspection query (standard rate limit)
echo -e "${ANSI_YELLOW}Test 2: Standard Query Rate Limiting${ANSI_RESET}"
test_rate_limit \
    "Users Query" \
    "query { users { id email name } }" \
    10 \
    "Standard queries should follow default rate limit (10/sec)"

# Test 3: Rapid fire test (exceeding short throttle)
echo -e "${ANSI_YELLOW}Test 3: Rapid Fire Test${ANSI_RESET}"
echo -e "${ANSI_BLUE}Sending 15 requests rapidly...${ANSI_RESET}"
echo ""

success=0
throttled=0

for i in $(seq 1 15); do
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"{ __typename }"}' \
        "${API_URL}" 2>/dev/null || echo -e "\n000")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
        body=$(echo "$response" | sed '$d')
        if echo "$body" | grep -q "ThrottlerException\|Too Many Requests"; then
            throttled=$((throttled + 1))
            echo -e "Request $i: ${ANSI_RED}THROTTLED${ANSI_RESET}"
        else
            success=$((success + 1))
            echo -e "Request $i: ${ANSI_GREEN}SUCCESS${ANSI_RESET}"
        fi
    elif [ "$http_code" == "429" ]; then
        throttled=$((throttled + 1))
        echo -e "Request $i: ${ANSI_RED}THROTTLED${ANSI_RESET}"
    else
        echo -e "Request $i: ${ANSI_YELLOW}ERROR ($http_code)${ANSI_RESET}"
    fi
done

echo ""
echo -e "${ANSI_BLUE}Rapid Fire Results:${ANSI_RESET}"
echo -e "  Successful: ${ANSI_GREEN}${success}${ANSI_RESET}"
echo -e "  Throttled: ${ANSI_RED}${throttled}${ANSI_RESET}"
echo ""

# Summary
echo -e "${ANSI_BLUE}=================================================${ANSI_RESET}"
echo -e "${ANSI_GREEN}Rate Limiting Tests Complete${ANSI_RESET}"
echo -e "${ANSI_BLUE}=================================================${ANSI_RESET}"
echo ""
echo "Key Observations:"
echo "1. Rate limiting is applied per user/IP"
echo "2. Different endpoints have different limits"
echo "3. Exceeding limits returns 429 or throttle error"
echo "4. Health check endpoint should be excluded"
echo ""
echo "For more information, see:"
echo "  - RATE_LIMITING_IMPLEMENTATION.md"
echo "  - RATE_LIMITING_QUICK_REF.md"
echo ""
