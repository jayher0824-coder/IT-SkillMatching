# Testing Guide - Skill Matching Algorithm

This guide explains how to test the specialized skill matching algorithm with realistic test data.

## Quick Start

### Step 1: Seed Test Data
Run the seed script to create test companies, jobs, and custom assessments:

```bash
npm run seed-test-data
```

Or manually:
```bash
node scripts/seed-test-data.js
```

### Step 2: Test Company Credentials
Use these credentials to login as a company and manage jobs:

| Company | Email | Password |
|---------|-------|----------|
| TechVision Solutions | hr@techvision.com | TechVision123! |
| DataDrive Analytics | careers@datadrive.com | DataDrive123! |
| CloudNet Infrastructure | recruit@cloudnet.com | CloudNet123! |
| CyberShield Security | jobs@cybershield.com | CyberShield123! |
| DatabasePro Systems | hiring@databasepro.com | DatabasePro123! |

## Test Data Overview

### 5 Test Companies Created:
1. **TechVision Solutions** - Web & Mobile Development
2. **DataDrive Analytics** - Data Analytics & Machine Learning
3. **CloudNet Infrastructure** - Cloud & DevOps
4. **CyberShield Security** - Cybersecurity
5. **DatabasePro Systems** - Database Solutions

### 9 Job Postings:
- Full Stack Web Developer (TechVision)
- Frontend Developer - React Specialist (TechVision)
- Data Analyst (DataDrive)
- Machine Learning Engineer (DataDrive)
- DevOps Engineer (CloudNet)
- Cloud Architect (CloudNet)
- Security Engineer (CyberShield)
- Database Administrator (DatabasePro)
- Backend Developer - Node.js (DatabasePro)

### 4 Jobs with Custom Q&A Assessments:

#### 1. Full Stack Web Developer Assessment
- **Duration**: 45 minutes
- **Passing Score**: 70%
- **Questions**:
  - What is the virtual DOM in React? (multiple-choice)
  - What does req.body contain? (multiple-choice)
  - How to connect to MongoDB? (short-answer)

#### 2. Data Analyst Assessment
- **Duration**: 60 minutes
- **Passing Score**: 65%
- **Questions**:
  - Which SQL statement retrieves data? (multiple-choice)
  - What does JOIN do? (multiple-choice)
  - Explain GROUP BY clause (short-answer)

#### 3. DevOps Engineer Assessment
- **Duration**: 50 minutes
- **Passing Score**: 70%
- **Questions**:
  - What is Docker? (multiple-choice)
  - What does Kubernetes do? (multiple-choice)
  - Explain CI/CD pipeline (short-answer)

#### 4. Database Administrator Assessment
- **Duration**: 55 minutes
- **Passing Score**: 72%
- **Questions**:
  - What is database indexing? (multiple-choice)
  - What is normalization? (multiple-choice)
  - INNER JOIN vs LEFT JOIN (short-answer)

## Testing the Skill Matching Algorithm

### Scenario 1: Web Developer Match
1. Create/Use a student account
2. Complete assessment with high scores in:
   - JavaScript (80%+)
   - React (75%+)
   - Node.js (75%+)
3. Go to Dashboard → "Recommended For You"
4. **Expected**: "Full Stack Web Developer" appears in recommendations
5. Click the job to see the custom Q&A assessment
6. Complete the assessment to apply

### Scenario 2: Data Professional Match
1. Create/Use a student account
2. Complete assessment with high scores in:
   - SQL (85%+)
   - Python (80%+)
   - Excel (75%+)
3. Go to Dashboard → "Recommended For You"
4. **Expected**: "Data Analyst" appears in recommendations
5. Must pass the custom SQL/Data Analysis assessment to apply

### Scenario 3: DevOps Engineer Match
1. Create/Use a student account
2. Complete assessment with high scores in:
   - Docker (80%+)
   - Kubernetes (75%+)
   - AWS (70%+)
   - Linux (75%+)
3. Go to Dashboard → "Recommended For You"
4. **Expected**: "DevOps Engineer" appears in recommendations
5. Must pass the DevOps assessment to apply

## Matching Algorithm Features Tested

✅ **Skill Name Matching** - Student skills matched against job requirements
✅ **Skill Level Compatibility** - Required level vs student's level
✅ **Priority-Based Matching** - Must-have skills vs nice-to-have
✅ **Experience Level Filtering** - Entry-level vs mid-level vs senior
✅ **Custom Assessments** - Jobs with assessments trigger Q&A requirements
✅ **Passing Score Verification** - Students must pass to apply
✅ **Multi-Category Matching** - Web Development, Data Science, DevOps, etc.

## Resetting Test Data

To clear test data and start fresh:
```bash
npm run seed-test-data
```

This will:
1. Delete all test companies and users
2. Delete all test jobs and applications
3. Delete all test custom assessments
4. Create fresh test data with same structure

## Notes

- Test companies are marked as verified
- All test jobs have status "active"
- Custom assessments have multiple-choice and short-answer questions
- Each question has a point value for scoring
- Assessments can be disabled per job if needed
- Test data does NOT affect production data

## Troubleshooting

**Issue**: Script fails to connect to MongoDB
- **Solution**: Ensure MongoDB is running and .env has correct MONGODB_URI

**Issue**: "Company not found" error
- **Solution**: Make sure companies are created before jobs. Script does this automatically.

**Issue**: Assessment questions not showing
- **Solution**: Verify CustomAssessment model has correct schema with 'technical', 'behavioral', 'situational', 'general' categories

**Issue**: Need to modify test data
- **Solution**: Edit `scripts/seed-test-data.js` and run `npm run seed-test-data` again

## Development Workflow

1. **First Time Setup**:
   ```bash
   npm install
   npm run seed-test-data
   npm run dev
   ```

2. **Testing Matching Algorithm**:
   - Use student account with specific skills
   - Check "Recommended For You" section
   - Verify correct jobs appear
   - Test custom assessments if applicable

3. **Testing Job Applications**:
   - Login as company
   - View applications in job postings
   - Check assessment results if custom assessment required

## Future Enhancements

- [ ] Seed test students with specific skill profiles
- [ ] Seed test applications with various statuses
- [ ] Add performance metrics/analytics test data
- [ ] Create bulk data for scalability testing
- [ ] Add custom difficulty levels for assessments
