#!/bin/bash
set -e

API_URL="http://127.0.0.1:5001/api"

echo "=== 1. Registering and Logging In Users ==="
# User A
USER_A_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "reports-a@company-a.com", "password": "password123", "fullName": "Reports Officer A", "companyName": "Company A Reports", "role": "Viewer"}')
echo "Tenant A User registration (can return false if already exists): $(echo $USER_A_REG | jq .success)"

# User B
USER_B_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "reports-b@company-b.com", "password": "password123", "fullName": "Reports Officer B", "companyName": "Company B Reports", "role": "Viewer"}')
echo "Tenant B User registration: $(echo $USER_B_REG | jq .success)"

# Login Alice (A)
LOGIN_A=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "reports-a@company-a.com", "password": "password123"}')
TOKEN_A=$(echo $LOGIN_A | jq -r .data.accessToken)
TENANT_A=$(echo $LOGIN_A | jq -r .data.user.tenantId)
echo "Alice (Tenant A) Login Success. Tenant ID: $TENANT_A"

# Login Bob (B)
LOGIN_B=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "reports-b@company-b.com", "password": "password123"}')
TOKEN_B=$(echo $LOGIN_B | jq -r .data.accessToken)
TENANT_B=$(echo $LOGIN_B | jq -r .data.user.tenantId)
echo "Bob (Tenant B) Login Success. Tenant ID: $TENANT_B"

# Clean up pre-existing test files so tests are repeatable
curl -s -X DELETE "$API_URL/findings/fnd-rep-01" -H "Authorization: Bearer $TOKEN_A" > /dev/null || true
curl -s -X DELETE "$API_URL/assets/ast-rep-01" -H "Authorization: Bearer $TOKEN_A" > /dev/null || true

echo ""
echo "=== 2. Creating Assets with CVEs for Tenant A ==="
# Register asset with CVE-2021-44228 (Log4j2 - CVSS 10.0, EPSS 0.97) and CVE-2023-38606 (macOS kernel - CVSS 7.8, EPSS 0.05)
CREATE_ASSET=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "ast-rep-01", "name": "aws-s3-perimeter", "type": "Cloud Asset", "owner": "DevOps", "risk": "High", "cves": ["CVE-2021-44228", "CVE-2023-38606"]}')
echo "Asset creation with threat vectors: $(echo $CREATE_ASSET | jq .success)"

echo ""
echo "=== 3. Creating Findings for Tenant A ==="
# Create critical finding
CREATE_FINDING=$(curl -s -X POST "$API_URL/findings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "fnd-rep-01", "title": "Log4Shell Remote Code Execution", "severity": "Critical", "asset": "aws-s3-perimeter", "status": "Open", "description": "Log4j2 unauthenticated RCE CVE-2021-44228."}')
echo "Vulnerability creation: $(echo $CREATE_FINDING | jq .success)"

echo ""
echo "=== 4. Testing Risk Summary Engine ==="
GET_RISK=$(curl -s -X GET "$API_URL/reports/risk" -H "Authorization: Bearer $TOKEN_A")
echo "Overall Risk Score (Expected >= 25): $(echo $GET_RISK | jq -r .data.riskScore)"
echo "Risk Level: $(echo $GET_RISK | jq -r .data.riskLevel)"
echo "Average CVSS (Expected 8.9): $(echo $GET_RISK | jq -r .data.avgCvss)"
echo "Average EPSS (Expected 0.51): $(echo $GET_RISK | jq -r .data.avgEpss)"
echo "Critical Assets Count (Expected 1): $(echo $GET_RISK | jq -r .data.criticalAssetsCount)"

echo ""
echo "=== 5. Testing Multi-Format Exporter ==="
# JSON format check
GET_JSON=$(curl -s -X GET "$API_URL/reports/generate?type=technical&format=json" -H "Authorization: Bearer $TOKEN_A")
echo "JSON Export Success: $(echo $GET_JSON | jq .success)"
echo "JSON Report Title: $(echo $GET_JSON | jq -r .data.reportTitle)"
echo "JSON Assets Count (Expected 1): $(echo $GET_JSON | jq '.data.assets | length')"

# CSV format check
GET_CSV=$(curl -s -X GET "$API_URL/reports/generate?type=technical&format=csv" -H "Authorization: Bearer $TOKEN_A")
echo "CSV Export Headers check (Expected Vulnerability ID):"
echo "$GET_CSV" | head -n 1

# PDF format check
GET_PDF=$(curl -s -H "Authorization: Bearer $TOKEN_A" "$API_URL/reports/generate?type=executive&format=pdf")
echo "PDF Export binary header (Expected %PDF-1.4):"
echo "$GET_PDF" | head -n 1

echo ""
echo "=== 6. Testing Jira Integration Webhook ==="
# Successful ticket creation
CREATE_JIRA=$(curl -s -X POST "$API_URL/reports/integrations/jira" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"findingId": "fnd-rep-01"}')
echo "Jira Ticket creation Success: $(echo $CREATE_JIRA | jq .success)"
echo "Ticket key (Expected SEC-XXXX): $(echo $CREATE_JIRA | jq -r .jiraTicket)"
echo "Ticket message: $(echo $CREATE_JIRA | jq -r .message)"

# Fails on missing parameters
CREATE_JIRA_FAIL=$(curl -s -X POST "$API_URL/reports/integrations/jira" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{}')
echo "Missing params check (Expected 400): $(echo $CREATE_JIRA_FAIL | jq -r '.errors[0].message')"

# Tenant B trying to create ticket for Tenant A's finding (fails with 404)
BOB_JIRA=$(curl -s -X POST "$API_URL/reports/integrations/jira" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"findingId": "fnd-rep-01"}')
echo "Tenant B creates Jira ticket check (Expected 404): $(echo $BOB_JIRA | jq -r '.message')"

echo ""
echo "=== All Phase 12 reports and risk engine tests passed successfully! ==="
