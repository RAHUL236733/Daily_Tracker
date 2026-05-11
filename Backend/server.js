import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import logRoutes from './routes/logRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: `${__dirname}/.env` });

const app = express();
app.set('trust proxy', 1);

const isProduction = process.env.NODE_ENV === 'production';

// Build a comprehensive whitelist that includes production Vercel frontend and local dev hosts
const allowedOrigins = new Set();

// Always include explicit production Vercel frontend URL
allowedOrigins.add('https://daily-tracker-mu-five.vercel.app');

// Include configured frontend URL if provided (via env)
const configuredFrontend = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
if (configuredFrontend && configuredFrontend !== '') {
  allowedOrigins.add(configuredFrontend);
}

// Local development URLs
if (!isProduction) {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
  allowedOrigins.add('http://localhost:5174');
  allowedOrigins.add('http://127.0.0.1:5174');
  allowedOrigins.add('http://localhost:5175');
  allowedOrigins.add('http://127.0.0.1:5175');
}

// Log configured origins for debugging
if (!isProduction) {
  console.log('CORS Allowed Origins:', Array.from(allowedOrigins));
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin requests, server-to-server calls)
    if (!origin) return callback(null, true);

    // Exact-match only for security; this ensures Access-Control-Allow-Origin is not '*'
    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    // Log rejected origins for debugging
    if (!isProduction) {
      console.warn(`CORS rejection for origin: ${origin}`);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
};

// Middleware - order is critical for CORS and authentication
app.use(helmet());

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Parse cookies BEFORE any route handlers
app.use(cookieParser());

// Parse JSON bodies - critical for POST requests with JSON bodies
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize data against NoSQL injection
app.use(mongoSanitize());

if (isProduction) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

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
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

const startServer = async () => {
  try {
    // Ensure MongoDB is connected before accepting requests
    await connectDB();

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  Daily Habit Tracker Backend Running  ║
║  Server: http://localhost:${PORT}      ║
║  Environment: ${process.env.NODE_ENV || 'development'} ║
╚════════════════════════════════════════╝
  `);
    });

    server.on('error', (error) => {
      if (error?.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the existing process or set a different PORT.`);
        process.exit(1);
      }

      console.error(`Server listen error: ${error.message}`);
      process.exit(1);
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
