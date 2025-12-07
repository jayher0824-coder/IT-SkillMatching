const express = require('express');
const { protect, authorize } = require('../../auth/middleware/auth');
const { Assessment, AssessmentResult } = require('../../database/models/Assessment');
const Student = require('../../database/models/Student');
const User = require('../../database/models/User');

const router = express.Router();

// @desc    Get available assessments
// @route   GET /api/assessments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { category } = req.query;
    
    // If category is requested, find assessment by category
    if (category) {
      // First, try to find an assessment with matching category
      let assessment = await Assessment.findOne({ isActive: true, category: category })
        .sort({ createdAt: -1 });
      
      // If no direct category match, fall back to the old filtering method
      if (!assessment) {
        const generalAssessment = await Assessment.findOne({ isActive: true, category: 'general' })
          .sort({ createdAt: -1 });
        
        if (!generalAssessment) {
          return res.json({
            success: true,
            count: 0,
            data: [],
          });
        }
        
        // Filter questions by category and create a category-specific assessment
        const categoryQuestions = generalAssessment.questions.filter(q => q.category === category);
        
        if (categoryQuestions.length === 0) {
          return res.json({
            success: true,
            count: 0,
            data: [],
          });
        }
        
        // Create a category-specific assessment object
        const categoryAssessment = {
          _id: generalAssessment._id,
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Assessment`,
          description: `Assessment for ${category} skills`,
          questions: categoryQuestions.map(q => {
            const qObj = q.toObject();
            delete qObj.correctAnswer; // Remove correct answers from client response
            return qObj;
          }),
          timeLimit: generalAssessment.timeLimit,
          passingScore: generalAssessment.passingScore,
          totalPoints: categoryQuestions.reduce((sum, q) => sum + q.points, 0),
          category: category,
          isActive: generalAssessment.isActive,
          createdAt: generalAssessment.createdAt
        };
        
        return res.json({
          success: true,
          count: 1,
          data: [categoryAssessment],
        });
      }
      
      // Found a direct category match - return it without correct answers
      const assessmentObj = assessment.toObject();
      assessmentObj.questions = assessmentObj.questions.map(q => {
        const qCopy = { ...q };
        delete qCopy.correctAnswer;
        return qCopy;
      });
      
      return res.json({
        success: true,
        count: 1,
        data: [assessmentObj],
      });
    }
    
    // If no category, return the general assessment with all questions
    const assessment = await Assessment.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .select('-questions.correctAnswer');
    
    res.json({
      success: true,
      count: assessment ? 1 : 0,
      data: assessment ? [assessment] : [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get assessment statistics
// @route   GET /api/assessments/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    // Count total assessment results (completed assessments)
    const totalAssessmentsTaken = await AssessmentResult.countDocuments();
    
    // Count unique students who have taken assessments
    const uniqueStudents = await AssessmentResult.distinct('student');
    
    // Calculate total skills assessed (questions answered)
    const totalSkillsAssessed = await AssessmentResult.aggregate([
      { $project: { answerCount: { $size: '$answers' } } },
      { $group: { _id: null, total: { $sum: '$answerCount' } } }
    ]);
    
    // Get passing rate
    const passedAssessments = await AssessmentResult.countDocuments({ passed: true });
    const passingRate = totalAssessmentsTaken > 0 
      ? ((passedAssessments / totalAssessmentsTaken) * 100).toFixed(1)
      : 0;
    
    // Get average score
    const avgScore = await AssessmentResult.aggregate([
      { $group: { _id: null, avgPercentage: { $avg: '$percentage' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalAssessmentsTaken,
        uniqueStudents: uniqueStudents.length,
        totalSkillsAssessed: totalSkillsAssessed[0]?.total || 0,
        passingRate: parseFloat(passingRate),
        averageScore: avgScore[0]?.avgPercentage ? avgScore[0].avgPercentage.toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching assessment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get assessment by ID
// @route   GET /api/assessments/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id).select('-questions.correctAnswer');
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found',
      });
    }

    res.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Submit assessment
// @route   POST /api/assessments/:id/submit
// @access  Private (Students only)
router.post('/:id/submit', protect, authorize('student'), async (req, res) => {
  try {
    const { answers, startedAt } = req.body;
    const assessmentId = req.params.id;
    
    // Helper function to normalize answers for comparison
    const normalizeAnswer = (answer) => {
      if (answer === null || answer === undefined) return '';
      return String(answer).toLowerCase().trim();
    };
    
    console.log('Assessment submission received:', {
      assessmentId,
      userId: req.user._id,
      answersCount: answers?.length,
      startedAt
    });

    // Validate input
    if (!answers || !Array.isArray(answers)) {
      console.error('Invalid answers format:', answers);
      return res.status(400).json({
        success: false,
        message: 'Invalid answers format',
      });
    }

    if (!startedAt) {
      console.error('Missing startedAt timestamp');
      return res.status(400).json({
        success: false,
        message: 'Missing startedAt timestamp',
      });
    }
    
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      console.error('Assessment not found:', assessmentId);
      return res.status(404).json({
        success: false,
        message: 'Assessment not found',
      });
    }

    // Allow multiple attempts - just track them all
    // (removed duplicate prevention to allow retakes for different categories)

    // Calculate score
    let totalScore = 0;
    let totalPoints = 0;
    const categoryScores = {
      programming: { score: 0, total: 0 },
      database: { score: 0, total: 0 },
      webDevelopment: { score: 0, total: 0 },
      networking: { score: 0, total: 0 },
      problemSolving: { score: 0, total: 0 },
    };

    const processedAnswers = answers.map((answer, index) => {
      // Skip null or undefined answers
      if (!answer) {
        console.log(`Skipping null answer at index ${index}`);
        return {
          questionId: null,
          answer: null,
          isCorrect: false,
          points: 0,
        };
      }

      // Prefer questionId mapping to ensure correct grading regardless of client ordering
      let question = null;
      if (answer.questionId) {
        try {
          question = assessment.questions.id(answer.questionId);
        } catch (e) { 
          console.log(`Question not found by ID: ${answer.questionId}`);
        }
      }
      if (!question) {
        question = assessment.questions[index];
      }
      if (!question) {
        console.log(`No question found for index ${index}`);
        return {
          questionId: answer.questionId || null,
          answer: answer.answer,
          isCorrect: false,
          points: 0,
        };
      }

      const isCorrect = normalizeAnswer(answer.answer) === normalizeAnswer(question.correctAnswer);
      const points = isCorrect ? question.points : 0;
      
      console.log(`Question ${index + 1}:`, {
        userAnswer: answer.answer,
        correctAnswer: question.correctAnswer,
        normalizedUser: normalizeAnswer(answer.answer),
        normalizedCorrect: normalizeAnswer(question.correctAnswer),
        isCorrect,
        points,
        category: question.category
      });
      
      totalScore += points;
      totalPoints += question.points;
      
      // Add to category score
      if (categoryScores[question.category]) {
        categoryScores[question.category].score += points;
        categoryScores[question.category].total += question.points;
      }

      return {
        questionId: question._id,
        answer: answer.answer,
        isCorrect,
        points,
      };
    });

    const percentage = Math.round((totalScore / totalPoints) * 100);
    const passed = percentage >= assessment.passingScore;

    // Calculate category percentages
    const finalCategoryScores = {};
    Object.keys(categoryScores).forEach(category => {
      const categoryData = categoryScores[category];
      finalCategoryScores[category] = categoryData.total > 0 
        ? Math.round((categoryData.score / categoryData.total) * 100) 
        : 0;
    });

    // Get or create student profile first
    let student = await Student.findOne({ user: req.user._id });
    console.log('Student lookup result:', { found: !!student, userId: req.user._id });
    
    if (!student) {
      // Create student profile if it doesn't exist
      console.log('Creating new student profile for user:', req.user._id);
      const user = await User.findById(req.user._id);
      console.log('User details:', { id: user._id, name: user.name, email: user.email });
      
      student = await Student.create({
        user: req.user._id,
        studentId: `STU${Date.now()}`,
        firstName: user.name?.split(' ')[0] || 'Unknown',
        lastName: user.name?.split(' ')[1] || 'Student',
        dateOfBirth: new Date('2000-01-01'),
        phone: '0000000000',
      });
      console.log('Created student profile:', { studentId: student._id, studentNumber: student.studentId });
    }

    // Create assessment result with correct student ID
    console.log('Creating assessment result with:', {
      studentId: student._id,
      assessmentId,
      score: totalScore,
      percentage,
      passed
    });
    
    const result = await AssessmentResult.create({
      student: student._id,
      assessment: assessmentId,
      answers: processedAnswers,
      score: totalScore,
      percentage,
      passed,
      timeSpent: Math.round((Date.now() - new Date(startedAt)) / 60000), // in minutes
      startedAt: new Date(startedAt),
      completedAt: new Date(),
      categoryScores: finalCategoryScores,
    });
    
    console.log('Assessment result created successfully:', { resultId: result._id });

    // Update student's assessment status
    student.assessmentScore = {
      overall: percentage,
      breakdown: finalCategoryScores,
    };

    // Update student skills based on assessment results
    const skillUpdates = [];
    Object.keys(finalCategoryScores).forEach(category => {
      const score = finalCategoryScores[category];
      let level = 'Beginner';
      
      if (score >= 80) level = 'Expert';
      else if (score >= 70) level = 'Advanced';
      else if (score >= 60) level = 'Intermediate';
      
      skillUpdates.push({
        name: category,
        level,
        verified: true,
        score,
      });
    });

    student.skills = skillUpdates;
    await student.save();

    res.json({
      success: true,
      data: {
        score: totalScore,
        percentage,
        passed,
        categoryScores: finalCategoryScores,
        result: result._id,
      },
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
});

// @desc    Get student's assessment results
// @route   GET /api/assessments/results/me
// @access  Private (Students only)
router.get('/results/me', protect, authorize('student'), async (req, res) => {
  try {
    console.log('Fetching assessment results for user:', req.user._id);
    
    // First, find the student profile for this user
    const Student = require('../../database/models/Student');
    const student = await Student.findOne({ user: req.user._id });
    
    console.log('Student profile lookup:', { found: !!student, studentId: student?._id });
    
    if (!student) {
      console.log('No student profile found for user:', req.user._id);
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No student profile found',
      });
    }
    
    // Now find assessment results for this student
    const results = await AssessmentResult.find({ student: student._id })
      .populate('assessment', 'title description category')
      .sort({ completedAt: -1 });

    console.log('Assessment results found:', { count: results.length, studentId: student._id });

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching student results:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/assessments/results/:id
// @desc    Get a single assessment result by ID (Student can view their own)
// @access  Private (Students only)
router.get('/results/:id', protect, authorize('student'), async (req, res) => {
  try {
    const result = await AssessmentResult.findById(req.params.id)
      .populate({
        path: 'assessment',
        select: '+questions.correctAnswer' // Explicitly include correctAnswer for results review
      })
      .populate({
        path: 'student',
        select: 'firstName lastName email user',
      });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Assessment result not found',
      });
    }

    // Check if student data exists
    if (!result.student) {
      console.error('Student data not found for result:', req.params.id);
      return res.status(500).json({
        success: false,
        message: 'Student data not found for this assessment result',
      });
    }

    // Check if the student owns this result (compare User IDs)
    if (result.student.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this assessment result',
      });
    }

    // Enrich answers with question text and correct answer for review
    if (result.assessment && result.assessment.questions) {
      console.log('Enriching answers with questions...');
      console.log('Total questions in assessment:', result.assessment.questions.length);
      console.log('Sample question:', result.assessment.questions[0]);
      
      result.answers = result.answers.map((answer, index) => {
        const question = result.assessment.questions.id(answer.questionId);
        console.log(`Question ${index + 1}:`, {
          questionId: answer.questionId,
          found: !!question,
          correctAnswer: question?.correctAnswer,
          hasCorrectAnswer: question && 'correctAnswer' in question
        });
        
        const correctAnswer = question?.correctAnswer || question?.correct_answer || 'N/A';
        const userAnswer = answer.answer;
        
        // Recalculate isCorrect by comparing answers (case-insensitive, trimmed)
        const isCorrect = correctAnswer && userAnswer && 
                         correctAnswer.toString().trim().toLowerCase() === userAnswer.toString().trim().toLowerCase();
        
        return {
          ...answer.toObject(),
          question: question?.question || 'Question not found',
          correctAnswer: correctAnswer,
          userAnswer: userAnswer,
          selectedAnswer: userAnswer,
          explanation: question?.explanation || null,
          isCorrect: isCorrect, // Recalculated correctness
          correct: isCorrect // Also set 'correct' field for compatibility
        };
      });
    }

    // Convert result to plain object to preserve enriched answers
    const resultObject = result.toObject();
    
    // Log what we're sending back
    console.log('\n=== SENDING RESPONSE ===');
    console.log('Total answers:', resultObject.answers?.length);
    if (resultObject.answers && resultObject.answers.length > 0) {
      console.log('Sample answer (first):', {
        question: resultObject.answers[0].question?.substring(0, 50),
        userAnswer: resultObject.answers[0].userAnswer,
        correctAnswer: resultObject.answers[0].correctAnswer,
        isCorrect: resultObject.answers[0].isCorrect
      });
    }
    
    res.json({
      success: true,
      data: resultObject,
    });
  } catch (error) {
    console.error('Error fetching assessment result:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Create assessment (Admin only)
// @route   POST /api/assessments
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const assessment = await Assessment.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Initialize default assessment
// @route   POST /api/assessments/init
// @access  Private (Admin only)
router.post('/init', protect, authorize('admin'), async (req, res) => {
  try {
    const existingAssessment = await Assessment.findOne({ title: 'IT Skills Assessment' });
    if (existingAssessment) {
      return res.json({
        success: true,
        message: 'Default assessment already exists',
        data: existingAssessment,
      });
    }

    const defaultQuestions = [
      {
        question: 'Which of the following is a JavaScript framework?',
        type: 'multiple-choice',
        options: ['React', 'HTML', 'CSS', 'MySQL'],
        correctAnswer: 'React',
        difficulty: 'easy',
        category: 'webDevelopment',
        points: 1,
        explanation: 'React is a popular JavaScript library for building user interfaces.',
      },
      {
        question: 'What does SQL stand for?',
        type: 'multiple-choice',
        options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language'],
        correctAnswer: 'Structured Query Language',
        difficulty: 'easy',
        category: 'database',
        points: 1,
        explanation: 'SQL stands for Structured Query Language, used for managing relational databases.',
      },
      {
        question: 'Which protocol is used for secure web communication?',
        type: 'multiple-choice',
        options: ['HTTP', 'HTTPS', 'FTP', 'SMTP'],
        correctAnswer: 'HTTPS',
        difficulty: 'easy',
        category: 'networking',
        points: 1,
        explanation: 'HTTPS (HTTP Secure) uses SSL/TLS encryption for secure web communication.',
      },
      {
        question: 'What is the time complexity of binary search?',
        type: 'multiple-choice',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctAnswer: 'O(log n)',
        difficulty: 'medium',
        category: 'problemSolving',
        points: 2,
        explanation: 'Binary search has O(log n) time complexity as it eliminates half the search space in each iteration.',
      },
      {
        question: 'Which of the following is a server-side programming language?',
        type: 'multiple-choice',
        options: ['JavaScript', 'HTML', 'CSS', 'Python'],
        correctAnswer: 'Python',
        difficulty: 'easy',
        category: 'programming',
        points: 1,
        explanation: 'Python is a server-side programming language, though JavaScript can also run on servers with Node.js.',
      },
    ];

    const assessment = await Assessment.create({
      title: 'IT Skills Assessment',
      description: 'General assessment to evaluate IT skills across various domains',
      questions: defaultQuestions,
      timeLimit: 30,
      passingScore: 60,
      category: 'general',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Default assessment created successfully',
      data: assessment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
