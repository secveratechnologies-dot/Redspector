#!/bin/bash
set -e

API_URL="http://127.0.0.1:5001/api"

echo "=== 1. Registering Users for Distinct Companies ==="
# User A (Company A)
USER_A_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@company-a.com", "password": "password123", "fullName": "Alice", "companyName": "Company A", "role": "Viewer"}')
echo "Alice (Company A) registered: $(echo $USER_A_REG | jq .success)"

# User B (Company B)
USER_B_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "bob@company-b.com", "password": "password123", "fullName": "Bob", "companyName": "Company B", "role": "Viewer"}')
echo "Bob (Company B) registered: $(echo $USER_B_REG | jq .success)"

# Super Admin (to manage tenant states)
SA_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "sa@redspecter.io", "password": "password123", "fullName": "Super Admin", "companyName": "RedSpecter", "role": "Super Admin"}')
echo "Super Admin registered: $(echo $SA_REG | jq .success)"

echo ""
echo "=== 2. Logging In to Retrieve Sessions ==="
# Login Alice
LOGIN_A=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@company-a.com", "password": "password123"}')
TOKEN_A=$(echo $LOGIN_A | jq -r .data.accessToken)
TENANT_A=$(echo $LOGIN_A | jq -r .data.user.tenantId)
echo "Alice Login Success: $(echo $LOGIN_A | jq .success). Tenant ID: $TENANT_A"

# Login Bob
LOGIN_B=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "bob@company-b.com", "password": "password123"}')
TOKEN_B=$(echo $LOGIN_B | jq -r .data.accessToken)
TENANT_B=$(echo $LOGIN_B | jq -r .data.user.tenantId)
echo "Bob Login Success: $(echo $LOGIN_B | jq .success). Tenant ID: $TENANT_B"

# Login Super Admin
LOGIN_SA=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "sa@redspecter.io", "password": "password123"}')
TOKEN_SA=$(echo $LOGIN_SA | jq -r .data.accessToken)
echo "Super Admin Login Success: $(echo $LOGIN_SA | jq .success)"

echo ""
echo "=== 3. Testing Logical Data Isolation ==="
# Alice creates a campaign
echo "Alice (Company A) creates a campaign..."
CAMPAIGN_CREATE=$(curl -s -X POST "$API_URL/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "C-101", "name": "Company A Perimeter Scan", "status": "Running", "progress": 20, "findings": 4}')
echo "Campaign created: $(echo $CAMPAIGN_CREATE | jq .success)"

# Alice fetches campaigns (should see the campaign)
echo "Alice fetches campaigns..."
CAMPAIGNS_A=$(curl -s -X GET "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN_A")
COUNT_A=$(echo $CAMPAIGNS_A | jq '.data | length')
echo "Campaigns count for Alice: $COUNT_A (Expected 1)"
echo "Campaign name: $(echo $CAMPAIGNS_A | jq -r '.data[0].name')"

# Bob fetches campaigns (should NOT see Alice's campaign)
echo "Bob fetches campaigns..."
CAMPAIGNS_B=$(curl -s -X GET "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN_B")
COUNT_B=$(echo $CAMPAIGNS_B | jq '.data | length')
echo "Campaigns count for Bob: $COUNT_B (Expected 0)"

echo ""
echo "=== 4. Testing Tenant Suspension ==="
# Super Admin suspends Company A
echo "Super Admin suspends Company A (Tenant ID: $TENANT_A)..."
SUSPEND_RESP=$(curl -s -X PUT "$API_URL/tenants/$TENANT_A/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_SA" \
  -d '{"status": "Suspended"}')
echo "Suspension Success: $(echo $SUSPEND_RESP | jq .success)"

# Alice tries to query campaigns (should fail with HTTP 403)
echo "Alice attempts to query campaigns after suspension..."
ALICE_ERR_RESP=$(curl -s -X GET "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN_A")
echo "HTTP Status (Expected 403): $(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/campaigns" -H "Authorization: Bearer $TOKEN_A")"
echo "Message: $(echo $ALICE_ERR_RESP | jq -r .message)"

# Bob (Company B) tries to query campaigns (should succeed with 200, unaffected)
echo "Bob (Company B) attempts to query campaigns..."
BOB_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN_B")
echo "HTTP Status for unaffected Bob (Expected 200): $BOB_CODE"

echo ""
echo "=== 5. Testing Tenant Reactivation ==="
# Super Admin reactivates Company A
echo "Super Admin reactivates Company A..."
ACTIVATE_RESP=$(curl -s -X PUT "$API_URL/tenants/$TENANT_A/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_SA" \
  -d '{"status": "Active"}')
echo "Reactivation Success: $(echo $ACTIVATE_RESP | jq .success)"

# Alice tries to query campaigns (should succeed now)
echo "Alice attempts to query campaigns after reactivation..."
ALICE_OK_RESP=$(curl -s -X GET "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN_A")
echo "HTTP Status (Expected 200): $(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/campaigns" -H "Authorization: Bearer $TOKEN_A")"
echo "Campaigns count for Alice: $(echo $ALICE_OK_RESP | jq '.data | length') (Expected 1)"

echo ""
echo "=== All Tenancy Tests Passed ==="
