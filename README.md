# 🎓 SkillSync - Cloud-Based Career Placement Platform

*An AI-powered career placement system connecting CCS IT students with opportunities*

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (copy and edit)
cp server/config/.env.example server/config/.env

# 3. Start MongoDB
server/config/start-mongodb.bat

# 4. Start development server
npm run dev

# 5. Open in browser
# Student Portal: http://localhost:3000
# Admin Dashboard: http://localhost:3000/admin.html
```

## 📋 Overview

### What is SkillSync?
SkillSync is a cloud-based career placement system specifically designed for CCS IT students. The platform connects students with employers through intelligent skill-based matching, comprehensive assessments, and personalized career guidance.

### Key Features
- 👤 **User Management**: Students, companies, and administrators
- 🔍 **Smart Matching**: AI-powered job recommendations based on skills
- 📊 **Assessment System**: Comprehensive technical skill evaluations
- 📈 **Skills Progress Tracking**: Monitor improvement over time
- 🎯 **Career Path Recommendations**: Personalized IT career suggestions
- 📚 **Learning Resources**: Curated recommendations for skill development
- 🔐 **Secure Authentication**: Google OAuth integration
- 📱 **Responsive Design**: Works on desktop and mobile

### Target Users
- **Students**: Find career opportunities matching their skills with personalized guidance
- **Companies**: Post jobs and discover qualified IT talent
- **Administrators**: Manage the platform and oversee operations

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: Passport.js + Google OAuth 2.0
- **File Handling**: Multer for uploads
- **Charts**: Chart.js for analytics

### Project Structure
```
it-ojt-platform/
├── 📂 server/              # Backend components
│   ├── 📂 config/         # Environment & secrets
│   ├── 📂 auth/           # Authentication logic  
│   ├── 📂 database/       # Data models
│   ├── 📂 api/            # API routes
│   └── server.js          # Main server file
├── 📂 client/             # Frontend components
│   ├── 📂 public/         # Web interface
│   └── 📂 assets/         # Uploaded files
├── 📂 docs/               # Documentation
├── 📂 scripts/            # Utility scripts
└── 📂 node_modules/       # Dependencies
```

## 🎯 Getting Started

### Prerequisites
- **Node.js**: Version 14 or higher
- **MongoDB**: Local installation or MongoDB Atlas account
- **Google OAuth**: Google Cloud Console project

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/it-ojt-platform.git
   cd it-ojt-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment file
   cp server/config/.env.example server/config/.env
   
   # Edit with your configuration
   nano server/config/.env
   ```

4. **Configure Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create project and enable Google+ API
   - Download credentials to `server/config/`
   - Update `.env` with client credentials

5. **Start MongoDB**
   ```bash
   # Windows
   server/config/start-mongodb.bat
   
   # macOS/Linux
   mongod --dbpath /path/to/data
   ```

6. **Start the application**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

7. **Access the application**
   - **Student Portal**: [http://localhost:3000](http://localhost:3000)
   - **Admin Dashboard**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

### Initial Setup Scripts
```bash
# Create admin user
npm run create-admin

# Populate assessment questions
npm run create-assessments

# Add sample companies (Philippines)
npm run create-companies
```

## 📖 Documentation

### 📋 Navigation Guides
- **[Navigation Dashboard](NAVIGATION_DASHBOARD.md)** - Quick access to all project resources
- **[Development Setup](DEV_SETUP.md)** - Detailed development environment guide
- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - Architecture and file organization

### 📊 Technical Documentation
- **[Feature Summary](docs/FEATURE_SUMMARY.md)** - Detailed feature documentation
- **[System Status](docs/SYSTEM_STATUS_REPORT.md)** - Performance and health metrics
- **[Solution Summary](docs/SOLUTION_SUMMARY.md)** - Implementation details
- **[Improvements](docs/FINAL_IMPROVEMENTS_SUMMARY.md)** - Enhancement roadmap

### 🗂️ Component Guides
- **[Server Documentation](server/README.md)** - Backend components guide
- **[Client Documentation](client/README.md)** - Frontend components guide
- **[Documentation Index](docs/README.md)** - All documentation resources

## 🎨 User Interfaces

### 🎓 Student Portal
- **Profile Management**: Update personal and academic information
- **Skill Assessment**: Take technical evaluations
- **Job Search**: Browse and apply for OJT positions
- **Application Tracking**: Monitor application status
- **Document Upload**: Submit required documents

### 👤 Admin Dashboard
- **User Management**: Manage students and company accounts
- **Job Management**: Oversee job postings and applications
- **Assessment Management**: Create and manage skill assessments
- **Analytics**: View platform statistics and reports
- **Content Moderation**: Review and approve content

### 🏢 Company Features
- **Job Posting**: Create OJT opportunity listings
- **Candidate Review**: View and evaluate student applications
- **Skill Matching**: Find students with required skills
- **Communication**: Message and interview candidates

## 🔧 Development

### Available Scripts
```bash
# Development
npm start              # Start production server
npm run dev            # Development with auto-reload

# Database utilities  
npm run create-admin         # Create admin user
npm run reset-passwords      # Reset user passwords
npm run create-assessments   # Populate questions
npm run create-companies     # Add company data
```

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Workflow
1. **Backend Changes**: `server/` → Test API endpoints
2. **Frontend Changes**: `client/public/` → Test in browser
3. **Database Changes**: `server/database/models/` → Update schemas
4. **Documentation**: Update relevant `.md` files

## 🚨 Troubleshooting

### Common Issues
| Problem | Solution |
|---------|----------|
| **Server won't start** | Check `.env` configuration, ensure MongoDB is running |
| **OAuth errors** | Verify Google credentials and redirect URLs |
| **Database connection** | Confirm MongoDB URI and database permissions |
| **File uploads fail** | Check upload directory permissions |

### Getting Help
1. **Check Documentation**: Start with [Navigation Dashboard](NAVIGATION_DASHBOARD.md)
2. **System Status**: Review [System Status Report](docs/SYSTEM_STATUS_REPORT.md)
3. **Development Setup**: Follow [Development Setup Guide](DEV_SETUP.md)
4. **Create Issue**: Report bugs via GitHub issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

- Built for IT education and industry collaboration
- Inspired by modern job matching platforms
- Designed with student success in mind

---

## 🔗 Quick Links

- **[🧭 Navigation Dashboard](NAVIGATION_DASHBOARD.md)** - Project navigation hub
- **[🛠️ Development Setup](DEV_SETUP.md)** - Environment setup guide  
- **[📚 Documentation](docs/)** - All project documentation
- **[🖥️ Server Guide](server/README.md)** - Backend documentation
- **[💻 Client Guide](client/README.md)** - Frontend documentation

*💡 New to the project? Start with the [Navigation Dashboard](NAVIGATION_DASHBOARD.md) for a complete overview!*

# IT OJT Platform - Skill-Based Job Matching

A comprehensive web application that connects IT students with companies through skill-based matching. Students must complete a skills assessment before accessing the platform, ensuring quality matches for both parties.

## Features

### For Students:
- **Mandatory Skills Assessment**: Complete a comprehensive IT skills test before platform access
- **Skill Verification**: Assessment results are used to verify and validate student abilities
- **Smart Job Matching**: AI-powered algorithm matches jobs based on skills, preferences, and assessment scores
- **Profile Management**: Comprehensive profile with education, portfolio, and preferences
- **Application Tracking**: Track job applications and their status
- **Resume Upload**: Upload and manage resume documents

### For Companies:
- **Talent Search**: Search for students based on verified skills and assessment scores
- **Job Posting Management**: Create, edit, and manage job postings
- **Application Management**: Review applications and manage candidate pipeline
- **Skill-Based Filtering**: Find candidates with specific technical skills
- **Analytics Dashboard**: Track recruitment metrics and application statistics

### Platform Features:
- **Secure Authentication**: Separate login systems for students and companies
- **Real-time Statistics**: Live platform statistics and trends
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Assessment Timer**: Timed skill assessments with automatic submission
- **Match Scoring**: Algorithmic matching with percentage-based compatibility scores

## Technology Stack

### Backend:
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **multer** for file uploads
- **express-validator** for input validation

### Frontend:
- **Vanilla JavaScript** (ES6+)
- **HTML5** with semantic markup
- **Tailwind CSS** for styling
- **Font Awesome** for icons
- **Responsive design** principles

## Installation

### Prerequisites:
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Setup Instructions:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Install and start MongoDB locally, or use MongoDB Atlas
   - The application will automatically create the required database and collections

3. **Environment Configuration**
   - Update the `.env` file with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/it-ojt-platform
   JWT_SECRET=your_secure_jwt_secret_here
   JWT_EXPIRE=30d
   ```

4. **Start the Application**
   ```bash
   npm start
   ```

5. **Access the Platform**
   - Open your browser and navigate to `http://localhost:3000`

## Usage Guide

### For Students:

1. **Registration & Assessment**
   - Click "I'm a Student" on the homepage
   - Register with email and password
   - Complete the mandatory IT skills assessment (30 minutes)
   - Assessment covers: Programming, Databases, Web Development, Networking, Problem Solving

2. **Profile Setup**
   - Complete your profile with personal information
   - Add education details and experience
   - Upload your resume
   - Add portfolio links (GitHub, LinkedIn)
   - Set job preferences

3. **Job Search & Applications**
   - View personalized job recommendations
   - See match percentage based on your skills
   - Apply for jobs that match your preferences
   - Track application status

### For Companies:

1. **Registration & Profile**
   - Click "I'm a Company" on the homepage
   - Register with company email and password
   - Complete company profile with details

2. **Job Management**
   - Post new job openings
   - Define required skills and experience levels
   - Set job details (location, salary, benefits)
   - Manage job status (draft, active, closed)

3. **Candidate Management**
   - Review applications from qualified students
   - View candidate profiles and assessment scores
   - Search for students with specific skills
   - Manage application pipeline

## Assessment System

The skills assessment is a core feature that ensures quality matching:

- **Comprehensive Testing**: Covers multiple IT domains
- **Timed Environment**: 30-minute limit with countdown timer
- **Automatic Scoring**: Real-time evaluation with detailed breakdown
- **Skill Verification**: Results determine verified skill levels
- **Mandatory Completion**: Required before platform access

### Assessment Categories:
1. **Programming**: Language syntax, algorithms, debugging
2. **Database Management**: SQL, database design, optimization
3. **Web Development**: HTML/CSS, JavaScript, frameworks
4. **Networking**: Protocols, security, network fundamentals
5. **Problem Solving**: Logic, analytical thinking, troubleshooting

## API Documentation

### Authentication Endpoints:
- `POST /api/auth/register` - Public registration disabled (students use Google sign-in, companies are admin-created)
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Student Endpoints:
- `GET /api/students/profile` - Get student profile
- `PUT /api/students/profile` - Update student profile
- `POST /api/students/upload-resume` - Upload resume
- `GET /api/students/job-matches` - Get job recommendations
- `POST /api/students/apply/:jobId` - Apply for job

### Company Endpoints:
- `GET /api/companies/profile` - Get company profile
- `PUT /api/companies/profile` - Update company profile
- `GET /api/companies/search-students` - Search students
- `GET /api/companies/analytics` - Get recruitment analytics

### Assessment Endpoints:
- `GET /api/assessments` - Get available assessments
- `GET /api/assessments/:id` - Get specific assessment
- `POST /api/assessments/:id/submit` - Submit assessment

### Job Endpoints:
- `GET /api/jobs` - Get all active jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

## Database Schema

### Collections:
- **users**: Authentication and basic user info
- **students**: Student profiles, skills, and preferences
- **companies**: Company profiles and information
- **jobs**: Job postings and requirements
- **assessments**: Assessment questions and configuration
- **assessmentresults**: Student assessment results

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access**: Separate permissions for students/companies
- **Input Validation**: Comprehensive request validation
- **File Upload Security**: Restricted file types and sizes
- **Assessment Security**: Time limits and answer validation

## Future Enhancements

- **Video Interviews**: Integrated video calling system
- **Skills Courses**: Online learning modules
- **Company Reviews**: Student feedback on companies
- **Advanced Analytics**: ML-powered insights
- **Mobile App**: Native mobile applications
- **Integration APIs**: Third-party service connections

## Development Setup

For development environment:

1. **Install nodemon** for auto-restart:
   ```bash
   npm install -g nodemon
   ```

2. **Run in development mode**:
   ```bash
   npm run dev
   ```

3. **Database Management**:
   - Use MongoDB Compass for visual database management
   - Set up database indexes for performance

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **Assessment Not Loading**:
   - Check browser console for errors
   - Ensure JavaScript is enabled
   - Clear browser cache

3. **File Upload Issues**:
   - Check `uploads` directory permissions
   - Verify file size limits
   - Ensure supported file formats

4. **JWT Errors**:
   - Verify JWT_SECRET in `.env`
   - Check token expiration
   - Clear localStorage if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting guide
- Review API documentation

## Acknowledgments

- Font Awesome for icons
- Tailwind CSS for styling
- MongoDB for database
- Express.js framework
- All contributors and testers

---

**Note**: This is a complete, functional IT OJT platform with skill-based matching. The assessment system ensures that only qualified students can access job opportunities, creating a high-quality talent pool for companies.
