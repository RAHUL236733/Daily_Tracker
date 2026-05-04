import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMe,
  refreshToken,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter, strictAuthLimiter } from '../middleware/rateLimiters.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

const registerValidators = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidators = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidators = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
];

const verifyOtpValidators = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('OTP must be 4-6 digits'),
];

const resetPasswordValidators = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
];

router.post('/register', authLimiter, registerValidators, validateRequest, register);
router.post('/login', authLimiter, loginValidators, validateRequest, login);
router.post('/refresh', strictAuthLimiter, refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', strictAuthLimiter, forgotPasswordValidators, validateRequest, forgotPassword);
router.post('/verify-otp', strictAuthLimiter, verifyOtpValidators, validateRequest, verifyOtp);
router.post('/reset-password', strictAuthLimiter, resetPasswordValidators, validateRequest, resetPassword);
router.get('/me', protect, getMe);

export default router;
