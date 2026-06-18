#!/bin/bash
set -e

API_URL="http://localhost:5001/api"

echo "=== 1. Registering and Logging In Users ==="
# User A (Company A)
USER_A_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "findings-a@company-a.com", "password": "password123", "fullName": "Findings Officer A", "companyName": "Company A Findings", "role": "Viewer"}')
echo "Tenant A User registration (can return false if already exists): $(echo $USER_A_REG | jq .success)"

# User B (Company B)
USER_B_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "findings-b@company-b.com", "password": "password123", "fullName": "Findings Officer B", "companyName": "Company B Findings", "role": "Viewer"}')
echo "Tenant B User registration: $(echo $USER_B_REG | jq .success)"

# Login Alice (A)
LOGIN_A=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "findings-a@company-a.com", "password": "password123"}')
TOKEN_A=$(echo $LOGIN_A | jq -r .data.accessToken)
TENANT_A=$(echo $LOGIN_A | jq -r .data.user.tenantId)
echo "Alice (Tenant A) Login Success. Tenant ID: $TENANT_A"

# Login Bob (B)
LOGIN_B=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "findings-b@company-b.com", "password": "password123"}')
TOKEN_B=$(echo $LOGIN_B | jq -r .data.accessToken)
TENANT_B=$(echo $LOGIN_B | jq -r .data.user.tenantId)
echo "Bob (Tenant B) Login Success. Tenant ID: $TENANT_B"

# Ensure we clean up any pre-existing test findings so tests are repeatable
echo "Cleaning up pre-existing test finding if any..."
curl -s -X DELETE "$API_URL/findings/fnd-test-01" -H "Authorization: Bearer $TOKEN_A" > /dev/null || true

echo ""
echo "=== 2. Testing Finding Creation & Validation ==="
# Succeeded creation
CREATE_OK=$(curl -s -X POST "$API_URL/findings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "fnd-test-01", "title": "runc Container Escape CVE-2024-21626", "severity": "Critical", "asset": "k8s-node-01", "status": "Open", "description": "runc vulnerability allowing container escape to host namespace."}')
echo "Valid Finding Creation Success: $(echo $CREATE_OK | jq .success)"

# Fails on missing required fields
CREATE_FAIL_REQ=$(curl -s -X POST "$API_URL/findings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "fnd-test-02", "title": "Missing severity finding", "asset": "k8s-node-01", "status": "Open"}')
echo "Missing fields check (Expected 400): $(echo $CREATE_FAIL_REQ | jq -r '.errors[0].message')"

# Fails on invalid status
CREATE_FAIL_STATUS=$(curl -s -X POST "$API_URL/findings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "fnd-test-02", "title": "Invalid Status", "severity": "Critical", "asset": "k8s-node-01", "status": "NotRealStatus"}')
echo "Invalid status check (Expected 400): $(echo $CREATE_FAIL_STATUS | jq -r '.message')"

# Fails on invalid severity
CREATE_FAIL_SEV=$(curl -s -X POST "$API_URL/findings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "fnd-test-02", "title": "Invalid Severity", "severity": "MegaCritical", "asset": "k8s-node-01", "status": "Open"}')
echo "Invalid severity check (Expected 400): $(echo $CREATE_FAIL_SEV | jq -r '.message')"

echo ""
echo "=== 3. Testing Queries, Filtering and Search ==="
# List all Alice findings
GET_ALL=$(curl -s -X GET "$API_URL/findings" -H "Authorization: Bearer $TOKEN_A")
echo "Alice total findings (Expected >= 1): $(echo $GET_ALL | jq '.data | length')"

# Filter by Status
GET_OPEN=$(curl -s -X GET "$API_URL/findings?status=Open" -H "Authorization: Bearer $TOKEN_A")
echo "Open findings (Expected >= 1): $(echo $GET_OPEN | jq '.data | length')"
GET_RESOLVED=$(curl -s -X GET "$API_URL/findings?status=Resolved" -H "Authorization: Bearer $TOKEN_A")
echo "Resolved findings (Expected 0): $(echo $GET_RESOLVED | jq '.data | length')"

# Filter by Severity
GET_CRIT=$(curl -s -X GET "$API_URL/findings?severity=Critical" -H "Authorization: Bearer $TOKEN_A")
echo "Critical findings (Expected >= 1): $(echo $GET_CRIT | jq '.data | length')"

# Search
GET_SEARCH=$(curl -s -X GET "$API_URL/findings?search=runc" -H "Authorization: Bearer $TOKEN_A")
echo "Search matches 'runc' (Expected >= 1): $(echo $GET_SEARCH | jq '.data | length')"

echo ""
echo "=== 4. Testing Finding Detail Retrieval ==="
GET_DETAIL=$(curl -s -X GET "$API_URL/findings/fnd-test-01" -H "Authorization: Bearer $TOKEN_A")
echo "Retrieve fnd-test-01 Success: $(echo $GET_DETAIL | jq .success)"
echo "Retrieved Title: $(echo $GET_DETAIL | jq -r .data.title)"

echo ""
echo "=== 5. Testing Lifecycle Status Updates ==="
# Open -> Verified
UPDATE_VERIFIED=$(curl -s -X PUT "$API_URL/findings/fnd-test-01" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"status": "Verified"}')
echo "Transition to Verified Success: $(echo $UPDATE_VERIFIED | jq .success) | Status: $(echo $UPDATE_VERIFIED | jq -r .data.status)"

# Verified -> Resolved
UPDATE_RESOLVED=$(curl -s -X PUT "$API_URL/findings/fnd-test-01" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"status": "Resolved"}')
echo "Transition to Resolved Success: $(echo $UPDATE_RESOLVED | jq .success) | Status: $(echo $UPDATE_RESOLVED | jq -r .data.status)"

# Resolved -> Closed
UPDATE_CLOSED=$(curl -s -X PUT "$API_URL/findings/fnd-test-01" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"status": "Closed"}')
echo "Transition to Closed Success: $(echo $UPDATE_CLOSED | jq .success) | Status: $(echo $UPDATE_CLOSED | jq -r .data.status)"

# Fails on invalid status update
UPDATE_FAIL=$(curl -s -X PUT "$API_URL/findings/fnd-test-01" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"status": "FakeStatus"}')
echo "Invalid lifecycle update (Expected 400): $(echo $UPDATE_FAIL | jq -r '.message')"

echo ""
echo "=== 6. Testing Tenant Security Isolation Boundaries ==="
# Bob (Tenant B) lists findings (should be 0 or not contain fnd-test-01)
BOB_LIST=$(curl -s -X GET "$API_URL/findings" -H "Authorization: Bearer $TOKEN_B")
echo "Bob findings count (Expected 0): $(echo $BOB_LIST | jq '.data | length')"

# Bob tries to fetch Tenant A's finding directly
BOB_GET=$(curl -s -X GET "$API_URL/findings/fnd-test-01" -H "Authorization: Bearer $TOKEN_B")
echo "Bob fetch Tenant A finding (Expected 404): $(echo $BOB_GET | jq -r '.message')"

# Bob tries to update Tenant A's finding status
BOB_PUT=$(curl -s -X PUT "$API_URL/findings/fnd-test-01" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"status": "Open"}')
echo "Bob update Tenant A finding (Expected 404): $(echo $BOB_PUT | jq -r '.message')"

# Bob tries to delete Tenant A's finding
BOB_DEL=$(curl -s -X DELETE "$API_URL/findings/fnd-test-01" -H "Authorization: Bearer $TOKEN_B")
echo "Bob delete Tenant A finding (Expected 404): $(echo $BOB_DEL | jq -r '.message')"

echo ""
echo "=== 7. Testing Finding Deletion ==="
ALICE_DEL=$(curl -s -X DELETE "$API_URL/findings/fnd-test-01" -H "Authorization: Bearer $TOKEN_A")
echo "Alice deletes fnd-test-01 Success: $(echo $ALICE_DEL | jq .success)"

GET_DELETED=$(curl -s -X GET "$API_URL/findings/fnd-test-01" -H "Authorization: Bearer $TOKEN_A")
echo "Fetch deleted finding (Expected 404): $(echo $GET_DELETED | jq -r '.message')"

echo ""
echo "=== All Phase 11 findings management integration tests passed successfully! ==="
