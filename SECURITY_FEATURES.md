# Password Reset Security Features

## Overview
The password reset system now includes comprehensive security measures to prevent unauthorized access and ensure legitimate password change requests.

## Implemented Security Features

### 1. ✅ Rate Limiting
- **Limit**: Maximum 3 verification code requests per 24 hours
- **Reset**: Counter resets automatically after 24 hours
- **Purpose**: Prevents spam and brute-force attempts
- **Implementation**: Tracked in User model with `passwordRequestCount` and `passwordRequestResetDate`

### 2. ✅ Request Cooldown
- **Duration**: 24 hours between successful requests
- **Tracking**: `lastPasswordRequestDate` field in User model
- **Purpose**: Prevents multiple simultaneous password reset attempts
- **User Experience**: Clear error message with next available request time

### 3. ✅ Email Verification Code (OTP)
- **Format**: 6-digit random code
- **Delivery**: Professional HTML email template
- **Expiry**: 15 minutes from generation
- **Purpose**: Verifies user has access to registered email
- **Implementation**: Stored in `resetPasswordToken` with expiry in `resetPasswordExpires`

### 4. ✅ Security Questions (Optional)
- **Quantity**: Up to 3 questions per user
- **Storage**: Answers hashed with bcrypt (10 rounds)
- **Validation**: Case-insensitive comparison during password reset
- **Setup**: Users can configure via `/api/password-reset/setup-security-questions`
- **Purpose**: Additional identity verification layer

### 5. ✅ Detailed Approval Queue
Enhanced password change request tracking includes:
- Verification status (verified/not verified badge)
- IP address of requester
- User agent (browser/device information)
- Request timestamp
- Reason for password reset
- Security question responses (if answered)

### 6. ✅ IP Address Tracking
- **Capture**: Automatic IP logging on each request
- **Display**: Visible to admins in approval queue
- **Purpose**: Detect suspicious access patterns
- **Implementation**: `getClientIp()` helper function handles proxy headers

### 7. ✅ User Agent Logging
- **Capture**: Browser and device information
- **Storage**: Stored with each password change request
- **Purpose**: Additional context for admins reviewing requests
- **Format**: Standard user-agent string

### 8. ⚠️ Two-Factor Authentication (Simplified)
- **Implementation**: Using verification codes as 2FA substitute
- **Flow**: Email verification code acts as second factor
- **Note**: More comprehensive 2FA (SMS, authenticator apps) can be added later

## API Endpoints

### Request Verification Code
```
POST /api/password-reset/request-verification-code
Body: { email: string }
```

**Security Checks:**
- Rate limiting (3 per 24 hours)
- Cooldown period (24 hours)
- Checks for pending requests
- Validates against Google OAuth accounts

**Response:**
- Sends 6-digit code via email
- Returns success/error message
- Does not reveal if user exists (security)

### Submit Password Reset Request
```
POST /api/password-reset/forgot-password
Body: { 
  email: string,
  verificationCode: string,
  reason: string,
  securityAnswers?: { [questionId]: answer }
}
```

**Security Checks:**
- Validates verification code
- Checks code expiry (15 minutes)
- Validates security question answers (if set)
- Captures IP address
- Logs user agent

**Response:**
- Creates password change request for admin approval
- Clears used verification code
- Updates lastPasswordRequestDate

### Get Security Questions
```
GET /api/password-reset/security-questions/:email
```

**Response:**
- Returns list of security questions for user
- Does not reveal answers
- Returns empty array if no questions set

### Setup Security Questions
```
POST /api/password-reset/setup-security-questions
Body: {
  email: string,
  questions: [{ question: string, answer: string }]
}
```

**Security:**
- Maximum 3 questions allowed
- Answers hashed with bcrypt
- Stored in lowercase and trimmed

## User Flow

### Step 1: Request Verification Code
1. User enters email on forgot password page
2. System checks rate limits and cooldown
3. Generates 6-digit code (15-minute expiry)
4. Sends professional HTML email with code
5. Displays verification form

### Step 2: Verify and Submit Request
1. User enters verification code from email
2. System loads security questions (if set)
3. User answers security questions
4. User provides reason for password reset
5. System validates all inputs
6. Creates detailed password change request
7. Admin receives notification

### Step 3: Admin Review
1. Admin sees comprehensive request details:
   - ✅ Email Verified badge
   - IP address
   - User agent
   - Timestamp
   - Reason
   - Security verification status
2. Admin approves/rejects with notes
3. System generates new password
4. User receives email with new password

## Database Schema Updates

### User Model Enhancements

```javascript
// Password Change Request Schema
passwordChangeRequests: [{
  reason: String,
  requestDate: Date,
  status: String,
  adminNotes: String,
  reviewedAt: Date,
  reviewedBy: ObjectId,
  verificationCode: String,      // NEW
  verified: Boolean,             // NEW
  ipAddress: String,             // NEW
  userAgent: String,             // NEW
  securityAnswers: Map          // NEW
}]

// Security Fields
securityQuestions: [{
  question: String,
  answerHash: String
}]
lastPasswordRequestDate: Date
passwordRequestCount: Number
passwordRequestResetDate: Date
```

## Frontend Updates

### forgot-password.html
- **Two-step form**: Request code → Verify and submit
- **Countdown timer**: Shows code expiry (15 minutes)
- **Dynamic security questions**: Loaded based on user setup
- **Reason textarea**: Required explanation for password reset
- **Responsive design**: Tailwind CSS styling
- **User-friendly messages**: Clear error/success feedback

### Admin Dashboard
- **Enhanced request cards**: Show verification status and IP
- **Security badges**: Visual indicators for verified requests
- **Detailed information**: IP address, user agent, timestamp
- **Filter options**: Pending/Approved/Rejected/All

## Security Best Practices

### What We Do ✅
- Hash security answers (never store plain text)
- Use bcrypt for password hashing
- Implement rate limiting to prevent abuse
- Log IP addresses for audit trail
- Time-limited verification codes (15 minutes)
- Clear codes after use
- Validate all user inputs
- Security-conscious error messages (don't reveal user existence)

### What We Don't Do ❌
- Store verification codes in plain text (stored temporarily, cleared after use)
- Reveal whether user exists in error messages
- Allow unlimited password reset attempts
- Keep expired verification codes
- Store security answers in plain text

## Testing the Security Features

### Test Rate Limiting
1. Request verification code 3 times quickly
2. Attempt 4th request → Should fail with rate limit message
3. Wait 24 hours or reset counter manually
4. Should allow new requests

### Test Cooldown
1. Complete a password reset request
2. Immediately try to request another code
3. Should fail with cooldown message
4. Wait 24 hours → Should allow new request

### Test Verification Code
1. Request code
2. Wait 16 minutes
3. Try to submit with expired code → Should fail
4. Request new code
5. Submit within 15 minutes → Should succeed

### Test Security Questions
1. Set up security questions in user settings
2. Request password reset
3. Enter wrong answer → Should fail
4. Enter correct answer → Should succeed

### Test IP Tracking
1. Submit password reset request
2. Check admin dashboard
3. Should see IP address displayed

## Future Enhancements

### Potential Additions
- SMS verification codes
- Authenticator app integration (TOTP)
- Email magic links (passwordless)
- Biometric authentication
- Risk-based authentication (location, device fingerprinting)
- Account lockout after failed attempts
- Admin notification threshold (multiple requests from same IP)
- Geo-location display for IP addresses
- Device trust (remember device for 30 days)

### Recommended Monitoring
- Track failed verification attempts
- Monitor unusual IP patterns
- Alert on multiple requests from different IPs for same user
- Log all password reset activities
- Regular security audits

## Configuration

### Environment Variables
```env
# Email Configuration (for verification codes)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Optional: Custom SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Security Constants (server/api/routes/passwordReset.js)
```javascript
const MAX_REQUESTS_PER_DAY = 3;              // Max verification codes per 24 hours
const REQUEST_COOLDOWN_HOURS = 24;           // Hours between requests
const VERIFICATION_CODE_EXPIRY_MINUTES = 15; // Code validity period
```

## Support and Troubleshooting

### Common Issues

**"You've reached the maximum number of requests"**
- Wait 24 hours from first request
- Contact admin if urgent

**"Verification code has expired"**
- Codes expire after 15 minutes
- Request a new code

**"Security answers do not match"**
- Answers are case-insensitive
- Check for typos
- Contact admin to reset security questions

**"Please wait before requesting another password reset"**
- 24-hour cooldown period active
- Contact admin if urgent

## Deployment Notes

1. **Update Environment Variables** in Render.com:
   - Add EMAIL_USER
   - Add EMAIL_PASS
   - Restart service

2. **Database Migration**:
   - New fields automatically added on first save
   - No migration script needed (Mongoose handles it)

3. **Test After Deployment**:
   - Verify email sending works
   - Test rate limiting
   - Check admin dashboard shows new fields

## Security Audit Checklist

- [ ] Verification codes expire after 15 minutes
- [ ] Rate limiting prevents more than 3 requests per 24 hours
- [ ] Cooldown enforces 24-hour wait between requests
- [ ] Security answers are hashed with bcrypt
- [ ] IP addresses are logged
- [ ] Admin sees all security metadata
- [ ] Used codes are cleared after submission
- [ ] Error messages don't reveal user existence
- [ ] Email delivery is working
- [ ] Admin notifications are sent

## Contact

For questions or security concerns, contact the development team.

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: Production Ready
