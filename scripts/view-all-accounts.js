require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../server/database/models/User');
const Student = require('../server/database/models/Student');
const Company = require('../server/database/models/Company');

async function viewAllAccounts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-ojt-platform');
        console.log('✅ Connected to MongoDB\n');

        // Get all users
        const users = await User.find({}).sort({ createdAt: -1 });
        console.log('📊 TOTAL ACCOUNTS:', users.length);
        console.log('='.repeat(80));

        // Separate by role
        const students = users.filter(u => u.role === 'student');
        const companies = users.filter(u => u.role === 'company');
        const admins = users.filter(u => u.role === 'admin');

        console.log(`\n👨‍🎓 STUDENTS: ${students.length}`);
        console.log('='.repeat(80));
        
        for (const user of students) {
            const studentData = await Student.findOne({ userId: user._id });
            console.log(`\nID: ${user._id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Name: ${studentData?.firstName || 'N/A'} ${studentData?.lastName || 'N/A'}`);
            console.log(`Student ID: ${studentData?.studentId || 'N/A'}`);
            console.log(`Phone: ${studentData?.phone || 'N/A'}`);
            console.log(`Address: ${studentData?.address?.city || 'N/A'}, ${studentData?.address?.state || 'N/A'}`);
            console.log(`Education: ${studentData?.education?.degree || 'N/A'} - ${studentData?.education?.school || 'N/A'}`);
            console.log(`Skills: ${studentData?.skills?.technical?.join(', ') || 'None'}`);
            console.log(`Resume: ${studentData?.resume ? 'Yes' : 'No'}`);
            console.log(`Portfolio: ${studentData?.portfolio || 'N/A'}`);
            console.log(`Created: ${user.createdAt?.toLocaleDateString() || 'N/A'}`);
            console.log('-'.repeat(80));
        }

        console.log(`\n\n🏢 COMPANIES: ${companies.length}`);
        console.log('='.repeat(80));
        
        for (const user of companies) {
            const companyData = await Company.findOne({ userId: user._id });
            console.log(`\nID: ${user._id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Company Name: ${companyData?.name || 'N/A'}`);
            console.log(`Industry: ${companyData?.industry || 'N/A'}`);
            console.log(`Size: ${companyData?.size || 'N/A'}`);
            console.log(`Location: ${companyData?.location?.city || 'N/A'}, ${companyData?.location?.state || 'N/A'}`);
            console.log(`Website: ${companyData?.website || 'N/A'}`);
            console.log(`Description: ${companyData?.description?.substring(0, 100) || 'N/A'}...`);
            console.log(`Created: ${user.createdAt?.toLocaleDateString() || 'N/A'}`);
            console.log('-'.repeat(80));
        }

        console.log(`\n\n👑 ADMINS: ${admins.length}`);
        console.log('='.repeat(80));
        
        for (const user of admins) {
            console.log(`\nID: ${user._id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Created: ${user.createdAt?.toLocaleDateString() || 'N/A'}`);
            console.log('-'.repeat(80));
        }

        console.log('\n✅ Complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

viewAllAccounts();
