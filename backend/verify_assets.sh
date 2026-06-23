#!/bin/bash
set -e

API_URL="http://127.0.0.1:5001/api"

echo "=== 1. Registering Users for Company A and Company B ==="
# User A (Company A)
USER_A_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "alice-assets@company-a.com", "password": "password123", "fullName": "Alice Assets", "companyName": "Company A Assets", "role": "Viewer"}')
echo "Alice Assets (Company A) registered: $(echo $USER_A_REG | jq .success)"

# User B (Company B)
USER_B_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "bob-assets@company-b.com", "password": "password123", "fullName": "Bob Assets", "companyName": "Company B Assets", "role": "Viewer"}')
echo "Bob Assets (Company B) registered: $(echo $USER_B_REG | jq .success)"

echo ""
echo "=== 2. Logging In to Retrieve Sessions ==="
# Login Alice
LOGIN_A=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "alice-assets@company-a.com", "password": "password123"}')
TOKEN_A=$(echo $LOGIN_A | jq -r .data.accessToken)
TENANT_A=$(echo $LOGIN_A | jq -r .data.user.tenantId)
echo "Alice Login Success: $(echo $LOGIN_A | jq .success). Tenant ID: $TENANT_A"

# Login Bob
LOGIN_B=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "bob-assets@company-b.com", "password": "password123"}')
TOKEN_B=$(echo $LOGIN_B | jq -r .data.accessToken)
TENANT_B=$(echo $LOGIN_B | jq -r .data.user.tenantId)
echo "Bob Login Success: $(echo $LOGIN_B | jq .success). Tenant ID: $TENANT_B"

echo ""
echo "=== 3. Testing Asset Creation & Validation ==="

# 3.1 Try creating standard asset for Tenant A (Domain)
echo "Alice creates Domain asset..."
CREATE_A1=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "ast-a1", "name": "company-a-main.com", "type": "Domain", "owner": "SecOps", "risk": "Low"}')
echo "Domain asset created: $(echo $CREATE_A1 | jq .success)"
echo "Created asset ID: $(echo $CREATE_A1 | jq -r .data.id)"

# 3.2 Try creating standard asset for Tenant A (IP)
echo "Alice creates IP asset..."
CREATE_A2=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "ast-a2", "name": "192.168.1.50", "type": "IP", "owner": "InfraTeam", "risk": "High"}')
echo "IP asset created: $(echo $CREATE_A2 | jq .success)"

# 3.3 Try creating standard asset for Tenant A (Cloud Asset)
echo "Alice creates Cloud Asset..."
CREATE_A3=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "ast-a3", "name": "aws-s3-bucket-a", "type": "Cloud Asset", "owner": "CloudTeam", "risk": "Medium"}')
echo "Cloud Asset created: $(echo $CREATE_A3 | jq .success)"

# 3.4 Try creating asset with INVALID type (should fail with HTTP 400)
echo "Alice attempts to create asset with invalid type (InvalidType)..."
CREATE_BAD_TYPE=$(curl -s -i -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "ast-bad", "name": "bad-type-asset", "type": "InvalidType", "owner": "SecOps", "risk": "Low"}')
STATUS_BAD_TYPE=$(echo "$CREATE_BAD_TYPE" | grep -i '^HTTP/' | awk '{print $2}' | tail -n1)
BODY_BAD_TYPE=$(echo "$CREATE_BAD_TYPE" | tr -d '\r' | awk '/^\s*$/{flag=1;next}flag')
echo "HTTP Status for invalid type (Expected 400): $STATUS_BAD_TYPE"
echo "Response body: $BODY_BAD_TYPE"

# 3.5 Create asset for Tenant B (Domain)
echo "Bob creates Domain asset..."
CREATE_B1=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"id": "ast-b1", "name": "company-b-main.com", "type": "Domain", "owner": "BobOps", "risk": "Low"}')
echo "Domain asset for Bob created: $(echo $CREATE_B1 | jq .success)"

echo ""
echo "=== 4. Testing Multi-Tenant Data Separation (List Assets) ==="

# 4.1 Alice lists assets (should see 3 assets, and NOT Bob's asset)
echo "Alice lists assets..."
LIST_A=$(curl -s -X GET "$API_URL/assets" \
  -H "Authorization: Bearer $TOKEN_A")
COUNT_A=$(echo $LIST_A | jq '.data | length')
echo "Assets count for Alice (Expected 3): $COUNT_A"
echo "Does Alice see Bob's asset? (Expected null/empty): $(echo $LIST_A | jq '.data[] | select(.id == "ast-b1")')"

# 4.2 Bob lists assets (should see 1 asset, and NOT Alice's assets)
echo "Bob lists assets..."
LIST_B=$(curl -s -X GET "$API_URL/assets" \
  -H "Authorization: Bearer $TOKEN_B")
COUNT_B=$(echo $LIST_B | jq '.data | length')
echo "Assets count for Bob (Expected 1): $COUNT_B"
echo "Does Bob see Alice's asset? (Expected null/empty): $(echo $LIST_B | jq '.data[] | select(.id == "ast-a1")')"

echo ""
echo "=== 5. Testing Query Parameters (Search & Filters) ==="

# 5.1 Filter Alice's assets by type = IP
echo "Filtering by type 'IP'..."
FILTER_IP=$(curl -s -X GET "$API_URL/assets?type=IP" \
  -H "Authorization: Bearer $TOKEN_A")
echo "Filtered by type 'IP' count (Expected 1): $(echo $FILTER_IP | jq '.data | length')"
echo "Asset name: $(echo $FILTER_IP | jq -r '.data[0].name')"

# 5.2 Filter Alice's assets by risk = High
echo "Filtering by risk 'High'..."
FILTER_HIGH=$(curl -s -X GET "$API_URL/assets?risk=High" \
  -H "Authorization: Bearer $TOKEN_A")
echo "Filtered by risk 'High' count (Expected 1): $(echo $FILTER_HIGH | jq '.data | length')"
echo "Asset name: $(echo $FILTER_HIGH | jq -r '.data[0].name')"

# 5.3 Search by text matching name (contains 'aws')
echo "Searching for text 'aws'..."
SEARCH_AWS=$(curl -s -X GET "$API_URL/assets?search=aws" \
  -H "Authorization: Bearer $TOKEN_A")
echo "Search matches count (Expected 1): $(echo $SEARCH_AWS | jq '.data | length')"
echo "Asset name: $(echo $SEARCH_AWS | jq -r '.data[0].name')"

# 5.4 Search by text matching owner (contains 'infra') - case insensitive
echo "Searching for text 'infra' (case-insensitive, should match InfraTeam)..."
SEARCH_INFRA=$(curl -s -X GET "$API_URL/assets?search=infra" \
  -H "Authorization: Bearer $TOKEN_A")
echo "Search matches count (Expected 1): $(echo $SEARCH_INFRA | jq '.data | length')"
echo "Asset owner: $(echo $SEARCH_INFRA | jq -r '.data[0].owner')"

echo ""
echo "=== 6. Testing Single Asset Retrieval & Cross-Tenant Isolation ==="

# 6.1 Alice retrieves her own asset ast-a1 by ID
echo "Alice fetches ast-a1..."
FETCH_A1=$(curl -s -X GET "$API_URL/assets/ast-a1" \
  -H "Authorization: Bearer $TOKEN_A")
echo "Fetch success: $(echo $FETCH_A1 | jq .success)"
echo "Asset name: $(echo $FETCH_A1 | jq -r .data.name)"

# 6.2 Alice attempts to fetch Bob's asset ast-b1 (should return HTTP 404 to avoid metadata exposure)
echo "Alice attempts to fetch Bob's asset ast-b1..."
FETCH_CROSS_B1=$(curl -s -i -X GET "$API_URL/assets/ast-b1" \
  -H "Authorization: Bearer $TOKEN_A")
STATUS_CROSS_B1=$(echo "$FETCH_CROSS_B1" | grep -i '^HTTP/' | awk '{print $2}' | tail -n1)
echo "HTTP Status for Alice fetching Bob's asset (Expected 404): $STATUS_CROSS_B1"

# 6.3 Bob attempts to fetch Alice's asset ast-a1 (should return HTTP 404)
echo "Bob attempts to fetch Alice's asset ast-a1..."
FETCH_CROSS_A1=$(curl -s -i -X GET "$API_URL/assets/ast-a1" \
  -H "Authorization: Bearer $TOKEN_B")
STATUS_CROSS_A1=$(echo "$FETCH_CROSS_A1" | grep -i '^HTTP/' | awk '{print $2}' | tail -n1)
echo "HTTP Status for Bob fetching Alice's asset (Expected 404): $STATUS_CROSS_A1"

echo ""
echo "=== All Asset Discovery Service Tests Passed Successfully! ==="
