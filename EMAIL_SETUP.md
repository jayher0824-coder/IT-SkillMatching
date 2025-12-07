# Email Notification Setup Guide

## Overview
The platform now sends email notifications for important events like password resets, application updates, assessment completions, and more.

## Quick Setup (Gmail)

### Step 1: Enable 2-Step Verification
1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** in the left menu
3. Under "Signing in to Google," enable **2-Step Verification**
4. Follow the prompts to set it up

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. In the "Select app" dropdown, choose **Mail**
3. In the "Select device" dropdown, choose **Other** and type "IT OJT Platform"
4. Click **Generate**
5. Copy the 16-character password shown (remove spaces)

### Step 3: Configure Environment Variables
1. Open your `.env` file (or create from `.env.example`)
2. Add these lines:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # Your 16-char app password (spaces optional)
CLIENT_URL=https://your-deployed-url.com  # Your frontend URL
```

### Step 4: Test
Restart your server and trigger a notification (e.g., admin resets a user password). Check the recipient's email inbox.

## Alternative Email Services

### SendGrid
```env
EMAIL_SERVICE=SendGrid
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### Outlook/Hotmail
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Custom SMTP
```env
EMAIL_SERVICE=custom
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASS=your-password
EMAIL_SECURE=false  # true for port 465, false for 587
```

## Email Templates

The system includes professional HTML email templates for:

1. **Password Reset** - Sends new password with security warnings
2. **Application Status** - Updates on job application (accepted/rejected/interview)
3. **Assessment Results** - Score and skill level after completing assessment
4. **Retake Approval** - Notification when retake request is approved
5. **Generic** - For all other notification types

## Disabling Email Notifications

If you don't want to send emails (only in-app notifications):
- Simply don't set `EMAIL_USER` and `EMAIL_PASS` in your `.env` file
- The system will log emails to console instead of sending them

## Troubleshooting

### "Invalid login" error
- Make sure you're using an App Password, not your regular Gmail password
- Verify 2-Step Verification is enabled
- Check that EMAIL_USER and EMAIL_PASS are correct

### Emails not sending
- Check server logs for error messages
- Verify your email service is not blocking the connection
- For Gmail, check https://myaccount.google.com/lesssecureapps

### Emails going to spam
- Add your domain to SPF records
- Consider using a professional email service (SendGrid, AWS SES)
- Recipients should add your email to their contacts

## Email Notification Types

All notifications automatically trigger emails:

| Type | Email Template | Triggers |
|------|----------------|----------|
| Password Reset | Custom HTML | Admin approves password change request |
| Application Status | Custom HTML | Company updates application status |
| Assessment Complete | Custom HTML | Student completes assessment |
| Retake Approved | Custom HTML | Admin approves retake request |
| Job Application | Generic | Student applies to job |
| Feedback | Generic | Feedback is submitted |
| System | Generic | Admin sends system notification |

## Production Deployment (Render)

### Adding Environment Variables on Render:
1. Go to your Render Dashboard
2. Click on your service
3. Go to **Environment** tab
4. Add these variables:
   - `EMAIL_SERVICE` = `gmail`
   - `EMAIL_USER` = `your-email@gmail.com`
   - `EMAIL_PASS` = `your-app-password`
   - `CLIENT_URL` = `https://your-app-name.onrender.com`
5. Click **Save Changes**
6. Render will automatically redeploy

## Support

For issues or questions, check:
- Server logs for detailed error messages
- Gmail App Password documentation: https://support.google.com/accounts/answer/185833
- Nodemailer documentation: https://nodemailer.com/
