# Forgot Password Production Fix - Complete Setup Guide

## Overview
This document outlines all the fixes applied to resolve the forgot password API failures in production (Vercel frontend + Render backend).

## Issues Fixed

### 1. **Double URL Building in Frontend**
**Problem**: `forgot-password.tsx` was calling `buildApiUrl()` on the result of `buildApiUrl()`, causing double URL encoding/building.
**Fix**: Removed the extra `buildApiUrl()` call and pass the path directly to `postJson()`.

### 2. **CORS Configuration**
**Problem**: Vercel frontend URL (`https://daily-tracker-mu-five.vercel.app`) was not explicitly in the allowed origins list.
**Fix**: Added explicit hardcoded entry for Vercel frontend URL in `server.js` CORS allowlist.

### 3. **Cookie Settings for Cross-Domain**
**Problem**: Cookies weren't configured correctly for cross-domain requests (Vercel ↔ Render).
**Fix**: Updated `getCookieOptions()` to use `sameSite: 'none'` and `secure: true` for production.

### 4. **Middleware Order**
**Problem**: Express middleware wasn't in the correct order for CORS and JSON parsing.
**Fix**: Reorganized middleware order in `server.js`:
1. helmet()
2. cors()
3. options() for preflight
4. cookieParser()
5. express.json()
6. express.urlencoded()
7. mongoSanitize()

### 5. **Email Configuration Validation**
**Problem**: Nodemailer transporter wasn't validating required env variables before attempting to use them.
**Fix**: Added validation in `getTransporter()` to check all required email config variables.

### 6. **Error Handling**
**Problem**: Errors in forgot-password endpoint weren't properly caught and handled.
**Fix**: Added comprehensive try-catch blocks with specific error codes and messages.

## Files Modified

1. **Backend/server.js**
   - Updated CORS configuration with explicit Vercel URL
   - Fixed middleware order
   - Added CORS debugging logs

2. **Backend/controllers/authController.js**
   - Improved `getCookieOptions()` for production cross-domain cookies
   - Enhanced `forgotPassword()` with better error handling
   - Added proper logging

3. **Backend/utils/sendEmail.js**
   - Added email configuration validation
   - Improved error handling and logging
   - Added SMTP verification

4. **Frontend/src/routes/forgot-password.tsx**
   - Removed double URL building
   - Simplified error messages
   - Improved user feedback

5. **Frontend/src/lib/api.ts**
   - Already properly configured with `credentials: 'include'` and `mode: 'cors'`

## Production Environment Setup

### Backend (.env on Render)

```env
# Node Environment
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dailytracker?retryWrites=true&w=majority

# Frontend URL
FRONTEND_URL=https://daily-tracker-mu-five.vercel.app

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Cookie Settings
COOKIE_SECURE=true
COOKIE_SAME_SITE=none

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Port
PORT=5000
```

### Frontend (.env on Vercel)

```env
VITE_API_URL=https://daily-tracker-dic0.onrender.com
```

## Testing Forgot Password Flow

### Step 1: Test CORS Preflight
```bash
curl -i -X OPTIONS https://daily-tracker-dic0.onrender.com/api/auth/forgot-password \
  -H "Origin: https://daily-tracker-mu-five.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

Expected response should include:
```
Access-Control-Allow-Origin: https://daily-tracker-mu-five.vercel.app
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

### Step 2: Test Forgot Password Endpoint
```bash
curl -i -X POST https://daily-tracker-dic0.onrender.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -H "Origin: https://daily-tracker-mu-five.vercel.app" \
  -D cookies.txt \
  -d '{"email":"test@example.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": "OTP sent to your email. Valid for 5 minutes.",
  "code": "OTP_SENT"
}
```

### Step 3: Verify Email Sending
- Check email for OTP
- Verify OTP is 4-6 digits
- Verify email contains proper styling and formatting

### Step 4: Test OTP Verification
```bash
curl -i -X POST https://daily-tracker-dic0.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "Origin: https://daily-tracker-mu-five.vercel.app" \
  -b cookies.txt \
  -d '{"email":"test@example.com","otp":"1234"}'
```

### Step 5: Test Password Reset
```bash
curl -i -X POST https://daily-tracker-dic0.onrender.com/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -H "Origin: https://daily-tracker-mu-five.vercel.app" \
  -b cookies.txt \
  -d '{"email":"test@example.com","newPassword":"newpass123","confirmPassword":"newpass123"}'
```

## Common Issues & Solutions

### Issue: "Network error connecting to..."
**Cause**: CORS not allowing frontend origin
**Solution**: 
1. Check `FRONTEND_URL` env var on Render
2. Verify frontend URL in `server.js` allowedOrigins list
3. Check backend logs for CORS rejection messages

### Issue: "Failed to send OTP email"
**Cause**: Email configuration not set up
**Solution**:
1. Verify `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD` are set
2. For Gmail, use an app-specific password (not your regular password)
3. Check Render logs for SMTP errors
4. Test SMTP connection: `telnet smtp.gmail.com 587`

### Issue: OTP not received
**Cause**: Email not being sent due to SMTP errors
**Solution**:
1. Check backend logs on Render for email errors
2. Verify email address is correct in request
3. Check spam/junk folder
4. Verify nodemailer configuration

### Issue: Cookie issues
**Cause**: Cookies not being sent with cross-domain requests
**Solution**:
1. Ensure frontend uses `credentials: 'include'` (already set in api.ts)
2. Verify backend sets `sameSite: 'none'` and `secure: true`
3. Check browser DevTools → Application → Cookies

## Verification Checklist

- [ ] CORS accepts Vercel origin
- [ ] Preflight requests return 200
- [ ] JSON body is parsed correctly
- [ ] Email is sent successfully
- [ ] OTP is 4-6 digits
- [ ] OTP expires in 5 minutes
- [ ] OTP verification works
- [ ] Password reset works
- [ ] Cookies are set with correct flags
- [ ] No errors in backend logs
- [ ] Frontend shows proper error messages

## Key Configuration Summary

| Component | Setting | Value |
|-----------|---------|-------|
| Frontend | API URL | `https://daily-tracker-dic0.onrender.com` |
| Frontend | Credentials | `include` |
| Frontend | CORS Mode | `cors` |
| Backend | CORS Origin | `https://daily-tracker-mu-five.vercel.app` |
| Backend | Cookie sameSite | `none` |
| Backend | Cookie secure | `true` |
| Backend | Cookie httpOnly | `true` |
| Email | Port | 587 (TLS) or 465 (SSL) |
| Email | Verification | Enabled |

## Deployment Steps

1. **Update Backend on Render:**
   - Push code changes to GitHub
   - Render auto-deploys on push
   - Set environment variables in Render dashboard
   - Verify in logs that server starts

2. **Update Frontend on Vercel:**
   - Push code changes to GitHub
   - Vercel auto-deploys on push
   - Set `VITE_API_URL` environment variable
   - Verify deployment completes

3. **Test End-to-End:**
   - Go to `https://daily-tracker-mu-five.vercel.app`
   - Click "Forgot Password"
   - Enter test email
   - Check email for OTP
   - Verify OTP and reset password

## Support Resources

- [Express CORS Documentation](https://expressjs.com/en/resources/middleware/cors.html)
- [Nodemailer Documentation](https://nodemailer.com/)
- [MDN: Cross-Origin Requests (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Cookie Flags Explained](https://owasp.org/www-community/controls/Cookie_Security)
