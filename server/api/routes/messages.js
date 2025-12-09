const express = require('express');
const router = express.Router();
const { protect } = require('../../auth/middleware/auth');
const Conversation = require('../../database/models/Conversation');
const Message = require('../../database/models/Message');
const User = require('../../database/models/User');
const NotificationService = require('../../services/notificationService');

// @desc    Get all conversations for logged-in user
// @route   GET /api/messages/conversations
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      archived: false
    })
      .populate('participants', 'email role')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    // Add unread count for current user
    const conversationsWithUnread = conversations.map(conv => ({
      ...conv.toObject(),
      unreadCount: conv.getUnreadCount(req.user._id),
      otherParticipant: conv.participants.find(p => p._id.toString() !== req.user._id.toString())
    }));

    res.json({
      success: true,
      data: conversationsWithUnread
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get or create a conversation
// @route   POST /api/messages/conversations
// @access  Private
router.post('/conversations', protect, async (req, res) => {
  try {
    const { participantId, type, subject } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required'
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId] },
      type: type || 'direct'
    })
      .populate('participants', 'email role')
      .populate('lastMessage');

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [req.user._id, participantId],
        type: type || 'direct',
        subject: subject || null,
        unreadCount: {
          [req.user._id.toString()]: 0,
          [participantId]: 0
        }
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'email role')
        .populate('lastMessage');
    }

    res.json({
      success: true,
      data: {
        ...conversation.toObject(),
        unreadCount: conversation.getUnreadCount(req.user._id),
        otherParticipant: conversation.participants.find(p => p._id.toString() !== req.user._id.toString())
      }
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get messages in a conversation
// @route   GET /api/messages/conversations/:id/messages
// @access  Private
router.get('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;

    // Verify user is participant
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build query
    const query = {
      conversation: req.params.id,
      deleted: false
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: messages.reverse()
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Send a message
// @route   POST /api/messages/conversations/:id/messages
// @access  Private
router.post('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Verify user is participant
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create message
    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      content: content.trim()
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    // Increment unread count for other participants
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user._id.toString()) {
        conversation.incrementUnreadCount(participantId);
      }
    });

    await conversation.save();

    // Send notifications to other participants
    const otherParticipants = conversation.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );

    for (const participantId of otherParticipants) {
      try {
        await NotificationService.create({
          recipient: participantId,
          type: 'new_message',
          title: 'New Message',
          message: `You have a new message from ${req.user.email}`,
          link: '/messages.html?conversation=' + conversation._id,
          data: {
            conversationId: conversation._id,
            messageId: message._id
          }
        });
      } catch (notifError) {
        console.error('Error creating message notification:', notifError);
      }
    }

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'email role');

    res.json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark messages as read
// @route   PUT /api/messages/conversations/:id/read
// @access  Private
router.put('/conversations/:id/read', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark unread messages as read
    await Message.updateMany(
      {
        conversation: req.params.id,
        sender: { $ne: req.user._id },
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    // Reset unread count
    conversation.resetUnreadCount(req.user._id);
    await conversation.save();

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      archived: false
    });

    const totalUnread = conversations.reduce((sum, conv) => {
      return sum + conv.getUnreadCount(req.user._id);
    }, 0);

    res.json({
      success: true,
      data: { count: totalUnread }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get available users for messaging
// @route   GET /api/messages/available-users
// @access  Private
router.get('/available-users', protect, async (req, res) => {
  try {
    const currentUser = req.user;
    let users = [];

    if (currentUser.role === 'student') {
      // Students can message companies and admins
      const Company = require('../../database/models/Company');
      // Get all companies (verified or not)
      const companies = await Company.find()
        .populate('user', 'email')
        .select('companyName user verified');
      
      users = companies
        .filter(c => c.user && c.user._id.toString() !== currentUser._id.toString())
        .map(c => ({
          _id: c.user._id,
          email: c.user.email,
          displayName: c.companyName,
          type: 'Company'
        }));

      console.log(`Student can message ${users.length} companies`);

      // Add admins
      const admins = await User.find({ role: 'admin' }).select('email');
      users.push(...admins.map(a => ({
        _id: a._id,
        email: a.email,
        displayName: a.email.split('@')[0],
        type: 'Admin'
      })));

      console.log(`Total available users for student: ${users.length}`);

    } else if (currentUser.role === 'company') {
      // Companies can message students and admins
      const Student = require('../../database/models/Student');
      const students = await Student.find()
        .populate('user', 'email')
        .select('firstName lastName user');
      
      users = students
        .filter(s => s.user && s.user._id.toString() !== currentUser._id.toString())
        .map(s => ({
          _id: s.user._id,
          email: s.user.email,
          displayName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          type: 'Student'
        }));

      console.log(`Company can message ${users.length} students`);

      // Add admins
      const admins = await User.find({ role: 'admin' }).select('email');
      users.push(...admins.map(a => ({
        _id: a._id,
        email: a.email,
        displayName: a.email.split('@')[0],
        type: 'Admin'
      })));

      console.log(`Total available users for company: ${users.length}`);

    } else if (currentUser.role === 'admin') {
      // Admins can message everyone
      const Student = require('../../database/models/Student');
      const Company = require('../../database/models/Company');
      
      const [students, companies] = await Promise.all([
        Student.find().populate('user', 'email').select('firstName lastName user'),
        Company.find().populate('user', 'email').select('companyName user')
      ]);

      users = [
        ...students
          .filter(s => s.user && s.user._id.toString() !== currentUser._id.toString())
          .map(s => ({
            _id: s.user._id,
            email: s.user.email,
            displayName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
            type: 'Student'
          })),
        ...companies
          .filter(c => c.user && c.user._id.toString() !== currentUser._id.toString())
          .map(c => ({
            _id: c.user._id,
            email: c.user.email,
            displayName: c.companyName,
            type: 'Company'
          }))
      ];

      console.log(`Total available users for admin: ${users.length} (${students.filter(s => s.user).length} students, ${companies.filter(c => c.user).length} companies)`);
    }

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get available users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all conversations for admin panel
// @route   GET /api/messages
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .populate('participants', 'firstName lastName email role')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Get all conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Send message as admin to a user
// @route   POST /api/messages
// @access  Private (Admin)
router.post('/', protect, async (req, res) => {
  try {
    const { recipientId, message } = req.body;

    if (!recipientId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and message are required'
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, recipientId],
        type: 'direct'
      });
      await conversation.save();
    }

    // Create message with correct field names
    const newMessage = new Message({
      conversation: conversation._id,
      sender: req.user._id,
      content: message
    });

    await newMessage.save();

    // Update conversation with last message
    conversation.lastMessage = newMessage._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate sender and recipient info
    await newMessage.populate('sender', 'firstName lastName email role');

    // Send notification to recipient
    try {
      await NotificationService.createNotification({
        userId: recipientId,
        type: 'message',
        title: `New message from ${req.user.firstName} ${req.user.lastName}`,
        message: message.substring(0, 100),
        relatedId: conversation._id,
        relatedModel: 'Conversation'
      });
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
