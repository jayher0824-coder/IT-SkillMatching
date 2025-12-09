/**
 * Seed Test Data Script
 * Creates fake companies, jobs, and students to test the skill matching algorithm
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
const Company = require('../server/database/models/Company');
const Job = require('../server/database/models/Job');
const Student = require('../server/database/models/Student');
const User = require('../server/database/models/User');
const CustomAssessment = require('../server/database/models/CustomAssessment');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-ojt-platform')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const testCompanies = [
    {
        companyName: 'TechVision Solutions',
        email: 'hr@techvision.com',
        password: 'TechVision123!',
        industry: 'Software Development',
        companySize: '51-200',
        description: 'Leading software development company specializing in web and mobile applications.',
        website: 'https://techvision.com',
        location: {
            city: 'Manila',
            province: 'Metro Manila',
            country: 'Philippines'
        },
        specialization: ['Web Development', 'Mobile Development', 'Cloud Solutions']
    },
    {
        companyName: 'DataDrive Analytics',
        email: 'careers@datadrive.com',
        password: 'DataDrive123!',
        industry: 'Data Analytics',
        companySize: '51-200',
        description: 'Big data and analytics solutions for enterprise clients.',
        website: 'https://datadrive.com',
        location: {
            city: 'Cebu',
            province: 'Cebu',
            country: 'Philippines'
        },
        specialization: ['Data Analytics', 'Machine Learning', 'Business Intelligence']
    },
    {
        companyName: 'CloudNet Infrastructure',
        email: 'recruit@cloudnet.com',
        password: 'CloudNet123!',
        industry: 'Cloud Services',
        companySize: '201-500',
        description: 'Cloud infrastructure and DevOps solutions provider.',
        website: 'https://cloudnet.com',
        location: {
            city: 'Quezon City',
            province: 'Metro Manila',
            country: 'Philippines'
        },
        specialization: ['Cloud Computing', 'DevOps', 'System Administration']
    },
    {
        companyName: 'CyberShield Security',
        email: 'jobs@cybershield.com',
        password: 'CyberShield123!',
        industry: 'Cybersecurity',
        companySize: '11-50',
        description: 'Enterprise cybersecurity and information security solutions.',
        website: 'https://cybershield.com',
        location: {
            city: 'BGC',
            province: 'Metro Manila',
            country: 'Philippines'
        },
        specialization: ['Cybersecurity', 'Network Security', 'Penetration Testing']
    },
    {
        companyName: 'DatabasePro Systems',
        email: 'hiring@databasepro.com',
        password: 'DatabasePro123!',
        industry: 'Database Solutions',
        companySize: '11-50',
        description: 'Database design, optimization, and management solutions.',
        website: 'https://databasepro.com',
        location: {
            city: 'Makati',
            province: 'Metro Manila',
            country: 'Philippines'
        },
        specialization: ['Database Administration', 'SQL Optimization', 'NoSQL']
    }
];

const testJobs = [
    // TechVision Solutions - Web Development
    {
        title: 'Full Stack Web Developer',
        companyName: 'TechVision Solutions',
        description: 'Looking for a skilled full stack developer with expertise in React and Node.js. You will work on building modern web applications.',
        skillsRequired: [
            { name: 'JavaScript', level: 'Advanced', priority: 'must-have' },
            { name: 'React', level: 'Advanced', priority: 'must-have' },
            { name: 'Node.js', level: 'Intermediate', priority: 'must-have' },
            { name: 'MongoDB', level: 'Intermediate', priority: 'nice-to-have' },
            { name: 'HTML/CSS', level: 'Intermediate', priority: 'must-have' }
        ],
        requirements: ['2+ years experience', 'Bachelor\'s degree in CS or related field'],
        location: { city: 'Manila', country: 'Philippines', remote: false },
        jobType: 'full-time',
        experienceLevel: 'mid-level',
        salary: { min: 60000, max: 100000, currency: 'PHP', period: 'monthly' },
        status: 'active'
    },
    {
        title: 'Frontend Developer - React Specialist',
        companyName: 'TechVision Solutions',
        description: 'Join our frontend team to build beautiful and responsive user interfaces using React and modern CSS.',
        skillsRequired: [
            { name: 'React', level: 'Advanced', priority: 'must-have' },
            { name: 'JavaScript', level: 'Advanced', priority: 'must-have' },
            { name: 'CSS', level: 'Advanced', priority: 'must-have' },
            { name: 'TypeScript', level: 'Intermediate', priority: 'nice-to-have' }
        ],
        requirements: ['1+ years React experience', 'Strong CSS skills'],
        location: { city: 'Manila', country: 'Philippines', remote: true },
        jobType: 'full-time',
        experienceLevel: 'junior',
        salary: { min: 50000, max: 80000, currency: 'PHP', period: 'monthly' },
        status: 'active'
    },

    // DataDrive Analytics - Data & Machine Learning
    {
        title: 'Data Analyst',
        companyName: 'DataDrive Analytics',
        description: 'Analyze large datasets and create insights for business intelligence. Work with SQL, Python, and Tableau.',
        skillsRequired: [
            { name: 'SQL', level: 'Advanced', priority: 'must-have' },
            { name: 'Python', level: 'Intermediate', priority: 'must-have' },
            { name: 'Excel', level: 'Advanced', priority: 'must-have' },
            { name: 'Tableau', level: 'Intermediate', priority: 'nice-to-have' },
            { name: 'Statistics', level: 'Intermediate', priority: 'must-have' }
        ],
        requirements: ['Strong analytical skills', 'Comfortable with databases'],
        location: { city: 'Cebu', country: 'Philippines', remote: true },
        jobType: 'full-time',
        experienceLevel: 'junior',
        salary: { min: 45000, max: 75000, currency: 'PHP', period: 'monthly' },
        status: 'active'
    },
    {
        title: 'Machine Learning Engineer',
        companyName: 'DataDrive Analytics',
        description: 'Develop ML models to solve business problems and improve operations using Python and TensorFlow.',
        skillsRequired: [
            { name: 'Python', level: 'Advanced', priority: 'must-have' },
            { name: 'Machine Learning', level: 'Advanced', priority: 'must-have' },
            { name: 'TensorFlow', level: 'Intermediate', priority: 'must-have' },
            { name: 'SQL', level: 'Intermediate', priority: 'nice-to-have' },
            { name: 'Statistics', level: 'Advanced', priority: 'must-have' }
        ],
        requirements: ['ML fundamentals', 'Python proficiency'],
        location: { city: 'Cebu', country: 'Philippines', remote: true },
        jobType: 'full-time',
        experienceLevel: 'mid-level',
        salary: { min: 70000, max: 120000, currency: 'PHP', period: 'monthly' },
        status: 'active'
    },

    // CloudNet Infrastructure - DevOps & Cloud
    {
        title: 'DevOps Engineer',
        companyName: 'CloudNet Infrastructure',
        description: 'Manage cloud infrastructure, CI/CD pipelines, and deployment systems. Work with Docker, Kubernetes, and AWS.',
        skillsRequired: [
            { name: 'Docker', level: 'Advanced', priority: 'must-have' },
            { name: 'Kubernetes', level: 'Advanced', priority: 'must-have' },
            { name: 'AWS', level: 'Intermediate', priority: 'must-have' },
            { name: 'Linux', level: 'Advanced', priority: 'must-have' },
            { name: 'CI/CD', level: 'Intermediate', priority: 'must-have' }
        ],
        requirements: ['Experience with containerization', 'Cloud platform knowledge'],
        location: { city: 'Quezon City', country: 'Philippines', remote: false },
        jobType: 'full-time',
        experienceLevel: 'mid-level',
        salary: { min: 55000, max: 90000, currency: 'PHP', period: 'monthly' },
        status: 'active'
    },
    {
        title: 'Cloud Architect',
        companyName: 'CloudNet Infrastructure',
        description: 'Design and implement cloud solutions for enterprise clients. Expert-level AWS and Azure knowledge required.',
        skillsRequired: [
            { name: 'AWS', level: 'Expert', priority: 'must-have' },
            { name: 'Azure', level: 'Advanced', priority: 'nice-to-have' },
            { name: 'Cloud Design', level: 'Expert', priority: 'must-have' },
            { name: 'Networking', level: 'Advanced', priority: 'must-have' },
            { name: 'Security', level: 'Advanced', priority: 'must-have' }
        ],
        requirements: ['3+ years cloud experience', 'Cloud certification preferred'],
        location: { city: 'Quezon City', country: 'Philippines', remote: true },
        jobType: 'full-time',
        experienceLevel: 'senior',
        salary: { min: 80000, max: 150000, currency: 'PHP', period: 'monthly' },
        status: 'active'
    },

    // CyberShield Security
    {
        title: 'Security Engineer',
        companyName: 'CyberShield Security',
        description: 'Implement and maintain security infrastructure for enterprise systems. Work with firewalls, intrusion detection, and Linux.',
        skillsRequired: [
            { name: 'Cybersecurity', level: 'Advanced', priority: 'must-have' },
            { name: 'Networking', level: 'Advanced', priority: 'must-have' },
            { name: 'Linux', level: 'Advanced', priority: 'must-have' },
            { name: 'Firewalls', level: 'Intermediate', priority: 'must-have' },
            { name: 'Intrusion Detection', level: 'Intermediate', priority: 'nice-to-have' }
        ],
        requirements: ['Security certification (CISSP, CEH preferred)', 'Networking knowledge'],
        location: { city: 'BGC', country: 'Philippines', remote: false },
        jobType: 'full-time',
        experienceLevel: 'mid-level',
        salary: { min: 65000, max: 110000, currency: 'PHP', period: 'monthly' },
        status: 'active'
    },

    // DatabasePro Systems
    {
        title: 'Database Administrator',
        companyName: 'DatabasePro Systems',
        description: 'Manage and optimize databases for high-performance applications. Expert SQL and performance tuning.',
        skillsRequired: [
            { name: 'SQL', level: 'Expert', priority: 'must-have' },
            { name: 'Database Design', level: 'Advanced', priority: 'must-have' },
            { name: 'Performance Tuning', level: 'Advanced', priority: 'must-have' },
            { name: 'Backup & Recovery', level: 'Advanced', priority: 'must-have' },
            { name: 'MongoDB', level: 'Intermediate', priority: 'nice-to-have' }
        ],
        requirements: ['2+ years DBA experience', 'SQL proficiency'],
        location: { city: 'Makati', country: 'Philippines', remote: true },
        jobType: 'full-time',
        experienceLevel: 'mid-level',
        salary: { min: 50000, max: 85000, currency: 'PHP', period: 'monthly' },
        status: 'active'
    },
    {
        title: 'Backend Developer - Node.js',
        companyName: 'DatabasePro Systems',
        description: 'Build robust backend systems with focus on database optimization. Strong Node.js and API design skills.',
        skillsRequired: [
            { name: 'Node.js', level: 'Advanced', priority: 'must-have' },
            { name: 'JavaScript', level: 'Advanced', priority: 'must-have' },
            { name: 'SQL', level: 'Advanced', priority: 'must-have' },
            { name: 'API Design', level: 'Intermediate', priority: 'must-have' },
            { name: 'PostgreSQL', level: 'Advanced', priority: 'nice-to-have' }
        ],
        requirements: ['2+ years Node.js experience', 'Database design knowledge'],
        location: { city: 'Makati', country: 'Philippines', remote: true },
        jobType: 'full-time',
        experienceLevel: 'mid-level',
        salary: { min: 55000, max: 95000, currency: 'PHP', period: 'monthly' },
        status: 'active'
    }
];

// Custom Assessments for selected jobs
const testAssessments = [
    {
        jobTitle: 'Full Stack Web Developer',
        companyName: 'TechVision Solutions',
        title: 'Full Stack Web Development Assessment',
        description: 'Test your knowledge of full stack development with React and Node.js',
        duration: 45,
        passingScore: 70,
        questions: [
            {
                questionText: 'What is the virtual DOM in React?',
                questionType: 'multiple-choice',
                options: [
                    'A copy of the DOM that React keeps in memory',
                    'The actual DOM in the browser',
                    'A CSS feature for styling',
                    'A Node.js module'
                ],
                correctAnswer: 'A copy of the DOM that React keeps in memory',
                points: 5,
                category: 'technical'
            },
            {
                questionText: 'In Node.js, what does req.body contain?',
                questionType: 'multiple-choice',
                options: [
                    'Request headers',
                    'The request body data sent by the client',
                    'The response data',
                    'Configuration settings'
                ],
                correctAnswer: 'The request body data sent by the client',
                points: 5,
                category: 'technical'
            },
            {
                questionText: 'What is the correct way to connect to MongoDB in Node.js?',
                questionType: 'short-answer',
                correctAnswer: 'mongoose.connect()',
                points: 10,
                category: 'technical'
            }
        ]
    },
    {
        jobTitle: 'Data Analyst',
        companyName: 'DataDrive Analytics',
        title: 'Data Analysis & SQL Skills Assessment',
        description: 'Evaluate your SQL and data analysis capabilities',
        duration: 60,
        passingScore: 65,
        questions: [
            {
                questionText: 'Which SQL statement is used to retrieve data from a database?',
                questionType: 'multiple-choice',
                options: [
                    'GET',
                    'SELECT',
                    'RETRIEVE',
                    'FIND'
                ],
                correctAnswer: 'SELECT',
                points: 5,
                category: 'technical'
            },
            {
                questionText: 'What does JOINin SQL do?',
                questionType: 'multiple-choice',
                options: [
                    'Combines rows from two or more tables',
                    'Deletes data from a table',
                    'Creates a new database',
                    'Exports data to CSV'
                ],
                correctAnswer: 'Combines rows from two or more tables',
                points: 5,
                category: 'technical'
            },
            {
                questionText: 'Explain what GROUP BY clause does in SQL',
                questionType: 'short-answer',
                correctAnswer: 'GROUP BY groups rows with same values',
                points: 10,
                category: 'technical'
            }
        ]
    },
    {
        jobTitle: 'DevOps Engineer',
        companyName: 'CloudNet Infrastructure',
        title: 'DevOps & Cloud Infrastructure Assessment',
        description: 'Test your Docker, Kubernetes, and AWS knowledge',
        duration: 50,
        passingScore: 70,
        questions: [
            {
                questionText: 'What is Docker?',
                questionType: 'multiple-choice',
                options: [
                    'A container platform for applications',
                    'A programming language',
                    'A database system',
                    'A cloud provider'
                ],
                correctAnswer: 'A container platform for applications',
                points: 5,
                category: 'technical'
            },
            {
                questionText: 'What does Kubernetes do?',
                questionType: 'multiple-choice',
                options: [
                    'Manages containerized applications',
                    'Compiles code',
                    'Designs databases',
                    'Manages DNS'
                ],
                correctAnswer: 'Manages containerized applications',
                points: 5,
                category: 'technical'
            },
            {
                questionText: 'What is a CI/CD pipeline?',
                questionType: 'short-answer',
                correctAnswer: 'Continuous Integration/Continuous Deployment automated process',
                points: 10,
                category: 'technical'
            }
        ]
    },
    {
        jobTitle: 'Database Administrator',
        companyName: 'DatabasePro Systems',
        title: 'Database Administration & SQL Optimization',
        description: 'Advanced SQL and database management assessment',
        duration: 55,
        passingScore: 72,
        questions: [
            {
                questionText: 'What is database indexing used for?',
                questionType: 'multiple-choice',
                options: [
                    'To speed up data retrieval',
                    'To delete records',
                    'To backup data',
                    'To encrypt data'
                ],
                correctAnswer: 'To speed up data retrieval',
                points: 5,
                category: 'technical'
            },
            {
                questionText: 'What is normalization in database design?',
                questionType: 'multiple-choice',
                options: [
                    'Process of organizing data to reduce redundancy',
                    'Encrypting database',
                    'Backing up database',
                    'Compressing database'
                ],
                correctAnswer: 'Process of organizing data to reduce redundancy',
                points: 5,
                category: 'technical'
            },
            {
                questionText: 'Explain the difference between INNER JOIN and LEFT JOIN',
                questionType: 'short-answer',
                correctAnswer: 'INNER returns matching rows, LEFT returns all left table rows',
                points: 10,
                category: 'technical'
            }
        ]
    }
];

async function seedData() {
    try {
        console.log('🌱 Starting to seed test data...\n');

        // Clear existing test data
        await User.deleteMany({ email: { $in: testCompanies.map(c => c.email) } });
        await Company.deleteMany({ companyName: { $in: testCompanies.map(c => c.companyName) } });
        await Job.deleteMany({ title: { $in: testJobs.map(j => j.title) } });

        console.log('✓ Cleared existing test data\n');

        // Create companies and their users
        const createdCompanies = [];
        for (const companyData of testCompanies) {
            try {
                // Create user
                const user = new User({
                    email: companyData.email,
                    password: companyData.password,
                    role: 'company'
                });
                await user.save();

                // Create company
                const company = new Company({
                    user: user._id,
                    companyName: companyData.companyName,
                    industry: companyData.industry,
                    companySize: companyData.companySize,
                    description: companyData.description,
                    website: companyData.website,
                    address: {
                        city: companyData.location.city,
                        state: companyData.location.province,
                        country: companyData.location.country
                    }
                });
                await company.save();
                createdCompanies.push(company);
                console.log(`✓ Created company: ${companyData.companyName}`);
            } catch (err) {
                console.error(`✗ Error creating company ${companyData.companyName}:`, err.message);
            }
        }

        console.log(`\n✓ Created ${createdCompanies.length} companies\n`);

        // Create jobs and attach custom assessments
        let jobCount = 0;
        const createdJobs = [];
        for (const jobData of testJobs) {
            try {
                const company = createdCompanies.find(c => c.companyName === jobData.companyName);
                if (!company) {
                    console.warn(`⚠ Company not found for job: ${jobData.title}`);
                    continue;
                }

                const job = new Job({
                    title: jobData.title,
                    company: company._id,
                    description: jobData.description,
                    skillsRequired: jobData.skillsRequired,
                    requirements: jobData.requirements,
                    location: jobData.location,
                    jobType: jobData.jobType,
                    experienceLevel: jobData.experienceLevel,
                    salary: jobData.salary,
                    status: jobData.status,
                    numberOfPositions: 1,
                    applications: [],
                    createdAt: new Date()
                });
                await job.save();
                createdJobs.push(job);
                jobCount++;
                console.log(`✓ Created job: ${jobData.title} at ${jobData.companyName}`);
            } catch (err) {
                console.error(`✗ Error creating job ${jobData.title}:`, err.message);
            }
        }

        console.log(`\n✓ Created ${jobCount} job postings\n`);

        // Create custom assessments and attach to jobs
        let assessmentCount = 0;
        for (const assessmentData of testAssessments) {
            try {
                const job = createdJobs.find(j => j.title === assessmentData.jobTitle);
                const company = createdCompanies.find(c => c.companyName === assessmentData.companyName);
                
                if (!job || !company) {
                    console.warn(`⚠ Job or company not found for assessment: ${assessmentData.title}`);
                    continue;
                }

                const assessment = new CustomAssessment({
                    company: company.user,
                    job: job._id,
                    title: assessmentData.title,
                    description: assessmentData.description,
                    duration: assessmentData.duration,
                    passingScore: assessmentData.passingScore,
                    questions: assessmentData.questions,
                    createdAt: new Date()
                });
                await assessment.save();

                // Attach assessment to job
                job.customAssessment = assessment._id;
                job.requireCustomAssessment = true;
                await job.save();

                assessmentCount++;
                console.log(`✓ Created assessment: "${assessmentData.title}" for "${job.title}"`);
            } catch (err) {
                console.error(`✗ Error creating assessment ${assessmentData.title}:`, err.message);
            }
        }

        console.log(`\n✓ Created ${assessmentCount} custom assessments\n`);

        console.log('=========================================');
        console.log('✨ Test Data Seeding Complete!');
        console.log('=========================================');
        console.log(`\nTest Credentials:`);
        testCompanies.forEach(c => {
            console.log(`\n📧 ${c.companyName}`);
            console.log(`   Email: ${c.email}`);
            console.log(`   Password: ${c.password}`);
        });
        console.log('\n\n🎯 You can now test the skill matching algorithm by:');
        console.log('1. Login as a student with test skills');
        console.log('2. Go to Dashboard and check "Recommended For You"');
        console.log('3. The system will match your skills to these job postings');
        console.log('4. Some jobs have custom assessments (Q&A) attached');
        console.log('\n📋 Jobs with Custom Assessments:');
        console.log('   - Full Stack Web Developer (Frontend/Backend/DB Q&A)');
        console.log('   - Data Analyst (SQL & Data Analysis Q&A)');
        console.log('   - DevOps Engineer (Docker/Kubernetes/AWS Q&A)');
        console.log('   - Database Administrator (SQL Optimization Q&A)');
        console.log('\nNote: Make sure your student account has assessment scores');
        console.log('for the matching algorithm to work properly.\n');

        process.exit(0);
    } catch (error) {
        console.error('Fatal error during seeding:', error);
        process.exit(1);
    }
}

// Run the seeding function
seedData();
