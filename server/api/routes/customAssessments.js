const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CustomAssessment = require('../../database/models/CustomAssessment');
const CustomAssessmentSubmission = require('../../database/models/CustomAssessmentSubmission');
const Job = require('../../database/models/Job');
const { protect, authorize } = require('../../auth/middleware/auth');

// @route   POST /api/custom-assessments
// @desc    Create custom assessment for a job (Company only)
// @access  Private (Company)
router.post('/', protect, authorize('company'), async (req, res) => {
    try {
        const { jobId, title, description, duration, passingScore, questions } = req.body;

        console.log('Creating assessment:', { jobId, title, companyUser: req.user._id });

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            console.log('Invalid job ID format:', jobId);
            return res.status(400).json({ success: false, message: 'Invalid job ID format' });
        }

        // Verify the job belongs to this company
        const job = await Job.findById(jobId).populate('company');
        if (!job) {
            console.log('Job not found:', jobId);
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        console.log('Job found:', {
            jobId: job._id,
            companyId: job.company._id,
            companyUserId: job.company.user,
            currentUserId: req.user._id
        });

        // Check if the company's user ID matches the current user
        if (job.company.user.toString() !== req.user._id.toString()) {
            console.log('Authorization failed - company user mismatch');
            return res.status(403).json({ success: false, message: 'Not authorized to create assessment for this job' });
        }

        // Validate questions
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one question is required' });
        }

        // Create assessment
        const assessment = new CustomAssessment({
            company: req.user._id,
            job: jobId,
            title,
            description,
            duration: duration || 30,
            passingScore: passingScore || 60,
            questions: questions.map(q => {
                const questionData = {
                    questionText: q.questionText,
                    questionType: q.questionType || 'multiple-choice',
                    category: q.category || 'technical',
                    points: q.points || (q.questionType === 'coding' ? 5 : 1)
                };

                // Handle different question types
                if (q.questionType === 'coding') {
                    // Coding challenge
                    questionData.programmingLanguage = q.programmingLanguage;
                    questionData.difficulty = q.difficulty;
                    questionData.codeTemplate = q.codeTemplate || '';
                    
                    // Ensure test cases are in correct format
                    let testCases = q.testCases || [];
                    if (Array.isArray(testCases)) {
                        questionData.testCases = testCases.map(tc => ({
                            input: typeof tc === 'object' ? tc.input : String(tc),
                            output: typeof tc === 'object' ? tc.output : String(tc)
                        }));
                    } else {
                        questionData.testCases = [];
                    }
                    
                    questionData.timeLimit = q.timeLimit || 30;
                    // Store the correct answer or solution reference
                    questionData.correctAnswer = q.correctAnswer || '';
                } else {
                    // Traditional Q&A questions
                    questionData.options = q.options || [];
                    questionData.correctAnswer = q.correctAnswer;
                }

                return questionData;
            })
        });

        await assessment.save();
        console.log('Assessment saved:', assessment._id);

        // Update job to link to this assessment
        job.customAssessment = assessment._id;
        job.requireCustomAssessment = true;
        await job.save();
        console.log('Job updated with assessment');

        res.status(201).json({
            success: true,
            message: 'Custom assessment created successfully',
            assessment: {
                _id: assessment._id,
                title: assessment.title,
                questionCount: assessment.questions.length
            }
        });
    } catch (error) {
        console.error('Error creating custom assessment:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            validationErrors: error.errors ? Object.keys(error.errors) : 'none'
        });
        res.status(500).json({ success: false, message: 'Server error creating assessment', error: error.message });
    }
});

// @route   GET /api/custom-assessments/job/:jobId
// @desc    Get custom assessment for a job (without correct answers for students)
// @access  Private
router.get('/job/:jobId', protect, async (req, res) => {
    try {
        const { jobId } = req.params;
        console.log(`GET /job/:jobId - jobId: ${jobId}, user: ${req.user.email}, role: ${req.user.role}`);

        const assessment = await CustomAssessment.findOne({ job: jobId, isActive: true });
        console.log('Found assessment:', assessment ? assessment._id : 'None');

        if (!assessment) {
            console.log('No assessment found for job:', jobId);
            return res.status(404).json({ success: false, message: 'No assessment found for this job' });
        }

        // Hide correct answers for students
        if (req.user.role === 'student') {
            const assessmentData = assessment.toObject();
            assessmentData.questions = assessmentData.questions.map(q => {
                const { correctAnswer, ...questionWithoutAnswer } = q;
                return questionWithoutAnswer;
            });
            return res.json(assessmentData);
        }

        res.json(assessment);
    } catch (error) {
        console.error('Error fetching custom assessment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/custom-assessments/submit
// @desc    Submit custom assessment (Student only)
// @access  Private (Student)
router.post('/submit', protect, authorize('student'), async (req, res) => {
    try {
        const { assessmentId, jobId, answers, timeSpent } = req.body;

        // Get the full assessment with correct answers
        const assessment = await CustomAssessment.findById(assessmentId);
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        // Check if already submitted
        const existingSubmission = await CustomAssessmentSubmission.findOne({
            assessment: assessmentId,
            student: req.user._id,
            job: jobId
        });

        if (existingSubmission) {
            return res.status(400).json({ success: false, message: 'Assessment already submitted' });
        }

        // Grade the assessment
        let totalPoints = 0;
        let earnedPoints = 0;
        const gradedAnswers = [];

        assessment.questions.forEach((question) => {
            totalPoints += question.points;
            const studentAnswer = answers.find(a => a.questionId === question._id.toString());
            
            let isCorrect = false;
            let pointsEarned = 0;

            if (studentAnswer) {
                if (question.questionType !== 'short-answer') {
                    isCorrect = studentAnswer.answer === question.correctAnswer;
                    pointsEarned = isCorrect ? question.points : 0;
                } else {
                    isCorrect = null; // Needs manual review
                    pointsEarned = 0;
                }

                earnedPoints += pointsEarned;
            }

            gradedAnswers.push({
                questionId: question._id,
                answer: studentAnswer?.answer || '',
                isCorrect,
                pointsEarned
            });
        });

        const percentage = totalPoints ? (earnedPoints / totalPoints) * 100 : 0;
        const passed = percentage >= assessment.passingScore;

        // Create submission
        const submission = new CustomAssessmentSubmission({
            assessment: assessmentId,
            student: req.user._id,
            job: jobId,
            answers: gradedAnswers,
            score: earnedPoints,
            percentage: Math.round(percentage),
            passed,
            timeSpent
        });

        await submission.save();

        res.json({
            success: true,
            message: 'Assessment submitted successfully',
            submissionId: submission._id,
            result: {
                score: earnedPoints,
                totalPoints,
                percentage: Math.round(percentage),
                passed,
                passingScore: assessment.passingScore
            }
        });
    } catch (error) {
        console.error('Error submitting custom assessment:', error);
        res.status(500).json({ success: false, message: 'Server error submitting assessment' });
    }
});

// @route   GET /api/custom-assessments/submission/:submissionId
// @desc    Get assessment submission results (for student or company)
// @access  Private
router.get('/submission/:submissionId', protect, async (req, res) => {
    try {
        const submission = await CustomAssessmentSubmission.findById(req.params.submissionId)
            .populate('assessment')
            .populate('student', 'firstName lastName email');

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        // Authorization check
        const isStudent = req.user.role === 'student' && submission.student._id.toString() === req.user._id.toString();
        const isCompany = req.user.role === 'company' && submission.assessment.company.toString() === req.user._id.toString();

        if (!isStudent && !isCompany) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        res.json(submission);
    } catch (error) {
        console.error('Error fetching submission:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/custom-assessments/job/:jobId/submissions
// @desc    Get all submissions for a job (Company only)
// @access  Private (Company)
router.get('/job/:jobId/submissions', protect, authorize('company'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId).populate('company');
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.company.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const submissions = await CustomAssessmentSubmission.find({ job: req.params.jobId })
            .populate('student', 'firstName lastName email')
            .populate('assessment', 'title passingScore')
            .sort({ submittedAt: -1 });

        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/custom-assessments/student-status/:jobId
// @desc    Get student's assessment status for a specific job
// @access  Private (Student)
router.get('/student-status/:jobId', protect, authorize('student'), async (req, res) => {
    try {
        const { jobId } = req.params;
        const studentId = req.user._id;

        console.log(`Checking assessment status for student ${studentId} and job ${jobId}`);

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({ success: false, message: 'Invalid job ID format' });
        }

        // Check if job exists and has an assessment
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (!job.requireCustomAssessment && !job.customAssessment) {
            return res.json({ 
                success: true, 
                data: { completed: false, passed: false, hasAssessment: false } 
            });
        }

        // Find student's submission for this job
        const submission = await CustomAssessmentSubmission.findOne({
            student: studentId,
            job: jobId
        }).populate('assessment');

        if (!submission) {
            return res.json({ 
                success: true, 
                data: { completed: false, passed: false, hasAssessment: true } 
            });
        }

        const passed = submission.passed || false;
        
        console.log(`Assessment status found:`, {
            studentId,
            jobId,
            completed: true,
            passed,
            score: submission.score,
            submittedAt: submission.submittedAt
        });

        res.json({ 
            success: true, 
            data: { 
                completed: true, 
                passed: passed,
                hasAssessment: true,
                score: submission.score,
                submittedAt: submission.submittedAt
            } 
        });

    } catch (error) {
        console.error('Error checking student assessment status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Test endpoint to verify routing
router.get('/test-submissions-route', (req, res) => {
    console.log('TEST ENDPOINT HIT - Submissions route is working');
    res.json({ success: true, message: 'Submissions route is accessible' });
});

// @route   GET /api/custom-assessments/submissions/:submissionId
// @desc    Get detailed submission by ID (Company only)
// @access  Private (Company)
router.get('/submissions/:submissionId', protect, async (req, res, next) => {
    try {
        console.log('=== SUBMISSION DETAILS ENDPOINT HIT ===');
        console.log('Fetching submission:', req.params.submissionId);
        console.log('Requested by user:', req.user ? req.user._id : 'NO USER');
        console.log('User role:', req.user ? req.user.role : 'NO ROLE');
        
        // Check if user is company
        if (req.user.role !== 'company') {
            console.log('Authorization failed - user is not a company');
            return res.status(403).json({ success: false, message: 'Only companies can view submission details' });
        }
        
        const submission = await CustomAssessmentSubmission.findById(req.params.submissionId)
            .populate('student', 'firstName lastName email')
            .populate('assessment', 'title questions passingScore')
            .populate('job', 'title');

        if (!submission) {
            console.log('Submission not found');
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        console.log('Submission found:', submission._id);
        console.log('Job ID:', submission.job?._id);

        // Verify the company owns this job
        const job = await Job.findById(submission.job._id).populate('company');
        
        if (!job) {
            console.log('Job not found for submission');
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        console.log('Job company user:', job.company?.user);
        console.log('Requesting user:', req.user._id);

        if (job.company.user.toString() !== req.user._id.toString()) {
            console.log('Authorization failed - company mismatch');
            return res.status(403).json({ success: false, message: 'Not authorized to view this submission' });
        }

        console.log('Sending submission data');
        console.log('Submission object keys:', Object.keys(submission.toObject()));
        const responseData = { 
            success: true, 
            submission: submission.toObject() 
        };
        console.log('Response data:', JSON.stringify(responseData, null, 2));
        return res.json(responseData);
    } catch (error) {
        console.error('Error fetching submission details:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;
