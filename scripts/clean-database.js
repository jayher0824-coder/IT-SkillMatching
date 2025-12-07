require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../server/database/models/User');
const Student = require('../server/database/models/Student');
const Company = require('../server/database/models/Company');

async function cleanDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-ojt-platform');
        console.log('✅ Connected to MongoDB\n');

        console.log('🧹 Starting database cleanup...\n');

        // Find orphaned records (users without corresponding student/company data)
        const users = await User.find({});
        let orphanedStudents = 0;
        let orphanedCompanies = 0;
        let orphanedUsers = 0;

        console.log('Checking for orphaned records...\n');

        for (const user of users) {
            if (user.role === 'student') {
                const studentData = await Student.findOne({ userId: user._id });
                if (!studentData) {
                    console.log(`⚠️  Orphaned Student User: ${user.email} (ID: ${user._id})`);
                    orphanedStudents++;
                }
            } else if (user.role === 'company') {
                const companyData = await Company.findOne({ userId: user._id });
                if (!companyData) {
                    console.log(`⚠️  Orphaned Company User: ${user.email} (ID: ${user._id})`);
                    orphanedCompanies++;
                }
            }
        }

        // Check for student/company records without users
        const students = await Student.find({});
        for (const student of students) {
            const user = await User.findById(student.userId);
            if (!user) {
                console.log(`⚠️  Orphaned Student Data: ${student.firstName} ${student.lastName} (ID: ${student._id})`);
                orphanedUsers++;
            }
        }

        const companies = await Company.find({});
        for (const company of companies) {
            const user = await User.findById(company.userId);
            if (!user) {
                console.log(`⚠️  Orphaned Company Data: ${company.name} (ID: ${company._id})`);
                orphanedUsers++;
            }
        }

        console.log('\n📊 Cleanup Summary:');
        console.log('='.repeat(80));
        console.log(`Orphaned Student Users (user without student data): ${orphanedStudents}`);
        console.log(`Orphaned Company Users (user without company data): ${orphanedCompanies}`);
        console.log(`Orphaned Data Records (data without user): ${orphanedUsers}`);
        
        if (orphanedStudents === 0 && orphanedCompanies === 0 && orphanedUsers === 0) {
            console.log('\n✅ Database is clean! No orphaned records found.');
        } else {
            console.log('\n⚠️  Orphaned records found. Would you like to delete them?');
            console.log('Run: node scripts/delete-orphaned-records.js');
        }

        console.log('\n✅ Cleanup check complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

cleanDatabase();
