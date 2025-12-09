const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../../database/models/User');
const Student = require('../../database/models/Student');
const Company = require('../../database/models/Company');
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

router.post('/register', authLimiter, [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .custom((value, { req }) => {
      // Enhanced validation for student registration
      if (req.body.role === 'student') {
        if (value.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(value)) {
          throw new Error('Password must contain at least one uppercase letter');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
          throw new Error('Password must contain at least one special character');
        }
      }
      return true;
    }),
  body('role').isIn(['student', 'company', 'admin']).withMessage('Role must be student, company, or admin'),
  body('firstName').optional().custom((value, { req }) => {
    if (req.body.role === 'student' && !value) {
      throw new Error('First name is required for students');
    }
    return true;
  }),
  body('lastName').optional().custom((value, { req }) => {
    if (req.body.role === 'student' && !value) {
      throw new Error('Last name is required for students');
    }
    return true;
  }),
  body('studentId').optional().isLength({ min: 1 }).withMessage('Student ID must not be empty').custom((value, { req }) => {
    if (req.body.role === 'student' && !value) {
      throw new Error('Student ID is required for students');
    }
    return true;
  }),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required').custom((value, { req }) => {
    if (req.body.role === 'student' && !value) {
      throw new Error('Phone number is required for students');
    }
    return true;
  }),
  body('address.street').optional().notEmpty().withMessage('Street address is required').custom((value, { req }) => {
    if (req.body.role === 'student' && !value) {
      throw new Error('Street address is required for students');
    }
    return true;
  }),
  body('address.city').optional().notEmpty().withMessage('City is required').custom((value, { req }) => {
    if (req.body.role === 'student' && !value) {
      throw new Error('City is required for students');
    }
    return true;
  }),
  body('address.state').optional().notEmpty().withMessage('State is required').custom((value, { req }) => {
    if (req.body.role === 'student' && !value) {
      throw new Error('State is required for students');
    }
    return true;
  }),
  body('address.zip').optional().isPostalCode('any').withMessage('Valid ZIP code is required').custom((value, { req }) => {
    if (req.body.role === 'student' && !value) {
      throw new Error('ZIP code is required for students');
    }
    return true;
  }),
], async (req, res) => {
  try {
    console.log('Registration attempt:', { email: req.body.email, role: req.body.role });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        message: errors.array().map(e => e.msg).join('; ')
      });
    }

    const { email, password, role, studentId, phone, address, firstName, lastName } = req.body;

    // For students, validate Fatima student email domain
    if (role === 'student' && !email.endsWith('@student.fatima.edu.ph')) {
      return res.status(400).json({
        success: false,
        message: 'Student email must be a Fatima student Google account (@student.fatima.edu.ph)',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // For students, check if studentId already exists
    if (role === 'student') {
      const existingStudent = await Student.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already exists',
        });
      }
    }

    // Create user
    const user = await User.create({
      email,
      password,
      role,
    });

    // If registering as student, create student profile with provided details
    if (role === 'student') {
      await Student.create({
        user: user._id,
        studentId,
        firstName,
        lastName,
        dateOfBirth: new Date('2000-01-01'), // Default, update later
        phone,
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zip,
          country: 'Philippines', // Default for OLFU
        },
        assessmentCompleted: false, // Require assessment
        assessmentScore: null,
        skills: [],
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
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
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
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
