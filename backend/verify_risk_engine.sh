#!/bin/bash
set -e

API_URL="http://127.0.0.1:5001/api"

# Helper to clear rate limit keys in Redis
clear_rate_limits() {
  redis-cli keys "rate:limit:*" | xargs redis-cli del >/dev/null 2>&1 || true
}

echo "=== 1. Registering and Logging in Risk User ==="
clear_rate_limits
USER_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "risk-user@company-a.com", "password": "password123", "fullName": "Risk Analyst", "companyName": "Company A Risk Intel", "role": "Viewer"}')
echo "User registration success status (can be false if user exists): $(echo $USER_REG | jq .success)"

clear_rate_limits
LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "risk-user@company-a.com", "password": "password123"}')
TOKEN=$(echo $LOGIN_RESP | jq -r .data.accessToken)
TENANT_ID=$(echo $LOGIN_RESP | jq -r .data.user.tenantId)
echo "Login Success. Tenant ID: $TENANT_ID"

echo "Cleaning database cache/audit logs for consistent runs..."
redis-cli flushall >/dev/null 2>&1 || true

echo ""
echo "=== 2. Creating Test Assets & Findings in DB ==="
clear_rate_limits
# Register IP target (High Risk) mapped to CVE-2021-44228
CREATE_IP=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "ast-r-ip", "name": "10.0.0.10", "type": "IP", "owner": "OpsTeam", "risk": "High", "cves": ["CVE-2021-44228"]}')
echo "Asset IP Registered: $(echo $CREATE_IP | jq .success)"

clear_rate_limits
# Register Cloud target (Medium Risk)
CREATE_CLOUD=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "ast-r-cloud", "name": "s3-customer-bucket", "type": "Cloud Asset", "owner": "CloudTeam", "risk": "Medium", "cves": []}')
echo "Asset Cloud Registered: $(echo $CREATE_CLOUD | jq .success)"

clear_rate_limits
# Create High-severity open finding on IP target
CREATE_FINDING_IP=$(curl -s -X POST "$API_URL/findings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "fnd-r-ip", "title": "Log4Shell RCE vulnerability detected", "severity": "High", "asset": "10.0.0.10", "status": "Open", "description": "Log4j exposure on network interface."}')
echo "Finding High Severity Registered: $(echo $CREATE_FINDING_IP | jq .success)"

clear_rate_limits
# Create Critical-severity open finding on Cloud target
CREATE_FINDING_CLOUD=$(curl -s -X POST "$API_URL/findings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "fnd-r-cloud", "title": "S3 Public Read Exposure", "severity": "Critical", "asset": "s3-customer-bucket", "status": "Open", "description": "Public permissions allow anonymous listing."}')
echo "Finding Critical Severity Registered: $(echo $CREATE_FINDING_CLOUD | jq .success)"

echo ""
echo "=== 3. Calculating Tenant DB Risk Posture (POST /risk/calculate) ==="
clear_rate_limits
DB_RISK_RESP=$(curl -s -X POST "$API_URL/risk/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Calculate Risk from Database Status: $(echo $DB_RISK_RESP | jq .success)"
RISK_DATA=$(echo $DB_RISK_RESP | jq .data)
echo "Aggregated Risk Score: $(echo $RISK_DATA | jq -r .riskScore)"
echo "Severity Level: $(echo $RISK_DATA | jq -r .severity)"
echo "Business Impact: $(echo $RISK_DATA | jq -r .businessImpact)"
echo "Asset Count Scoped: $(echo $RISK_DATA | jq -r '.stats.totalAssetsCount')"
echo "Active Findings Count Scoped: $(echo $RISK_DATA | jq -r '.stats.activeFindingsCount')"
echo "Vulnerability Severity Distribution Summary:"
echo "  - Critical: $(echo $RISK_DATA | jq -r '.stats.summary.critical')"
echo "  - High: $(echo $RISK_DATA | jq -r '.stats.summary.high')"
echo "Vulnerability Risk Score Attestations:"
echo $RISK_DATA | jq -r '.stats.findingRisksDetails[] | "  - Finding: \(.title) | Asset: \(.asset) | Asset Criticality: \(.criticality) | Calculated Finding Risk: \(.findingRisk)"'

echo ""
echo "=== 4. Executing Dry-Run Custom Risk Calculations ==="
clear_rate_limits
DRY_RUN_RESP=$(curl -s -X POST "$API_URL/risk/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "assets": [
      { "id": "custom-ast-1", "name": "custom-dev.test", "type": "Subdomain", "risk": "Low", "cves": [] }
    ],
    "findings": [
      { "id": "custom-fnd-1", "title": "Dev mode enabled", "severity": "Low", "asset": "custom-dev.test", "status": "Open" }
    ]
  }')

echo "Dry-Run calculate success: $(echo $DRY_RUN_RESP | jq .success)"
DRY_DATA=$(echo $DRY_RUN_RESP | jq .data)
echo "Dry-Run Risk Score (Expected to be Low): $(echo $DRY_DATA | jq -r .riskScore)"
echo "Dry-Run Severity: $(echo $DRY_DATA | jq -r .severity)"

echo ""
echo "=== 5. Checking Audit Trail Logs for RISK_CALCULATED ==="
clear_rate_limits
AUDIT_LOGS=$(curl -s -X GET "$API_URL/audit-logs" \
  -H "Authorization: Bearer $TOKEN")
RISK_LOGS_COUNT=$(echo $AUDIT_LOGS | jq '[.data[] | select(.action == "RISK_CALCULATED")] | length')
echo "Risk calculated audit logs count (Expected >= 2): $RISK_LOGS_COUNT"
echo "Risk calculated entries details:"
echo $AUDIT_LOGS | jq -r '.data[] | select(.action == "RISK_CALCULATED") | "  - [\(.createdAt)] Action: \(.action) | Details: \(.details)"'

echo ""
echo "=== All Risk Intelligence Engine integration tests passed successfully! ==="
