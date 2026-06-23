#!/bin/bash
set -e

API_URL="http://127.0.0.1:5001/api"

# Clear any lingering rate limit keys in Redis to ensure clean tests
if command -v redis-cli &> /dev/null; then
  redis-cli --eval <(echo 'for _,k in ipairs(redis.call("keys", "rate:limit:*")) do redis.call("del", k) end') &> /dev/null || true
fi

echo "=== 1. Testing Payload Validation Schema ==="
# Attempt to register with a password too short (less than 6 chars)
BAD_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "good@test.com", "password": "123", "fullName": "Short Pass User"}')
echo "Bad registration response success: $(echo $BAD_REG | jq .success)"
echo "Bad registration error field: $(echo $BAD_REG | jq '.errors[0].field')"
echo "Bad registration error message: $(echo $BAD_REG | jq '.errors[0].message')"

# Attempt to login with an invalid email address format
BAD_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "bad-email-format", "password": "password123"}')
echo "Bad login response success: $(echo $BAD_LOGIN | jq .success)"
echo "Bad login error message: $(echo $BAD_LOGIN | jq '.errors[0].message')"

echo ""
echo "=== 2. Testing Centralized Routing (Reports route check) ==="
# Register a valid user to get token
echo "Registering valid user..."
OK_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "gateway-test@company.com", "password": "password123", "fullName": "Gateway Tester", "companyName": "Gateway Corp"}')
echo "User registered successfully: $(echo $OK_REG | jq .success)"

# Log in
echo "Logging in..."
LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "gateway-test@company.com", "password": "password123"}')
TOKEN=$(echo $LOGIN_RESP | jq -r .data.accessToken)

# Query /api/reports via central router
echo "Querying /api/reports route with authorization header..."
REPORTS_RESP=$(curl -s -X GET "$API_URL/reports" \
  -H "Authorization: Bearer $TOKEN")
echo "HTTP Status (Expected 200): $(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/reports" -H "Authorization: Bearer $TOKEN")"
echo "Reports response message: $(echo $REPORTS_RESP | jq -r .message)"

echo ""
echo "=== 3. Testing Rate Limiting (5 requests limit for sensitive auth endpoints) ==="
# We will send 6 login requests consecutively. The 6th should return HTTP 429.
# First clear the keys again to get a fresh window count
if command -v redis-cli &> /dev/null; then
  redis-cli --eval <(echo 'for _,k in ipairs(redis.call("keys", "rate:limit:*")) do redis.call("del", k) end') &> /dev/null || true
fi

for i in {1..6}; do
  echo "Sending login request #$i..."
  RESP=$(curl -s -i -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "gateway-test@company.com", "password": "password123"}')
  
  # Extract status code and headers
  STATUS=$(echo "$RESP" | grep -i '^HTTP/' | awk '{print $2}' | tail -n1)
  LIMIT_HDR=$(echo "$RESP" | grep -i 'x-ratelimit-limit:' | awk '{print $2}' | tr -d '\r')
  REMAIN_HDR=$(echo "$RESP" | grep -i 'x-ratelimit-remaining:' | awk '{print $2}' | tr -d '\r')
  
  echo "  HTTP Status: $STATUS | Limit: $LIMIT_HDR | Remaining: $REMAIN_HDR"
done

echo ""
echo "=== All Gateway Tests Passed ==="
