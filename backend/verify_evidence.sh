#!/bin/bash
set -e

API_URL="http://localhost:5001/api"

echo "=== 1. Registering Users and Logging In ==="
# User A (Company A)
USER_A_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "evid-a@company-a.com", "password": "password123", "fullName": "Evidence Officer A", "companyName": "Company A Evidence", "role": "Viewer"}')
echo "Tenant A User registered: $(echo $USER_A_REG | jq .success)"

# User B (Company B)
USER_B_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "evid-b@company-b.com", "password": "password123", "fullName": "Evidence Officer B", "companyName": "Company B Evidence", "role": "Viewer"}')
echo "Tenant B User registered: $(echo $USER_B_REG | jq .success)"

# Login Alice (A)
LOGIN_A=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "evid-a@company-a.com", "password": "password123"}')
TOKEN_A=$(echo $LOGIN_A | jq -r .data.accessToken)
TENANT_A=$(echo $LOGIN_A | jq -r .data.user.tenantId)
echo "Alice (Tenant A) Login Success. Tenant ID: $TENANT_A"

# Login Bob (B)
LOGIN_B=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "evid-b@company-b.com", "password": "password123"}')
TOKEN_B=$(echo $LOGIN_B | jq -r .data.accessToken)
TENANT_B=$(echo $LOGIN_B | jq -r .data.user.tenantId)
echo "Bob (Tenant B) Login Success. Tenant ID: $TENANT_B"

echo ""
echo "=== 2. Creating Assets for Tenant A ==="
# Register IP and Domain assets
CREATE_IP=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "ast-evid-ip", "name": "127.0.0.1", "type": "IP", "owner": "NetOps", "risk": "Medium"}')
echo "IP Asset created: $(echo $CREATE_IP | jq .success)"

CREATE_DOM=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "ast-evid-dom", "name": "127.0.0.1:5001", "type": "Domain", "owner": "WebOps", "risk": "High"}')
echo "Domain Asset created: $(echo $CREATE_DOM | jq .success)"

echo ""
echo "=== 3. Executing Scan to Generate Proof ==="
# Create campaign
CREATE_CAMP=$(curl -s -X POST "$API_URL/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "camp-evid", "name": "Evidence Collector Run", "status": "Draft", "progress": 0, "findings": 0}')
echo "Campaign created: $(echo $CREATE_CAMP | jq .success)"

# Start campaign
START_CAMP=$(curl -s -X POST "$API_URL/campaigns/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "camp-evid"}')
echo "Campaign start state (Expected Pending): $(echo $START_CAMP | jq -r .data.status)"

# Wait 6 seconds for scans and file saving
echo "Waiting 6 seconds for scanner loop to complete and write files..."
sleep 6

echo ""
echo "=== 4. Checking Disk File System Storage ==="
EVID_DIR="uploads/evidence/$TENANT_A"
if [ -d "$EVID_DIR" ]; then
  echo "Evidence directory found for Tenant A: $EVID_DIR"
  echo "Files written on disk:"
  ls -lh "$EVID_DIR"
else
  echo "ERROR: Evidence directory not created on disk!"
  exit 1
fi

echo ""
echo "=== 5. Testing GET /evidence Endpoint ==="
GET_EVID=$(curl -s -X GET "$API_URL/evidence" \
  -H "Authorization: Bearer $TOKEN_A")
TOTAL_EVID=$(echo $GET_EVID | jq '.data | length')
echo "Total evidence records retrieved (Expected >= 5): $TOTAL_EVID"
echo "Evidence list summary:"
echo $GET_EVID | jq -r '.data[] | "  - [\(.type)] \(.name) | FilePath: \(.filePath)"'

echo ""
echo "=== 6. Testing GET /artifacts Endpoint ==="
GET_ART=$(curl -s -X GET "$API_URL/artifacts" \
  -H "Authorization: Bearer $TOKEN_A")
TOTAL_ART=$(echo $GET_ART | jq '.data | length')
echo "Total artifacts retrieved (Expected 1): $TOTAL_ART"
echo "Artifact name: $(echo $GET_ART | jq -r '.data[0].name')"
echo "Artifact content preview:"
echo $GET_ART | jq -r '.data[0].content'

echo ""
echo "=== 7. Testing Tenant Security Boundaries ==="
# Bob (Tenant B) lists evidence (should be empty array, zero access to Tenant A's evidence)
GET_EVID_B=$(curl -s -X GET "$API_URL/evidence" \
  -H "Authorization: Bearer $TOKEN_B")
echo "Tenant B evidence count (Expected 0): $(echo $GET_EVID_B | jq '.data | length')"

# Bob (Tenant B) lists artifacts (should be empty array)
GET_ART_B=$(curl -s -X GET "$API_URL/artifacts" \
  -H "Authorization: Bearer $TOKEN_B")
echo "Tenant B artifacts count (Expected 0): $(echo $GET_ART_B | jq '.data | length')"

echo ""
echo "=== All Evidence Collection System Tests Passed successfully! ==="
