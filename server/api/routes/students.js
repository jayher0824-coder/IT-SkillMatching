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
const Company = require('../../database/models/Company');
const { AssessmentResult } = require('../../database/models/Assessment');
const CustomAssessmentSubmission = require('../../database/models/CustomAssessmentSubmission');
const NotificationService = require('../../services/notificationService');

const router = express.Router();
const ALLOWED_GAMIFICATION_BADGES = new Set([
  'Level 1 Achieved!',
  'Level 2 Achieved!',
  'Level 3 Achieved!',
  '10 Questions Completed',
  '50 Questions Completed',
]);

async function getOrCreateStudentProfile(userId) {
  const profiles = await Student.find({ user: userId }).sort({ updatedAt: -1, createdAt: -1 });
  if (profiles.length > 0) {
    const primary = profiles[0];

    if (!primary.gamification) {
      const maxPoints = profiles.reduce((max, profile) => {
        const points = Number(profile.gamification?.points || 0);
        return points > max ? points : max;
      }, 0);
      primary.gamification = {
        points: maxPoints,
        level: Math.max(1, Math.floor(maxPoints / 100) + 1),
        badges: primary.gamification?.badges || []
      };
      await primary.save();
    }

    return primary;
  }

  const user = await User.findById(userId).select('email');
  const localPart = user?.email ? user.email.split('@')[0] : 'student';
  const sanitized = String(localPart || 'student').replace(/[^a-zA-Z0-9._-]/g, '');
  const firstName = sanitized.split(/[._-]/)[0] || 'Student';

  student = await Student.create({
    user: userId,
    studentId: `STU${Date.now()}${Math.floor(Math.random() * 1000)}`,
    firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
    lastName: 'Student',
    dateOfBirth: new Date('2000-01-01'),
    phone: '0000000000',
  });

  return student;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
const dest = path.join(__dirname, '..', '..', '..', 'client', 'assets', 'uploads', 'resumes');
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
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/x-png' ||
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, and DOC files are allowed.'), false);
    }
  },
});

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Private (Students only)
router.get('/profile', protect, authorize('student'), async (req, res) => {
  try {
    let student = await Student.findOne({ user: req.user._id })
      .sort({ updatedAt: -1, createdAt: -1 })
      .populate('user', 'email');
    
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

    let student = await Student.findOne({ user: req.user._id }).sort({ updatedAt: -1, createdAt: -1 });

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
const dest = path.join(__dirname, '..', '..', '..', 'client', 'assets', 'uploads', 'avatars');
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
  limits: { fileSize: 10 * 1024 * 1024 }, //10MB
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
    
    const student = await getOrCreateStudentProfile(req.user._id);
    
    // Read file and convert to Base64
    const fs = require('fs');
    const fileData = fs.readFileSync(req.file.path);
    const base64Data = fileData.toString('base64');
    const mimeType = req.file.mimetype;
    
    // Store as data URL for direct use in img src
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    
    student.avatar = {
      filename: req.file.originalname,
      data: dataUrl,
      mimeType: mimeType,
      uploadedAt: new Date(),
    };
    
    await student.save();
    
    // Delete the temporary file from disk after saving to DB
    fs.unlinkSync(req.file.path);
    
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

    const student = await getOrCreateStudentProfile(req.user._id);

    const fileBuffer = fs.readFileSync(req.file.path);

    student.resume = {
      filename: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      data: fileBuffer.toString('base64'),
      uploadedAt: new Date(),
    };

    await student.save();

    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Unable to cleanup uploaded resume temp file:', cleanupError.message);
    }

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

// @desc    Stream logged-in student's resume
// @route   GET /api/students/resume
// @access  Private (Students only)
router.get('/resume', protect, authorize('student'), async (req, res) => {
  try {
    const student = await getOrCreateStudentProfile(req.user._id);
    const resume = student.resume || {};

    if (resume.data) {
      const mimeType = resume.mimeType || 'application/pdf';
      const safeName = String(resume.filename || 'resume').replace(/[\r\n"]/g, '');

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
      return res.send(Buffer.from(resume.data, 'base64'));
    }

    const fileCandidates = [];
    if (resume.path) fileCandidates.push(path.resolve(resume.path));

    const normalizedFileName = String(resume.path || resume.filename || '').split(/[/\\]/).pop();
    if (normalizedFileName) {
      fileCandidates.push(path.join(__dirname, '..', '..', 'assets', 'uploads', 'resumes', normalizedFileName));
      fileCandidates.push(path.join(__dirname, '..', '..', '..', 'client', 'assets', 'uploads', 'resumes', normalizedFileName));
    }

    const existingPath = fileCandidates.find(candidate => candidate && fs.existsSync(candidate));
    if (!existingPath) {
      return res.status(404).json({ success: false, message: 'Resume file not found' });
    }

    return res.sendFile(existingPath);
  } catch (error) {
    console.error('Error streaming resume:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
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

    // Calculate match scores with enhanced algorithm
    const jobMatches = jobs.map(job => {
      let matchScore = 0;
      let totalPossible = 0;
      const matchedSkills = [];
      const missingSkills = [];

      // Enhanced Skill matching (70% weight) - Increased importance
      const skillWeight = 0.7;
      const studentSkills = student.skills || [];
      const requiredSkills = job.skillsRequired || [];
      const assessmentBreakdown = student.assessmentScore?.breakdown || {};

      // Map skill categories to common programming languages and technologies
      const skillCategoryMapping = {
        'programming': ['javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'typescript', 'php'],
        'webDevelopment': ['html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'laravel', 'frontend', 'backend', 'fullstack'],
        'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'database', 'nosql'],
        'networking': ['network', 'tcp/ip', 'security', 'firewall', 'vpn', 'routing'],
        'problemSolving': ['algorithm', 'data structure', 'optimization', 'debugging'],
        'troubleshooting': ['troubleshoot', 'troubleshooting', 'incident', 'diagnostic', 'root cause', 'support'],
        'cloudComputing': ['aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes'],
        'devOps': ['ci/cd', 'jenkins', 'gitlab', 'github actions', 'terraform', 'ansible'],
        'mobile': ['android', 'ios', 'react native', 'flutter', 'mobile'],
        // Individual programming languages
        'python': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
        'java': ['java', 'spring', 'hibernate', 'maven', 'gradle'],
        'javascript': ['javascript', 'js', 'node', 'nodejs', 'node.js'],
        'csharp': ['c#', 'csharp', '.net', 'dotnet', 'asp.net', 'blazor'],
        'php': ['php', 'laravel', 'symfony', 'wordpress', 'codeigniter'],
        'swift': ['swift', 'ios', 'swiftui', 'cocoa'],
        'go': ['go', 'golang', 'gin', 'echo'],
        'ruby': ['ruby', 'rails', 'ruby on rails', 'sinatra'],
        'sql': ['sql', 'mysql', 'postgresql', 'mssql', 'oracle', 'sqlite'],
        'cpp': ['c++', 'cpp', 'qt', 'boost'],
        'rust': ['rust', 'cargo', 'tokio'],
        'kotlin': ['kotlin', 'android', 'spring boot'],
        'c': ['c', 'embedded', 'linux'],
        'typescript': ['typescript', 'ts', 'angular', 'nest.js'],
        'r': ['r', 'rstudio', 'shiny', 'ggplot'],
        'perl': ['perl', 'cgi', 'catalyst'],
        'html': ['html', 'html5', 'markup'],
        'objectivec': ['objective-c', 'objective c', 'cocoa', 'ios'],
        'visualbasic': ['vb', 'visual basic', 'vb.net', 'vba'],
        'assembly': ['assembly', 'asm', 'x86', 'arm'],
        'css': ['css', 'css3', 'sass', 'scss', 'less', 'tailwind'],
        'matlab': ['matlab', 'simulink', 'octave'],
        'scala': ['scala', 'akka', 'play framework'],
      };

      requiredSkills.forEach(reqSkill => {
        const reqSkillLower = reqSkill.name.toLowerCase();
        const studentSkill = studentSkills.find(s => 
          s.name.toLowerCase() === reqSkillLower
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

          // Base score for skill match
          let skillScore = 0;
          
          if (stuLevel >= reqLevel) {
            // Perfect match or exceeds requirement
            skillScore = reqSkill.priority === 'must-have' ? 25 : 15;
            
            // BONUS: Check if student has high assessment score in related category
            for (const [category, keywords] of Object.entries(skillCategoryMapping)) {
              if (keywords.some(keyword => reqSkillLower.includes(keyword))) {
                const categoryScore = assessmentBreakdown[category] || 0;
                if (categoryScore >= 80) {
                  skillScore += 10; // Expert bonus
                } else if (categoryScore >= 70) {
                  skillScore += 7; // Advanced bonus
                } else if (categoryScore >= 60) {
                  skillScore += 5; // Proficient bonus
                }
                break;
              }
            }
          } else {
            // Partial match
            skillScore = Math.min(stuLevel / reqLevel, 1) * (reqSkill.priority === 'must-have' ? 12 : 7);
          }

          matchScore += skillScore;
          matchedSkills.push({
            name: reqSkill.name,
            studentLevel: studentSkill.level,
            requiredLevel: reqSkill.level,
            score: Math.round(skillScore)
          });
        } else {
          // Check if student has strong assessment score in related category
          let foundRelatedStrength = false;
          for (const [category, keywords] of Object.entries(skillCategoryMapping)) {
            if (keywords.some(keyword => reqSkillLower.includes(keyword))) {
              const categoryScore = assessmentBreakdown[category] || 0;
              if (categoryScore >= 75) {
                // Student has strong assessment in this category even without explicit skill
                matchScore += reqSkill.priority === 'must-have' ? 8 : 5;
                foundRelatedStrength = true;
                matchedSkills.push({
                  name: reqSkill.name,
                  studentLevel: 'Assessment Verified',
                  requiredLevel: reqSkill.level,
                  score: reqSkill.priority === 'must-have' ? 8 : 5,
                  assessmentBased: true
                });
              }
              break;
            }
          }
          
          if (!foundRelatedStrength) {
            missingSkills.push(reqSkill.name);
          }
        }

        totalPossible += reqSkill.priority === 'must-have' ? 25 : 15;
      });

      // Location matching (15% weight)
      const locationWeight = 0.15;
      const studentPrefs = student.preferences || {};
      const jobLocation = job.location || {};

      if (jobLocation.remote || studentPrefs.remote) {
        matchScore += 15 * locationWeight;
      } else if (studentPrefs.locations && studentPrefs.locations.includes(jobLocation.city)) {
        matchScore += 15 * locationWeight;
      }

      totalPossible += 15 * locationWeight;

      // Job type matching (15% weight)
      if (studentPrefs.jobTypes && studentPrefs.jobTypes.includes(job.jobType)) {
        matchScore += 15 * locationWeight;
      }

      totalPossible += 15 * locationWeight;

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
        matchedSkills,
        missingSkills,
        assessmentInfluenced: matchedSkills.some(s => s.assessmentBased)
      };
    });

    // Enhanced sorting: prioritize jobs matching student's strongest assessment categories
    const sortedMatches = jobMatches
      .filter(match => match.matchScore >= 20)
      .sort((a, b) => {
        // First, sort by match score
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        // If scores are equal, prioritize jobs influenced by assessment
        if (a.assessmentInfluenced !== b.assessmentInfluenced) {
          return a.assessmentInfluenced ? -1 : 1;
        }
        // Finally, sort by number of matched skills
        return b.matchedSkills.length - a.matchedSkills.length;
      })
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
    const student = await getOrCreateStudentProfile(req.user._id);

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if already applied
    const existingApplication = (student.applications || []).find(app =>
      app?.job && app.job.toString() === jobId
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

    // Create notifications for both student and company
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
      const company = await Company.findById(job.company);
      if (company && company.user) {
        await NotificationService.create({
          recipient: company.user,
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
    const primaryStudent = await getOrCreateStudentProfile(req.user._id);

    const student = await Student.findById(primaryStudent._id)
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

    const validApplications = (student.applications || [])
      .filter(app => app && app.job)
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    res.json({
      success: true,
      count: validApplications.length,
      data: validApplications,
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

// @desc    Update gamification stats (points, levels, badges)
// @route   PUT /api/students/gamification
// @access  Private (Students only)
router.put('/gamification', protect, authorize('student'), async (req, res) => {
  try {
    const { points, badge, setAbsolute } = req.body;
    
    const student = await getOrCreateStudentProfile(req.user._id);

    // Ensure gamification field is initialized
    if (!student.gamification) {
      student.gamification = {
        points: 0,
        level: 1,
        badges: []
      };
    }

    const numericPoints = Number(points);
    if (Number.isFinite(numericPoints)) {
      if (setAbsolute === true) {
        student.gamification.points = Math.max(0, Math.floor(numericPoints));
      } else if (numericPoints > 0) {
        student.gamification.points += Math.floor(numericPoints);
      }

      const derivedLevel = Math.max(1, Math.floor(student.gamification.points / 100) + 1);
      student.gamification.level = derivedLevel;

      for (let level = 2; level <= Math.min(derivedLevel, 3); level++) {
        const levelBadge = `Level ${level} Achieved!`;
        if (!student.gamification.badges.includes(levelBadge)) {
          student.gamification.badges.push(levelBadge);
        }
      }
    }
    
    if (badge && ALLOWED_GAMIFICATION_BADGES.has(badge) && !student.gamification.badges.includes(badge)) {
      student.gamification.badges.push(badge);
    }

    console.log('Gamification stats before save:', student.gamification);
    
    await student.save();
    
    res.json({
      success: true,
      message: 'Gamification stats updated',
      data: student.gamification,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get gamification stats
// @route   GET /api/students/gamification
// @access  Private (Students only)
router.get('/gamification', protect, authorize('student'), async (req, res) => {
  try {
    const student = await getOrCreateStudentProfile(req.user._id);

    if (!student.gamification) {
      student.gamification = { points: 0, level: 1, badges: [] };
      await student.save();
    }
    
    res.json({
      success: true,
      data: student.gamification,
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
