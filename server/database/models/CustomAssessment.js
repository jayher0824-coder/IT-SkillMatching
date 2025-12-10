const mongoose = require('mongoose');

const customAssessmentSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    duration: {
        type: Number, // in minutes
        default: 30
    },
    passingScore: {
        type: Number,
        default: 60,
        min: 0,
        max: 100
    },
    questions: [{
        questionText: {
            type: String,
            required: true
        },
        questionType: {
            type: String,
            enum: ['multiple-choice', 'true-false', 'short-answer', 'coding'],
            default: 'multiple-choice'
        },
        options: [String], // For multiple choice
        correctAnswer: String, // The correct option or answer
        points: {
            type: Number,
            default: 1
        },
        category: {
            type: String,
            enum: ['technical', 'behavioral', 'situational', 'general'],
            default: 'technical'
        },
        // Coding challenge specific fields
        programmingLanguage: String, // e.g., 'python', 'javascript'
        difficulty: String, // e.g., 'beginner', 'intermediate', 'advanced'
        codeTemplate: String, // Starter code for candidates
        testCases: [{
            input: String,
            output: String
        }],
        timeLimit: Number // Time limit in seconds
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CustomAssessment', customAssessmentSchema);
