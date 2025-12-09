const mongoose = require('mongoose');
require('dotenv').config();

const Job = require('../server/database/models/Job');

async function activateAllJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsync', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');

    // Update all draft jobs to active
    const result = await Job.updateMany(
      { status: 'draft' },
      { $set: { status: 'active' } }
    );

    console.log(`✓ Updated ${result.modifiedCount} jobs from draft to active`);

    // Count all active jobs
    const activeCount = await Job.countDocuments({ status: 'active' });
    console.log(`✓ Total active jobs: ${activeCount}`);

    mongoose.connection.close();
    console.log('\n✨ All jobs activated successfully!');
  } catch (error) {
    console.error('❌ Error activating jobs:', error);
    process.exit(1);
  }
}

activateAllJobs();
