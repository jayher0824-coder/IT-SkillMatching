const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Ensure upload directories exist
const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
const { protect, authorize, requireAssessment } = require('../../auth/middleware/auth');
const Student = require('../../database/models/Student');
const Job = require('../../database/models/Job');
const User = require('../../database/models/User');
const { AssessmentResult } = require('../../database/models/Assessment');
const CustomAssessmentSubmission = require('../../database/models/CustomAssessmentSubmission');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
const dest = 'uploads/resumes/';
    ensureDir(dest);
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOC files are allowed.'), false);
    }
  },
});

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Private (Students only)
router.get('/profile', protect, authorize('student'), async (req, res) => {
  try {
    let student = await Student.findOne({ user: req.user._id }).populate('user', 'email');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Create/Update student profile
// @route   PUT /api/students/profile
// @access  Private (Students only)
router.put('/profile', protect, authorize('student'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      phone,
      address,
      education,
      portfolio,
      preferences,
    } = req.body;

    console.log('Profile update request:', {
      userId: req.user._id,
      firstName,
      lastName,
      phone
    });

    let student = await Student.findOne({ user: req.user._id });

    if (student) {
      // Update existing profile
      console.log('Updating existing profile:', student._id);
      student.firstName = firstName || student.firstName;
      student.lastName = lastName || student.lastName;
      student.dateOfBirth = dateOfBirth || student.dateOfBirth;
      student.phone = phone || student.phone;
      student.address = { ...student.address, ...address };
      student.education = { ...student.education, ...education };
      student.portfolio = { ...student.portfolio, ...portfolio };
      
      // Handle preferences properly to avoid undefined salaryRange
      if (preferences) {
        student.preferences = {
          ...student.preferences,
          ...preferences,
          salaryRange: preferences.salaryRange || { min: null, max: null }
        };
      }

      await student.save();
      console.log('Profile updated successfully');
    } else {
      // Create new profile
      console.log('Creating new profile');
      // Generate unique student ID
      const studentId = `STU${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      student = await Student.create({
        user: req.user._id,
        studentId,
        firstName,
        lastName,
        dateOfBirth,
        phone,
        address,
        education,
        portfolio,
        preferences: {
          ...preferences,
          salaryRange: preferences?.salaryRange || { min: null, max: null }
        },
      });
      console.log('Profile created successfully:', student._id);
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      errors: error.errors
    });
    
    // Send more specific error message
    let errorMessage = 'Server error';
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      errorMessage = messages.join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
const dest = 'uploads/avatars/';
    ensureDir(dest);
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, //2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  },
});

// @desc    Upload avatar
// @route   POST /api/students/upload-avatar
// @access  Private (Students only)
router.post('/upload-avatar', protect, authorize('student'), uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    let student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    student.avatar = {
      filename: req.file.originalname,
      path: req.file.path,
      uploadedAt: new Date(),
    };
    await student.save();
    res.json({ success: true, message: 'Avatar uploaded', data: student.avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Upload resume
// @route   POST /api/students/upload-resume
// @access  Private (Students only)
router.post('/upload-resume', protect, authorize('student'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    let student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    student.resume = {
      filename: req.file.originalname,
      path: req.file.path,
      uploadedAt: new Date(),
    };

    await student.save();

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        filename: req.file.originalname,
        uploadedAt: student.resume.uploadedAt,
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

// @desc    Get job matches for student
// @route   GET /api/students/job-matches
// @access  Private (Students only)
router.get('/job-matches', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    // Get all active jobs
    const jobs = await Job.find({ status: 'active' })
      .populate('company', 'companyName logo industry')
      .sort({ createdAt: -1 });

    // Calculate match scores
    const jobMatches = jobs.map(job => {
      let matchScore = 0;
      let totalPossible = 0;

      // Skill matching (60% weight)
      const skillWeight = 0.6;
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
          } else {
            matchScore += Math.min(stuLevel / reqLevel, 1) * (reqSkill.priority === 'must-have' ? 10 : 5);
          }
        }

        totalPossible += reqSkill.priority === 'must-have' ? 20 : 10;
      });

      // Location matching (20% weight)
      const locationWeight = 0.2;
      const studentPrefs = student.preferences || {};
      const jobLocation = job.location || {};

      if (jobLocation.remote || studentPrefs.remote) {
        matchScore += 20 * locationWeight;
      } else if (studentPrefs.locations && studentPrefs.locations.includes(jobLocation.city)) {
        matchScore += 20 * locationWeight;
      }

      totalPossible += 20 * locationWeight;

      // Job type matching (20% weight)
      if (studentPrefs.jobTypes && studentPrefs.jobTypes.includes(job.jobType)) {
        matchScore += 20 * locationWeight;
      }

      totalPossible += 20 * locationWeight;

      const finalScore = totalPossible > 0 ? Math.round((matchScore / totalPossible) * 100) : 0;

      return {
        job,
        matchScore: Math.min(finalScore, 100),
        matchDetails: {
          skillMatch: requiredSkills.length > 0 ? 
            Math.round((matchScore * skillWeight / (totalPossible * skillWeight)) * 100) : 0,
          locationMatch: jobLocation.remote || 
            (studentPrefs.locations && studentPrefs.locations.includes(jobLocation.city)) ? 100 : 0,
          jobTypeMatch: studentPrefs.jobTypes && studentPrefs.jobTypes.includes(job.jobType) ? 100 : 0,
        },
      };
    });

    // Sort by match score and filter out very low matches
    const sortedMatches = jobMatches
      .filter(match => match.matchScore >= 20)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20); // Top 20 matches

    res.json({
      success: true,
      count: sortedMatches.length,
      data: sortedMatches,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Apply for a job
// @route   POST /api/students/apply/:jobId
// @access  Private (Students only)
router.post('/apply/:jobId', protect, authorize('student'), async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
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

    // Calculate match score for this specific job
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

    console.log('Application match score calculated:', {
      studentId: student._id,
      jobId,
      matchScore,
      studentSkills: studentSkills.length,
      requiredSkills: requiredSkills.length,
      assessmentScore: student.assessmentScore?.overall || 0
    });

    // Add to student's applications
    student.applications.push({
      job: jobId,
      appliedAt: new Date(),
      status: 'pending',
    });

    await student.save();

    // Add to job's applications
    job.applications.push({
      student: student._id,
      appliedAt: new Date(),
      status: 'pending',
      matchScore,
      overallAssessmentScore: student.assessmentScore?.overall || 0,
    });

    await job.save();

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        jobTitle: job.title,
        company: job.company,
        appliedAt: new Date(),
        matchScore,
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

// @desc    Get student's applications
// @route   GET /api/students/applications
// @access  Private (Students only)
router.get('/applications', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate({
        path: 'applications.job',
        populate: {
          path: 'company',
          select: 'companyName logo',
        },
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    res.json({
      success: true,
      count: student.applications.length,
      data: student.applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get all students (for companies)
// @route   GET /api/students
// @access  Private (Companies only)
router.get('/', protect, authorize('company'), async (req, res) => {
  try {
    const { skills, experience, location, search } = req.query;
    
    let query = {};
    
    // Build search query
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { 'skills.name': { $regex: search, $options: 'i' } },
        { 'education.fieldOfStudy': { $regex: search, $options: 'i' } },
      ];
    }

    if (skills) {
      const skillArray = skills.split(',');
      query['skills.name'] = { $in: skillArray };
    }

    if (location) {
      query.$or = [
        { 'address.city': { $regex: location, $options: 'i' } },
        { 'preferences.locations': { $regex: location, $options: 'i' } },
        { 'preferences.remote': true },
      ];
    }

    const students = await Student.find(query)
      .populate('user', 'email')
      .select('-applications')
      .sort({ 'assessmentScore.overall': -1, updatedAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get student by ID (for companies)
// @route   GET /api/students/:id
// @access  Private (Companies only)
router.get('/:id', protect, authorize('company'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'email')
      .select('-applications');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Update theme preference
// @route   PUT /api/students/theme
// @access  Private (Students only)
router.put('/theme', protect, authorize('student'), async (req, res) => {
  try {
    const { themePreference } = req.body;

    if (!['light', 'dark'].includes(themePreference)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme preference. Must be "light" or "dark"',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { themePreference },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Theme preference updated successfully',
      data: {
        themePreference: user.themePreference,
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

// @desc    Delete student account
// @route   DELETE /api/students/account
// @access  Private (Students only)
router.delete('/account', protect, authorize('student'), async (req, res) => {
  try {
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation is required',
      });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(confirmPassword, req.user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Find student profile
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    // Delete resume file if it exists
    if (student.resume && student.resume.path) {
      try {
        if (fs.existsSync(student.resume.path)) {
          fs.unlinkSync(student.resume.path);
        }
      } catch (fileError) {
        console.error('Error deleting resume file:', fileError);
      }
    }

    // Remove student from job applications
    await Job.updateMany(
      { 'applications.student': student._id },
      { $pull: { applications: { student: student._id } } }
    );

    // Delete assessment results
    await AssessmentResult.deleteMany({ student: student._id });

    // Delete custom assessment submissions
    await CustomAssessmentSubmission.deleteMany({ student: req.user._id });

    // Delete student profile
    await Student.findByIdAndDelete(student._id);

    // Delete user account
    await User.findByIdAndDelete(req.user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Request assessment retake
// @route   POST /api/students/retake-request
// @access  Private (Students only)
router.post('/retake-request', protect, authorize('student'), async (req, res) => {
  try {
    const { assessmentId, reason } = req.body;

    if (!assessmentId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID and reason are required',
      });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reason must be at least 10 characters long',
      });
    }

    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    // Check if student has completed the assessment
    if (!student.assessmentCompleted) {
      return res.status(400).json({
        success: false,
        message: 'You must complete an assessment before requesting a retake',
      });
    }

    // Check for existing pending request
    const existingRequest = student.retakeRequests.find(
      req => req.assessmentId === assessmentId && req.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending retake request for this assessment',
      });
    }

    // Add retake request
    student.retakeRequests.push({
      assessmentId,
      reason: reason.trim(),
      requestDate: new Date(),
      status: 'pending'
    });

    await student.save();

    res.json({
      success: true,
      message: 'Retake request submitted successfully',
      data: {
        assessmentId,
        reason: reason.trim(),
        requestDate: new Date(),
        status: 'pending'
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

// @desc    Get retake requests for student
// @route   GET /api/students/retake-requests
// @access  Private (Students only)
router.get('/retake-requests', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    // Sort requests by most recent first
    const requests = (student.retakeRequests || [])
      .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

    res.json({
      success: true,
      count: requests.length,
      data: requests,
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
