const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  industry: {
    type: String,
    required: true,
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  website: String,
  logo: String,
  coverImage: String,
  tagline: String,
  specialties: [String],
  recruitmentEmail: String,
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'verified',
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  contactPerson: {
    firstName: String,
    lastName: String,
    title: String,
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty (not required)
          const digitsOnly = v.replace(/\D/g, '');
          return digitsOnly.length >= 10 && digitsOnly.length <= 11;
        },
        message: 'Phone number must be 10-11 digits'
      }
    },
    email: String,
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String,
  },
  benefits: [String], // e.g., 'Health Insurance', 'Flexible Hours', 'Remote Work'
  companyValues: [String],
  verified: {
    type: Boolean,
    default: false,
  },
  // OJT Program Information
  ojtProgram: {
    duration: String, // e.g., '6 months', '4 months'
    allowance: Number, // Monthly allowance in PHP
    positions: Number, // Number of OJT positions available
    categories: [String], // e.g., ['Software Development', 'Data Analytics']
    requirements: [String], // e.g., ['3rd year IT student', 'Good English']
    isActive: {
      type: Boolean,
      default: true
    },
    applicationDeadline: Date,
    startDate: Date,
    contact: {
      name: String,
      email: String,
      phone: String
    }
  },
  // Skill Requirements for OJT matching
  skillRequirements: [{
    category: {
      type: String,
      enum: ['programming', 'database', 'webDevelopment', 'networking', 'problemSolving'],
      required: true
    },
    minScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    preferredLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: true
    }
  }],
  jobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  }],
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
companySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Company', companySchema);
