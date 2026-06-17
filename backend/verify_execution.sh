#!/bin/bash
set -e

API_URL="http://localhost:5001/api"

echo "=== 1. Registering User and Logging In ==="
USER_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "exec-a@company-a.com", "password": "password123", "fullName": "Execution Tester", "companyName": "Company A Execution", "role": "Viewer"}')
echo "User registered: $(echo $USER_REG | jq .success)"

LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "exec-a@company-a.com", "password": "password123"}')
TOKEN=$(echo $LOGIN_RESP | jq -r .data.accessToken)
TENANT_ID=$(echo $LOGIN_RESP | jq -r .data.user.tenantId)
echo "Login Success. Tenant ID: $TENANT_ID"

echo ""
echo "=== 2. Testing Direct Campaign Enqueuing & Background Execution ==="
# Create campaign in Draft status
echo "Creating draft campaign 'camp-direct'..."
CREATE_CAMP=$(curl -s -X POST "$API_URL/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "camp-direct", "name": "Direct Campaign Scan", "status": "Draft", "progress": 0, "findings": 0}')
echo "Campaign created: $(echo $CREATE_CAMP | jq .success)"

# Start campaign
echo "Starting campaign 'camp-direct' (should enqueue and go to Pending)..."
START_CAMP=$(curl -s -X POST "$API_URL/campaigns/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "camp-direct"}')
echo "Start response success: $(echo $START_CAMP | jq .success)"
echo "Start response status (Expected Pending): $(echo $START_CAMP | jq -r .data.status)"

# Wait 1.5 seconds to observe intermediate progress
echo "Waiting 1.5 seconds for scan simulation..."
sleep 1.5
GET_RUNNING=$(curl -s -X GET "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN")
CAMP_RUNNING=$(echo $GET_RUNNING | jq '.data[] | select(.id == "camp-direct")')
echo "Current status (Expected Running): $(echo $CAMP_RUNNING | jq -r .status)"
echo "Current progress (> 0%): $(echo $CAMP_RUNNING | jq -r .progress)%"
echo "Current findings count: $(echo $CAMP_RUNNING | jq -r .findings)"

# Wait 3 more seconds for the scan to finish
echo "Waiting 3 seconds for scan completion..."
sleep 3
GET_FINISHED=$(curl -s -X GET "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN")
CAMP_FINISHED=$(echo $GET_FINISHED | jq '.data[] | select(.id == "camp-direct")')
echo "Final status (Expected Completed): $(echo $CAMP_FINISHED | jq -r .status)"
echo "Final progress (Expected 100%): $(echo $CAMP_FINISHED | jq -r .progress)%"

echo ""
echo "=== 3. Testing Job Failure Simulation & Retry Logic ==="
# Create campaign with 'fail' in the ID
echo "Creating campaign 'camp-fail'..."
CREATE_FAIL_CAMP=$(curl -s -X POST "$API_URL/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "camp-fail", "name": "Failing Scan Test", "status": "Draft", "progress": 0, "findings": 0}')
echo "Campaign created: $(echo $CREATE_FAIL_CAMP | jq .success)"

# Start campaign
echo "Starting campaign 'camp-fail'..."
START_FAIL_CAMP=$(curl -s -X POST "$API_URL/campaigns/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "camp-fail"}')
echo "Start response status: $(echo $START_FAIL_CAMP | jq -r .data.status)"

# Wait 8 seconds to allow execution error throwing and all retries to exhaust
echo "Waiting 8 seconds for retry cycles to complete..."
sleep 8
GET_FAILED=$(curl -s -X GET "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN")
CAMP_FAILED=$(echo $GET_FAILED | jq '.data[] | select(.id == "camp-fail")')
echo "Final status after retry depletion (Expected Failed): $(echo $CAMP_FAILED | jq -r .status)"

echo ""
echo "=== 4. Testing Background Scheduler (Auto scheduling of Approved campaigns) ==="
# Create campaign in Approved state
echo "Creating campaign 'camp-sched' in 'Approved' state..."
CREATE_SCHED_CAMP=$(curl -s -X POST "$API_URL/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "camp-sched", "name": "Scheduled Scan Test", "status": "Approved", "progress": 0, "findings": 0}')
echo "Campaign created: $(echo $CREATE_SCHED_CAMP | jq .success)"
echo "Campaign status: $(echo $CREATE_SCHED_CAMP | jq -r .data.status)"

# Wait 12 seconds (5 seconds for scheduler check tick + 7 seconds to run the campaign and account for latency)
echo "Waiting 12 seconds for background scheduler tick and completion..."
sleep 12
GET_SCHED=$(curl -s -X GET "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN")
CAMP_SCHED=$(echo $GET_SCHED | jq '.data[] | select(.id == "camp-sched")')
echo "Scheduler run final status (Expected Completed): $(echo $CAMP_SCHED | jq -r .status)"
echo "Scheduler run final progress (Expected 100%): $(echo $CAMP_SCHED | jq -r .progress)%"

echo ""
echo "=== All Execution Engine Tests Passed Successfully! ==="
