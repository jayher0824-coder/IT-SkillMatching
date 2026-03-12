const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../../database/models/User');
const emailService = require('../../services/emailService');
const rateLimit = require('express-rate-limit');

// Rate limiter for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset attempts per hour
  message: 'Too many password reset attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security constants
const MAX_REQUESTS_PER_DAY = 999; // Effectively unlimited
const REQUEST_COOLDOWN_MINUTES = 10; // Changed from hours to minutes
const VERIFICATION_CODE_EXPIRY_MINUTES = 15;

// Helper function to get client IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         'unknown';
};

// Helper function to generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code email
const sendVerificationCode = async (email, code, userName) => {
  try {
    const template = {
      subject: '🔐 Password Reset Verification Code - IT OJT Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #56AE67 0%, #3d8b4f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 3px dashed #56AE67; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .code { font-size: 36px; font-weight: bold; color: #56AE67; letter-spacing: 8px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Verification Code</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>You requested to reset your password. Please use the verification code below to continue:</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your verification code:</p>
                <div class="code">${code}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">This code expires in 15 minutes</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0;">
                  <li>Do not share this code with anyone</li>
                  <li>Our staff will never ask for this code</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>© 2025 IT OJT Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const result = await emailService.sendEmail(email, template);
    console.log('Verification code email sent to:', email, 'Result:', result);
    return result;
  } catch (error) {
    console.error('Error sending verification code email:', error);
    // Don't throw - allow process to continue even if email fails
    return { success: false, error: error.message };
  }
};

// Step 1: Request verification code
// OTP Endpoint Disabled - No longer using email verification codes
// Users can now directly request password reset via /forgot-password
/*
router.post('/request-verification-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('Password reset requested for non-existent user:', email);
      // Don't reveal if user exists
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists, a verification code has been sent to your email.' 
      });
    }

    console.log('Password reset request - User found:', email);

    // Check if user has Google OAuth
    if (user.googleId && !user.password) {
      return res.status(400).json({ 
        success: false, 
        message: 'This account uses Google Sign-In. Please sign in with Google or contact admin to set a password.' 
      });
    }

    // Rate limiting check - max 3 requests per day
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Reset count if it's been more than 24 hours
    if (!user.passwordRequestResetDate || user.passwordRequestResetDate < oneDayAgo) {
      user.passwordRequestCount = 0;
      user.passwordRequestResetDate = now;
    }

    if (user.passwordRequestCount >= MAX_REQUESTS_PER_DAY) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many password reset requests. Please try again tomorrow.' 
      });
    }

    // Cooldown check - 10 minutes between successful requests
    if (user.lastPasswordRequestDate) {
      const cooldownEnd = new Date(user.lastPasswordRequestDate.getTime() + REQUEST_COOLDOWN_MINUTES * 60 * 1000);
      if (now < cooldownEnd) {
        const minutesLeft = Math.ceil((cooldownEnd - now) / (60 * 1000));
        return res.status(429).json({ 
          success: false, 
          message: `Please wait ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''} before requesting another password reset.` 
        });
      }
    }

    // Check for pending request
    const hasPendingRequest = user.passwordChangeRequests?.some(req => req.status === 'pending');
    if (hasPendingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a pending password change request.' 
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(now.getTime() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);

    // Store verification code temporarily (in user document)
    user.resetPasswordToken = verificationCode;
    user.resetPasswordExpires = codeExpiry;
    user.passwordRequestCount += 1;
    
    await user.save();

    // Send verification code via email
    const userName = user.email.split('@')[0];
    console.log('Sending verification code to:', user.email);
    // DO NOT log the actual code - security risk!
    const emailResult = await sendVerificationCode(user.email, verificationCode, userName);
    
    if (!emailResult || !emailResult.success) {
      console.warn('Failed to send verification code email, but continuing...', emailResult);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Verification code sent to your email. Please check your inbox.' 
    });

  } catch (error) {
    console.error('Request verification code error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});
*/

// Step 2: Send password reset email with link
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    // Check if user has Google OAuth
    if (user.googleId && !user.password) {
      return res.status(400).json({ 
        success: false, 
        message: 'This account uses Google Sign-In. Please sign in with Google or contact admin to set a password.' 
      });
    }

    // Rate limiting check - max 3 requests per hour
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Count requests in the last hour
    const recentRequests = user.passwordChangeRequests?.filter(req => 
      req.requestDate > oneHourAgo && req.status === 'pending'
    ) || [];

    if (recentRequests.length >= 3) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many password reset requests. Please try again in an hour.' 
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token valid for 1 hour
    const tokenExpiry = new Date(now.getTime() + 60 * 60 * 1000);

    // Store token in user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = tokenExpiry;

    // Record the reset request
    if (!user.passwordChangeRequests) {
      user.passwordChangeRequests = [];
    }

    user.passwordChangeRequests.push({
      reason: 'Password reset requested via email link',
      requestDate: now,
      status: 'pending',
      verified: false,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    await user.save();

    // Send password reset email with link
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;
    
    const emailTemplate = {
      subject: '🔑 Password Reset Request - IT OJT Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #56AE67 0%, #3d8b4f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #56AE67; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${user.email.split('@')[0]},</p>
              <p>You requested to reset your password for your IT OJT Platform account. Please click the link below to proceed:</p>
              
              <center>
                <a href="${resetLink}" class="button">Reset Your Password</a>
              </center>
              
              <p style="text-align: center; color: #666; font-size: 12px;">
                Or copy this link: <br>
                <code>${resetLink}</code>
              </p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0;">
                  <li>This link expires in 1 hour</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              
              <p>If the button doesn't work, copy and paste the link above into your browser.</p>
            </div>
            <div class="footer">
              <p>© 2025 IT OJT Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await emailService.sendEmail(user.email, emailTemplate);
      console.log('Password reset email sent to:', user.email);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Still return success - user can request another email
    }

    res.status(200).json({ 
      success: true, 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});

// Get security questions for user
router.get('/security-questions/:email', async (req, res) => {
  try {
    console.log('Getting security questions for:', req.params.email);
    const user = await User.findOne({ email: req.params.email.toLowerCase() });

    if (!user) {
      console.log('User not found for security questions:', req.params.email);
      // Return empty array instead of 404 - security questions are optional
      return res.status(200).json({ 
        success: true, 
        questions: [],
        hasQuestions: false
      });
    }

    const questions = user.securityQuestions?.map(sq => ({ 
      id: sq._id, 
      question: sq.question 
    })) || [];

    console.log('Security questions found:', questions.length);
    res.status(200).json({ 
      success: true, 
      questions,
      hasQuestions: questions.length > 0
    });

  } catch (error) {
    console.error('Get security questions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});

// Setup security questions (authenticated users only)
router.post('/setup-security-questions', async (req, res) => {
  try {
    const { email, questions } = req.body;

    if (!email || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and at least one security question are required' 
      });
    }

    if (questions.length > 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum 3 security questions allowed' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Hash the answers
    const hashedQuestions = await Promise.all(questions.map(async (q) => {
      if (!q.question || !q.answer) {
        throw new Error('Each question must have a question and answer');
      }
      
      const answerHash = await bcrypt.hash(q.answer.toLowerCase().trim(), 10);
      
      return {
        question: q.question,
        answerHash: answerHash
      };
    }));

    user.securityQuestions = hashedQuestions;
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Security questions saved successfully' 
    });

  } catch (error) {
    console.error('Setup security questions error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error. Please try again later.' 
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

// Test email endpoint (for debugging)
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    console.log('Testing email to:', email);
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'NOT SET');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'NOT SET');

    const testCode = '123456';
    const result = await sendVerificationCode(email, testCode, 'Test User');
    
    res.json({ 
      success: result.success, 
      message: result.success ? 'Test email sent!' : 'Failed to send email',
      details: result
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
