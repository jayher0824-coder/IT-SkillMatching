require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../server/database/models/User');
const Student = require('../server/database/models/Student');
const Company = require('../server/database/models/Company');

async function exportAccounts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-ojt-platform');
        console.log('✅ Connected to MongoDB\n');

        const users = await User.find({}).sort({ createdAt: -1 });
        
        const studentsData = [];
        const companiesData = [];
        const adminsData = [];

        for (const user of users) {
            const userObj = {
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            };

            if (user.role === 'student') {
                const studentData = await Student.findOne({ userId: user._id });
                studentsData.push({
                    ...userObj,
                    firstName: studentData?.firstName,
                    lastName: studentData?.lastName,
                    studentId: studentData?.studentId,
                    phone: studentData?.phone,
                    address: studentData?.address,
                    education: studentData?.education,
                    skills: studentData?.skills,
                    resume: studentData?.resume,
                    portfolio: studentData?.portfolio,
                    linkedIn: studentData?.linkedIn,
                    github: studentData?.github
                });
            } else if (user.role === 'company') {
                const companyData = await Company.findOne({ userId: user._id });
                companiesData.push({
                    ...userObj,
                    name: companyData?.name,
                    industry: companyData?.industry,
                    size: companyData?.size,
                    location: companyData?.location,
                    website: companyData?.website,
                    description: companyData?.description,
                    logo: companyData?.logo
                });
            } else if (user.role === 'admin') {
                adminsData.push(userObj);
            }
        }

        // Create exports directory if it doesn't exist
        const exportDir = path.join(__dirname, '..', 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir);
        }

        // Export to JSON files
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        
        fs.writeFileSync(
            path.join(exportDir, `students_${timestamp}.json`),
            JSON.stringify(studentsData, null, 2)
        );
        
        fs.writeFileSync(
            path.join(exportDir, `companies_${timestamp}.json`),
            JSON.stringify(companiesData, null, 2)
        );
        
        fs.writeFileSync(
            path.join(exportDir, `admins_${timestamp}.json`),
            JSON.stringify(adminsData, null, 2)
        );

        // Export summary
        const summary = {
            exportDate: new Date().toISOString(),
            totalUsers: users.length,
            students: studentsData.length,
            companies: companiesData.length,
            admins: adminsData.length
        };

        fs.writeFileSync(
            path.join(exportDir, `summary_${timestamp}.json`),
            JSON.stringify(summary, null, 2)
        );

        console.log('✅ Export complete!\n');
        console.log('📁 Files saved to:', exportDir);
        console.log(`   - students_${timestamp}.json (${studentsData.length} records)`);
        console.log(`   - companies_${timestamp}.json (${companiesData.length} records)`);
        console.log(`   - admins_${timestamp}.json (${adminsData.length} records)`);
        console.log(`   - summary_${timestamp}.json\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

exportAccounts();
