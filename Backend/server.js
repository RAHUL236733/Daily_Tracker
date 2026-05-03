import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import logRoutes from './routes/logRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: `${__dirname}/.env` });

const app = express();

// Middleware
// Configure CORS to allow common local dev origins (localhost and 127.0.0.1)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use((req, res, next) => {
  // Log incoming origin for debugging CORS issues
  // eslint-disable-next-line no-console
  console.log('Incoming Origin:', req.headers.origin);
  next();
});

app.use(
  cors({
      origin: (origin, callback) => {
        // allow requests with no origin (eg. curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // allow any localhost or 127.0.0.1 origin on any port during development
        const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
        if (localhostRegex.test(origin)) return callback(null, true);

        return callback(new Error('CORS origin not allowed'));
      },
    credentials: true,
  })
);

// Ensure preflight requests are handled
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/habit', habitRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/user', userRoutes);
app.use('/api/logs', logRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const startServer = async () => {
  try {
    // Ensure MongoDB is connected before accepting requests
    await connectDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  Daily Habit Tracker Backend Running  ║
║  Server: http://localhost:${PORT}      ║
║  Environment: ${process.env.NODE_ENV || 'development'} ║
╚════════════════════════════════════════╝
  `);
    });
  } catch (error) {
    console.error(`Server start failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
