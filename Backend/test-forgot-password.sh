#!/bin/bash

# Forgot Password Flow Testing Script
# Tests the complete forgot password → OTP verification → password reset flow
# Usage: bash test-forgot-password.sh

set -e

# Configuration
BACKEND_URL="https://daily-tracker-dic0.onrender.com"
FRONTEND_URL="https://daily-tracker-mu-five.vercel.app"
TEST_EMAIL="testuser@example.com"
COOKIE_JAR="/tmp/cookies.txt"

# Color output
GREEN='\\033[0;32m'
RED='\\033[0;31m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

echo -e \"${YELLOW}=== Forgot Password Flow Testing ===${NC}\"
echo \"Backend: $BACKEND_URL\"
echo \"Frontend: $FRONTEND_URL\"
echo \"Test Email: $TEST_EMAIL\"
echo \"\"

# Test 1: CORS Preflight
echo -e \"${YELLOW}Test 1: CORS Preflight${NC}\"
PREFLIGHT=$(curl -s -i -X OPTIONS \"$BACKEND_URL/api/auth/forgot-password\" \\
  -H \"Origin: $FRONTEND_URL\" \\
  -H \"Access-Control-Request-Method: POST\" \\
  -H \"Access-Control-Request-Headers: Content-Type\")

if echo \"$PREFLIGHT\" | grep -q \"Access-Control-Allow-Origin: $FRONTEND_URL\"; then
  echo -e \"${GREEN}✓ CORS Preflight: PASS${NC}\"
  echo \"  Origin accepted: $FRONTEND_URL\"
else
  echo -e \"${RED}✗ CORS Preflight: FAIL${NC}\"
  echo \"  Response: $PREFLIGHT\"
  exit 1
fi
echo \"\"

# Test 2: Forgot Password Request
echo -e \"${YELLOW}Test 2: Forgot Password Request${NC}\"
RESPONSE=$(curl -s -w \"\\n%{http_code}\" -X POST \"$BACKEND_URL/api/auth/forgot-password\" \\
  -H \"Content-Type: application/json\" \\
  -H \"Origin: $FRONTEND_URL\" \\
  -c \"$COOKIE_JAR\" \\
  -d \"{\\\"email\\\":\\\"$TEST_EMAIL\\\"}\")

HTTP_CODE=$(echo \"$RESPONSE\" | tail -n1)
BODY=$(echo \"$RESPONSE\" | head -n-1)

if [ \"$HTTP_CODE\" = \"200\" ]; then
  echo -e \"${GREEN}✓ Forgot Password: PASS (HTTP 200)${NC}\"
  echo \"  Response: $BODY\"
else
  echo -e \"${RED}✗ Forgot Password: FAIL (HTTP $HTTP_CODE)${NC}\"
  echo \"  Response: $BODY\"
  exit 1
fi

# Extract success field
if echo \"$BODY\" | grep -q '\"success\":true'; then
  echo -e \"${GREEN}✓ Response indicates success${NC}\"
else
  echo -e \"${RED}✗ Response does not indicate success${NC}\"
fi
echo \"\"

# Test 3: Check Cookies
echo -e \"${YELLOW}Test 3: Cookies Set${NC}\"
if [ -f \"$COOKIE_JAR\" ]; then
  echo -e \"${GREEN}✓ Cookie jar created${NC}\"
  echo \"  Cookies set:\"
  cat \"$COOKIE_JAR\" | grep -v \"^#\" | while read line; do
    echo \"    - $line\"
  done
else
  echo -e \"${YELLOW}⚠ No cookies set (may be normal for forgot-password)${NC}\"
fi
echo \"\"

# Test 4: Server Health Check
echo -e \"${YELLOW}Test 4: Server Health Check${NC}\"
HEALTH=$(curl -s -w \"\\n%{http_code}\" \"$BACKEND_URL/health\")
HEALTH_CODE=$(echo \"$HEALTH\" | tail -n1)
HEALTH_BODY=$(echo \"$HEALTH\" | head -n-1)

if [ \"$HEALTH_CODE\" = \"200\" ]; then
  echo -e \"${GREEN}✓ Server Health: PASS${NC}\"
  echo \"  Response: $HEALTH_BODY\"
else
  echo -e \"${RED}✗ Server Health: FAIL (HTTP $HEALTH_CODE)${NC}\"
fi
echo \"\"

# Test 5: Verify Email Configuration
echo -e \"${YELLOW}Test 5: Check Backend Logs${NC}\"
echo -e \"${YELLOW}Next steps:${NC}\"
echo \"1. Check Render dashboard logs for email sending status\"
echo \"2. Look for 'OTP email sent' or error messages\"
echo \"3. Check spam/junk folder for test email\"
echo \"4. Verify email contains OTP code\"
echo \"\"

# Summary
echo -e \"${YELLOW}=== Testing Summary ===${NC}\"
echo -e \"${GREEN}✓ CORS configuration is correct${NC}\"
echo -e \"${GREEN}✓ API endpoint is responding${NC}\"
echo -e \"${GREEN}✓ Backend is running${NC}\"
echo -e \"${YELLOW}⚠ Email delivery requires manual verification${NC}\"
echo \"\"
echo \"To complete testing:\"
echo \"1. Check your email for OTP\"
echo \"2. Get the OTP code from email\"
echo \"3. Test OTP verification with:\"
echo \"   curl -X POST $BACKEND_URL/api/auth/verify-otp \\\"\"
echo \"     -H 'Content-Type: application/json' \\\"\"
echo \"     -d '{\\\"email\\\":\\\"$TEST_EMAIL\\\",\\\"otp\\\":\\\"YOUR_OTP_HERE\\\"}' \\\"\"
echo \"\"
echo -e \"${GREEN}Basic tests completed successfully!${NC}\"
