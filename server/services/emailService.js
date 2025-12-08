const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Create email client based on available configuration
const createEmailClient = () => {
  // Priority 1: Resend (best for transactional emails)
  if (process.env.RESEND_API_KEY) {
    console.log('Using Resend for email delivery');
    return { type: 'resend', client: new Resend(process.env.RESEND_API_KEY) };
  }

  // Priority 2: SendGrid
  if (process.env.SENDGRID_API_KEY) {
    console.log('Using SendGrid for email delivery');
    return {
      type: 'smtp',
      client: nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      })
    };
  }

  // Priority 3: Gmail (fallback)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('Using Gmail for email delivery');
    return {
      type: 'smtp',
      client: nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      })
    };
  }

  console.warn('No email service configured. Email notifications will be disabled.');
  return null;
};

const emailClient = createEmailClient();

// Email templates
const emailTemplates = {
  passwordReset: (recipientName, newPassword) => ({
    subject: '🔑 Password Reset Approved - IT OJT Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #56AE67 0%, #3d8b4f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .password-box { background: white; border: 2px solid #56AE67; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .password { font-size: 24px; font-weight: bold; color: #56AE67; letter-spacing: 2px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #56AE67; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔑 Password Reset Approved</h1>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p>Your password reset request has been approved by the administrator.</p>
            
            <div class="password-box">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your new password:</p>
              <div class="password">${newPassword}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Notice:</strong>
              <ul style="margin: 10px 0;">
                <li>Please change this password after logging in</li>
                <li>Do not share this password with anyone</li>
                <li>Use a strong, unique password</li>
              </ul>
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="btn">Login to Your Account</a>
            </p>
            
            <p>If you did not request this password reset, please contact the administrator immediately.</p>
          </div>
          <div class="footer">
            <p>© 2025 IT OJT Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  applicationStatus: (recipientName, jobTitle, status, companyName) => ({
    subject: `📋 Application Update: ${jobTitle} - IT OJT Platform`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #56AE67 0%, #3d8b4f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
          .status-accepted { background: #d4edda; color: #155724; }
          .status-rejected { background: #f8d7da; color: #721c24; }
          .status-pending { background: #fff3cd; color: #856404; }
          .job-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #56AE67; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Application Update</h1>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p>Your application status has been updated:</p>
            
            <div class="job-details">
              <h3 style="margin-top: 0; color: #56AE67;">${jobTitle}</h3>
              <p style="margin: 5px 0;"><strong>Company:</strong> ${companyName}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span class="status-badge status-${status.toLowerCase()}">${status.toUpperCase()}</span></p>
            </div>
            
            ${status === 'accepted' ? '<p>🎉 Congratulations! Your application has been accepted. The company will contact you soon with next steps.</p>' : ''}
            ${status === 'rejected' ? '<p>Unfortunately, your application was not selected at this time. Keep applying to other opportunities!</p>' : ''}
            ${status === 'pending' ? '<p>Your application is currently under review. We\'ll notify you once there\'s an update.</p>' : ''}
            
            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="btn">View Dashboard</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2025 IT OJT Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  assessmentResult: (recipientName, assessmentTitle, score, level) => ({
    subject: `🎯 Assessment Complete: ${assessmentTitle} - IT OJT Platform`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #56AE67 0%, #3d8b4f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .score-circle { width: 150px; height: 150px; border-radius: 50%; background: #56AE67; color: white; display: flex; align-items: center; justify-content: center; margin: 20px auto; font-size: 48px; font-weight: bold; }
          .level-badge { background: #6c757d; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #56AE67; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Assessment Complete</h1>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p>You have completed the <strong>${assessmentTitle}</strong> assessment!</p>
            
            <div style="text-align: center;">
              <div class="score-circle">${score}%</div>
              <div class="level-badge">${level}</div>
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              Your skill has been verified and added to your profile. This will help match you with relevant job opportunities!
            </p>
            
            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="btn">View Your Profile</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2025 IT OJT Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  retakeApproved: (recipientName, assessmentTitle) => ({
    subject: `✅ Retake Request Approved: ${assessmentTitle} - IT OJT Platform`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #56AE67 0%, #3d8b4f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #56AE67; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Retake Request Approved</h1>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p>Great news! Your request to retake the <strong>${assessmentTitle}</strong> assessment has been approved.</p>
            
            <p>You can now take the assessment again to improve your score. Good luck! 🍀</p>
            
            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="btn">Take Assessment</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2025 IT OJT Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  generic: (recipientName, title, message) => ({
    subject: `📬 ${title} - IT OJT Platform`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #56AE67 0%, #3d8b4f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #56AE67; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 ${title}</h1>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p>${message}</p>
            
            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="btn">View Dashboard</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2025 IT OJT Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function with Resend and SMTP support
const sendEmail = async (to, template) => {
  if (!emailClient) {
    console.log(`Email would be sent to ${to}: ${template.subject}`);
    return { success: true, message: 'Email service not configured, skipped' };
  }

  try {
    // Use Resend API
    if (emailClient.type === 'resend') {
      const result = await emailClient.client.emails.send({
        from: 'IT OJT Platform <onboarding@resend.dev>', // Use your verified domain later
        to: to,
        subject: template.subject,
        html: template.html
      });
      console.log(`Email sent successfully via Resend to ${to}: ${result.id}`);
      return { success: true, messageId: result.id };
    }

    // Use SMTP (SendGrid or Gmail)
    if (emailClient.type === 'smtp') {
      const mailOptions = {
        from: `"IT OJT Platform" <${process.env.EMAIL_USER || 'noreply@it-ojt-platform.com'}>`,
        to,
        subject: template.subject,
        html: template.html
      };

      const info = await emailClient.client.sendMail(mailOptions);
      console.log(`Email sent successfully via SMTP to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    }

    return { success: false, error: 'Unknown email client type' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Notification-specific email functions
const sendPasswordResetEmail = async (userEmail, userName, newPassword) => {
  const template = emailTemplates.passwordReset(userName, newPassword);
  return await sendEmail(userEmail, template);
};

const sendApplicationStatusEmail = async (userEmail, userName, jobTitle, status, companyName) => {
  const template = emailTemplates.applicationStatus(userName, jobTitle, status, companyName);
  return await sendEmail(userEmail, template);
};

const sendAssessmentResultEmail = async (userEmail, userName, assessmentTitle, score, level) => {
  const template = emailTemplates.assessmentResult(userName, assessmentTitle, score, level);
  return await sendEmail(userEmail, template);
};

const sendRetakeApprovedEmail = async (userEmail, userName, assessmentTitle) => {
  const template = emailTemplates.retakeApproved(userName, assessmentTitle);
  return await sendEmail(userEmail, template);
};

const sendGenericNotificationEmail = async (userEmail, userName, title, message) => {
  const template = emailTemplates.generic(userName, title, message);
  return await sendEmail(userEmail, template);
};

module.exports = {
  sendPasswordResetEmail,
  sendApplicationStatusEmail,
  sendAssessmentResultEmail,
  sendRetakeApprovedEmail,
  sendGenericNotificationEmail,
  sendEmail
};
