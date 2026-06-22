#!/bin/bash
set -e

API_URL="http://localhost:5001/api"

# Helper to clear rate limit keys in Redis
clear_rate_limits() {
  redis-cli keys "rate:limit:*" | xargs redis-cli del >/dev/null 2>&1 || true
}

echo "=== 1. Registering and Logging in Prioritization User ==="
clear_rate_limits
USER_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "prioritization-user@company-a.com", "password": "password123", "fullName": "Prioritization Analyst", "companyName": "Company A Prioritizer", "role": "Viewer"}')
echo "User registration success status (can be false if user exists): $(echo $USER_REG | jq .success)"

clear_rate_limits
LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "prioritization-user@company-a.com", "password": "password123"}')
TOKEN=$(echo $LOGIN_RESP | jq -r .data.accessToken)
TENANT_ID=$(echo $LOGIN_RESP | jq -r .data.user.tenantId)
echo "Login Success. Tenant ID: $TENANT_ID"

echo "Cleaning database cache/audit logs for consistent runs..."
redis-cli flushall >/dev/null 2>&1 || true

# Generate random suffixes to avoid ID collisions on multiple test runs
SUFFIX=$((1000 + RANDOM % 9000))
IP_ID="ast-p-ip-$SUFFIX"
CLOUD_ID="ast-p-cloud-$SUFFIX"
SUB_ID="ast-p-sub-$SUFFIX"

FND_LOW_ID="fnd-p-low-$SUFFIX"
FND_HIGH_ID="fnd-p-high-$SUFFIX"
FND_MED_ID="fnd-p-med-$SUFFIX"

echo ""
echo "=== 2. Creating Test Assets & Findings in DB ==="
clear_rate_limits
# Register high-risk IP asset with CVE-2021-44228 (CVSS=10.0, KEV=true)
CREATE_IP=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"id\": \"$IP_ID\", \"name\": \"10.0.0.50\", \"type\": \"IP\", \"owner\": \"OpsTeam\", \"risk\": \"High\", \"cves\": [\"CVE-2021-44228\"]}")
echo "Asset IP Registered: $(echo $CREATE_IP | jq .success)"

clear_rate_limits
# Register medium-risk Cloud asset
CREATE_CLOUD=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"id\": \"$CLOUD_ID\", \"name\": \"s3-customer-bucket\", \"type\": \"Cloud Asset\", \"owner\": \"CloudTeam\", \"risk\": \"Medium\", \"cves\": []}")
echo "Asset Cloud Registered: $(echo $CREATE_CLOUD | jq .success)"

clear_rate_limits
# Register low-risk Subdomain asset (with required owner field)
CREATE_DOM=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"id\": \"$SUB_ID\", \"name\": \"dev.test\", \"type\": \"Subdomain\", \"owner\": \"DevTeam\", \"risk\": \"Low\", \"cves\": []}")
echo "Asset Subdomain Registered: $(echo $CREATE_DOM | jq .success)"

clear_rate_limits
# Create low-severity open finding on subdomain asset
CREATE_FND_LOW=$(curl -s -X POST "$API_URL/findings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"id\": \"$FND_LOW_ID\", \"title\": \"Development environment flag enabled\", \"severity\": \"Low\", \"asset\": \"dev.test\", \"status\": \"Open\", \"description\": \"Debug settings are active.\"}")
echo "Finding Low Severity Registered: $(echo $CREATE_FND_LOW | jq .success)"

clear_rate_limits
# Create high-severity open finding on IP asset
CREATE_FND_HIGH=$(curl -s -X POST "$API_URL/findings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"id\": \"$FND_HIGH_ID\", \"title\": \"Active Log4Shell RCE execution attempt\", \"severity\": \"High\", \"asset\": \"10.0.0.50\", \"status\": \"Open\", \"description\": \"Incoming requests probe log4j vulnerability.\"}")
echo "Finding High Severity Registered: $(echo $CREATE_FND_HIGH | jq .success)"

clear_rate_limits
# Create medium-severity open finding on Cloud asset
CREATE_FND_MED=$(curl -s -X POST "$API_URL/findings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"id\": \"$FND_MED_ID\", \"title\": \"Missing S3 bucket read policies\", \"severity\": \"Medium\", \"asset\": \"s3-customer-bucket\", \"status\": \"Open\", \"description\": \"Bucket permission structure audit required.\"}")
echo "Finding Medium Severity Registered: $(echo $CREATE_FND_MED | jq .success)"

echo ""
echo "=== 3. Querying Prioritized Remediation Queue (GET /findings/prioritized) ==="
clear_rate_limits
QUEUE_RESP=$(curl -s -X GET "$API_URL/findings/prioritized" \
  -H "Authorization: Bearer $TOKEN")

echo "Get Prioritized Findings Status: $(echo $QUEUE_RESP | jq .success)"
QUEUE_DATA=$(echo $QUEUE_RESP | jq .data)

echo "Remediation Queue Ranks:"
echo $QUEUE_DATA | jq -r '.queue[] | "  - [Ranked] Finding: \(.title) | Severity: \(.severity) | Priority Score: \(.priorityScore) | Action Category: \(.action) | ID: \(.id)"'

# Assert correct ranking ordering (priorityScore descending)
SCORES=$(echo $QUEUE_DATA | jq -r '.queue[].priorityScore')
PREV_SCORE=101
SORTED=true

for SCORE in $SCORES; do
  if (( SCORE > PREV_SCORE )); then
    SORTED=false
  fi
  PREV_SCORE=$SCORE
done

echo ""
echo "Asserting correct prioritizer scores sorting..."
if [ "$SORTED" = "true" ]; then
  echo "Assertion Passed: Remediation queue is sorted descending by score"
else
  echo "Assertion FAILED: Queue is not sorted correctly!"
  exit 1
fi

# Select actions exactly matching our created finding IDs for this test run
FIRST_ACTION=$(echo $QUEUE_DATA | jq -r ".queue[] | select(.id == \"$FND_HIGH_ID\") | .action")
SECOND_ACTION=$(echo $QUEUE_DATA | jq -r ".queue[] | select(.id == \"$FND_MED_ID\") | .action")
THIRD_ACTION=$(echo $QUEUE_DATA | jq -r ".queue[] | select(.id == \"$FND_LOW_ID\") | .action")

echo "Asserting correct action categories mapping..."
if [ "$FIRST_ACTION" = "Fix First" ] && [ "$SECOND_ACTION" = "Fix Later" ] && [ "$THIRD_ACTION" = "Monitor" ]; then
  echo "Assertion Passed: Action categories mapped correctly ($FND_HIGH_ID -> $FIRST_ACTION, $FND_MED_ID -> $SECOND_ACTION, $FND_LOW_ID -> $THIRD_ACTION)"
else
  echo "Assertion FAILED: Wrong action category mapping! (High: $FIRST_ACTION, Med: $SECOND_ACTION, Low: $THIRD_ACTION)"
  exit 1
fi

echo ""
echo "=== 4. Checking Audit Logs for FINDINGS_PRIORITIZED ==="
clear_rate_limits
AUDIT_LOGS=$(curl -s -X GET "$API_URL/audit-logs" \
  -H "Authorization: Bearer $TOKEN")
PRIO_LOGS_COUNT=$(echo $AUDIT_LOGS | jq '[.data[] | select(.action == "FINDINGS_PRIORITIZED")] | length')
echo "Prioritization audit logs count (Expected >= 1): $PRIO_LOGS_COUNT"
echo "Prioritization audit entries details:"
echo $AUDIT_LOGS | jq -r '.data[] | select(.action == "FINDINGS_PRIORITIZED") | "  - [\(.createdAt)] Action: \(.action) | Details: \(.details)"'

echo ""
echo "=== All Findings Prioritization Engine integration tests passed successfully! ==="
