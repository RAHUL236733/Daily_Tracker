# Authentication Fix - Testing & Verification Guide

## 🔍 What Changed

### File: Frontend/src/lib/auth.tsx

**Critical Change**: `requestCurrentUser` now uses `apiJson` wrapper instead of raw `fetch`

```typescript
// This function is now using apiJson wrapper which:
// 1. Automatically catches 401 responses
// 2. Calls POST /api/auth/refresh to get new tokens
// 3. Retries the original request
// 4. Only fails if refresh itself fails
const requestCurrentUser = async (signal?: AbortSignal) => {
  return await apiJson<{ user: NonNullable<User> }>("/api/auth/me", {
    signal,
  }).then(data => data.user);
};
```

**Why This Fixes Everything**:
- When user reloads page, cookies have refreshToken but accessToken might be expired
- Before fix: Would fail to get user, show "Session expired"
- After fix: Detects 401, refreshes token, retries, user stays logged in!

---

## ✅ Verification Steps

### Step 1: Confirm File Was Updated

```bash
cd Frontend/src/lib
grep -n "apiJson" auth.tsx
# Should see: "return await apiJson<"
```

Or in VS Code:
- Open `Frontend/src/lib/auth.tsx`
- Search for: `requestCurrentUser`
- Should see `apiJson` being used, not raw `fetch`

### Step 2: Check Production Build

After deployment:
```bash
# Open in VS Code Terminal
npm run build
# Should complete with no errors
```

### Step 3: Test in Development

```bash
# Terminal 1 - Start backend
cd Backend
npm run dev
# Should start on http://localhost:5000

# Terminal 2 - Start frontend
cd Frontend  
npm run dev
# Should start on http://localhost:5173
```

### Step 4: Manual Testing (6 scenarios)

#### Scenario A: Normal Login
```
1. Go to http://localhost:5173
2. Click "Login"
3. Enter email: test@example.com
4. Enter password: password123
5. Dashboard should open with your name
✅ Check console: [Auth] Login successful
```

#### Scenario B: Page Reload (Critical Test)
```
1. Login successfully (see your name on dashboard)
2. Press F5 to reload page
3. Watch the console closely
4. Should see:
   [Auth] useEffect: Starting auth initialization
   [Auth] Loading current user...
   [Auth] User loaded successfully: [id]
5. Dashboard should still show your name ✅
6. NO "Session expired" message ✅
```

#### Scenario C: Add Habit (POST Request Test)
```
1. Make sure logged in
2. Click "+ New habit"
3. Fill in: Name="Test", Category="Health"
4. Click "Create habit"
5. Watch the console
6. Habit should appear in the list ✅
7. Should see postJson called and succeeded
```

#### Scenario D: Force Token Expiration Test
```
1. Login successfully
2. Open Browser DevTools → Console
3. Run this command:
   document.cookie = "accessToken=invalid; path=/"
4. Click "+ New habit" and create one
5. Watch console - should see:
   [Auth] Failed to load user: {status: 401}
   [Auth] Attempting to refresh tokens...
   [Auth] Tokens refreshed
6. Request should succeed after refresh ✅
```

#### Scenario E: Complete Task Test
```
1. Go to Tasks page
2. See your tasks from previous sessions
3. Click on a task to mark it complete
4. Should work without "Session expired" ✅
```

#### Scenario F: Dashboard Test
```
1. Go to Dashboard
2. Should show stats, habits, recent completions
3. All data should load without errors ✅
```

---

## 📊 Console Log Verification

### What You Should See

**When logging in:**
```
[Auth] Logging in...
[Auth] Login successful
[Auth] Auth init complete: {authenticated: true}
```

**When page reloads with valid tokens:**
```
[Auth] useEffect: Starting auth initialization
[Auth] Loading current user...
[Auth] User loaded successfully: 507f1f77bcf36cd799439011
[Auth] Auth init complete: {authenticated: true}
```

**When page reloads with expired accessToken:**
```
[Auth] useEffect: Starting auth initialization
[Auth] Loading current user...
[Auth] Failed to load user: {status: 401, message: "Token is not valid"}
[Auth] Attempting to refresh tokens...
[Auth] Tokens refreshed, retrying user load...
[Auth] User loaded after refresh: 507f1f77bcf36cd799439011
[Auth] Auth init complete: {authenticated: true}
```

**When truly logged out:**
```
[Auth] useEffect: Starting auth initialization
[Auth] Loading current user...
[Auth] Failed to load user: {status: 401}
[Auth] Attempting to refresh tokens...
[Auth] Refresh failed, session expired: "Refresh token is not valid"
[Auth] Auth init complete: {authenticated: false}
// Then redirects to login page
```

---

## 🐛 Troubleshooting

### Issue: Page Reload Still Shows "Session expired"

**Check**:
1. Are you in development or production?
   - Dev: http://localhost:5173
   - Prod: https://daily-tracker-mu-five.vercel.app
2. Open DevTools Console and look for [Auth] logs
3. If you see "Refresh token is not valid", you're truly logged out
4. Re-login and try again

**Fix**:
1. Clear all cookies: DevTools → Application → Cookies → Delete all
2. Refresh page
3. Try login again

### Issue: Add Habit Still Fails with 401

**Check**:
1. Are you logged in? (See your name on dashboard)
2. Open DevTools Console and watch for logs
3. See if refresh is being attempted

**Fix**:
1. Check backend logs on Render
2. Verify refreshToken cookie is present
3. Verify backend environment variables set correctly

### Issue: Getting "Network error connecting to backend"

**Check**:
1. Is backend running? (Test: curl http://localhost:5000/health)
2. Are CORS headers correct?
3. Is credentials: include being sent?

**Fix**:
```bash
# Check backend CORS setup
grep -A 5 "allowedOrigins" Backend/server.js
# Should include your frontend URL
```

---

## 📈 Production Deployment Verification

### After Pushing to GitHub

1. **Check Render Deployment**
   - Go to: https://dashboard.render.com
   - Select: daily-tracker-backend
   - Check: Deployments tab
   - Wait for green checkmark (usually 3-5 min)
   - Check Logs tab for errors

2. **Check Vercel Deployment**
   - Go to: https://vercel.com
   - Select: dailytracker
   - Check: Deployments tab
   - Wait for "Ready" status (usually 1-2 min)
   - Click to view build logs

3. **Test Production URL**
   - Go to: https://daily-tracker-mu-five.vercel.app
   - Login with test account
   - Refresh page (should stay logged in)
   - Try adding a habit
   - Check browser console for [Auth] logs

### Production Test Commands

```bash
# Test 1: Check if backend is up
curl https://daily-tracker-dic0.onrender.com/health

# Test 2: Test CORS preflight
curl -v -X OPTIONS https://daily-tracker-dic0.onrender.com/api/auth/me \
  -H "Origin: https://daily-tracker-mu-five.vercel.app"
# Should see: Access-Control-Allow-Origin: https://daily-tracker-mu-five.vercel.app

# Test 3: Test refresh endpoint
curl -X POST https://daily-tracker-dic0.onrender.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -b "refreshToken=yourtoken" \
  -c cookies.txt
```

---

## 🎯 Quick Checklist

- [ ] File Frontend/src/lib/auth.tsx was updated
- [ ] requestCurrentUser uses apiJson wrapper
- [ ] loadCurrentUser has 401 refresh logic
- [ ] Code builds without errors (npm run build)
- [ ] Logged in and page reload stays logged in
- [ ] Can add a habit without "Session expired"
- [ ] Console shows [Auth] logs correctly
- [ ] Backend and Frontend deployed
- [ ] Production URLs work
- [ ] All tests pass

---

## 🚀 How to Confirm Everything Works

### The Ultimate Test

1. **Login** to https://daily-tracker-mu-five.vercel.app
2. **Add a habit** (this was broken, now works)
3. **Refresh page** (F5) - should stay logged in
4. **Wait 1 hour**  
5. **Try add another habit** - should auto-refresh and work

If all 5 steps work, the fix is complete! ✅

---

## 📝 What Each Fix Does

| Fix | What It Does | Why It Matters |
|-----|-------------|-----------------|
| `requestCurrentUser` uses apiJson | Auto-refreshes 401 responses | Page reload no longer fails |
| loadCurrentUser has retry logic | Retries /api/auth/me after refresh | User stays logged in |
| Console logging added | Shows what's happening | Easier to debug issues |
| 10 second timeout | Enough time for slow networks | Won't timeout prematurely |

---

## 🔒 Security Verification

After fix, verify:
- [ ] Cookies are still httpOnly (DevTools → Application → Cookies)
- [ ] Cookies are sent on all requests (Network tab, see Cookie header)
- [ ] CORS only allows your Vercel URL
- [ ] Access tokens expire in 1 hour
- [ ] Refresh tokens expire in 7 days

---

## 📞 If You Need Help

Check these files for more details:
- `AUTHENTICATION_FIX.md` - Full technical explanation
- `Frontend/src/lib/api.ts` - API wrapper logic
- `Backend/middleware/authMiddleware.js` - Token validation
- `Backend/controllers/authController.js` - Token refresh logic

---

**Status**: Ready for testing ✅
**Last Updated**: 2026-05-11
**Test Date**: _____________
**Tester**: _____________
**Result**: ✅ Pass / ❌ Fail
