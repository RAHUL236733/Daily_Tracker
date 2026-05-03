import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import { sendOtpEmail, sendWelcomeEmail } from '../utils/sendEmail.js';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
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
    console.log('register req.body:', req.body);

    const { name, email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedName = String(name || '').trim();
    const rawPassword = String(password || '').trim();

    if (!normalizedName || !normalizedEmail || !rawPassword) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email' });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists with that email' });
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

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      userId: user._id,
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
    console.log('login req.body:', req.body);

    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const rawPassword = String(password || '').trim();

    if (!normalizedEmail || !rawPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    console.log('login user:', user);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }

    const isMatch = await user.matchPassword(rawPassword);
    console.log('login password match:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      userId: user._id,
    });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Forgot Password - Send OTP
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Please provide an email' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with that email' });
    }

    // Generate and save OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // eslint-disable-next-line no-console
    console.log(`Generated OTP for ${normalizedEmail}; expires at ${otpExpiry.toISOString()}`);

    // Send OTP via email
    try {
      await sendOtpEmail(normalizedEmail, otp);
    } catch (emailError) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Valid for 5 minutes.',
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ success: false, message: error.message });
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