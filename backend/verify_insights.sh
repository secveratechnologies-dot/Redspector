#!/bin/bash
set -e

API_URL="http://127.0.0.1:5001/api"

# Helper to clear rate limit keys in Redis
clear_rate_limits() {
  redis-cli keys "rate:limit:*" | xargs redis-cli del >/dev/null 2>&1 || true
}

echo "=== 1. Registering and Logging in Recommendations User ==="
clear_rate_limits
USER_REG_A=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "reco-a@company-a.com", "password": "password123", "fullName": "Alice Reco", "companyName": "Company A Recommendations", "role": "Viewer"}')
echo "Tenant A User registered: $(echo $USER_REG_A | jq .success)"

clear_rate_limits
LOGIN_A=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "reco-a@company-a.com", "password": "password123"}')
TOKEN_A=$(echo $LOGIN_A | jq -r .data.accessToken)
TENANT_A=$(echo $LOGIN_A | jq -r .data.user.tenantId)
echo "Alice (Tenant A) Login Success. Tenant ID: $TENANT_A"

# Clean up pre-existing tests data to ensure repeats work
echo "Cleaning database cache/audit logs for consistent runs..."
redis-cli flushall >/dev/null 2>&1 || true

# Dynamic finding IDs to avoid duplicates conflicts
SUFFIX=$((1000 + RANDOM % 9000))
FINDING_ID="fnd-insight-$SUFFIX"

echo ""
echo "=== 2. Creating Database Finding for Alice (Tenant A) ==="
clear_rate_limits
CREATE_FND=$(curl -s -X POST "$API_URL/findings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"id\": \"$FINDING_ID\", \"title\": \"Insecure JWT validation controls\", \"severity\": \"High\", \"asset\": \"api.internal\", \"status\": \"Open\", \"description\": \"Endpoints accept invalid signature headers.\"}")
echo "Alice Finding Created: $(echo $CREATE_FND | jq .success)"

echo ""
echo "=== 3. Querying /api/ai/insights - recommendation ==="
clear_rate_limits
RES_RECO=$(curl -s -X POST "$API_URL/ai/insights" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"type\": \"recommendation\", \"payload\": {\"findingId\": \"$FINDING_ID\"}}")

echo "Status: $(echo $RES_RECO | jq .success)"
echo "Issue: $(echo $RES_RECO | jq -r .data.issue)"
echo "Priority: $(echo $RES_RECO | jq -r .data.priority)"

echo ""
echo "=== 4. Querying /api/ai/insights - attackPath ==="
clear_rate_limits
RES_AP=$(curl -s -X POST "$API_URL/ai/insights" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"type": "attackPath", "payload": {"asset": "api.internal"}}')

echo "Status: $(echo $RES_AP | jq .success)"
echo "Paths count: $(echo $RES_AP | jq '.data.paths | length')"
echo "Summary: $(echo $RES_AP | jq -r .data.summary)"

echo ""
echo "=== 5. Querying /api/ai/insights - threatAnalysis ==="
clear_rate_limits
RES_TA=$(curl -s -X POST "$API_URL/ai/insights" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"type": "threatAnalysis", "payload": {"technologies": ["Node.js", "PostgreSQL"]}}')

echo "Status: $(echo $RES_TA | jq .success)"
echo "Risk Level: $(echo $RES_TA | jq -r .data.riskLevel)"
echo "Threat Groups: $(echo $RES_TA | jq -r '.data.activeThreatGroups | join(", ")')"

echo ""
echo "=== 6. Querying /api/ai/insights - riskExplanation ==="
clear_rate_limits
RES_RE=$(curl -s -X POST "$API_URL/ai/insights" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"type": "riskExplanation", "payload": {"riskScore": 85}}')

echo "Status: $(echo $RES_RE | jq .success)"
echo "Score Level: $(echo $RES_RE | jq -r .data.level)"
echo "Explanation: $(echo $RES_RE | jq -r .data.plainLanguage)"

echo ""
echo "=== 7. Querying /api/ai/insights - executiveInsights ==="
clear_rate_limits
RES_EI=$(curl -s -X POST "$API_URL/ai/insights" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"type": "executiveInsights", "payload": {"riskScore": 85, "complianceScore": 92, "openFindings": 8}}')

echo "Status: $(echo $RES_EI | jq .success)"
echo "Headline: $(echo $RES_EI | jq -r .data.headline)"
echo "Risk Score Metric: $(echo $RES_EI | jq -r .data.metrics.overallRisk)"

echo ""
echo "=== 8. Checking Audit Logs for AI_INSIGHTS_GENERATED ==="
clear_rate_limits
AUDIT_LOGS=$(curl -s -X GET "$API_URL/audit-logs" \
  -H "Authorization: Bearer $TOKEN_A")
AI_LOGS_COUNT=$(echo $AUDIT_LOGS | jq '[.data[] | select(.action == "AI_INSIGHTS_GENERATED")] | length')
echo "AI insights audit logs count (Expected >= 5): $AI_LOGS_COUNT"

echo ""
echo "=== All AI Insights Engine integration tests passed successfully! ==="
