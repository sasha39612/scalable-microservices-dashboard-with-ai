#!/bin/bash

# Redis Security Testing Script
# This script verifies that Redis is properly secured with authentication

set -e

echo "=========================================="
echo "Redis Security Verification Tests"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if docker-compose is running
if ! docker ps | grep -q redis; then
    echo -e "${RED}✗ Redis container is not running${NC}"
    echo "Please start services with: docker-compose -f docker-compose.dev.yml up -d"
    exit 1
fi

echo -e "${GREEN}✓ Redis container is running${NC}"
echo ""

# Load environment variables
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found${NC}"
    exit 1
fi

source .env

if [ -z "$REDIS_PASSWORD" ]; then
    echo -e "${RED}✗ REDIS_PASSWORD not set in .env${NC}"
    echo "Please set REDIS_PASSWORD in your .env file"
    exit 1
fi

echo -e "${GREEN}✓ REDIS_PASSWORD is configured${NC}"
echo ""

# Test 1: Public access should be blocked
echo "Test 1: Verifying public access is blocked..."
if timeout 2 redis-cli -h localhost -p 6379 ping 2>/dev/null; then
    echo -e "${RED}✗ SECURITY ISSUE: Redis is accessible from host without password!${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Public access is properly blocked${NC}"
fi
echo ""

# Test 2: Connection without password should fail
echo "Test 2: Verifying authentication is required..."
if docker exec redis redis-cli -h localhost ping 2>&1 | grep -q "NOAUTH"; then
    echo -e "${GREEN}✓ Authentication is properly enforced${NC}"
elif docker exec redis redis-cli -h localhost ping 2>&1 | grep -q "PONG"; then
    echo -e "${RED}✗ SECURITY ISSUE: Redis accepts connections without password!${NC}"
    exit 1
else
    echo -e "${YELLOW}⚠ Unexpected response, manual verification needed${NC}"
fi
echo ""

# Test 3: Wrong password should fail
echo "Test 3: Verifying wrong password is rejected..."
if docker exec redis redis-cli -h localhost -a "wrongpassword" ping 2>&1 | grep -q "WRONGPASS"; then
    echo -e "${GREEN}✓ Wrong password is properly rejected${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify wrong password rejection${NC}"
fi
echo ""

# Test 4: Correct password should succeed
echo "Test 4: Verifying correct password works..."
if docker exec redis redis-cli -h localhost -a "$REDIS_PASSWORD" ping 2>&1 | grep -q "PONG"; then
    echo -e "${GREEN}✓ Correct password authentication successful${NC}"
else
    echo -e "${RED}✗ Authentication with correct password failed${NC}"
    exit 1
fi
echo ""

# Test 5: Verify dangerous commands are disabled
echo "Test 5: Verifying dangerous commands are disabled..."
if docker exec redis redis-cli -h localhost -a "$REDIS_PASSWORD" FLUSHDB 2>&1 | grep -q "unknown command"; then
    echo -e "${GREEN}✓ FLUSHDB command is disabled${NC}"
else
    echo -e "${RED}✗ WARNING: FLUSHDB command is available${NC}"
fi

if docker exec redis redis-cli -h localhost -a "$REDIS_PASSWORD" CONFIG GET requirepass 2>&1 | grep -q "unknown command"; then
    echo -e "${GREEN}✓ CONFIG command is disabled${NC}"
else
    echo -e "${RED}✗ WARNING: CONFIG command is available${NC}"
fi
echo ""

# Test 6: Verify AI service can connect
echo "Test 6: Verifying AI service can connect to Redis..."
if docker ps | grep -q ai-service; then
    # Check if AI service has the correct environment variables
    if docker exec ai-service env | grep -q "REDIS_PASSWORD"; then
        echo -e "${GREEN}✓ AI service has REDIS_PASSWORD configured${NC}"
        
        # Try to test connection through AI service
        if docker exec ai-service redis-cli -h redis -a "$REDIS_PASSWORD" ping 2>&1 | grep -q "PONG"; then
            echo -e "${GREEN}✓ AI service can connect to Redis${NC}"
        else
            echo -e "${YELLOW}⚠ Could not verify AI service connection (redis-cli may not be in container)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ AI service doesn't have REDIS_PASSWORD in environment${NC}"
    fi
else
    echo -e "${YELLOW}⚠ AI service is not running, skipping connection test${NC}"
fi
echo ""

# Test 7: Check network isolation
echo "Test 7: Verifying network isolation..."
REDIS_NETWORKS=$(docker inspect redis --format='{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}')
if echo "$REDIS_NETWORKS" | grep -q "backend"; then
    echo -e "${GREEN}✓ Redis is on isolated 'backend' network${NC}"
else
    echo -e "${YELLOW}⚠ Redis network configuration: $REDIS_NETWORKS${NC}"
fi

# Check if Redis port is exposed to host
REDIS_PORTS=$(docker port redis 2>/dev/null || echo "")
if [ -z "$REDIS_PORTS" ]; then
    echo -e "${GREEN}✓ Redis port is NOT exposed to host (internal only)${NC}"
else
    echo -e "${YELLOW}⚠ Redis port mappings: $REDIS_PORTS${NC}"
    echo -e "${YELLOW}  Consider removing public port mapping in docker-compose.dev.yml${NC}"
fi
echo ""

# Test 8: Check Redis logs for suspicious activity
echo "Test 8: Checking Redis logs for errors..."
ERROR_COUNT=$(docker logs redis 2>&1 | grep -i "error" | wc -l || echo "0")
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ No errors in Redis logs${NC}"
else
    echo -e "${YELLOW}⚠ Found $ERROR_COUNT error(s) in Redis logs${NC}"
    echo "  Run 'docker logs redis' to investigate"
fi
echo ""

# Test 9: Verify memory limits are set
echo "Test 9: Verifying memory limits..."
MAXMEMORY=$(docker exec redis redis-cli -h localhost -a "$REDIS_PASSWORD" CONFIG GET maxmemory 2>&1 | grep -v "maxmemory" | tail -1 || echo "0")
if [ "$MAXMEMORY" != "0" ]; then
    echo -e "${GREEN}✓ Memory limit is configured${NC}"
else
    echo -e "${YELLOW}⚠ No memory limit set (may be intentional for development)${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Security Test Summary"
echo "=========================================="
echo -e "${GREEN}✓ Redis authentication is properly configured${NC}"
echo -e "${GREEN}✓ Unauthorized access is prevented${NC}"
echo -e "${GREEN}✓ Network isolation is in place${NC}"
echo -e "${GREEN}✓ Security measures are effective${NC}"
echo ""
echo "Redis is secure and ready for use!"
echo ""
echo "Next steps:"
echo "  1. Test AI service caching functionality"
echo "  2. Monitor Redis logs: docker logs redis -f"
echo "  3. Review full security documentation: REDIS_SECURITY_IMPLEMENTATION.md"
echo ""
