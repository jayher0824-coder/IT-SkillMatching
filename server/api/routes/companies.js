const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../../auth/middleware/auth');
const Company = require('../../database/models/Company');
const Student = require('../../database/models/Student');
const CompanyAnnouncement = require('../../database/models/CompanyAnnouncement');
const NotificationService = require('../../services/notificationService');

const router = express.Router();

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const announcementStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const dest = path.join(__dirname, '..', '..', '..', 'client', 'public', 'assets', 'uploads', 'company-posts');
    ensureDir(dest);
    cb(null, dest);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `announcement-${uniqueSuffix}${path.extname(file.originalname || '')}`);
  },
});

const announcementUpload = multer({
  storage: announcementStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image uploads are allowed for announcements'));
  },
});

const profileStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const dest = path.join(__dirname, '..', '..', '..', 'client', 'public', 'assets', 'uploads', 'company-profiles');
    ensureDir(dest);
    cb(null, dest);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `company-profile-${uniqueSuffix}${path.extname(file.originalname || '')}`);
  },
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image uploads are allowed for company profile media'));
  },
});

// @desc    Create company announcement
// @route   POST /api/companies/announcements
// @access  Private (Companies only)
router.post('/announcements', protect, authorize('company'), announcementUpload.single('image'), async (req, res) => {
  try {
    const { title, content, category = 'announcement', audience = 'all', isPinned = 'false' } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    const company = await Company.findOne({ user: req.user._id });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    const imageUrl = req.file ? `/assets/uploads/company-posts/${req.file.filename}` : '';

    const announcement = await CompanyAnnouncement.create({
      company: company._id,
      createdBy: req.user._id,
      title: String(title).trim(),
      content: String(content).trim(),
      category,
      audience,
      isPinned: isPinned === true || isPinned === 'true',
      imageUrl,
      publishedAt: new Date(),
    });

    const populated = await CompanyAnnouncement.findById(announcement._id)
      .populate('company', 'companyName logo')
      .lean();

    if (['all', 'students'].includes(audience)) {
      try {
        const students = await Student.find({ user: { $exists: true, $ne: null } }).select('user');
        const titleForNotif = String(title).trim();
        const messageForNotif = `${company.companyName} posted: ${titleForNotif}`;

        for (const student of students) {
          if (!student.user) continue;
          await NotificationService.create({
            recipient: student.user,
            type: 'system',
            title: 'New Company Announcement',
            message: messageForNotif,
            link: '/index.html',
            data: {
              companyId: company._id,
              companyName: company.companyName,
              announcementId: announcement._id,
              category,
            },
          });
        }
      } catch (notifErr) {
        console.error('Announcement notification error:', notifErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Announcement posted successfully',
      data: populated,
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get company announcements (own)
// @route   GET /api/companies/announcements
// @access  Private (Companies only)
router.get('/announcements', protect, authorize('company'), async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    const announcements = await CompanyAnnouncement.find({ company: company._id, isActive: true })
      .sort({ isPinned: -1, publishedAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    console.error('Get company announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get latest public announcements for students/company/admin
// @route   GET /api/companies/announcements/public
// @access  Private
router.get('/announcements/public', protect, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 30);
    const audienceFilter = req.user?.role === 'student'
      ? { audience: { $in: ['all', 'students'] } }
      : {};

    const announcements = await CompanyAnnouncement.find({ isActive: true, ...audienceFilter })
      .populate('company', 'companyName logo verified')
      .sort({ isPinned: -1, publishedAt: -1 })
      .limit(limit)
      .lean();

    const visible = announcements.filter((item) => !!item.company);

    res.json({
      success: true,
      count: visible.length,
      data: visible,
    });
  } catch (error) {
    console.error('Get public announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Delete own announcement
// @route   DELETE /api/companies/announcements/:id
// @access  Private (Companies only)
router.delete('/announcements/:id', protect, authorize('company'), async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    const announcement = await CompanyAnnouncement.findOne({ _id: req.params.id, company: company._id });
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    announcement.isActive = false;
    await announcement.save();

    res.json({
      success: true,
      message: 'Announcement removed',
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get company profile
// @route   GET /api/companies/profile
// @access  Private (Companies only)
router.get('/profile', protect, authorize('company'), async (req, res) => {
  try {
    let company = await Company.findOne({ user: req.user._id }).populate('user', 'email');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Create/Update company profile
// @route   PUT /api/companies/profile
// @access  Private (Companies only)
router.put('/profile', protect, authorize('company'), profileUpload.fields([
  { name: 'logoFile', maxCount: 1 },
  { name: 'coverImageFile', maxCount: 1 },
]), async (req, res) => {
  try {
    const parseMaybeJson = (value, fallback = {}) => {
      if (!value) return fallback;
      if (typeof value === 'object') return value;
      try {
        return JSON.parse(value);
      } catch (_err) {
        return fallback;
      }
    };

    const parseCsv = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
      return String(value).split(',').map(item => item.trim()).filter(Boolean);
    };

    const logoFile = req.files?.logoFile?.[0] || null;
    const coverImageFile = req.files?.coverImageFile?.[0] || null;

    const {
      companyName,
      industry,
      companySize,
      description,
      website,
      logo,
      coverImage,
      logoExisting,
      coverImageExisting,
      tagline,
      specialties,
      recruitmentEmail,
      address,
      contactPerson,
      socialMedia,
      benefits,
      companyValues,
    } = req.body;

    const parsedAddress = parseMaybeJson(address, {});
    const parsedContactPerson = parseMaybeJson(contactPerson, {});
    const parsedSocialMedia = parseMaybeJson(socialMedia, {});
    const parsedSpecialties = parseCsv(specialties);
    const parsedBenefits = parseCsv(benefits);

    const uploadedLogoPath = logoFile ? `/assets/uploads/company-profiles/${logoFile.filename}` : '';
    const uploadedCoverPath = coverImageFile ? `/assets/uploads/company-profiles/${coverImageFile.filename}` : '';

    let company = await Company.findOne({ user: req.user._id });

    if (company) {
      // Update existing profile
      company.companyName = companyName || company.companyName;
      company.industry = industry || company.industry;
      company.companySize = companySize || company.companySize;
      company.description = description || company.description;
      company.website = website || company.website;
      company.logo = uploadedLogoPath || logo || logoExisting || company.logo;
      company.coverImage = uploadedCoverPath || coverImage || coverImageExisting || company.coverImage;
      company.tagline = tagline || company.tagline;
      company.specialties = parsedSpecialties.length > 0 ? parsedSpecialties : company.specialties;
      company.recruitmentEmail = recruitmentEmail || company.recruitmentEmail;
      company.address = { ...company.address, ...parsedAddress };
      company.contactPerson = { ...company.contactPerson, ...parsedContactPerson };
      company.socialMedia = { ...company.socialMedia, ...parsedSocialMedia };
      company.benefits = parsedBenefits.length > 0 ? parsedBenefits : company.benefits;
      company.companyValues = companyValues || company.companyValues;

      await company.save();
    } else {
      // Create new profile
      company = await Company.create({
        user: req.user._id,
        companyName,
        industry,
        companySize,
        description,
        website,
        logo: uploadedLogoPath || logo || logoExisting || '',
        coverImage: uploadedCoverPath || coverImage || coverImageExisting || '',
        tagline,
        specialties: parsedSpecialties,
        recruitmentEmail,
        address: parsedAddress,
        contactPerson: parsedContactPerson,
        socialMedia: parsedSocialMedia,
        benefits: parsedBenefits,
        companyValues,
      });
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { industry, size, location, search } = req.query;
    
    let query = { verified: true };
    
    // Build search query
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
      ];
    }

    if (industry) {
      query.industry = { $regex: industry, $options: 'i' };
    }

    if (size) {
      query.companySize = size;
    }

    if (location) {
      query.$or = [
        { 'address.city': { $regex: location, $options: 'i' } },
        { 'address.state': { $regex: location, $options: 'i' } },
        { 'address.country': { $regex: location, $options: 'i' } },
      ];
    }

    const companies = await Company.find(query)
      .select('-user')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get company analytics
// @route   GET /api/companies/analytics
// @access  Private (Companies only)
router.get('/analytics', protect, authorize('company'), async (req, res) => {
  try {
    const Job = require('../../database/models/Job');
    
    const company = await Company.findOne({ user: req.user._id });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    // Get company's jobs with applications
    const jobs = await Job.find({ company: company._id })
      .populate({
        path: 'applications.student',
        select: 'firstName lastName assessmentScore skills',
      });

    // Calculate analytics
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const totalApplications = jobs.reduce((sum, job) => sum + job.applications.length, 0);
    
    const applicationsByStatus = {
      pending: 0,
      reviewed: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
    };

    jobs.forEach(job => {
      job.applications.forEach(app => {
        applicationsByStatus[app.status]++;
      });
    });

    // Top skills from applicants
    const skillCounts = {};
    jobs.forEach(job => {
      job.applications.forEach(app => {
        if (app.student && app.student.skills) {
          app.student.skills.forEach(skill => {
            skillCounts[skill.name] = (skillCounts[skill.name] || 0) + 1;
          });
        }
      });
    });

    const topSkills = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Average application score
    let totalScore = 0;
    let totalApplicants = 0;

    jobs.forEach(job => {
      job.applications.forEach(app => {
        if (app.student && app.student.assessmentScore) {
          totalScore += app.student.assessmentScore.overall;
          totalApplicants++;
        }
      });
    });

    const averageApplicantScore = totalApplicants > 0 ? Math.round(totalScore / totalApplicants) : 0;

    res.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        totalApplications,
        applicationsByStatus,
        topSkills,
        averageApplicantScore,
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

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate({
        path: 'jobs',
        match: { status: 'active' },
        select: 'title jobType location salary createdAt',
      })
      .select('-user');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Search students for hiring
// @route   GET /api/companies/search-students
// @access  Private (Companies only)
router.get('/search-students', protect, authorize('company'), async (req, res) => {
  try {
    const { skills, minScore, location, jobType, search, page = 1, limit = 10 } = req.query;
    
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
      const skillArray = skills.split(',').map(s => s.trim());
      query['skills.name'] = { $in: skillArray };
    }

    if (minScore) {
      query['assessmentScore.overall'] = { $gte: parseInt(minScore) };
    }

    if (location) {
      query.$or = [
        { 'address.city': { $regex: location, $options: 'i' } },
        { 'preferences.locations': { $regex: location, $options: 'i' } },
        { 'preferences.remote': true },
      ];
    }

    if (jobType) {
      query['preferences.jobTypes'] = { $in: [jobType] };
    }

    const skip = (page - 1) * limit;
    
    const students = await Student.find(query)
      .populate('user', 'email')
      .select('-applications')
      .sort({ 'assessmentScore.overall': -1, updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Student.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      count: students.length,
      pagination: {
        page: parseInt(page),
        pages,
        total,
        limit: parseInt(limit),
      },
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

// @desc    Get student matches for a specific job
// @route   GET /api/companies/job-matches/:jobId
// @access  Private (Companies only)
router.get('/job-matches/:jobId', protect, authorize('company'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const Job = require('../models/Job');
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Find students who haven't applied for this job yet
    const studentsWhoApplied = job.applications.map(app => app.student.toString());
    
    let query = {
      _id: { $nin: studentsWhoApplied }
    };

    // If job has specific skill requirements, prioritize students with those skills
    if (job.skillsRequired && job.skillsRequired.length > 0) {
      const requiredSkillNames = job.skillsRequired.map(skill => skill.name);
      query['skills.name'] = { $in: requiredSkillNames };
    }

    const skip = (page - 1) * limit;
    
    const students = await Student.find(query)
      .populate('user', 'email')
      .select('-applications')
      .sort({ 'assessmentScore.overall': -1, updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate match scores
    const studentMatches = students.map(student => {
      let matchScore = 0;
      let totalPossible = 0;

      // Skill matching
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

      // Location matching
      const studentPrefs = student.preferences || {};
      const jobLocation = job.location || {};

      if (jobLocation.remote || studentPrefs.remote) {
        matchScore += 20;
      } else if (studentPrefs.locations && studentPrefs.locations.includes(jobLocation.city)) {
        matchScore += 20;
      }

      totalPossible += 20;

      // Job type matching
      if (studentPrefs.jobTypes && studentPrefs.jobTypes.includes(job.jobType)) {
        matchScore += 20;
      }

      totalPossible += 20;

      const finalScore = totalPossible > 0 ? Math.round((matchScore / totalPossible) * 100) : 0;

      return {
        student,
        matchScore: Math.min(finalScore, 100),
      };
    });

    // Sort by match score
    const sortedMatches = studentMatches.sort((a, b) => b.matchScore - a.matchScore);

    const total = await Student.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      count: sortedMatches.length,
      pagination: {
        page: parseInt(page),
        pages,
        total,
        limit: parseInt(limit),
      },
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

// @desc    Invite student to apply for a job
// @route   POST /api/companies/invite/:studentId/:jobId
// @access  Private (Companies only)
router.post('/invite/:studentId/:jobId', protect, authorize('company'), async (req, res) => {
  try {
    const { studentId, jobId } = req.params;
    const { message } = req.body;

    const Job = require('../models/Job');
    
    const job = await Job.findById(jobId).populate('company');
    const student = await Student.findById(studentId);

    if (!job || !student) {
      return res.status(404).json({
        success: false,
        message: 'Job or student not found',
      });
    }

    // Check if company owns this job
    if (job.company.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to invite for this job',
      });
    }

    // In a real application, you would send an email or notification here
    // For now, we'll just log the invitation
    console.log(`Invitation sent to student ${student.firstName} ${student.lastName} for job ${job.title}`);
    console.log(`Message: ${message || 'No message provided'}`);

    res.json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        studentName: `${student.firstName} ${student.lastName}`,
        jobTitle: job.title,
        companyName: job.company.companyName,
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

// @desc    Update company theme preference
// @route   PUT /api/companies/theme
// @access  Private (Companies only)
router.put('/theme', protect, authorize('company'), async (req, res) => {
  try {
    const { themePreference } = req.body;
    
    if (!['light', 'dark'].includes(themePreference)) {
      return res.status(400).json({
        success: false,
        message: 'Theme must be either light or dark',
      });
    }

    const updatedUser = await req.user.updateOne({ themePreference });
    
    res.json({
      success: true,
      message: 'Theme preference updated successfully',
      data: { themePreference },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Delete company account
// @route   DELETE /api/companies/account
// @access  Private (Companies only)
router.delete('/account', protect, authorize('company'), async (req, res) => {
  try {
    const { confirmPassword } = req.body;
    const User = require('../../database/models/User');
    const Job = require('../../database/models/Job');

    // Verify password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isPasswordMatch = await user.comparePassword(confirmPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Delete all company's jobs
    await Job.deleteMany({ company: await Company.findOne({ user: req.user._id }).then(c => c._id) });

    // Delete company profile
    await Company.findOneAndDelete({ user: req.user._id });

    // Delete user account
    await User.findByIdAndDelete(req.user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting company account:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
