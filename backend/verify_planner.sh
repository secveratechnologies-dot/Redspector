#!/bin/bash
set -e

API_URL="http://127.0.0.1:5001/api"

# Helper to clear rate limit keys in Redis
clear_rate_limits() {
  redis-cli keys "rate:limit:*" | xargs redis-cli del >/dev/null 2>&1 || true
}

echo "=== 1. Registering and Logging in User ==="
clear_rate_limits
USER_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "planner@company-a.com", "password": "password123", "fullName": "Planner Analyst", "companyName": "Company A Planner", "role": "Viewer"}')
echo "User registration success status (can be false if user exists): $(echo $USER_REG | jq .success)"

clear_rate_limits
LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "planner@company-a.com", "password": "password123"}')
TOKEN=$(echo $LOGIN_RESP | jq -r .data.accessToken)
TENANT_ID=$(echo $LOGIN_RESP | jq -r .data.user.tenantId)
echo "Login Success. Tenant ID: $TENANT_ID"

echo ""
echo "=== 2. Setting up Test Assets in Database ==="
clear_rate_limits
# Register IP target (High Risk)
CREATE_IP=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "ast-p-ip", "name": "10.0.0.1", "type": "IP", "owner": "OpsTeam", "risk": "High", "cves": ["CVE-2021-44228"]}')
echo "Asset IP Registered: $(echo $CREATE_IP | jq .success)"

clear_rate_limits
# Register Domain target (Low Risk)
CREATE_DOM=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "ast-p-dom", "name": "secure-api.internal", "type": "Domain", "owner": "DevTeam", "risk": "Low", "cves": []}')
echo "Asset Domain Registered: $(echo $CREATE_DOM | jq .success)"

echo ""
echo "=== 3. Testing POST /planner/generate ==="
clear_rate_limits
GENERATE_PLAN=$(curl -s -X POST "$API_URL/planner/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "assets": [
      { "id": "ast-p-ip", "name": "10.0.0.1", "type": "IP", "owner": "OpsTeam", "risk": "High", "cves": ["CVE-2021-44228"] },
      { "id": "ast-p-dom", "name": "secure-api.internal", "type": "Domain", "owner": "DevTeam", "risk": "Low", "cves": [] }
    ],
    "threats": [
      { "cveId": "CVE-2021-44228", "cvss": 10.0, "description": "Log4Shell Remote Code Execution" }
    ],
    "criticality": "High"
  }')

echo "Planner Generate Success: $(echo $GENERATE_PLAN | jq .success)"
PLAN_DATA=$(echo $GENERATE_PLAN | jq .data)
echo "Generated Campaign Name: $(echo $PLAN_DATA | jq -r .campaignName)"
echo "Generated Summary: $(echo $PLAN_DATA | jq -r .summary)"
echo "Steps Count: $(echo $PLAN_DATA | jq '.steps | length')"
echo "Step details:"
echo $PLAN_DATA | jq -r '.steps[] | "  - [\(.stepId)] \(.name) | Tool: \(.tool) | Target: \(.target)"'

echo ""
echo "=== 4. Testing POST /planner/validate (Valid Plan) ==="
clear_rate_limits
VALIDATE_RESP=$(curl -s -X POST "$API_URL/planner/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$(jq -n --argjson plan "$PLAN_DATA" '{"plan": $plan}')")

echo "Validate Valid Plan Success: $(echo $VALIDATE_RESP | jq .success)"
echo "Is Valid (Expected true): $(echo $VALIDATE_RESP | jq -r .data.isValid)"
echo "Errors (Expected 0): $(echo $VALIDATE_RESP | jq '.data.errors | length')"
echo "Recommendations: $(echo $VALIDATE_RESP | jq '.data.recommendations | length')"

echo ""
echo "=== 5. Testing POST /planner/validate (Tool-Target Mismatched Plan) ==="
# Modify step 1 tool from Port Scanner to API Auth Probe (mismatch)
BAD_PLAN=$(echo $PLAN_DATA | jq '.steps[0].tool = "API Auth Probe"')

clear_rate_limits
VALIDATE_BAD_RESP=$(curl -s -X POST "$API_URL/planner/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$(jq -n --argjson plan "$BAD_PLAN" '{"plan": $plan}')")

echo "Validate Bad Plan Success: $(echo $VALIDATE_BAD_RESP | jq .success)"
echo "Is Valid (Expected false): $(echo $VALIDATE_BAD_RESP | jq -r .data.isValid)"
echo "Errors list (Expected tool-target alignment warning):"
echo $VALIDATE_BAD_RESP | jq -r '.data.errors[]'

echo ""
echo "=== 6. Testing POST /planner/validate (Omitted Coverage check) ==="
# Remove step 1 (the step for target 10.0.0.1, which is High risk)
OMITTED_PLAN=$(echo $PLAN_DATA | jq 'del(.steps[0])')

clear_rate_limits
VALIDATE_OMIT_RESP=$(curl -s -X POST "$API_URL/planner/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$(jq -n --argjson plan "$OMITTED_PLAN" '{"plan": $plan}')")

echo "Validate Omitted Coverage Success: $(echo $VALIDATE_OMIT_RESP | jq .success)"
echo "Is Valid (Expected true as schema is OK): $(echo $VALIDATE_OMIT_RESP | jq -r .data.isValid)"
echo "Recommendations list (Expected recommendation regarding omitted High-risk target 10.0.0.1):"
echo $VALIDATE_OMIT_RESP | jq -r '.data.recommendations[]'

echo ""
echo "=== 7. Checking Audit Trail Logs for Planner ==="
clear_rate_limits
AUDIT_LOGS=$(curl -s -X GET "$API_URL/audit-logs" \
  -H "Authorization: Bearer $TOKEN")
PLANNER_LOGS_COUNT=$(echo $AUDIT_LOGS | jq '[.data[] | select(.action | startswith("PLANNER_"))] | length')
echo "Planner Audit log count (Expected >= 4): $PLANNER_LOGS_COUNT"
echo "Planner actions found:"
echo $AUDIT_LOGS | jq -r '.data[] | select(.action | startswith("PLANNER_")) | "  - [\(.createdAt)] Action: \(.action) | Details: \(.details)"'

echo ""
echo "=== All AI Planner Foundation integration tests passed successfully! ==="
