const express = require('express');
const { protect, authorize } = require('../../auth/middleware/auth');
const User = require('../../database/models/User');
const Student = require('../../database/models/Student');
const Company = require('../../database/models/Company');
const Job = require('../../database/models/Job');
const { AssessmentResult } = require('../../database/models/Assessment');
const Feedback = require('../../database/models/Feedback');
const EmailReport = require('../../database/models/EmailReport');
const NotificationService = require('../../services/notificationService');

const router = express.Router();

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalCompanies,
      totalJobs,
      totalApplications,
      pendingRetakeRequests,
      pendingFeedback,
      recentEmailReports
    ] = await Promise.all([
      User.countDocuments(),
      Student.countDocuments(),
      Company.countDocuments(),
      Job.countDocuments(),
      Student.aggregate([
        { $unwind: '$applications' },
        { $count: 'total' }
      ]),
      Student.aggregate([
        { $unwind: '$retakeRequests' },
        { $match: { 'retakeRequests.status': 'pending' } },
        { $count: 'total' }
      ]),
      Feedback.countDocuments({ status: 'open' }),
      EmailReport.find().sort({ createdAt: -1 }).limit(5)
        .populate('recipient', 'email role')
        .populate('sender', 'email role')
    ]);

    const stats = {
      users: {
        total: totalUsers,
        students: totalStudents,
        companies: totalCompanies,
      },
      jobs: {
        total: totalJobs,
        applications: totalApplications[0]?.total || 0,
      },
      pending: {
        retakeRequests: pendingRetakeRequests[0]?.total || 0,
        feedback: pendingFeedback,
      },
      recentEmails: recentEmailReports,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get all retake requests
// @route   GET /api/admin/retake-requests
// @access  Private (Admin only)
router.get('/retake-requests', protect, authorize('admin'), async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    
    const students = await Student.aggregate([
      { $unwind: '$retakeRequests' },
      { $match: status !== 'all' ? { 'retakeRequests.status': status } : {} },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: '$retakeRequests._id',
          assessmentId: '$retakeRequests.assessmentId',
          reason: '$retakeRequests.reason',
          requestDate: '$retakeRequests.requestDate',
          status: '$retakeRequests.status',
          reviewedBy: '$retakeRequests.reviewedBy',
          reviewedAt: '$retakeRequests.reviewedAt',
          adminNotes: '$retakeRequests.adminNotes',
          student: {
            _id: '$_id',
            name: { $concat: ['$firstName', ' ', '$lastName'] },
            email: '$userInfo.email',
          }
        }
      },
      { $sort: { requestDate: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    const totalCount = await Student.aggregate([
      { $unwind: '$retakeRequests' },
      { $match: status !== 'all' ? { 'retakeRequests.status': status } : {} },
      { $count: 'total' }
    ]);

    res.json({
      success: true,
      count: students.length,
      total: totalCount[0]?.total || 0,
      data: students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((totalCount[0]?.total || 0) / parseInt(limit)),
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Review retake request
// @route   PUT /api/admin/retake-requests/:studentId/:requestId
// @access  Private (Admin only)
router.put('/retake-requests/:studentId/:requestId', protect, authorize('admin'), async (req, res) => {
  try {
    const { studentId, requestId } = req.params;
    const { status, adminNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected',
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const requestIndex = student.retakeRequests.findIndex(
      req => req._id.toString() === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Retake request not found',
      });
    }

    student.retakeRequests[requestIndex].status = status;
    student.retakeRequests[requestIndex].reviewedBy = req.user._id;
    student.retakeRequests[requestIndex].reviewedAt = new Date();
    student.retakeRequests[requestIndex].adminNotes = adminNotes;

    // If approved, reset assessment status for the student
    if (status === 'approved') {
      student.assessmentCompleted = false;
      student.assessmentScore = {
        overall: 0,
        categories: {}
      };
      student.skills = [];
    }

    await student.save();

    res.json({
      success: true,
      message: `Retake request ${status} successfully`,
      data: student.retakeRequests[requestIndex],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get all feedback
// @route   GET /api/admin/feedback
// @access  Private (Admin only)
router.get('/feedback', protect, authorize('admin'), async (req, res) => {
  try {
    const { status = 'open', category, priority, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status !== 'all') query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const feedback = await Feedback.find(query)
      .populate('user', 'email role')
      .populate('respondedBy', 'email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalCount = await Feedback.countDocuments(query);

    res.json({
      success: true,
      count: feedback.length,
      total: totalCount,
      data: feedback,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Respond to feedback
// @route   PUT /api/admin/feedback/:id/respond
// @access  Private (Admin only)
router.put('/feedback/:id/respond', protect, authorize('admin'), async (req, res) => {
  try {
    const { adminResponse, status } = req.body;

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    feedback.adminResponse = adminResponse;
    feedback.status = status || 'in_progress';
    feedback.respondedBy = req.user._id;
    feedback.respondedAt = new Date();

    await feedback.save();

    const updatedFeedback = await Feedback.findById(req.params.id)
      .populate('user', 'email role')
      .populate('respondedBy', 'email');

    res.json({
      success: true,
      message: 'Feedback response saved successfully',
      data: updatedFeedback,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get email reports
// @route   GET /api/admin/email-reports
// @access  Private (Admin only)
router.get('/email-reports', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, emailType, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (emailType) query.emailType = emailType;

    const emailReports = await EmailReport.find(query)
      .populate('recipient', 'email role')
      .populate('sender', 'email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalCount = await EmailReport.countDocuments(query);

    res.json({
      success: true,
      count: emailReports.length,
      total: totalCount,
      data: emailReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20, search } = req.query;
    
    const query = {};
    if (role && role !== 'all') query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalCount = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total: totalCount,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Reset user password by admin
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private (Admin only)
router.put('/users/:id/reset-password', protect, authorize('admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from changing their own password this way
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reset your own password. Use the change password feature instead.',
      });
    }

    // Update password (will be hashed by pre-save hook)
    // This allows Google OAuth users to also have a password for email/password login
    user.password = newPassword;
    
    // Mark any pending password change requests as approved
    if (user.passwordChangeRequests && user.passwordChangeRequests.length > 0) {
      user.passwordChangeRequests.forEach(request => {
        if (request.status === 'pending') {
          request.status = 'approved';
          request.approvedBy = req.user._id;
          request.approvedAt = new Date();
        }
      });
    }
    
    await user.save();

    // Send notification to user
    try {
      await NotificationService.notifyPasswordResetApproved(user._id, newPassword);
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
      // Don't fail the password reset if notification fails
    }

    const message = user.googleId 
      ? 'Password set successfully. User can now login with both Google and email/password.'
      : 'Password reset successfully';

    res.json({
      success: true,
      message: message,
      data: {
        userId: user._id,
        email: user.email,
        hasGoogleAuth: !!user.googleId,
        canLoginWithPassword: true,
        newPassword: newPassword, // Include password so admin can copy and send it to user
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
router.put('/users/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own account status',
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get all jobs for admin
// @route   GET /api/admin/jobs
// @access  Private (Admin only)
router.get('/jobs', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status && status !== 'all') query.status = status;

    const jobs = await Job.find(query)
      .populate('company', 'companyName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalCount = await Job.countDocuments(query);

    res.json({
      success: true,
      count: jobs.length,
      total: totalCount,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Update job status
// @route   PUT /api/admin/jobs/:id/status
// @access  Private (Admin only)
router.put('/jobs/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, or pending',
      });
    }

    const job = await Job.findById(req.params.id).populate('company', 'companyName');
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    job.status = status;
    job.reviewedBy = req.user._id;
    job.reviewedAt = new Date();
    
    await job.save();

    res.json({
      success: true,
      message: `Job ${status} successfully`,
      data: job,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get user details including account info
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
router.get('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get additional user details based on role
    let additionalInfo = {};
    if (user.role === 'student') {
      const student = await Student.findOne({ user: user._id });
      additionalInfo = student ? { studentInfo: student } : {};
    } else if (user.role === 'company') {
      const company = await Company.findOne({ user: user._id });
      additionalInfo = company ? { companyInfo: company } : {};
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        ...additionalInfo,
        hasPassword: !!user.password,
        isGoogleAuth: !!user.googleId,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get all password change requests
// @route   GET /api/admin/password-change-requests
// @access  Private (Admin only)
router.get('/password-change-requests', protect, authorize('admin'), async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    
    const matchQuery = status !== 'all' ? { 'passwordChangeRequests.status': status } : {};
    matchQuery.passwordChangeRequests = { $exists: true, $ne: [] };

    const users = await User.aggregate([
      { $unwind: '$passwordChangeRequests' },
      { $match: status !== 'all' ? { 'passwordChangeRequests.status': status } : {} },
      {
        $project: {
          email: 1,
          role: 1,
          requestId: '$passwordChangeRequests._id',
          reason: '$passwordChangeRequests.reason',
          phoneNumber: '$passwordChangeRequests.phoneNumber',
          status: '$passwordChangeRequests.status',
          requestDate: '$passwordChangeRequests.requestDate',
          reviewedBy: '$passwordChangeRequests.reviewedBy',
          reviewedAt: '$passwordChangeRequests.reviewedAt',
          adminNotes: '$passwordChangeRequests.adminNotes',
        }
      },
      { $sort: { requestDate: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    const totalCount = await User.aggregate([
      { $unwind: '$passwordChangeRequests' },
      { $match: status !== 'all' ? { 'passwordChangeRequests.status': status } : {} },
      { $count: 'total' }
    ]);

    res.json({
      success: true,
      count: users.length,
      total: totalCount[0]?.total || 0,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((totalCount[0]?.total || 0) / parseInt(limit)),
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Review password change request
// @route   PUT /api/admin/password-change-requests/:userId/:requestId
// @access  Private (Admin only)
router.put('/password-change-requests/:userId/:requestId', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected',
      });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const request = user.passwordChangeRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Password change request not found',
      });
    }

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.adminNotes = adminNotes;

    await user.save();

    res.json({
      success: true,
      message: `Password change request ${status}`,
      data: request,
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
