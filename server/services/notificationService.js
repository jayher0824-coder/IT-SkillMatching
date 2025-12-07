const Notification = require('../database/models/Notification');
const emailService = require('./emailService');
const User = require('../database/models/User');
const Student = require('../database/models/Student');
const Company = require('../database/models/Company');

class NotificationService {
  // Helper to get user details for email
  static async getUserDetails(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      let profile = null;
      let name = user.email;

      if (user.role === 'student') {
        profile = await Student.findOne({ user: userId });
        if (profile && profile.firstName) {
          name = `${profile.firstName} ${profile.lastName || ''}`.trim();
        }
      } else if (user.role === 'company') {
        profile = await Company.findOne({ user: userId });
        if (profile && profile.companyName) {
          name = profile.companyName;
        }
      }

      return { email: user.email, name };
    } catch (error) {
      console.error('Error getting user details:', error);
      return null;
    }
  }

  // Create a notification and send email
  static async create({ recipient, type, title, message, link = null, data = {} }) {
    try {
      // Create in-app notification
      const notification = await Notification.create({
        recipient,
        type,
        title,
        message,
        link,
        data
      });

      // Send email notification asynchronously (don't wait for it)
      this.sendEmailForNotification(recipient, type, title, message, data).catch(err => {
        console.error('Error sending email notification:', err);
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send email based on notification type
  static async sendEmailForNotification(userId, type, title, message, data = {}) {
    const userDetails = await this.getUserDetails(userId);
    if (!userDetails) return;

    const { email, name } = userDetails;

    try {
      switch (type) {
        case 'password_change_approved':
          if (data.newPassword) {
            await emailService.sendPasswordResetEmail(email, name, data.newPassword);
          }
          break;

        case 'application_status':
          if (data.jobTitle && data.status && data.companyName) {
            await emailService.sendApplicationStatusEmail(
              email, 
              name, 
              data.jobTitle, 
              data.status, 
              data.companyName
            );
          }
          break;

        case 'assessment_complete':
          if (data.assessmentTitle && data.score !== undefined && data.level) {
            await emailService.sendAssessmentResultEmail(
              email, 
              name, 
              data.assessmentTitle, 
              data.score, 
              data.level
            );
          }
          break;

        case 'retake_approved':
          if (data.assessmentTitle) {
            await emailService.sendRetakeApprovedEmail(email, name, data.assessmentTitle);
          }
          break;

        // For all other types, send generic email
        default:
          await emailService.sendGenericNotificationEmail(email, name, title, message);
          break;
      }
    } catch (error) {
      console.error(`Error sending ${type} email:`, error);
    }
  }

  // Password reset approved
  static async notifyPasswordResetApproved(userId, newPassword) {
    return this.create({
      recipient: userId,
      type: 'password_change_approved',
      title: 'Password Reset Approved',
      message: `Your password has been reset by an administrator. Your new temporary password is: ${newPassword}. Please login and change it immediately.`,
      link: '/index.html',
      data: { newPassword }
    });
  }

  // Password change request rejected
  static async notifyPasswordResetRejected(userId, reason) {
    return this.create({
      recipient: userId,
      type: 'password_change_rejected',
      title: 'Password Reset Request Rejected',
      message: reason || 'Your password reset request was rejected by the administrator.',
      link: null
    });
  }

  // Job application received (for company)
  static async notifyApplicationReceived(companyUserId, studentName, jobTitle) {
    return this.create({
      recipient: companyUserId,
      type: 'application_received',
      title: 'New Job Application',
      message: `${studentName} has applied for the position: ${jobTitle}`,
      link: '/dashboard.html'
    });
  }

  // Application status update (for student)
  static async notifyApplicationStatus(studentUserId, jobTitle, status, companyName = 'the company') {
    const statusMessages = {
      'accepted': `Congratulations! Your application for ${jobTitle} has been accepted.`,
      'rejected': `Your application for ${jobTitle} has been reviewed.`,
      'interview': `You have been invited for an interview for ${jobTitle}.`
    };

    return this.create({
      recipient: studentUserId,
      type: 'application_status',
      title: 'Application Status Update',
      message: statusMessages[status] || `Your application status for ${jobTitle} has been updated.`,
      link: '/dashboard.html',
      data: { jobTitle, status, companyName }
    });
  }

  // Assessment reminder
  static async notifyAssessmentReminder(studentUserId, assessmentName) {
    return this.create({
      recipient: studentUserId,
      type: 'assessment_reminder',
      title: 'Assessment Reminder',
      message: `Don't forget to complete your ${assessmentName} assessment.`,
      link: '/dashboard.html'
    });
  }

  // Retake request approved
  static async notifyRetakeApproved(studentUserId, assessmentName) {
    return this.create({
      recipient: studentUserId,
      type: 'retake_approved',
      title: 'Retake Request Approved',
      message: `Your request to retake the ${assessmentName} assessment has been approved.`,
      link: '/dashboard.html',
      data: { assessmentTitle: assessmentName }
    });
  }

  // Retake request rejected
  static async notifyRetakeRejected(studentUserId, assessmentName, reason) {
    return this.create({
      recipient: studentUserId,
      type: 'retake_rejected',
      title: 'Retake Request Rejected',
      message: `Your request to retake ${assessmentName} was rejected. Reason: ${reason}`,
      link: '/dashboard.html'
    });
  }

  // Feedback received
  static async notifyFeedbackReceived(userId, fromName) {
    return this.create({
      recipient: userId,
      type: 'feedback_received',
      title: 'New Feedback',
      message: `You have received feedback from ${fromName}.`,
      link: '/dashboard.html'
    });
  }

  // System notification
  static async notifySystem(userId, title, message, link = null) {
    return this.create({
      recipient: userId,
      type: 'system',
      title,
      message,
      link
    });
  }
}

module.exports = NotificationService;
