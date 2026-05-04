# Frontend Deployment (Vercel or Netlify)

## 1) Required Environment Variable
Set in hosting dashboard:

- VITE_API_URL=<your backend base URL, e.g. https://your-api.onrender.com>

## 2) Build Settings
- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist/client

## 3) Auth Cookie Requirements
Frontend requests must include credentials for HttpOnly cookie auth.
This project already uses `credentials: "include"` in API calls.

## 4) HTTPS Requirement
Use HTTPS for frontend and backend in production.
If backend uses secure cookies, HTTP origins will not keep auth sessions.

## 5) Runtime Verification
- Login succeeds and session persists after page refresh.
- Protected pages load without localStorage tokens.
- Forgot/reset password flow works against deployed backend.
