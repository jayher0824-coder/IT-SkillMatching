const mongoose = require('mongoose');
require('dotenv').config();

const Job = require('../server/database/models/Job');
const Company = require('../server/database/models/Company');

async function listAllJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsync', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB\n');

    // Get all jobs with company info
    const jobs = await Job.find({})
      .populate('company', 'companyName verified')
      .sort({ createdAt: -1 });

    console.log(`Total jobs in database: ${jobs.length}\n`);
    console.log('━'.repeat(80));
    
    jobs.forEach((job, index) => {
      console.log(`\n${index + 1}. ${job.title}`);
      console.log(`   Company: ${job.company?.companyName || 'Unknown'}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Verified: ${job.company?.verified ? 'Yes' : 'No'}`);
      console.log(`   Created: ${job.createdAt?.toLocaleDateString()}`);
      console.log(`   ID: ${job._id}`);
    });

    console.log('\n' + '━'.repeat(80));
    
    // Group by status
    const statusCount = {};
    jobs.forEach(job => {
      statusCount[job.status] = (statusCount[job.status] || 0) + 1;
    });
    
    console.log('\nJobs by Status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listAllJobs();
