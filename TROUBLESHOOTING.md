# Forgot Password Troubleshooting Guide

## Quick Diagnosis

Use this checklist to quickly identify the issue:

### Frontend Issues
- [ ] Is `VITE_API_URL` set correctly in Vercel environment?
- [ ] Is `credentials: 'include'` being sent? (Check Network tab)
- [ ] Is `mode: 'cors'` set? (Check Network tab)
- [ ] Is the email input validated before submission?
- [ ] Are error messages being displayed properly?

### Backend Issues  
- [ ] Is backend running on Render?
- [ ] Is `FRONTEND_URL` environment variable set?
- [ ] Does it match exactly: `https://daily-tracker-mu-five.vercel.app`?
- [ ] Are email environment variables configured?
- [ ] Is MongoDB connection working?

### Network Issues
- [ ] Does CORS preflight return HTTP 200?
- [ ] Does CORS preflight include `Access-Control-Allow-Credentials: true`?
- [ ] Does actual request succeed (not blocked by CORS)?
- [ ] Is backend responding with JSON?

## Common Error Messages

### \"Network error connecting to: https://daily-tracker-dic0.onrender.com/api/auth/forgot-password\"

**Cause**: CORS is blocking the request

**Solutions**:
1. Check `FRONTEND_URL` on Render dashboard
   ```
   FRONTEND_URL=https://daily-tracker-mu-five.vercel.app
   ```
2. Check `server.js` has Vercel URL in allowedOrigins
   ```javascript
   allowedOrigins.add('https://daily-tracker-mu-five.vercel.app');
   ```
3. Test CORS preflight:
   ```bash
   curl -v -X OPTIONS https://daily-tracker-dic0.onrender.com/api/auth/forgot-password \\
     -H \"Origin: https://daily-tracker-mu-five.vercel.app\"
   ```
4. Check browser console for CORS errors (F12 → Console)
5. Check Network tab for failed preflight (should be 200, not 403/405)

### \"Failed to send OTP email\"

**Cause**: Email configuration is incorrect or SMTP server is unreachable

**Solutions**:
1. Verify email environment variables on Render:
   - `EMAIL_HOST=smtp.gmail.com`
   - `EMAIL_PORT=587`
   - `EMAIL_USER=your-email@gmail.com`
   - `EMAIL_PASSWORD=your-app-password`

2. For Gmail users:
   - Use **App Password** not your regular password
   - Go to: https://myaccount.google.com/apppasswords
   - Generate 16-character app-specific password
   - Use that as `EMAIL_PASSWORD`

3. Check Render logs:
   ```
   Render Dashboard → Logs → Check for "SMTP connection error"
   ```

4. Test SMTP connection:
   ```bash
   # On local machine
   telnet smtp.gmail.com 587
   
   # Should connect and show SMTP banner
   # If fails, Gmail account may need 2FA setup first
   ```

5. For non-Gmail providers:
   - Verify SMTP host and port
   - Check if TLS/SSL required
   - Verify authentication credentials

### \"OTP has expired\"

**Cause**: User waited too long to verify OTP (> 5 minutes)

**Solution**: User must request a new OTP (forgotPassword again)

### \"Invalid OTP\"

**Cause**: User entered wrong OTP code

**Solutions**:
1. Have user check email again for correct OTP
2. Verify OTP in email matches what they entered
3. Check for leading/trailing spaces in OTP input
4. Have user request new OTP if it expired

### \"User not found\"

**Cause**: Email address doesn't exist in database

**Solution**: 
- Verify user email is correct and registered
- Create test account first if testing
- Check that email is consistent (case-insensitive, trimmed)

## Debugging Steps

### Step 1: Check Backend Connection
```bash
# Test if backend is running
curl -v https://daily-tracker-dic0.onrender.com/health

# Should return 200 and { \"success\": true, \"message\": \"Server is running\" }
```

### Step 2: Check CORS Configuration
```bash
# Test CORS preflight
curl -v -X OPTIONS https://daily-tracker-dic0.onrender.com/api/auth/forgot-password \\
  -H \"Origin: https://daily-tracker-mu-five.vercel.app\" \\
  -H \"Access-Control-Request-Method: POST\" \\
  -H \"Access-Control-Request-Headers: Content-Type\"

# Look for these headers in response:
# Access-Control-Allow-Origin: https://daily-tracker-mu-five.vercel.app
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

### Step 3: Check Actual Request
```bash
# Test forgot password endpoint
curl -v -X POST https://daily-tracker-dic0.onrender.com/api/auth/forgot-password \\
  -H \"Content-Type: application/json\" \\
  -H \"Origin: https://daily-tracker-mu-five.vercel.app\" \\
  -d '{\"email\":\"test@example.com\"}'

# Should return 200 with:
# { \"success\": true, \"message\": \"OTP sent to your email...\" }
```

### Step 4: Check Email Configuration
```bash
# SSH into Render (if available)
# Check environment variables
printenv | grep EMAIL

# Should show:
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
```

### Step 5: Check Backend Logs
1. Go to Render Dashboard
2. Select your backend service
3. Click \"Logs\" tab
4. Look for:
   - \"OTP email sent\" → Success
   - \"SMTP connection error\" → Email config wrong
   - \"Failed to save user\" → Database issue
   - \"CORS rejection\" → Frontend origin not allowed

### Step 6: Test Full Flow Locally

If you have local development setup:

```bash
# Terminal 1: Start local backend
cd Backend
npm run dev

# Terminal 2: Start local frontend  
cd Frontend
npm run dev

# Terminal 3: Test forgot password
# Go to http://localhost:5173
# Try forgot password flow
# Check console (F12 → Console) for errors
# Check backend terminal for logs
```

## Browser DevTools Inspection

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try forgot password
4. Look for preflight request (should be OPTIONS)
   - Status: 200
   - Headers include `Access-Control-Allow-Origin`
5. Look for actual request (should be POST)
   - Status: 200
   - Response shows success message

### Check Console Tab
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors like:
   - CORS errors (red)
   - Network errors (red)
   - Your console.error logs (red)
4. Click on errors to expand and see full message

### Check Application Tab
1. Open DevTools (F12)
2. Go to Application → Cookies
3. Check that cookies are being set:
   - Should have: `accessToken` and `refreshToken`
   - Should be HttpOnly (can't see in console)
   - Should be Secure (if https)
   - Should have SameSite: None (if cross-domain)

## Environment Variable Checklist

### Render Backend
- [ ] `NODE_ENV=production`
- [ ] `MONGO_URI=...` (MongoDB connection string)
- [ ] `FRONTEND_URL=https://daily-tracker-mu-five.vercel.app`
- [ ] `JWT_SECRET=...` (random 32+ chars)
- [ ] `JWT_REFRESH_SECRET=...` (random 32+ chars)
- [ ] `COOKIE_SECURE=true`
- [ ] `COOKIE_SAME_SITE=none`
- [ ] `EMAIL_HOST=smtp.gmail.com`
- [ ] `EMAIL_PORT=587`
- [ ] `EMAIL_USER=your-email@gmail.com`
- [ ] `EMAIL_PASSWORD=your-app-password` (NOT regular password)

### Vercel Frontend
- [ ] `VITE_API_URL=https://daily-tracker-dic0.onrender.com`

## Useful Resources

### Test Email SMTP
- [Ethereal Email (free temp SMTP)](https://ethereal.email/)
- [MailHog (local SMTP testing)](https://github.com/mailhog/MailHog)
- [Google App Passwords](https://myaccount.google.com/apppasswords)

### Debugging Tools
- [Postman](https://www.postman.com/) - Test API endpoints
- [VS Code REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) - Test APIs from VS Code
- [curl](https://curl.se/) - Command line HTTP testing

### Documentation
- [Express CORS Middleware](https://expressjs.com/en/resources/middleware/cors.html)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [HTTP Status Codes](https://httpwg.org/specs/rfc9110.html#status.codes)

## Advanced Debugging

### Enable Debug Logging

**Backend (server.js):**
```javascript
// Add before middleware setup
if (process.env.DEBUG === 'true') {
  process.env.LOG_LEVEL = 'debug';
}

// Add debug log for CORS
const corsOptions = {
  origin: (origin, callback) => {
    console.log('[CORS] Checking origin:', origin);
    if (allowedOrigins.has(origin)) {
      console.log('[CORS] Origin allowed');
      return callback(null, true);
    }
    console.log('[CORS] Origin rejected');
    return callback(new Error('CORS origin not allowed'));
  },
  // ... rest of config
};
```

**Frontend (api.ts):**
```typescript
if (process.env.NODE_ENV !== 'production') {
  console.log('[API] Calling:', buildApiUrl(path));
  console.log('[API] Options:', init);
}
```

### Monitor Render Logs in Real-time
```bash
# If you have access to Render CLI
render logs --service=your-backend-service

# Or use tail for continuous monitoring
tail -f /path/to/logs
```

## When to Contact Support

If you've tried all troubleshooting steps, gather this info for support:

1. **Screenshot of error message** (from browser)
2. **Render backend logs** (last 50 lines)
3. **Vercel frontend deployment logs** (build and runtime)
4. **Curl test results**:
   ```bash
   curl -v -X OPTIONS https://daily-tracker-dic0.onrender.com/api/auth/forgot-password \\
     -H \"Origin: https://daily-tracker-mu-five.vercel.app\" 2>&1 | tee curl-test.txt
   ```
5. **Environment variables** (don't include secrets, just names)
6. **Steps to reproduce** (exact sequence)

## Testing Checklist - Full Flow

- [ ] Backend is running on Render
- [ ] Frontend is deployed on Vercel
- [ ] CORS preflight returns 200
- [ ] Forgot password request returns 200
- [ ] Email is received
- [ ] OTP code is visible in email
- [ ] OTP is 4-6 digits
- [ ] OTP verification works
- [ ] Password reset works
- [ ] Can login with new password
- [ ] No errors in browser console
- [ ] No errors in backend logs

Once all checks pass, the forgot password flow is working correctly!
