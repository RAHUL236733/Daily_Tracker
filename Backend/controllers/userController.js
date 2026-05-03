import User from '../models/User.js';

/**
 * @desc Get current user profile
 * @route GET /api/user/profile
 * @access Private
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findById(userId).select('name email');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
