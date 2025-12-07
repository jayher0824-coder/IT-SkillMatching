const mongoose = require('mongoose');
const { Assessment } = require('../server/database/models/Assessment');
require('dotenv').config();

async function checkAssessments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-ojt-platform');
    console.log('Connected to MongoDB');

    const assessments = await Assessment.find({});
    console.log(`Total assessments found: ${assessments.length}`);

    if (assessments.length > 0) {
      assessments.forEach((assessment, index) => {
        console.log(`${index + 1}. ${assessment.title}`);
        console.log(`   Category: ${assessment.category}`);
        console.log(`   Questions: ${assessment.questions.length}`);
        console.log(`   Active: ${assessment.isActive}`);
        console.log(`   ID: ${assessment._id}`);
        console.log('');
      });
    } else {
      console.log('No assessments found in database!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAssessments();
