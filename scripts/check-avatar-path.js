const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('../server/database/models/Student');

async function checkAvatarPath() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsync', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB\n');

    // Find student with avatar (without populate to avoid schema error)
    const students = await Student.find({ 'avatar.path': { $exists: true } })
      .limit(5);

    console.log(`Found ${students.length} students with avatars:\n`);
    
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.firstName} ${student.lastName}`);
      console.log(`   Student ID: ${student.studentId}`);
      console.log(`   Avatar Path: ${student.avatar?.path}`);
      console.log(`   Avatar Filename: ${student.avatar?.filename}`);
      console.log(`   Uploaded At: ${student.avatar?.uploadedAt}\n`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAvatarPath();
