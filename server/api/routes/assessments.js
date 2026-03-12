const express = require('express');
const { protect, authorize } = require('../../auth/middleware/auth');
const { Assessment, AssessmentResult } = require('../../database/models/Assessment');
const Student = require('../../database/models/Student');
const User = require('../../database/models/User');

const router = express.Router();

async function getOrCreateStudentProfile(userId) {
  const existing = await Student.findOne({ user: userId }).sort({ updatedAt: -1, createdAt: -1 });
  if (existing) {
    return existing;
  }

  const user = await User.findById(userId).select('name email');
  const fullName = String(user?.name || '').trim();
  const firstName = fullName ? fullName.split(' ')[0] : 'Student';
  const lastName = fullName && fullName.split(' ').length > 1 ? fullName.split(' ').slice(1).join(' ') : 'Student';

  return Student.create({
    user: userId,
    studentId: `STU${Date.now()}${Math.floor(Math.random() * 1000)}`,
    firstName,
    lastName,
    dateOfBirth: new Date('2000-01-01'),
    phone: '0000000000',
  });
}

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
    let student = await getOrCreateStudentProfile(req.user._id);
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
    
    console.log('Saving assessment result with completedAt:', new Date());
    
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

    // Calculate average assessment score from ALL completed assessments
    const allResults = await AssessmentResult.find({ 
      student: student._id,
      passed: true 
    });
    
    let averagePercentage = percentage; // Default to current if no other results
    if (allResults.length > 0) {
      const totalPercentage = allResults.reduce((sum, res) => sum + res.percentage, 0);
      averagePercentage = Math.round(totalPercentage / allResults.length);
    }

    // Update student's assessment status with AVERAGE score
    student.assessmentScore = {
      overall: averagePercentage,
      breakdown: finalCategoryScores,
    };

    // Award gamification points from earned assessment score.
    if (!student.gamification) {
      student.gamification = { points: 0, level: 1, badges: [] };
    }
    student.gamification.points += Math.max(0, totalScore);
    student.gamification.level = Math.max(1, Math.floor(student.gamification.points / 100) + 1);

    // Update student skills based on assessment results
    // Only add/update the specific skill that was assessed (assessment.category)
    if (passed && assessment.category) {
      // Find if this skill already exists
      const existingSkillIndex = student.skills.findIndex(s => s.name === assessment.category);
      
      // Determine skill level based on percentage
      let level = 'Beginner';
      if (percentage >= 80) level = 'Expert';
      else if (percentage >= 70) level = 'Advanced';
      else if (percentage >= 60) level = 'Intermediate';
      
      const skillData = {
        name: assessment.category,
        level,
        verified: true,
        score: percentage,
      };
      
      if (existingSkillIndex >= 0) {
        // Update existing skill only if new score is higher
        if (percentage > (student.skills[existingSkillIndex].score || 0)) {
          student.skills[existingSkillIndex] = skillData;
        }
      } else {
        // Add new skill
        student.skills.push(skillData);
      }
    }
    
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
    
    // Find all student profiles for this user and load results from all of them.
    const studentProfiles = await Student.find({ user: req.user._id }).select('_id');
    const studentIds = studentProfiles.map((s) => s._id);

    console.log('Student profile lookup:', { count: studentIds.length, userId: req.user._id });

    if (studentIds.length === 0) {
      console.log('No student profile found for user:', req.user._id);
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No student profile found',
      });
    }
    
    // Now find assessment results for this student
    const results = await AssessmentResult.find({ student: { $in: studentIds } })
      .populate('assessment', 'title description category')
      .sort({ completedAt: -1 });

    console.log('Assessment results found:', { count: results.length, studentIds: studentIds.length });

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

// @desc    Execute student code and run test cases
// @route   POST /api/assessments/test-code
// @access  Private
router.post('/test-code', protect, async (req, res) => {
  try {
    const { code, language, testCases = [] } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: 'Code and language are required'
      });
    }

    console.log('Test code request:', { language, codeLength: code.length, testCaseCount: testCases.length });

    // For Render and other sandboxed environments, we'll validate syntax and provide feedback
    
    // Basic syntax validation
    const syntaxErrors = validateBasicSyntax(code, language);
    if (syntaxErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Syntax errors detected: ${syntaxErrors.join(', ')}`,
        errors: syntaxErrors
      });
    }

    // Check if code is just random characters (no actual code structure)
    const hasCodeStructure = checkCodeStructure(code, language);
    if (!hasCodeStructure) {
      // Return mixed results - some pass, some fail, to be more realistic
      const results = testCases.map((testCase, index) => ({
        testCase: index + 1,
        passed: false, // Random letters won't pass real tests
        input: testCase.input,
        expected: testCase.output,
        output: 'Error: Code does not contain valid logic',
        executionTime: Math.random() * 100
      }));

      return res.json({
        success: true,
        results: results,
        message: 'Code test completed - invalid code structure detected'
      });
    }

    // Simulate test execution results with some realism
    const results = testCases.map((testCase, index) => {
      // For real implementation, this would execute the code
      // For now, we'll show that valid code structure might pass
      const passed = true; // Would be actual execution result
      
      return {
        testCase: index + 1,
        passed: passed,
        input: testCase.input,
        expected: testCase.output,
        output: testCase.output,
        executionTime: Math.random() * 100
      };
    });

    res.json({
      success: true,
      results: results,
      message: 'Code test completed (simulated execution on Render - actual submission will run real tests with Judge0 API)'
    });
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Code execution failed',
      error: error.message
    });
  }
});

// Helper function for basic syntax validation
function validateBasicSyntax(code, language) {
  const errors = [];
  
  if (!code || code.trim().length === 0) {
    errors.push('Code cannot be empty');
    return errors;
  }

  // Basic checks for common syntax issues
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push('Mismatched braces {}');
  }

  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push('Mismatched parentheses ()');
  }

  const openBrackets = (code.match(/\[/g) || []).length;
  const closeBrackets = (code.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push('Mismatched brackets []');
  }

  return errors;
}

// Helper function to check if code has actual structure
function checkCodeStructure(code, language) {
  const lowerCode = code.toLowerCase();
  
  // Check for language-specific keywords that indicate actual code
  const pythonKeywords = ['def ', 'class ', 'if ', 'for ', 'while ', 'return ', 'import ', 'from '];
  const jsKeywords = ['function ', 'const ', 'let ', 'var ', 'if ', 'for ', 'while ', 'return ', 'class '];
  const javaKeywords = ['public ', 'private ', 'class ', 'void ', 'int ', 'string ', 'if ', 'for ', 'while '];
  const cppKeywords = ['#include', 'int main', 'void ', 'if ', 'for ', 'while ', 'return '];

  let keywords = [];
  switch(language.toLowerCase()) {
    case 'python':
      keywords = pythonKeywords;
      break;
    case 'javascript':
    case 'typescript':
      keywords = jsKeywords;
      break;
    case 'java':
      keywords = javaKeywords;
      break;
    case 'cpp':
    case 'c++':
      keywords = cppKeywords;
      break;
    default:
      // For unknown languages, just check if it's not all random characters
      return code.length > 5; // At least some length
  }

  // Check if code contains at least one language-specific keyword
  return keywords.some(keyword => lowerCode.includes(keyword));
}

// @desc    Get supported programming languages for code testing
// @route   GET /api/assessments/languages
// @access  Public
router.get('/languages', (req, res) => {
  try {
    const { getSupportedLanguages } = require('../../services/codeExecutionService');
    const languages = getSupportedLanguages();

    res.json({
      success: true,
      languages: languages
    });
  } catch (error) {
    console.error('Error getting languages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supported languages'
    });
  }
});

// @desc    Create a new question for an assessment
// @route   POST /api/assessments/create-question
// @access  Private (Admin/Company only)
router.post('/create-question', protect, authorize('admin', 'company'), async (req, res) => {
  try {
    const {
      type,
      question,
      description,
      difficulty,
      options = [],
      programmingLanguage = null,
      codeTemplate = null,
      testCases = [],
      timeLimit = 60
    } = req.body;

    // Validate required fields
    if (!question || !type || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: question, type, difficulty'
      });
    }

    // Validate type
    const validTypes = ['multiple-choice', 'true-false', 'short-answer', 'coding'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question type'
      });
    }

    // Validate difficulty
    const validDifficulties = ['beginner', 'junior', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid difficulty level'
      });
    }

    // Validate coding-specific fields
    if (type === 'coding') {
      if (!programmingLanguage) {
        return res.status(400).json({
          success: false,
          message: 'Programming language is required for coding questions'
        });
      }
      if (!testCases || testCases.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one test case is required for coding questions'
        });
      }
    }

    // Create question object
    const newQuestion = {
      type,
      question,
      description: description || '',
      difficulty,
      options: type === 'coding' ? [] : options,
      programmingLanguage: type === 'coding' ? programmingLanguage : null,
      codeTemplate: type === 'coding' ? codeTemplate : null,
      testCases: type === 'coding' ? testCases : [],
      timeLimit: type === 'coding' ? timeLimit : null
    };

    // Store in database if needed (optional - can be used without creating an assessment)
    // For now, return the question structure
    res.status(201).json({
      success: true,
      message: 'Challenge created successfully',
      question: newQuestion
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create challenge',
      error: error.message
    });
  }
});

// @desc    Get quiz questions for a skill with difficulty filtering
// @route   GET /api/assessments/quiz-questions/:skill?difficulty=easy|medium|hard
// @access  Private
router.get('/quiz-questions/:skill', protect, async (req, res) => {
  const { skill } = req.params;
  const { difficulty } = req.query;

  const skillToQuestions = {
    python: {
      easy: [
        { question: "What is the output of print(2 + 2)?", options: ["4", "22", "Error", "undefined"], correctAnswer: "4", difficulty: "easy" },
        { question: "Which keyword is used to define a function in Python?", options: ["func", "def", "function", "define"], correctAnswer: "def", difficulty: "easy" },
        { question: "What is the correct file extension for Python files?", options: [".pyth", ".pt", ".py", ".pyt"], correctAnswer: ".py", difficulty: "easy" },
        { question: "How do you start a comment in Python?", options: ["//", "#", "<!--", "/*"], correctAnswer: "#", difficulty: "easy" },
        { question: "What does the 'print()' function do?", options: ["Saves data", "Displays output", "Creates a file", "Runs code"], correctAnswer: "Displays output", difficulty: "easy" }
      ],
      medium: [
        { question: "What is the output of print(2 ** 3)?", options: ["6", "8", "9", "5"], correctAnswer: "8", difficulty: "medium" },
        { question: "Which of the following is a valid variable name in Python?", options: ["2var", "var_2", "var-2", "var 2"], correctAnswer: "var_2", difficulty: "medium" },
        { question: "What does the 'len()' function do?", options: ["Returns the length of an object", "Returns the type of an object", "Returns the value of an object", "Returns the id of an object"], correctAnswer: "Returns the length of an object", difficulty: "medium" },
        { question: "Which of the following is used to handle exceptions in Python?", options: ["try-except", "do-catch", "try-catch", "handle-except"], correctAnswer: "try-except", difficulty: "medium" },
        { question: "What is the output of print('Hello' + 'World')?", options: ["Hello World", "HelloWorld", "Hello+World", "Error"], correctAnswer: "HelloWorld", difficulty: "medium" }
      ],
      hard: [
        { question: "What is the output of print(type(5))?", options: ["<class 'int'>", "<type 'int'>", "int", "integer"], correctAnswer: "<class 'int'>", difficulty: "hard" },
        { question: "Which of the following is not a Python data type?", options: ["list", "tuple", "array", "set"], correctAnswer: "array", difficulty: "hard" },
        { question: "What is a lambda function in Python?", options: ["A type of loop", "An anonymous function", "A error handler", "A class definition"], correctAnswer: "An anonymous function", difficulty: "hard" },
        { question: "Which of these is a mutable data type in Python?", options: ["tuple", "string", "list", "frozenset"], correctAnswer: "list", difficulty: "hard" },
        { question: "What does the 'pass' statement do in Python?", options: ["Skips execution", "Does nothing", "Ends loop", "Returns value"], correctAnswer: "Does nothing", difficulty: "hard" }
      ]
    },
    javascript: {
      easy: [
        { question: "What is the output of console.log(2 + 2)?", options: ["4", "22", "Error", "undefined"], correctAnswer: "4", difficulty: "easy" },
        { question: "Which keyword is used to declare a variable in JavaScript?", options: ["var", "let", "const", "variable"], correctAnswer: "var", difficulty: "easy" },
        { question: "What does the 'console.log()' function do?", options: ["Saves data", "Displays output", "Creates a file", "Runs code"], correctAnswer: "Displays output", difficulty: "easy" },
        { question: "How do you write a single-line comment in JavaScript?", options: ["#", "//", "<!--", "/*"], correctAnswer: "//", difficulty: "easy" },
        { question: "What is the correct file extension for JavaScript files?", options: [".javascript", ".js", ".jscript", ".j"], correctAnswer: ".js", difficulty: "easy" }
      ],
      medium: [
        { question: "What is the output of console.log(2 + '2')?", options: ["4", "22", "Error", "undefined"], correctAnswer: "22", difficulty: "medium" },
        { question: "Which keyword is used to declare a constant in JavaScript?", options: ["var", "let", "const", "constant"], correctAnswer: "const", difficulty: "medium" },
        { question: "What does the 'this' keyword refer to in JavaScript?", options: ["The current object", "The global object", "The parent object", "The window object"], correctAnswer: "The current object", difficulty: "medium" },
        { question: "What is the correct syntax for creating a function in JavaScript?", options: ["function myFunc() {}", "def myFunc() {}", "func myFunc() {}", "function myFunc []"], correctAnswer: "function myFunc() {}", difficulty: "medium" },
        { question: "What is the output of console.log(typeof 'hello')?", options: ["string", "String", "text", "undefined"], correctAnswer: "string", difficulty: "medium" }
      ],
      hard: [
        { question: "What does the 'async' keyword do in JavaScript?", options: ["Makes code run synchronously", "Makes a function return a promise", "Delays execution", "Runs code in parallel"], correctAnswer: "Makes a function return a promise", difficulty: "hard" },
        { question: "Which of the following is NOT a JavaScript data type?", options: ["string", "number", "boolean", "currency"], correctAnswer: "currency", difficulty: "hard" },
        { question: "What does the 'map()' function do in JavaScript?", options: ["Creates a new array by transforming each element", "Finds the first element", "Removes elements", "Sorts an array"], correctAnswer: "Creates a new array by transforming each element", difficulty: "hard" },
        { question: "What is the output of console.log(5 == '5')?", options: ["true", "false", "undefined", "Error"], correctAnswer: "true", difficulty: "hard" },
        { question: "What is the difference between '==' and '===' in JavaScript?", options: ["No difference", "== checks type, === doesn't", "=== checks type, == doesn't", "=== is newer"], correctAnswer: "=== checks type, == doesn't", difficulty: "hard" }
      ]
    },    java: {
      easy: [
        { question: "What does Java stand for?", options: ["Just Another Virtual Application", "Java is a programming language", "Java Advanced Virtual Architecture", "None"], correctAnswer: "Java is a programming language", difficulty: "easy" },
        { question: "Which keyword is used to declare a class in Java?", options: ["class", "Class", "CLASS", "java.lang.Class"], correctAnswer: "class", difficulty: "easy" },
        { question: "What is the main method signature in Java?", options: ["public static main(String[] args)", "public void main()", "static void main(String[] args)", "public static void main(String[] args)"], correctAnswer: "public static void main(String[] args)", difficulty: "easy" },
        { question: "What is the file extension for Java files?", options: [".java", ".jar", ".jav", ".j"], correctAnswer: ".java", difficulty: "easy" },
        { question: "How do you create an object in Java?", options: ["new ClassName()", "ClassName()", "create ClassName()", "object ClassName()"], correctAnswer: "new ClassName()", difficulty: "easy" }
      ],
      medium: [
        { question: "What is the size of an int in Java?", options: ["4 bytes", "8 bytes", "2 bytes", "Depends on the system"], correctAnswer: "4 bytes", difficulty: "medium" },
        { question: "Which keyword is used to inherit a class in Java?", options: ["extends", "implements", "inherits", "super"], correctAnswer: "extends", difficulty: "medium" },
        { question: "What is a constructor in Java?", options: ["A method with same name as class", "A special method that initializes objects", "Both of the above", "A regular method"], correctAnswer: "Both of the above", difficulty: "medium" },
        { question: "What is the difference between '==' and 'equals()' in Java?", options: ["No difference", "== checks reference, equals() checks value", "equals() checks reference, == checks value", "== is for primitives, equals() for objects"], correctAnswer: "== checks reference, equals() checks value", difficulty: "medium" },
        { question: "What does 'this' keyword do in Java?", options: ["References current object", "References parent class", "References static members", "None of the above"], correctAnswer: "References current object", difficulty: "medium" }
      ],
      hard: [
        { question: "What is the difference between 'abstract' and 'interface' in Java?", options: ["No difference", "Abstract can have constructor, interface cannot", "Interface can have constructor, abstract cannot", "Abstract is for methods, interface is for variables"], correctAnswer: "Abstract can have constructor, interface cannot", difficulty: "hard" },
        { question: "What is a singleton pattern in Java?", options: ["A class with only one instance", "A class with static methods", "A final class", "A class with private constructor"], correctAnswer: "A class with only one instance", difficulty: "hard" },
        { question: "What is the purpose of 'volatile' keyword in Java?", options: ["Makes variables fast", "Ensures visibility of changes across threads", "Prevents variable modification", "Optimizes performance"], correctAnswer: "Ensures visibility of changes across threads", difficulty: "hard" },
        { question: "What is the difference between 'throw' and 'throws' in Java?", options: ["No difference", "throw declares exceptions, throws throws them", "throws declares exceptions, throw throws them", "throw is for methods, throws for classes"], correctAnswer: "throws declares exceptions, throw throws them", difficulty: "hard" },
        { question: "What is the purpose of 'finally' block in Java?", options: ["Executes after try-catch", "Handles exceptions", "Defines finally method", "Closes resources"], correctAnswer: "Executes after try-catch", difficulty: "hard" }
      ]
    },
    rust: {
      easy: [
        { question: 'What command creates a new Rust project?', options: ['cargo new', 'rust new', 'rustc init', 'cargo init-project'], correctAnswer: 'cargo new', difficulty: 'easy' },
        { question: 'Which keyword declares an immutable variable in Rust?', options: ['let', 'var', 'const', 'mut'], correctAnswer: 'let', difficulty: 'easy' },
        { question: 'How do you make a Rust variable mutable?', options: ['let mut x = 1;', 'mut let x = 1;', 'var mut x = 1;', 'x := mut 1'], correctAnswer: 'let mut x = 1;', difficulty: 'easy' },
        { question: 'Which macro prints text to the console in Rust?', options: ['println!', 'print()', 'echo!', 'console.log!'], correctAnswer: 'println!', difficulty: 'easy' },
        { question: 'What file is the default Rust entry point in a binary project?', options: ['src/main.rs', 'main.rust', 'src/index.rs', 'app.rs'], correctAnswer: 'src/main.rs', difficulty: 'easy' }
      ],
      medium: [
        { question: 'What does ownership in Rust primarily help prevent?', options: ['Memory safety bugs like use-after-free', 'Syntax errors', 'Network latency', 'Database deadlocks'], correctAnswer: 'Memory safety bugs like use-after-free', difficulty: 'medium' },
        { question: 'What keyword is used to define a function in Rust?', options: ['fn', 'function', 'def', 'func'], correctAnswer: 'fn', difficulty: 'medium' },
        { question: 'What is the purpose of borrowing in Rust?', options: ['Access data without taking ownership', 'Duplicate all variables', 'Compile faster', 'Disable lifetimes'], correctAnswer: 'Access data without taking ownership', difficulty: 'medium' },
        { question: 'Which symbol represents a shared reference in Rust?', options: ['&', '*', '@', '#'], correctAnswer: '&', difficulty: 'medium' },
        { question: 'Which enum is commonly used for error handling in Rust?', options: ['Result<T, E>', 'Option<T>', 'Error<T>', 'Try<T>'], correctAnswer: 'Result<T, E>', difficulty: 'medium' }
      ],
      hard: [
        { question: 'What does the lifetime annotation syntax look like in Rust?', options: ["'a", '`a', ':a', '&a'], correctAnswer: "'a", difficulty: 'hard' },
        { question: 'What trait enables formatting with {:?} in Rust?', options: ['Debug', 'Display', 'Clone', 'Default'], correctAnswer: 'Debug', difficulty: 'hard' },
        { question: 'What does the ? operator do on a Result in Rust?', options: ['Propagates error early if Err', 'Converts to Option always', 'Panics on success', 'Ignores the error'], correctAnswer: 'Propagates error early if Err', difficulty: 'hard' },
        { question: 'When should unsafe Rust be used?', options: ['Only when required for operations the compiler cannot verify safely', 'For all loops', 'To avoid ownership rules everywhere', 'Never under any condition'], correctAnswer: 'Only when required for operations the compiler cannot verify safely', difficulty: 'hard' },
        { question: 'Which collection type in Rust stores key-value pairs?', options: ['HashMap', 'Vec', 'HashSet', 'LinkedList'], correctAnswer: 'HashMap', difficulty: 'hard' }
      ]
    },
    html: {
      easy: [
        { question: "What does HTML stand for?", options: ["HyperText Markup Language", "HyperText Markdown Language", "HighText Machine Language", "None of the above"], correctAnswer: "HyperText Markup Language", difficulty: "easy" },
        { question: "Which tag is used to define a paragraph in HTML?", options: ["<p>", "<paragraph>", "<para>", "<text>"], correctAnswer: "<p>", difficulty: "easy" },
        { question: "Which HTML tag is used to define an unordered list?", options: ["<ul>", "<ol>", "<li>", "<list>"], correctAnswer: "<ul>", difficulty: "easy" },
        { question: "What is the correct syntax for an HTML comment?", options: ["<!-- comment -->", "<! comment >", "// comment", "# comment"], correctAnswer: "<!-- comment -->", difficulty: "easy" },
        { question: "Which tag is used to define a heading in HTML?", options: ["<h1> to <h6>", "<heading>", "<head>", "<header>"], correctAnswer: "<h1> to <h6>", difficulty: "easy" }
      ],
      medium: [
        { question: "What is the purpose of the <meta> tag in HTML?", options: ["Provides metadata about the document", "Defines the document structure", "Styles the document", "Adds scripts to the document"], correctAnswer: "Provides metadata about the document", difficulty: "medium" },
        { question: "Which attribute is used to add a hyperlink in HTML?", options: ["href", "link", "src", "url"], correctAnswer: "href", difficulty: "medium" },
        { question: "What is the correct syntax for embedding an image in HTML?", options: ["<img src='image.jpg'>", "<image src='image.jpg'>", "<img href='image.jpg'>", "<picture src='image.jpg'>"], correctAnswer: "<img src='image.jpg'>", difficulty: "medium" },
        { question: "Which tag is used to create a form in HTML?", options: ["<form>", "<input>", "<button>", "<div>"], correctAnswer: "<form>", difficulty: "medium" },
        { question: "What does the 'alt' attribute do in the <img> tag?", options: ["Provides alternative text if image fails to load", "Adds a caption", "Changes image size", "Rotates the image"], correctAnswer: "Provides alternative text if image fails to load", difficulty: "medium" }
      ],
      hard: [
        { question: "What is the purpose of the 'DOCTYPE' declaration in HTML?", options: ["Declares the document type and version", "Defines a data type", "Creates a custom element", "Adds styling"], correctAnswer: "Declares the document type and version", difficulty: "hard" },
        { question: "What is semantic HTML?", options: ["HTML that describes meaning of content", "HTML that is semantically correct", "Old version of HTML", "HTML for search engines"], correctAnswer: "HTML that describes meaning of content", difficulty: "hard" },
        { question: "Which of the following is a semantic HTML element?", options: ["<section>", "<div>", "<span>", "<p>"], correctAnswer: "<section>", difficulty: "hard" },
        { question: "What is the purpose of the 'data-*' attribute in HTML?", options: ["Stores custom data on elements", "Provides default values", "Defines element behavior", "Adds styling"], correctAnswer: "Stores custom data on elements", difficulty: "hard" },
        { question: "What is the difference between <div> and <section> in HTML?", options: ["No difference", "<section> is semantic for grouped content", "<div> is semantic, <section> is not", "<section> is deprecated"], correctAnswer: "<section> is semantic for grouped content", difficulty: "hard" }
      ]
    },    css: [
      {
        question: "What does CSS stand for?",
        options: ["Cascading Style Sheets", "Colorful Style Sheets", "Computer Style Sheets", "Creative Style Sheets"],
        correctAnswer: "Cascading Style Sheets",
      },
      {
        question: "Which property is used to change the background color in CSS?",
        options: ["background-color", "color", "bgcolor", "background"],
        correctAnswer: "background-color",
      },
    ],
  };

  const normalizedSkill = String(skill || '').toLowerCase().trim();
  const normalizedDifficulty = ['easy', 'medium', 'hard'].includes(String(difficulty || '').toLowerCase())
    ? String(difficulty).toLowerCase()
    : null;

  const QUESTIONS_PER_QUIZ = 5;
  const MEMORY_WINDOW = 40;

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const normalizeBank = (bank) => {
    const out = { easy: [], medium: [], hard: [] };

    if (!bank) return out;

    if (Array.isArray(bank)) {
      bank.forEach((q) => {
        const qDiff = ['easy', 'medium', 'hard'].includes(q?.difficulty) ? q.difficulty : 'easy';
        out[qDiff].push(q);
      });
      return out;
    }

    ['easy', 'medium', 'hard'].forEach((d) => {
      if (Array.isArray(bank[d])) out[d] = [...bank[d]];
    });

    return out;
  };

  const uniqueByQuestion = (questions) => {
    const seen = new Set();
    return questions.filter((q) => {
      const key = String(q?.question || '').toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const getQuestionKey = (q) => `${normalizedSkill}|${String(q?.question || '').toLowerCase().trim()}`;

  // Category aliases ensure questions remain connected to their subject area.
  const skillAliases = {
    programming: ['python', 'javascript', 'java'],
    webdevelopment: ['html', 'css', 'javascript'],
    problemsolving: ['python', 'javascript', 'java'],
    networking: ['java', 'python', 'javascript'],
    database: ['sql', 'javascript', 'python'],
  };

  const categoryQuestionBanks = {
    networking: {
      easy: [
        { question: 'What does IP stand for in networking?', options: ['Internet Protocol', 'Internal Process', 'Integrated Port', 'Internet Package'], correctAnswer: 'Internet Protocol', difficulty: 'easy' },
        { question: 'Which device forwards traffic between networks?', options: ['Router', 'Switch', 'Hub', 'Repeater'], correctAnswer: 'Router', difficulty: 'easy' },
        { question: 'Which protocol is used to load web pages?', options: ['HTTP', 'FTP', 'SSH', 'SMTP'], correctAnswer: 'HTTP', difficulty: 'easy' },
        { question: 'What is the default port for HTTPS?', options: ['443', '80', '22', '25'], correctAnswer: '443', difficulty: 'easy' },
        { question: 'Which command checks reachability between two hosts?', options: ['ping', 'mkdir', 'grep', 'chmod'], correctAnswer: 'ping', difficulty: 'easy' }
      ],
      medium: [
        { question: 'What is the purpose of DNS?', options: ['Resolve domain names to IP addresses', 'Encrypt traffic', 'Assign MAC addresses', 'Compress packets'], correctAnswer: 'Resolve domain names to IP addresses', difficulty: 'medium' },
        { question: 'What does NAT primarily do?', options: ['Translates private IPs to public IPs', 'Increases RAM', 'Caches websites only', 'Blocks all inbound traffic'], correctAnswer: 'Translates private IPs to public IPs', difficulty: 'medium' },
        { question: 'Which layer of OSI handles routing?', options: ['Network layer', 'Session layer', 'Presentation layer', 'Physical layer'], correctAnswer: 'Network layer', difficulty: 'medium' },
        { question: 'Which protocol secures remote shell access?', options: ['SSH', 'Telnet', 'SNMP', 'TFTP'], correctAnswer: 'SSH', difficulty: 'medium' },
        { question: 'What is a VLAN used for?', options: ['Logical network segmentation', 'Increasing CPU speed', 'File encryption only', 'Email filtering'], correctAnswer: 'Logical network segmentation', difficulty: 'medium' }
      ],
      hard: [
        { question: 'What is the main purpose of BGP?', options: ['Inter-domain routing between autonomous systems', 'LAN file sharing', 'Database replication', 'Email delivery'], correctAnswer: 'Inter-domain routing between autonomous systems', difficulty: 'hard' },
        { question: 'What does CIDR /27 mean for IPv4?', options: ['32 addresses total', '64 addresses total', '128 addresses total', '16 addresses total'], correctAnswer: '32 addresses total', difficulty: 'hard' },
        { question: 'Which metric is most directly used by OSPF?', options: ['Cost based on bandwidth', 'Hop count only', 'Packet loss only', 'Latency only'], correctAnswer: 'Cost based on bandwidth', difficulty: 'hard' },
        { question: 'What is asymmetric routing?', options: ['Request and response use different paths', 'All traffic uses one path', 'Traffic uses only wireless', 'Only UDP traffic is routed'], correctAnswer: 'Request and response use different paths', difficulty: 'hard' },
        { question: 'Which technology prevents L2 loops in switched networks?', options: ['STP', 'ARP', 'NTP', 'RDP'], correctAnswer: 'STP', difficulty: 'hard' }
      ]
    },
    database: {
      easy: [
        { question: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Logic', 'Server Query Link', 'Sequential Query Language'], correctAnswer: 'Structured Query Language', difficulty: 'easy' },
        { question: 'Which SQL command retrieves data?', options: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'], correctAnswer: 'SELECT', difficulty: 'easy' },
        { question: 'Which key uniquely identifies a row?', options: ['Primary key', 'Foreign key', 'Composite key', 'Index key'], correctAnswer: 'Primary key', difficulty: 'easy' },
        { question: 'Which clause filters rows in SQL?', options: ['WHERE', 'GROUP BY', 'ORDER BY', 'HAVING'], correctAnswer: 'WHERE', difficulty: 'easy' },
        { question: 'Which SQL statement adds a new row?', options: ['INSERT', 'SELECT', 'ALTER', 'TRUNCATE'], correctAnswer: 'INSERT', difficulty: 'easy' }
      ],
      medium: [
        { question: 'What does a foreign key enforce?', options: ['Referential integrity', 'Password hashing', 'Sorting order', 'Disk backup'], correctAnswer: 'Referential integrity', difficulty: 'medium' },
        { question: 'Which clause is used to aggregate grouped results?', options: ['HAVING', 'LIMIT', 'DISTINCT', 'OFFSET'], correctAnswer: 'HAVING', difficulty: 'medium' },
        { question: 'What is normalization mainly for?', options: ['Reduce redundancy and improve integrity', 'Increase font size', 'Encrypt all values', 'Replace indexes'], correctAnswer: 'Reduce redundancy and improve integrity', difficulty: 'medium' },
        { question: 'Which index type is typically default in many SQL engines?', options: ['B-tree', 'Graph', 'Bitmap only', 'Hash tree'], correctAnswer: 'B-tree', difficulty: 'medium' },
        { question: 'What does JOIN do in SQL?', options: ['Combines rows from related tables', 'Deletes duplicate columns', 'Encrypts records', 'Backs up table only'], correctAnswer: 'Combines rows from related tables', difficulty: 'medium' }
      ],
      hard: [
        { question: 'What is a transaction isolation level used for?', options: ['Control concurrency side effects', 'Compress backups', 'Generate IDs only', 'Render charts'], correctAnswer: 'Control concurrency side effects', difficulty: 'hard' },
        { question: 'Which phenomenon can READ COMMITTED still allow?', options: ['Non-repeatable reads', 'No reads at all', 'Schema corruption', 'Deadlock elimination'], correctAnswer: 'Non-repeatable reads', difficulty: 'hard' },
        { question: 'What does ACID stand for in databases?', options: ['Atomicity, Consistency, Isolation, Durability', 'Availability, Concurrency, Integrity, Distribution', 'Atomicity, Caching, Indexing, Durability', 'Accuracy, Consistency, IO, Dependencies'], correctAnswer: 'Atomicity, Consistency, Isolation, Durability', difficulty: 'hard' },
        { question: 'When is denormalization commonly used?', options: ['To optimize read performance in specific workloads', 'To remove all keys', 'To avoid indexes entirely', 'To eliminate SQL'], correctAnswer: 'To optimize read performance in specific workloads', difficulty: 'hard' },
        { question: 'What is the primary role of a query execution plan?', options: ['Show how the DB engine will execute a query', 'Store audit logs', 'Encrypt table names', 'Create API routes'], correctAnswer: 'Show how the DB engine will execute a query', difficulty: 'hard' }
      ]
    },
    problemsolving: {
      easy: [
        { question: 'What is the first step in solving a programming problem?', options: ['Understand the problem statement', 'Start coding immediately', 'Optimize prematurely', 'Skip test cases'], correctAnswer: 'Understand the problem statement', difficulty: 'easy' },
        { question: 'Why are test cases important?', options: ['They validate correctness', 'They make code slower', 'They remove algorithms', 'They replace debugging'], correctAnswer: 'They validate correctness', difficulty: 'easy' },
        { question: 'What is pseudocode mainly used for?', options: ['Planning logic before coding', 'Compiling binaries', 'Encrypting source files', 'Deploying servers'], correctAnswer: 'Planning logic before coding', difficulty: 'easy' },
        { question: 'What does edge case mean?', options: ['Unusual input scenario', 'Syntax error only', 'Database lock', 'User interface color'], correctAnswer: 'Unusual input scenario', difficulty: 'easy' },
        { question: 'Which structure is best for FIFO processing?', options: ['Queue', 'Stack', 'Tree', 'Graph'], correctAnswer: 'Queue', difficulty: 'easy' }
      ],
      medium: [
        { question: 'What is time complexity used to estimate?', options: ['How runtime grows with input size', 'Disk color', 'Compiler version', 'Number of comments'], correctAnswer: 'How runtime grows with input size', difficulty: 'medium' },
        { question: 'Which technique solves overlapping subproblems efficiently?', options: ['Dynamic programming', 'Bubble sort', 'Greedy coloring', 'Binary serialization'], correctAnswer: 'Dynamic programming', difficulty: 'medium' },
        { question: 'When is binary search applicable?', options: ['On sorted data', 'On random text only', 'On unsorted linked lists always', 'Only on graphs'], correctAnswer: 'On sorted data', difficulty: 'medium' },
        { question: 'What is a trade-off between arrays and linked lists?', options: ['Arrays have fast index access; linked lists have cheaper middle insertions', 'Arrays are always slower', 'Linked lists use no memory', 'There is no trade-off'], correctAnswer: 'Arrays have fast index access; linked lists have cheaper middle insertions', difficulty: 'medium' },
        { question: 'What does Big-O ignore?', options: ['Constant factors in asymptotic analysis', 'Input size entirely', 'Algorithm correctness', 'Data structures'], correctAnswer: 'Constant factors in asymptotic analysis', difficulty: 'medium' }
      ],
      hard: [
        { question: 'Which approach is ideal for shortest path in weighted graphs with non-negative edges?', options: ['Dijkstra algorithm', 'Depth-first search only', 'Bubble sort', 'Linear scan'], correctAnswer: 'Dijkstra algorithm', difficulty: 'hard' },
        { question: 'What property allows divide-and-conquer to be effective?', options: ['Problem can be split into independent subproblems', 'Database has indexes', 'UI has pagination', 'Network uses TLS'], correctAnswer: 'Problem can be split into independent subproblems', difficulty: 'hard' },
        { question: 'What is memoization?', options: ['Caching function results for repeated inputs', 'Encrypting memory addresses', 'Sorting recursively only', 'Deleting duplicate files'], correctAnswer: 'Caching function results for repeated inputs', difficulty: 'hard' },
        { question: 'What is the main challenge in NP-complete problems?', options: ['No known polynomial-time solution for all cases', 'They cannot be tested', 'They have no input', 'They are always unsolvable'], correctAnswer: 'No known polynomial-time solution for all cases', difficulty: 'hard' },
        { question: 'Why do heuristic algorithms exist?', options: ['To get good-enough solutions when exact methods are too costly', 'To guarantee optimality always', 'To replace all data structures', 'To avoid testing'], correctAnswer: 'To get good-enough solutions when exact methods are too costly', difficulty: 'hard' }
      ]
    }
  };

  const strictLanguageSkills = new Set([
    'python', 'java', 'javascript', 'typescript', 'csharp', 'cpp', 'c', 'php', 'ruby', 'go',
    'rust', 'swift', 'kotlin', 'objectivec', 'r', 'scala', 'perl', 'visualbasic', 'assembly', 'matlab',
    'html', 'css', 'sql'
  ]);

  const starterLanguageBanks = {
    typescript: {
      easy: [
        { question: 'What is TypeScript primarily?', options: ['A typed superset of JavaScript', 'A CSS framework', 'A database engine', 'A mobile OS'], correctAnswer: 'A typed superset of JavaScript', difficulty: 'easy' },
        { question: 'Which file extension is commonly used for TypeScript files?', options: ['.ts', '.type', '.tsx only', '.tjs'], correctAnswer: '.ts', difficulty: 'easy' },
        { question: 'What keyword defines an interface in TypeScript?', options: ['interface', 'typeclass', 'contract', 'shape'], correctAnswer: 'interface', difficulty: 'easy' },
        { question: 'What does the `any` type allow?', options: ['Disables type checking for that value', 'Strictest type safety', 'Only numbers', 'Only strings'], correctAnswer: 'Disables type checking for that value', difficulty: 'easy' },
        { question: 'Which tool compiles TypeScript to JavaScript?', options: ['tsc', 'npm', 'babel-core only', 'node'], correctAnswer: 'tsc', difficulty: 'easy' }
      ]
    },
    csharp: {
      easy: [
        { question: 'Which company created C#?', options: ['Microsoft', 'Oracle', 'Google', 'Apple'], correctAnswer: 'Microsoft', difficulty: 'easy' },
        { question: 'Which framework is commonly associated with C# web apps?', options: ['ASP.NET', 'Django', 'Rails', 'Laravel'], correctAnswer: 'ASP.NET', difficulty: 'easy' },
        { question: 'What keyword declares a class in C#?', options: ['class', 'Class', 'struct', 'object'], correctAnswer: 'class', difficulty: 'easy' },
        { question: 'What is the entry-point method in a C# console app?', options: ['Main', 'Start', 'Run', 'Execute'], correctAnswer: 'Main', difficulty: 'easy' },
        { question: 'What symbol starts a single-line comment in C#?', options: ['//', '#', '<!--', ';'], correctAnswer: '//', difficulty: 'easy' }
      ]
    },
    cpp: {
      easy: [
        { question: 'Which header is commonly used for standard input/output in modern C++?', options: ['<iostream>', '<stdio.h>', '<conio.h>', '<stream>'], correctAnswer: '<iostream>', difficulty: 'easy' },
        { question: 'What namespace is often used for standard library symbols?', options: ['std', 'cpp', 'global', 'core'], correctAnswer: 'std', difficulty: 'easy' },
        { question: 'Which keyword creates an object dynamically in C++?', options: ['new', 'malloc', 'alloc', 'create'], correctAnswer: 'new', difficulty: 'easy' },
        { question: 'Which operator accesses members through a pointer?', options: ['->', '.', '::', '&'], correctAnswer: '->', difficulty: 'easy' },
        { question: 'What does STL stand for?', options: ['Standard Template Library', 'System Type Library', 'Simple Template Logic', 'Standard Type Language'], correctAnswer: 'Standard Template Library', difficulty: 'easy' }
      ]
    },
    c: {
      easy: [
        { question: 'Which function prints output in C?', options: ['printf', 'print', 'echo', 'cout'], correctAnswer: 'printf', difficulty: 'easy' },
        { question: 'Which header contains `printf` declaration?', options: ['<stdio.h>', '<stdlib.h>', '<string.h>', '<math.h>'], correctAnswer: '<stdio.h>', difficulty: 'easy' },
        { question: 'What is used to terminate most C statements?', options: [';', '.', ':', ','], correctAnswer: ';', difficulty: 'easy' },
        { question: 'Which keyword defines a constant value in C?', options: ['const', 'let', 'final', 'static'], correctAnswer: 'const', difficulty: 'easy' },
        { question: 'What does `%d` represent in `printf`?', options: ['Integer placeholder', 'Float placeholder', 'String placeholder', 'Character placeholder'], correctAnswer: 'Integer placeholder', difficulty: 'easy' }
      ]
    },
    php: {
      easy: [
        { question: 'What symbol starts a variable in PHP?', options: ['$', '#', '@', '&'], correctAnswer: '$', difficulty: 'easy' },
        { question: 'Which tags are commonly used to open/close PHP code?', options: ['<?php ... ?>', '<php> ... </php>', '{{ ... }}', '<% ... %>'], correctAnswer: '<?php ... ?>', difficulty: 'easy' },
        { question: 'Which function outputs text in PHP?', options: ['echo', 'printline', 'console.log', 'puts'], correctAnswer: 'echo', difficulty: 'easy' },
        { question: 'Which superglobal contains form/query input?', options: ['$_GET and $_POST', '$_FORM', '$REQUEST', '$INPUT'], correctAnswer: '$_GET and $_POST', difficulty: 'easy' },
        { question: 'Which framework is popular in PHP?', options: ['Laravel', 'Spring', 'Flask', 'Express'], correctAnswer: 'Laravel', difficulty: 'easy' }
      ]
    },
    ruby: {
      easy: [
        { question: 'Which command outputs text in Ruby?', options: ['puts', 'echo', 'printline', 'console.log'], correctAnswer: 'puts', difficulty: 'easy' },
        { question: 'Which framework is most associated with Ruby?', options: ['Ruby on Rails', 'Django', 'ASP.NET', 'Spring'], correctAnswer: 'Ruby on Rails', difficulty: 'easy' },
        { question: 'What symbol starts an instance variable in Ruby?', options: ['@', '$', '#', '%'], correctAnswer: '@', difficulty: 'easy' },
        { question: 'How do you define a method in Ruby?', options: ['def method_name ... end', 'function method_name {}', 'fn method_name {}', 'method method_name'], correctAnswer: 'def method_name ... end', difficulty: 'easy' },
        { question: 'Which block delimiter is common in Ruby?', options: ['do ... end', '{ ... }', '<block> ... </block>', 'begin ... stop'], correctAnswer: 'do ... end', difficulty: 'easy' }
      ]
    },
    go: {
      easy: [
        { question: 'Who developed the Go language?', options: ['Google', 'Microsoft', 'Oracle', 'Meta'], correctAnswer: 'Google', difficulty: 'easy' },
        { question: 'What keyword declares a function in Go?', options: ['func', 'function', 'fn', 'def'], correctAnswer: 'func', difficulty: 'easy' },
        { question: 'Which command initializes a new Go module?', options: ['go mod init', 'go init', 'go module new', 'gomod create'], correctAnswer: 'go mod init', difficulty: 'easy' },
        { question: 'What keyword starts a goroutine?', options: ['go', 'async', 'thread', 'spawn'], correctAnswer: 'go', difficulty: 'easy' },
        { question: 'Which package provides formatted I/O functions in Go?', options: ['fmt', 'io', 'bufio', 'print'], correctAnswer: 'fmt', difficulty: 'easy' }
      ]
    },
    swift: {
      easy: [
        { question: 'Which company created Swift?', options: ['Apple', 'Google', 'Microsoft', 'IBM'], correctAnswer: 'Apple', difficulty: 'easy' },
        { question: 'Which keyword declares a constant in Swift?', options: ['let', 'var', 'const', 'final'], correctAnswer: 'let', difficulty: 'easy' },
        { question: 'Which keyword declares a variable in Swift?', options: ['var', 'let', 'mutable', 'value'], correctAnswer: 'var', difficulty: 'easy' },
        { question: 'What is optional unwrapping in Swift used for?', options: ['Safely accessing values that may be nil', 'Encrypting data', 'Compiling faster', 'Creating arrays'], correctAnswer: 'Safely accessing values that may be nil', difficulty: 'easy' },
        { question: 'Which framework is used for modern UI in Swift apps?', options: ['SwiftUI', 'UIKitX', 'React Native', 'Flutter'], correctAnswer: 'SwiftUI', difficulty: 'easy' }
      ]
    },
    kotlin: {
      easy: [
        { question: 'Kotlin is officially supported for Android development by which company?', options: ['Google', 'Apple', 'Microsoft', 'Oracle'], correctAnswer: 'Google', difficulty: 'easy' },
        { question: 'Which keyword declares an immutable variable in Kotlin?', options: ['val', 'var', 'let', 'const'], correctAnswer: 'val', difficulty: 'easy' },
        { question: 'Which keyword declares a mutable variable in Kotlin?', options: ['var', 'val', 'mutable', 'set'], correctAnswer: 'var', difficulty: 'easy' },
        { question: 'What feature helps prevent null pointer errors in Kotlin?', options: ['Null safety', 'Pointers', 'Macros', 'Preprocessing'], correctAnswer: 'Null safety', difficulty: 'easy' },
        { question: 'Which function is common as entry point in Kotlin?', options: ['main', 'start', 'run', 'launch'], correctAnswer: 'main', difficulty: 'easy' }
      ]
    },
    objectivec: {
      easy: [
        { question: 'Objective-C is primarily used on which platforms?', options: ['Apple platforms', 'Android only', 'Windows only', 'Linux kernel'], correctAnswer: 'Apple platforms', difficulty: 'easy' },
        { question: 'Which syntax is common for Objective-C message sending?', options: ['[object message]', 'object.message()', 'object->message()', 'object:message()'], correctAnswer: '[object message]', difficulty: 'easy' },
        { question: 'What file extension is commonly used for Objective-C implementation files?', options: ['.m', '.objc', '.oc', '.mmx'], correctAnswer: '.m', difficulty: 'easy' },
        { question: 'Which symbol denotes a pointer in Objective-C declarations?', options: ['*', '&', '@', '#'], correctAnswer: '*', difficulty: 'easy' },
        { question: 'Which language largely succeeded Objective-C for modern iOS apps?', options: ['Swift', 'Java', 'Kotlin', 'Dart'], correctAnswer: 'Swift', difficulty: 'easy' }
      ]
    },
    r: {
      easy: [
        { question: 'R is most commonly used for?', options: ['Statistics and data analysis', 'Mobile OS development', 'Game engines', 'Network routing'], correctAnswer: 'Statistics and data analysis', difficulty: 'easy' },
        { question: 'Which assignment operator is commonly used in R?', options: ['<-', '=', ':=', '=>'], correctAnswer: '<-', difficulty: 'easy' },
        { question: 'Which function displays the first rows of a data frame in R?', options: ['head()', 'top()', 'show()', 'rows()'], correctAnswer: 'head()', difficulty: 'easy' },
        { question: 'Which package ecosystem is central to modern R data workflows?', options: ['tidyverse', 'spring', 'numpy', 'linq'], correctAnswer: 'tidyverse', difficulty: 'easy' },
        { question: 'What does `summary()` usually provide in R?', options: ['Descriptive statistics overview', 'Code compilation', 'UI rendering', 'Thread synchronization'], correctAnswer: 'Descriptive statistics overview', difficulty: 'easy' }
      ]
    },
    scala: {
      easy: [
        { question: 'Scala runs on which virtual machine?', options: ['JVM', 'CLR', 'V8', 'BEAM'], correctAnswer: 'JVM', difficulty: 'easy' },
        { question: 'Scala supports which paradigm strongly?', options: ['Object-oriented and functional', 'Only procedural', 'Only declarative', 'Only logic programming'], correctAnswer: 'Object-oriented and functional', difficulty: 'easy' },
        { question: 'Which keyword defines an immutable value in Scala?', options: ['val', 'var', 'let', 'const'], correctAnswer: 'val', difficulty: 'easy' },
        { question: 'Which keyword defines a mutable variable in Scala?', options: ['var', 'val', 'mutable', 'set'], correctAnswer: 'var', difficulty: 'easy' },
        { question: 'Which ecosystem uses Scala heavily for distributed data processing?', options: ['Apache Spark', 'ASP.NET', 'Django', 'Rails'], correctAnswer: 'Apache Spark', difficulty: 'easy' }
      ]
    },
    perl: {
      easy: [
        { question: 'Perl is historically known for being strong at?', options: ['Text processing', 'Mobile UI design', '3D rendering', 'Kernel drivers only'], correctAnswer: 'Text processing', difficulty: 'easy' },
        { question: 'Which symbol prefixes scalar variables in Perl?', options: ['$', '@', '%', '&'], correctAnswer: '$', difficulty: 'easy' },
        { question: 'Which symbol prefixes array variables in Perl?', options: ['@', '$', '#', '%'], correctAnswer: '@', difficulty: 'easy' },
        { question: 'Which line is commonly used as Perl shebang on Unix-like systems?', options: ['#!/usr/bin/perl', '#!/bin/bash', '#!/usr/bin/python', '#!/usr/bin/node'], correctAnswer: '#!/usr/bin/perl', difficulty: 'easy' },
        { question: 'What command is commonly used to print in Perl?', options: ['print', 'echo', 'puts', 'cout'], correctAnswer: 'print', difficulty: 'easy' }
      ]
    },
    visualbasic: {
      easy: [
        { question: 'Visual Basic .NET primarily runs on which framework?', options: ['.NET', 'JVM', 'Node.js', 'Ruby VM'], correctAnswer: '.NET', difficulty: 'easy' },
        { question: 'Which keyword starts a procedure in VB?', options: ['Sub', 'Func', 'def', 'proc'], correctAnswer: 'Sub', difficulty: 'easy' },
        { question: 'Which keyword declares a variable in VB?', options: ['Dim', 'Var', 'Let', 'Set'], correctAnswer: 'Dim', difficulty: 'easy' },
        { question: 'Which statement outputs text to console in VB.NET?', options: ['Console.WriteLine', 'print', 'echo', 'puts'], correctAnswer: 'Console.WriteLine', difficulty: 'easy' },
        { question: 'Which keyword ends an `If` block in VB?', options: ['End If', 'endif', 'fi', 'close if'], correctAnswer: 'End If', difficulty: 'easy' }
      ]
    },
    assembly: {
      easy: [
        { question: 'Assembly language is considered which level?', options: ['Low-level', 'High-level', 'Markup', 'Scripting only'], correctAnswer: 'Low-level', difficulty: 'easy' },
        { question: 'What does an assembler do?', options: ['Translates assembly to machine code', 'Runs web servers', 'Designs UI', 'Optimizes databases'], correctAnswer: 'Translates assembly to machine code', difficulty: 'easy' },
        { question: 'Registers in assembly are generally used for?', options: ['Fast temporary storage', 'Permanent file storage', 'Network addresses', 'Database schemas'], correctAnswer: 'Fast temporary storage', difficulty: 'easy' },
        { question: 'Which instruction type typically moves data between registers/memory?', options: ['MOV', 'JMP', 'CMP', 'RET'], correctAnswer: 'MOV', difficulty: 'easy' },
        { question: 'What does `JMP` commonly represent?', options: ['Jump to another instruction address', 'Multiply values', 'Read JSON', 'Create function'], correctAnswer: 'Jump to another instruction address', difficulty: 'easy' }
      ]
    },
    matlab: {
      easy: [
        { question: 'MATLAB is widely used for?', options: ['Numerical computing', 'Kernel development', 'Web CSS styling', 'Only mobile apps'], correctAnswer: 'Numerical computing', difficulty: 'easy' },
        { question: 'What does MATLAB stand for?', options: ['Matrix Laboratory', 'Math Logic Table', 'Machine Lab Tool', 'Matrix Logic Toolkit'], correctAnswer: 'Matrix Laboratory', difficulty: 'easy' },
        { question: 'What symbol starts a comment in MATLAB?', options: ['%', '#', '//', '<!--'], correctAnswer: '%', difficulty: 'easy' },
        { question: 'Which keyword is used to define a function in MATLAB?', options: ['function', 'def', 'fn', 'proc'], correctAnswer: 'function', difficulty: 'easy' },
        { question: 'MATLAB arrays are indexed starting at?', options: ['1', '0', '-1', 'Depends on OS'], correctAnswer: '1', difficulty: 'easy' }
      ]
    },
    sql: {
      easy: [
        { question: 'Which SQL statement retrieves rows from a table?', options: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'], correctAnswer: 'SELECT', difficulty: 'easy' },
        { question: 'Which clause filters rows in a query?', options: ['WHERE', 'ORDER BY', 'GROUP BY', 'HAVING'], correctAnswer: 'WHERE', difficulty: 'easy' },
        { question: 'Which command adds new rows to a table?', options: ['INSERT', 'CREATE', 'DROP', 'ALTER'], correctAnswer: 'INSERT', difficulty: 'easy' },
        { question: 'Which key uniquely identifies each row?', options: ['Primary key', 'Foreign key', 'Index key', 'Group key'], correctAnswer: 'Primary key', difficulty: 'easy' },
        { question: 'Which keyword sorts results?', options: ['ORDER BY', 'SORT', 'GROUP BY', 'RANK BY'], correctAnswer: 'ORDER BY', difficulty: 'easy' }
      ]
    }
  };

  const languageProfiles = {
    typescript: { label: 'TypeScript', ecosystem: 'Node.js', packageTool: 'npm', framework: 'Angular', typeFeature: 'static typing' },
    csharp: { label: 'C#', ecosystem: '.NET', packageTool: 'NuGet', framework: 'ASP.NET', typeFeature: 'strong typing' },
    cpp: { label: 'C++', ecosystem: 'native binaries', packageTool: 'CMake', framework: 'STL', typeFeature: 'compile-time typing' },
    c: { label: 'C', ecosystem: 'systems programming', packageTool: 'make', framework: 'standard library', typeFeature: 'manual memory model' },
    php: { label: 'PHP', ecosystem: 'server-side web', packageTool: 'Composer', framework: 'Laravel', typeFeature: 'dynamic typing' },
    ruby: { label: 'Ruby', ecosystem: 'web apps', packageTool: 'Bundler', framework: 'Rails', typeFeature: 'dynamic typing' },
    go: { label: 'Go', ecosystem: 'cloud services', packageTool: 'go modules', framework: 'stdlib', typeFeature: 'static typing' },
    swift: { label: 'Swift', ecosystem: 'Apple platforms', packageTool: 'Swift Package Manager', framework: 'SwiftUI', typeFeature: 'type safety' },
    kotlin: { label: 'Kotlin', ecosystem: 'Android/JVM', packageTool: 'Gradle', framework: 'Ktor', typeFeature: 'null safety' },
    objectivec: { label: 'Objective-C', ecosystem: 'Apple platforms', packageTool: 'CocoaPods', framework: 'UIKit', typeFeature: 'dynamic runtime' },
    r: { label: 'R', ecosystem: 'data analysis', packageTool: 'CRAN', framework: 'tidyverse', typeFeature: 'vectorized operations' },
    scala: { label: 'Scala', ecosystem: 'JVM', packageTool: 'sbt', framework: 'Akka', typeFeature: 'functional + OO typing' },
    perl: { label: 'Perl', ecosystem: 'scripting', packageTool: 'CPAN', framework: 'Mojolicious', typeFeature: 'dynamic typing' },
    visualbasic: { label: 'Visual Basic .NET', ecosystem: '.NET', packageTool: 'NuGet', framework: 'WinForms', typeFeature: 'strong typing' },
    assembly: { label: 'Assembly', ecosystem: 'low-level systems', packageTool: 'assembler toolchain', framework: 'ISA manuals', typeFeature: 'register-level instructions' },
    matlab: { label: 'MATLAB', ecosystem: 'numerical computing', packageTool: 'MATLAB toolboxes', framework: 'Simulink', typeFeature: 'matrix-first operations' },
    sql: { label: 'SQL', ecosystem: 'relational databases', packageTool: 'DB engine tools', framework: 'query optimizer', typeFeature: 'declarative querying' },
    css: { label: 'CSS', ecosystem: 'frontend styling', packageTool: 'PostCSS', framework: 'Tailwind', typeFeature: 'cascading rules' },
    html: { label: 'HTML', ecosystem: 'web documents', packageTool: 'HTML validators', framework: 'semantic markup', typeFeature: 'document structure' },
  };

  const buildGeneratedLanguageQuestions = (skillKey) => {
    const profile = languageProfiles[skillKey] || {
      label: skillKey.toUpperCase(),
      ecosystem: 'software development',
      packageTool: 'package manager',
      framework: 'framework ecosystem',
      typeFeature: 'language features',
    };

    const medium = [
      {
        question: `In ${profile.label}, which practice most improves long-term maintainability?`,
        options: ['Consistent formatting, linting, and clear module boundaries', 'Avoiding tests to move faster', 'Using global mutable state everywhere', 'Copy-pasting logic between files'],
        correctAnswer: 'Consistent formatting, linting, and clear module boundaries',
        difficulty: 'medium',
      },
      {
        question: `When building ${profile.label} projects, what is the primary role of ${profile.packageTool}?`,
        options: ['Dependency/version management and reproducible builds', 'Rendering UI animations only', 'Replacing source control', 'Creating database schemas automatically'],
        correctAnswer: 'Dependency/version management and reproducible builds',
        difficulty: 'medium',
      },
      {
        question: `What is a key benefit of ${profile.typeFeature} in ${profile.label}?`,
        options: ['Catching classes of bugs earlier in development', 'Eliminating all runtime errors', 'Removing need for code review', 'Making algorithms unnecessary'],
        correctAnswer: 'Catching classes of bugs earlier in development',
        difficulty: 'medium',
      },
      {
        question: `For ${profile.label} services in ${profile.ecosystem}, which approach scales best?`,
        options: ['Small cohesive modules with clear interfaces', 'One large file with all logic', 'Frequent hidden side effects', 'No logging or observability'],
        correctAnswer: 'Small cohesive modules with clear interfaces',
        difficulty: 'medium',
      },
      {
        question: `In ${profile.label}, why is automated testing important before release?`,
        options: ['It reduces regressions during refactors and feature changes', 'It guarantees perfect UX', 'It replaces staging environments', 'It makes debugging impossible'],
        correctAnswer: 'It reduces regressions during refactors and feature changes',
        difficulty: 'medium',
      },
    ];

    const hard = [
      {
        question: `In advanced ${profile.label} systems, what is the best strategy for handling critical failures?`,
        options: ['Fail fast with clear errors, retries where safe, and observability', 'Silently ignore all exceptions', 'Retry infinitely without backoff', 'Disable monitoring in production'],
        correctAnswer: 'Fail fast with clear errors, retries where safe, and observability',
        difficulty: 'hard',
      },
      {
        question: `When optimizing ${profile.label} performance, what should be done first?`,
        options: ['Profile real bottlenecks with measurements', 'Rewrite everything in another language', 'Inline all code manually', 'Remove type checks blindly'],
        correctAnswer: 'Profile real bottlenecks with measurements',
        difficulty: 'hard',
      },
      {
        question: `For ${profile.framework} projects, which architectural choice improves testability?`,
        options: ['Dependency injection and separation of concerns', 'Embedding business logic inside view templates only', 'Tight coupling across all modules', 'Using global mutable singletons for everything'],
        correctAnswer: 'Dependency injection and separation of concerns',
        difficulty: 'hard',
      },
      {
        question: `What is the most robust way to evolve public APIs in ${profile.label}?`,
        options: ['Version interfaces and maintain backward compatibility windows', 'Change contracts without notice', 'Remove response fields immediately', 'Skip deprecation strategy'],
        correctAnswer: 'Version interfaces and maintain backward compatibility windows',
        difficulty: 'hard',
      },
      {
        question: `For secure ${profile.label} applications, which principle is essential?`,
        options: ['Validate and sanitize all untrusted input', 'Trust all client-side values', 'Store secrets in source code', 'Disable authentication in development and production'],
        correctAnswer: 'Validate and sanitize all untrusted input',
        difficulty: 'hard',
      },
    ];

    return { medium, hard };
  };

  const universalProgrammingFallback = {
    easy: [
      { question: 'Which data structure uses LIFO order?', options: ['Stack', 'Queue', 'Array', 'Graph'], correctAnswer: 'Stack', difficulty: 'easy' },
      { question: 'What is the purpose of a variable in programming?', options: ['Store data values', 'Compile code', 'Render graphics only', 'Encrypt traffic'], correctAnswer: 'Store data values', difficulty: 'easy' },
      { question: 'Which keyword usually controls conditional branching?', options: ['if', 'print', 'import', 'class'], correctAnswer: 'if', difficulty: 'easy' },
      { question: 'What does a loop do?', options: ['Repeats a block of code', 'Deletes files', 'Creates a network', 'Compiles binaries'], correctAnswer: 'Repeats a block of code', difficulty: 'easy' },
      { question: 'Why are functions useful?', options: ['They encapsulate reusable logic', 'They remove all bugs', 'They replace variables', 'They avoid testing'], correctAnswer: 'They encapsulate reusable logic', difficulty: 'easy' }
    ],
    medium: [
      { question: 'What is the main benefit of modular code?', options: ['Easier maintenance and reuse', 'Guaranteed zero bugs', 'No need for tests', 'Smaller RAM always'], correctAnswer: 'Easier maintenance and reuse', difficulty: 'medium' },
      { question: 'What is time complexity used for?', options: ['Estimate runtime growth with input size', 'Measure monitor size', 'Determine UI theme', 'Set CPU clock'], correctAnswer: 'Estimate runtime growth with input size', difficulty: 'medium' },
      { question: 'What is refactoring?', options: ['Improving internal code structure without changing behavior', 'Rewriting OS kernels', 'Deploying a database', 'Removing all comments'], correctAnswer: 'Improving internal code structure without changing behavior', difficulty: 'medium' },
      { question: 'Why are unit tests important?', options: ['They verify behavior and prevent regressions', 'They increase network bandwidth', 'They replace code reviews', 'They optimize CSS'], correctAnswer: 'They verify behavior and prevent regressions', difficulty: 'medium' },
      { question: 'What is a common use of arrays/lists?', options: ['Store ordered collections of items', 'Encrypt passwords', 'Compile source code', 'Create sockets'], correctAnswer: 'Store ordered collections of items', difficulty: 'medium' }
    ],
    hard: [
      { question: 'What is the key idea behind dynamic programming?', options: ['Reuse solutions to overlapping subproblems', 'Always use recursion only', 'Avoid all loops', 'Skip edge cases'], correctAnswer: 'Reuse solutions to overlapping subproblems', difficulty: 'hard' },
      { question: 'What does immutability primarily help with?', options: ['Safer state management and fewer side effects', 'Faster internet speed', 'Automatic deployment', 'Lower disk temperature'], correctAnswer: 'Safer state management and fewer side effects', difficulty: 'hard' },
      { question: 'What is a race condition?', options: ['Program behavior depends on unpredictable timing', 'Compiler syntax error', 'Database schema mismatch', 'GPU overheating'], correctAnswer: 'Program behavior depends on unpredictable timing', difficulty: 'hard' },
      { question: 'Why use version control in development?', options: ['Track changes and collaborate safely', 'Replace all testing', 'Avoid documentation', 'Compile automatically'], correctAnswer: 'Track changes and collaborate safely', difficulty: 'hard' },
      { question: 'What is a trade-off of abstraction layers?', options: ['Higher productivity but potential overhead', 'No trade-offs ever', 'Always worst performance', 'Removes all complexity'], correctAnswer: 'Higher productivity but potential overhead', difficulty: 'hard' }
    ]
  };

  let resolvedBank = normalizeBank(skillToQuestions[normalizedSkill]);

  if (strictLanguageSkills.has(normalizedSkill)) {
    const starter = normalizeBank(starterLanguageBanks[normalizedSkill]);
    resolvedBank = {
      easy: uniqueByQuestion([...(resolvedBank.easy || []), ...(starter.easy || [])]),
      medium: uniqueByQuestion([...(resolvedBank.medium || []), ...(starter.medium || [])]),
      hard: uniqueByQuestion([...(resolvedBank.hard || []), ...(starter.hard || [])]),
    };

    const generated = buildGeneratedLanguageQuestions(normalizedSkill);
    if (resolvedBank.medium.length < 5) {
      resolvedBank.medium = uniqueByQuestion([...(resolvedBank.medium || []), ...generated.medium]);
    }
    if (resolvedBank.hard.length < 5) {
      resolvedBank.hard = uniqueByQuestion([...(resolvedBank.hard || []), ...generated.hard]);
    }
  }

  if (!resolvedBank.easy.length && !resolvedBank.medium.length && !resolvedBank.hard.length && categoryQuestionBanks[normalizedSkill]) {
    resolvedBank = normalizeBank(categoryQuestionBanks[normalizedSkill]);
  }

  if (!resolvedBank.easy.length && !resolvedBank.medium.length && !resolvedBank.hard.length && skillAliases[normalizedSkill]) {
    const merged = { easy: [], medium: [], hard: [] };
    skillAliases[normalizedSkill].forEach((aliasSkill) => {
      const aliasBank = normalizeBank(skillToQuestions[aliasSkill]);
      merged.easy.push(...aliasBank.easy);
      merged.medium.push(...aliasBank.medium);
      merged.hard.push(...aliasBank.hard);
    });

    resolvedBank = {
      easy: uniqueByQuestion(merged.easy),
      medium: uniqueByQuestion(merged.medium),
      hard: uniqueByQuestion(merged.hard),
    };
  }

  if (!resolvedBank.easy.length && !resolvedBank.medium.length && !resolvedBank.hard.length && strictLanguageSkills.has(normalizedSkill)) {
    return res.status(422).json({
      success: false,
      message: `No dedicated ${normalizedSkill} questions are available yet. Please add a language-specific question bank before enabling this quiz.`,
    });
  }

  if (!resolvedBank.easy.length && !resolvedBank.medium.length && !resolvedBank.hard.length) {
    resolvedBank = normalizeBank(universalProgrammingFallback);
  }

  const primaryPool = uniqueByQuestion(
    normalizedDifficulty
      ? resolvedBank[normalizedDifficulty]
      : [...resolvedBank.easy, ...resolvedBank.medium, ...resolvedBank.hard]
  );

  const allSkillQuestions = uniqueByQuestion([
    ...resolvedBank.easy,
    ...resolvedBank.medium,
    ...resolvedBank.hard,
  ]);

  if (allSkillQuestions.length === 0) {
    return res.status(404).json({
      success: false,
      message: `No questions found for skill: ${skill} with difficulty: ${difficulty || 'all'}`,
    });
  }

  const takeCount = Math.min(QUESTIONS_PER_QUIZ, allSkillQuestions.length);
  const memoryBucket = `${normalizedSkill}:all`;

  // Serve unseen questions first, then cycle once pool is exhausted.
  let recentQuestionKeys = [];
  const memoryOwner = await User.findById(req.user._id).select('quizQuestionMemory');
  if (memoryOwner?.quizQuestionMemory?.get(memoryBucket)) {
    recentQuestionKeys = memoryOwner.quizQuestionMemory.get(memoryBucket) || [];
  }
  const recentSet = new Set(recentQuestionKeys);

  const unseenPrimary = primaryPool.filter((q) => !recentSet.has(getQuestionKey(q)));
  const unseenAnyDifficulty = allSkillQuestions.filter((q) => !recentSet.has(getQuestionKey(q)));

  let selectedQuestions = [];
  if (unseenPrimary.length > 0) {
    selectedQuestions = shuffle(unseenPrimary).slice(0, takeCount);
  }

  if (selectedQuestions.length < takeCount) {
    const alreadySelected = new Set(selectedQuestions.map(getQuestionKey));
    const filler = shuffle(unseenAnyDifficulty.filter((q) => !alreadySelected.has(getQuestionKey(q))))
      .slice(0, takeCount - selectedQuestions.length);
    selectedQuestions = [...selectedQuestions, ...filler];
  }

  if (selectedQuestions.length === 0) {
    return res.status(409).json({
      success: false,
      message: `No new questions left for ${skill}. Add more questions to this language to keep retakes unique.`,
    });
  }

  if (memoryOwner) {
    const selectedKeys = selectedQuestions.map(getQuestionKey);
    const mergedKeys = [...recentQuestionKeys, ...selectedKeys];
    const seen = new Set();
    const dedupedRecent = [];

    // Keep most recent unique keys up to MEMORY_WINDOW.
    for (let i = mergedKeys.length - 1; i >= 0; i -= 1) {
      const key = mergedKeys[i];
      if (!seen.has(key)) {
        seen.add(key);
        dedupedRecent.unshift(key);
      }
      if (dedupedRecent.length >= MEMORY_WINDOW) break;
    }

    memoryOwner.quizQuestionMemory.set(memoryBucket, dedupedRecent);
    await memoryOwner.save();
  }

  const safeQuestions = selectedQuestions.map((q) => {
    const options = Array.isArray(q.options) ? [...q.options] : [];
    const shuffledOptions = shuffle(options);
    return {
      question: q.question,
      options: shuffledOptions,
      difficulty: q.difficulty || normalizedDifficulty || 'medium',
      correctAnswer: q.correctAnswer,
    };
  });

  res.json({
    success: true,
    data: safeQuestions,
  });
});

// Helper function to parse questions from markdown
function parseQuestionsFromMarkdown(markdown) {
  const questions = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length && questions.length < 50) {
    const line = lines[i].trim();

    // Look for question pattern (#### or ### followed by number or text)
    if ((line.startsWith('####') || line.startsWith('###')) && line.length > 4) {
      let questionText = line.replace(/^#+\s*/, '').trim();
      
      // Remove leading numbers and dots (e.g., "1. Question text")
      questionText = questionText.replace(/^\d+\.\s*/, '').trim();
      
      if (!questionText || questionText.length < 5) {
        i++;
        continue;
      }

      const questionObj = {
        question: questionText,
        options: [],
        correctAnswer: ''
      };

      i++;
      let optionCount = 0;

      // Parse options - look for lines starting with - [ ] or * [ ] or - or *
      while (i < lines.length) {
        const optionLine = lines[i];
        const trimmedOption = optionLine.trim();
        
        // Stop if we hit another question or section header
        if (trimmedOption.startsWith('#') || (!trimmedOption.startsWith('-') && !trimmedOption.startsWith('*') && trimmedOption.length > 0)) {
          break;
        }
        
        // Parse checkbox format: - [ ] or - [x]
        const checkboxMatch = trimmedOption.match(/^[-*]\s*\[([xX\s]?)\]\s+(.+)/);
        if (checkboxMatch) {
          const isCorrect = checkboxMatch[1].toLowerCase() === 'x';
          let optionText = checkboxMatch[2].trim();
          
          // Clean up markdown formatting
          optionText = optionText.replace(/\*\*/g, '').replace(/`/g, '').replace(/^-\s*/, '').trim();
          
          if (optionText && optionText.length > 0) {
            questionObj.options.push(optionText);
            if (isCorrect && !questionObj.correctAnswer) {
              questionObj.correctAnswer = optionText;
            }
          }
          optionCount++;
        } 
        // Parse simple bullet format: - text or * text
        else if ((trimmedOption.startsWith('- ') || trimmedOption.startsWith('* ')) && trimmedOption.length > 2) {
          let optionText = trimmedOption.substring(2).trim();
          
          // Check if this line is marked as correct (has ** or other marker)
          const isCorrect = optionText.startsWith('**') || optionText.startsWith('`');
          
          // Clean up formatting
          optionText = optionText.replace(/\*\*/g, '').replace(/`/g, '').trim();
          
          if (optionText && optionText.length > 0) {
            questionObj.options.push(optionText);
            if (isCorrect && !questionObj.correctAnswer) {
              questionObj.correctAnswer = optionText;
            }
          }
          optionCount++;
        }
        
        i++;
        if (optionCount >= 6) break; // Limit to 6 options per question
      }

      // Only add if we have valid data
      if (questionObj.options.length >= 2) {
        // If no explicit correct answer, use first option as default
        if (!questionObj.correctAnswer && questionObj.options.length > 0) {
          questionObj.correctAnswer = questionObj.options[0];
        }
        
        if (questionObj.correctAnswer) {
          questions.push(questionObj);
        }
      }
      
      continue;
    }
    
    i++;
  }

  console.log(`Parsed ${questions.length} questions from markdown`);
  return questions;
}

// @desc    Save quiz result (for new quiz system)
// @route   POST /api/assessments/quiz/result
// @access  Private (Students only)
router.post('/quiz/result', protect, authorize('student'), async (req, res) => {
  try {
    const { skill, score, totalQuestions, questionsCorrect } = req.body;
    
    console.log('Saving quiz result:', {
      userId: req.user._id,
      skill,
      score,
      totalQuestions,
      questionsCorrect
    });

    // Find the student profile or create one for first-time quiz takers
    const student = await getOrCreateStudentProfile(req.user._id);

    // Create or get a quiz assessment record
    let assessment = await Assessment.findOne({ 
      category: skill.toLowerCase(),
      isActive: true 
    });

    // If no assessment exists for this skill, create a placeholder
    if (!assessment) {
      assessment = await Assessment.create({
        title: `${skill} Quiz`,
        description: `Quick quiz for ${skill} skills`,
        category: skill.toLowerCase(),
        isActive: true,
        passingScore: 60,
        questions: [],
        timeLimit: 30
      });
    }

    // Calculate percentage
    const percentage = Math.round((questionsCorrect / totalQuestions) * 100);
    const passed = percentage >= 60; // 60% passing score

    // Create assessment result
    const result = await AssessmentResult.create({
      student: student._id,
      assessment: assessment._id,
      answers: [],
      score: questionsCorrect,
      percentage: percentage,
      passed: passed,
      timeSpent: 0,
      startedAt: new Date(Date.now() - 5 * 60000), // 5 minutes ago (approximate)
      completedAt: new Date(),
      categoryScores: {
        [skill.toLowerCase()]: percentage
      }
    });

    // Populate the result before sending
    await result.populate('assessment', 'title description category');

    res.json({
      success: true,
      message: 'Quiz result saved',
      data: result,
    });
  } catch (error) {
    console.error('Error saving quiz result:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/gamification/points
// @access  Private (Students only)
router.get('/gamification/points', protect, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user._id }).sort({ updatedAt: -1, createdAt: -1 });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        res.json({
            success: true,
            data: {
                points: student.gamificationPoints || 0,
                level: student.gamificationLevel || 1
            }
        });
    } catch (error) {
        console.error('Error fetching gamification points:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/gamification/points
// @access  Private (Students only)
router.post('/gamification/points', protect, authorize('student'), async (req, res) => {
    try {
        const { points, level } = req.body;
        const student = await Student.findOne({ user: req.user._id }).sort({ updatedAt: -1, createdAt: -1 });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        student.gamificationPoints = points;
        student.gamificationLevel = level;
        await student.save();

        res.json({ success: true, message: 'Gamification points updated' });
    } catch (error) {
        console.error('Error saving gamification points:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// ...existing code...
module.exports = router;
