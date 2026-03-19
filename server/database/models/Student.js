const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Remove any non-digit characters and check length
        const digitsOnly = v.replace(/\D/g, '');
        return digitsOnly.length >= 10 && digitsOnly.length <= 11;
      },
      message: 'Phone number must be 10-11 digits'
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  education: {
    school: String,
    degree: String,
    fieldOfStudy: String,
    graduationYear: Number,
    gpa: Number,
  },
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    score: Number, // Assessment score for this skill
  }],
  assessmentCompleted: {
    type: Boolean,
    default: false,
  },
  retakeRequests: [{
    requestDate: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewDate: Date,
    reviewNotes: String,
  }],
  assessmentScore: {
    overall: Number,
    breakdown: {
      programming: Number,
      database: Number,
      webDevelopment: Number,
      networking: Number,
      problemSolving: Number,
      cloudComputing: Number,
      devOps: Number,
      security: Number,
      systemDesign: Number,
      dataStructures: Number,
      algorithms: Number,
      mobile: Number,
      backend: Number,
      frontend: Number,
      apiDesign: Number,
      // Programming Languages
      python: Number,
      java: Number,
      javascript: Number,
      csharp: Number,
      php: Number,
      swift: Number,
      go: Number,
      ruby: Number,
      sql: Number,
      cpp: Number,
      rust: Number,
      kotlin: Number,
      c: Number,
      typescript: Number,
      r: Number,
      perl: Number,
      html: Number,
      objectivec: Number,
      visualbasic: Number,
      assembly: Number,
      css: Number,
      matlab: Number,
      scala: Number,
    },
  },
  resume: {
    filename: String,
    path: String,
    uploadedAt: Date,
  },
  avatar: {
    filename: String,
    data: String, // Base64 encoded image data (data:image/jpeg;base64,...)
    mimeType: String, // e.g., 'image/jpeg', 'image/png'
    uploadedAt: Date,
  },
  portfolio: {
    githubUrl: String,
    linkedinUrl: String,
    personalWebsite: String,
    projects: [{
      title: String,
      description: String,
      technologies: [String],
      url: String,
      imageUrl: String,
    }],
  },
  preferences: {
    jobTypes: [String], // e.g., 'full-time', 'part-time', 'internship'
    locations: [String],
    salaryRange: {
      min: Number,
      max: Number,
    },
    remote: Boolean,
  },
  applications: [{
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
      default: 'pending',
    },
    customAssessmentSubmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomAssessmentSubmission',
    },
  }],
  gamification: {
    points: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    badges: [{
      type: String,
      enum: ['Level 1 Achieved!', 'Level 2 Achieved!', 'Level 3 Achieved!', '10 Questions Completed', '50 Questions Completed'],
    }],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
studentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema);
