const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../../database/models/User');
const Student = require('../../database/models/Student');
const passport = require('passport');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register attempts per windowMs
  message: 'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

// Rate limiter for password-related endpoints
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password attempts per hour
  message: 'Too many password attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Public self-registration is intentionally disabled.
router.post('/register', authLimiter, (req, res) => {
  const requestedRole = req.body?.role;

  if (requestedRole === 'student') {
    return res.status(403).json({
      success: false,
      message: 'Student self-registration is disabled. Please sign in using your Fatima Google account.',
    });
  }

  if (requestedRole === 'company') {
    return res.status(403).json({
      success: false,
      message: 'Company self-registration is disabled. Please contact an admin to create your company account.',
    });
  }

  return res.status(403).json({
    success: false,
    message: 'Public registration is disabled. Please contact an administrator.',
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // For students, check if they have completed the assessment
    let requiresAssessment = false;
    if (user.role === 'student') {
      const student = await Student.findOne({ user: user._id });
      requiresAssessment = !student || !student.assessmentCompleted;
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        themePreference: user.themePreference,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      requiresAssessment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Verify authentication token and user role
// @route   POST /api/auth/verify
// @access  Private
router.post('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'No token provided',
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'User not found or inactive',
      });
    }

    // Check if user is admin or company
    if (!['admin', 'company'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        valid: false,
        message: 'User does not have admin/company access',
      });
    }

    res.json({
      success: true,
      valid: true,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Token expired',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Invalid token',
      });
    }
    res.status(500).json({
      success: false,
      valid: false,
      message: 'Server error',
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        role: user.role,
        themePreference: user.themePreference,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
});

// Debug endpoint
router.get('/debug', (req, res) => {
  res.json({
    message: 'Auth debug endpoint',
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
    redirectUri: 'http://localhost:3000/api/auth/google/callback',
    authUrl: 'http://localhost:3000/api/auth/google'
  });
});

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account'  // Force account selection every time
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/' }), 
  (req, res, next) => {
    try {
      if (!req.user) {
        console.error('Google OAuth: No user returned from passport');
        return res.status(401).json({
          success: false,
          message: 'Authentication failed - no user'
        });
      }
      
      const token = generateToken(req.user._id);
      // Redirect to front-end with token and basic user info as query params
      const redirectUrl = `/auth-success.html?token=${token}&email=${encodeURIComponent(req.user.email)}&role=${req.user.role}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication error: ' + error.message
      });
    }
  }
);

module.exports = router;
