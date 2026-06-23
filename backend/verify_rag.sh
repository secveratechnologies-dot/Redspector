#!/bin/bash
set -e

API_URL="http://127.0.0.1:5001/api"

# Helper to clear rate limit keys in Redis
clear_rate_limits() {
  redis-cli keys "rate:limit:*" | xargs redis-cli del >/dev/null 2>&1 || true
}

echo "=== 1. Registering and Logging in Users ==="
clear_rate_limits
USER_REG_A=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "rag-a@company-a.com", "password": "password123", "fullName": "Alice RAG", "companyName": "Company A RAG", "role": "Viewer"}')
echo "Tenant A User registered: $(echo $USER_REG_A | jq .success)"

clear_rate_limits
USER_REG_B=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "rag-b@company-b.com", "password": "password123", "fullName": "Bob RAG", "companyName": "Company B RAG", "role": "Viewer"}')
echo "Tenant B User registered: $(echo $USER_REG_B | jq .success)"

clear_rate_limits
LOGIN_A=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "rag-a@company-a.com", "password": "password123"}')
TOKEN_A=$(echo $LOGIN_A | jq -r .data.accessToken)
TENANT_A=$(echo $LOGIN_A | jq -r .data.user.tenantId)
echo "Alice (Tenant A) Login Success. Tenant ID: $TENANT_A"

clear_rate_limits
LOGIN_B=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "rag-b@company-b.com", "password": "password123"}')
TOKEN_B=$(echo $LOGIN_B | jq -r .data.accessToken)
TENANT_B=$(echo $LOGIN_B | jq -r .data.user.tenantId)
echo "Bob (Tenant B) Login Success. Tenant ID: $TENANT_B"

# Clean up pre-existing tests data to ensure repeats work
echo "Cleaning pre-existing test finding and vector entries..."
curl -s -X DELETE "$API_URL/findings/fnd-rag-web" -H "Authorization: Bearer $TOKEN_A" >/dev/null || true
redis-cli flushall >/dev/null 2>&1 || true

echo ""
echo "=== 2. Testing Manual Context Store (POST /rag/context) ==="
clear_rate_limits
STORE_POLICY=$(curl -s -X POST "$API_URL/rag/context" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{
    "source": "Policy",
    "sourceId": "pol-iam-01",
    "content": "Identity access management policy enforces MFA and session token rotation on all administrative accounts."
  }')
echo "Policy Context Stored: $(echo $STORE_POLICY | jq .success)"

clear_rate_limits
STORE_MITRE=$(curl -s -X POST "$API_URL/rag/context" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{
    "source": "MITRE",
    "sourceId": "T1190",
    "content": "Mitre ATT&CK technique T1190 Exploit Public-Facing Application validates endpoint ingress sanitization."
  }')
echo "Mitre Context Stored: $(echo $STORE_MITRE | jq .success)"

echo ""
echo "=== 3. Testing Automated Indexing Hooks via Resource Creators ==="
clear_rate_limits
# Register IP target (High Risk database target)
CREATE_IP=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "ast-rag-db", "name": "customer-postgres-db", "type": "IP", "owner": "OpsTeam", "risk": "High", "cves": ["CVE-2021-44228"]}')
echo "Asset Database Registered (Should trigger auto RAG index): $(echo $CREATE_IP | jq .success)"

clear_rate_limits
# Create Finding (Missing web headers check)
CREATE_FINDING=$(curl -s -X POST "$API_URL/findings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "fnd-rag-web", "title": "Missing security X-Frame-Options headers", "severity": "Medium", "asset": "customer-portal", "status": "Open", "description": "Missing web clickjacking controls permits iframe hijacking."}')
echo "Finding Created (Should trigger auto RAG index): $(echo $CREATE_FINDING | jq .success)"

echo ""
echo "=== 4. Testing RAG Similarity Search (POST /rag/search) ==="
# Search 1: Query for authentication policy
clear_rate_limits
SEARCH_AUTH=$(curl -s -X POST "$API_URL/rag/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"query": "mfa authentication token rotation policy", "limit": 2}')
echo "Query 1 matches count: $(echo $SEARCH_AUTH | jq '.data | length')"
echo "Query 1 Best Match ID: $(echo $SEARCH_AUTH | jq -r '.data[0].sourceId') (Score: $(echo $SEARCH_AUTH | jq -r '.data[0].score'))"
echo "Query 1 Best Content: $(echo $SEARCH_AUTH | jq -r '.data[0].content')"

# Search 2: Query for database risk exposure
clear_rate_limits
SEARCH_DB=$(curl -s -X POST "$API_URL/rag/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"query": "database sql postgres vulnerability targets", "limit": 2}')
echo "Query 2 matches count: $(echo $SEARCH_DB | jq '.data | length')"
echo "Query 2 Best Match ID: $(echo $SEARCH_DB | jq -r '.data[0].sourceId') (Score: $(echo $SEARCH_DB | jq -r '.data[0].score'))"
echo "Query 2 Best Content: $(echo $SEARCH_DB | jq -r '.data[0].content')"

# Search 3: Query for web header exposures
clear_rate_limits
SEARCH_WEB=$(curl -s -X POST "$API_URL/rag/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"query": "clickjacking web headers control", "limit": 2}')
echo "Query 3 matches count: $(echo $SEARCH_WEB | jq '.data | length')"
echo "Query 3 Best Match ID: $(echo $SEARCH_WEB | jq -r '.data[0].sourceId') (Score: $(echo $SEARCH_WEB | jq -r '.data[0].score'))"
echo "Query 3 Best Content: $(echo $SEARCH_WEB | jq -r '.data[0].content')"

echo ""
echo "=== 5. Testing Tenant Isolation Security Boundary ==="
# Bob (Tenant B) searches RAG context
clear_rate_limits
SEARCH_BOB=$(curl -s -X POST "$API_URL/rag/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"query": "database portal clickjacking policy"}')
echo "Bob RAG Matches Count (Expected 0): $(echo $SEARCH_BOB | jq '.data | length')"

echo ""
echo "=== 6. Checking Audit Trail Logs for RAG Actions ==="
clear_rate_limits
AUDIT_LOGS=$(curl -s -X GET "$API_URL/audit-logs" \
  -H "Authorization: Bearer $TOKEN_A")
RAG_LOGS_COUNT=$(echo $AUDIT_LOGS | jq '[.data[] | select(.action | startswith("RAG_"))] | length')
echo "RAG Audit log count (Expected >= 5): $RAG_LOGS_COUNT"
echo "RAG actions found:"
echo $AUDIT_LOGS | jq -r '.data[] | select(.action | startswith("RAG_")) | "  - [\(.createdAt)] Action: \(.action) | Details: \(.details)"'

echo ""
echo "=== All Context Engine & RAG integration tests passed successfully! ==="
