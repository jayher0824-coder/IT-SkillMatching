const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: function() {
      // Password required only if not using Google OAuth
      return !this.googleId;
    },
  },
  role: {
    type: String,
    enum: ['student', 'company', 'admin'],
    required: [true, 'Role is required']
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  themePreference: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light',
  },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      jobUpdates: { type: Boolean, default: true },
      assessments: { type: Boolean, default: true },
    },
    privacy: {
      profileVisible: { type: Boolean, default: true },
      resumeVisible: { type: Boolean, default: true },
    },
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  passwordChangeRequests: [{
    requestDate: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
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
    reviewedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
