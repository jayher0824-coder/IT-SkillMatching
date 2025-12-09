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

// @desc    Reply to feedback
// @route   POST /api/feedback/:id/reply
// @access  Private (Admin only)
router.post('/:id/reply', protect, authorize('admin'), async (req, res) => {
  try {
    const { reply } = req.body;

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        adminResponse: reply,
        respondedBy: req.user._id,
        status: 'resolved',
        respondedAt: new Date()
      },
      { new: true }
    ).populate('user', 'firstName lastName email').populate('respondedBy', 'firstName lastName email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Create notification for user about admin reply
    const NotificationService = require('../../services/notificationService');
    await NotificationService.createNotification({
      user: feedback.user._id,
      title: 'Feedback Reply',
      message: `Admin replied to your feedback: "${feedback.subject}"`,
      type: 'feedback_reply',
      link: '/dashboard?tab=feedback',
      relatedId: feedback._id,
      relatedModel: 'Feedback'
    });

    res.json({
      success: true,
      message: 'Reply sent successfully. User will be notified.',
      data: feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Update feedback status
// @route   PUT /api/feedback/:id/status
// @access  Private (Admin only)
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: feedback
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
