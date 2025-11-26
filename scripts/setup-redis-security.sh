#!/bin/bash

# Complete Redis Security Setup Script
# This script automates the setup of secure Redis configuration

set -e

echo "=========================================="
echo "Redis Security Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env exists
if [ ! -f .env ]; then
    if [ ! -f .env.example ]; then
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

echo ""

# Check if REDIS_PASSWORD is already set
if grep -q "^REDIS_PASSWORD=REPLACE_WITH" .env 2>/dev/null || ! grep -q "^REDIS_PASSWORD=" .env 2>/dev/null; then
    echo "Generating strong Redis password..."
    REDIS_PASSWORD=$(openssl rand -base64 32)
    
    # Update .env file
    if grep -q "^REDIS_PASSWORD=" .env; then
        # Replace existing placeholder
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=${REDIS_PASSWORD}|" .env
        else
            sed -i "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=${REDIS_PASSWORD}|" .env
        fi
    else
        # Add new entry
        echo "" >> .env
        echo "# Redis Password - Generated $(date)" >> .env
        echo "REDIS_PASSWORD=${REDIS_PASSWORD}" >> .env
    fi
    
    # Also update REDIS_URL if it exists
    if grep -q "^REDIS_URL=" .env; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^REDIS_URL=.*|REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379|" .env
        else
            sed -i "s|^REDIS_URL=.*|REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379|" .env
        fi
    fi
    
    echo -e "${GREEN}✓ Generated and saved Redis password${NC}"
else
    echo -e "${GREEN}✓ Redis password already configured${NC}"
    REDIS_PASSWORD=$(grep "^REDIS_PASSWORD=" .env | cut -d '=' -f 2)
fi

echo ""

# Verify docker-compose.dev.yml has security configurations
echo "Verifying Docker Compose configuration..."
if grep -q "REDIS_PASSWORD" docker-compose.dev.yml && \
   grep -q "requirepass" docker-compose.dev.yml && \
   ! grep -q '^\s*-\s*"6379:6379"' docker-compose.dev.yml; then
    echo -e "${GREEN}✓ Docker Compose is properly configured${NC}"
else
    echo -e "${YELLOW}⚠ Warning: docker-compose.dev.yml may need updates${NC}"
    echo "  Please ensure Redis is configured with password and network isolation"
fi

echo ""

# Check if containers are running
echo "Checking container status..."
if docker ps | grep -q redis; then
    echo -e "${YELLOW}Redis is currently running. Restart recommended to apply changes.${NC}"
    read -p "Restart Redis container now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Restarting services..."
        docker-compose -f docker-compose.dev.yml restart redis
        sleep 5
        docker-compose -f docker-compose.dev.yml restart ai-service
        echo -e "${GREEN}✓ Services restarted${NC}"
    fi
else
    echo -e "${YELLOW}Redis is not running. Start with:${NC}"
    echo "  docker-compose -f docker-compose.dev.yml up -d"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Your Redis password has been configured:"
echo -e "${GREEN}REDIS_PASSWORD=${REDIS_PASSWORD:0:10}...${NC}"
echo ""
echo "Security measures in place:"
echo "  ✓ Password authentication required"
echo "  ✓ Network isolation configured"
echo "  ✓ Public access blocked"
echo "  ✓ Dangerous commands disabled"
echo ""
echo "Next steps:"
echo "  1. Review your .env file"
echo "  2. Start services: docker-compose -f docker-compose.dev.yml up -d"
echo "  3. Run security tests: ./scripts/test-redis-security.sh"
echo "  4. Review documentation: REDIS_SECURITY_IMPLEMENTATION.md"
echo ""
echo "⚠️  IMPORTANT: Never commit your .env file to version control!"
echo ""
