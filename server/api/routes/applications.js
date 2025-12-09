const express = require('express');
const router = express.Router();
const { protect } = require('../../auth/middleware/auth');
const Job = require('../../database/models/Job');
const Student = require('../../database/models/Student');

// @desc    Withdraw job application
// @route   POST /api/applications/:applicationId/withdraw
// @access  Private (Student)
router.post('/:applicationId/withdraw', protect, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const currentUser = req.user;

    // Find the job with this application
    const job = await Job.findOne({ 'applications._id': applicationId })
      .populate('applications.student');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Find the application
    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Verify the application belongs to the current user
    if (application.student._id.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to withdraw this application',
      });
    }

    // Only allow withdrawal if application is pending
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only withdraw pending applications',
      });
    }

    // Remove the application from the job
    job.applications.pull(applicationId);
    await job.save();

    // Also remove from student's applications
    const student = await Student.findOne({ user: currentUser._id });
    if (student) {
      student.applications = student.applications.filter(app => 
        app._id.toString() !== applicationId
      );
      await student.save();
    }

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: job
    });

  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
});

module.exports = router;
