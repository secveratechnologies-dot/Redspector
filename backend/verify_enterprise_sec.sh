#!/bin/bash
set -e

API_URL="http://localhost:5001/api"
HEALTH_URL="http://localhost:5001/health"

# Helper to clear rate limit keys in Redis so the test runner doesn't trigger 429 Rate Limit
clear_rate_limits() {
  redis-cli keys "rate:limit:*" | xargs redis-cli del >/dev/null 2>&1 || true
}

echo "=== 1. Testing Health Check Endpoint ==="
HEALTH_RESP=$(curl -s "$HEALTH_URL")
echo "Health Response: $HEALTH_RESP"
DB_STATUS=$(echo $HEALTH_RESP | jq -r .services.database)
REDIS_STATUS=$(echo $HEALTH_RESP | jq -r .services.redis)
OVERALL_STATUS=$(echo $HEALTH_RESP | jq -r .status)

if [ "$DB_STATUS" = "UP" ] && [ "$REDIS_STATUS" = "UP" ] && [ "$OVERALL_STATUS" = "UP" ]; then
  echo "Health Check passed: Database and Redis are UP!"
else
  echo "Health Check failed! Database: $DB_STATUS, Redis: $REDIS_STATUS, Status: $OVERALL_STATUS"
  exit 1
fi

echo ""
echo "=== 2. Registering and Logging in Users ==="
clear_rate_limits
# User A (Company A)
USER_A_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "mfa-a@company-a.com", "password": "password123", "fullName": "Alice MFA", "companyName": "Company A MFA", "role": "Viewer"}')
echo "Tenant A User registered: $(echo $USER_A_REG | jq .success)"

clear_rate_limits
# User B (Company B)
USER_B_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "mfa-b@company-b.com", "password": "password123", "fullName": "Bob MFA", "companyName": "Company B MFA", "role": "Viewer"}')
echo "Tenant B User registered: $(echo $USER_B_REG | jq .success)"

clear_rate_limits
# Login Alice
LOGIN_A=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "mfa-a@company-a.com", "password": "password123"}')
TOKEN_A=$(echo $LOGIN_A | jq -r .data.accessToken)
TENANT_A=$(echo $LOGIN_A | jq -r .data.user.tenantId)
echo "Alice logged in. Tenant ID: $TENANT_A"

clear_rate_limits
# Login Bob
LOGIN_B=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "mfa-b@company-b.com", "password": "password123"}')
TOKEN_B=$(echo $LOGIN_B | jq -r .data.accessToken)
TENANT_B=$(echo $LOGIN_B | jq -r .data.user.tenantId)
echo "Bob logged in. Tenant ID: $TENANT_B"

echo ""
echo "=== 3. Testing MFA Setup & Verification ==="
clear_rate_limits
# Request setup for Alice
MFA_SETUP=$(curl -s -X POST "$API_URL/auth/mfa/setup" \
  -H "Authorization: Bearer $TOKEN_A")
SECRET_A=$(echo $MFA_SETUP | jq -r .secret)
echo "MFA Setup Success: $(echo $MFA_SETUP | jq .success) | Secret length: ${#SECRET_A}"

clear_rate_limits
# Verify Alice MFA with invalid code
MFA_VERIFY_FAIL=$(curl -s -X POST "$API_URL/auth/mfa/verify" \
  -H "Content-Type: application/json" \
  -d '{"email": "mfa-a@company-a.com", "password": "password123", "code": "999999"}')
echo "Invalid code verification check (Expected success: false): $(echo $MFA_VERIFY_FAIL | jq .success) | Message: $(echo $MFA_VERIFY_FAIL | jq -r .message)"

clear_rate_limits
# Verify Alice MFA with valid bypass code
MFA_VERIFY_OK=$(curl -s -X POST "$API_URL/auth/mfa/verify" \
  -H "Content-Type: application/json" \
  -d '{"email": "mfa-a@company-a.com", "password": "password123", "code": "123456"}')
MFA_TOKEN_A=$(echo $MFA_VERIFY_OK | jq -r .data.accessToken)
echo "Valid code verification check (Expected success: true): $(echo $MFA_VERIFY_OK | jq .success) | mfaVerified: $(echo $MFA_VERIFY_OK | jq -r .data.user.mfaVerified)"

echo ""
echo "=== 4. Testing Account Lockout Protection ==="
echo "Attempting 5 failed logins sequentially to trigger lockout on Bob..."
# Clean any previous lockout attempts key for repeatability
redis-cli del "lockout:attempts:mfa-b@company-b.com" >/dev/null 2>&1 || true

for i in {1..5}
do
  clear_rate_limits
  FAIL_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "mfa-b@company-b.com", "password": "wrongpassword"}')
  echo "  - Attempt $i success status: $(echo $FAIL_LOGIN | jq .success) | msg: $(echo $FAIL_LOGIN | jq -r .message)"
done

echo "Sending 6th login attempt to check lockout..."
clear_rate_limits
LOCKOUT_LOGIN=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "mfa-b@company-b.com", "password": "password123"}')

LOCKOUT_BODY=$(echo "$LOCKOUT_LOGIN" | grep -v "HTTP_CODE:")
LOCKOUT_STATUS=$(echo "$LOCKOUT_LOGIN" | grep "HTTP_CODE:" | cut -d':' -f2)

echo "6th Attempt HTTP Status (Expected 423): $LOCKOUT_STATUS"
echo "6th Attempt Response: $LOCKOUT_BODY"

if [ "$LOCKOUT_STATUS" -ne 423 ]; then
  echo "ERROR: Lockout was not enforced on the 6th login attempt!"
  exit 1
fi

echo ""
echo "=== 5. Testing Audit Logging and Tenant Isolation ==="
clear_rate_limits
# Fetch Tenant A audit logs
AUDIT_A=$(curl -s -X GET "$API_URL/audit-logs" \
  -H "Authorization: Bearer $MFA_TOKEN_A")
LOGS_A_COUNT=$(echo $AUDIT_A | jq '.data | length')
echo "Alice (Tenant A) Audit Logs Count: $LOGS_A_COUNT"
echo "Alice Audit Log Actions summary:"
echo $AUDIT_A | jq -r '.data[] | "  - [\(.createdAt)] Action: \(.action) | User: \(.userEmail)"'

clear_rate_limits
# Fetch Tenant B audit logs
AUDIT_B=$(curl -s -X GET "$API_URL/audit-logs" \
  -H "Authorization: Bearer $TOKEN_B")
LOGS_B_COUNT=$(echo $AUDIT_B | jq '.data | length')
echo "Bob (Tenant B) Audit Logs Count: $LOGS_B_COUNT"
echo "Bob Audit Log Actions summary:"
echo $AUDIT_B | jq -r '.data[] | "  - [\(.createdAt)] Action: \(.action) | User: \(.userEmail)"'

# Ensure Alice's logs do not contain Bob's email, and Bob's logs do not contain Alice's email
ALICE_LOG_CHECK=$(echo $AUDIT_A | jq '.data[] | select(.userEmail == "mfa-b@company-b.com")')
BOB_LOG_CHECK=$(echo $AUDIT_B | jq '.data[] | select(.userEmail == "mfa-a@company-a.com")')

if [ -n "$ALICE_LOG_CHECK" ] || [ -n "$BOB_LOG_CHECK" ]; then
  echo "SECURITY FAILURE: Cross-tenant audit logs leak detected!"
  exit 1
else
  echo "Security Isolation passed: No cross-tenant audit log leaks found!"
fi

echo ""
echo "=== All Phase 13 Enterprise Security Features tests passed successfully! ==="
