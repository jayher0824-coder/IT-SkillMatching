const express = require('express');
const { protect, authorize, requireAssessment } = require('../../auth/middleware/auth');
const Job = require('../../database/models/Job');
const Company = require('../../database/models/Company');
const Student = require('../../database/models/Student');
const NotificationService = require('../../services/notificationService');

const router = express.Router();

// @desc    Get all active jobs
// @route   GET /api/jobs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      search,
      location,
      jobType,
      experienceLevel,
      skills,
      remote,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    let query = { status: 'active' };

    // Build search query
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'skillsRequired.name': { $regex: search, $options: 'i' } },
      ];
    }

    if (location && location !== 'all') {
      if (location === 'remote') {
        query['location.remote'] = true;
      } else {
        query.$or = [
          { 'location.city': { $regex: location, $options: 'i' } },
          { 'location.state': { $regex: location, $options: 'i' } },
          { 'location.remote': true },
        ];
      }
    }

    if (jobType && jobType !== 'all') {
      query.jobType = jobType;
    }

    if (experienceLevel && experienceLevel !== 'all') {
      query.experienceLevel = experienceLevel;
    }

    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      query['skillsRequired.name'] = { $in: skillArray };
    }

    if (remote === 'true') {
      query['location.remote'] = true;
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(query)
      .populate('company', 'companyName logo industry verified')
      .populate('customAssessment')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      count: jobs.length,
      pagination: {
        page: parseInt(page),
        pages,
        total,
        limit: parseInt(limit),
      },
      data: jobs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get job statistics
// @route   GET /api/jobs/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments({ status: 'active' });
    const totalCompanies = await Company.countDocuments({ verified: true });
    const totalApplications = await Job.aggregate([
      { $match: { status: 'active' } },
      { $project: { applicationCount: { $size: '$applications' } } },
      { $group: { _id: null, total: { $sum: '$applicationCount' } } },
    ]);

    const jobsByType = await Job.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
    ]);

    const jobsByExperience = await Job.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$experienceLevel', count: { $sum: 1 } } },
    ]);

    const topSkills = await Job.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$skillsRequired' },
      { $group: { _id: '$skillsRequired.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalJobs,
        totalCompanies,
        totalApplications: totalApplications[0]?.total || 0,
        jobsByType,
        jobsByExperience,
        topSkills,
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

// @desc    Get company's jobs
// @route   GET /api/jobs/company/me
// @access  Private (Companies only)
router.get('/company/me', protect, authorize('company'), async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    const jobs = await Job.find({ company: company._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company')
      .populate('customAssessment');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    console.log(`GET /jobs/:id - Job: ${job.title}`);
    console.log(`  requireCustomAssessment: ${job.requireCustomAssessment} (type: ${typeof job.requireCustomAssessment})`);
    console.log(`  customAssessment: ${job.customAssessment} (type: ${typeof job.customAssessment})`);

    res.json({
      success: true,
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

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Companies only)
router.post('/', protect, authorize('company'), async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found. Please create your company profile first.',
      });
    }

    // Server-side validation: job title must contain at least one letter or number
    const title = req.body.title || '';
    if (!/[A-Za-z0-9]/.test(title)) {
      return res.status(400).json({
        success: false,
        message: 'Job title must contain at least one letter or number.'
      });
    }

    const jobData = {
      ...req.body,
      company: company._id,
    };

    const job = await Job.create(jobData);

    // Add job to company's jobs array
    company.jobs.push(job._id);
    await company.save();

    const populatedJob = await Job.findById(job._id).populate('company');

    // Notify all students about new job posting
    try {
      const students = await Student.find({}).populate('user');
      for (const student of students) {
        if (student.user) {
          await NotificationService.create({
            recipient: student.user._id,
            type: 'job_posted',
            title: 'New Job Posted',
            message: `${company.companyName} posted a new job: ${job.title}`,
            link: `/jobs/${job._id}`,
            data: {
              jobId: job._id,
              jobTitle: job.title,
              companyName: company.companyName
            }
          });
        }
      }
    } catch (notifError) {
      console.error('Error creating job posting notifications:', notifError);
    }

    res.status(201).json({
      success: true,
      data: populatedJob,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Companies only - own jobs)
router.put('/:id', protect, authorize('company'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('company');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if company owns this job
    if (job.company.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job',
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('company');

    res.json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Companies only - own jobs)
router.delete('/:id', protect, authorize('company'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('company');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if company owns this job
    if (job.company.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job',
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    // Remove job from company's jobs array
    const company = await Company.findById(job.company._id);
    company.jobs.pull(req.params.id);
    await company.save();

    res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get company's jobs
// @route   GET /api/jobs/company/me
// @access  Private (Companies only)
router.get('/company/me', protect, authorize('company'), async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    const jobs = await Job.find({ company: company._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get job applications
// @route   GET /api/jobs/:id/applications
// @access  Private (Companies only - own jobs)
router.get('/:id/applications', protect, authorize('company'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company')
      .populate({
        path: 'applications.student',
        select: 'firstName lastName assessmentScore skills education portfolio resume user',
        populate: {
          path: 'user',
          select: 'email',
        },
      });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if company owns this job
    if (job.company.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job',
      });
    }

    // Sort applications by match score and application date
    const sortedApplications = job.applications.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return new Date(b.appliedAt) - new Date(a.appliedAt);
    });

    res.json({
      success: true,
      count: sortedApplications.length,
      data: {
        job: {
          _id: job._id,
          title: job.title,
          company: job.company.companyName,
        },
        applications: sortedApplications,
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

// @desc    Update application status
// @route   PUT /api/jobs/:id/applications/:applicationId
// @access  Private (Companies only - own jobs)
router.put('/:id/applications/:applicationId', protect, authorize('company'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { id: jobId, applicationId } = req.params;

    const job = await Job.findById(jobId).populate('company');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if company owns this job
    if (job.company.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update applications for this job',
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

    // Update application status
    application.status = status;
    if (notes) {
      application.notes = notes;
    }

    await job.save();

    // Also update the status in the student's applications
    const student = await Student.findById(application.student);
    if (student) {
      const studentApplication = student.applications.find(app => 
        app.job.toString() === jobId
      );
      if (studentApplication) {
        studentApplication.status = status;
        await student.save();
      }

      // Notify student about status change
      try {
        const statusMessages = {
          'reviewed': 'is being reviewed',
          'reviewing': 'is being reviewed',
          'shortlisted': 'has been shortlisted!',
          'interviewed': 'has moved to interview stage',
          'accepted': 'has been accepted! Congratulations!',
          'hired': 'has been hired! Congratulations!',
          'rejected': 'was not selected this time'
        };

        if (student.user) {
          console.log(`Creating notification for student ${student.user} - Application status: ${status}`);
          const recipientId = student.user.toString ? student.user.toString() : student.user;
          
          await NotificationService.create({
            recipient: recipientId,
            type: 'application_status',
            title: 'Application Status Update',
            message: `Your application for ${job.title} ${statusMessages[status] || 'has been updated'}`,
            link: `/student/applications`,
            data: {
              jobId: job._id,
              jobTitle: job.title,
              status: status,
              companyName: job.company.companyName
            }
          });
          console.log(`Notification created successfully for student ${recipientId}`);
        }
      } catch (notifError) {
        console.error('Error creating application status notification:', notifError);
        console.error('Student data:', { studentId: student._id, userId: student.user });
      }
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Apply for a job (alternative endpoint)
// @route   POST /api/jobs/:id/apply
// @access  Private (Students only)
router.post('/:id/apply', protect, authorize('student'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const { customAssessmentSubmissionId } = req.body;
    
    console.log('Job application request:', {
      jobId,
      userId: req.user._id,
      userRole: req.user.role,
      customAssessmentSubmissionId
    });
    
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      console.error('Student profile not found for user:', req.user._id);
      return res.status(404).json({
        success: false,
        message: 'Student profile not found. Please complete your profile first.',
      });
    }

    const job = await Job.findById(jobId).populate('company', 'companyName logo user');
    if (!job) {
      console.error('Job not found:', jobId);
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (!job.company) {
      console.error('Job has no company associated:', jobId);
      return res.status(500).json({
        success: false,
        message: 'Job configuration error: No company associated',
      });
    }

    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications',
      });
    }

    // Check if custom assessment is required
    if (job.requireCustomAssessment && !customAssessmentSubmissionId) {
      return res.status(400).json({
        success: false,
        message: 'This job requires a custom assessment to be completed before applying',
      });
    }

    // Check if already applied
    const existingApplication = student.applications.find(app => 
      app.job.toString() === jobId
    );

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Already applied for this job',
      });
    }

    // Calculate match score
    let matchScore = 0;
    const studentSkills = student.skills || [];
    const requiredSkills = job.skillsRequired || [];

    requiredSkills.forEach(reqSkill => {
      const studentSkill = studentSkills.find(s => 
        s.name.toLowerCase() === reqSkill.name.toLowerCase()
      );

      if (studentSkill) {
        const levelScore = {
          'Beginner': 1,
          'Intermediate': 2,
          'Advanced': 3,
          'Expert': 4,
        };

        const reqLevel = levelScore[reqSkill.level] || 1;
        const stuLevel = levelScore[studentSkill.level] || 1;

        if (stuLevel >= reqLevel) {
          matchScore += reqSkill.priority === 'must-have' ? 20 : 10;
        }
      }
    });

    matchScore = Math.min(matchScore, 100);

    // Add to student's applications
    student.applications.push({
      job: jobId,
      appliedAt: new Date(),
      status: 'pending',
      customAssessmentSubmission: customAssessmentSubmissionId || null,
    });

    try {
      await student.save();
    } catch (saveError) {
      console.error('Error saving student:', saveError);
      console.error('Student data:', JSON.stringify(student, null, 2));
      return res.status(500).json({
        success: false,
        message: 'Error saving application to student profile',
        error: saveError.message,
      });
    }

    // Add to job's applications
    job.applications.push({
      student: student._id,
      appliedAt: new Date(),
      status: 'pending',
      matchScore,
      customAssessmentSubmission: customAssessmentSubmissionId || null,
    });

    await job.save();

    console.log('Application submitted successfully:', {
      jobId,
      studentId: student._id,
      matchScore
    });

    // Create notifications (non-blocking)
    setImmediate(async () => {
      try {
        // Notify student
        await NotificationService.create({
          recipient: req.user._id,
          type: 'application_submitted',
          title: 'Application Submitted',
          message: `Your application for ${job.title} has been submitted successfully.`,
          link: `/student/applications`,
          data: {
            jobId: job._id,
            jobTitle: job.title,
            matchScore
          }
        });

        // Notify company
        if (job.company && job.company.user) {
          await NotificationService.create({
            recipient: job.company.user,
            type: 'new_application',
            title: 'New Job Application',
            message: `${student.firstName} ${student.lastName} applied for ${job.title}`,
            link: `/company/jobs/${job._id}/applications`,
            data: {
              studentId: student._id,
              jobId: job._id,
              jobTitle: job.title,
              matchScore
            }
          });
        }
      } catch (notifError) {
        console.error('Error creating application notifications:', notifError);
      }
    });

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        jobTitle: job.title,
        company: {
          companyName: job.company.companyName,
          logo: job.company.logo
        },
        appliedAt: new Date(),
        matchScore,
      },
    });
  } catch (error) {
    console.error('Error in job application:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
});

module.exports = router;
