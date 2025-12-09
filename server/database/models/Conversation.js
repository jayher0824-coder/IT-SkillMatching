const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'support'], // direct: one-on-one, support: with admin
    default: 'direct'
  },
  subject: {
    type: String,
    maxlength: 200
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  archived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ type: 1 });

// Method to get unread count for a specific user
conversationSchema.methods.getUnreadCount = function(userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

// Method to increment unread count for a user
conversationSchema.methods.incrementUnreadCount = function(userId) {
  const count = this.getUnreadCount(userId) + 1;
  this.unreadCount.set(userId.toString(), count);
  return count;
};

// Method to reset unread count for a user
conversationSchema.methods.resetUnreadCount = function(userId) {
  this.unreadCount.set(userId.toString(), 0);
};

module.exports = mongoose.model('Conversation', conversationSchema);
