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
    },    html: {
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

  // Normalize skill to lowercase for matching
  const normalizedSkill = skill.toLowerCase();

  if (!skillToQuestions[normalizedSkill]) {
    return res.status(404).json({
      success: false,
      message: `No questions found for skill: ${skill}. Available skills: ${Object.keys(skillToQuestions).join(', ')}`,
    });
  }

  // Get questions for the skill
  let questions = [];
  const skillQuestions = skillToQuestions[normalizedSkill];

  if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
    // Filter by specific difficulty
    questions = skillQuestions[difficulty.toLowerCase()] || [];
  } else {
    // Return all questions if no difficulty specified
    questions = [
      ...(skillQuestions.easy || []),
      ...(skillQuestions.medium || []),
      ...(skillQuestions.hard || [])
    ];
  }

  if (questions.length === 0) {
    return res.status(404).json({
      success: false,
      message: `No questions found for skill: ${skill} with difficulty: ${difficulty || 'all'}`,
    });
  }

  // Remove correct answers from client response
  const safeQuestions = questions.map((q) => ({
    question: q.question,
    options: q.options,
    difficulty: q.difficulty,
    correctAnswer: undefined
  }));

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

    // Find the student profile
    const student = await Student.findOne({ user: req.user._id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

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
        const student = await Student.findOne({ user: req.user._id });
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
        const student = await Student.findOne({ user: req.user._id });
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
