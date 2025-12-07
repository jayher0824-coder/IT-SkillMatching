const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../../database/models/User');
const nodemailer = require('nodemailer');

// Email transporter configuration
const createTransporter = () => {
  // For development, you can use Gmail or another SMTP service
  // For production, use a service like SendGrid, AWS SES, or Mailgun
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists with this email, a password change request will be sent to the admin.' 
      });
    }

    // Check if user has Google OAuth (no password to reset)
    if (user.googleId && !user.password) {
      return res.status(400).json({ 
        success: false, 
        message: 'This account uses Google Sign-In. Please sign in with Google or contact admin to set a password.' 
      });
    }

    // Check if user already has a pending request
    const hasPendingRequest = user.passwordChangeRequests?.some(req => req.status === 'pending');
    
    if (hasPendingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a pending password change request. Please wait for admin approval.' 
      });
    }

    // Add password change request to user document
    if (!user.passwordChangeRequests) {
      user.passwordChangeRequests = [];
    }

    user.passwordChangeRequests.push({
      reason: 'Forgot password - requested via forgot password form',
      requestedAt: new Date(),
      status: 'pending'
    });
    
    await user.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Password change request sent to admin. You will be notified once approved.' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now log in with your new password.' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});

// Verify reset token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token is required' 
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Token is valid' 
    });

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
