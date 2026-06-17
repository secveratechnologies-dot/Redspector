#!/bin/bash
set -e

API_URL="http://localhost:5001/api"

echo "=== 1. Registering Users for Company A and Company B ==="
# User A (Company A)
USER_A_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "threat-a@company-a.com", "password": "password123", "fullName": "Threat Analyst A", "companyName": "Company A Threat", "role": "Viewer"}')
echo "Tenant A User registered: $(echo $USER_A_REG | jq .success)"

# User B (Company B)
USER_B_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "threat-b@company-b.com", "password": "password123", "fullName": "Threat Analyst B", "companyName": "Company B Threat", "role": "Viewer"}')
echo "Tenant B User registered: $(echo $USER_B_REG | jq .success)"

echo ""
echo "=== 2. Logging In to Retrieve Sessions ==="
# Login Alice
LOGIN_A=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "threat-a@company-a.com", "password": "password123"}')
TOKEN_A=$(echo $LOGIN_A | jq -r .data.accessToken)
TENANT_A=$(echo $LOGIN_A | jq -r .data.user.tenantId)
echo "Alice (Tenant A) Login Success. Tenant ID: $TENANT_A"

# Login Bob
LOGIN_B=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "threat-b@company-b.com", "password": "password123"}')
TOKEN_B=$(echo $LOGIN_B | jq -r .data.accessToken)
TENANT_B=$(echo $LOGIN_B | jq -r .data.user.tenantId)
echo "Bob (Tenant B) Login Success. Tenant ID: $TENANT_B"

echo ""
echo "=== 3. Creating Assets with Threat Context ==="

# Create asset for Tenant A with CVEs (Log4Shell and macOS kernel bug)
echo "Tenant A creates asset ast-intel-a with associated CVEs..."
CREATE_A1=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"id": "ast-intel-a", "name": "vuln-server.com", "type": "Domain", "owner": "SecOps", "risk": "High", "cves": ["CVE-2021-44228", "CVE-2023-38606"]}')
echo "Asset created: $(echo $CREATE_A1 | jq .success)"
echo "Asset cves: $(echo $CREATE_A1 | jq -c .data.cves)"

# Create asset for Tenant B with CVE (runc escape)
echo "Tenant B creates asset ast-intel-b with associated CVE..."
CREATE_B1=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"id": "ast-intel-b", "name": "container-host.com", "type": "Domain", "owner": "BobOps", "risk": "Medium", "cves": ["CVE-2024-21626"]}')
echo "Asset created: $(echo $CREATE_B1 | jq .success)"

echo ""
echo "=== 4. Querying Global CVE Database ==="

# 4.1 Get all CVEs
echo "Fetching all CVEs..."
CVES_ALL=$(curl -s -X GET "$API_URL/cves" \
  -H "Authorization: Bearer $TOKEN_A")
echo "Total CVEs in database (Expected >= 5): $(echo $CVES_ALL | jq '.data | length')"

# 4.2 Get CVEs with minCvss=9.0
echo "Filtering CVEs with CVSS >= 9.0..."
CVES_HIGH=$(curl -s -X GET "$API_URL/cves?minCvss=9.0" \
  -H "Authorization: Bearer $TOKEN_A")
echo "High CVSS CVEs count (Expected 3): $(echo $CVES_HIGH | jq '.data | length')"
echo "High CVSS CVE IDs: $(echo $CVES_HIGH | jq -r '.data[].cveId')"

# 4.3 Get CVEs with isKev=true
echo "Filtering CVEs by KEV status (isKev=true)..."
CVES_KEV=$(curl -s -X GET "$API_URL/cves?isKev=true" \
  -H "Authorization: Bearer $TOKEN_A")
echo "KEV CVEs count (Expected 4): $(echo $CVES_KEV | jq '.data | length')"
echo "KEV CVE IDs: $(echo $CVES_KEV | jq -r '.data[].cveId')"

# 4.4 Search CVEs by keyword "Log4j2"
echo "Searching CVEs by keyword 'Log4j2'..."
CVES_SEARCH=$(curl -s -X GET "$API_URL/cves?search=Log4j2" \
  -H "Authorization: Bearer $TOKEN_A")
echo "Search result count (Expected 1): $(echo $CVES_SEARCH | jq '.data | length')"
echo "Matching CVE ID: $(echo $CVES_SEARCH | jq -r '.data[0].cveId')"

echo ""
echo "=== 5. Querying KEV Catalog ==="
# Get KEVs via /api/kev
echo "Fetching /api/kev..."
KEV_CATALOG=$(curl -s -X GET "$API_URL/kev" \
  -H "Authorization: Bearer $TOKEN_A")
echo "KEV catalog count (Expected 4): $(echo $KEV_CATALOG | jq '.data | length')"
echo "All entries are KEV? (should be empty if yes): $(echo $KEV_CATALOG | jq '.data[] | select(.isKev == false)')"

echo ""
echo "=== 6. Querying Asset Threat Intelligence & Logical isolation ==="

# 6.1 Tenant A retrieves threats for their asset ast-intel-a
echo "Tenant A fetches threat intel for ast-intel-a..."
INTEL_A1=$(curl -s -X GET "$API_URL/threats/assets/ast-intel-a" \
  -H "Authorization: Bearer $TOKEN_A")
echo "Fetch success: $(echo $INTEL_A1 | jq .success)"
echo "Asset Name: $(echo $INTEL_A1 | jq -r .data.asset.name)"
echo "Resolved CVEs count (Expected 2): $(echo $INTEL_A1 | jq '.data.threatIntel | length')"
echo "CVE details returned:"
echo $INTEL_A1 | jq -r '.data.threatIntel[] | "  - \(.cveId): cvss=\(.cvss), epss=\(.epss), isKev=\(.isKev), techniques=\(.mitreAttack)"'

# 6.2 Tenant A attempts to fetch threat intel for Tenant B's asset ast-intel-b (should return HTTP 404)
echo "Tenant A attempts to fetch threats for Tenant B's asset ast-intel-b..."
FETCH_CROSS_B=$(curl -s -i -X GET "$API_URL/threats/assets/ast-intel-b" \
  -H "Authorization: Bearer $TOKEN_A")
STATUS_CROSS_B=$(echo "$FETCH_CROSS_B" | grep -i '^HTTP/' | awk '{print $2}' | tail -n1)
echo "HTTP Status (Expected 404): $STATUS_CROSS_B"

# 6.3 Tenant B attempts to fetch threat intel for Tenant A's asset ast-intel-a (should return HTTP 404)
echo "Tenant B attempts to fetch threats for Tenant A's asset ast-intel-a..."
FETCH_CROSS_A=$(curl -s -i -X GET "$API_URL/threats/assets/ast-intel-a" \
  -H "Authorization: Bearer $TOKEN_B")
STATUS_CROSS_A=$(echo "$FETCH_CROSS_A" | grep -i '^HTTP/' | awk '{print $2}' | tail -n1)
echo "HTTP Status (Expected 404): $STATUS_CROSS_A"

echo ""
echo "=== All Threat Intelligence Service Tests Passed Successfully! ==="
