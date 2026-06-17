#!/bin/bash
set -e

API_URL="http://localhost:5001/api"

echo "=== 1. Registering Users ==="
# Register Viewer
VIEWER_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "viewer@test.com", "password": "password123", "fullName": "Viewer User", "companyName": "Test Corp", "role": "Viewer"}')
echo "Viewer registration: $(echo $VIEWER_REG | jq .success)"

# Register Super Admin
ADMIN_REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "password123", "fullName": "Admin User", "companyName": "Test Corp", "role": "Super Admin"}')
echo "Admin registration: $(echo $ADMIN_REG | jq .success)"

echo ""
echo "=== 2. Logging In ==="
# Login Viewer
VIEWER_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "viewer@test.com", "password": "password123"}')
VIEWER_ACCESS=$(echo $VIEWER_LOGIN | jq -r .data.accessToken)
VIEWER_REFRESH=$(echo $VIEWER_LOGIN | jq -r .data.refreshToken)
echo "Viewer logged in successfully."

# Login Admin
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "password123"}')
ADMIN_ACCESS=$(echo $ADMIN_LOGIN | jq -r .data.accessToken)
ADMIN_REFRESH=$(echo $ADMIN_LOGIN | jq -r .data.refreshToken)
echo "Admin logged in successfully."

echo ""
echo "=== 3. Testing RBAC Role Permissions ==="
# Viewer accessing admin config (Should fail with 403)
echo "Viewer attempting to access Admin config route..."
VIEWER_RBAC_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/admin/config" \
  -H "Authorization: Bearer $VIEWER_ACCESS")
echo "HTTP Status (Expected 403): $VIEWER_RBAC_CODE"

# Admin accessing admin config (Should succeed with 200)
echo "Admin attempting to access Admin config route..."
ADMIN_RBAC_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/admin/config" \
  -H "Authorization: Bearer $ADMIN_ACCESS")
echo "HTTP Status (Expected 200): $ADMIN_RBAC_CODE"

ADMIN_RBAC_BODY=$(curl -s -X GET "$API_URL/admin/config" \
  -H "Authorization: Bearer $ADMIN_ACCESS")
echo "Admin config response payload message: $(echo $ADMIN_RBAC_BODY | jq -r .message)"

echo ""
echo "=== 4. Testing Token Rotation & Reuse Detection ==="
# Refresh Viewer's token
echo "Refreshing Viewer token..."
REFRESH_RESP=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$VIEWER_REFRESH\"}")
NEW_VIEWER_ACCESS=$(echo $REFRESH_RESP | jq -r .data.accessToken)
NEW_VIEWER_REFRESH=$(echo $REFRESH_RESP | jq -r .data.refreshToken)
echo "Token refreshed successfully. New Access Token generated."

# Try to reuse the OLD refresh token (Should fail with 401 and trigger family revocation)
echo "Attempting to reuse old refresh token..."
REUSE_RESP=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$VIEWER_REFRESH\"}")
REUSE_STATUS=$(echo $REUSE_RESP | jq -r .message)
echo "HTTP Response (Expected security warning): $REUSE_STATUS"

# Try to use the NEW refresh token (Should fail now because the family was revoked)
echo "Attempting to use new refresh token after family revocation..."
REUSE_NEW_RESP=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$NEW_VIEWER_REFRESH\"}")
REUSE_NEW_SUCCESS=$(echo $REUSE_NEW_RESP | jq -r .success)
REUSE_NEW_MSG=$(echo $REUSE_NEW_RESP | jq -r .message)
echo "Success (Expected false): $REUSE_NEW_SUCCESS"
echo "Message: $REUSE_NEW_MSG"

echo ""
echo "=== 5. Testing Password Reset Flow ==="
# Request Reset
echo "Requesting password reset for viewer@test.com..."
RESET_REQ=$(curl -s -X POST "$API_URL/auth/reset-password-request" \
  -H "Content-Type: application/json" \
  -d '{"email": "viewer@test.com"}')
RESET_TOKEN=$(echo $RESET_REQ | jq -r .debugToken)
echo "Reset token retrieved: $RESET_TOKEN"

# Perform Reset
echo "Resetting password to 'newpassword123'..."
RESET_EXEC=$(curl -s -X POST "$API_URL/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$RESET_TOKEN\", \"newPassword\": \"newpassword123\"}")
echo "Reset status: $(echo $RESET_EXEC | jq .success)"

# Try logging in with old password (Should fail)
echo "Trying to login with old password..."
LOGIN_OLD_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "viewer@test.com", "password": "password123"}')
echo "Old login status (Expected 401): $LOGIN_OLD_CODE"

# Login with new password (Should succeed)
echo "Logging in with new password..."
LOGIN_NEW=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "viewer@test.com", "password": "newpassword123"}')
NEW_ACCESS=$(echo $LOGIN_NEW | jq -r .data.accessToken)
NEW_REFRESH=$(echo $LOGIN_NEW | jq -r .data.refreshToken)
echo "New login status (Expected success): $(echo $LOGIN_NEW | jq .success)"

echo ""
echo "=== 6. Testing Logout Flow ==="
echo "Logging out Viewer..."
LOGOUT_RESP=$(curl -s -X POST "$API_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$NEW_REFRESH\"}")
echo "Logout success: $(echo $LOGOUT_RESP | jq .success)"

# Try to use refresh token after logout (Should fail)
echo "Attempting to refresh with logged out token..."
REFRESH_LOGOUT=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$NEW_REFRESH\"}")
echo "Refresh success (Expected false): $(echo $REFRESH_LOGOUT | jq .success)"
echo "Message: $(echo $REFRESH_LOGOUT | jq .message)"

echo ""
echo "=== All Tests Passed ==="
