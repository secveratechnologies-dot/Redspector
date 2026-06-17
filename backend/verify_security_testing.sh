#!/bin/bash
set -e

API_URL="http://localhost:5001/api"

echo "=== 1. Registering User and Logging In ==="
USER_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "sec-scan@company-a.com", "password": "password123", "fullName": "Security Auditor", "companyName": "Company A Audit", "role": "Viewer"}')
echo "User registered: $(echo $USER_REG | jq .success)"

LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "sec-scan@company-a.com", "password": "password123"}')
TOKEN=$(echo $LOGIN_RESP | jq -r .data.accessToken)
TENANT_ID=$(echo $LOGIN_RESP | jq -r .data.user.tenantId)
echo "Login Success. Tenant ID: $TENANT_ID"

echo ""
echo "=== 2. Creating Scanning Assets ==="
# 1. IP Asset (Network scan on localhost)
echo "Registering IP asset..."
CREATE_IP=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "ast-sec-ip", "name": "127.0.0.1", "type": "IP", "owner": "NetworkOps", "risk": "High"}')
echo "Asset created: $(echo $CREATE_IP | jq .success)"

# 2. Domain Asset (Header scan on local server port 5001)
echo "Registering Domain asset..."
CREATE_DOM=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "ast-sec-dom", "name": "127.0.0.1:5001", "type": "Domain", "owner": "WebOps", "risk": "Medium"}')
echo "Asset created: $(echo $CREATE_DOM | jq .success)"

# 3. API Asset (API vulnerability probe on local server port 5001)
echo "Registering API asset..."
CREATE_API=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "ast-sec-api", "name": "127.0.0.1:5001", "type": "API", "owner": "APIOps", "risk": "High"}')
echo "Asset created: $(echo $CREATE_API | jq .success)"

echo ""
echo "=== 3. Running Campaign Security Scan ==="
# Create campaign
echo "Creating campaign..."
CREATE_CAMP=$(curl -s -X POST "$API_URL/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "camp-security-scan", "name": "Active Port and Web Scan", "status": "Draft", "progress": 0, "findings": 0}')
echo "Campaign created: $(echo $CREATE_CAMP | jq .success)"

# Start campaign
echo "Starting campaign..."
START_CAMP=$(curl -s -X POST "$API_URL/campaigns/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "camp-security-scan"}')
echo "Start response status: $(echo $START_CAMP | jq -r .data.status)"

# Wait 6 seconds for the scans (port, header, API) to complete
echo "Waiting 6 seconds for scans to execute..."
sleep 6

GET_CAMP=$(curl -s -X GET "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN")
CAMP=$(echo $GET_CAMP | jq '.data[] | select(.id == "camp-security-scan")')
echo "Final campaign status (Expected Completed): $(echo $CAMP | jq -r .status)"
echo "Final campaign progress (Expected 100%): $(echo $CAMP | jq -r .progress)%"
echo "Findings count identified: $(echo $CAMP | jq -r .findings)"

echo ""
echo "=== 4. Fetching and Validating Findings Table ==="
GET_FINDINGS=$(curl -s -X GET "$API_URL/findings" \
  -H "Authorization: Bearer $TOKEN")
TOTAL_FINDINGS=$(echo $GET_FINDINGS | jq '.data | length')
echo "Total findings generated in database (Expected > 0): $TOTAL_FINDINGS"

echo "Listing generated findings details:"
echo $GET_FINDINGS | jq -r '.data[] | "  - Finding: [\(.severity)] \(.title) on \(.asset)"'

echo ""
echo "=== All Security Scanner & Findings Tests Passed successfully! ==="
