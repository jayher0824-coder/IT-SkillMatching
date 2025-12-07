const Notification = require('../database/models/Notification');

class NotificationService {
  // Create a notification
  static async create({ recipient, type, title, message, link = null, data = {} }) {
    try {
      const notification = await Notification.create({
        recipient,
        type,
        title,
        message,
        link,
        data
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Password reset approved
  static async notifyPasswordResetApproved(userId, newPassword) {
    return this.create({
      recipient: userId,
      type: 'password_change_approved',
      title: 'Password Reset Approved',
      message: `Your password has been reset by an administrator. Your new temporary password is: ${newPassword}. Please login and change it immediately.`,
      link: '/index.html'
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
  static async notifyApplicationStatus(studentUserId, jobTitle, status) {
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
      link: '/dashboard.html'
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
      link: '/dashboard.html'
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
