const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: [String],
  responsibilities: [String],
  skillsRequired: [{
    name: String,
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    },
    priority: {
      type: String,
      enum: ['must-have', 'nice-to-have'],
      default: 'nice-to-have',
    },
  }],
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'ojt'],
    required: true,
  },
  experienceLevel: {
    type: String,
    enum: ['entry-level', 'junior', 'mid-level', 'senior'],
    required: true,
  },
  location: {
    city: String,
    state: String,
    country: String,
    remote: Boolean,
    hybrid: Boolean,
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD',
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'monthly',
    },
  },
  benefits: [String],
  applicationDeadline: Date,
  startDate: Date,
  duration: String, // e.g., '3 months', '6 months'
  numberOfPositions: {
    type: Number,
    default: 1,
  },
  applications: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
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
    matchScore: Number, // Algorithm-calculated match score
    overallAssessmentScore: Number, // Student's overall assessment score at time of application
    notes: String, // Company notes about the applicant
    customAssessmentSubmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomAssessmentSubmission',
    },
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'on-hold'],
    default: 'draft',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  tags: [String], // e.g., 'urgent-hiring', 'remote-friendly', 'entry-level-welcome'
  customAssessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomAssessment',
    default: null
  },
  requireCustomAssessment: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  publishedAt: Date,
});

// Update the updatedAt field before saving
jobSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better search performance
jobSchema.index({ title: 'text', description: 'text', 'skillsRequired.name': 'text' });
jobSchema.index({ 'location.city': 1, 'location.remote': 1 });
jobSchema.index({ jobType: 1, experienceLevel: 1 });
jobSchema.index({ status: 1, publishedAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
