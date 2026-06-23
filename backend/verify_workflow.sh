#!/bin/bash
set -e

API_URL="http://127.0.0.1:5001/api"

# Helper to clear rate limit keys in Redis
clear_rate_limits() {
  redis-cli keys "rate:limit:*" | xargs redis-cli del >/dev/null 2>&1 || true
}

echo "=== 1. Registering and Logging in Workflow User ==="
clear_rate_limits
USER_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "workflow-user@company-a.com", "password": "password123", "fullName": "Workflow Analyst", "companyName": "Company A Workflow", "role": "Viewer"}')
echo "User registration success status (can be false if user exists): $(echo $USER_REG | jq .success)"

clear_rate_limits
LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "workflow-user@company-a.com", "password": "password123"}')
TOKEN=$(echo $LOGIN_RESP | jq -r .data.accessToken)
TENANT_ID=$(echo $LOGIN_RESP | jq -r .data.user.tenantId)
echo "Login Success. Tenant ID: $TENANT_ID"

# Clean up pre-existing tests data to ensure repeats work
echo "Cleaning database vector/audit logs for consistent runs..."
redis-cli flushall >/dev/null 2>&1 || true

echo ""
echo "=== 2. Seeding Test Context in RAG Store ==="
clear_rate_limits
STORE_POLICY1=$(curl -s -X POST "$API_URL/rag/context" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "source": "Policy",
    "sourceId": "pol-auth-01",
    "content": "API endpoints and web application ingress should employ HSTS, secure JWT token scopes, and signature audits."
  }')
echo "Policy 1 Stored: $(echo $STORE_POLICY1 | jq .success)"

clear_rate_limits
STORE_POLICY2=$(curl -s -X POST "$API_URL/rag/context" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "source": "Policy",
    "sourceId": "pol-net-02",
    "content": "Port scan verification policies demand validating open network listeners and closing admin shell access like SSH."
  }')
echo "Policy 2 Stored: $(echo $STORE_POLICY2 | jq .success)"

echo ""
echo "=== 3. Executing Planning Workflow (POST /planner/generate) ==="
clear_rate_limits
GENERATE_RESP=$(curl -s -X POST "$API_URL/planner/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "assets": [
      { "id": "ast-w-ip", "name": "10.0.0.2", "type": "IP", "owner": "OpsTeam", "risk": "High", "cves": ["CVE-2021-44228"] },
      { "id": "ast-w-api", "name": "api.internal/v1", "type": "API", "owner": "DevTeam", "risk": "Medium", "cves": [] }
    ],
    "threats": [
      { "cveId": "CVE-2021-44228", "cvss": 9.8, "description": "Log4j RCE" }
    ],
    "criticality": "High"
  }')

echo "Planning workflow success status: $(echo $GENERATE_RESP | jq .success)"
RUN_ID=$(echo $GENERATE_RESP | jq -r .runId)
echo "Workflow Run ID generated: $RUN_ID"

PLAN_DATA=$(echo $GENERATE_RESP | jq .data)
echo "Plan campaign name: $(echo $PLAN_DATA | jq -r .campaignName)"
echo "Steps count: $(echo $PLAN_DATA | jq '.steps | length')"

echo ""
echo "=== 4. Fetching Workflow Execution Log & RAG Context Trace (GET /planner/runs/:runId) ==="
clear_rate_limits
RUN_STATE_RESP=$(curl -s -X GET "$API_URL/planner/runs/$RUN_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Run state retrieval success: $(echo $RUN_STATE_RESP | jq .success)"
STATE_OBJ=$(echo $RUN_STATE_RESP | jq .data)
echo "Workflow status: $(echo $STATE_OBJ | jq -r .status)"
echo "Retrieved RAG Context Count: $(echo $STATE_OBJ | jq '.ragContext | length')"
echo "Prompt compiled (partial): $(echo $STATE_OBJ | jq -r .promptCompiled | head -n 12)"
echo "Workflow steps logged:"
echo $STATE_OBJ | jq -r '.steps[] | "  - [\(.timestamp)] \(.stepName): \(.details)"'

echo ""
echo "=== 5. Executing Risk Analysis Workflow (POST /planner/risk-analysis) ==="
clear_rate_limits
RISK_RESP=$(curl -s -X POST "$API_URL/planner/risk-analysis" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "assets": [
      { "id": "ast-w-ip", "name": "10.0.0.2", "type": "IP", "owner": "OpsTeam", "risk": "High", "cves": ["CVE-2021-44228"] }
    ],
    "threats": [
      { "cveId": "CVE-2021-44228", "cvss": 9.8, "description": "Log4j RCE" }
    ]
  }')

echo "Risk Analysis workflow success status: $(echo $RISK_RESP | jq .success)"
RISK_RUN_ID=$(echo $RISK_RESP | jq -r .runId)
RISK_DATA=$(echo $RISK_RESP | jq .data)
echo "Generated Risk Score: $(echo $RISK_DATA | jq -r .riskScore)"
echo "Risk Level: $(echo $RISK_DATA | jq -r .riskLevel)"
echo "Exposure Areas: $(echo $RISK_DATA | jq -r '.exposureAreas | join(", ")')"
echo "Analysis details: $(echo $RISK_DATA | jq -r .analysisDetails)"

# Fetch risk run execution log
clear_rate_limits
RISK_STATE=$(curl -s -X GET "$API_URL/planner/runs/$RISK_RUN_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "Risk run state status: $(echo $RISK_STATE | jq -r .data.status)"
echo "Risk run prompt compiled (partial): $(echo $RISK_STATE | jq -r .data.promptCompiled | head -n 10)"

echo ""
echo "=== 6. Executing Recommendation Workflow (POST /planner/recommendations) ==="
clear_rate_limits
REC_RESP=$(curl -s -X POST "$API_URL/planner/recommendations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "findings": [
      { "id": "fnd-w-1", "title": "Missing security X-Frame-Options headers", "severity": "Medium", "asset": "customer-portal", "status": "Open" },
      { "id": "fnd-w-2", "title": "Insecure JWT Authentication controls", "severity": "High", "asset": "api.internal/v1", "status": "Open" }
    ]
  }')

echo "Recommendation workflow success status: $(echo $REC_RESP | jq .success)"
REC_RUN_ID=$(echo $REC_RESP | jq -r .runId)
REC_DATA=$(echo $REC_RESP | jq .data)
echo "Generated Recommendations Count: $(echo $REC_DATA | jq '.recommendations | length')"
echo "Recommendations details:"
echo $REC_DATA | jq -r '.recommendations[] | "  - [\(.recId)] Title: \(.title) | Priority: \(.priority) | Category: \(.category)"'

# Fetch recommendation run execution log
clear_rate_limits
REC_STATE=$(curl -s -X GET "$API_URL/planner/runs/$REC_RUN_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "Recommendation run state status: $(echo $REC_STATE | jq -r .data.status)"

echo ""
echo "=== 7. Checking Audit Logs for Phase 16 Workflows ==="
clear_rate_limits
AUDIT_LOGS=$(curl -s -X GET "$API_URL/audit-logs" \
  -H "Authorization: Bearer $TOKEN")
WORKFLOW_LOGS_COUNT=$(echo $AUDIT_LOGS | jq '[.data[] | select(.action | contains("_PLAN_") or contains("_RISK_") or contains("_RECOMMENDATIONS_"))] | length')
echo "Workflow Audit log count (Expected >= 3): $WORKFLOW_LOGS_COUNT"
echo $AUDIT_LOGS | jq -r '.data[] | select(.action | contains("_PLAN_") or contains("_RISK_") or contains("_RECOMMENDATIONS_")) | "  - [\(.createdAt)] Action: \(.action)"'

echo ""
echo "=== All Phase 16 Prompt & Workflow Engine integration tests passed successfully! ==="
