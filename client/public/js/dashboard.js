// Dashboard functions

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Button style constants for consistent styling across the dashboard
 */
const BUTTON_STYLES = {
    primary: `style="background-color: #56AE67; color: white; border: 2px solid #2d6b3c;"`,
    primaryClass: `bg-[#56AE67] text-white hover:bg-[#3d8b4f] dark:bg-[#56AE67] dark:hover:bg-[#6bc481] transition font-semibold border-2 border-green-800 dark:border-green-600`,
    primaryEvents: `onmouseover="this.style.backgroundColor='#3d8b4f'" onmouseout="this.style.backgroundColor='#56AE67'"`,
    secondary: `bg-gray-700 text-white hover:bg-gray-800 dark:bg-gray-500 dark:hover:bg-gray-400 dark:text-gray-900 transition font-medium border dark:border-gray-400`,
    danger: `bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400 transition font-medium`
};

/**
 * Creates a primary action button with consistent styling
 * @param {string} text - Button text
 * @param {string} onclick - Click handler
 * @param {string} icon - FontAwesome icon class (optional)
 * @param {string} additionalClasses - Additional CSS classes
 * @returns {string} HTML button element
 */
function createPrimaryButton(text, onclick, icon = '', additionalClasses = '') {
    const iconHtml = icon ? `<i class="${icon} mr-2"></i>` : '';
    return `
        <button onclick="${onclick}" 
            ${BUTTON_STYLES.primary}
            class="${BUTTON_STYLES.primaryClass} ${additionalClasses}"
            ${BUTTON_STYLES.primaryEvents}>
            ${iconHtml}${text}
        </button>
    `;
}

/**
 * Creates a secondary button with consistent styling
 * @param {string} text - Button text
 * @param {string} onclick - Click handler
 * @param {string} additionalClasses - Additional CSS classes
 * @returns {string} HTML button element
 */
function createSecondaryButton(text, onclick, additionalClasses = '') {
    return `<button onclick="${onclick}" class="${BUTTON_STYLES.secondary} ${additionalClasses}">${text}</button>`;
}

// ============================================
// SECTION NAVIGATION
// ============================================

// Section switching functionality
function switchToSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.add('hidden'));

    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('bg-blue-100', 'dark:bg-blue-900/30', 'text-[#56AE67]', 'dark:text-[#6bc481]');
        item.classList.add('text-gray-700', 'dark:text-gray-300');
    });

    // Show selected section
    const selectedSection = document.getElementById(`${sectionName}-section`);
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
    }

    // Activate selected nav item
    const selectedNav = document.getElementById(`nav-${sectionName}`);
    if (selectedNav) {
        selectedNav.classList.add('bg-blue-100', 'dark:bg-blue-900/30', 'text-[#56AE67]', 'dark:text-[#6bc481]');
        selectedNav.classList.remove('text-gray-700', 'dark:text-gray-300');
    }

    // Load section-specific data if needed
    if (sectionName === 'assessment') {
        loadAssessmentSection();
    } else if (sectionName === 'history') {
        loadAssessmentHistory();
    }
}

// ============================================
// STUDENT DASHBOARD
// ============================================

// Student Dashboard
async function loadStudentDashboard() {
    // Hide other pages and show student dashboard
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('assessment-page').classList.add('hidden');
    document.getElementById('company-dashboard').classList.add('hidden');
    document.getElementById('student-dashboard').classList.remove('hidden');

    const dashboardContainer = document.getElementById('student-dashboard');

    try {
        // Load student profile and data
        const [profileResponse, jobsResponse, applicationsResponse] = await Promise.all([
            apiCall('/students/profile').catch(() => ({ success: false, data: null })),
            apiCall('/jobs').catch(() => ({ success: false, data: [] })),
            apiCall('/students/applications').catch(() => ({ success: false, data: [] }))
        ]);

        const studentProfile = profileResponse.success ? profileResponse.data : null;
        const jobs = (jobsResponse.success && jobsResponse.data) ? (Array.isArray(jobsResponse.data) ? jobsResponse.data : []) : [];
        const applications = applicationsResponse.success ? applicationsResponse.data : [];
        
        // Filter out jobs with missing company data to prevent errors
        const validJobs = jobs.filter(job => job && job.company && job.company.companyName);
        
        // Filter out applications with null or missing job references
        const validApplications = applications.filter(app => app && app.job && app.job.title);

        dashboardContainer.innerHTML = `
            <div class="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900">
                <!-- Sidebar -->
                <div class="w-full md:w-64 bg-white dark:bg-gray-800 shadow-lg md:h-screen overflow-y-auto">
                    <div class="p-4 md:p-6">
                        <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Student Portal</h2>
                        <p class="text-gray-600 dark:text-gray-300 text-xs md:text-sm mt-1">Your OJT Journey</p>
                    </div>

                    <!-- Navigation -->
                    <nav class="px-2 md:px-4 pb-4">
                        <div class="space-y-1 md:space-y-2">
                            <button id="nav-assessment" onclick="switchToSection('assessment')" class="nav-item w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center text-sm md:text-base">
                                <i class="fas fa-brain mr-2 md:mr-3"></i><span class="truncate">Skills Assessment</span>
                            </button>
                            <button id="nav-history" onclick="switchToSection('history')" class="nav-item w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center text-sm md:text-base">
                                <i class="fas fa-history mr-2 md:mr-3"></i><span class="truncate">Assessment History</span>
                            </button>
                            <button id="nav-profile" onclick="switchToSection('profile')" class="nav-item w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center text-sm md:text-base">
                                <i class="fas fa-user mr-2 md:mr-3"></i><span class="truncate">Profile</span>
                            </button>
                            <button id="nav-applications" onclick="switchToSection('applications')" class="nav-item w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center text-sm md:text-base">
                                <i class="fas fa-paper-plane mr-2 md:mr-3"></i><span class="truncate">Applications</span>
                            </button>
                            <button id="nav-messages" onclick="window.location.href='/messages.html'" class="nav-item w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center text-sm md:text-base">
                                <i class="fas fa-comments mr-2 md:mr-3"></i><span class="truncate">Messages</span>
                            </button>
                        </div>
                    </nav>

                    <!-- User Actions -->
                    <div class="px-2 md:px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    </div>
                </div>

                <!-- Main Content -->
                <div class="flex-1 overflow-auto">
                    <!-- Dashboard Section -->
                    <div id="dashboard-section" class="section p-4 md:p-8">
                        <!-- Dashboard Header -->
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 mb-4 md:mb-8">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    ${studentProfile?.avatar?.path ? `
                                        <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-[#56AE67] hidden md:block">
                                            <img src="/uploads/avatars/${studentProfile.avatar.path.split('/').pop()}" alt="Profile" class="w-full h-full object-cover" onerror="this.style.display='none'">
                                        </div>
                                    ` : ''}
                                    <div>
                                        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
                                        <p class="text-gray-600 dark:text-gray-300 mt-1 md:mt-2 text-sm md:text-base">Welcome back${studentProfile?.firstName ? ', ' + studentProfile.firstName : ''}! Here's your OJT journey overview.</p>
                                    </div>
                                </div>
                                <!-- Notification Bell -->
                                <div id="student-notification-bell-container"></div>
                            </div>
                        </div>

                <!-- Stats Cards -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
                    <div class="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-lg shadow">
                        <div class="flex flex-col md:flex-row items-start md:items-center">
                            <div class="p-2 md:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-2 md:mb-0">
                                <i class="fas fa-briefcase text-blue-600 dark:text-blue-400 text-base md:text-xl"></i>
                            </div>
                            <div class="md:ml-4">
                                <p class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">${validJobs.length}</p>
                                <p class="text-gray-600 dark:text-gray-300 text-xs md:text-sm">Available Jobs</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-lg shadow">
                        <div class="flex flex-col md:flex-row items-start md:items-center">
                            <div class="p-2 md:p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-2 md:mb-0">
                                <i class="fas fa-paper-plane text-green-600 dark:text-green-400 text-base md:text-xl"></i>
                            </div>
                            <div class="md:ml-4">
                                <p class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">${validApplications.length}</p>
                                <p class="text-gray-600 dark:text-gray-300 text-xs md:text-sm">Applications</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-lg shadow">
                        <div class="flex flex-col md:flex-row items-start md:items-center">
                            <div class="p-2 md:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-2 md:mb-0">
                                <i class="fas fa-chart-line text-purple-600 dark:text-purple-400 text-base md:text-xl"></i>
                            </div>
                            <div class="md:ml-4">
                                <p class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">${studentProfile?.assessmentScore?.overall || 0}%</p>
                                <p class="text-gray-600 dark:text-gray-300 text-xs md:text-sm">Assessment Score</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-lg shadow">
                        <div class="flex flex-col md:flex-row items-start md:items-center">
                            <div class="p-2 md:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-2 md:mb-0">
                                <i class="fas fa-skills text-yellow-600 dark:text-yellow-400 text-base md:text-xl"></i>
                            </div>
                            <div class="md:ml-4">
                                <p class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">${studentProfile?.skills?.length || 0}</p>
                                <p class="text-gray-600 dark:text-gray-300 text-xs md:text-sm">Verified Skills</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="grid lg:grid-cols-3 gap-4 md:gap-8">
                    <!-- Job Matches -->
                    <div class="lg:col-span-2">
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
                            <div class="p-4 md:p-6 border-b border-gray-200 dark:border-gray-600">
                                <h3 class="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                                    <i class="fas fa-star text-[#56AE67] mr-2"></i>
                                    Recommended For You
                                </h3>
                                <p class="text-gray-600 dark:text-gray-300 text-xs md:text-sm mt-1">
                                    ${studentProfile?.assessmentScore?.overall ? 
                                        'AI-matched based on your assessment results and skills' : 
                                        'Complete your assessment for personalized recommendations'}
                                </p>
                            </div>
                            <div class="p-6">
                                ${validJobs.length > 0 ?
                                    validJobs.slice(0, 3).map(job => `
                                        <div class="border-b border-gray-100 dark:border-gray-600 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                                            <div class="flex items-start justify-between">
                                                <div class="flex-1">
                                                    <h4 class="font-semibold text-gray-900 dark:text-white">${job.title}</h4>
                                                    <p class="text-gray-600 dark:text-gray-300 text-sm mt-1">${job.company.companyName}</p>
                                                    <div class="flex items-center mt-2 space-x-4">
                                                        <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">${capitalizeFirst(job.jobType)}</span>
                                                        ${job.location.remote ? '<span class="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded">Remote</span>' : ''}
                                                    </div>
                                                </div>
                                                <button onclick="viewJob('${job._id}')" class="text-[#56AE67] hover:text-[#2d6b3c] text-sm">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')
                                    : '<p class="text-gray-500 dark:text-gray-400 text-center py-8">No jobs available at the moment. Check back later!</p>'
                                }
                                ${validJobs.length > 3 ? `
                                    <div class="text-center pt-4">
                                        <button onclick="showAllJobs()" class="text-[#56AE67] hover:text-[#2d6b3c] text-sm font-medium">
                                            View All ${validJobs.length} Jobs
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar -->
                    <div class="lg:col-span-1 space-y-6">
                        <!-- Profile Completeness -->
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Completeness</h3>
                            ${renderProfileCompleteness(studentProfile)}
                        </div>

                        <!-- Recent Applications -->
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
                            <div class="p-6 border-b border-gray-200 dark:border-gray-600">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Applications</h3>
                            </div>
                            <div class="p-6">
                                ${validApplications.length > 0 ?
                                    validApplications.slice(0, 3).map(app => `
                                        <div class="flex items-center justify-between py-2">
                                            <div>
                                                <p class="font-medium text-sm text-gray-900 dark:text-white">${app.job.title}</p>
                                                <p class="text-xs text-gray-500 dark:text-gray-400">${formatDate(app.appliedAt)}</p>
                                            </div>
                                            <span class="text-xs px-2 py-1 rounded ${getStatusColor(app.status)}">
                                                ${capitalizeFirst(app.status)}
                                            </span>
                                        </div>
                                    `).join('')
                                    : '<p class="text-gray-500 dark:text-gray-400 text-sm">No applications yet</p>'
                                }
                                ${validApplications.length > 3 ? `
                                    <div class="text-center pt-2">
                                        <button onclick="showAllApplications()" class="text-[#56AE67] hover:text-[#2d6b3c] text-xs">
                                            View All Applications
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Skills Overview -->
                        ${studentProfile?.skills?.filter(s => s.verified && s.score >= 60).length > 0 ? `
                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Verified Skills</h3>
                                <div class="space-y-2">
                                    ${studentProfile.skills.filter(s => s.verified && s.score >= 60).slice(0, 5).map(skill => `
                                        <div class="flex items-center justify-between">
                                            <div class="flex-1">
                                                <span class="text-sm text-gray-900 dark:text-white font-medium">${capitalizeFirst(skill.name)}</span>
                                                <span class="text-xs text-[#56AE67] ml-2">${skill.score}%</span>
                                            </div>
                                            <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-[#2d6b3c] dark:text-blue-200 rounded">${skill.level}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                    </div>

                    <!-- Assessment Section -->
                    <div id="assessment-section" class="section hidden p-8">
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Skills Assessment</h2>
                            <p class="text-gray-600 dark:text-gray-300 mb-6">Choose a skill category to assess your abilities and get better job matches.</p>

                            <!-- General Categories -->
                            <div class="mb-8">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Skills</h3>
                                <div class="grid-container">
                                    <div class="grid-item programming" onclick="startCategoryAssessment('programming')">
                                        <i class="fas fa-code"></i>
                                        <h3>Programming</h3>
                                        <p>Core programming concepts, algorithms, data structures.</p>
                                    </div>
                                    <div class="grid-item webDevelopment" onclick="startCategoryAssessment('webDevelopment')">
                                        <i class="fas fa-globe"></i>
                                        <h3>Web Development</h3>
                                        <p>Frontend and backend web technologies, frameworks.</p>
                                    </div>
                                    <div class="grid-item networking" onclick="startCategoryAssessment('networking')">
                                        <i class="fas fa-network-wired"></i>
                                        <h3>Networking</h3>
                                        <p>Network protocols, security, cloud computing.</p>
                                    </div>
                                    <div class="grid-item problemSolving" onclick="startCategoryAssessment('problemSolving')">
                                        <i class="fas fa-brain"></i>
                                        <h3>Problem Solving</h3>
                                        <p>Logical thinking, analytical skills, debugging.</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Programming Languages -->
                            <div class="mb-8">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Programming Languages</h3>
                                <div class="grid-container">
                                    <div class="grid-item python" onclick="startCategoryAssessment('python')">
                                        <i class="fab fa-python"></i>
                                        <h3>Python</h3>
                                        <p>Python programming, Django, Flask, data science.</p>
                                    </div>
                                    <div class="grid-item java" onclick="startCategoryAssessment('java')">
                                        <i class="fab fa-java"></i>
                                        <h3>Java</h3>
                                        <p>Java programming, Spring, enterprise applications.</p>
                                    </div>
                                    <div class="grid-item javascript" onclick="startCategoryAssessment('javascript')">
                                        <i class="fab fa-js"></i>
                                        <h3>JavaScript</h3>
                                        <p>JavaScript, Node.js, modern web development.</p>
                                    </div>
                                    <div class="grid-item typescript" onclick="startCategoryAssessment('typescript')">
                                        <i class="fas fa-code"></i>
                                        <h3>TypeScript</h3>
                                        <p>TypeScript, Angular, type-safe JavaScript.</p>
                                    </div>
                                    <div class="grid-item csharp" onclick="startCategoryAssessment('csharp')">
                                        <i class="fas fa-code"></i>
                                        <h3>C#</h3>
                                        <p>C# programming, .NET, ASP.NET development.</p>
                                    </div>
                                    <div class="grid-item cpp" onclick="startCategoryAssessment('cpp')">
                                        <i class="fas fa-code"></i>
                                        <h3>C++</h3>
                                        <p>C++ programming, system development, STL.</p>
                                    </div>
                                    <div class="grid-item c" onclick="startCategoryAssessment('c')">
                                        <i class="fas fa-code"></i>
                                        <h3>C</h3>
                                        <p>C programming, embedded systems, low-level.</p>
                                    </div>
                                    <div class="grid-item php" onclick="startCategoryAssessment('php')">
                                        <i class="fab fa-php"></i>
                                        <h3>PHP</h3>
                                        <p>PHP programming, Laravel, WordPress development.</p>
                                    </div>
                                    <div class="grid-item ruby" onclick="startCategoryAssessment('ruby')">
                                        <i class="fas fa-gem"></i>
                                        <h3>Ruby</h3>
                                        <p>Ruby programming, Rails, web applications.</p>
                                    </div>
                                    <div class="grid-item go" onclick="startCategoryAssessment('go')">
                                        <i class="fas fa-code"></i>
                                        <h3>Go</h3>
                                        <p>Go programming, microservices, concurrency.</p>
                                    </div>
                                    <div class="grid-item rust" onclick="startCategoryAssessment('rust')">
                                        <i class="fas fa-code"></i>
                                        <h3>Rust</h3>
                                        <p>Rust programming, memory safety, performance.</p>
                                    </div>
                                    <div class="grid-item swift" onclick="startCategoryAssessment('swift')">
                                        <i class="fab fa-swift"></i>
                                        <h3>Swift</h3>
                                        <p>Swift programming, iOS development, SwiftUI.</p>
                                    </div>
                                    <div class="grid-item kotlin" onclick="startCategoryAssessment('kotlin')">
                                        <i class="fas fa-code"></i>
                                        <h3>Kotlin</h3>
                                        <p>Kotlin programming, Android development.</p>
                                    </div>
                                    <div class="grid-item objectivec" onclick="startCategoryAssessment('objectivec')">
                                        <i class="fab fa-apple"></i>
                                        <h3>Objective-C</h3>
                                        <p>Objective-C, iOS/macOS legacy development.</p>
                                    </div>
                                    <div class="grid-item r" onclick="startCategoryAssessment('r')">
                                        <i class="fab fa-r-project"></i>
                                        <h3>R</h3>
                                        <p>R programming, statistical computing, data analysis.</p>
                                    </div>
                                    <div class="grid-item scala" onclick="startCategoryAssessment('scala')">
                                        <i class="fas fa-code"></i>
                                        <h3>Scala</h3>
                                        <p>Scala programming, functional programming.</p>
                                    </div>
                                    <div class="grid-item perl" onclick="startCategoryAssessment('perl')">
                                        <i class="fas fa-code"></i>
                                        <h3>Perl</h3>
                                        <p>Perl programming, text processing, scripting.</p>
                                    </div>
                                    <div class="grid-item visualbasic" onclick="startCategoryAssessment('visualbasic')">
                                        <i class="fas fa-code"></i>
                                        <h3>Visual Basic</h3>
                                        <p>VB.NET, Windows applications development.</p>
                                    </div>
                                    <div class="grid-item assembly" onclick="startCategoryAssessment('assembly')">
                                        <i class="fas fa-microchip"></i>
                                        <h3>Assembly</h3>
                                        <p>Assembly language, low-level programming.</p>
                                    </div>
                                    <div class="grid-item matlab" onclick="startCategoryAssessment('matlab')">
                                        <i class="fas fa-calculator"></i>
                                        <h3>MATLAB</h3>
                                        <p>MATLAB, numerical computing, Simulink.</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Web Technologies -->
                            <div class="mb-8">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Web Technologies & Database</h3>
                                <div class="grid-container">
                                    <div class="grid-item html" onclick="startCategoryAssessment('html')">
                                        <i class="fab fa-html5"></i>
                                        <h3>HTML</h3>
                                        <p>HTML5, semantic markup, web structure.</p>
                                    </div>
                                    <div class="grid-item css" onclick="startCategoryAssessment('css')">
                                        <i class="fab fa-css3-alt"></i>
                                        <h3>CSS</h3>
                                        <p>CSS3, Flexbox, Grid, responsive design.</p>
                                    </div>
                                    <div class="grid-item sql" onclick="startCategoryAssessment('sql')">
                                        <i class="fas fa-database"></i>
                                        <h3>SQL</h3>
                                        <p>SQL queries, database operations, optimization.</p>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-8 text-center">
                                <p class="text-sm text-gray-500 dark:text-gray-400">
                                    Complete assessments in multiple categories to build a comprehensive skill profile!
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Profile Section -->
                    <div id="profile-section" class="section hidden p-8">
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div class="flex justify-between items-center mb-6">
                                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h2>
                                ${createPrimaryButton('Edit Profile', 'showStudentProfileModal()', 'fas fa-edit', 'px-6 py-2 rounded-lg')}
                            </div>
                            <div id="profile-content">
                                <div class="flex items-center justify-center py-12">
                                    <div class="text-center">
                                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p class="text-gray-600 dark:text-gray-300">Loading profile...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Applications Section -->
                    <div id="applications-section" class="section hidden p-8">
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Applications</h2>
                            <p class="text-gray-600 dark:text-gray-300">View and manage your job applications.</p>
                            <button onclick="showAllApplications()" class="bg-[#56AE67] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition mt-4 font-semibold border-2 border-green-800 dark:border-green-600" style="background-color: #56AE67; color: white; border: 2px solid #2d6b3c;">
                                View Applications
                            </button>
                        </div>
                    </div>

                    <!-- History Section -->
                    <div id="history-section" class="section hidden p-8">
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Assessment History</h2>
                            <p class="text-gray-600 dark:text-gray-300 mb-6">View your past assessment results and request retakes.</p>
                            <div id="history-content">
                                <div class="flex items-center justify-center py-12">
                                    <div class="text-center">
                                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p class="text-gray-600 dark:text-gray-300">Loading assessment history...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Attach event listeners to assessment cards after DOM is updated
        // Increased delay to ensure assessment.js is fully loaded
        setTimeout(() => {
            attachAssessmentCardListeners();
            loadAssessmentHistory();
            loadStudentProfile();
            
            // Load notification bell component
            loadNotificationBell('student-notification-bell-container');
        }, 1000);

    } catch (error) {
        console.error('Error loading student dashboard:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name
        });
        dashboardContainer.innerHTML = `
            <div class="max-w-4xl mx-auto text-center py-12">
                <div class="text-red-500 text-6xl mb-4">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Dashboard Loading Error</h2>
                <p class="text-gray-600 mb-6">There was an error loading your dashboard. Please try again.</p>
                <button onclick="loadStudentDashboard()" 
                    style="background-color: #56AE67; color: white;"
                    class="bg-[#56AE67] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition"
                    onmouseover="this.style.backgroundColor='#3d8b4f'" 
                    onmouseout="this.style.backgroundColor='#56AE67'">
                    Retry
                </button>
            </div>
        `;
    }
}

// Company Dashboard
// ============================================
// COMPANY DASHBOARD
// ============================================

// Delete job function
async function deleteJob(jobId, jobTitle) {
    if (!confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await apiCall(`/jobs/${jobId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showToast('Job deleted successfully', 'success');
            // Reload the dashboard to reflect changes
            loadCompanyDashboard();
        } else {
            showToast(response.message || 'Failed to delete job', 'error');
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        showToast('Error deleting job', 'error');
    }
}

async function loadCompanyDashboard() {
    console.log('Loading company dashboard...');
    
    // Hide other pages and show company dashboard
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('assessment-page').classList.add('hidden');
    document.getElementById('student-dashboard').classList.add('hidden');
    document.getElementById('company-dashboard').classList.remove('hidden');

    const dashboardContainer = document.getElementById('company-dashboard');

    try {
        console.log('Fetching company data...');
        
        // Load company data
        const [profileResponse, jobsResponse, analyticsResponse] = await Promise.all([
            apiCall('/companies/profile').catch(err => {
                console.error('Error fetching company profile:', err);
                return { success: false, data: null };
            }),
            apiCall('/jobs/company/me').catch(err => {
                console.error('Error fetching company jobs:', err);
                return { success: false, data: [] };
            }),
            apiCall('/companies/analytics').catch(err => {
                console.error('Error fetching company analytics:', err);
                return { success: false, data: {} };
            })
        ]);
        
        console.log('Profile response:', profileResponse);
        console.log('Jobs response:', jobsResponse);
        console.log('Analytics response:', analyticsResponse);
        
        const companyProfile = profileResponse.success ? profileResponse.data : null;
        const jobs = jobsResponse.success ? jobsResponse.data : [];
        const analytics = analyticsResponse.success ? analyticsResponse.data : {};
        
        // Store company name in sessionStorage for navigation display
        if (companyProfile && companyProfile.name) {
            sessionStorage.setItem('companyName', companyProfile.name);
            // Update navigation to show company name
            if (window.updateNavigation) {
                window.updateNavigation();
            }
        }
        
        console.log('Rendering dashboard...');
        
        dashboardContainer.innerHTML = `
            <div class="max-w-7xl mx-auto">
                <!-- Dashboard Header -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Company Dashboard</h2>
                            <p class="text-gray-600 dark:text-gray-300 mt-2">Manage your job postings and find the right talent.</p>
                        </div>
                        <div class="flex items-center space-x-4">
                            <!-- Notification Bell -->
                            <div id="company-notification-bell-container"></div>
                            
                            <button onclick="showCompanyProfile()" class="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 transition font-medium">
                                <i class="fas fa-building mr-2"></i>Edit Profile
                            </button>
                            ${createPrimaryButton('Post Job', 'showCreateJob()', 'fas fa-plus', 'px-4 py-2 rounded-lg')}
                        </div>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="grid md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <div class="flex items-center">
                            <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <i class="fas fa-briefcase text-[#56AE67] dark:text-[#6bc481] text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-2xl font-bold text-gray-900 dark:text-white">${analytics.totalJobs || 0}</p>
                                <p class="text-gray-600 dark:text-gray-300 text-sm">Total Jobs</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <div class="flex items-center">
                            <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <i class="fas fa-eye text-green-600 dark:text-green-400 text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-2xl font-bold text-gray-900 dark:text-white">${analytics.activeJobs || 0}</p>
                                <p class="text-gray-600 dark:text-gray-300 text-sm">Active Jobs</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <div class="flex items-center">
                            <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                <i class="fas fa-users text-purple-600 dark:text-purple-400 text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-2xl font-bold text-gray-900 dark:text-white">${analytics.totalApplications || 0}</p>
                                <p class="text-gray-600 dark:text-gray-300 text-sm">Total Applications</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <div class="flex items-center">
                            <div class="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                                <i class="fas fa-star text-yellow-600 dark:text-yellow-400 text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-2xl font-bold text-gray-900 dark:text-white">${analytics.averageApplicantScore || 0}%</p>
                                <p class="text-gray-600 dark:text-gray-300 text-sm">Avg Applicant Score</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="grid lg:grid-cols-3 gap-8">
                    <!-- Jobs List -->
                    <div class="lg:col-span-2">
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
                            <div class="p-6 border-b border-gray-200 dark:border-gray-600">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Your Job Postings</h3>
                                    <button onclick="showCreateJob()" class="text-[#56AE67] hover:text-[#2d6b3c] dark:text-[#6bc481] dark:hover:text-[#7dd091] text-sm">
                                        <i class="fas fa-plus mr-1"></i>New Job
                                    </button>
                                </div>
                            </div>
                            <div class="divide-y divide-gray-100 dark:divide-gray-600">
                                ${jobs.length > 0 ?
                                    jobs.slice(0, 5).map(job => `
                                        <div class="p-6">
                                            <div class="flex items-start justify-between">
                                                <div class="flex-1">
                                                    <div class="flex items-center space-x-2 mb-2">
                                                        <h4 class="font-semibold text-gray-900 dark:text-white">${job.title}</h4>
                                                        <span class="text-xs px-2 py-1 rounded ${getJobStatusColor(job.status)}">
                                                            ${capitalizeFirst(job.status)}
                                                        </span>
                                                        ${job.requireCustomAssessment ? `
                                                            <span class="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                                                <i class="fas fa-clipboard-list mr-1"></i>Has Assessment
                                                            </span>
                                                        ` : ''}
                                                    </div>
                                                    <p class="text-gray-600 dark:text-gray-300 text-sm mb-2">${job.description.substring(0, 100)}...</p>
                                                    <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                                        <span><i class="fas fa-calendar mr-1"></i>Posted ${formatDate(job.createdAt)}</span>
                                                        <span><i class="fas fa-users mr-1"></i>${job.applications?.length || 0} applicants</span>
                                                        <span><i class="fas fa-map-marker-alt mr-1"></i>${job.location?.city || 'Remote'}</span>
                                                    </div>
                                                </div>
                                                <div class="flex space-x-2 ml-4">
                                                    <button onclick="viewJobApplications('${job._id}')" 
                                                        class="text-[#56AE67] hover:text-[#2d6b3c] dark:text-[#6bc481] dark:hover:text-[#7dd091] text-sm"
                                                        title="View Applications">
                                                        <i class="fas fa-users"></i>
                                                    </button>
                                                    ${job.requireCustomAssessment ? `
                                                        <button onclick="viewAssessmentResults('${job._id}')" 
                                                            class="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm"
                                                            title="View Assessment Results">
                                                            <i class="fas fa-chart-bar"></i>
                                                        </button>
                                                    ` : ''}
                                                    <button onclick="openCreateAssessmentModal('${job._id}')" 
                                                        class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                                                        title="Create Custom Assessment">
                                                        <i class="fas fa-clipboard-list"></i>
                                                    </button>
                                                    <button onclick="editJob('${job._id}')" 
                                                        class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
                                                        title="Edit Job">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button onclick="deleteJob('${job._id}', '${job.title}')" 
                                                        class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                                                        title="Delete Job">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')
                                    : '<div class="p-6 text-center text-gray-500 dark:text-gray-400">No jobs posted yet. Create your first job posting!</div>'
                                }
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar -->
                    <div class="lg:col-span-1 space-y-6">
                        <!-- Application Status Overview -->
                        ${analytics.applicationsByStatus ? `
                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Status</h3>
                                <div class="space-y-3">
                                    ${Object.entries(analytics.applicationsByStatus).map(([status, count]) => `
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-gray-900 dark:text-white capitalize">${status}</span>
                                            <span class="text-sm font-bold text-gray-900 dark:text-white">${count}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Top Skills -->
                        ${analytics.topSkills?.length > 0 ? `
                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Applicant Skills</h3>
                                <div class="space-y-2">
                                    ${analytics.topSkills.slice(0, 5).map(skill => `
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-gray-900 dark:text-white">${capitalizeFirst(skill.skill)}</span>
                                            <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-[#2d6b3c] dark:text-blue-200 rounded">${skill.count}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Quick Actions -->
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                            <div class="space-y-3">
                                <button onclick="window.location.href='/messages.html'" class="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                    <i class="fas fa-comments text-blue-600 dark:text-blue-400 mr-3"></i>
                                    <span class="text-sm text-gray-900 dark:text-white">Messages</span>
                                </button>
                                <button onclick="searchStudents()" class="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                    <i class="fas fa-search text-[#56AE67] dark:text-[#6bc481] mr-3"></i>
                                    <span class="text-sm text-gray-900 dark:text-white">Search Students</span>
                                </button>
                                <button onclick="showCreateJob()" class="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                    <i class="fas fa-plus text-green-600 dark:text-green-400 mr-3"></i>
                                    <span class="text-sm text-gray-900 dark:text-white">Post New Job</span>
                                </button>
                                <button onclick="viewAllApplications()" class="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                    <i class="fas fa-file-alt text-purple-600 dark:text-purple-400 mr-3"></i>
                                    <span class="text-sm text-gray-900 dark:text-white">View All Applications</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Load notification bell component
        setTimeout(() => {
            loadNotificationBell('company-notification-bell-container');
        }, 500);
        
    } catch (error) {
        console.error('Error loading company dashboard:', error);
        console.error('Error stack:', error.stack);
        
        showToast('Error loading dashboard: ' + error.message, 'error');
        
        dashboardContainer.innerHTML = `
            <div class="max-w-4xl mx-auto text-center py-12">
                <div class="text-red-500 text-6xl mb-4">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Loading Error</h2>
                <p class="text-gray-600 dark:text-gray-300 mb-2">There was an error loading your dashboard.</p>
                <p class="text-sm text-red-600 dark:text-red-400 mb-6">${error.message}</p>
                <button onclick="loadCompanyDashboard()" 
                    style="background-color: #56AE67; color: white;"
                    class="bg-[#56AE67] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition"
                    onmouseover="this.style.backgroundColor='#3d8b4f'" 
                    onmouseout="this.style.backgroundColor='#56AE67'">
                    Retry
                </button>
            </div>
        `;
    }
}

// Helper functions
// ============================================
// PROFILE MANAGEMENT
// ============================================

function renderProfileCompleteness(profile) {
    if (!profile) {
        return `
            <div class="text-center py-4">
                <p class="text-gray-500 text-sm mb-4">Complete your profile to get better job matches</p>
                ${createPrimaryButton('Create Profile', 'showStudentProfileModal()', '', 'px-4 py-2 rounded text-sm')}
            </div>
        `;
    }
    
    const fields = [
        { key: 'firstName', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'education', label: 'Education' },
        { key: 'resume', label: 'Resume' },
        { key: 'portfolio', label: 'Portfolio' }
    ];
    
    const completedFields = fields.filter(field => {
        if (field.key === 'education') return profile.education?.school;
        if (field.key === 'resume') return profile.resume?.filename;
        if (field.key === 'portfolio') return profile.portfolio?.githubUrl || profile.portfolio?.linkedinUrl;
        return profile[field.key];
    });
    
    const completeness = Math.round((completedFields.length / fields.length) * 100);
    
    return `
        <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium">Profile Completeness</span>
                <span class="text-sm font-bold">${completeness}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-[#56AE67] h-2 rounded-full transition-all duration-1000" style="width: ${completeness}%"></div>
            </div>
        </div>
        <div class="space-y-2 text-sm">
            ${fields.map(field => {
                const isCompleted = completedFields.includes(field);
                return `
                    <div class="flex items-center">
                        <i class="fas fa-${isCompleted ? 'check text-green-500' : 'times text-red-500'} mr-2"></i>
                        <span class="${isCompleted ? 'text-gray-900' : 'text-gray-500'}">${field.label}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ============================================
// STATUS COLOR HELPERS
// ============================================

function getStatusColor(status) {
    const colors = {
        pending: 'bg-yellow-100 text-yellow-800',
        reviewed: 'bg-blue-100 text-[#2d6b3c]',
        shortlisted: 'bg-purple-100 text-purple-800',
        rejected: 'bg-red-100 text-red-800',
        hired: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getJobStatusColor(status) {
    const colors = {
        draft: 'bg-gray-100 text-gray-800',
        active: 'bg-green-100 text-green-800',
        closed: 'bg-red-100 text-red-800',
        'on-hold': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

// Dashboard Actions - Student Profile
window.showStudentProfileModal = function() {
    const modal = document.getElementById('login-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    modalTitle.textContent = 'Edit Student Profile';
    
    // First load the current profile data
    loadCurrentStudentProfile().then(profile => {
        modalContent.innerHTML = `
            <form id="student-profile-form" onsubmit="saveStudentProfile(event)">
                <div class="grid md:grid-cols-2 gap-4">
                    <!-- Personal Information -->
                    <div>
                        <h4 class="font-semibold mb-3">Personal Information</h4>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">First Name *</label>
                            <input type="text" id="firstName" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.firstName || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Last Name *</label>
                            <input type="text" id="lastName" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.lastName || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Date of Birth *</label>
                            <input type="date" id="dateOfBirth" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Phone *</label>
                            <input type="tel" id="phone" required 
                                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                                value="${profile?.phone || ''}"
                                maxlength="11"
                                pattern="[0-9]{10,11}"
                                title="Please enter a valid phone number (10-11 digits)"
                                oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 11)">
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter 10-11 digit phone number</p>
                        </div>
                    </div>
                    
                    <!-- Address -->
                    <div>
                        <h4 class="font-semibold mb-3">Address</h4>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Street</label>
                            <input type="text" id="street" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.address?.street || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">City</label>
                            <input type="text" id="city" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.address?.city || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">State</label>
                            <input type="text" id="state" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.address?.state || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Country</label>
                            <input type="text" id="country" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.address?.country || ''}">
                        </div>
                    </div>
                </div>
                
                <!-- Education -->
                <div class="mt-6">
                    <h4 class="font-semibold mb-3">Education</h4>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">School/University</label>
                            <input type="text" id="school" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.education?.school || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Degree</label>
                            <input type="text" id="degree" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.education?.degree || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Field of Study</label>
                            <input type="text" id="fieldOfStudy" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.education?.fieldOfStudy || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Graduation Year</label>
                            <input type="number" id="graduationYear" min="2000" max="2030" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.education?.graduationYear || ''}">
                        </div>
                    </div>
                </div>
                
                <!-- Portfolio -->
                <div class="mt-6">
                    <h4 class="font-semibold mb-3">Portfolio & Links</h4>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">GitHub URL</label>
                            <input type="url" id="githubUrl" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.portfolio?.githubUrl || ''}" placeholder="https://github.com/username">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">LinkedIn URL</label>
                            <input type="url" id="linkedinUrl" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.portfolio?.linkedinUrl || ''}" placeholder="https://linkedin.com/in/username">
                        </div>
                        <div class="mb-4 md:col-span-2">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Personal Website</label>
                            <input type="url" id="personalWebsite" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.portfolio?.personalWebsite || ''}" placeholder="https://yourwebsite.com">
                        </div>
                    </div>
                </div>
                
                <!-- Job Preferences -->
                <div class="mt-6">
                    <h4 class="font-semibold mb-3">Job Preferences</h4>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Job Types</label>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="checkbox" value="full-time" ${profile?.preferences?.jobTypes?.includes('full-time') ? 'checked' : ''} class="mr-2"> Full-time
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" value="part-time" ${profile?.preferences?.jobTypes?.includes('part-time') ? 'checked' : ''} class="mr-2"> Part-time
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" value="internship" ${profile?.preferences?.jobTypes?.includes('internship') ? 'checked' : ''} class="mr-2"> Internship
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" value="ojt" ${profile?.preferences?.jobTypes?.includes('ojt') ? 'checked' : ''} class="mr-2"> OJT
                                </label>
                            </div>
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Preferred Locations (comma-separated)</label>
                            <input type="text" id="locations" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.preferences?.locations?.join(', ') || ''}" placeholder="Manila, Quezon City, Makati">
                            <div class="mt-2">
                                <label class="flex items-center">
                                    <input type="checkbox" id="remote" ${profile?.preferences?.remote ? 'checked' : ''} class="mr-2"> Open to remote work
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-600 sticky bottom-0 bg-white dark:bg-gray-800 -mx-6 px-6 pb-4">
                    <button type="button" onclick="closeModal()" 
                        class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition font-semibold border-2 border-gray-700 dark:border-gray-400"
                        style="border: 2px solid #374151;">
                        Cancel
                    </button>
                    <button type="submit" 
                        class="bg-[#56AE67] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition font-semibold border-2 border-green-800 dark:border-green-600"
                        style="background-color: #56AE67; color: white; border: 2px solid #2d6b3c;"
                        onmouseover="this.style.backgroundColor='#3d8b4f'" 
                        onmouseout="this.style.backgroundColor='#56AE67'">
                        <span class="loading hidden"></span>
                        Save Profile
                    </button>
                </div>
            </form>
        `;
        
        modal.classList.remove('hidden');
    }).catch(error => {
        console.error('Error loading profile:', error);
        showToast('Error loading profile data', 'error');
    });
}

async function loadCurrentStudentProfile() {
    try {
        const response = await apiCall('/students/profile');
        return response.data;
    } catch (error) {
        // Profile doesn't exist yet, return empty object
        return {};
    }
}

window.saveStudentProfile = async function(event) {
    event.preventDefault();
    
    const form = document.getElementById('student-profile-form');
    const loading = form.querySelector('.loading');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Debug: Check current user and token
    const currentUser = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const authToken = sessionStorage.getItem('authToken');
    console.log('Current user role:', currentUser.role);
    console.log('Auth token exists:', !!authToken);
    
    // Verify user is actually a student
    if (currentUser.role !== 'student') {
        showToast('Error: You must be logged in as a student to save student profile', 'error');
        return;
    }
    
    // Show loading
    loading.classList.remove('hidden');
    submitBtn.disabled = true;
    
    try {
        // Collect form data
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            dateOfBirth: document.getElementById('dateOfBirth').value,
            phone: document.getElementById('phone').value,
            address: {
                street: document.getElementById('street').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                country: document.getElementById('country').value,
            },
            education: {
                school: document.getElementById('school').value,
                degree: document.getElementById('degree').value,
                fieldOfStudy: document.getElementById('fieldOfStudy').value,
                graduationYear: (() => {
                    const val = document.getElementById('graduationYear').value.trim();
                    return val && !isNaN(parseInt(val)) ? parseInt(val) : null;
                })(),
            },
            portfolio: {
                githubUrl: document.getElementById('githubUrl').value,
                linkedinUrl: document.getElementById('linkedinUrl').value,
                personalWebsite: document.getElementById('personalWebsite').value,
            },
            preferences: {
                jobTypes: Array.from(document.querySelectorAll('input[type="checkbox"]:not(#remote):checked')).map(cb => cb.value),
                locations: document.getElementById('locations').value.split(',').map(loc => loc.trim()).filter(loc => loc),
                remote: document.getElementById('remote').checked,
                salaryRange: {
                    min: null,
                    max: null
                }
            }
        };
        
        console.log('Sending profile update to /students/profile');
        
        await apiCall('/students/profile', {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        showToast('Profile updated successfully!', 'success');
        closeModal();
        
        // Refresh dashboard
        loadStudentDashboard();
        
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Error saving profile: ' + error.message, 'error');
    } finally {
        loading.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

function showCompanyProfile() {
    const modal = document.getElementById('login-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    modalTitle.textContent = 'Edit Company Profile';
    
    // Load current company profile
    loadCurrentCompanyProfile().then(profile => {
        modalContent.innerHTML = `
            <form id="company-profile-form" onsubmit="saveCompanyProfile(event)">
                <div class="grid md:grid-cols-2 gap-4">
                    <!-- Company Information -->
                    <div>
                        <h4 class="font-semibold mb-3">Company Information</h4>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Company Name *</label>
                            <input type="text" id="companyName" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.companyName || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Industry *</label>
                            <select id="industry" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
                                <option value="">Select Industry</option>
                                <option value="Technology" ${profile?.industry === 'Technology' ? 'selected' : ''}>Technology</option>
                                <option value="Finance" ${profile?.industry === 'Finance' ? 'selected' : ''}>Finance</option>
                                <option value="Healthcare" ${profile?.industry === 'Healthcare' ? 'selected' : ''}>Healthcare</option>
                                <option value="Education" ${profile?.industry === 'Education' ? 'selected' : ''}>Education</option>
                                <option value="Retail" ${profile?.industry === 'Retail' ? 'selected' : ''}>Retail</option>
                                <option value="Manufacturing" ${profile?.industry === 'Manufacturing' ? 'selected' : ''}>Manufacturing</option>
                                <option value="Other" ${profile?.industry === 'Other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Company Size *</label>
                            <select id="companySize" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
                                <option value="">Select Size</option>
                                <option value="1-10" ${profile?.companySize === '1-10' ? 'selected' : ''}>1-10 employees</option>
                                <option value="11-50" ${profile?.companySize === '11-50' ? 'selected' : ''}>11-50 employees</option>
                                <option value="51-200" ${profile?.companySize === '51-200' ? 'selected' : ''}>51-200 employees</option>
                                <option value="201-500" ${profile?.companySize === '201-500' ? 'selected' : ''}>201-500 employees</option>
                                <option value="500+" ${profile?.companySize === '500+' ? 'selected' : ''}>500+ employees</option>
                            </select>
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Website</label>
                            <input type="url" id="website" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.website || ''}" placeholder="https://company.com">
                        </div>
                    </div>
                    
                    <!-- Contact Information -->
                    <div>
                        <h4 class="font-semibold mb-3">Contact Person</h4>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">First Name</label>
                            <input type="text" id="contactFirstName" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.contactPerson?.firstName || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Last Name</label>
                            <input type="text" id="contactLastName" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.contactPerson?.lastName || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Title</label>
                            <input type="text" id="contactTitle" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.contactPerson?.title || ''}" placeholder="HR Manager">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Phone</label>
                            <input type="tel" id="contactPhone" 
                                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                                value="${profile?.contactPerson?.phone || ''}"
                                maxlength="11"
                                pattern="[0-9]{10,11}"
                                title="Please enter a valid phone number (10-11 digits)"
                                oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 11)">
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter 10-11 digit phone number</p>
                        </div>
                    </div>
                </div>
                
                <!-- Description -->
                <div class="mt-6">
                    <h4 class="font-semibold mb-3">Company Description *</h4>
                    <textarea id="description" required rows="4" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" placeholder="Describe your company...">${profile?.description || ''}</textarea>
                </div>
                
                <!-- Address -->
                <div class="mt-6">
                    <h4 class="font-semibold mb-3">Address</h4>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Street</label>
                            <input type="text" id="companyStreet" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.address?.street || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">City</label>
                            <input type="text" id="companyCity" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.address?.city || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">State</label>
                            <input type="text" id="companyState" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.address?.state || ''}">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Country</label>
                            <input type="text" id="companyCountry" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" value="${profile?.address?.country || ''}">
                        </div>
                    </div>
                </div>
                
                <!-- Benefits -->
                <div class="mt-6">
                    <h4 class="font-semibold mb-3">Company Benefits (comma-separated)</h4>
                    <input type="text" id="benefits" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600" value="${profile?.benefits?.join(', ') || ''}" placeholder="Health Insurance, Flexible Hours, Remote Work">
                </div>
                
                <div class="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-600 sticky bottom-0 bg-white dark:bg-gray-800 -mx-6 px-6 pb-4">
                    <button type="button" onclick="closeModal()" 
                        class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition font-semibold border-2 border-gray-700 dark:border-gray-400"
                        style="border: 2px solid #374151;">
                        Cancel
                    </button>
                    <button type="submit" 
                        class="bg-[#56AE67] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition font-semibold border-2 border-green-800 dark:border-green-600"
                        style="background-color: #56AE67; color: white; border: 2px solid #2d6b3c;"
                        onmouseover="this.style.backgroundColor='#3d8b4f'" 
                        onmouseout="this.style.backgroundColor='#56AE67'">
                        <span class="loading hidden"></span>
                        Save Profile
                    </button>
                </div>
            </form>
        `;
        
        modal.classList.remove('hidden');
    }).catch(error => {
        console.error('Error loading company profile:', error);
        showToast('Error loading profile data', 'error');
    });
}

async function loadCurrentCompanyProfile() {
    try {
        const response = await apiCall('/companies/profile');
        return response.data;
    } catch (error) {
        return {};
    }
}

async function saveCompanyProfile(event) {
    event.preventDefault();
    
    const form = document.getElementById('company-profile-form');
    const loading = form.querySelector('.loading');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    loading.classList.remove('hidden');
    submitBtn.disabled = true;
    
    try {
        const formData = {
            companyName: document.getElementById('companyName').value,
            industry: document.getElementById('industry').value,
            companySize: document.getElementById('companySize').value,
            description: document.getElementById('description').value,
            website: document.getElementById('website').value,
            address: {
                street: document.getElementById('companyStreet').value,
                city: document.getElementById('companyCity').value,
                state: document.getElementById('companyState').value,
                country: document.getElementById('companyCountry').value,
            },
            contactPerson: {
                firstName: document.getElementById('contactFirstName').value,
                lastName: document.getElementById('contactLastName').value,
                title: document.getElementById('contactTitle').value,
                phone: document.getElementById('contactPhone').value,
            },
            benefits: document.getElementById('benefits').value.split(',').map(b => b.trim()).filter(b => b),
        };
        
        await apiCall('/companies/profile', {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        showToast('Company profile updated successfully!', 'success');
        closeModal();
        loadCompanyDashboard();
        
    } catch (error) {
        console.error('Error saving company profile:', error);
        showToast('Error saving profile: ' + error.message, 'error');
    } finally {
        loading.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// ============================================
// JOB MANAGEMENT
// ============================================

function showCreateJob() {
    const modal = document.getElementById('login-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    modalTitle.textContent = 'Post New Job';
    
    modalContent.innerHTML = `
        <form id="create-job-form" onsubmit="saveJob(event)">
            <div class="grid md:grid-cols-2 gap-4">
                <!-- Job Basic Info -->
                <div>
                    <h4 class="font-semibold mb-3">Job Information</h4>
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Job Title *</label>
                        <input type="text" id="jobTitle" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" placeholder="e.g. Junior Software Developer">
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Department *</label>
                        <select id="jobDepartment" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
                            <option value="">Select Department</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Sales">Sales</option>
                            <option value="HR">Human Resources</option>
                            <option value="Finance">Finance</option>
                            <option value="Operations">Operations</option>
                            <option value="IT">Information Technology</option>
                            <option value="Design">Design</option>
                            <option value="Customer Support">Customer Support</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Job Type *</label>
                        <select id="jobType" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
                            <option value="">Select Job Type</option>
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                            <option value="ojt">OJT</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Experience Level *</label>
                        <select id="experienceLevel" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
                            <option value="">Select Experience Level</option>
                            <option value="entry-level">Entry Level</option>
                            <option value="junior">Junior</option>
                            <option value="mid-level">Mid Level</option>
                            <option value="senior">Senior</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Number of Positions</label>
                        <input type="number" id="numberOfPositions" min="1" value="1" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
                    </div>
                </div>
                
                <!-- Location & Salary -->
                <div>
                    <h4 class="font-semibold mb-3">Location & Compensation</h4>
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">City</label>
                        <input type="text" id="jobCity" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" placeholder="e.g. Manila">
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">State/Province</label>
                        <input type="text" id="jobState" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" placeholder="e.g. Metro Manila">
                    </div>
                    <div class="mb-4">
                        <div class="flex items-center">
                            <input type="checkbox" id="remoteWork" class="mr-2">
                            <label for="remoteWork" class="text-gray-700 dark:text-gray-300 text-sm">Remote Work Available</label>
                        </div>
                        <div class="flex items-center mt-2">
                            <input type="checkbox" id="hybridWork" class="mr-2">
                            <label for="hybridWork" class="text-gray-700 dark:text-gray-300 text-sm">Hybrid Work Available</label>
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Salary Range (Monthly)</label>
                        <div class="grid grid-cols-2 gap-2">
                            <input type="number" id="salaryMin" placeholder="Min" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
                            <input type="number" id="salaryMax" placeholder="Max" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Job Description -->
            <div class="mt-6">
                <h4 class="font-semibold mb-3">Job Description *</h4>
                <textarea id="jobDescription" required rows="4" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" placeholder="Describe the job role, what the candidate will be doing..."></textarea>
            </div>
            
            <!-- Requirements -->
            <div class="mt-6">
                <h4 class="font-semibold mb-3">Requirements</h4>
                <textarea id="requirements" rows="3" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]" placeholder="List the job requirements (one per line)..."></textarea>
                <small class="text-gray-500">Enter each requirement on a new line</small>
            </div>
            
            <!-- Skills Required -->
            <div class="mt-6">
                <h4 class="font-semibold mb-3">Skills Required</h4>
                <div id="skills-container">
                    <div class="skill-row flex gap-2 mb-2">
                        <input type="text" placeholder="Skill name" class="skill-name flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
                        <select class="skill-level px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                        </select>
                        <select class="skill-priority px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
                            <option value="nice-to-have">Nice to have</option>
                            <option value="must-have">Must have</option>
                        </select>
                        <button type="button" onclick="removeSkillRow(this)" class="text-red-600 hover:text-red-800 px-2">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <button type="button" onclick="addSkillRow()" class="text-[#56AE67] hover:text-[#2d6b3c] text-sm">
                    <i class="fas fa-plus mr-1"></i>Add Skill
                </button>
            </div>
            
            <!-- Application Deadline -->
            <div class="mt-6">
                <h4 class="font-semibold mb-3">Application Deadline</h4>
                <input type="date" id="applicationDeadline" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
            </div>
            
            <!-- Custom Assessment -->
            <div class="mt-6">
                <h4 class="font-semibold mb-3 flex items-center">
                    <i class="fas fa-clipboard-list mr-2 text-blue-600"></i>
                    Custom Assessment
                </h4>
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div class="flex items-start mb-3">
                        <input type="checkbox" id="requireCustomAssessment" class="mr-3 mt-1">
                        <div class="flex-1">
                            <label for="requireCustomAssessment" class="text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                                Require Custom Assessment
                            </label>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Students must complete a custom assessment before applying to this job.
                            </p>
                        </div>
                    </div>
                    <div id="assessment-note" class="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-3">
                        <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                        <span>After posting the job, you can create a custom assessment for this position from the job management page.</span>
                    </div>
                </div>
            </div>
            
            <div class="flex justify-between mt-8">
                <button type="button" onclick="closeModal()" class="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-800 dark:bg-gray-500 dark:hover:bg-gray-400 dark:text-gray-900 transition font-medium">
                    Cancel
                </button>
                <button type="submit" 
                    style="background-color: #56AE67; color: white;"
                    class="bg-[#56AE67] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition"
                    onmouseover="this.style.backgroundColor='#3d8b4f'" 
                    onmouseout="this.style.backgroundColor='#56AE67'">
                    <span class="loading hidden"></span>
                    Post Job
                </button>
            </div>
        </form>
    `;
    
    modal.classList.remove('hidden');
}

function addSkillRow() {
    const container = document.getElementById('skills-container');
    const skillRow = document.createElement('div');
    skillRow.className = 'skill-row flex gap-2 mb-2';
    skillRow.innerHTML = `
        <input type="text" placeholder="Skill name" class="skill-name flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
        <select class="skill-level px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
        </select>
        <select class="skill-priority px-3 py-2 border rounded-lg focus:outline-none focus:border-[#56AE67]">
            <option value="nice-to-have">Nice to have</option>
            <option value="must-have">Must have</option>
        </select>
        <button type="button" onclick="removeSkillRow(this)" class="text-red-600 hover:text-red-800 px-2">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(skillRow);
}

function removeSkillRow(button) {
    button.parentElement.remove();
}

async function saveJob(event) {
    event.preventDefault();
    
    const form = document.getElementById('create-job-form');
    const loading = form.querySelector('.loading');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    loading.classList.remove('hidden');
    submitBtn.disabled = true;
    
    try {
        // Collect skills
        const skillRows = document.querySelectorAll('.skill-row');
        const skills = Array.from(skillRows)
            .map(row => {
                const name = row.querySelector('.skill-name').value.trim();
                const level = row.querySelector('.skill-level').value;
                const priority = row.querySelector('.skill-priority').value;
                return name ? { name, level, priority } : null;
            })
            .filter(skill => skill !== null);
        
        const formData = {
            title: document.getElementById('jobTitle').value,
            department: document.getElementById('jobDepartment').value,
            description: document.getElementById('jobDescription').value,
            jobType: document.getElementById('jobType').value,
            experienceLevel: document.getElementById('experienceLevel').value,
            location: {
                city: document.getElementById('jobCity').value,
                state: document.getElementById('jobState').value,
                remote: document.getElementById('remoteWork').checked,
                hybrid: document.getElementById('hybridWork').checked,
            },
            salary: {
                min: document.getElementById('salaryMin').value ? parseInt(document.getElementById('salaryMin').value) : null,
                max: document.getElementById('salaryMax').value ? parseInt(document.getElementById('salaryMax').value) : null,
            },
            requirements: document.getElementById('requirements').value
                .split('\n')
                .map(req => req.trim())
                .filter(req => req),
            skillsRequired: skills,
            numberOfPositions: parseInt(document.getElementById('numberOfPositions').value) || 1,
            applicationDeadline: document.getElementById('applicationDeadline').value || null,
            requireCustomAssessment: document.getElementById('requireCustomAssessment').checked,
            status: 'active',
        };
        
        await apiCall('/jobs', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showToast('Job posted successfully!', 'success');
        closeModal();
        loadCompanyDashboard();
        
    } catch (error) {
        console.error('Error creating job:', error);
        showToast('Error creating job: ' + error.message, 'error');
    } finally {
        loading.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

function showAllJobMatches() {
    showToast('Full job matching feature coming soon!', 'info');
}

function showAllApplications() {
    const modal = document.getElementById('login-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    modalTitle.textContent = 'My Applications';

    // Show loading state
    modalContent.innerHTML = `
        <div class="flex items-center justify-center py-12">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-600">Loading your applications...</p>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');

    // Load applications data
    apiCall('/students/applications')
        .then(response => {
            console.log('Applications API response:', response);
            const applications = response.data || [];
            console.log('Applications data:', applications);

            modalContent.innerHTML = `
                <div class="max-h-96 overflow-y-auto">
                    ${applications.length > 0 ? `
                        <div class="space-y-4">
                            ${applications.map(app => {
                                // Safety checks for populated fields
                                if (!app.job) {
                                    console.warn('Application missing job data:', app);
                                    return '';
                                }
                                const jobTitle = app.job.title || 'Unknown Position';
                                const companyName = app.job.company?.companyName || 'Unknown Company';
                                const location = app.job.location?.city || 'Remote';
                                const jobType = app.job.jobType || 'full-time';
                                const description = app.job.description || 'No description available';
                                
                                return `
                                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                    <div class="flex items-start justify-between">
                                        <div class="flex-1">
                                            <div class="flex items-center space-x-3 mb-2">
                                                <h4 class="font-semibold text-gray-900 dark:text-white">${jobTitle}</h4>
                                                <span class="text-xs px-2 py-1 rounded ${getStatusColor(app.status)}">
                                                    ${capitalizeFirst(app.status)}
                                                </span>
                                            </div>
                                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">${companyName}</p>
                                            <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                                                <span><i class="fas fa-calendar mr-1"></i>Applied ${formatDate(app.appliedAt)}</span>
                                                <span><i class="fas fa-map-marker-alt mr-1"></i>${location}</span>
                                                <span><i class="fas fa-clock mr-1"></i>${capitalizeFirst(jobType)}</span>
                                            </div>
                                            <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>
                                        </div>
                                        <div class="flex flex-col space-y-2 ml-4">
                                            <button onclick="viewJob('${app.job._id}')" class="text-[#56AE67] hover:text-[#2d6b3c] text-sm">
                                                <i class="fas fa-eye mr-1"></i>View Job
                                            </button>
                                            ${app.status === 'pending' ? `
                                                <button onclick="withdrawApplication('${app._id}')" class="text-red-600 hover:text-red-800 text-sm">
                                                    <i class="fas fa-times mr-1"></i>Withdraw
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `}).filter(html => html).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-12">
                            <div class="text-gray-400 text-6xl mb-4">
                                <i class="fas fa-paper-plane"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">No Applications Yet</h3>
                            <p class="text-gray-600 mb-6">You haven't applied to any jobs yet. Start exploring job matches!</p>
                            <button onclick="switchToSection('dashboard'); closeModal()" class="bg-[#56AE67] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition">
                                View Job Matches
                            </button>
                        </div>
                    `}
                </div>

                ${applications.length > 0 ? `
                    <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                        <div class="text-sm text-gray-600">
                            Showing ${applications.length} application${applications.length !== 1 ? 's' : ''}
                        </div>
                        <div class="flex space-x-3">
                            <button onclick="closeModal()" class="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:bg-gray-500 dark:hover:bg-gray-400 dark:text-gray-900 transition font-medium">
                                Close
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="flex justify-end mt-6 pt-4 border-t border-gray-200">
                        <button onclick="closeModal()" class="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:bg-gray-500 dark:hover:bg-gray-400 dark:text-gray-900 transition font-medium">
                            Close
                        </button>
                    </div>
                `}
            `;
        })
        .catch(error => {
            console.error('Error loading applications:', error);
            console.error('Error details:', error.message, error.stack);
            modalContent.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-red-500 text-6xl mb-4">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">Error Loading Applications</h3>
                    <p class="text-gray-600 mb-6">There was an error loading your applications. Please try again.</p>
                    <div class="flex justify-center space-x-3">
                        <button onclick="showAllApplications()" 
                            style="background-color: #56AE67; color: white;"
                            class="bg-[#56AE67] text-white px-4 py-2 rounded-lg hover:bg-[#3d8b4f] transition"
                            onmouseover="this.style.backgroundColor='#3d8b4f'" 
                            onmouseout="this.style.backgroundColor='#56AE67'">
                            Retry
                        </button>
                        <button onclick="closeModal()" class="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:bg-gray-500 dark:hover:bg-gray-400 dark:text-gray-900 transition font-medium">
                            Close
                        </button>
                    </div>
                </div>
            `;
        });
}

function viewJob(jobId) {
    const modal = document.getElementById('login-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    modalTitle.textContent = 'Job Details';

    // Show loading state
    modalContent.innerHTML = `
        <div class="flex items-center justify-center py-12">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-600">Loading job details...</p>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');

    // Load job details
    apiCall(`/jobs/${jobId}`)
        .then(response => {
            const job = response.data;

            // Check if student has already applied
            apiCall('/students/applications')
                .then(appsResponse => {
                    const applications = appsResponse.data || [];
                    const hasApplied = applications.some(app => app.job && app.job._id === jobId);

                    modalContent.innerHTML = `
                        <div class="max-h-96 overflow-y-auto">
                            <!-- Job Header -->
                            <div class="mb-6">
                                <div class="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">${job.title}</h2>
                                        <p class="text-lg text-gray-600 dark:text-gray-300 mb-2">${job.company.companyName}</p>
                                        <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span><i class="fas fa-map-marker-alt mr-1"></i>${job.location?.city || 'Remote'}, ${job.location?.state || ''}</span>
                                            <span><i class="fas fa-clock mr-1"></i>${capitalizeFirst(job.jobType)}</span>
                                            <span><i class="fas fa-user-graduate mr-1"></i>${capitalizeFirst(job.experienceLevel)}</span>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        ${job.salary?.min || job.salary?.max ? `
                                            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                                                ₱${job.salary.min ? job.salary.min.toLocaleString() : '0'} - ₱${job.salary.max ? job.salary.max.toLocaleString() : '0'}
                                            </div>
                                            <div class="text-sm text-gray-500 dark:text-gray-400">per month</div>
                                        ` : ''}
                                    </div>
                                </div>

                                <!-- Job Status and Actions -->
                                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div class="flex items-center space-x-4">
                                        <span class="text-sm">
                                            <i class="fas fa-calendar mr-1"></i>
                                            Posted ${formatDate(job.createdAt)}
                                        </span>
                                        <span class="text-sm">
                                            <i class="fas fa-users mr-1"></i>
                                            ${job.applications?.length || 0} applicant${job.applications?.length !== 1 ? 's' : ''}
                                        </span>
                                        ${job.applicationDeadline ? `
                                            <span class="text-sm">
                                                <i class="fas fa-clock mr-1"></i>
                                                Deadline: ${formatDate(job.applicationDeadline)}
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>

                            <!-- Job Description -->
                            <div class="mb-6">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Job Description</h3>
                                <div class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">${job.description}</div>
                            </div>

                            <!-- Requirements -->
                            ${job.requirements && job.requirements.length > 0 ? `
                                <div class="mb-6">
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Requirements</h3>
                                    <ul class="space-y-2">
                                        ${job.requirements.map(req => `
                                            <li class="flex items-start">
                                                <i class="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                                                <span class="text-gray-700 dark:text-gray-300">${req}</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : ''}

                            <!-- Skills Required -->
                            ${job.skillsRequired && job.skillsRequired.length > 0 ? `
                                <div class="mb-6">
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Skills Required</h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        ${job.skillsRequired.map(skill => `
                                            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <div class="flex items-center">
                                                    <span class="font-medium text-gray-900 dark:text-white">${skill.name}</span>
                                                    ${skill.priority === 'must-have' ? `
                                                        <span class="ml-2 text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">Must have</span>
                                                    ` : `
                                                        <span class="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-[#2d6b3c] dark:text-blue-200 rounded">Nice to have</span>
                                                    `}
                                                </div>
                                                <span class="text-sm text-gray-600 dark:text-gray-400 capitalize">${skill.level}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            <!-- Assessment Requirement -->
                            ${job.requireCustomAssessment && job.customAssessment ? `
                                <div class="mb-6">
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Assessment Required</h3>
                                    <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                        <div class="flex items-start">
                                            <i class="fas fa-clipboard-list text-yellow-600 dark:text-yellow-400 text-xl mr-3 mt-1"></i>
                                            <div class="flex-1">
                                                <p class="font-semibold text-gray-900 dark:text-white mb-2">${job.customAssessment.title}</p>
                                                <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">${job.customAssessment.description}</p>
                                                <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                    <span><i class="fas fa-question-circle mr-1"></i>${job.customAssessment.questions?.length || 0} questions</span>
                                                    ${job.customAssessment.timeLimit ? `<span><i class="fas fa-clock mr-1"></i>${job.customAssessment.timeLimit} minutes</span>` : ''}
                                                    ${job.customAssessment.passingScore ? `<span><i class="fas fa-chart-line mr-1"></i>Pass: ${job.customAssessment.passingScore}%</span>` : ''}
                                                </div>
                                                ${window.currentAssessmentSubmissionId ? `
                                                    <div class="flex items-center text-green-600 dark:text-green-400">
                                                        <i class="fas fa-check-circle mr-2"></i>
                                                        <span class="font-semibold">Assessment Completed - You can now apply!</span>
                                                    </div>
                                                ` : `
                                                    <button onclick="takeCustomAssessmentForJob('${job._id}')" 
                                                        style="background-color: #2563eb; color: white; border: 2px solid #1e40af;"
                                                        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold border-2"
                                                        onmouseover="this.style.backgroundColor='#1d4ed8'" 
                                                        onmouseout="this.style.backgroundColor='#2563eb'">
                                                        <i class="fas fa-play-circle mr-2"></i>Take Assessment
                                                    </button>
                                                `}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}

                            <!-- Company Info -->
                            <div class="mb-6">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">About ${job.company.companyName}</h3>
                                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <div class="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Industry</p>
                                            <p class="font-medium text-gray-900 dark:text-white">${job.company.industry || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Company Size</p>
                                            <p class="font-medium text-gray-900 dark:text-white">${job.company.companySize || 'Not specified'}</p>
                                        </div>
                                        ${job.company.website ? `
                                            <div class="md:col-span-2">
                                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Website</p>
                                                <a href="${job.company.website}" target="_blank" class="text-[#56AE67] dark:text-[#6bc481] hover:underline">${job.company.website}</a>
                                            </div>
                                        ` : ''}
                                    </div>
                                    ${job.company.description ? `
                                        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                            <p class="text-gray-700 dark:text-gray-300">${job.company.description}</p>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>

                            <!-- Job Details -->
                            <div class="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Job Details</h4>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex justify-between">
                                            <span class="text-gray-600 dark:text-gray-400">Job Type:</span>
                                            <span class="text-gray-900 dark:text-white capitalize">${job.jobType}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600 dark:text-gray-400">Experience Level:</span>
                                            <span class="text-gray-900 dark:text-white capitalize">${job.experienceLevel}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600 dark:text-gray-400">Positions Available:</span>
                                            <span class="text-gray-900 dark:text-white">${job.numberOfPositions || 1}</span>
                                        </div>
                                        ${job.location?.remote ? `
                                            <div class="flex justify-between">
                                                <span class="text-gray-600 dark:text-gray-400">Remote Work:</span>
                                                <span class="text-green-600 dark:text-green-400">Available</span>
                                            </div>
                                        ` : ''}
                                        ${job.location?.hybrid ? `
                                            <div class="flex justify-between">
                                                <span class="text-gray-600 dark:text-gray-400">Hybrid Work:</span>
                                                <span class="text-green-600 dark:text-green-400">Available</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>

                                <div>
                                    <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Benefits</h4>
                                    ${job.company.benefits && job.company.benefits.length > 0 ? `
                                        <div class="space-y-2">
                                            ${job.company.benefits.map(benefit => `
                                                <div class="flex items-center text-sm">
                                                    <i class="fas fa-check text-green-500 mr-2"></i>
                                                    <span class="text-gray-700 dark:text-gray-300">${benefit}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : `
                                        <p class="text-gray-500 dark:text-gray-400 text-sm">No benefits specified</p>
                                    `}
                                </div>
                            </div>
                        </div>

                        <!-- Modal Footer -->
                        <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div class="text-sm text-gray-600 dark:text-gray-400">
                                Job ID: ${job._id}
                            </div>
                            <div class="flex space-x-3">
                                <button onclick="closeModal()" class="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:bg-gray-500 dark:hover:bg-gray-400 dark:text-gray-900 transition font-medium">
                                    Close
                                </button>
                                ${!hasApplied ? `
                                    ${job.requireCustomAssessment && !window.currentAssessmentSubmissionId ? `
                                        <div class="flex items-center px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg">
                                            <i class="fas fa-exclamation-triangle mr-2"></i>
                                            <span class="text-sm">Complete assessment first</span>
                                        </div>
                                    ` : `
                                        <button onclick="applyForJob('${job._id}')" 
                                            style="background-color: #56AE67; color: white; border: 2px solid #2d6b3c;"
                                            class="bg-[#56AE67] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition font-semibold border-2 border-green-800 dark:border-green-600"
                                            onmouseover="this.style.backgroundColor='#3d8b4f'" 
                                            onmouseout="this.style.backgroundColor='#56AE67'">
                                            <i class="fas fa-paper-plane mr-2"></i>Apply Now
                                        </button>
                                    `}
                                ` : `
                                    <span class="inline-flex items-center px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                        <i class="fas fa-check mr-2"></i>Already Applied
                                    </span>
                                `}
                            </div>
                        </div>
                    `;
                })
                .catch(error => {
                    console.error('Error checking applications:', error);
                    // Show job details without application status
                    modalContent.innerHTML = `
                        <div class="max-h-96 overflow-y-auto">
                            <!-- Job Header -->
                            <div class="mb-6">
                                <div class="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">${job.title}</h2>
                                        <p class="text-lg text-gray-600 dark:text-gray-300 mb-2">${job.company.companyName}</p>
                                        <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span><i class="fas fa-map-marker-alt mr-1"></i>${job.location?.city || 'Remote'}, ${job.location?.state || ''}</span>
                                            <span><i class="fas fa-clock mr-1"></i>${capitalizeFirst(job.jobType)}</span>
                                            <span><i class="fas fa-user-graduate mr-1"></i>${capitalizeFirst(job.experienceLevel)}</span>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        ${job.salary?.min || job.salary?.max ? `
                                            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                                                ₱${job.salary.min ? job.salary.min.toLocaleString() : '0'} - ₱${job.salary.max ? job.salary.max.toLocaleString() : '0'}
                                            </div>
                                            <div class="text-sm text-gray-500 dark:text-gray-400">per month</div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>

                            <!-- Job Description -->
                            <div class="mb-6">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Job Description</h3>
                                <div class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">${job.description}</div>
                            </div>

                            <!-- Requirements -->
                            ${job.requirements && job.requirements.length > 0 ? `
                                <div class="mb-6">
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Requirements</h3>
                                    <ul class="space-y-2">
                                        ${job.requirements.map(req => `
                                            <li class="flex items-start">
                                                <i class="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                                                <span class="text-gray-700 dark:text-gray-300">${req}</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : ''}

                            <!-- Skills Required -->
                            ${job.skillsRequired && job.skillsRequired.length > 0 ? `
                                <div class="mb-6">
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Skills Required</h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        ${job.skillsRequired.map(skill => `
                                            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <div class="flex items-center">
                                                    <span class="font-medium text-gray-900 dark:text-white">${skill.name}</span>
                                                    ${skill.priority === 'must-have' ? `
                                                        <span class="ml-2 text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">Must have</span>
                                                    ` : `
                                                        <span class="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-[#2d6b3c] dark:text-blue-200 rounded">Nice to have</span>
                                                    `}
                                                </div>
                                                <span class="text-sm text-gray-600 dark:text-gray-400 capitalize">${skill.level}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            <!-- Company Info -->
                            <div class="mb-6">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">About ${job.company.companyName}</h3>
                                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <div class="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Industry</p>
                                            <p class="font-medium text-gray-900 dark:text-white">${job.company.industry || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Company Size</p>
                                            <p class="font-medium text-gray-900 dark:text-white">${job.company.companySize || 'Not specified'}</p>
                                        </div>
                                        ${job.company.website ? `
                                            <div class="md:col-span-2">
                                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Website</p>
                                                <a href="${job.company.website}" target="_blank" class="text-[#56AE67] dark:text-[#6bc481] hover:underline">${job.company.website}</a>
                                            </div>
                                        ` : ''}
                                    </div>
                                    ${job.company.description ? `
                                        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                            <p class="text-gray-700 dark:text-gray-300">${job.company.description}</p>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Modal Footer -->
                        <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div class="text-sm text-gray-600 dark:text-gray-400">
                                Job ID: ${job._id}
                            </div>
                            <div class="flex space-x-3">
                                <button onclick="closeModal()" class="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:bg-gray-500 dark:hover:bg-gray-400 dark:text-gray-900 transition font-medium">
                                    Close
                                </button>
                                <button onclick="applyForJob('${job._id}')" 
                                    style="background-color: #56AE67; color: white; border: 2px solid #2d6b3c;"
                                    class="bg-[#56AE67] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition font-semibold border-2 border-green-800 dark:border-green-600"
                                    onmouseover="this.style.backgroundColor='#3d8b4f'" 
                                    onmouseout="this.style.backgroundColor='#56AE67'">
                                    <i class="fas fa-paper-plane mr-2"></i>Apply Now
                                </button>
                            </div>
                        </div>
                    `;
                })
                .catch(error => {
                    console.error('Error loading job details:', error);
                    modalContent.innerHTML = `
                        <div class="text-center py-12">
                            <div class="text-red-500 text-6xl mb-4">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">Error Loading Job Details</h3>
                            <p class="text-gray-600 mb-6">There was an error loading the job details. Please try again.</p>
                            <div class="flex justify-center space-x-3">
                                <button onclick="viewJob('${jobId}')" 
                                    style="background-color: #56AE67; color: white; border: 2px solid #2d6b3c;"
                                    class="bg-[#56AE67] text-white px-4 py-2 rounded-lg hover:bg-[#3d8b4f] transition font-semibold border-2 border-green-800 dark:border-green-600"
                                    onmouseover="this.style.backgroundColor='#3d8b4f'" 
                                    onmouseout="this.style.backgroundColor='#56AE67'">
                                    Retry
                                </button>
                                <button onclick="closeModal()" class="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:bg-gray-500 dark:hover:bg-gray-400 dark:text-gray-900 transition font-medium">
                                    Close
                                </button>
                            </div>
                        </div>
                    `;
                });
        })
        .catch(error => {
            console.error('Error loading job details:', error);
            modalContent.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-red-500 text-6xl mb-4">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">Error Loading Job Details</h3>
                    <p class="text-gray-600 mb-6">There was an error loading the job details. Please try again.</p>
                    <div class="flex justify-center space-x-3">
                        <button onclick="viewJob('${jobId}')" 
                            style="background-color: #56AE67; color: white;"
                            class="bg-[#56AE67] text-white px-4 py-2 rounded-lg hover:bg-[#3d8b4f] transition"
                            onmouseover="this.style.backgroundColor='#3d8b4f'" 
                            onmouseout="this.style.backgroundColor='#56AE67'">
                            Retry
                        </button>
                        <button onclick="closeModal()" class="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:bg-gray-500 dark:hover:bg-gray-400 dark:text-gray-900 transition font-medium">
                            Close
                        </button>
                    </div>
                </div>
            `;
        });
}

// ============================================
// ASSESSMENT RESULTS
// ============================================

async function viewAssessmentResults(jobId) {
    try {
        // Fetch assessment submissions for this job
        const response = await apiCall(`/custom-assessments/job/${jobId}/submissions`);
        
        console.log('Assessment submissions response:', response);
        
        // Handle different response formats
        let submissions = [];
        if (Array.isArray(response)) {
            submissions = response;
        } else if (response.submissions && Array.isArray(response.submissions)) {
            submissions = response.submissions;
        } else if (response.data && Array.isArray(response.data)) {
            submissions = response.data;
        }
        
        console.log('Parsed submissions:', submissions);
        
        // Create and show modal
        const modal = createAssessmentResultsModal(jobId, submissions);
        document.body.appendChild(modal);
        modal.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading assessment results:', error);
        showToast('Failed to load assessment results: ' + error.message, 'error');
    }
}

function createAssessmentResultsModal(jobId, submissions) {
    const modal = document.createElement('div');
    modal.id = 'assessment-results-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    <i class="fas fa-chart-bar text-purple-600 mr-2"></i>
                    Assessment Results
                </h2>
                <button onclick="closeAssessmentResultsModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1 scrollbar-custom" style="max-height: calc(90vh - 100px);">
                ${submissions.length === 0 ? `
                    <div class="text-center py-16">
                        <i class="fas fa-clipboard-list text-gray-300 dark:text-gray-600 text-6xl mb-4"></i>
                        <p class="text-gray-500 dark:text-gray-400 text-lg">No assessment submissions yet</p>
                        <p class="text-gray-400 dark:text-gray-500 text-sm mt-2">Students haven't taken the assessment for this job yet</p>
                    </div>
                ` : `
                    <!-- Assessment Statistics -->
                    <div class="grid md:grid-cols-4 gap-4 mb-6">
                        <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm opacity-90">Total Submissions</p>
                                    <p class="text-3xl font-bold mt-1">${submissions.length}</p>
                                </div>
                                <i class="fas fa-users text-4xl opacity-20"></i>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm opacity-90">Passed</p>
                                    <p class="text-3xl font-bold mt-1">${submissions.filter(s => s.passed).length}</p>
                                </div>
                                <i class="fas fa-check-circle text-4xl opacity-20"></i>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-lg shadow">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm opacity-90">Failed</p>
                                    <p class="text-3xl font-bold mt-1">${submissions.filter(s => !s.passed).length}</p>
                                </div>
                                <i class="fas fa-times-circle text-4xl opacity-20"></i>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm opacity-90">Average Score</p>
                                    <p class="text-3xl font-bold mt-1">${Math.round(submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length)}%</p>
                                </div>
                                <i class="fas fa-chart-line text-4xl opacity-20"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Submissions List -->
                    <div class="space-y-4">
                        ${submissions.map((submission, index) => `
                            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 ${submission.passed ? 'border-green-500' : 'border-red-500'}">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-3 mb-3">
                                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                ${submission.student?.firstName?.charAt(0) || 'S'}${submission.student?.lastName?.charAt(0) || 'N'}
                                            </div>
                                            <div>
                                                <h4 class="font-semibold text-gray-900 dark:text-white">
                                                    ${submission.student?.firstName || 'Student'} ${submission.student?.lastName || index + 1}
                                                </h4>
                                                <p class="text-sm text-gray-500 dark:text-gray-400">${submission.student?.email || 'No email'}</p>
                                            </div>
                                        </div>
                                        
                                        <div class="grid md:grid-cols-3 gap-4 mb-3">
                                            <div>
                                                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Score</p>
                                                <div class="flex items-center gap-2">
                                                    <div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                        <div class="h-2 rounded-full ${submission.passed ? 'bg-green-500' : 'bg-red-500'}" style="width: ${submission.score}%"></div>
                                                    </div>
                                                    <span class="text-lg font-bold ${submission.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${submission.score}%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${submission.passed ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}">
                                                    <i class="fas ${submission.passed ? 'fa-check-circle' : 'fa-times-circle'} mr-2"></i>
                                                    ${submission.passed ? 'Passed' : 'Failed'}
                                                </span>
                                            </div>
                                            <div>
                                                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Submitted</p>
                                                <p class="text-sm text-gray-900 dark:text-white">
                                                    <i class="far fa-clock mr-1"></i>
                                                    ${formatDate(submission.submittedAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                            <span><i class="fas fa-question-circle mr-1"></i>${submission.answers?.length || 0} questions answered</span>
                                            <span><i class="fas fa-clock mr-1"></i>Time taken: ${formatDuration(submission.timeTaken)}</span>
                                        </div>
                                    </div>
                                    
                                    <button onclick="viewSubmissionDetails('${submission._id}')" 
                                        class="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white rounded-lg text-sm font-medium transition-colors">
                                        <i class="fas fa-eye mr-2"></i>View Details
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
    
    // Add click outside to close
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAssessmentResultsModal();
        }
    });
    
    return modal;
}

function closeAssessmentResultsModal() {
    const modal = document.getElementById('assessment-results-modal');
    if (modal) {
        modal.remove();
    }
}

function formatDuration(seconds) {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

async function viewSubmissionDetails(submissionId) {
    try {
        console.log('=== CLIENT: Fetching submission details ===');
        console.log('Submission ID:', submissionId);
        console.log('Full URL will be:', `/custom-assessments/submissions/${submissionId}`);
        console.log('Auth token exists:', !!sessionStorage.getItem('authToken'));
        
        // Close the assessment results modal first
        closeAssessmentResultsModal();
        
        const response = await apiCall(`/custom-assessments/submissions/${submissionId}`);
        
        console.log('=== CLIENT: Response received ===');
        console.log('Raw response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', response ? Object.keys(response) : 'null');
        
        // Handle different response formats
        let submission = null;
        if (response.submission) {
            submission = response.submission;
        } else if (response.data) {
            submission = response.data;
        } else if (response._id) {
            // Response is the submission object itself
            submission = response;
        }
        
        if (!submission) {
            console.error('No submission data found in response:', response);
            showToast('Failed to load submission details - no data received', 'error');
            return;
        }
        
        console.log('Parsed submission:', submission);
        
        // Create detailed view modal
        const detailModal = document.createElement('div');
        detailModal.id = 'submission-details-modal';
        detailModal.className = 'fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4';
        
        detailModal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                        Assessment Details - ${submission.student?.firstName} ${submission.student?.lastName}
                    </h2>
                    <button onclick="closeSubmissionDetailsModal()" 
                        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                
                <div class="p-6 overflow-y-auto flex-1" style="max-height: calc(90vh - 180px); scrollbar-width: thin; scrollbar-color: #56AE67 #e5e7eb;">
                    <style>
                        .submission-details-scroll::-webkit-scrollbar {
                            width: 8px;
                        }
                        .submission-details-scroll::-webkit-scrollbar-track {
                            background: #e5e7eb;
                            border-radius: 4px;
                        }
                        .dark .submission-details-scroll::-webkit-scrollbar-track {
                            background: #374151;
                        }
                        .submission-details-scroll::-webkit-scrollbar-thumb {
                            background: #56AE67;
                            border-radius: 4px;
                        }
                        .submission-details-scroll::-webkit-scrollbar-thumb:hover {
                            background: #3d8b4f;
                        }
                    </style>
                    <div class="submission-details-scroll">
                    <div class="mb-6 grid md:grid-cols-3 gap-4">
                        <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Final Score</p>
                            <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">${submission.score}%</p>
                        </div>
                        <div class="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-100 dark:border-green-800">
                            <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Correct Answers</p>
                            <p class="text-3xl font-bold text-green-600 dark:text-green-400">${submission.answers?.filter(a => a.isCorrect).length || 0}/${submission.answers?.length || 0}</p>
                        </div>
                        <div class="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                            <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Time Taken</p>
                            <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">${formatDuration(submission.timeTaken)}</p>
                        </div>
                    </div>

                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Question Breakdown</h3>
                    ${!submission.answers || submission.answers.length === 0 ? `
                        <div class="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            <i class="fas fa-info-circle text-gray-400 dark:text-gray-500 text-3xl mb-2"></i>
                            <p class="text-gray-600 dark:text-gray-400">No detailed answer information available for this submission.</p>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            ${submission.answers.map((answer, index) => {
                                // Get the question details from assessment
                                const question = submission.assessment?.questions?.find(q => q._id.toString() === answer.questionId.toString());
                                const questionText = question?.question || `Question ${index + 1}`;
                                const correctAnswer = question?.correctAnswer || 'N/A';
                                const studentAnswer = answer.answer || 'No answer provided';
                                const options = question?.options || [];
                                
                                // If question has options, show the option text instead of just the letter
                                let displayStudentAnswer = studentAnswer;
                                let displayCorrectAnswer = correctAnswer;
                                
                                if (options.length > 0) {
                                    // Find the matching option for student's answer
                                    const studentOption = options.find(opt => opt === studentAnswer || opt.startsWith(studentAnswer + ')') || opt.startsWith(studentAnswer + '.'));
                                    if (studentOption) {
                                        displayStudentAnswer = studentOption;
                                    }
                                    
                                    // Find the matching option for correct answer
                                    const correctOption = options.find(opt => opt === correctAnswer || opt.startsWith(correctAnswer + ')') || opt.startsWith(correctAnswer + '.'));
                                    if (correctOption) {
                                        displayCorrectAnswer = correctOption;
                                    }
                                }
                                
                                return `
                                <div class="border ${answer.isCorrect ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20' : 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'} rounded-lg p-5 mb-4">
                                    <div class="flex items-start gap-4">
                                        <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${answer.isCorrect ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200'}">
                                            <i class="fas ${answer.isCorrect ? 'fa-check' : 'fa-times'} text-lg"></i>
                                        </div>
                                        <div class="flex-1">
                                            <div class="flex items-start justify-between mb-3">
                                                <h4 class="font-semibold text-gray-900 dark:text-white text-base">Question ${index + 1}</h4>
                                                <span class="text-xs px-3 py-1 rounded-full font-medium ${answer.isCorrect ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200'}">
                                                    ${answer.isCorrect ? 'Correct' : 'Incorrect'}
                                                </span>
                                            </div>
                                            <p class="text-gray-700 dark:text-gray-200 mb-4 text-sm leading-relaxed">${questionText}</p>
                                            
                                            <div class="space-y-3 bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div class="flex items-start gap-2">
                                                    <i class="fas fa-user-circle text-blue-500 dark:text-blue-400 mt-1"></i>
                                                    <div class="flex-1">
                                                        <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Student's Answer</p>
                                                        <p class="text-gray-900 dark:text-gray-100 font-medium">${displayStudentAnswer}</p>
                                                    </div>
                                                </div>
                                                
                                                <div class="border-t border-gray-200 dark:border-gray-600 pt-3 flex items-start gap-2">
                                                    <i class="fas fa-check-circle text-green-500 dark:text-green-400 mt-1"></i>
                                                    <div class="flex-1">
                                                        <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Correct Answer</p>
                                                        <p class="text-green-700 dark:text-green-300 font-medium">${displayCorrectAnswer}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `}).join('')}
                        </div>
                    `}
                    </div>
                </div>
                
                <!-- Footer with Close Button -->
                <div class="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end">
                    <button onclick="closeSubmissionDetailsModal()" 
                        style="background-color: #4B5563; color: white;"
                        class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                        onmouseover="this.style.backgroundColor='#374151'" 
                        onmouseout="this.style.backgroundColor='#4B5563'">
                        <i class="fas fa-times mr-2"></i>Close
                    </button>
                </div>
            </div>
        `;
        
        // Add click outside to close
        detailModal.addEventListener('click', function(e) {
            if (e.target === detailModal) {
                closeSubmissionDetailsModal();
            }
        });
        
        document.body.appendChild(detailModal);
        
    } catch (error) {
        console.error('Error loading submission details:', error);
        showToast('Failed to load submission details: ' + error.message, 'error');
    }
}

function closeSubmissionDetailsModal() {
    const modal = document.getElementById('submission-details-modal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// JOB APPLICATIONS
// ============================================

function viewJobApplications(jobId) {
    // Create and show a modal to view job applications
    const modal = createJobApplicationsModal(jobId);
    document.body.appendChild(modal);
    modal.classList.remove('hidden');
    
    // Load applications data
    loadJobApplications(jobId);
}

function createJobApplicationsModal(jobId) {
    const modal = document.createElement('div');
    modal.id = 'job-applications-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.dataset.jobId = jobId; // Store jobId in modal
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Job Applications</h2>
                <button onclick="closeJobApplicationsModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="p-6 overflow-y-auto max-h-[70vh]">
                <!-- Application Status Filters -->
                <div class="mb-6">
                    <div class="flex flex-wrap gap-2">
                        <button onclick="filterApplications('all')" class="application-filter active px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
                            style="background-color: #56AE67; color: white; opacity: 1;">
                            All Applications
                        </button>
                        <button onclick="filterApplications('pending')" class="application-filter px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
                            style="background-color: #f59e0b; color: white; opacity: 0.6;">
                            Pending
                        </button>
                        <button onclick="filterApplications('reviewed')" class="application-filter px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
                            style="background-color: #3b82f6; color: white; opacity: 0.6;">
                            Reviewed
                        </button>
                        <button onclick="filterApplications('shortlisted')" class="application-filter px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
                            style="background-color: #6b7280; color: white; opacity: 0.6;">
                            Shortlisted
                        </button>
                        <button onclick="filterApplications('rejected')" class="application-filter px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
                            style="background-color: #ef4444; color: white; opacity: 0.6;">
                            Rejected
                        </button>
                        <button onclick="filterApplications('hired')" class="application-filter px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
                            style="background-color: #8b5cf6; color: white; opacity: 0.6;">
                            Hired
                        </button>
                    </div>
                </div>
                
                <!-- Applications Loading -->
                <div id="applications-loading" class="text-center py-8">
                    <div class="loading inline-block mr-2"></div>
                    <span>Loading applications...</span>
                </div>
                
                <!-- Applications List -->
                <div id="applications-list" class="hidden space-y-4">
                    <!-- Applications will be loaded here -->
                </div>
                
                <!-- No Applications Message -->
                <div id="no-applications" class="hidden text-center py-8">
                    <div class="text-gray-500 dark:text-gray-400">
                        <i class="fas fa-inbox text-4xl mb-4"></i>
                        <p>No applications found for this job.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

async function loadJobApplications(jobId) {
    try {
        const response = await apiCall(`/jobs/${jobId}/applications`);
        if (response.success) {
            displayJobApplications(response.data.applications);
        } else {
            throw new Error(response.message || 'Failed to load applications');
        }
    } catch (error) {
        console.error('Error loading job applications:', error);
        document.getElementById('applications-loading').innerHTML = `
            <div class="text-red-500 text-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Error loading applications: ${error.message}
            </div>
        `;
    }
}

function displayJobApplications(applications) {
    console.log('displayJobApplications called with:', applications);
    
    const loadingDiv = document.getElementById('applications-loading');
    const listDiv = document.getElementById('applications-list');
    const noAppsDiv = document.getElementById('no-applications');
    
    loadingDiv.classList.add('hidden');
    
    if (!applications || applications.length === 0) {
        noAppsDiv.classList.remove('hidden');
        return;
    }
    
    // Log first application to see structure
    if (applications[0]) {
        console.log('First application structure:', applications[0]);
        console.log('Student object:', applications[0].student);
        console.log('Student _id:', applications[0].student?._id);
    }
    
    listDiv.classList.remove('hidden');
    listDiv.innerHTML = applications.map(app => {
        const statusColor = {
            'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            'reviewed': 'bg-blue-100 text-[#2d6b3c] dark:bg-blue-900 dark:text-[#7dd091]',
            'shortlisted': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            'hired': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
        }[app.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        
        return `
            <div class="application-item border border-gray-200 dark:border-gray-600 rounded-lg p-4" data-status="${app.status}">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            ${app.student?.firstName || 'Unknown'} ${app.student?.lastName || 'Student'}
                        </h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Applied: ${new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="viewStudentProfile('${typeof app.student === 'object' ? app.student._id : app.student}')" 
                            style="background-color: #56AE67; color: white; border: 2px solid #2d6b3c;"
                            class="px-3 py-1 bg-[#56AE67] hover:bg-[#3d8b4f] text-white rounded text-sm font-semibold border-2 border-green-800 dark:border-green-600"
                            onmouseover="this.style.backgroundColor='#3d8b4f'" 
                            onmouseout="this.style.backgroundColor='#56AE67'">
                            <i class="fas fa-user mr-1"></i>View Profile
                        </button>
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">
                            ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                        <div class="relative">
                            <button onclick="toggleApplicationActions('${app._id}')" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div id="actions-${app._id}" class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                                <button onclick="updateApplicationStatus('${app._id}', 'reviewed')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <i class="fas fa-eye mr-2"></i>Mark as Reviewed
                                </button>
                                <button onclick="updateApplicationStatus('${app._id}', 'shortlisted')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <i class="fas fa-star mr-2"></i>Shortlist
                                </button>
                                <button onclick="updateApplicationStatus('${app._id}', 'rejected')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <i class="fas fa-times mr-2"></i>Reject
                                </button>
                                <button onclick="updateApplicationStatus('${app._id}', 'hired')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <i class="fas fa-check mr-2"></i>Hire
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">Assessment Score</h4>
                        <div class="flex items-center">
                            <div class="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                                <div class="bg-[#56AE67] h-2 rounded-full" style="width: ${app.student?.assessmentScore?.overall || 0}%"></div>
                            </div>
                            <span class="text-sm font-medium">${app.student?.assessmentScore?.overall || 0}%</span>
                            ${!app.student?.assessmentScore?.overall ? '<span class="text-xs text-gray-500 dark:text-gray-400 ml-2">(Not taken)</span>' : ''}
                        </div>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">Match Score</h4>
                        <div class="flex items-center">
                            <div class="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                                <div class="bg-green-600 h-2 rounded-full" style="width: ${app.matchScore || 0}%"></div>
                            </div>
                            <span class="text-sm font-medium">${app.matchScore || 0}%</span>
                            ${!app.matchScore ? '<span class="text-xs text-gray-500 dark:text-gray-400 ml-2">(Calculating...)</span>' : ''}
                        </div>
                    </div>
                </div>
                
                ${app.student?.skills && app.student.skills.length > 0 ? `
                    <div class="mt-3">
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">Skills</h4>
                        <div class="flex flex-wrap gap-1">
                            ${app.student.skills.slice(0, 5).map(skill => `
                                <span class="skill-badge">${skill.name}</span>
                            `).join('')}
                            ${app.student.skills.length > 5 ? `<span class="text-xs text-gray-500">+${app.student.skills.length - 5} more</span>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function filterApplications(status) {
    // Update filter buttons styling
    document.querySelectorAll('.application-filter').forEach(btn => {
        btn.classList.remove('active', 'ring-2', 'ring-offset-2', 'ring-green-400');
        btn.style.opacity = '0.6';
        
        // Restore original colors based on button onclick attribute
        const onclick = btn.getAttribute('onclick');
        if (onclick) {
            const btnStatus = onclick.match(/'([^']+)'/)[1];
            const text = btn.textContent.trim();
            
            // Set original color with reduced opacity for inactive state
            if (text === 'All Applications') {
                btn.style.backgroundColor = '#56AE67';
            } else if (text === 'Pending') {
                btn.style.backgroundColor = '#f59e0b';
            } else if (text === 'Reviewed') {
                btn.style.backgroundColor = '#3b82f6';
            } else if (text === 'Shortlisted') {
                btn.style.backgroundColor = '#6b7280';
            } else if (text === 'Rejected') {
                btn.style.backgroundColor = '#ef4444';
            } else if (text === 'Hired') {
                btn.style.backgroundColor = '#8b5cf6';
            }
        }
    });
    
    // Set active button - full opacity and ring
    event.target.classList.add('active', 'ring-2', 'ring-offset-2', 'ring-green-400');
    event.target.style.opacity = '1';
    
    // Show/hide applications based on status
    const applications = document.querySelectorAll('.application-item');
    applications.forEach(app => {
        if (status === 'all' || app.dataset.status === status) {
            app.style.display = 'block';
        } else {
            app.style.display = 'none';
        }
    });
}

function toggleApplicationActions(applicationId) {
    const dropdown = document.getElementById(`actions-${applicationId}`);
    // Close all other dropdowns
    document.querySelectorAll('[id^="actions-"]').forEach(d => {
        if (d.id !== `actions-${applicationId}`) {
            d.classList.add('hidden');
        }
    });
    dropdown.classList.toggle('hidden');
}

async function updateApplicationStatus(applicationId, newStatus) {
    // Show confirmation for hiring decision
    if (newStatus === 'hired') {
        const confirmed = await showHireConfirmationModal(applicationId);
        if (!confirmed) {
            document.getElementById(`actions-${applicationId}`)?.classList.add('hidden');
            return;
        }
    }
    
    try {
        const jobId = getCurrentJobId();
        
        if (!jobId) {
            throw new Error('Job ID not found');
        }
        
        const response = await apiCall(`/jobs/${jobId}/applications/${applicationId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.success) {
            const statusText = {
                'reviewed': 'marked as reviewed',
                'shortlisted': 'shortlisted',
                'rejected': 'rejected',
                'hired': 'hired'
            }[newStatus] || newStatus;
            
            showToast(`Application ${statusText} successfully!`, 'success');
            // Reload applications to reflect changes
            loadJobApplications(jobId);
        } else {
            throw new Error(response.message || 'Failed to update application status');
        }
    } catch (error) {
        console.error('Error updating application status:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
    
    // Hide the dropdown
    document.getElementById(`actions-${applicationId}`)?.classList.add('hidden');
}

function showHireConfirmationModal(applicationId) {
    return new Promise((resolve) => {
        // Remove existing modal if any
        const existingModal = document.getElementById('hire-confirmation-modal');
        if (existingModal) existingModal.remove();
        
        const modalHTML = `
            <div id="hire-confirmation-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                    <div class="flex items-center mb-4">
                        <div class="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-4">
                            <i class="fas fa-user-check text-2xl text-green-600 dark:text-green-400"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Confirm Hiring Decision</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">This will mark the applicant as hired</p>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
                        <p class="text-sm text-green-800 dark:text-green-200">
                            <i class="fas fa-info-circle mr-2"></i>
                            The applicant will be notified of their selection. Make sure you've reviewed their profile and qualifications.
                        </p>
                    </div>
                    
                    <div class="flex justify-end space-x-3">
                        <button id="hire-cancel-btn" 
                            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium">
                            Cancel
                        </button>
                        <button id="hire-confirm-btn" 
                            style="background-color: #56AE67; color: white; border: 2px solid #2d6b3c;"
                            class="px-6 py-2 rounded-lg font-bold transition"
                            onmouseover="this.style.backgroundColor='#3d8b4f'" 
                            onmouseout="this.style.backgroundColor='#56AE67'">
                            <i class="fas fa-check mr-2"></i>Confirm Hire
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('hire-confirmation-modal');
        const confirmBtn = document.getElementById('hire-confirm-btn');
        const cancelBtn = document.getElementById('hire-cancel-btn');
        
        const cleanup = () => {
            modal.remove();
        };
        
        confirmBtn.addEventListener('click', () => {
            cleanup();
            resolve(true);
        });
        
        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(false);
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cleanup();
                resolve(false);
            }
        });
        
        // Close on ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                cleanup();
                document.removeEventListener('keydown', handleEsc);
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

function getCurrentJobId() {
    // Get job ID from the modal or current context
    const modal = document.getElementById('job-applications-modal');
    return modal?.dataset?.jobId || null;
}

function closeJobApplicationsModal() {
    const modal = document.getElementById('job-applications-modal');
    if (modal) {
        modal.remove();
    }
}

// View Student Profile (for companies)
async function viewStudentProfile(studentId) {
    console.log('viewStudentProfile called with studentId:', studentId);
    
    if (!studentId) {
        showToast('Student ID not found', 'error');
        return;
    }
    
    // Show loading toast
    showToast('Loading student profile...', 'info');
    
    try {
        console.log('Fetching student profile from:', `/students/${studentId}`);
        const response = await apiCall(`/students/${studentId}`);
        console.log('Student profile response:', response);
        
        const profile = response.data;
        
        if (!profile) {
            showToast('Student profile not found', 'error');
            return;
        }
        
        // Create and show modal
        const modal = createStudentProfileViewModal(profile);
        document.body.appendChild(modal);
        modal.classList.remove('hidden');
        
        // Add ESC key listener
        document.addEventListener('keydown', handleStudentProfileEscape);
        
        showToast('Profile loaded successfully', 'success');
        
    } catch (error) {
        console.error('Error loading student profile:', error);
        showToast('Error loading student profile: ' + error.message, 'error');
    }
}

function createStudentProfileViewModal(profile) {
    const modal = document.createElement('div');
    modal.id = 'student-profile-view-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto';
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeStudentProfileViewModal();
        }
    });
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl my-8 shadow-xl flex flex-col" style="max-height: calc(100vh - 4rem);">
            <div class="flex justify-between items-center p-4 border-b-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex-shrink-0">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        ${profile.firstName || ''} ${profile.lastName || ''}
                    </h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Student ID: ${profile.studentId || 'Not assigned'}</p>
                </div>
                <button onclick="closeStudentProfileViewModal()" class="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <i class="fas fa-times text-3xl"></i>
                </button>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1" style="max-height: calc(100vh - 12rem);">
                <div class="grid md:grid-cols-2 gap-6">
                    <!-- Personal Information -->
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <i class="fas fa-user mr-2 text-[#56AE67]"></i>
                            Personal Information
                        </h3>
                        <div class="space-y-3">
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                                <p class="text-gray-900 dark:text-white font-medium">${profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                                <p class="text-gray-900 dark:text-white font-medium">${profile.phone || 'Not provided'}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                <p class="text-gray-900 dark:text-white font-medium">${profile.user?.email || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Address -->
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <i class="fas fa-map-marker-alt mr-2 text-[#56AE67]"></i>
                            Address
                        </h3>
                        ${profile.address && (profile.address.street || profile.address.city || profile.address.state || profile.address.country) ? `
                            <p class="text-gray-900 dark:text-white">
                                ${profile.address.street || ''}<br>
                                ${profile.address.city || ''}, ${profile.address.state || ''}<br>
                                ${profile.address.country || ''}
                            </p>
                        ` : '<p class="text-gray-500 dark:text-gray-400">No address information</p>'}
                    </div>
                    
                    <!-- Education -->
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <i class="fas fa-graduation-cap mr-2 text-[#56AE67]"></i>
                            Education
                        </h3>
                        ${profile.education && (profile.education.school || profile.education.degree) ? `
                            <div class="space-y-2">
                                <div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">School</p>
                                    <p class="text-gray-900 dark:text-white font-medium">${profile.education.school || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Degree</p>
                                    <p class="text-gray-900 dark:text-white font-medium">${profile.education.degree || 'Not provided'}</p>
                                </div>
                                ${profile.education.fieldOfStudy ? `
                                    <div>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">Field of Study</p>
                                        <p class="text-gray-900 dark:text-white font-medium">${profile.education.fieldOfStudy}</p>
                                    </div>
                                ` : ''}
                                ${profile.education.graduationYear ? `
                                    <div>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">Graduation Year</p>
                                        <p class="text-gray-900 dark:text-white font-medium">${profile.education.graduationYear}</p>
                                    </div>
                                ` : ''}
                            </div>
                        ` : '<p class="text-gray-500 dark:text-gray-400">No education information</p>'}
                    </div>
                    
                    <!-- Portfolio -->
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <i class="fas fa-link mr-2 text-[#56AE67]"></i>
                            Portfolio & Links
                        </h3>
                        ${profile.portfolio && (profile.portfolio.githubUrl || profile.portfolio.linkedinUrl || profile.portfolio.personalWebsite) ? `
                            <div class="space-y-2">
                                ${profile.portfolio.githubUrl ? `
                                    <a href="${profile.portfolio.githubUrl}" target="_blank" class="block text-[#56AE67] dark:text-[#6bc481] hover:underline">
                                        <i class="fab fa-github mr-2"></i>GitHub Profile
                                    </a>
                                ` : ''}
                                ${profile.portfolio.linkedinUrl ? `
                                    <a href="${profile.portfolio.linkedinUrl}" target="_blank" class="block text-[#56AE67] dark:text-[#6bc481] hover:underline">
                                        <i class="fab fa-linkedin mr-2"></i>LinkedIn Profile
                                    </a>
                                ` : ''}
                                ${profile.portfolio.personalWebsite ? `
                                    <a href="${profile.portfolio.personalWebsite}" target="_blank" class="block text-[#56AE67] dark:text-[#6bc481] hover:underline">
                                        <i class="fas fa-globe mr-2"></i>Personal Website
                                    </a>
                                ` : ''}
                            </div>
                        ` : '<p class="text-gray-500 dark:text-gray-400">No portfolio links</p>'}
                    </div>
                    
                    <!-- Assessment Score -->
                    ${profile.assessmentScore ? `
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 md:col-span-2">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <i class="fas fa-chart-bar mr-2 text-[#56AE67]"></i>
                                Assessment Results
                            </h3>
                            <div class="grid md:grid-cols-3 gap-4">
                                <div class="text-center">
                                    <p class="text-3xl font-bold text-[#56AE67] dark:text-[#6bc481]">${profile.assessmentScore.overall || 0}%</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Overall Score</p>
                                </div>
                                ${profile.assessmentScore.breakdown ? Object.entries(profile.assessmentScore.breakdown).map(([skill, score]) => `
                                    <div>
                                        <p class="text-sm text-gray-500 dark:text-gray-400 capitalize">${skill.replace(/([A-Z])/g, ' $1').trim()}</p>
                                        <div class="flex items-center mt-1">
                                            <div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                                                <div class="bg-[#56AE67] h-2 rounded-full" style="width: ${score}%"></div>
                                            </div>
                                            <span class="text-sm font-medium">${score}%</span>
                                        </div>
                                    </div>
                                `).join('') : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Skills -->
                    ${profile.skills && profile.skills.length > 0 ? `
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 md:col-span-2">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <i class="fas fa-code mr-2 text-[#56AE67]"></i>
                                Verified Skills
                            </h3>
                            <div class="grid md:grid-cols-3 gap-4">
                                ${profile.skills.map(skill => `
                                    <div class="bg-white dark:bg-gray-600 p-3 rounded-lg">
                                        <div class="flex justify-between items-center mb-2">
                                            <span class="text-gray-900 dark:text-white font-medium capitalize">${skill.name.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span class="text-sm ${
                                                skill.level === 'Expert' ? 'text-purple-600' :
                                                skill.level === 'Advanced' ? 'text-[#56AE67]' :
                                                skill.level === 'Intermediate' ? 'text-green-600' :
                                                'text-gray-600'
                                            } font-bold">${skill.level}</span>
                                        </div>
                                        ${skill.score !== undefined ? `
                                            <div class="w-full bg-gray-200 dark:bg-gray-500 rounded-full h-2">
                                                <div class="bg-[#56AE67] h-2 rounded-full" style="width: ${skill.score}%"></div>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Job Preferences -->
                    ${profile.preferences ? `
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 md:col-span-2">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <i class="fas fa-briefcase mr-2 text-[#56AE67]"></i>
                                Job Preferences
                            </h3>
                            <div class="grid md:grid-cols-3 gap-4">
                                <div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Job Types</p>
                                    <div class="flex flex-wrap gap-2">
                                        ${profile.preferences.jobTypes && profile.preferences.jobTypes.length > 0 
                                            ? profile.preferences.jobTypes.map(type => `
                                                <span class="bg-blue-100 dark:bg-blue-900 text-[#2d6b3c] dark:text-blue-200 px-3 py-1 rounded-full text-sm capitalize">
                                                    ${type}
                                                </span>
                                            `).join('')
                                            : '<span class="text-gray-500 dark:text-gray-400">Not specified</span>'
                                        }
                                    </div>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Preferred Locations</p>
                                    <div class="flex flex-wrap gap-2">
                                        ${profile.preferences.locations && profile.preferences.locations.length > 0 
                                            ? profile.preferences.locations.map(loc => `
                                                <span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm">
                                                    ${loc}
                                                </span>
                                            `).join('')
                                            : '<span class="text-gray-500 dark:text-gray-400">Not specified</span>'
                                        }
                                    </div>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Remote Work</p>
                                    <span class="text-gray-900 dark:text-white font-medium">
                                        ${profile.preferences.remote ? '✓ Open to remote work' : 'Prefers on-site'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="p-4 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3 flex-shrink-0">
                <button onclick="closeStudentProfileViewModal()" class="bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 text-white px-8 py-3 rounded-lg font-semibold border-2 border-gray-700 dark:border-gray-500 transition-all shadow-lg">
                    <i class="fas fa-times mr-2"></i>Close
                </button>
            </div>
        </div>
    `;
    
    return modal;
}

window.closeStudentProfileViewModal = function() {
    const modal = document.getElementById('student-profile-view-modal');
    if (modal) {
        modal.remove();
    }
    // Remove ESC key listener
    document.removeEventListener('keydown', handleStudentProfileEscape);
};

function handleStudentProfileEscape(e) {
    if (e.key === 'Escape') {
        closeStudentProfileViewModal();
    }
}

window.viewStudentProfile = viewStudentProfile;

function editJob(jobId) {
    // Create and show a modal to edit job
    const modal = createEditJobModal();
    document.body.appendChild(modal);
    modal.classList.remove('hidden');
    
    // Load job data for editing
    loadJobForEditing(jobId);
}

function createEditJobModal() {
    const modal = document.createElement('div');
    modal.id = 'edit-job-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto';
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl my-8 shadow-xl flex flex-col" style="max-height: calc(100vh - 4rem);">
            <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex-shrink-0">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Edit Job</h2>
                <button onclick="closeEditJobModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1" style="max-height: calc(100vh - 16rem);">
                <!-- Job Loading -->
                <div id="job-loading" class="text-center py-8">
                    <div class="loading inline-block mr-2"></div>
                    <span>Loading job details...</span>
                </div>
                
                <!-- Edit Job Form -->
                <form id="edit-job-form" class="hidden space-y-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Job Title *
                            </label>
                            <input type="text" id="edit-title" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Department *
                            </label>
                            <select id="edit-department" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white">
                                <option value="">Select Department</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Sales">Sales</option>
                                <option value="HR">Human Resources</option>
                                <option value="Finance">Finance</option>
                                <option value="Operations">Operations</option>
                                <option value="IT">Information Technology</option>
                                <option value="Design">Design</option>
                                <option value="Customer Support">Customer Support</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Location *
                            </label>
                            <input type="text" id="edit-location" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white" placeholder="e.g., Metro Manila, Philippines">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Work Type *
                            </label>
                            <select id="edit-type" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white">
                                <option value="">Select Type</option>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                                <option value="Remote">Remote</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Job Description *
                        </label>
                        <textarea id="edit-description" required rows="4" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white" placeholder="Describe the job responsibilities, requirements, and expectations..."></textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Required Skills (one per line)
                        </label>
                        <textarea id="edit-skills" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white" placeholder="JavaScript\nReact\nNode.js\nSQL"></textarea>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter each skill on a new line</p>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Salary Range
                            </label>
                            <div class="grid grid-cols-2 gap-2">
                                <input type="number" id="edit-salary-min" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white" placeholder="Min">
                                <input type="number" id="edit-salary-max" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white" placeholder="Max">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <select id="edit-status" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white">
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Application Deadline
                        </label>
                        <input type="date" id="edit-deadline" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white">
                    </div>
                    
                    <!-- Custom Assessment -->
                    <div>
                        <h4 class="font-semibold mb-3 flex items-center text-gray-900 dark:text-white">
                            <i class="fas fa-clipboard-list mr-2 text-blue-600"></i>
                            Custom Assessment
                        </h4>
                        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div class="flex items-start mb-3">
                                <input type="checkbox" id="edit-requireCustomAssessment" class="mr-3 mt-1">
                                <div class="flex-1">
                                    <label for="edit-requireCustomAssessment" class="text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                                        Require Custom Assessment
                                    </label>
                                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Students must complete a custom assessment before applying to this job.
                                    </p>
                                </div>
                            </div>
                            <div id="edit-assessment-status" class="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-3">
                                <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                                <span id="edit-assessment-status-text">Loading assessment status...</span>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            
            <!-- Sticky Footer with Buttons -->
            <div class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 p-4 flex justify-between items-center flex-shrink-0">
                <button type="button" id="create-assessment-btn-in-modal"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    onclick="closeEditJobModal(); setTimeout(() => openCreateAssessmentModal(this.dataset.jobId), 100)">
                    <i class="fas fa-clipboard-list mr-2"></i>Create Custom Assessment
                </button>
                <div class="flex space-x-3">
                    <button type="button" onclick="closeEditJobModal()" class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        Cancel
                    </button>
                    <button type="submit" form="edit-job-form" 
                        style="background-color: #56AE67; color: white; border: 2px solid #2d6b3c;"
                        class="px-6 py-2 bg-[#56AE67] text-white rounded-lg hover:bg-[#3d8b4f] font-semibold border-2 border-green-800 dark:border-green-600"
                        onmouseover="this.style.backgroundColor='#3d8b4f'" 
                        onmouseout="this.style.backgroundColor='#56AE67'">
                        <span class="loading hidden mr-2"><i class="fas fa-spinner fa-spin"></i></span>
                        <span id="edit-submit-text">Update Job</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

async function loadJobForEditing(jobId) {
    try {
        const response = await apiCall(`/jobs/${jobId}`);
        if (response.success) {
            populateEditJobForm(response.data, jobId);
        } else {
            throw new Error(response.message || 'Failed to load job details');
        }
    } catch (error) {
        console.error('Error loading job for editing:', error);
        document.getElementById('job-loading').innerHTML = `
            <div class="text-red-500 text-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Error loading job: ${error.message}
            </div>
        `;
    }
}

function populateEditJobForm(job, jobId) {
    // Hide loading and show form
    document.getElementById('job-loading').classList.add('hidden');
    document.getElementById('edit-job-form').classList.remove('hidden');
    
    // Set jobId on the create assessment button
    const assessmentBtn = document.getElementById('create-assessment-btn-in-modal');
    if (assessmentBtn) {
        assessmentBtn.dataset.jobId = jobId;
    }
    
    // Populate form fields
    document.getElementById('edit-title').value = job.title || '';
    document.getElementById('edit-department').value = job.department || '';
    
    // Handle location object properly
    let locationString = '';
    if (job.location) {
        if (typeof job.location === 'string') {
            locationString = job.location;
        } else if (typeof job.location === 'object') {
            // Construct location string from object
            const parts = [];
            if (job.location.city) parts.push(job.location.city);
            if (job.location.state) parts.push(job.location.state);
            if (job.location.country) parts.push(job.location.country);
            locationString = parts.join(', ');
            
            // Add remote/hybrid indicators
            if (job.location.remote) locationString += ' (Remote)';
            if (job.location.hybrid) locationString += ' (Hybrid)';
        }
    }
    document.getElementById('edit-location').value = locationString;
    
    // Handle job type mapping
    const jobTypeMapping = {
        'full-time': 'Full-time',
        'part-time': 'Part-time',
        'contract': 'Contract',
        'internship': 'Internship',
        'ojt': 'Internship'
    };
    document.getElementById('edit-type').value = jobTypeMapping[job.jobType] || job.type || '';
    
    document.getElementById('edit-description').value = job.description || '';
    
    // Handle skills - check both requiredSkills and skillsRequired
    let skillsText = '';
    if (job.requiredSkills && Array.isArray(job.requiredSkills)) {
        skillsText = job.requiredSkills.join('\n');
    } else if (job.skillsRequired && Array.isArray(job.skillsRequired)) {
        // Handle complex skill objects
        skillsText = job.skillsRequired.map(skill => {
            if (typeof skill === 'string') return skill;
            return skill.name || skill;
        }).join('\n');
    }
    document.getElementById('edit-skills').value = skillsText;
    
    document.getElementById('edit-salary-min').value = job.salary?.min || '';
    document.getElementById('edit-salary-max').value = job.salary?.max || '';
    document.getElementById('edit-status').value = job.status || 'active';
    
    if (job.applicationDeadline) {
        const deadline = new Date(job.applicationDeadline);
        document.getElementById('edit-deadline').value = deadline.toISOString().split('T')[0];
    }
    
    // Set custom assessment status
    const requireAssessmentCheckbox = document.getElementById('edit-requireCustomAssessment');
    const assessmentStatusText = document.getElementById('edit-assessment-status-text');
    
    if (requireAssessmentCheckbox) {
        requireAssessmentCheckbox.checked = job.requireCustomAssessment || false;
    }
    
    if (assessmentStatusText) {
        if (job.customAssessment) {
            const assessmentInfo = typeof job.customAssessment === 'object' ? job.customAssessment : null;
            if (assessmentInfo && assessmentInfo.title) {
                assessmentStatusText.innerHTML = `<i class="fas fa-check-circle text-green-500 mr-2"></i><strong>Assessment Created:</strong> ${assessmentInfo.title} (${assessmentInfo.questions?.length || 0} questions)`;
            } else {
                assessmentStatusText.innerHTML = `<i class="fas fa-check-circle text-green-500 mr-2"></i>Assessment has been created for this job.`;
            }
        } else {
            assessmentStatusText.innerHTML = `<i class="fas fa-info-circle text-blue-500 mr-2"></i>No assessment created yet. Use the "Create Custom Assessment" button below to add one.`;
        }
    }
    
    // Set up form submission
    document.getElementById('edit-job-form').onsubmit = (e) => handleEditJobSubmit(e, jobId);
}

async function handleEditJobSubmit(event, jobId) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.querySelector('#edit-job-modal button[type="submit"]');
    const loading = submitBtn.querySelector('.loading');
    const submitText = document.getElementById('edit-submit-text');
    
    try {
        // Show loading state
        loading.classList.remove('hidden');
        submitText.textContent = 'Updating...';
        submitBtn.disabled = true;
        
        // Collect form data
        const locationInput = document.getElementById('edit-location').value.trim();
        const typeInput = document.getElementById('edit-type').value;
        
        // Parse location string into object format
        let locationObj = {};
        if (locationInput) {
            // Check for remote/hybrid indicators
            const isRemote = locationInput.toLowerCase().includes('remote');
            const isHybrid = locationInput.toLowerCase().includes('hybrid');
            
            // Clean location string
            let cleanLocation = locationInput.replace(/\s*\((remote|hybrid)\)/gi, '').trim();
            
            // Split by comma and parse
            const parts = cleanLocation.split(',').map(part => part.trim()).filter(part => part);
            
            if (parts.length >= 1) locationObj.city = parts[0];
            if (parts.length >= 2) locationObj.state = parts[1];
            if (parts.length >= 3) locationObj.country = parts[2];
            
            if (isRemote) locationObj.remote = true;
            if (isHybrid) locationObj.hybrid = true;
        }
        
        // Map job type to database format
        const typeMapping = {
            'Full-time': 'full-time',
            'Part-time': 'part-time',
            'Contract': 'contract',
            'Internship': 'internship',
            'Remote': 'full-time', // Default remote to full-time
            'Hybrid': 'full-time'   // Default hybrid to full-time
        };
        
        const formData = {
            title: document.getElementById('edit-title').value,
            department: document.getElementById('edit-department').value,
            location: locationObj,
            jobType: typeMapping[typeInput] || 'full-time',
            experienceLevel: 'entry-level', // Default for OJT platform
            description: document.getElementById('edit-description').value,
            status: document.getElementById('edit-status').value
        };
        
        // Handle skills - add to both fields for compatibility
        const skillsArray = document.getElementById('edit-skills').value
            .split('\n')
            .map(skill => skill.trim())
            .filter(skill => skill.length > 0);
            
        if (skillsArray.length > 0) {
            formData.skillsRequired = skillsArray.map(skill => ({ 
                name: skill, 
                level: 'Intermediate', 
                priority: 'nice-to-have' 
            }));
            formData.requiredSkills = skillsArray; // For backward compatibility
        }
        
        // Add salary if provided
        const salaryMin = document.getElementById('edit-salary-min').value;
        const salaryMax = document.getElementById('edit-salary-max').value;
        if (salaryMin || salaryMax) {
            formData.salary = {
                min: salaryMin ? parseInt(salaryMin) : undefined,
                max: salaryMax ? parseInt(salaryMax) : undefined
            };
        }
        
        // Add deadline if provided
        const deadline = document.getElementById('edit-deadline').value;
        if (deadline) {
            formData.applicationDeadline = new Date(deadline).toISOString();
        }
        
        // Add custom assessment requirement
        formData.requireCustomAssessment = document.getElementById('edit-requireCustomAssessment').checked;
        
        // Update job
        const response = await apiCall(`/jobs/${jobId}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        if (response.success) {
            showToast('Job updated successfully!', 'success');
            closeEditJobModal();
            // Refresh the company dashboard to show updated job
            loadCompanyDashboard();
        } else {
            throw new Error(response.message || 'Failed to update job');
        }
        
    } catch (error) {
        console.error('Error updating job:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        // Reset button state
        loading.classList.add('hidden');
        submitText.textContent = 'Update Job';
        submitBtn.disabled = false;
    }
}

function closeEditJobModal() {
    const modal = document.getElementById('edit-job-modal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// STUDENT SEARCH & FILTER
// ============================================

function searchStudents() {
    // Create and show a modal to search for students
    const modal = createSearchStudentsModal();
    document.body.appendChild(modal);
    modal.classList.remove('hidden');
    
    // Load initial student list
    loadStudentsList();
}

function createSearchStudentsModal() {
    const modal = document.createElement('div');
    modal.id = 'search-students-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Search Students</h2>
                <button onclick="closeSearchStudentsModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="p-6">
                <!-- Search Filters -->
                <div class="mb-6 space-y-4">
                    <div class="grid md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Search by Name/Email
                            </label>
                            <input type="text" id="student-search-input" placeholder="Search students..." 
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Skills
                            </label>
                            <input type="text" id="skills-filter" placeholder="e.g., JavaScript, React" 
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Course/Program
                            </label>
                            <select id="course-filter" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white">
                                <option value="">All Courses</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Information Technology">Information Technology</option>
                                <option value="Software Engineering">Software Engineering</option>
                                <option value="Computer Engineering">Computer Engineering</option>
                                <option value="Data Science">Data Science</option>
                                <option value="Cybersecurity">Cybersecurity</option>
                                <option value="Web Development">Web Development</option>
                                <option value="Mobile Development">Mobile Development</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-2">
                        <button onclick="applyStudentFilters()" 
                            class="px-4 py-2 text-white rounded-lg hover:bg-[#3d8b4f] transition"
                            style="background-color: #56AE67; color: white;">
                            <i class="fas fa-search mr-2"></i>Search
                        </button>
                        <button onclick="clearStudentFilters()" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                            <i class="fas fa-times mr-2"></i>Clear
                        </button>
                    </div>
                </div>
                
                <!-- Results -->
                <div class="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div id="students-loading" class="text-center py-8">
                        <div class="loading inline-block mr-2"></div>
                        <span>Loading students...</span>
                    </div>
                    
                    <div id="students-results" class="hidden">
                        <div class="flex justify-between items-center mb-4">
                            <div id="students-count" class="text-sm text-gray-600 dark:text-gray-400"></div>
                            <div class="flex space-x-2">
                                <button onclick="exportStudentsList()" class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                                    <i class="fas fa-download mr-1"></i>Export
                                </button>
                            </div>
                        </div>
                        
                        <div id="students-list" class="space-y-4 max-h-[400px] overflow-y-auto"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

async function loadStudentsList(filters = {}) {
    try {
        const queryParams = new URLSearchParams();
        
        // Add filters to query
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.skills) queryParams.append('skills', filters.skills);
        if (filters.course) queryParams.append('course', filters.course);
        
        const response = await apiCall(`/students?${queryParams.toString()}`);
        
        if (response.success) {
            displayStudentsList(response.data);
        } else {
            throw new Error(response.message || 'Failed to load students');
        }
    } catch (error) {
        console.error('Error loading students:', error);
        document.getElementById('students-loading').innerHTML = `
            <div class="text-red-500 text-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Error loading students: ${error.message}
            </div>
        `;
    }
}

function displayStudentsList(students) {
    document.getElementById('students-loading').classList.add('hidden');
    document.getElementById('students-results').classList.remove('hidden');
    
    const countEl = document.getElementById('students-count');
    const listEl = document.getElementById('students-list');
    
    countEl.textContent = `${students.length} student${students.length !== 1 ? 's' : ''} found`;
    
    if (students.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-user-graduate text-4xl mb-4"></i>
                <p>No students found matching your criteria</p>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = students.map(student => `
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center mb-2">
                        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                            <i class="fas fa-user text-[#56AE67] dark:text-[#6bc481]"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 dark:text-white">
                                ${student.firstName} ${student.lastName}
                            </h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${student.email}</p>
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-4 mb-3">
                        <div>
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Course:</span>
                            <p class="text-sm text-gray-700 dark:text-gray-300">${student.education?.degree || 'Not specified'}</p>
                        </div>
                        <div>
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Graduation Year:</span>
                            <p class="text-sm text-gray-700 dark:text-gray-300">${student.education?.graduationYear || 'Not specified'}</p>
                        </div>
                    </div>
                    
                    ${student.skills && student.skills.length > 0 ? `
                        <div class="mb-3">
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Skills:</span>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${student.skills.slice(0, 5).map(skill => `
                                    <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-[#2d6b3c] dark:text-blue-200 text-xs rounded">
                                        ${skill}
                                    </span>
                                `).join('')}
                                ${student.skills.length > 5 ? `
                                    <span class="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs rounded">
                                        +${student.skills.length - 5} more
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${student.assessmentScores && Object.keys(student.assessmentScores).length > 0 ? `
                        <div class="mb-3">
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Assessment Scores:</span>
                            <div class="flex flex-wrap gap-2 mt-1">
                                ${Object.entries(student.assessmentScores).map(([category, score]) => `
                                    <div class="text-xs">
                                        <span class="text-gray-600 dark:text-gray-400">${category}:</span>
                                        <span class="font-medium text-gray-900 dark:text-white">${score}%</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex space-x-2 ml-4">
                    <button onclick="viewStudentProfile('${student._id}')" 
                        style="background-color: #56AE67; color: white; border: 2px solid #2d6b3c;"
                        class="px-3 py-1 text-sm bg-[#56AE67] text-white rounded hover:bg-[#3d8b4f] font-semibold border-2 border-green-800 dark:border-green-600"
                        onmouseover="this.style.backgroundColor='#3d8b4f'" 
                        onmouseout="this.style.backgroundColor='#56AE67'">
                        <i class="fas fa-eye mr-1"></i>View
                    </button>
                    <button onclick="contactStudent('${student._id}', '${student.email}')" 
                        class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 font-semibold border-2 border-green-800 dark:border-green-500">
                        <i class="fas fa-envelope mr-1"></i>Contact
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function applyStudentFilters() {
    const filters = {
        search: document.getElementById('student-search-input').value.trim(),
        skills: document.getElementById('skills-filter').value.trim(),
        course: document.getElementById('course-filter').value
    };
    
    // Show loading
    document.getElementById('students-results').classList.add('hidden');
    document.getElementById('students-loading').classList.remove('hidden');
    document.getElementById('students-loading').innerHTML = `
        <div class="text-center py-8">
            <div class="loading inline-block mr-2"></div>
            <span>Searching students...</span>
        </div>
    `;
    
    loadStudentsList(filters);
}

function clearStudentFilters() {
    document.getElementById('student-search-input').value = '';
    document.getElementById('skills-filter').value = '';
    document.getElementById('course-filter').value = '';
    
    // Reload all students
    document.getElementById('students-results').classList.add('hidden');
    document.getElementById('students-loading').classList.remove('hidden');
    document.getElementById('students-loading').innerHTML = `
        <div class="text-center py-8">
            <div class="loading inline-block mr-2"></div>
            <span>Loading students...</span>
        </div>
    `;
    
    loadStudentsList();
}

function contactStudent(studentId, email) {
    // Open email client or show contact modal
    const subject = encodeURIComponent('Opportunity at ' + (window.companyData?.name || 'Our Company'));
    const body = encodeURIComponent('Hello,\n\nWe found your profile interesting and would like to discuss potential opportunities with our company.\n\nBest regards,\n' + (window.companyData?.name || 'Our Company'));
    
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
}

function exportStudentsList() {
    showToast('Export feature coming soon!', 'info');
}

function closeSearchStudentsModal() {
    const modal = document.getElementById('search-students-modal');
    if (modal) {
        modal.remove();
    }
}

function viewAllApplications() {
    // Create and show a modal to view all applications across all jobs
    const modal = createAllApplicationsModal();
    document.body.appendChild(modal);
    modal.classList.remove('hidden');
    
    // Load all applications
    loadAllApplications();
}

function createAllApplicationsModal() {
    const modal = document.createElement('div');
    modal.id = 'all-applications-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
            <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">All Applications</h2>
                <button onclick="closeAllApplicationsModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="p-6">
                <!-- Summary Stats -->
                <div id="applications-stats" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div class="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg text-center border-2 border-green-200 dark:border-green-700">
                        <div class="text-2xl font-bold text-green-700 dark:text-green-300" id="total-applications">-</div>
                        <div class="text-sm text-green-600 dark:text-green-400 font-medium">Total</div>
                    </div>
                    <div class="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg text-center border-2 border-yellow-200 dark:border-yellow-700">
                        <div class="text-2xl font-bold text-yellow-700 dark:text-yellow-300" id="pending-applications">-</div>
                        <div class="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Pending</div>
                    </div>
                    <div class="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg text-center border-2 border-blue-200 dark:border-blue-700">
                        <div class="text-2xl font-bold text-blue-700 dark:text-blue-300" id="reviewed-applications">-</div>
                        <div class="text-sm text-blue-600 dark:text-blue-400 font-medium">Reviewed</div>
                    </div>
                    <div class="bg-teal-100 dark:bg-teal-900/30 p-4 rounded-lg text-center border-2 border-teal-200 dark:border-teal-700">
                        <div class="text-2xl font-bold text-teal-700 dark:text-teal-300" id="shortlisted-applications">-</div>
                        <div class="text-sm text-teal-600 dark:text-teal-400 font-medium">Shortlisted</div>
                    </div>
                    <div class="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg text-center border-2 border-purple-200 dark:border-purple-700">
                        <div class="text-2xl font-bold text-purple-700 dark:text-purple-300" id="hired-applications">-</div>
                        <div class="text-sm text-purple-600 dark:text-purple-400 font-medium">Hired</div>
                    </div>
                </div>
                
                <!-- Filters -->
                <div class="mb-6 space-y-4">
                    <div class="grid md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Search Applicant
                            </label>
                            <input type="text" id="all-applicant-search" placeholder="Search by name or email..." 
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Job Position
                            </label>
                            <select id="all-job-filter" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white">
                                <option value="">All Positions</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <select id="all-status-filter" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white">
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="rejected">Rejected</option>
                                <option value="hired">Hired</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Date Applied
                            </label>
                            <select id="all-date-filter" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white">
                                <option value="">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="quarter">Last 3 Months</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-2">
                        <button onclick="applyAllApplicationsFilters()" 
                            style="background-color: #56AE67; color: white;"
                            class="px-4 py-2 bg-[#56AE67] text-white rounded-lg hover:bg-[#3d8b4f]"
                            onmouseover="this.style.backgroundColor='#3d8b4f'" 
                            onmouseout="this.style.backgroundColor='#56AE67'">
                            <i class="fas fa-search mr-2"></i>Filter
                        </button>
                        <button onclick="clearAllApplicationsFilters()" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                            <i class="fas fa-times mr-2"></i>Clear
                        </button>
                        <button onclick="exportAllApplications()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-download mr-2"></i>Export
                        </button>
                    </div>
                </div>
                
                <!-- Applications List -->
                <div class="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div id="all-applications-loading" class="text-center py-8">
                        <div class="loading inline-block mr-2"></div>
                        <span>Loading applications...</span>
                    </div>
                    
                    <div id="all-applications-results" class="hidden">
                        <div class="flex justify-between items-center mb-4">
                            <div id="all-applications-count" class="text-sm text-gray-600 dark:text-gray-400"></div>
                        </div>
                        
                        <div id="all-applications-list" class="space-y-4 max-h-[400px] overflow-y-auto"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

async function loadAllApplications(filters = {}) {
    try {
        const queryParams = new URLSearchParams();
        
        // Add filters to query
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.jobId) queryParams.append('jobId', filters.jobId);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.dateRange) queryParams.append('dateRange', filters.dateRange);
        
        const response = await apiCall(`/applications?${queryParams.toString()}`);
        
        if (response.success) {
            displayAllApplications(response.data);
            updateApplicationsStats(response.data);
            populateJobFilter(response.jobs || []);
        } else {
            throw new Error(response.message || 'Failed to load applications');
        }
    } catch (error) {
        console.error('Error loading all applications:', error);
        document.getElementById('all-applications-loading').innerHTML = `
            <div class="text-red-500 text-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Error loading applications: ${error.message}
            </div>
        `;
    }
}

function updateApplicationsStats(applications) {
    const stats = {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        reviewed: applications.filter(app => app.status === 'reviewed').length,
        shortlisted: applications.filter(app => app.status === 'shortlisted').length,
        hired: applications.filter(app => app.status === 'hired').length
    };
    
    document.getElementById('total-applications').textContent = stats.total;
    document.getElementById('pending-applications').textContent = stats.pending;
    document.getElementById('reviewed-applications').textContent = stats.reviewed;
    document.getElementById('shortlisted-applications').textContent = stats.shortlisted;
    document.getElementById('hired-applications').textContent = stats.hired;
}

function populateJobFilter(jobs) {
    const jobFilter = document.getElementById('all-job-filter');
    jobFilter.innerHTML = '<option value="">All Positions</option>';
    
    jobs.forEach(job => {
        const option = document.createElement('option');
        option.value = job._id;
        option.textContent = job.title;
        jobFilter.appendChild(option);
    });
}

function displayAllApplications(applications) {
    document.getElementById('all-applications-loading').classList.add('hidden');
    document.getElementById('all-applications-results').classList.remove('hidden');
    
    const countEl = document.getElementById('all-applications-count');
    const listEl = document.getElementById('all-applications-list');
    
    countEl.textContent = `${applications.length} application${applications.length !== 1 ? 's' : ''} found`;
    
    if (applications.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-file-alt text-4xl mb-4"></i>
                <p>No applications found matching your criteria</p>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = applications.map(application => {
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            reviewed: 'bg-blue-100 text-[#2d6b3c] dark:bg-blue-900 dark:text-blue-200',
            shortlisted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            hired: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
        };
        
        const appliedDate = new Date(application.appliedAt).toLocaleDateString();
        const matchScore = application.matchScore || 0;
        const assessmentScore = application.overallAssessmentScore || 0;
        
        return `
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                                <i class="fas fa-user text-[#56AE67] dark:text-[#6bc481]"></i>
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-900 dark:text-white">
                                    ${application.applicant.firstName} ${application.applicant.lastName}
                                </h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">${application.applicant.email}</p>
                            </div>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColors[application.status] || statusColors.pending}">
                                ${application.status}
                            </span>
                        </div>
                        
                        <div class="grid md:grid-cols-3 gap-4 mb-3">
                            <div>
                                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Position:</span>
                                <p class="text-sm text-gray-700 dark:text-gray-300">${application.job.title}</p>
                            </div>
                            <div>
                                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Applied:</span>
                                <p class="text-sm text-gray-700 dark:text-gray-300">${appliedDate}</p>
                            </div>
                            <div>
                                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Department:</span>
                                <p class="text-sm text-gray-700 dark:text-gray-300">${application.job.department}</p>
                            </div>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-4 mb-3">
                            <div>
                                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Match Score:</span>
                                <div class="flex items-center mt-1">
                                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                                        <div class="bg-[#56AE67] h-2 rounded-full" style="width: ${matchScore}%"></div>
                                    </div>
                                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300">${matchScore}%</span>
                                </div>
                            </div>
                            <div>
                                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Assessment Score:</span>
                                <div class="flex items-center mt-1">
                                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                                        <div class="bg-green-600 h-2 rounded-full" style="width: ${assessmentScore}%"></div>
                                    </div>
                                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300">${assessmentScore}%</span>
                                </div>
                            </div>
                        </div>
                        
                        ${application.applicant.skills && application.applicant.skills.length > 0 ? `
                            <div class="mb-3">
                                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Skills:</span>
                                <div class="flex flex-wrap gap-1 mt-1">
                                    ${application.applicant.skills.slice(0, 4).map(skill => `
                                        <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-[#2d6b3c] dark:text-blue-200 text-xs rounded">
                                            ${skill}
                                        </span>
                                    `).join('')}
                                    ${application.applicant.skills.length > 4 ? `
                                        <span class="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            +${application.applicant.skills.length - 4} more
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="flex flex-col space-y-2 ml-4">
                        <button onclick="viewJobApplications('${application.job._id}')" 
                            class="px-3 py-1 text-sm bg-[#56AE67] text-white rounded hover:bg-[#3d8b4f]">
                            <i class="fas fa-eye mr-1"></i>View All
                        </button>
                        <select onchange="updateApplicationStatus('${application.job._id}', '${application._id}', this.value)" 
                            class="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white">
                            <option value="pending" ${application.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="reviewed" ${application.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                            <option value="shortlisted" ${application.status === 'shortlisted' ? 'selected' : ''}>Shortlisted</option>
                            <option value="rejected" ${application.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                            <option value="hired" ${application.status === 'hired' ? 'selected' : ''}>Hired</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function applyAllApplicationsFilters() {
    const filters = {
        search: document.getElementById('all-applicant-search').value.trim(),
        jobId: document.getElementById('all-job-filter').value,
        status: document.getElementById('all-status-filter').value,
        dateRange: document.getElementById('all-date-filter').value
    };
    
    // Show loading
    document.getElementById('all-applications-results').classList.add('hidden');
    document.getElementById('all-applications-loading').classList.remove('hidden');
    document.getElementById('all-applications-loading').innerHTML = `
        <div class="text-center py-8">
            <div class="loading inline-block mr-2"></div>
            <span>Filtering applications...</span>
        </div>
    `;
    
    loadAllApplications(filters);
}

function clearAllApplicationsFilters() {
    document.getElementById('all-applicant-search').value = '';
    document.getElementById('all-job-filter').value = '';
    document.getElementById('all-status-filter').value = '';
    document.getElementById('all-date-filter').value = '';
    
    // Reload all applications
    document.getElementById('all-applications-results').classList.add('hidden');
    document.getElementById('all-applications-loading').classList.remove('hidden');
    document.getElementById('all-applications-loading').innerHTML = `
        <div class="text-center py-8">
            <div class="loading inline-block mr-2"></div>
            <span>Loading applications...</span>
        </div>
    `;
    
    loadAllApplications();
}

function exportAllApplications() {
    showToast('Export feature coming soon!', 'info');
}

function closeAllApplicationsModal() {
    const modal = document.getElementById('all-applications-modal');
    if (modal) {
        modal.remove();
    }
}

// Settings dropdown toggle
function toggleSettingsDropdown() {
    const dropdown = document.getElementById('settings-dropdown');
    dropdown.classList.toggle('hidden');

    // Close dropdown when clicking outside
    if (!dropdown.classList.contains('hidden')) {
        document.addEventListener('click', function closeDropdown(e) {
            if (!e.target.closest('#settings-dropdown') && !e.target.closest('button[onclick="toggleSettingsDropdown()"]')) {
                dropdown.classList.add('hidden');
                document.removeEventListener('click', closeDropdown);
            }
        });
    }
}

// Start category-specific assessment
function startCategoryAssessment(category) {
    console.log('Starting assessment for category:', category);
    
    // Show loading feedback
    const categoryNames = {
        'programming': 'Programming',
        'database': 'Database',
        'webDevelopment': 'Web Development',
        'networking': 'Networking',
        'problemSolving': 'Problem Solving'
    };
    
    showToast(`Loading ${categoryNames[category]} assessment...`, 'info');
    
    if (typeof startAssessment === 'function') {
        startAssessment(category);
    } else {
        console.error('startAssessment function not found. Make sure assessment.js is loaded.');
        showToast('Assessment system is loading. Please try again.', 'warning');
    }
}

// Ensure loadAssessmentSection exists (dashboard button calls this)
function loadAssessmentSection() {
    // Show the assessment section in the dashboard (the grid with 5 categories)
    const assessmentSection = document.getElementById('assessment-section');
    if (assessmentSection) {
        // Hide all other sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show the assessment section
        assessmentSection.classList.remove('hidden');
        
        // Update navigation active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById('nav-assessment')?.classList.add('active');
        
        console.log('Assessment section loaded - showing 5 category grid');
        return;
    }
    
    // Fallback: if assessment section doesn't exist, try full assessment flow
    if (typeof startAssessment === 'function') {
        startAssessment();
        return;
    }
    
    // Last resort: warn and show a toast if available
    console.warn('Assessment section not found. Make sure the dashboard HTML includes the assessment-section element.');
    if (typeof showToast === 'function') {
        showToast('Assessment section not available. Please refresh the page.', 'error');
    }
}

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Only load dashboard if explicitly on index.html and user is logged in
    // app.js handles the main initialization, this is just for direct page loads
    const userType = sessionStorage.getItem('userType');
    const authToken = sessionStorage.getItem('authToken');
    
    // Don't do anything if we're not authenticated or on landing page
    if (!authToken) {
        console.log('No auth token found, skipping dashboard auto-load');
        return;
    }
    
    // Check if we're already showing a dashboard
    const studentDash = document.getElementById('student-dashboard');
    const companyDash = document.getElementById('company-dashboard');
    const isStudentVisible = studentDash && !studentDash.classList.contains('hidden');
    const isCompanyVisible = companyDash && !companyDash.classList.contains('hidden');
    
    if (isStudentVisible || isCompanyVisible) {
        console.log('Dashboard already visible, skipping auto-load');
        // Just attach assessment listeners if we're a student
        if (isStudentVisible) {
            setTimeout(() => {
                attachAssessmentCardListeners();
            }, 500);
        }
        return;
    }
    
    // If we reach here and have a userType, load the appropriate dashboard
    if (userType === 'student') {
        console.log('Auto-loading student dashboard from dashboard.js');
        loadStudentDashboard();
        setTimeout(() => {
            attachAssessmentCardListeners();
        }, 1500);
    } else if (userType === 'company') {
        console.log('Auto-loading company dashboard from dashboard.js');
        loadCompanyDashboard();
    }
    // Don't redirect if no userType - let app.js handle that
});

// Attach click listeners to assessment cards
function attachAssessmentCardListeners() {
    const assessmentCards = document.querySelectorAll('.grid-item');
    console.log('Attaching listeners to assessment cards, found:', assessmentCards.length);
    
    assessmentCards.forEach(card => {
        // Remove any existing onclick attribute
        card.removeAttribute('onclick');
        
        // Add click event listener with direct inline handler
        card.addEventListener('click', async function() {
            const category = this.classList[1]; // Get the second class (programming, database, etc.)
            console.log('Assessment card clicked:', category);
            
            // Delegate to the centralized assessment starter to avoid duplicated state
            // and conflicting global navigation implementations.
            if (!authToken) {
                showToast('Please log in to start the assessment.', 'warning');
                showLoginModal('student');
                return;
            }
            try {
                await startAssessment(category);
            } catch (err) {
                console.error('Failed to start assessment via centralized starter', err);
                showToast('Failed to start assessment. Please try again.', 'error');
            }
        });
    });
    console.log(`✓ Attached listeners to ${assessmentCards.length} assessment cards`);
}

// Function to display assessment questions
function showAssessmentQuestion(index) {
    const assessment = window.currentAssessment;
    if (!assessment || !assessment.questions[index]) {
        console.error('No question found at index', index);
        return;
    }
    
    const question = assessment.questions[index];
    console.log('Displaying question:', {
        index,
        questionText: question.question,
        type: question.type,
        optionsCount: question.options?.length,
        options: question.options
    });
    
    const questionContainer = document.getElementById('question-container');
    const currentQuestionSpan = document.getElementById('current-question');
    
    if (!questionContainer || !currentQuestionSpan) {
        console.error('Assessment page elements not found');
        return;
    }
    
    currentQuestionSpan.textContent = index + 1;
    window.currentQuestionIndex = index;
    
    // Build question HTML based on type
    let optionsHTML = '';
    
    if (question.type === 'multiple-choice') {
        if (!question.options || question.options.length === 0) {
            console.error('No options found for multiple-choice question');
            optionsHTML = '<p class="text-red-500">Error: No answer options available</p>';
        } else {
            optionsHTML = question.options.map((option, i) => `
                <div class="mb-3">
                    <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input type="radio" name="answer" value="${option}" class="mr-3">
                        <span class="text-gray-900 dark:text-white">${option}</span>
                    </label>
                </div>
            `).join('');
        }
    } else if (question.type === 'true-false') {
        optionsHTML = `
            <div class="mb-3">
                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input type="radio" name="answer" value="True" class="mr-3">
                    <span class="text-gray-900 dark:text-white">True</span>
                </label>
            </div>
            <div class="mb-3">
                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input type="radio" name="answer" value="False" class="mr-3">
                    <span class="text-gray-900 dark:text-white">False</span>
                </label>
            </div>
        `;
    }
    
    questionContainer.innerHTML = `
        <div class="mb-6">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Question ${index + 1} of ${assessment.questions.length}
            </h3>
            <p class="text-lg text-gray-800 dark:text-gray-200 mb-6">${question.question}</p>
            ${optionsHTML}
        </div>
    `;
    
    // Update the navigation buttons in the footer
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    if (prevBtn) {
        prevBtn.disabled = index === 0;
    }
    
    if (index < assessment.questions.length - 1) {
        if (nextBtn) nextBtn.classList.remove('hidden');
        if (submitBtn) submitBtn.classList.add('hidden');
    } else {
        if (nextBtn) nextBtn.classList.add('hidden');
        if (submitBtn) submitBtn.classList.remove('hidden');
    }
}

// Navigation functions
window.nextQuestion = function() {
    saveCurrentAnswer();
    const nextIndex = window.currentQuestionIndex + 1;
    if (nextIndex < window.currentAssessment.questions.length) {
        showAssessmentQuestion(nextIndex);
    }
};

window.previousQuestion = function() {
    saveCurrentAnswer();
    const prevIndex = window.currentQuestionIndex - 1;
    if (prevIndex >= 0) {
        showAssessmentQuestion(prevIndex);
    }
};

function saveCurrentAnswer() {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (selectedAnswer) {
        window.userAnswers[window.currentQuestionIndex] = {
            questionId: window.currentAssessment.questions[window.currentQuestionIndex]._id,
            answer: selectedAnswer.value
        };
    }
}

window.submitAssessmentAnswers = async function() {
    // Prevent double submission
    if (window.isSubmitting) {
        console.log('Submission already in progress');
        return;
    }
    
    saveCurrentAnswer();
    
    if (window.userAnswers.length < window.currentAssessment.questions.length) {
        if (!confirm('You have unanswered questions. Submit anyway?')) {
            return;
        }
    }
    
    try {
        window.isSubmitting = true;
        showToast('Submitting assessment...', 'info');
        
        const response = await apiCall(`/assessments/${window.currentAssessment._id}/submit`, {
            method: 'POST',
            body: JSON.stringify({
                answers: window.userAnswers,
                startedAt: window.assessmentStartTime
            })
        });
        
        // Show results
        showToast('Assessment submitted successfully!', 'success');
        
        // Disable anti-copy protection when assessment ends
        disableAssessmentProtection();
        
        // Display results modal
        showAssessmentResults(response.data);
        
    } catch (error) {
        window.isSubmitting = false;
        console.error('Error submitting assessment:', error);
        const errorMessage = error.message || 'Failed to submit assessment. Please try again.';
        showToast(errorMessage, 'error');
    }
};

// Alias for HTML button
window.submitAssessment = window.submitAssessmentAnswers;

// Show assessment results
function showAssessmentResults(resultData) {
    window.isSubmitting = false;
    
    // Hide assessment page, show results
    document.getElementById('assessment-page').classList.add('hidden');
    document.getElementById('assessment-results').classList.remove('hidden');
    
    // Update overall score
    const overallScoreElement = document.getElementById('overall-score');
    const percentage = resultData.percentage || 0;
    const passed = resultData.passed;
    
    if (overallScoreElement) {
        overallScoreElement.textContent = `${percentage}%`;
        overallScoreElement.className = passed 
            ? 'text-4xl font-bold text-green-600 dark:text-green-400 mb-2'
            : 'text-4xl font-bold text-red-600 dark:text-red-400 mb-2';
    }
    
    // Update pass/fail status
    const resultsTitle = document.querySelector('#assessment-results h2');
    const resultsSubtitle = document.querySelector('#assessment-results p');
    const resultsIcon = document.querySelector('#assessment-results .text-6xl i');
    
    if (passed) {
        if (resultsTitle) resultsTitle.textContent = 'Congratulations! You Passed!';
        if (resultsSubtitle) resultsSubtitle.textContent = `You scored ${percentage}% (Pass: 60%)`;
        if (resultsIcon) {
            resultsIcon.className = 'fas fa-trophy';
            resultsIcon.parentElement.className = 'text-6xl text-green-500 mb-4';
        }
    } else {
        if (resultsTitle) resultsTitle.textContent = 'Assessment Complete';
        if (resultsSubtitle) resultsSubtitle.textContent = `You scored ${percentage}% (Pass: 60% required)`;
        if (resultsIcon) {
            resultsIcon.className = 'fas fa-chart-bar';
            resultsIcon.parentElement.className = 'text-6xl text-yellow-500 mb-4';
        }
    }
    
    // Display category breakdown
    const categoryScoresElement = document.getElementById('category-scores');
    if (categoryScoresElement && resultData.categoryScores) {
        const categoryNames = {
            programming: 'Programming',
            database: 'Database',
            webDevelopment: 'Web Development',
            networking: 'Networking',
            problemSolving: 'Problem Solving'
        };
        
        let categoriesHTML = '';
        Object.keys(resultData.categoryScores).forEach(category => {
            const score = resultData.categoryScores[category];
            const categoryName = categoryNames[category] || category;
            const scoreClass = score >= 60 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400';
            
            categoriesHTML += `
                <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg mb-2">
                    <div class="flex items-center">
                        <i class="fas fa-code text-[#56AE67] mr-3"></i>
                        <span class="text-gray-900 dark:text-white font-medium">${categoryName}</span>
                    </div>
                    <div class="${scoreClass} font-bold">${score}%</div>
                </div>
            `;
        });
        
        categoryScoresElement.innerHTML = categoriesHTML;
    }
    
    // Display verified skills
    const verifiedSkillsElement = document.getElementById('verified-skills');
    if (verifiedSkillsElement && resultData.categoryScores) {
        let skillsHTML = '';
        Object.keys(resultData.categoryScores).forEach(category => {
            const score = resultData.categoryScores[category];
            let level = 'Beginner';
            let levelColor = 'text-gray-600';
            
            if (score >= 80) {
                level = 'Expert';
                levelColor = 'text-purple-600';
            } else if (score >= 70) {
                level = 'Advanced';
                levelColor = 'text-[#56AE67]';
            } else if (score >= 60) {
                level = 'Intermediate';
                levelColor = 'text-green-600';
            }
            
            const categoryNames = {
                programming: 'Programming',
                database: 'Database',
                webDevelopment: 'Web Development',
                networking: 'Networking',
                problemSolving: 'Problem Solving'
            };
            
            skillsHTML += `
                <div class="bg-white dark:bg-gray-700 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-gray-900 dark:text-white font-medium">${categoryNames[category]}</span>
                        <span class="${levelColor} font-bold text-sm">${level}</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div class="bg-[#56AE67] h-2 rounded-full" style="width: ${score}%"></div>
                    </div>
                </div>
            `;
        });
        
        verifiedSkillsElement.innerHTML = skillsHTML;
    }
}

// Continue to platform from results
window.continueToPlatform = function() {
    disableAssessmentProtection();
    document.getElementById('assessment-results').classList.add('hidden');
    document.getElementById('student-dashboard').classList.remove('hidden');
    loadStudentDashboard();
};

// Load student profile
async function loadStudentProfile() {
    const profileContent = document.getElementById('profile-content');
    if (!profileContent) return;
    
    try {
        const response = await apiCall('/students/profile');
        const profile = response.data;
        
        if (!profile) {
            profileContent.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 text-5xl mb-4">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400">No profile information yet.</p>
                    <button onclick="showStudentProfileModal()" class="mt-4 bg-[#56AE67] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition">
                        Create Profile
                    </button>
                </div>
            `;
            return;
        }
        
        profileContent.innerHTML = `
            <!-- Profile Header with Avatar -->
            <div class="bg-gradient-to-r from-[#56AE67] to-[#3d8b4f] rounded-lg p-6 mb-6 text-white shadow-xl">
                <div class="flex items-center space-x-6">
                    <div class="relative">
                        <div class="w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
                            ${profile.avatar && profile.avatar.path ? 
                                `<img src="/uploads/avatars/${profile.avatar.path.split('/').pop()}" alt="Profile Picture" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<div class=\"w-full h-full flex items-center justify-center bg-gray-200\"><i class=\"fas fa-user text-gray-400 text-5xl\"></i></div>'">` :
                                `<div class="w-full h-full flex items-center justify-center bg-gray-200">
                                    <i class="fas fa-user text-gray-400 text-5xl"></i>
                                </div>`
                            }
                        </div>
                        <button onclick="showAvatarUpload()" class="absolute bottom-0 right-0 bg-white text-[#56AE67] rounded-full p-3 shadow-lg hover:bg-gray-100 transition">
                            <i class="fas fa-camera text-lg"></i>
                        </button>
                    </div>
                    <div class="flex-1">
                        <h2 class="text-3xl font-bold mb-2 text-white drop-shadow-lg">${profile.firstName || ''} ${profile.lastName || ''}</h2>
                        <p class="text-white text-base mb-2 drop-shadow"><i class="fas fa-id-card mr-2"></i>${profile.studentId || 'Not assigned'}</p>
                        <p class="text-white text-base drop-shadow"><i class="fas fa-envelope mr-2"></i>${profile.user?.email || 'Not available'}</p>
                    </div>
                </div>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
                <!-- Personal Information -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-user mr-2 text-[#56AE67]"></i>
                        Personal Information
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                            <p class="text-gray-900 dark:text-white font-medium">${profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                            <p class="text-gray-900 dark:text-white font-medium">${profile.phone || 'Not provided'}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Address -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-map-marker-alt mr-2 text-[#56AE67]"></i>
                        Address
                    </h3>
                    <div class="space-y-3">
                        ${profile.address && (profile.address.street || profile.address.city || profile.address.state || profile.address.country) ? `
                            <div>
                                <p class="text-gray-900 dark:text-white">
                                    ${profile.address.street || ''}<br>
                                    ${profile.address.city || ''}, ${profile.address.state || ''}<br>
                                    ${profile.address.country || ''}
                                </p>
                            </div>
                        ` : '<p class="text-gray-500 dark:text-gray-400">No address information</p>'}
                    </div>
                </div>
                
                <!-- Education -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-graduation-cap mr-2 text-[#56AE67]"></i>
                        Education
                    </h3>
                    <div class="space-y-3">
                        ${profile.education && (profile.education.school || profile.education.degree) ? `
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">School</p>
                                <p class="text-gray-900 dark:text-white font-medium">${profile.education.school || 'Not provided'}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Degree</p>
                                <p class="text-gray-900 dark:text-white font-medium">${profile.education.degree || 'Not provided'}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Field of Study</p>
                                <p class="text-gray-900 dark:text-white font-medium">${profile.education.fieldOfStudy || 'Not provided'}</p>
                            </div>
                            ${profile.education.graduationYear ? `
                                <div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Graduation Year</p>
                                    <p class="text-gray-900 dark:text-white font-medium">${profile.education.graduationYear}</p>
                                </div>
                            ` : ''}
                        ` : '<p class="text-gray-500 dark:text-gray-400">No education information</p>'}
                    </div>
                </div>
                
                <!-- Portfolio & Links -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-link mr-2 text-[#56AE67]"></i>
                        Portfolio & Links
                    </h3>
                    <div class="space-y-3">
                        ${profile.portfolio && (profile.portfolio.githubUrl || profile.portfolio.linkedinUrl || profile.portfolio.personalWebsite) ? `
                            ${profile.portfolio.githubUrl ? `
                                <div>
                                    <a href="${profile.portfolio.githubUrl}" target="_blank" class="text-[#56AE67] dark:text-[#6bc481] hover:underline flex items-center">
                                        <i class="fab fa-github mr-2"></i>
                                        GitHub Profile
                                    </a>
                                </div>
                            ` : ''}
                            ${profile.portfolio.linkedinUrl ? `
                                <div>
                                    <a href="${profile.portfolio.linkedinUrl}" target="_blank" class="text-[#56AE67] dark:text-[#6bc481] hover:underline flex items-center">
                                        <i class="fab fa-linkedin mr-2"></i>
                                        LinkedIn Profile
                                    </a>
                                </div>
                            ` : ''}
                            ${profile.portfolio.personalWebsite ? `
                                <div>
                                    <a href="${profile.portfolio.personalWebsite}" target="_blank" class="text-[#56AE67] dark:text-[#6bc481] hover:underline flex items-center">
                                        <i class="fas fa-globe mr-2"></i>
                                        Personal Website
                                    </a>
                                </div>
                            ` : ''}
                        ` : '<p class="text-gray-500 dark:text-gray-400">No portfolio links</p>'}
                    </div>
                </div>
                
                <!-- Skills -->
                ${profile.skills && profile.skills.length > 0 ? `
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 md:col-span-2">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <i class="fas fa-code mr-2 text-[#56AE67]"></i>
                            Verified Skills
                        </h3>
                        <div class="grid md:grid-cols-3 gap-4">
                            ${profile.skills.filter(skill => skill.verified && skill.score >= 60).map(skill => {
                                // Format skill name for display
                                const displayName = skill.name.charAt(0).toUpperCase() + skill.name.slice(1);
                                return `
                                <div class="bg-white dark:bg-gray-600 p-4 rounded-lg">
                                    <div class="flex justify-between items-center mb-2">
                                        <span class="text-gray-900 dark:text-white font-medium">${displayName}</span>
                                        <span class="text-sm ${
                                            skill.level === 'Expert' ? 'text-purple-600' :
                                            skill.level === 'Advanced' ? 'text-[#56AE67]' :
                                            skill.level === 'Intermediate' ? 'text-green-600' :
                                            'text-gray-600'
                                        } font-bold">${skill.level}</span>
                                    </div>
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-xs text-gray-500 dark:text-gray-400">Score</span>
                                        <span class="text-sm font-bold text-[#56AE67]">${skill.score}%</span>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-500 rounded-full h-2">
                                        <div class="bg-[#56AE67] h-2 rounded-full" style="width: ${skill.score}%"></div>
                                    </div>
                                </div>
                            `}).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Job Preferences -->
                ${profile.preferences ? `
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 md:col-span-2">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <i class="fas fa-briefcase mr-2 text-[#56AE67]"></i>
                            Job Preferences
                        </h3>
                        <div class="grid md:grid-cols-3 gap-4">
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Job Types</p>
                                <div class="flex flex-wrap gap-2">
                                    ${profile.preferences.jobTypes && profile.preferences.jobTypes.length > 0 
                                        ? profile.preferences.jobTypes.map(type => `
                                            <span class="bg-blue-100 dark:bg-blue-900 text-[#2d6b3c] dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                                                ${type}
                                            </span>
                                        `).join('')
                                        : '<span class="text-gray-500 dark:text-gray-400">Not specified</span>'
                                    }
                                </div>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Preferred Locations</p>
                                <div class="flex flex-wrap gap-2">
                                    ${profile.preferences.locations && profile.preferences.locations.length > 0 
                                        ? profile.preferences.locations.map(loc => `
                                            <span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm">
                                                ${loc}
                                            </span>
                                        `).join('')
                                        : '<span class="text-gray-500 dark:text-gray-400">Not specified</span>'
                                    }
                                </div>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Remote Work</p>
                                <span class="text-gray-900 dark:text-white font-medium">
                                    ${profile.preferences.remote ? 'Open to remote work' : 'Prefers on-site'}
                                </span>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading profile:', error);
        profileContent.innerHTML = `
            <div class="text-center py-8">
                <div class="text-red-500 text-5xl mb-4">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <p class="text-gray-600 dark:text-gray-400">Error loading profile</p>
                <button onclick="loadStudentProfile()" 
                    style="background-color: #56AE67; color: white;"
                    class="mt-4 bg-[#56AE67] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition"
                    onmouseover="this.style.backgroundColor='#3d8b4f'" 
                    onmouseout="this.style.backgroundColor='#56AE67'">
                    Retry
                </button>
            </div>
        `;
    }
}

// Load assessment history
async function loadAssessmentHistory() {
    const historyContent = document.getElementById('history-content');
    if (!historyContent) return;
    
    try {
        const response = await apiCall('/assessments/results/me');
        const results = response.data || [];
        
        if (results.length === 0) {
            historyContent.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 text-5xl mb-4">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400">No assessment history yet.</p>
                    <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">Complete an assessment to see your results here.</p>
                </div>
            `;
            return;
        }
        
        historyContent.innerHTML = results.map(result => `
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900 dark:text-white">${result.assessment?.title || 'Assessment'}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            Completed: ${new Date(result.completedAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div class="text-right flex items-start gap-4">
                        <div>
                            <div class="text-2xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}">
                                ${result.percentage}%
                            </div>
                            <span class="text-xs ${result.passed ? 'text-green-600' : 'text-red-600'}">
                                ${result.passed ? 'Passed' : 'Failed'}
                            </span>
                        </div>
                        <button onclick="viewStudentAssessmentDetails('${result._id}')" 
                            style="background-color: #56AE67; color: white; border: 2px solid #2d6b3c;"
                            class="px-4 py-2 rounded-lg hover:bg-[#3d8b4f] dark:hover:bg-[#6bc481] transition font-semibold shadow-sm"
                            onmouseover="this.style.backgroundColor='#3d8b4f'" 
                            onmouseout="this.style.backgroundColor='#56AE67'">
                            <i class="fas fa-eye mr-1"></i>View Details
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading assessment history:', error);
        historyContent.innerHTML = `
            <div class="text-center py-8">
                <div class="text-red-500 text-5xl mb-4">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <p class="text-gray-600 dark:text-gray-400">Failed to load assessment history.</p>
                <button onclick="loadAssessmentHistory()" class="mt-4 text-[#56AE67] hover:text-[#2d6b3c] dark:text-[#6bc481]">
                    Try Again
                </button>
            </div>
        `;
    }
}

// View student's own assessment details
async function viewStudentAssessmentDetails(resultId) {
    try {
        console.log('Fetching student assessment result:', resultId);
        
        const response = await apiCall(`/assessments/results/${resultId}`);
        const result = response.data || response;
        
        console.log('Full assessment result:', result);
        console.log('Assessment object:', result.assessment);
        console.log('Answers array:', result.answers);
        if (result.answers && result.answers.length > 0) {
            console.log('First answer sample:', result.answers[0]);
        }
        
        // Calculate correct answers
        const correctAnswers = result.answers ? result.answers.filter(a => a.isCorrect || a.correct).length : 0;
        const totalQuestions = result.answers ? result.answers.length : 0;
        
        // Create detailed view modal
        const detailModal = document.createElement('div');
        detailModal.id = 'student-assessment-details-modal';
        detailModal.className = 'fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4';
        
        // Close on click outside
        detailModal.addEventListener('click', function(e) {
            if (e.target === detailModal) {
                closeStudentAssessmentDetailsModal();
            }
        });
        
        // Close on Escape key
        window.studentAssessmentModalEscapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeStudentAssessmentDetailsModal();
            }
        };
        document.addEventListener('keydown', window.studentAssessmentModalEscapeHandler);
        
        detailModal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col" style="height: 90vh;">
                <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                        <i class="fas fa-clipboard-check text-[#56AE67] mr-2"></i>
                        My Assessment Results
                    </h2>
                </div>
                
                <div class="p-6 flex-1 scrollbar-custom" style="overflow-y: auto; overflow-x: hidden;">
                    <!-- Assessment Summary -->
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">${result.assessment?.title || 'Assessment'}</h3>
                        <div class="grid md:grid-cols-4 gap-4">
                            <div class="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-300 dark:border-blue-700">
                                <p class="text-sm text-blue-800 dark:text-blue-200 mb-1 font-semibold">Final Score</p>
                                <p class="text-3xl font-bold text-blue-900 dark:text-blue-100">${result.percentage}%</p>
                            </div>
                            <div class="bg-${result.passed ? 'green' : 'red'}-100 dark:bg-${result.passed ? 'green' : 'red'}-900/30 p-4 rounded-lg border border-${result.passed ? 'green' : 'red'}-300 dark:border-${result.passed ? 'green' : 'red'}-700">
                                <p class="text-sm text-${result.passed ? 'green' : 'red'}-800 dark:text-${result.passed ? 'green' : 'red'}-200 mb-1 font-semibold">Status</p>
                                <p class="text-2xl font-bold text-${result.passed ? 'green' : 'red'}-900 dark:text-${result.passed ? 'green' : 'red'}-100">
                                    ${result.passed ? 'Passed' : 'Failed'}
                                </p>
                            </div>
                            <div class="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-300 dark:border-purple-700">
                                <p class="text-sm text-purple-800 dark:text-purple-200 mb-1 font-semibold">Correct Answers</p>
                                <p class="text-3xl font-bold text-purple-900 dark:text-purple-100">${correctAnswers}/${totalQuestions}</p>
                            </div>
                            <div class="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-300 dark:border-yellow-700">
                                <p class="text-sm text-yellow-800 dark:text-yellow-200 mb-1 font-semibold">Completed</p>
                                <p class="text-sm font-bold text-yellow-900 dark:text-yellow-100">${new Date(result.completedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Category Scores -->
                    ${result.categoryScores && Object.keys(result.categoryScores).length > 0 ? `
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Category Breakdown</h3>
                            <div class="grid md:grid-cols-3 gap-3">
                                ${Object.entries(result.categoryScores).map(([category, score]) => `
                                    <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                        <p class="text-sm text-gray-600 dark:text-gray-400 capitalize">${category}</p>
                                        <p class="text-2xl font-bold text-[#56AE67]">${score}%</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Questions and Answers -->
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Question Review</h3>
                    ${!result.answers || result.answers.length === 0 ? `
                        <div class="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <i class="fas fa-info-circle text-gray-400 text-3xl mb-2"></i>
                            <p class="text-gray-600 dark:text-gray-400">Detailed answer breakdown is not available for this assessment.</p>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            ${result.answers.map((answer, index) => {
                                const isCorrect = answer.isCorrect || answer.correct;
                                // Debug logging for correct answer
                                console.log(`Question ${index + 1} answer data:`, {
                                    correctAnswer: answer.correctAnswer,
                                    correct_answer: answer.correct_answer,
                                    allFields: Object.keys(answer)
                                });
                                return `
                                <div class="border ${isCorrect ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10' : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'} rounded-lg p-5">
                                    <div class="flex items-start gap-4">
                                        <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}">
                                            <i class="fas ${isCorrect ? 'fa-check' : 'fa-times'} text-lg"></i>
                                        </div>
                                        <div class="flex-1">
                                            <div class="flex items-start justify-between mb-3">
                                                <h4 class="font-semibold text-gray-900 dark:text-white text-base">Question ${index + 1}</h4>
                                                <span class="text-xs px-3 py-1 rounded-full font-medium ${isCorrect ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}">
                                                    ${isCorrect ? 'Correct' : 'Incorrect'}
                                                </span>
                                            </div>
                                            <p class="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">${answer.question || `Question ${index + 1}`}</p>
                                            
                                            <div class="space-y-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div class="flex items-start gap-3 p-3 rounded-lg ${isCorrect ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-red-50 dark:bg-red-900/30'}">
                                                    <i class="fas fa-user-circle text-blue-500 dark:text-blue-400 text-lg mt-1"></i>
                                                    <div class="flex-1">
                                                        <p class="text-xs font-bold uppercase mb-2 tracking-wide text-blue-700 dark:text-blue-300">Your Answer</p>
                                                        <p class="font-semibold text-base text-blue-900 dark:text-blue-100">${answer.userAnswer || answer.selectedAnswer || answer.answer || '<span class="text-gray-500 dark:text-gray-400 italic">No answer provided</span>'}</p>
                                                    </div>
                                                </div>
                                                
                                                <div class="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700">
                                                    <i class="fas fa-check-circle text-green-600 dark:text-green-400 text-lg mt-1"></i>
                                                    <div class="flex-1">
                                                        <p class="text-xs font-bold uppercase mb-2 tracking-wide flex items-center gap-2 text-green-700 dark:text-green-300">
                                                            ✓ Correct Answer
                                                        </p>
                                                        <p class="font-bold text-base text-green-900 dark:text-green-100">${answer.correctAnswer || answer.correct_answer || answer.correctOption || (answer._doc && answer._doc.correctAnswer) || 'Not Available'}</p>
                                                    </div>
                                                </div>
                                                
                                                ${answer.explanation ? `
                                                    <div class="border-t border-gray-200 dark:border-gray-700 pt-3 flex items-start gap-2">
                                                        <i class="fas fa-lightbulb text-yellow-500 mt-1"></i>
                                                        <div class="flex-1">
                                                            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Explanation</p>
                                                            <p class="text-gray-700 dark:text-gray-300 text-sm">${answer.explanation}</p>
                                                        </div>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `}).join('')}
                        </div>
                    `}
                </div>
                
                <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
                    <div class="flex justify-end">
                        <button onclick="closeStudentAssessmentDetailsModal()" 
                            style="background-color: #56AE67; color: white;"
                            class="px-6 py-2.5 rounded-lg hover:bg-[#3d8b4f] transition font-semibold shadow-md"
                            onmouseover="this.style.backgroundColor='#3d8b4f'" 
                            onmouseout="this.style.backgroundColor='#56AE67'">
                            <i class="fas fa-times-circle mr-2"></i>Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(detailModal);
        
    } catch (error) {
        console.error('Error loading assessment details:', error);
        showToast('Failed to load assessment details: ' + error.message, 'error');
    }
}

function closeStudentAssessmentDetailsModal() {
    const modal = document.getElementById('student-assessment-details-modal');
    if (modal) {
        // Remove escape key listener
        if (window.studentAssessmentModalEscapeHandler) {
            document.removeEventListener('keydown', window.studentAssessmentModalEscapeHandler);
            window.studentAssessmentModalEscapeHandler = null;
        }
        modal.remove();
    }
}

// Make handleEscape available globally for cleanup
let handleEscape = null;

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event);
    // Only show toast for critical errors, not for resource loading errors
    if (event.error && !event.filename) {
        // Don't show toast for every error - just log it
        console.warn('Error details:', event.message, event.filename, event.lineno, event.colno);
    }
}, true);

// ===== ANTI-COPY PROTECTION FOR ASSESSMENTS =====

// Store protection event handlers for cleanup
window.assessmentProtectionHandlers = {
    contextMenu: null,
    copy: null,
    cut: null,
    paste: null,
    keydown: null,
    selectStart: null,
    dragStart: null
};

// Enable anti-copy protection during assessment
function enableAssessmentProtection() {
    console.log('🔒 Enabling assessment protection...');
    
    const assessmentPage = document.getElementById('assessment-page');
    if (!assessmentPage) {
        console.warn('Assessment page not found, protection may not work correctly');
        return;
    }
    
    // Prevent right-click context menu
    window.assessmentProtectionHandlers.contextMenu = function(e) {
        e.preventDefault();
        showToast('⚠️ Right-click is disabled during assessment', 'warning');
        return false;
    };
    
    // Prevent copy
    window.assessmentProtectionHandlers.copy = function(e) {
        e.preventDefault();
        showToast('⚠️ Copying is disabled during assessment', 'warning');
        return false;
    };
    
    // Prevent cut
    window.assessmentProtectionHandlers.cut = function(e) {
        e.preventDefault();
        showToast('⚠️ Cutting is disabled during assessment', 'warning');
        return false;
    };
    
    // Prevent paste
    window.assessmentProtectionHandlers.paste = function(e) {
        e.preventDefault();
        showToast('⚠️ Pasting is disabled during assessment', 'warning');
        return false;
    };
    
    // Prevent keyboard shortcuts
    window.assessmentProtectionHandlers.keydown = function(e) {
        // Ctrl/Cmd + C (Copy)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            showToast('⚠️ Copying is disabled during assessment', 'warning');
            return false;
        }
        
        // Ctrl/Cmd + X (Cut)
        if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
            e.preventDefault();
            showToast('⚠️ Cutting is disabled during assessment', 'warning');
            return false;
        }
        
        // Ctrl/Cmd + V (Paste)
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            showToast('⚠️ Pasting is disabled during assessment', 'warning');
            return false;
        }
        
        // Ctrl/Cmd + A (Select All)
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            showToast('⚠️ Select all is disabled during assessment', 'warning');
            return false;
        }
        
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (Developer tools)
        if (
            e.key === 'F12' ||
            ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
            ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
            ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) ||
            ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u'))
        ) {
            e.preventDefault();
            showToast('⚠️ Developer tools are disabled during assessment', 'warning');
            return false;
        }
        
        // Print (Ctrl/Cmd + P)
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            showToast('⚠️ Printing is disabled during assessment', 'warning');
            return false;
        }
    };
    
    // Prevent text selection
    window.assessmentProtectionHandlers.selectStart = function(e) {
        // Allow selection in input fields (radio buttons)
        if (e.target.tagName === 'INPUT') {
            return true;
        }
        e.preventDefault();
        return false;
    };
    
    // Prevent drag and drop
    window.assessmentProtectionHandlers.dragStart = function(e) {
        e.preventDefault();
        return false;
    };
    
    // Attach all event listeners
    document.addEventListener('contextmenu', window.assessmentProtectionHandlers.contextMenu);
    document.addEventListener('copy', window.assessmentProtectionHandlers.copy);
    document.addEventListener('cut', window.assessmentProtectionHandlers.cut);
    document.addEventListener('paste', window.assessmentProtectionHandlers.paste);
    document.addEventListener('keydown', window.assessmentProtectionHandlers.keydown);
    document.addEventListener('selectstart', window.assessmentProtectionHandlers.selectStart);
    document.addEventListener('dragstart', window.assessmentProtectionHandlers.dragStart);
    
    // Add CSS to prevent text selection
    const style = document.createElement('style');
    style.id = 'assessment-protection-style';
    style.textContent = `
        #assessment-page {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
        }
        #assessment-page input[type="radio"] {
            -webkit-user-select: auto !important;
            -moz-user-select: auto !important;
            -ms-user-select: auto !important;
            user-select: auto !important;
        }
    `;
    document.head.appendChild(style);
    
    // Show notification that protection is active
    showToast('🔒 Assessment protection enabled. Copying and screenshots are disabled.', 'info');
    
    console.log('✓ Assessment protection enabled');
}

// Disable anti-copy protection after assessment
function disableAssessmentProtection() {
    console.log('🔓 Disabling assessment protection...');
    
    // Remove all event listeners
    if (window.assessmentProtectionHandlers.contextMenu) {
        document.removeEventListener('contextmenu', window.assessmentProtectionHandlers.contextMenu);
    }
    if (window.assessmentProtectionHandlers.copy) {
        document.removeEventListener('copy', window.assessmentProtectionHandlers.copy);
    }
    if (window.assessmentProtectionHandlers.cut) {
        document.removeEventListener('cut', window.assessmentProtectionHandlers.cut);
    }
    if (window.assessmentProtectionHandlers.paste) {
        document.removeEventListener('paste', window.assessmentProtectionHandlers.paste);
    }
    if (window.assessmentProtectionHandlers.keydown) {
        document.removeEventListener('keydown', window.assessmentProtectionHandlers.keydown);
    }
    if (window.assessmentProtectionHandlers.selectStart) {
        document.removeEventListener('selectstart', window.assessmentProtectionHandlers.selectStart);
    }
    if (window.assessmentProtectionHandlers.dragStart) {
        document.removeEventListener('dragstart', window.assessmentProtectionHandlers.dragStart);
    }
    
    // Clear the handlers
    window.assessmentProtectionHandlers = {
        contextMenu: null,
        copy: null,
        cut: null,
        paste: null,
        keydown: null,
        selectStart: null,
        dragStart: null
    };
    
    // Remove CSS style
    const style = document.getElementById('assessment-protection-style');
    if (style) {
        style.remove();
    }
    
    console.log('✓ Assessment protection disabled');
}

// Also disable protection when user returns to dashboard
window.returnToDashboard = function() {
    disableAssessmentProtection();
    // Return to landing page or dashboard based on user role
    const userData = getUserData();
    if (userData && userData.role === 'student') {
        loadStudentDashboard();
    } else if (userData && userData.role === 'company') {
        loadCompanyDashboard();
    } else {
        showLandingPage();
    }
};

// ============================================
// PROFILE PICTURE UPLOAD
// ============================================

window.showAvatarUpload = function() {
    const modal = document.getElementById('login-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    modalTitle.textContent = 'Upload Profile Picture';
    
    modalContent.innerHTML = `
        <form id="avatar-upload-form" onsubmit="uploadAvatar(event)">
            <div class="text-center mb-6">
                <div class="mb-4">
                    <img id="avatar-preview" src="" alt="Preview" class="w-48 h-48 mx-auto rounded-full object-cover hidden border-4 border-[#56AE67]">
                    <div id="avatar-placeholder" class="w-48 h-48 mx-auto rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <i class="fas fa-camera text-gray-400 text-5xl"></i>
                    </div>
                </div>
                <input type="file" id="avatar-file" accept="image/*" onchange="previewAvatar(event)" class="hidden">
                <button type="button" onclick="document.getElementById('avatar-file').click()" 
                    class="bg-[#56AE67] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition font-semibold">
                    <i class="fas fa-upload mr-2"></i>Choose Photo
                </button>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">JPG, PNG, or GIF (Max 10MB)</p>
            </div>
            
            <div class="flex justify-end space-x-3">
                <button type="button" onclick="closeModal()" class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    Cancel
                </button>
                <button type="submit" id="upload-avatar-btn" disabled
                    class="px-6 py-2 bg-[#56AE67] text-white rounded-lg hover:bg-[#3d8b4f] transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed">
                    <i class="fas fa-check mr-2"></i>Upload
                </button>
            </div>
        </form>
    `;
    
    modal.classList.remove('hidden');
};

window.previewAvatar = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (10MB max to match backend)
    if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error');
        event.target.value = ''; // Clear the input
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        event.target.value = ''; // Clear the input
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('avatar-preview');
        const placeholder = document.getElementById('avatar-placeholder');
        if (preview && placeholder) {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
            const uploadBtn = document.getElementById('upload-avatar-btn');
            if (uploadBtn) uploadBtn.disabled = false;
        }
    };
    reader.readAsDataURL(file);
};

window.uploadAvatar = async function(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('avatar-file');
    const file = fileInput ? fileInput.files[0] : null;
    
    if (!file) {
        showToast('Please select a file', 'error');
        return;
    }
    
    const uploadBtn = document.getElementById('upload-avatar-btn');
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading...';
    }
    
    try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const authToken = sessionStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('Not authenticated');
        }
        
        const response = await fetch('/api/students/upload-avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Profile picture uploaded successfully!', 'success');
            closeModal();
            // Reload profile to show new avatar
            loadStudentProfile();
        } else {
            showToast(data.message || 'Failed to upload avatar', 'error');
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Upload';
            }
        }
    } catch (error) {
        console.error('Error uploading avatar:', error);
        showToast('Error uploading profile picture', 'error');
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Upload';
        }
    }
};

// Feedback Modal Functions
window.openFeedbackModal = function() {
    const modal = document.getElementById('feedback-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('feedback-form').reset();
        document.getElementById('feedback-success').classList.add('hidden');
        document.getElementById('feedback-error').classList.add('hidden');
    }
};

window.closeFeedbackModal = function() {
    const modal = document.getElementById('feedback-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Show feedback button for logged in users
function showFeedbackButton() {
    const feedbackBtn = document.getElementById('feedback-btn');
    const authToken = sessionStorage.getItem('authToken');
    
    if (feedbackBtn && authToken) {
        feedbackBtn.classList.remove('hidden');
        feedbackBtn.onclick = openFeedbackModal;
    }
}

// Call this when dashboard loads
setTimeout(showFeedbackButton, 1000);

// Handle feedback form submission
const feedbackFormHandler = function() {
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackMessage = document.getElementById('feedback-message');
    const charCount = document.getElementById('feedback-char-count');
    
    if (feedbackMessage && charCount) {
        feedbackMessage.addEventListener('input', function() {
            charCount.textContent = this.value.length;
        });
    }
    
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('feedback-submit-btn');
            const successMsg = document.getElementById('feedback-success');
            const errorMsg = document.getElementById('feedback-error');
            
            // Hide previous messages
            successMsg.classList.add('hidden');
            errorMsg.classList.add('hidden');
            
            // Disable button
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';
            
            try {
                const authToken = sessionStorage.getItem('authToken');
                if (!authToken) {
                    throw new Error('Not authenticated');
                }
                
                const formData = {
                    subject: document.getElementById('feedback-subject').value,
                    message: document.getElementById('feedback-message').value,
                    category: document.getElementById('feedback-category').value,
                    priority: document.getElementById('feedback-priority').value
                };
                
                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    successMsg.classList.remove('hidden');
                    feedbackForm.reset();
                    charCount.textContent = '0';
                    
                    // Close modal after 3 seconds
                    setTimeout(() => {
                        closeFeedbackModal();
                    }, 3000);
                } else {
                    errorMsg.textContent = data.message || 'Failed to submit feedback';
                    errorMsg.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error submitting feedback:', error);
                errorMsg.textContent = 'Error submitting feedback. Please try again.';
                errorMsg.classList.remove('hidden');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Submit Feedback';
            }
        });
    }
};

// Initialize feedback handler when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', feedbackFormHandler);
} else {
    feedbackFormHandler();
}

