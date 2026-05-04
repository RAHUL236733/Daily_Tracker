import rateLimit from 'express-rate-limit';

const isProduction = process.env.NODE_ENV === 'production';
const authWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const authMaxAttempts = Number(process.env.AUTH_RATE_LIMIT_MAX || 5);
const strictAuthMaxAttempts = Number(process.env.STRICT_AUTH_RATE_LIMIT_MAX || 3);

// Helper to create a limiter that is active in production, but relaxed/disabled in development
function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting completely when not in production to avoid blocking local testing
    skip: () => !isProduction,
    message: {
      success: false,
      message,
    },
  });
}

export const authLimiter = createLimiter({
  windowMs: authWindowMs,
  max: authMaxAttempts,
  message: 'Too many authentication attempts. Please try again later.',
});

export const strictAuthLimiter = createLimiter({
  windowMs: authWindowMs,
  max: strictAuthMaxAttempts,
  message: 'Too many requests. Please slow down and try again later.',
});