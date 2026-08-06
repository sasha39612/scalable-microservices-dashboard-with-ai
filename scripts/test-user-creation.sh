#!/bin/bash

# Test script to create a user via GraphQL and verify it's in the database

echo "==================================="
echo "Testing User Creation with Database"
echo "==================================="

# Create a test user via GraphQL
echo ""
echo "1. Creating user via GraphQL..."
RESPONSE=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createUser(input: { email: \"test@example.com\", name: \"Test User\", password: \"password123\" }) { id email name createdAt } }"
  }')

echo "GraphQL Response:"
echo "$RESPONSE" | jq '.'

# Extract user ID if successful
USER_ID=$(echo "$RESPONSE" | jq -r '.data.createUser.id')

if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
  echo ""
  echo "✅ User created successfully with ID: $USER_ID"
  
  # Verify in database
  echo ""
  echo "2. Verifying user exists in PostgreSQL database..."
  PGPASSWORD=<REDACTED> ssh dev@138.199.175.38 \
    "PGPASSWORD=<REDACTED> psql -h 138.199.175.38 -U dashboard_user -d microservices_dashboard -c 'SELECT id, email, name, \"createdAt\" FROM users;'"
  
  echo ""
  echo "✅ Database integration test completed!"
else
  echo ""
  echo "❌ Failed to create user"
  exit 1
fi
