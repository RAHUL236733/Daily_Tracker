# Daily Habit Tracker - Backend API Documentation

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone or navigate to the backend directory**
```bash
cd Backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

4. **Configure Environment Variables**
Edit `.env` with your actual values:
- `MONGO_URI` or `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A strong secret key for access tokens
- `JWT_REFRESH_SECRET`: A separate strong secret for refresh tokens
- `JWT_EXPIRE`: Access token lifetime, for example `1h`
- `JWT_REFRESH_EXPIRE`: Refresh token lifetime, for example `7d`
- `EMAIL_USER` & `EMAIL_PASSWORD`: Gmail app-specific password
- `FRONTEND_URL`: Your frontend URL (for CORS)

5. **Start the server**
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

---

## API Endpoints

### Authentication

#### 1. Register
- **POST** `/api/auth/register`
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response**: User object and secure auth cookies

#### 2. Login
- **POST** `/api/auth/login`
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response**: User object and secure auth cookies

#### 3. Get Current User
- **GET** `/api/auth/me`
- **Auth**: HttpOnly `accessToken` cookie, refresh handled at `/api/auth/refresh`
- **Response**: Current user object

#### 4. Forgot Password (Request OTP)
- **POST** `/api/auth/forgot-password`
- **Body**:
```json
{
  "email": "john@example.com"
}
```
- **Response**: Success message

#### 5. Verify OTP
- **POST** `/api/auth/verify-otp`
- **Body**:
```json
{
  "email": "john@example.com",
  "otp": "1234"
}
```
- **Response**: Success message

#### 6. Reset Password
- **POST** `/api/auth/reset-password`
- **Body**:
```json
{
  "email": "john@example.com",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```
- **Response**: Success message

---

### Tasks

#### 1. Create Task
- **POST** `/api/tasks`
- **Auth**: HttpOnly `accessToken` cookie (legacy `Authorization: Bearer <token>` also supported)
- **Body**:
```json
{
  "title": "Morning Meditation",
  "category": "Mind",
  "targetTime": "06:30",
  "duration": "10 min",
  "description": "Start the day with meditation"
}
```
- **Response**: Created task object

#### 2. Get All Tasks
- **GET** `/api/tasks`
- **Auth**: HttpOnly `accessToken` cookie (legacy `Authorization: Bearer <token>` also supported)
- **Response**: Array of tasks for current user

#### 3. Get Single Task
- **GET** `/api/tasks/:id`
- **Auth**: HttpOnly `accessToken` cookie (legacy `Authorization: Bearer <token>` also supported)
- **Response**: Task object

#### 4. Update Task
- **PUT** `/api/tasks/:id`
- **Auth**: HttpOnly `accessToken` cookie (legacy `Authorization: Bearer <token>` also supported)
- **Body**: Any fields to update
- **Response**: Updated task object

#### 5. Delete Task
- **DELETE** `/api/tasks/:id`
- **Auth**: HttpOnly `accessToken` cookie (legacy `Authorization: Bearer <token>` also supported)
- **Response**: Success message

#### 6. Toggle Task Completion
- **PATCH** `/api/tasks/:id/toggle`
- **Auth**: HttpOnly `accessToken` cookie (legacy `Authorization: Bearer <token>` also supported)
- **Response**: Updated task object

---

### Task Logs (Tracking)

#### 1. Create/Update Log
- **POST** `/api/logs`
- **Auth**: HttpOnly `accessToken` cookie (legacy `Authorization: Bearer <token>` also supported)
- **Body**:
```json
{
  "taskId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "date": "2024-01-15",
  "completed": true,
  "timeSpent": 12,
  "notes": "Great session today"
}
```
- **Response**: Created/updated log object

#### 2. Get Logs for a Date
- **GET** `/api/logs?date=2024-01-15`
- **Auth**: HttpOnly `accessToken` cookie (legacy `Authorization: Bearer <token>` also supported)
- **Response**: Array of task logs for the date

#### 3. Get Logs for Date Range
- **GET** `/api/logs/range?startDate=2024-01-01&endDate=2024-01-31`
- **Auth**: HttpOnly `accessToken` cookie (legacy `Authorization: Bearer <token>` also supported)
- **Response**: Array of task logs in the range

#### 4. Get Daily Stats
- **GET** `/api/logs/stats?date=2024-01-15`
- **Auth**: HttpOnly `accessToken` cookie (legacy `Authorization: Bearer <token>` also supported)
- **Response**:
```json
{
  "success": true,
  "stats": {
    "date": "2024-01-15",
    "completed": 3,
    "total": 5,
    "completionRate": 60,
    "totalTimeSpent": 45
  }
}
```

#### 5. Delete Log
- **DELETE** `/api/logs/:id`
- **Auth**: HttpOnly `accessToken` cookie (legacy `Authorization: Bearer <token>` also supported)
- **Response**: Success message

---

## Database Schema

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  otp: String (for password reset),
  otpExpiry: Date,
  isEmailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Task
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String,
  category: String, // Health, Mind, Work, Learning, Personal
  targetTime: String, // HH:MM format
  duration: String, // e.g., "30 min"
  completed: Boolean,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### TaskLog
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  taskId: ObjectId (ref: Task),
  date: Date,
  completed: Boolean,
  timeSpent: Number, // in minutes
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Handling

All endpoints return JSON responses with `success` and `message` fields:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Security Features

✓ Access/refresh JWT flow with HttpOnly cookies  
✓ Refresh-token rotation with hashed refresh token storage  
✓ Bcrypt password hashing  
✓ Account lockout after repeated failed logins  
✓ express-rate-limit on auth routes  
✓ express-validator request validation  
✓ NoSQL injection protection via `express-mongo-sanitize`  
✓ `helmet` HTTP security headers  
✓ CORS allowlist with `FRONTEND_URL`  
✓ Body size limits for JSON/urlencoded payloads  
✓ Centralized API error handling middleware  
✓ Request logging with `morgan`  

---

## Testing the API

Use Postman or any API client to test endpoints:

1. Register/login and confirm HttpOnly cookies are set
2. Call `/api/auth/me` with credentials included
3. Test `/api/auth/refresh` token rotation
4. Test task CRUD operations
5. Test task logging and daily stats
6. Test forgot/reset password flow (OTP)

---

## Deployment

Use the deployment checklist in [DEPLOYMENT.md](DEPLOYMENT.md) for Render/Railway setup.

---

## Support

For issues or questions, check the API responses and console logs for error messages.
