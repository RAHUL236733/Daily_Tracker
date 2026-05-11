#!/usr/bin/env node

/**
 * Forgot Password Flow Testing Script
 * Tests CORS, API endpoints, and forgot password flow
 * 
 * Usage: node test-forgot-password.js
 * Or: npm run test:forgot-password (if added to package.json)
 */

const https = require('https');
const http = require('http');

// Configuration
const BACKEND_URL = 'https://daily-tracker-dic0.onrender.com';
const FRONTEND_URL = 'https://daily-tracker-mu-five.vercel.app';
const TEST_EMAIL = 'testuser@example.com';

// Colors for console output
const colors = {
  reset: '\\x1b[0m',
  green: '\\x1b[32m',
  red: '\\x1b[31m',
  yellow: '\\x1b[33m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseUrl(urlString) {
  const url = new URL(urlString);
  return {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    protocol: url.protocol.slice(0, -1),
  };
}

function httpRequest(urlString, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const protocol = url.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testCorsPreflight() {
  log('\\nTest 1: CORS Preflight', 'yellow');
  log('=' + '='.repeat(40), 'yellow');

  try {
    const response = await httpRequest(`${BACKEND_URL}/api/auth/forgot-password`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    const corsOrigin = response.headers['access-control-allow-origin'];
    const corsCredentials = response.headers['access-control-allow-credentials'];

    if (corsOrigin === FRONTEND_URL && corsCredentials === 'true') {
      log('✓ CORS Preflight: PASS', 'green');
      log(`  Origin: ${corsOrigin}`, 'green');
      log(`  Credentials: ${corsCredentials}`, 'green');
      return true;
    } else {
      log('✗ CORS Preflight: FAIL', 'red');
      log(`  Expected origin: ${FRONTEND_URL}`, 'red');
      log(`  Actual origin: ${corsOrigin || 'NOT SET'}`, 'red');
      log(`  Credentials: ${corsCredentials || 'NOT SET'}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ CORS Preflight: ERROR - ${error.message}`, 'red');
    return false;
  }
}

async function testForgotPasswordRequest() {
  log('\\nTest 2: Forgot Password Request', 'yellow');
  log('=' + '='.repeat(40), 'yellow');

  try {
    const response = await httpRequest(`${BACKEND_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Origin': FRONTEND_URL,
      },
      body: { email: TEST_EMAIL },
    });

    if (response.statusCode === 200) {
      log(`✓ Forgot Password: PASS (HTTP ${response.statusCode})`, 'green');
      
      try {
        const data = JSON.parse(response.body);
        if (data.success) {
          log(`✓ Response success: true`, 'green');
          log(`  Message: ${data.message}`, 'green');
          log(`  Code: ${data.code}`, 'green');
        } else {
          log(`⚠ Response success: false`, 'yellow');
          log(`  Message: ${data.message}`, 'yellow');
        }
      } catch (e) {
        log(`  Response body: ${response.body}`, 'green');
      }
      return true;
    } else {
      log(`✗ Forgot Password: FAIL (HTTP ${response.statusCode})`, 'red');
      try {
        const data = JSON.parse(response.body);
        log(`  Error: ${data.message}`, 'red');
      } catch (e) {
        log(`  Response: ${response.body}`, 'red');
      }
      return false;
    }
  } catch (error) {
    log(`✗ Forgot Password Request: ERROR - ${error.message}`, 'red');
    return false;
  }
}

async function testServerHealth() {
  log('\\nTest 3: Server Health Check', 'yellow');
  log('=' + '='.repeat(40), 'yellow');

  try {
    const response = await httpRequest(`${BACKEND_URL}/health`);

    if (response.statusCode === 200) {
      log(`✓ Server Health: PASS (HTTP ${response.statusCode})`, 'green');
      try {
        const data = JSON.parse(response.body);
        log(`  Message: ${data.message}`, 'green');
      } catch (e) {
        log(`  Response: ${response.body}`, 'green');
      }
      return true;
    } else {
      log(`✗ Server Health: FAIL (HTTP ${response.statusCode})`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Server Health Check: ERROR - ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  console.clear();
  log('╔════════════════════════════════════════╗', 'yellow');
  log('║  Forgot Password Flow Testing Script   ║', 'yellow');
  log('╚════════════════════════════════════════╝', 'yellow');
  log(`\\nBackend: ${BACKEND_URL}`);
  log(`Frontend: ${FRONTEND_URL}`);
  log(`Test Email: ${TEST_EMAIL}`);

  const results = [];

  results.push(await testCorsPreflight());
  results.push(await testForgotPasswordRequest());
  results.push(await testServerHealth());

  // Summary
  log('\\nTest Summary', 'yellow');
  log('=' + '='.repeat(40), 'yellow');

  const passed = results.filter(r => r).length;
  const total = results.length;

  if (passed === total) {
    log(`✓ All tests passed (${passed}/${total})`, 'green');
    log('\\nNext steps:', 'green');
    log('1. Check your email for OTP code', 'green');
    log('2. Verify email contains proper formatting', 'green');
    log('3. Check that OTP is valid for 5 minutes', 'green');
    log('4. Test OTP verification endpoint', 'green');
    log('\\nCheck Render dashboard logs for email sending details.', 'yellow');
  } else {
    log(`✗ Some tests failed (${passed}/${total})`, 'red');
    log('\\nDebugging tips:', 'red');
    log('1. Check CORS configuration on backend', 'red');
    log('2. Verify FRONTEND_URL environment variable', 'red');
    log('3. Check backend logs on Render dashboard', 'red');
    log('4. Verify backend is running and accessible', 'red');
  }

  log('\\n' + '='.repeat(42), 'yellow');
}

// Run tests
runAllTests().catch((error) => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
