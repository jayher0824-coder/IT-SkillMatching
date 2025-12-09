const express = require('express');
const { protect, authorize } = require('../../auth/middleware/auth');
const Feedback = require('../../database/models/Feedback');
const EmailReport = require('../../database/models/EmailReport');

const router = express.Router();

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { subject, message, category, priority } = req.body;

    const feedback = await Feedback.create({
      user: req.user._id,
      subject,
      message,
      category: category || 'general',
      priority: priority || 'medium',
    });

    await feedback.populate('user', 'email role');

    res.status(201).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get user's feedback
// @route   GET /api/feedback
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: req.user._id })
      .populate('respondedBy', 'email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedback.length,
      data: feedback,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get all feedback for admin
// @route   GET /api/feedback/admin/all
// @access  Private (Admin only)
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('user', 'firstName lastName email role')
      .populate('respondedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedback.length,
      data: feedback,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Log email report
// @route   POST /api/feedback/email-report
// @access  Private
router.post('/email-report', protect, async (req, res) => {
  try {
    const { 
      recipient, 
      subject, 
      message, 
      emailType, 
      status = 'sent', 
      metadata = {} 
    } = req.body;

    const emailReport = await EmailReport.create({
      recipient: recipient || req.user._id,
      sender: req.user._id,
      subject,
      message,
      emailType: emailType || 'notification',
      status,
      metadata,
    });

    await emailReport.populate([
      { path: 'recipient', select: 'email role' },
      { path: 'sender', select: 'email role' }
    ]);

    res.status(201).json({
      success: true,
      data: emailReport,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
