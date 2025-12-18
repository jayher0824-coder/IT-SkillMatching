const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../auth/middleware/auth');
const Job = require('../../database/models/Job');
const Student = require('../../database/models/Student');
// @desc    Get all job applications (admin view)
// @route   GET /api/applications
// @access  Private (Admin only, or extend for company)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    // Optionally add filters (e.g., by job, company, status, search)
    const jobs = await Job.find({})
      .populate({
        path: 'applications.student',
        select: 'firstName lastName assessmentScore skills education portfolio resume user',
        populate: { path: 'user', select: 'email' }
      })
      .populate('company', 'companyName');

    // Flatten all applications
    let allApplications = [];
    jobs.forEach(job => {
      job.applications.forEach(app => {
        allApplications.push({
          ...app.toObject(),
          job: {
            _id: job._id,
            title: job.title,
            company: job.company?.companyName || '',
          }
        });
      });
    });

    res.json({
      success: true,
      data: allApplications
    });
  } catch (error) {
    console.error('Error fetching all applications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});


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
