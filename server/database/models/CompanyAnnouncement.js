const mongoose = require('mongoose');

const companyAnnouncementSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
  },
  category: {
    type: String,
    enum: ['announcement', 'hiring', 'event', 'deadline', 'result'],
    default: 'announcement',
    index: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  audience: {
    type: String,
    enum: ['all', 'applicants', 'shortlisted'],
    default: 'all',
  },
  isPinned: {
    type: Boolean,
    default: false,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  publishedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CompanyAnnouncement', companyAnnouncementSchema);
