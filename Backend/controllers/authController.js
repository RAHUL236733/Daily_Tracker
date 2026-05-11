import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import { sendOtpEmail, sendWelcomeEmail } from '../utils/sendEmail.js';

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRE || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRE || '7d';
const REFRESH_COOKIE_NAME = 'refreshToken';
const ACCESS_COOKIE_NAME = 'accessToken';

const resolveCookieSameSite = () => {
  const configured = String(process.env.COOKIE_SAME_SITE || '').trim().toLowerCase();

  // Explicit configuration takes precedence
  if (configured === 'strict' || configured === 'lax') return configured;
  if (configured === 'none') return 'none';

  // Default for production cross-domain requests: 'none' (requires secure: true)
  // Default for development: 'lax'
  return process.env.NODE_ENV === 'production' ? 'none' : 'lax';
};

const getCookieOptions = (maxAge) => {
  const forceSecure = String(process.env.COOKIE_SECURE || '').trim().toLowerCase() === 'true';
  const secureByEnv = process.env.NODE_ENV === 'production';
  const secureEnabled = forceSecure || secureByEnv;
  const sameSite = String(resolveCookieSameSite()).toLowerCase();

  const options = {
    httpOnly: true,        // Cannot be accessed by JavaScript (security)
    secure: secureEnabled, // Only sent over HTTPS in production
    sameSite,              // 'none' for cross-domain, 'lax' or 'strict' for same-domain
    maxAge,                // Expires in maxAge milliseconds
    path: '/',             // Cookie applies to all paths
  };

  // Only apply domain when explicitly configured (rare case)
  const cookieDomain = String(process.env.COOKIE_DOMAIN || '').trim();
  if (cookieDomain) options.domain = cookieDomain;

  if (!process.env.NODE_ENV === 'production') {
    console.log('Cookie options configured:', {
      httpOnly: options.httpOnly,
      secure: options.secure,
      sameSite: options.sameSite,
      maxAge: options.maxAge,
      path: options.path,
    });
  }

  return options;
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = (user) =>
  jwt.sign({ userId: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

const generateRefreshToken = (user) =>
  jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

const setAuthCookies = (res, accessToken, refreshToken) => {
  const accessMaxAge = 60 * 60 * 1000; // 1 hour in ms
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  res.cookie(ACCESS_COOKIE_NAME, accessToken, getCookieOptions(accessMaxAge));
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(refreshMaxAge));
};

const clearAuthCookies = (res) => {
  // Use the same options (path/domain/sameSite/secure) when clearing cookies
  const opts = getCookieOptions(0);
  // Ensure cookies are expired immediately
  opts.expires = new Date(0);
  res.clearCookie(ACCESS_COOKIE_NAME, opts);
  res.clearCookie(REFRESH_COOKIE_NAME, opts);
};

const issueTokens = async (user, res) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.setRefreshToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, refreshToken);

  return { accessToken, refreshToken };
};

// Generate OTP
const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedName = String(name || '').trim();
    const rawPassword = String(password || '').trim();

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcryptjs.hash(rawPassword, 10);
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user = new User({ name: normalizedName, email: normalizedEmail, password: hashedPassword, otp, otpExpiry });

    try {
      await user.save();
    } catch (saveError) {
      console.error('register save error:', saveError);
      return res.status(500).json({ success: false, message: 'Failed to save user' });
    }

    sendWelcomeEmail(normalizedEmail, normalizedName).catch((err) => console.error('Welcome email failed:', err));

    await issueTokens(user, res);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const rawPassword = String(password || '').trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password +loginAttempts +lockUntil +refreshTokenHash +role'
    );

    if (!user) {
      return res.status(400).json({ success: false, message: 'Not registered', code: 'USER_NOT_FOUND' });
    }

    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked. Please try again later.',
      });
    }

    const isMatch = await user.matchPassword(rawPassword);

    if (!isMatch) {
      await user.recordFailedLogin();

      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    await user.resetLoginState();
    await issueTokens(user, res);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Forgot Password - Send OTP via email
 * @route POST /api/auth/forgot-password
 * @access Public
 * @body {email: string}
 * @returns {success: boolean, message: string}
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Validate email input
    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
        code: 'EMAIL_REQUIRED',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    // Don't reveal whether email exists (security best practice)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists for this email, an OTP will be sent shortly.',
      });
    }

    // Generate OTP and expiry
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    user.otp = otp;
    user.otpExpiry = otpExpiry;

    // Save OTP to database
    try {
      await user.save({ validateBeforeSave: false });
    } catch (saveError) {
      console.error('Error saving OTP to database:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Failed to process forgot password request',
        code: 'DB_ERROR',
      });
    }

    // Log for debugging (remove OTP from logs in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Generated OTP for ${normalizedEmail}: ${otp} (expires at ${otpExpiry.toISOString()})`);
    } else {
      console.log(`Forgot password request for ${normalizedEmail}`);
    }

    // Send OTP via email
    try {
      await sendOtpEmail(normalizedEmail, otp);
      console.log(`✓ OTP email sent successfully to ${normalizedEmail}`);

      return res.status(200).json({
        success: true,
        message: 'OTP sent to your email. Valid for 5 minutes.',
        code: 'OTP_SENT',
      });
    } catch (emailError) {
      console.error(`✗ Email sending failed for ${normalizedEmail}:`, emailError.message);

      // Clear OTP if email fails
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save({ validateBeforeSave: false }).catch((err) =>
        console.error('Error clearing OTP after email failure:', err)
      );

      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.',
        code: 'EMAIL_ERROR',
      });
    }
  } catch (error) {
    console.error('Unexpected error in forgotPassword:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An unexpected error occurred. Please try again later.',
      code: 'SERVER_ERROR',
    });
  }
};

/**
 * @desc Verify OTP
 * @route POST /api/auth/verify-otp
 * @access Public
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const incomingOtp = String(otp || '').trim();

    console.log('verifyOtp request received for:', normalizedEmail);

    if (!normalizedEmail || !incomingOtp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpiry');
    console.log('verifyOtp user found:', !!user);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('verifyOtp metadata:', {
      hasStoredOtp: Boolean(user.otp),
      hasOtpExpiry: Boolean(user.otpExpiry),
      now: new Date().toISOString(),
    });

    if (!user.otp) {
      return res.status(400).json({ success: false, message: 'No OTP found for this user. Please request a new OTP.' });
    }

    // Compare OTPs (convert both to string for comparison)
    const storedOtpString = String(user.otp);
    if (storedOtpString !== incomingOtp) {
      console.log('OTP mismatch for user:', normalizedEmail);
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Check if OTP has expired
    if (new Date() > new Date(user.otpExpiry)) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      console.log('OTP expired at:', user.otpExpiry);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    console.log('OTP verified successfully for:', normalizedEmail);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error) {
    console.error('verifyOtp error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Reset Password
 * @route POST /api/auth/reset-password
 * @access Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const rawNewPassword = String(newPassword || '').trim();
    const rawConfirmPassword = String(confirmPassword || '').trim();

    if (!normalizedEmail || !rawNewPassword || !rawConfirmPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (rawNewPassword !== rawConfirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (rawNewPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = await bcryptjs.hash(rawNewPassword, 10);
    user.refreshTokenHash = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get current user
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
      console.log('[refresh] No refresh token found in cookies');
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }

    console.log('[refresh] Refresh token found, verifying...');

    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.userId).select('+refreshTokenHash +role');

    if (!user) {
      console.log(`[refresh] User not found: ${decoded.userId}`);
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.refreshTokenHash || !user.matchesRefreshToken(incomingRefreshToken)) {
      console.log(`[refresh] Refresh token validation failed for user: ${decoded.userId}`);
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Refresh token is not valid' });
    }

    console.log(`[refresh] Refresh token valid, issuing new tokens for user: ${decoded.userId}`);

    await issueTokens(user, res);

    return res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('[refresh] Refresh token error:', error.message);
    clearAuthCookies(res);
    return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }
};

export const logout = async (req, res) => {
  try {
    const accessUserId = req.userId;
    const refreshToken = req.cookies?.refreshToken;

    if (accessUserId) {
      await User.findByIdAndUpdate(accessUserId, {
        $unset: { refreshTokenHash: 1 },
      });
    } else if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );

        await User.findByIdAndUpdate(decoded.userId, {
          $unset: { refreshTokenHash: 1 },
        });
      } catch (error) {
        // Ignore invalid refresh tokens and still clear cookies below.
      }
    }

    clearAuthCookies(res);

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};