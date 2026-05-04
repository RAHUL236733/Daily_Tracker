# Backend Deployment (Render or Railway)

## 1) Required Environment Variables
Set these in your deployment dashboard (do not commit real secrets):

- NODE_ENV=production
- PORT=5000 (or platform-provided port)
- MONGO_URI=<your MongoDB Atlas URI>
- JWT_SECRET=<long-random-secret>
- JWT_REFRESH_SECRET=<long-random-refresh-secret>
- JWT_EXPIRE=1h
- JWT_REFRESH_EXPIRE=7d
- FRONTEND_URL=<your frontend URL, e.g. https://your-app.vercel.app>
- COOKIE_SECURE=true
- COOKIE_SAME_SITE=none
- COOKIE_DOMAIN=<optional, e.g. .yourdomain.com>
- AUTH_RATE_LIMIT_WINDOW_MS=900000
- AUTH_RATE_LIMIT_MAX=5
- STRICT_AUTH_RATE_LIMIT_MAX=3

## 2) Build/Start Commands
- Build Command: npm install
- Start Command: npm start

## 3) CORS and Cookies
- FRONTEND_URL must exactly match your deployed frontend origin.
- Use HTTPS in production so secure cookies work.
- With cross-site frontend/backend deployment, use:
  - COOKIE_SECURE=true
  - COOKIE_SAME_SITE=none

## 4) Health Check
Use `/health` as your service health endpoint.

## 5) Post-Deploy Verification
- Register/Login works and sets HttpOnly cookies.
- `/api/auth/me` returns user when called with credentials included.
- `/api/auth/refresh` rotates refresh token successfully.
- Rate limits trigger after threshold in production.
