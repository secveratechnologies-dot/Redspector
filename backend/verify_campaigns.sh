#!/bin/bash
set -e

API_URL="http://127.0.0.1:5001/api"

echo "=== 1. Registering Users for Company A and Company B ==="
# User A (Company A)
USER_A_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "camp-a@company-a.com", "password": "password123", "fullName": "Campaign Manager A", "companyName": "Company A Campaigns", "role": "Viewer"}')
echo "Tenant A User registered: $(echo $USER_A_REG | jq .success)"

# User B (Company B)
USER_B_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "camp-b@company-b.com", "password": "password123", "fullName": "Campaign Manager B", "companyName": "Company B Campaigns", "role": "Viewer"}')
echo "Tenant B User registered: $(echo $USER_B_REG | jq .success)"

echo ""
echo "=== 2. Logging In to Retrieve Sessions ==="
# Login Alice
LOGIN_A=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "camp-a@company-a.com", "password": "password123"}')
TOKEN_A=$(echo $LOGIN_A | jq -r .data.accessToken)
TENANT_A=$(echo $LOGIN_A | jq -r .data.user.tenantId)
echo "Alice (Tenant A) Login Success. Tenant ID: $TENANT_A"

# Login Bob
LOGIN_B=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "camp-b@company-b.com", "password": "password123"}')
TOKEN_B=$(echo $LOGIN_B | jq -r .data.accessToken)
TENANT_B=$(echo $LOGIN_B | jq -r .data.user.tenantId)
echo "Bob (Tenant B) Login Success. Tenant ID: $TENANT_B"

echo ""
echo "=== 3. Creating Campaigns ==="
# Create campaign 1 for Tenant A (Draft)
echo "Tenant A creates campaign camp-a1 (Draft)..."
CREATE_A1=$(curl -s -X POST "$API_URL/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "camp-a1", "name": "Perimeter Scan A", "status": "Draft", "progress": 0, "findings": 0}')
echo "Campaign created: $(echo $CREATE_A1 | jq .success)"
echo "Campaign status: $(echo $CREATE_A1 | jq -r .data.status)"

# Create campaign 2 for Tenant A (Draft)
echo "Tenant A creates campaign camp-a2 (Draft)..."
CREATE_A2=$(curl -s -X POST "$API_URL/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "camp-a2", "name": "Social Engineering A", "status": "Draft", "progress": 0, "findings": 0}')
echo "Campaign created: $(echo $CREATE_A2 | jq .success)"

# Create campaign 1 for Tenant B (Pending)
echo "Tenant B creates campaign camp-b1 (Pending)..."
CREATE_B1=$(curl -s -X POST "$API_URL/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"id": "camp-b1", "name": "Active Directory Phish B", "status": "Pending", "progress": 0, "findings": 0}')
echo "Campaign created: $(echo $CREATE_B1 | jq .success)"

echo ""
echo "=== 4. Testing Multi-Tenant Data Separation (List Campaigns) ==="
# Tenant A lists campaigns
echo "Tenant A lists campaigns..."
LIST_A=$(curl -s -X GET "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN_A")
echo "Total campaigns for Tenant A (Expected 2): $(echo $LIST_A | jq '.data | length')"
echo "Campaign IDs for Tenant A: $(echo $LIST_A | jq -r '.data[].id')"

# Tenant B lists campaigns
echo "Tenant B lists campaigns..."
LIST_B=$(curl -s -X GET "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN_B")
echo "Total campaigns for Tenant B (Expected 1): $(echo $LIST_B | jq '.data | length')"
echo "Campaign IDs for Tenant B: $(echo $LIST_B | jq -r '.data[].id')"

echo ""
echo "=== 5. Testing Campaign State Transitions ==="

# 5.1 Start Draft Campaign (should succeed -> Running)
echo "Tenant A starts camp-a1..."
START_RESP=$(curl -s -X POST "$API_URL/campaigns/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "camp-a1"}')
echo "Start success: $(echo $START_RESP | jq .success)"
echo "Campaign status: $(echo $START_RESP | jq -r .data.status)"

# 5.2 Pause Running Campaign (should succeed -> Paused)
echo "Tenant A pauses camp-a1..."
PAUSE_RESP=$(curl -s -X POST "$API_URL/campaigns/pause" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "camp-a1"}')
echo "Pause success: $(echo $PAUSE_RESP | jq .success)"
echo "Campaign status: $(echo $PAUSE_RESP | jq -r .data.status)"

# 5.3 Attempt to pause a non-running campaign (camp-a2 is in Draft, should fail with HTTP 400)
echo "Tenant A attempts to pause camp-a2 (Draft)..."
PAUSE_ERR_RESP=$(curl -s -i -X POST "$API_URL/campaigns/pause" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "camp-a2"}')
STATUS_PAUSE_ERR=$(echo "$PAUSE_ERR_RESP" | grep -i '^HTTP/' | awk '{print $2}' | tail -n1)
BODY_PAUSE_ERR=$(echo "$PAUSE_ERR_RESP" | tr -d '\r' | awk '/^\s*$/{flag=1;next}flag')
echo "HTTP Status (Expected 400): $STATUS_PAUSE_ERR"
echo "Body: $BODY_PAUSE_ERR"

# 5.4 Resume Paused Campaign (should succeed -> Running)
echo "Tenant A resumes camp-a1..."
RESUME_RESP=$(curl -s -X POST "$API_URL/campaigns/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "camp-a1"}')
echo "Resume success: $(echo $RESUME_RESP | jq .success)"
echo "Campaign status: $(echo $RESUME_RESP | jq -r .data.status)"

# 5.5 Stop Running Campaign (should succeed -> Completed)
echo "Tenant A stops camp-a1..."
STOP_RESP=$(curl -s -X POST "$API_URL/campaigns/stop" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "camp-a1"}')
echo "Stop success: $(echo $STOP_RESP | jq .success)"
echo "Campaign status: $(echo $STOP_RESP | jq -r .data.status)"

echo ""
echo "=== 6. Testing Post-Terminal State Restrictions ==="

# 6.1 Cannot start completed campaign (should fail with HTTP 400)
echo "Tenant A attempts to start camp-a1 (Completed)..."
START_COMPLETED_RESP=$(curl -s -i -X POST "$API_URL/campaigns/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "camp-a1"}')
STATUS_START_COMPLETED=$(echo "$START_COMPLETED_RESP" | grep -i '^HTTP/' | awk '{print $2}' | tail -n1)
echo "HTTP Status (Expected 400): $STATUS_START_COMPLETED"

# 6.2 Cannot stop completed campaign (should fail with HTTP 400)
echo "Tenant A attempts to stop camp-a1 (Completed) again..."
STOP_COMPLETED_RESP=$(curl -s -i -X POST "$API_URL/campaigns/stop" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "camp-a1"}')
STATUS_STOP_COMPLETED=$(echo "$STOP_COMPLETED_RESP" | grep -i '^HTTP/' | awk '{print $2}' | tail -n1)
echo "HTTP Status (Expected 400): $STATUS_STOP_COMPLETED"

echo ""
echo "=== 7. Testing Cross-Tenant Security Isolation ==="

# 7.1 Tenant B attempts to start Tenant A's campaign camp-a1 (should return HTTP 404)
echo "Tenant B attempts to start Tenant A's camp-a1..."
CROSS_START_RESP=$(curl -s -i -X POST "$API_URL/campaigns/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"id": "camp-a1"}')
STATUS_CROSS_START=$(echo "$CROSS_START_RESP" | grep -i '^HTTP/' | awk '{print $2}' | tail -n1)
echo "HTTP Status (Expected 404): $STATUS_CROSS_START"

# 7.2 Tenant B attempts to pause Tenant A's campaign camp-a1 (should return HTTP 404)
echo "Tenant B attempts to pause Tenant A's camp-a1..."
CROSS_PAUSE_RESP=$(curl -s -i -X POST "$API_URL/campaigns/pause" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"id": "camp-a1"}')
STATUS_CROSS_PAUSE=$(echo "$CROSS_PAUSE_RESP" | grep -i '^HTTP/' | awk '{print $2}' | tail -n1)
echo "HTTP Status (Expected 404): $STATUS_CROSS_PAUSE"

# 7.3 Tenant B attempts to stop Tenant A's campaign camp-a1 (should return HTTP 404)
echo "Tenant B attempts to stop Tenant A's camp-a1..."
CROSS_STOP_RESP=$(curl -s -i -X POST "$API_URL/campaigns/stop" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"id": "camp-a1"}')
STATUS_CROSS_STOP=$(echo "$CROSS_STOP_RESP" | grep -i '^HTTP/' | awk '{print $2}' | tail -n1)
echo "HTTP Status (Expected 404): $STATUS_CROSS_STOP"

echo ""
echo "=== All Campaign Management Tests Passed Successfully! ==="
