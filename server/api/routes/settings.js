 const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { protect } = require('../../auth/middleware/auth');
const User = require('../../database/models/User');
const Student = require('../../database/models/Student');
const Company = require('../../database/models/Company');

// @desc    Change password
// @route   POST /api/settings/change-password
// @access  Private
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password',
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');

    // Check if user signed up with Google and has no password set
    if (user.googleId && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'You signed up with Google. To set a password for email login, please request a password change from an admin.',
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        themePreference: user.themePreference || 'light',
        notifications: user.settings?.notifications || {
          email: true,
          jobUpdates: true,
          assessments: true,
        },
        privacy: user.settings?.privacy || {
          profileVisible: true,
          resumeVisible: true,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Update notification preferences
// @route   PUT /api/settings/notifications
// @access  Private
router.put('/notifications', protect, async (req, res) => {
  try {
    const { email, jobUpdates, assessments } = req.body;

    const user = await User.findById(req.user._id);

    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.notifications) {
      user.settings.notifications = {};
    }

    // Update notification preferences
    if (typeof email !== 'undefined') user.settings.notifications.email = email;
    if (typeof jobUpdates !== 'undefined') user.settings.notifications.jobUpdates = jobUpdates;
    if (typeof assessments !== 'undefined') user.settings.notifications.assessments = assessments;

    await user.save();

    res.json({
      success: true,
      message: 'Notification preferences updated',
      data: user.settings.notifications,
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Update privacy settings
// @route   PUT /api/settings/privacy
// @access  Private
router.put('/privacy', protect, async (req, res) => {
  try {
    const { profileVisible, resumeVisible } = req.body;

    const user = await User.findById(req.user._id);

    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.privacy) {
      user.settings.privacy = {};
    }

    // Update privacy settings
    if (typeof profileVisible !== 'undefined') user.settings.privacy.profileVisible = profileVisible;
    if (typeof resumeVisible !== 'undefined') user.settings.privacy.resumeVisible = resumeVisible;

    await user.save();

    res.json({
      success: true,
      message: 'Privacy settings updated',
      data: user.settings.privacy,
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Update theme preference
// @route   PUT /api/settings/theme
// @access  Private
router.put('/theme', protect, async (req, res) => {
  try {
    const { theme } = req.body;

    if (!['light', 'dark'].includes(theme)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme. Must be "light" or "dark"',
      });
    }

    const user = await User.findById(req.user._id);
    user.themePreference = theme;
    await user.save();

    res.json({
      success: true,
      message: 'Theme preference updated',
      data: { theme },
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Request password change from admin
// @route   POST /api/settings/request-password-change
// @access  Private
router.post('/request-password-change', protect, async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await User.findById(req.user._id);

    // Check if there's already a pending request
    const hasPendingRequest = user.passwordChangeRequests?.some(
      request => request.status === 'pending'
    );

    if (hasPendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending password change request',
      });
    }

    // Add new password change request
    if (!user.passwordChangeRequests) {
      user.passwordChangeRequests = [];
    }

    user.passwordChangeRequests.push({
      reason: reason || 'User requested password reset',
      status: 'pending',
      requestDate: new Date(),
    });

    await user.save();

    res.json({
      success: true,
      message: 'Password change request submitted successfully. An admin will review it shortly.',
      data: user.passwordChangeRequests[user.passwordChangeRequests.length - 1],
    });
  } catch (error) {
    console.error('Error requesting password change:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get user's password change requests
// @route   GET /api/settings/password-change-requests
// @access  Private
router.get('/password-change-requests', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('passwordChangeRequests')
      .populate('passwordChangeRequests.reviewedBy', 'email');

    res.json({
      success: true,
      data: user.passwordChangeRequests || [],
    });
  } catch (error) {
    console.error('Error fetching password change requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
