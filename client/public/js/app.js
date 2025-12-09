

// Application State
let currentUser = null;
let authToken = null;
let currentPage = 'landing';
let isDarkMode = false;

// API Base URL (use shared window.API_BASE if provided by helpers.js)
const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : '/api';

// Utility function to check if JWT token is expired
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
    } catch (e) {
        return true;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    if (validateAPIConfiguration()) {
        initializeApp();
    } else {
        showToast('API configuration error. Please check console for details.', 'error');
    }

});

async function initializeApp() {
    // Show loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    console.log('Debug: Loading overlay element found:', !!loadingOverlay);
    
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
        console.log('Debug: Loading overlay shown');
    } else {
        console.error('Loading overlay element not found!');
    }

    // Safety timeout to hide loading overlay after 5 seconds
    const safetyTimeout = setTimeout(() => {
        console.warn('Safety timeout: Force hiding loading overlay after 5 seconds');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }, 5000);

    try {
        // Initialize theme
        initializeTheme();

        // Check for existing session (using sessionStorage for tab-specific sessions)
        authToken = sessionStorage.getItem('authToken');
        const userData = sessionStorage.getItem('userData');
        const googleOAuthSuccess = sessionStorage.getItem('googleOAuthSuccess');
        const savedPage = sessionStorage.getItem('currentPage');

        if (authToken && userData) {
            // Check if token is expired before making API call
            if (isTokenExpired(authToken)) {
                console.log('Token expired, clearing session');
                authToken = null;
                currentUser = null;
                sessionStorage.removeItem('authToken');
                sessionStorage.removeItem('userData');
                sessionStorage.removeItem('currentPage');
                showLandingPage();
            } else {
                // Verify token is still valid with server
                try {
                    const response = await apiCall('/auth/me');
                    currentUser = response.data;
                    // Update session storage with fresh user data
                    sessionStorage.setItem('userData', JSON.stringify(currentUser));

                    // Apply user's theme preference if available
                    if (currentUser.themePreference) {
                        applyTheme(currentUser.themePreference);
                    }
                    updateNavigation();

                    // Handle Google OAuth success
                    if (googleOAuthSuccess === 'true') {
                        sessionStorage.removeItem('googleOAuthSuccess');
                        showToast('Successfully logged in with Google!', 'success');
                    }

                    // Restore the saved page or show dashboard
                    if (savedPage && ['student-dashboard', 'company-dashboard'].includes(savedPage)) {
                        if ((currentUser.role === 'student' && savedPage === 'student-dashboard') ||
                            (currentUser.role === 'company' && savedPage === 'company-dashboard')) {
                            showPage(savedPage);
                            if (savedPage === 'student-dashboard') {
                                loadStudentDashboard();
                            } else if (savedPage === 'company-dashboard') {
                                loadCompanyDashboard();
                            }
                        }
                    } else {
                        // No saved page or invalid saved page - show the appropriate dashboard
                        showDashboard();
                    }
                } catch (error) {
                    console.error('Error during initialization:', error);
                    // If token verification fails, clear invalid token and show landing
                    authToken = null;
                    currentUser = null;
                    sessionStorage.removeItem('authToken');
                    sessionStorage.removeItem('userData');
                    sessionStorage.removeItem('currentPage');
                    showLandingPage();
                }
            }
        } else {
            showLandingPage();
        }
    } catch (error) {
        console.error('Error during app initialization:', error);
        // Clear potentially invalid data on critical error
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('currentPage');
        showLandingPage();
    } finally {
        // Clear safety timeout
        clearTimeout(safetyTimeout);
        
        // Hide loading overlay
        console.log('Debug: Hiding loading overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            console.log('Debug: Loading overlay hidden');
        }
    }
}

function updateNavigation() {
    const navMenu = document.getElementById('nav-menu');

    // Theme toggle button
    const themeToggleButton = `
        <button id="theme-toggle" onclick="toggleTheme()" class="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white ml-4">
            <i class="fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}"></i>
        </button>
    `;

    if (currentUser) {
        // Different navigation for students vs companies
        if (currentUser.role === 'student') {
            navMenu.innerHTML = `
                <span class="text-gray-700 dark:text-gray-300">Welcome, ${currentUser.email}</span>
                <button onclick="goToDashboard()" class="text-[#56AE67] hover:text-[#2d6b3c] dark:text-[#6bc481] dark:hover:text-[#7dd091]">
                    <i class="fas fa-tachometer-alt mr-1"></i>Dashboard
                </button>
                <button onclick="showSettingsModal()" class="text-[#56AE67] hover:text-[#2d6b3c] dark:text-[#6bc481] dark:hover:text-[#7dd091]">
                    <i class="fas fa-cog mr-1"></i>Settings
                </button>
                <button onclick="logout()" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                    <i class="fas fa-sign-out-alt mr-1"></i>Logout
                </button>
            `;
        } else if (currentUser.role === 'company') {
            // Get company name from sessionStorage or use email as fallback
            const companyName = currentUser.companyName || sessionStorage.getItem('companyName') || currentUser.email;
            navMenu.innerHTML = `
                <span class="text-gray-700 dark:text-gray-300">Welcome, ${companyName}</span>
                <button onclick="showSettingsModal()" class="text-[#56AE67] hover:text-[#2d6b3c] dark:text-[#6bc481] dark:hover:text-[#7dd091]">
                    <i class="fas fa-cog mr-1"></i>Settings
                </button>
                <button onclick="logout()" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                    <i class="fas fa-sign-out-alt mr-1"></i>Logout
                </button>
            `;
        } else {
            // Admin or other roles - show basic navigation
            navMenu.innerHTML = `
                <span class="text-gray-700 dark:text-gray-300">Welcome, ${currentUser.email}</span>
                <button onclick="showLandingPage()" class="text-[#56AE67] hover:text-[#2d6b3c] dark:text-[#6bc481] dark:hover:text-[#7dd091]">
                    <i class="fas fa-home mr-1"></i>Home
                </button>
                <button onclick="goToDashboard()" class="text-[#56AE67] hover:text-[#2d6b3c] dark:text-[#6bc481] dark:hover:text-[#7dd091]">
                    <i class="fas fa-tachometer-alt mr-1"></i>Dashboard
                </button>
                <button onclick="logout()" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                    <i class="fas fa-sign-out-alt mr-1"></i>Logout
                </button>
            `;
        }
    } else {
        // When not logged in, show nothing in nav menu
        navMenu.innerHTML = ``;
    }
}

function showPage(pageId) {
    // Hide all pages
    const pages = ['landing-page', 'assessment-page', 'student-dashboard', 'company-dashboard'];
    pages.forEach(page => {
        document.getElementById(page).classList.add('hidden');
    });

    // Show requested page
    document.getElementById(pageId).classList.remove('hidden');
    currentPage = pageId;
    sessionStorage.setItem('currentPage', pageId);
}

function showLandingPage() {
    showPage('landing-page');
    updateNavigation();
    // Load real-time statistics
    loadPlatformStatistics();
    
    // Check for admin login query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const loginRole = urlParams.get('login');
    
    if (loginRole === 'admin') {
        // Auto-open admin login modal
        setTimeout(() => {
            showLoginModal('admin');
            // Remove the query parameter from URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 500);
    }
}

// Load and display real platform statistics
async function loadPlatformStatistics() {
    try {
        const response = await fetch(`${API_BASE}/jobs/stats`);
        const data = await response.json();
        
        if (data.success && data.data) {
            // Update Active Jobs
            const totalJobsElement = document.getElementById('total-jobs');
            if (totalJobsElement) {
                totalJobsElement.textContent = data.data.totalJobs || 0;
            }
            
            // Update Companies
            const totalCompaniesElement = document.getElementById('total-companies');
            if (totalCompaniesElement) {
                totalCompaniesElement.textContent = data.data.totalCompanies || 0;
            }
            
            // Update Applications
            const totalApplicationsElement = document.getElementById('total-applications');
            if (totalApplicationsElement) {
                totalApplicationsElement.textContent = data.data.totalApplications || 0;
            }
            
            // Note: Skills Assessed count can be calculated from Assessment model
            // For now, we'll fetch it separately if needed
            loadSkillsAssessedCount();
        }
    } catch (error) {
        console.error('Error loading platform statistics:', error);
        // Keep default values if stats fail to load
    }
}

// Load total skills assessed count
async function loadSkillsAssessedCount() {
    try {
        // This endpoint would need to be created to count total assessment results
        // For now, we'll use a reasonable estimate based on assessment completion
        const response = await fetch(`${API_BASE}/assessments/stats`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.totalSkillsAssessed) {
            const skillsElement = document.getElementById('total-skills');
            if (skillsElement) {
                const count = data.data.totalSkillsAssessed;
                skillsElement.textContent = count >= 100 ? '100+' : count;
            }
        }
    } catch (error) {
        // Silently fail - show 0 if endpoint doesn't exist yet
        console.log('Skills assessed stats not available');
        const skillsElement = document.getElementById('total-skills');
        if (skillsElement) {
            skillsElement.textContent = '0';
        }
    }
}

function showDashboard() {
    if (!currentUser) {
        console.error('showDashboard called but currentUser is null');
        return;
    }
    
    console.log('showDashboard called for user:', currentUser.email, 'role:', currentUser.role);
    
    if (currentUser.role === 'student') {
        console.log('Loading student dashboard');
        showPage('student-dashboard');
        loadStudentDashboard();
    } else if (currentUser.role === 'company') {
        console.log('Loading company dashboard');
        showPage('company-dashboard');
        loadCompanyDashboard();
    } else if (currentUser.role === 'admin') {
        console.log('Admin user detected, redirecting to admin dashboard');
        // Store admin token and user data before redirecting
        sessionStorage.setItem('authToken', authToken);
        sessionStorage.setItem('userData', JSON.stringify(currentUser));
        window.location.href = '/admin.html';
    } else {
        console.warn('Unknown user role:', currentUser.role);
    }
}

// Modal functions
function showLoginModal(role) {
    const modal = document.getElementById('login-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    // Set title based on role
    let titleText = 'Login';
    if (role === 'student') titleText = 'Student Login';
    else if (role === 'company') titleText = 'Company Login';
    else if (role === 'admin') titleText = 'Admin Login';
    
    modalTitle.textContent = titleText;

    // Show tabs only for students and companies (not for admin)
    const tabsHTML = role === 'admin' ? '' : `
        <div id="login-tabs" class="flex mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button id="login-tab" onclick="switchTab('login', '${role}')" 
                class="flex-1 py-3 px-4 rounded-lg font-semibold shadow-md transition duration-300 transform hover:scale-105" 
                style="background-color: #56AE67 !important; color: white !important;">
                <i class="fas fa-sign-in-alt mr-2"></i>Login
            </button>
            <button id="register-tab" onclick="switchTab('register', '${role}')" 
                class="flex-1 py-3 px-4 bg-transparent text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition duration-300">
                <i class="fas fa-user-plus mr-2"></i>Register
            </button>
        </div>
    `;

    // Google OAuth only for students
    const googleOAuthHTML = role === 'student' ? `
        <div class="mt-6 relative">
            <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
        </div>
        <button onclick="window.location.href = '/api/auth/google'" 
            class="mt-4 w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-white py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 transition duration-300 transform hover:scale-[1.02] font-semibold shadow-md">
            <svg class="w-5 h-5 mr-3" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
        </button>
    ` : '';

    modalContent.innerHTML = `
        ${tabsHTML}
        <div id="auth-form-container"></div>
        ${googleOAuthHTML}
        <div id="auth-message" class="mt-4 text-center"></div>
    `;

    // Initially render login form (after creating the container)
    renderAuthForm(role, 'login');

    modal.classList.remove('hidden');
}

function renderAuthForm(role, mode) {
    const container = document.getElementById('auth-form-container');
    const isStudentRegister = role === 'student' && mode === 'register';
    const isCompanyRegister = role === 'company' && mode === 'register';
    const submitText = mode === 'register' ? 'Register' : 'Login';

    let formHTML = `
        <form id="auth-form" onsubmit="handleAuth(event, '${role}', '${mode}')">
    `;

    if (isStudentRegister) {
        formHTML += `
            <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                        <i class="fas fa-user mr-1"></i> First Name
                    </label>
                    <input type="text" id="firstName" required 
                        class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200"
                        placeholder="John">
                </div>
                <div>
                    <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                        <i class="fas fa-user mr-1"></i> Last Name
                    </label>
                    <input type="text" id="lastName" required 
                        class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200"
                        placeholder="Doe">
                </div>
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    <i class="fas fa-id-card mr-1"></i> Student ID
                </label>
                <input type="text" id="studentId" required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200" 
                    placeholder="Enter your student ID">
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    <i class="fas fa-phone mr-1"></i> Personal Phone Number
                </label>
                <input type="tel" id="phone" required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200" 
                    placeholder="+63xxxxxxxxxx">
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    <i class="fas fa-home mr-1"></i> House Address
                </label>
                <input type="text" id="street" required 
                    class="w-full mb-2 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200" 
                    placeholder="Street Address">
                <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="city" required 
                        class="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200" 
                        placeholder="City">
                    <input type="text" id="state" required 
                        class="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200" 
                        placeholder="State/Province">
                </div>
                <input type="text" id="zip" required 
                    class="w-full mt-2 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200" 
                    placeholder="ZIP Code">
            </div>
        `;
    }

    if (isCompanyRegister) {
        formHTML += `
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    <i class="fas fa-user-tie mr-1"></i> Company Employee Name
                </label>
                <input type="text" id="employeeName" required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200" 
                    placeholder="Enter your full name">
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    <i class="fas fa-building mr-1"></i> Company Name
                </label>
                <input type="text" id="companyName" required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200" 
                    placeholder="Enter company name">
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    <i class="fas fa-map-marker-alt mr-1"></i> Company Address
                </label>
                <input type="text" id="companyAddress" required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200" 
                    placeholder="Enter company address">
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    <i class="fas fa-envelope mr-1"></i> Company Email
                </label>
                <input type="email" id="companyEmail" required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200" 
                    placeholder="company@example.com">
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    <i class="fas fa-phone-alt mr-1"></i> Company Number
                </label>
                <input type="tel" id="companyNumber" required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200" 
                    placeholder="+63xxxxxxxxxx">
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    <i class="fas fa-calendar-alt mr-1"></i> Year of Registration
                </label>
                <input type="number" id="yearOfRegistration" required min="1900" max="${new Date().getFullYear()}" 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200" 
                    placeholder="2020">
            </div>
        `;
    }

    formHTML += `
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    <i class="fas fa-envelope mr-1"></i> Email
                </label>
                <input type="email" id="email" required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200"
                    placeholder="Enter your email address">
            </div>

            <div class="mb-6">
                <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    <i class="fas fa-lock mr-1"></i> Password
                </label>
                <div class="relative">
                    <input type="password" id="password" required 
                        class="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-200"
                        placeholder="Enter your password">
                    <button type="button" 
                        onclick="togglePasswordVisibility()" 
                        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition"
                        title="Toggle password visibility">
                        <i class="fas fa-eye" id="password-toggle-icon"></i>
                    </button>
                </div>
                ${mode === 'login' ? `
                    <div class="mt-2 text-right">
                        <a href="forgot-password.html" 
                           class="text-sm text-[#56AE67] hover:text-[#3d8b4f] dark:text-[#6bc481] dark:hover:text-[#7dd091] font-medium transition">
                            <i class="fas fa-key mr-1"></i>Forgot Password?
                        </a>
                    </div>
                ` : ''}
                ${isStudentRegister ? `
                    <div class="mt-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-[#56AE67] p-3 rounded">
                        <p class="text-xs text-[#3d8b4f] dark:text-[#7dd091] font-semibold mb-1">
                            <i class="fas fa-shield-alt mr-1"></i> Password Requirements:
                        </p>
                        <ul class="text-xs text-[#56AE67] dark:text-[#6bc481] space-y-1 ml-5">
                            <li class="flex items-center"><i class="fas fa-check-circle mr-2 text-[#56AE67]"></i>At least 8 characters</li>
                            <li class="flex items-center"><i class="fas fa-check-circle mr-2 text-[#56AE67]"></i>At least 1 uppercase letter (A-Z)</li>
                            <li class="flex items-center"><i class="fas fa-check-circle mr-2 text-[#56AE67]"></i>At least 1 special character (!@#$%^&*)</li>
                        </ul>
                    </div>
                ` : ''}
            </div>

            <button type="submit" class="w-full bg-gradient-to-r from-[#56AE67] to-[#3d8b4f] text-white py-3 px-4 rounded-lg hover:from-[#3d8b4f] hover:to-[#2d6b3c] transition duration-300 transform hover:scale-[1.02] font-semibold shadow-lg">
                <span class="loading hidden inline-block">
                    <i class="fas fa-spinner fa-spin mr-2"></i>
                </span>
                <span id="submit-text">${submitText}</span>
            </button>
        </form>
    `;

    container.innerHTML = formHTML;
}

function switchTab(tab, role) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');

    if (tab === 'login') {
        loginTab.className = 'flex-1 py-3 px-4 rounded-lg font-semibold shadow-md transition duration-300 transform hover:scale-105';
        loginTab.style.backgroundColor = '#56AE67';
        loginTab.style.color = 'white';
        registerTab.className = 'flex-1 py-3 px-4 bg-transparent text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition duration-300';
        registerTab.style.backgroundColor = '';
        registerTab.style.color = '';
        renderAuthForm(role, 'login');
    } else {
        loginTab.className = 'flex-1 py-3 px-4 bg-transparent text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition duration-300';
        loginTab.style.backgroundColor = '';
        loginTab.style.color = '';
        registerTab.className = 'flex-1 py-3 px-4 rounded-lg font-semibold shadow-md transition duration-300 transform hover:scale-105';
        registerTab.style.backgroundColor = '#56AE67';
        registerTab.style.color = 'white';
        renderAuthForm(role, 'register');
    }
}

function closeModal() {
    document.getElementById('login-modal').classList.add('hidden');
}

function closeStudentRegistrationModal() {
    const modal = document.getElementById('student-registration-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}



function logout() {
    authToken = null;
    currentUser = null;
    sessionStorage.clear(); // Clear all session data to prevent contamination
    updateNavigation();
    showLandingPage();
    showToast('Logged out successfully', 'info');
}





function showAssessmentPage() {
    // Ensure any open modals are closed so they don't block clicks
    const loginModal = document.getElementById('login-modal');
    if (loginModal) loginModal.classList.add('hidden');
    const profileModal = document.getElementById('student-profile-modal');
    if (profileModal) profileModal.classList.add('hidden');
    
    showPage('assessment-page');
    // Bring user to top of assessment content
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { /* no-op */ }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatSalary(salary) {
    if (!salary) return 'Not specified';
    
    const { min, max, period = 'monthly', currency = 'USD' } = salary;
    
    if (min && max) {
        return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} per ${period}`;
    } else if (min) {
        return `${currency} ${min.toLocaleString()}+ per ${period}`;
    } else if (max) {
        return `Up to ${currency} ${max.toLocaleString()} per ${period}`;
    } else {
        return 'Not specified';
    }
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Theme Management Functions
function initializeTheme() {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    isDarkMode = theme === 'dark';
    const body = document.body;
    const html = document.documentElement;
    
    if (isDarkMode) {
        body.classList.add('dark');
        html.classList.add('dark');
        // Also add a global class to force text color override
        document.documentElement.style.setProperty('--text-primary', '#f3f4f6');
        document.documentElement.style.setProperty('--text-secondary', '#d1d5db');
    } else {
        body.classList.remove('dark');
        html.classList.remove('dark');
        // Reset to light mode colors
        document.documentElement.style.setProperty('--text-primary', '#111827');
        document.documentElement.style.setProperty('--text-secondary', '#6b7280');
    }
    
    // Update theme toggle button if it exists
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    localStorage.setItem('theme', theme);
}

async function toggleTheme() {
    const newTheme = isDarkMode ? 'light' : 'dark';
    applyTheme(newTheme);
    
    // Update user preference on server if logged in
    if (currentUser && authToken) {
        try {
            const endpoint = currentUser.role === 'student' ? '/students/theme' : '/companies/theme';
            await apiCall(endpoint, {
                method: 'PUT',
                body: JSON.stringify({ themePreference: newTheme })
            });
            
            // Update session user data
            currentUser.themePreference = newTheme;
            sessionStorage.setItem('userData', JSON.stringify(currentUser));
            
            showToast(`Theme changed to ${newTheme} mode`, 'success');
        } catch (error) {
            console.error('Error updating theme preference:', error);
            showToast('Theme changed locally, but could not save to server', 'warning');
        }
    } else {
        showToast(`Theme changed to ${newTheme} mode`, 'success');
    }
}

// Account Deletion Functions
function showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) {
        // Create modal if it doesn't exist
        createSettingsModal();
    } else {
        modal.classList.remove('hidden');
    }
}

// ===== SETTINGS MODAL =====
function showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) {
        createSettingsModal();
    } else {
        modal.classList.remove('hidden');
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function createSettingsModal() {
    // Remove existing modal if present
    const existing = document.getElementById('settings-modal');
    if (existing) existing.remove();
    
    // Load current settings
    apiCall('/settings').then(response => {
        const settings = response.success ? response.data : {
            notifications: { email: true, jobUpdates: true, assessments: true },
            privacy: { profileVisible: true, resumeVisible: true }
        };
    
    const modalHTML = `
        <div id="settings-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center flex-shrink-0">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        <i class="fas fa-cog mr-2"></i>Settings
                    </h2>
                    <button onclick="closeSettingsModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="p-6 flex-1" style="overflow-y: scroll !important; max-height: calc(90vh - 88px); scrollbar-width: thin; scrollbar-color: #56AE67 #f1f1f1;">
                    <style>
                        /* Webkit browsers (Chrome, Safari, Edge) */
                        #settings-modal div[style*="overflow-y"]::-webkit-scrollbar {
                            width: 14px;
                            background: transparent;
                        }
                        #settings-modal div[style*="overflow-y"]::-webkit-scrollbar-track {
                            background: #f1f1f1;
                            border-radius: 10px;
                            margin: 8px 0;
                        }
                        #settings-modal div[style*="overflow-y"]::-webkit-scrollbar-thumb {
                            background: #56AE67;
                            border-radius: 10px;
                            border: 2px solid #f1f1f1;
                        }
                        #settings-modal div[style*="overflow-y"]::-webkit-scrollbar-thumb:hover {
                            background: #3d8b4f;
                        }
                        /* Dark mode */
                        .dark #settings-modal div[style*="overflow-y"]::-webkit-scrollbar-track {
                            background: #1f2937;
                            border: 1px solid #374151;
                        }
                        .dark #settings-modal div[style*="overflow-y"]::-webkit-scrollbar-thumb {
                            background: #6bc481;
                            border: 2px solid #1f2937;
                        }
                        .dark #settings-modal div[style*="overflow-y"]::-webkit-scrollbar-thumb:hover {
                            background: #7dd091;
                        }
                        /* Firefox */
                        .dark #settings-modal div[style*="overflow-y"] {
                            scrollbar-color: #6bc481 #1f2937;
                        }
                    </style>
                    <!-- Theme Preference -->
                    <div class="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            <i class="fas fa-palette mr-2 text-purple-600"></i>Appearance
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Current theme: <span class="font-semibold">${isDarkMode ? 'Dark Mode' : 'Light Mode'}</span></p>
                        <button onclick="toggleTheme(); location.reload()" 
                            style="background-color: #7c3aed; color: white; border: 2px solid #6d28d9;"
                            class="px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
                            onmouseover="this.style.backgroundColor='#6d28d9'" 
                            onmouseout="this.style.backgroundColor='#7c3aed'">
                            <i class="fas fa-${isDarkMode ? 'sun' : 'moon'} mr-2"></i>Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode
                        </button>
                    </div>

                    <!-- Privacy & Security -->
                    <div class="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            <i class="fas fa-shield-alt mr-2 text-indigo-600"></i>Privacy & Security
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage your privacy and security settings</p>
                        <div class="space-y-3">
                            <label class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                                <div class="flex items-center">
                                    <i class="fas fa-eye mr-3 text-gray-600 dark:text-gray-400"></i>
                                    <span class="text-sm text-gray-700 dark:text-gray-300">Profile Visible to Companies</span>
                                </div>
                                <input type="checkbox" id="profile-visibility" ${settings.privacy.profileVisible ? 'checked' : ''} 
                                       onchange="updatePrivacySetting('profileVisible', this.checked)" class="w-4 h-4">
                            </label>
                            <label class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                                <div class="flex items-center">
                                    <i class="fas fa-file-alt mr-3 text-gray-600 dark:text-gray-400"></i>
                                    <span class="text-sm text-gray-700 dark:text-gray-300">Show Resume to Recruiters</span>
                                </div>
                                <input type="checkbox" id="resume-visibility" ${settings.privacy.resumeVisible ? 'checked' : ''} 
                                       onchange="updatePrivacySetting('resumeVisible', this.checked)" class="w-4 h-4">
                            </label>
                        </div>
                    </div>

                    <!-- Notifications -->
                    <div class="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            <i class="fas fa-bell mr-2 text-yellow-600"></i>Notifications
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage your notification preferences</p>
                        <div class="space-y-3">
                            <label class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                                <div class="flex items-center">
                                    <i class="fas fa-envelope mr-3 text-gray-600 dark:text-gray-400"></i>
                                    <span class="text-sm text-gray-700 dark:text-gray-300">Email Notifications</span>
                                </div>
                                <input type="checkbox" id="email-notifications" ${settings.notifications.email ? 'checked' : ''} 
                                       onchange="updateNotificationSetting('email', this.checked)" class="w-4 h-4">
                            </label>
                            <label class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                                <div class="flex items-center">
                                    <i class="fas fa-briefcase mr-3 text-gray-600 dark:text-gray-400"></i>
                                    <span class="text-sm text-gray-700 dark:text-gray-300">Job Application Updates</span>
                                </div>
                                <input type="checkbox" id="job-notifications" ${settings.notifications.jobUpdates ? 'checked' : ''} 
                                       onchange="updateNotificationSetting('jobUpdates', this.checked)" class="w-4 h-4">
                            </label>
                            <label class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                                <div class="flex items-center">
                                    <i class="fas fa-clipboard-check mr-3 text-gray-600 dark:text-gray-400"></i>
                                    <span class="text-sm text-gray-700 dark:text-gray-300">Assessment Reminders</span>
                                </div>
                                <input type="checkbox" id="assessment-notifications" ${settings.notifications.assessments ? 'checked' : ''} 
                                       onchange="updateNotificationSetting('assessments', this.checked)" class="w-4 h-4">
                            </label>
                        </div>
                    </div>

                    <!-- Delete Account -->
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
                            <i class="fas fa-exclamation-triangle mr-2"></i>Danger Zone
                        </h3>
                        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p class="text-sm text-red-800 dark:text-red-200 mb-3">Once you delete your account, there is no going back. Please be certain.</p>
                            <button onclick="showDeleteAccountModal()" 
                                style="background-color: #dc2626; color: white; border: 2px solid #b91c1c;"
                                class="px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
                                onmouseover="this.style.backgroundColor='#b91c1c'" 
                                onmouseout="this.style.backgroundColor='#dc2626'">
                                <i class="fas fa-trash mr-2"></i>Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    }).catch(err => {
        console.error('Error loading settings:', err);
        showToast('Failed to load settings', 'error');
    });
}

function showChangePasswordForm() {
    closeSettingsModal();
    
    // Remove existing modal if present
    const existing = document.getElementById('change-password-modal');
    if (existing) existing.remove();
    
    const modalHTML = `
        <div id="change-password-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">Change Password</h3>
                    <button onclick="closeChangePasswordModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="change-password-form" onsubmit="handleChangePassword(event)">
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Current Password</label>
                        <div class="relative">
                            <input type="password" id="current-password" required 
                                class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                                       focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                                placeholder="Enter current password">
                            <button type="button" onclick="togglePasswordVisibility('current-password', 'current-eye')" 
                                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <i id="current-eye" class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">New Password</label>
                        <div class="relative">
                            <input type="password" id="new-password" required minlength="8"
                                class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                                       focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                                placeholder="Enter new password">
                            <button type="button" onclick="togglePasswordVisibility('new-password', 'new-eye')" 
                                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <i id="new-eye" class="fas fa-eye"></i>
                            </button>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 8 characters</p>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Confirm New Password</label>
                        <div class="relative">
                            <input type="password" id="confirm-password" required 
                                class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                                       focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                                placeholder="Confirm new password">
                            <button type="button" onclick="togglePasswordVisibility('confirm-password', 'confirm-eye')" 
                                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <i id="confirm-eye" class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" onclick="closeChangePasswordModal()" 
                            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                            Cancel
                        </button>
                        <button type="submit" 
                            style="background-color: #2563eb; color: white;"
                            class="px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            onmouseover="this.style.backgroundColor='#1d4ed8'" 
                            onmouseout="this.style.backgroundColor='#2563eb'">
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function togglePasswordVisibility(inputId, eyeIconId) {
    const input = document.getElementById(inputId);
    const eyeIcon = document.getElementById(eyeIconId);
    
    if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

function closeChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    if (modal) modal.remove();
}

async function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
    
    try {
        const response = await apiCall('/settings/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        if (response.success) {
            showToast('Password changed successfully!', 'success');
            closeChangePasswordModal();
        } else {
            showToast(response.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        showToast(error.message || 'Failed to change password', 'error');
    }
}

async function updateNotificationSetting(setting, value) {
    try {
        const body = {};
        body[setting] = value;
        
        const response = await apiCall('/settings/notifications', {
            method: 'PUT',
            body: JSON.stringify(body)
        });
        
        if (response.success) {
            showToast('Notification preference updated', 'success');
        } else {
            showToast('Failed to update preference', 'error');
        }
    } catch (error) {
        console.error('Error updating notification:', error);
        showToast('Failed to update preference', 'error');
    }
}

async function updatePrivacySetting(setting, value) {
    try {
        const body = {};
        body[setting] = value;
        
        const response = await apiCall('/settings/privacy', {
            method: 'PUT',
            body: JSON.stringify(body)
        });
        
        if (response.success) {
            showToast('Privacy setting updated', 'success');
        } else {
            showToast('Failed to update setting', 'error');
        }
    } catch (error) {
        console.error('Error updating privacy:', error);
        showToast('Failed to update setting', 'error');
    }
}

// ===== DELETE ACCOUNT MODAL =====
function showDeleteAccountModal() {
    closeSettingsModal();
    closeSettingsModal();
    const modal = document.getElementById('delete-account-modal');
    if (!modal) {
        // Create modal if it doesn't exist
        createDeleteAccountModal();
    } else {
        modal.classList.remove('hidden');
    }
}

function createSettingsModal() {
    const modalHTML = `
        <div id="settings-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center flex-shrink-0">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        <i class="fas fa-cog mr-2"></i>Settings
                    </h2>
                    <button onclick="closeSettingsModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="p-6 flex-1" style="overflow-y: scroll !important; max-height: calc(90vh - 88px); scrollbar-width: thin; scrollbar-color: #56AE67 #f1f1f1;">
                    <style>
                        /* Webkit browsers (Chrome, Safari, Edge) */
                        #settings-modal div[style*="overflow-y"]::-webkit-scrollbar {
                            width: 14px;
                            background: transparent;
                        }
                        #settings-modal div[style*="overflow-y"]::-webkit-scrollbar-track {
                            background: #f1f1f1;
                            border-radius: 10px;
                            margin: 8px 0;
                        }
                        #settings-modal div[style*="overflow-y"]::-webkit-scrollbar-thumb {
                            background: #56AE67;
                            border-radius: 10px;
                            border: 2px solid #f1f1f1;
                        }
                        #settings-modal div[style*="overflow-y"]::-webkit-scrollbar-thumb:hover {
                            background: #3d8b4f;
                        }
                        /* Dark mode */
                        .dark #settings-modal div[style*="overflow-y"]::-webkit-scrollbar-track {
                            background: #1f2937;
                            border: 1px solid #374151;
                        }
                        .dark #settings-modal div[style*="overflow-y"]::-webkit-scrollbar-thumb {
                            background: #6bc481;
                            border: 2px solid #1f2937;
                        }
                        .dark #settings-modal div[style*="overflow-y"]::-webkit-scrollbar-thumb:hover {
                            background: #7dd091;
                        }
                        /* Firefox */
                        .dark #settings-modal div[style*="overflow-y"] {
                            scrollbar-color: #6bc481 #1f2937;
                        }
                    </style>
                    <div class="p-6">

                    <!-- Notification Preferences -->
                    <div class="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            <i class="fas fa-bell mr-2 text-yellow-600"></i>Notifications
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage your notification preferences</p>
                        <div class="space-y-3">
                            <label class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                                <div class="flex items-center">
                                    <i class="fas fa-envelope mr-3 text-gray-600 dark:text-gray-400"></i>
                                    <span class="text-sm text-gray-700 dark:text-gray-300">Email Notifications</span>
                                </div>
                                <input type="checkbox" id="email-notifications" checked class="toggle-checkbox">
                            </label>
                            <label class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                                <div class="flex items-center">
                                    <i class="fas fa-briefcase mr-3 text-gray-600 dark:text-gray-400"></i>
                                    <span class="text-sm text-gray-700 dark:text-gray-300">Job Application Updates</span>
                                </div>
                                <input type="checkbox" id="job-notifications" checked class="toggle-checkbox">
                            </label>
                            <label class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                                <div class="flex items-center">
                                    <i class="fas fa-clipboard-check mr-3 text-gray-600 dark:text-gray-400"></i>
                                    <span class="text-sm text-gray-700 dark:text-gray-300">Assessment Reminders</span>
                                </div>
                                <input type="checkbox" id="assessment-notifications" checked class="toggle-checkbox">
                            </label>
                        </div>
                    </div>

                    <!-- Theme Preference -->
                    <div class="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            <i class="fas fa-palette mr-2 text-purple-600"></i>Appearance
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Current theme: <span class="font-semibold">${isDarkMode ? 'Dark Mode' : 'Light Mode'}</span></p>
                        <button onclick="toggleTheme(); closeSettingsModal()" 
                            style="background-color: #7c3aed; color: white; border: 2px solid #6d28d9;"
                            class="px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
                            onmouseover="this.style.backgroundColor='#6d28d9'" 
                            onmouseout="this.style.backgroundColor='#7c3aed'">
                            <i class="fas fa-${isDarkMode ? 'sun' : 'moon'} mr-2"></i>Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode
                        </button>
                    </div>

                    <!-- Privacy & Security -->
                    <div class="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            <i class="fas fa-shield-alt mr-2 text-indigo-600"></i>Privacy & Security
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage your privacy and security settings</p>
                        <div class="space-y-3">
                            <label class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                                <div class="flex items-center">
                                    <i class="fas fa-eye mr-3 text-gray-600 dark:text-gray-400"></i>
                                    <span class="text-sm text-gray-700 dark:text-gray-300">Profile Visible to Companies</span>
                                </div>
                                <input type="checkbox" id="profile-visibility" checked class="toggle-checkbox">
                            </label>
                            <label class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                                <div class="flex items-center">
                                    <i class="fas fa-file-alt mr-3 text-gray-600 dark:text-gray-400"></i>
                                    <span class="text-sm text-gray-700 dark:text-gray-300">Show Resume to Recruiters</span>
                                </div>
                                <input type="checkbox" id="resume-visibility" checked class="toggle-checkbox">
                            </label>
                        </div>
                    </div>

                    <!-- Delete Account -->
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
                            <i class="fas fa-exclamation-triangle mr-2"></i>Danger Zone
                        </h3>
                        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p class="text-sm text-red-800 dark:text-red-200 mb-3">Once you delete your account, there is no going back. Please be certain.</p>
                            <button onclick="showDeleteAccountModal()" 
                                style="background-color: #dc2626; color: white; border: 2px solid #b91c1c;"
                                class="px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
                                onmouseover="this.style.backgroundColor='#b91c1c'" 
                                onmouseout="this.style.backgroundColor='#dc2626'">
                                <i class="fas fa-trash mr-2"></i>Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function showChangePasswordForm() {
    closeSettingsModal();
    
    const modalHTML = `
        <div id="change-password-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">Change Password</h3>
                    <button onclick="closeChangePasswordModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="change-password-form" onsubmit="handleChangePassword(event)">
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Current Password</label>
                        <input type="password" id="current-password" required 
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                   focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                            placeholder="Enter current password">
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">New Password</label>
                        <input type="password" id="new-password" required minlength="8"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                   focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                            placeholder="Enter new password">
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 8 characters</p>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Confirm New Password</label>
                        <input type="password" id="confirm-password" required 
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                   focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                            placeholder="Confirm new password">
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" onclick="closeChangePasswordModal()" 
                            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                            Cancel
                        </button>
                        <button type="submit" 
                            style="background-color: #2563eb; color: white;"
                            class="px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            onmouseover="this.style.backgroundColor='#1d4ed8'" 
                            onmouseout="this.style.backgroundColor='#2563eb'">
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    if (modal) {
        modal.remove();
    }
}

async function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
    
    try {
        const response = await apiCall('/settings/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        if (response.success) {
            showToast('Password changed successfully!', 'success');
            closeChangePasswordModal();
        } else {
            showToast(response.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        showToast(error.message || 'Failed to change password', 'error');
    }
}

function createDeleteAccountModal() {
    const modalHTML = `
        <div id="delete-account-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-red-600 dark:text-red-400">Delete Account</h3>
                    <button onclick="closeDeleteAccountModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
                        <div class="flex">
                            <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-400 mr-3 mt-1"></i>
                            <div class="text-sm text-red-800 dark:text-red-200">
                                <p class="font-semibold mb-2 text-red-900 dark:text-red-100">This action cannot be undone!</p>
                                <p class="text-red-800 dark:text-red-200">Deleting your account will permanently remove:</p>
                                <ul class="list-disc list-inside mt-2 space-y-1 text-red-700 dark:text-red-300">
                                    <li>Your profile and personal information</li>
                                    <li>Assessment results and skill data</li>
                                    <li>Job applications and history</li>
                                    <li>All uploaded files and documents</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <form id="delete-account-form" onsubmit="handleDeleteAccount(event)">
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                Confirm your password to delete your account:
                            </label>
                            <input type="password" id="delete-password" required 
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                       focus:outline-none focus:border-red-500 dark:bg-gray-700 dark:text-white" 
                                placeholder="Enter your password">
                        </div>
                        
                        <div class="flex justify-end space-x-3">
                            <button type="button" onclick="closeDeleteAccountModal()" 
                                class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                Cancel
                            </button>
                            <button type="submit" 
                                style="background-color: #dc2626; color: white;"
                                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
                                onmouseover="this.style.backgroundColor='#b91c1c'" 
                                onmouseout="this.style.backgroundColor='#dc2626'">
                                <span class="loading hidden mr-2">
                                    <i class="fas fa-spinner fa-spin"></i>
                                </span>
                                <span id="delete-submit-text">Delete Account</span>
                            </button>
                        </div>
                    </form>
                </div>
                
                <div id="delete-message" class="mt-4"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('delete-account-modal').classList.remove('hidden');
}

function closeDeleteAccountModal() {
    const modal = document.getElementById('delete-account-modal');
    if (modal) {
        modal.classList.add('hidden');
        // Clear form
        const form = document.getElementById('delete-account-form');
        if (form) {
            form.reset();
        }
        // Clear message
        const messageDiv = document.getElementById('delete-message');
        if (messageDiv) {
            messageDiv.innerHTML = '';
        }
    }
}

async function handleDeleteAccount(event) {
    event.preventDefault();

    // Additional confirmation dialog
    const confirmed = confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.');
    if (!confirmed) return;

    const form = document.getElementById('delete-account-form');
    const loading = form.querySelector('.loading');
    const submitText = document.getElementById('delete-submit-text');
    const messageDiv = document.getElementById('delete-message');
    const password = document.getElementById('delete-password').value;

    // Show loading
    loading.classList.remove('hidden');
    submitText.textContent = 'Deleting...';
    messageDiv.innerHTML = '';

    try {
        const endpoint = currentUser.role === 'student' ? '/students/account' : '/companies/account';
        await apiCall(endpoint, {
            method: 'DELETE',
            body: JSON.stringify({ confirmPassword: password })
        });

        // Account deleted successfully
        showToast('Account deleted successfully. We\'re sorry to see you go.', 'success');

        // Clear session storage and redirect
        setTimeout(() => {
            sessionStorage.clear();
            window.location.reload();
        }, 2000);

    } catch (error) {
        messageDiv.innerHTML = `<div class="text-red-500 text-sm mt-2">${error.message}</div>`;
    } finally {
        // Hide loading
        loading.classList.add('hidden');
        submitText.textContent = 'Delete Account';
    }
}

// Retake Request Functions
function showRetakeRequestModal() {
    const modal = document.getElementById('retake-modal');
    if (!modal) {
        createRetakeRequestModal();
    } else {
        modal.classList.remove('hidden');
    }
}

function createRetakeRequestModal() {
    const modalHTML = `
        <div id="retake-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">Request Assessment Retake</h3>
                    <button onclick="closeRetakeModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="retake-form" onsubmit="handleRetakeRequest(event)">
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                            Assessment ID:
                        </label>
                        <input type="text" id="retake-assessment-id" required 
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                   focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white" 
                            placeholder="Enter assessment ID">
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                            Reason for retake request:
                        </label>
                        <textarea id="retake-reason" required rows="4" minlength="10"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                   focus:outline-none focus:border-[#56AE67] dark:bg-gray-700 dark:text-white" 
                            placeholder="Please explain why you need to retake this assessment (minimum 10 characters)"></textarea>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 10 characters required</p>
                    </div>
                    
                    <div class="flex justify-end space-x-3">
                        <button type="button" onclick="closeRetakeModal()" 
                            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                            Cancel
                        </button>
                        <button type="submit" 
                            class="px-4 py-2 bg-[#56AE67] text-white rounded-lg hover:bg-[#3d8b4f] transition flex items-center">
                            <span class="loading hidden mr-2">
                                <i class="fas fa-spinner fa-spin"></i>
                            </span>
                            <span id="retake-submit-text">Submit Request</span>
                        </button>
                    </div>
                </form>
                
                <div id="retake-message" class="mt-4"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('retake-modal').classList.remove('hidden');
}

function closeRetakeModal() {
    const modal = document.getElementById('retake-modal');
    if (modal) {
        modal.classList.add('hidden');
        // Clear form
        const form = document.getElementById('retake-form');
        if (form) {
            form.reset();
        }
        // Clear message
        const messageDiv = document.getElementById('retake-message');
        if (messageDiv) {
            messageDiv.innerHTML = '';
        }
    }
}

async function handleRetakeRequest(event) {
    event.preventDefault();
    
    const form = document.getElementById('retake-form');
    const loading = form.querySelector('.loading');
    const submitText = document.getElementById('retake-submit-text');
    const messageDiv = document.getElementById('retake-message');
    const assessmentId = document.getElementById('retake-assessment-id').value;
    const reason = document.getElementById('retake-reason').value;
    
    // Show loading
    loading.classList.remove('hidden');
    submitText.textContent = 'Submitting...';
    messageDiv.innerHTML = '';
    
    try {
        await apiCall('/students/retake-request', {
            method: 'POST',
            body: JSON.stringify({ 
                assessmentId: assessmentId.trim(),
                reason: reason.trim()
            })
        });
        
        showToast('Retake request submitted successfully. You will be notified when it is reviewed.', 'success');
        closeRetakeModal();
        
    } catch (error) {
        messageDiv.innerHTML = `<div class="text-red-500 text-sm mt-2">${error.message}</div>`;
    } finally {
        // Hide loading
        loading.classList.add('hidden');
        submitText.textContent = 'Submit Request';
    }
}



// Route to dashboard for students
async function goToDashboard() {
    if (!currentUser) return;

    if (currentUser.role === 'student') {
        showPage('student-dashboard');
        loadStudentDashboard();
    } else if (currentUser.role === 'company') {
        showPage('company-dashboard');
        loadCompanyDashboard();
    } else {
        // Fallback
        showLandingPage();
    }
}

// ------------------ Student Profile Modal ------------------
async function showStudentProfile() {
    const modal = document.getElementById('student-profile-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    try {
        const res = await apiCall('/students/profile');
        if (res.success) populateProfileForm(res.data);
    } catch (e) { console.error(e); }
}
function closeStudentProfileModal() {
    const modal = document.getElementById('student-profile-modal');
    if (modal) modal.classList.add('hidden');
}
function populateProfileForm(profile) {
    if (!profile) return;
    const form = document.getElementById('student-profile-form');
    form.firstName.value = profile.firstName || '';
    form.lastName.value = profile.lastName || '';
    if (profile.dateOfBirth) form.dateOfBirth.value = profile.dateOfBirth.substr(0,10);
    form.phone.value = profile.phone || '';
    form["address[street]"].value = profile.address?.street || '';
    form["address[city]"].value = profile.address?.city || '';
    form["address[state]"].value = profile.address?.state || '';
    form["address[zip]"].value = profile.address?.zip || '';
    form["education[school]"].value = profile.education?.school || '';
    form["education[degree]"].value = profile.education?.degree || '';
    form["education[year]"].value = profile.education?.year || '';
    form["portfolio[github]"].value = profile.portfolio?.github || '';
    form["portfolio[linkedin]"].value = profile.portfolio?.linkedin || '';
    form["portfolio[website]"].value = profile.portfolio?.website || '';
}
// Handle profile save
document.addEventListener('submit', async (e) => {
  if (e.target.id === 'student-profile-form') {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
      
      // Verify authToken is available
      if (!authToken) {
        // Try to get from sessionStorage as fallback
        const storedToken = sessionStorage.getItem('authToken');
        if (!storedToken) {
          throw new Error('Authentication token not found. Please log in again.');
        }
        authToken = storedToken;
      }
      
      console.log('Debug: authToken exists:', !!authToken);
      console.log('Debug: authToken starts with Bearer:', authToken.startsWith('Bearer'));
      console.log('Debug: currentUser:', currentUser);
      
      const formData = new FormData(form);
      const jsonBody = {
        firstName: formData.get('firstName') || undefined,
        lastName: formData.get('lastName') || undefined,
        dateOfBirth: formData.get('dateOfBirth') || undefined,
        phone: formData.get('phone') || undefined,
        address: {
          street: formData.get('address[street]') || undefined,
          city: formData.get('address[city]') || undefined,
          state: formData.get('address[state]') || undefined,
          zip: formData.get('address[zip]') || undefined,
        },
        education: {
          school: formData.get('education[school]') || undefined,
          degree: formData.get('education[degree]') || undefined,
          year: formData.get('education[year]') || undefined,
        },
        portfolio: {
          github: formData.get('portfolio[github]') || undefined,
          linkedin: formData.get('portfolio[linkedin]') || undefined,
          website: formData.get('portfolio[website]') || undefined,
        },
      };
      
      // Save profile data
      console.log('Debug: Saving profile data');
      const response = await apiCall('/students/profile', { 
        method: 'PUT', 
        body: JSON.stringify(jsonBody) 
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update profile');
      }
      
      console.log('Debug: Profile data saved, now uploading files');
      
      // Upload resume if provided
      const resumeFile = document.getElementById('resume-input')?.files[0];
      if (resumeFile) {
        console.log('Debug: Uploading resume:', resumeFile.name);
        const resumeFormData = new FormData();
        resumeFormData.append('resume', resumeFile);
        
        console.log('Debug: Resume upload headers - Authorization: Bearer ' + authToken.substring(0, 20) + '...');
        
        const resumeResponse = await fetch(API_BASE + '/students/upload-resume', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${authToken}` 
          },
          body: resumeFormData
        });
        
        console.log('Debug: Resume upload response status:', resumeResponse.status);
        
        if (!resumeResponse.ok) {
          let errorMessage = 'Failed to upload resume';
          try {
            const errorData = await resumeResponse.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If response is not JSON, use status text
            errorMessage = resumeResponse.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
      }
      
      // Upload avatar if provided
      const avatarFile = document.getElementById('avatar-input')?.files[0];
      if (avatarFile) {
        console.log('Debug: Uploading avatar:', avatarFile.name);
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', avatarFile);
        
        console.log('Debug: Avatar upload headers - Authorization: Bearer ' + authToken.substring(0, 20) + '...');
        
        const avatarResponse = await fetch(API_BASE + '/students/upload-avatar', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${authToken}` 
          },
          body: avatarFormData
        });
        
        console.log('Debug: Avatar upload response status:', avatarResponse.status);
        
        if (!avatarResponse.ok) {
          let errorMessage = 'Failed to upload avatar';
          try {
            const errorData = await avatarResponse.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If response is not JSON, use status text
            errorMessage = avatarResponse.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
      }
      
      showToast('Profile updated successfully!', 'success');
      closeStudentProfileModal();
      loadStudentDashboard();
      
    } catch (err) {
      console.error('Profile save error:', err);
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      // Restore button state
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
});

// Password validation function for student registration
function validatePassword(password) {
    const errors = [];
    
    // Check minimum length (8 characters)
    if (password.length < 8) {
        errors.push('⚠️ Password must be at least 8 characters long');
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push('⚠️ Password must contain at least one uppercase letter');
    }
    
    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('⚠️ Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>?)');
    }
    
    return errors;
}

// Toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('password-toggle-icon');
    
    if (passwordInput && toggleIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }
}

// Fixed authentication function
async function handleAuth(event, role, mode) {
    event.preventDefault();
    
    const form = document.getElementById('auth-form');
    const loading = form.querySelector('.loading');
    const submitText = document.getElementById('submit-text');
    const messageDiv = document.getElementById('auth-message');
    const isRegister = mode === 'register';
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    let bodyData = {
        email,
        password,
        role
    };
    
    // Add additional fields for student registration
    if (isRegister && role === 'student') {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const studentId = document.getElementById('studentId').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const street = document.getElementById('street').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const zip = document.getElementById('zip').value.trim();

        if (!firstName || !lastName || !studentId || !phone || !street || !city || !state || !zip) {
            messageDiv.innerHTML = `<div class="text-red-500 text-sm">Please fill in all fields</div>`;
            return;
        }

        bodyData.firstName = firstName;
        bodyData.lastName = lastName;
        bodyData.studentId = studentId;
        bodyData.phone = phone;
        bodyData.address = {
            street: street,
            city: city,
            state: state,
            zip: zip
        };
    }

    // Add additional fields for company registration
    if (isRegister && role === 'company') {
        const employeeName = document.getElementById('employeeName').value.trim();
        const companyName = document.getElementById('companyName').value.trim();
        const companyAddress = document.getElementById('companyAddress').value.trim();
        const companyEmail = document.getElementById('companyEmail').value.trim();
        const companyNumber = document.getElementById('companyNumber').value.trim();
        const yearOfRegistration = document.getElementById('yearOfRegistration').value.trim();

        if (!employeeName || !companyName || !companyAddress || !companyEmail || !companyNumber || !yearOfRegistration) {
            messageDiv.innerHTML = `<div class="text-red-500 text-sm">Please fill in all fields</div>`;
            return;
        }

        bodyData.employeeName = employeeName;
        bodyData.companyName = companyName;
        bodyData.companyAddress = companyAddress;
        bodyData.companyEmail = companyEmail;
        bodyData.companyNumber = companyNumber;
        bodyData.yearOfRegistration = parseInt(yearOfRegistration);
    }
    
    // Basic validation
    if (!email || !password) {
        messageDiv.innerHTML = `<div class="text-red-500 text-sm">Please fill in all fields</div>`;
        return;
    }
    
    // Enhanced password validation for student registration
    if (isRegister && role === 'student') {
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            messageDiv.innerHTML = `<div class="text-red-500 text-sm">${passwordErrors.join('<br>')}</div>`;
            return;
        }
    } else {
        // Basic validation for login and company registration
        if (password.length < 6) {
            messageDiv.innerHTML = `<div class="text-red-500 text-sm">Password must be at least 6 characters</div>`;
            return;
        }
    }
    
    // Clear previous messages
    messageDiv.innerHTML = '';
    
    // Show loading
    loading.classList.remove('hidden');
    submitText.textContent = isRegister ? 'Registering...' : 'Logging in...';
    form.querySelector('button[type="submit"]').disabled = true;
    
    try {
        const endpoint = isRegister ? '/auth/register' : '/auth/login';
        const data = await apiCall(endpoint, {
            method: 'POST',
            body: JSON.stringify(bodyData),
        });
        
        // Clear any previous session data first
        sessionStorage.clear();
        
        // Store auth data in sessionStorage (tab-specific)
        authToken = data.token;
        currentUser = data.user;
        sessionStorage.setItem('authToken', authToken);
        sessionStorage.setItem('userData', JSON.stringify(currentUser));
        
        // Close modal
        closeModal();
        updateNavigation();
        
        // Handle post-authentication flow
        showToast(isRegister ? 'Registration successful!' : 'Login successful!', 'success');
        showDashboard();
        
    } catch (error) {
        console.error('Authentication error:', error);
        messageDiv.innerHTML = `<div class="text-red-500 text-sm">${error.message}</div>`;
    } finally {
        // Hide loading
        loading.classList.add('hidden');
        submitText.textContent = isRegister ? 'Register' : 'Login';
        form.querySelector('button[type="submit"]').disabled = false;
    }
}

// Handle student registration form (separate modal)
async function handleStudentRegistration(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('reg-message');
    const loading = form.querySelector('.loading');
    const submitText = document.getElementById('reg-submit-text');

    try {
        // Show loading state
        loading.classList.remove('hidden');
        submitText.textContent = 'Registering...';
        submitBtn.disabled = true;
        messageDiv.innerHTML = '';

        // Collect form data
        const formData = new FormData(form);
        const bodyData = {
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value,
            role: 'student', // Always student for this form
            studentId: document.getElementById('reg-student-id').value,
            phone: document.getElementById('reg-phone').value,
            firstName: 'Student', // Temporary - will be updated in profile
            lastName: 'User', // Temporary - will be updated in profile
            address: {
                street: document.getElementById('reg-street').value,
                city: document.getElementById('reg-city').value,
                state: document.getElementById('reg-state').value,
                zip: document.getElementById('reg-zip').value
            }
        };

        console.log('Student registration data:', bodyData);

        // Call registration API
        const data = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(bodyData),
        });
        
        // Store auth data in sessionStorage (tab-specific)
        authToken = data.token;
        currentUser = data.user;
        sessionStorage.setItem('authToken', authToken);
        sessionStorage.setItem('userData', JSON.stringify(currentUser));
        
        // Close modal and show success
        closeStudentRegistrationModal();
        updateNavigation();
        showToast('Registration successful! Welcome to IT OJT SkillMatch!', 'success');
        
        // Redirect to dashboard or assessment
        showDashboard();
        
    } catch (error) {
        console.error('Student registration error:', error);
        messageDiv.innerHTML = `<div class="text-red-500 text-sm text-center p-3 bg-red-50 rounded-lg">${error.message}</div>`;
    } finally {
        // Hide loading
        loading.classList.add('hidden');
        submitText.textContent = 'Register';
        submitBtn.disabled = false;
    }
}

// ------------------ Company Profile Modal ------------------
async function showCompanyProfile() {
    const modal = document.getElementById('company-profile-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    try {
        const res = await apiCall('/companies/profile');
        if (res.success) populateCompanyProfileForm(res.data);
    } catch (e) { console.error(e); }
}

function closeCompanyProfileModal() {
    const modal = document.getElementById('company-profile-modal');
    if (modal) modal.classList.add('hidden');
}

function populateCompanyProfileForm(profile) {
    if (!profile) return;
    const form = document.getElementById('company-profile-form');
    form.employeeName.value = profile.employeeName || '';
    form.companyName.value = profile.companyName || '';
    form.companyAddress.value = profile.companyAddress || '';
    form.companyEmail.value = profile.companyEmail || '';
    form.companyNumber.value = profile.companyNumber || '';
    form.yearOfRegistration.value = profile.yearOfRegistration || '';
}

// ------------------ Job Application Functions ------------------
async function applyForJob(jobId, customAssessmentData = null) {
    if (!currentUser || currentUser.role !== 'student') {
        showToast('Only students can apply for jobs', 'error');
        return;
    }

    try {
        console.log('Applying for job:', jobId);
        
        // Use the stored assessment submission ID if available
        const assessmentData = customAssessmentData || 
            (window.currentAssessmentSubmissionId ? { customAssessmentSubmissionId: window.currentAssessmentSubmissionId } : null);
        
        const body = assessmentData ? JSON.stringify(assessmentData) : undefined;
        
        const response = await apiCall(`/jobs/${jobId}/apply`, {
            method: 'POST',
            body
        });

        console.log('Application response:', response);
        showToast('Application submitted successfully!', 'success');
        
        // Clear the stored assessment submission ID
        window.currentAssessmentSubmissionId = null;
        
        // Close the job details modal
        closeJobDetailsModal();
        
        // Refresh job listings or dashboard
        if (typeof loadStudentDashboard === 'function') {
            loadStudentDashboard();
        }
    } catch (error) {
        console.error('Error applying for job:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response,
            status: error.status
        });
        
        // Show more specific error message
        const errorMessage = error.message || 'Failed to apply for job. Please try again.';
        showToast(errorMessage, 'error');
    }
}

// Wrapper function to check for custom assessment before applying
async function initiateJobApplication(jobId) {
    try {
        // Fetch job details to check if custom assessment is required
        const jobResponse = await apiCall(`/jobs/${jobId}`);
        
        // Handle both { data: job } and direct job response
        const job = jobResponse.data || jobResponse;
        
        console.log('Job details for application:', job);
        console.log('Requires assessment:', job.requireCustomAssessment);
        console.log('Has custom assessment:', job.customAssessment);
        
        if (job.requireCustomAssessment && job.customAssessment) {
            console.log('Starting custom assessment for job:', jobId);
            // Take custom assessment first
            takeCustomAssessment(jobId, (assessmentResult) => {
                console.log('Assessment result:', assessmentResult);
                if (assessmentResult && assessmentResult.success) {
                    // Pass assessment data to job application
                    applyForJob(jobId, { 
                        customAssessmentSubmissionId: assessmentResult.submissionId 
                    });
                } else {
                    showToast('Please complete the assessment to apply for this job', 'warning');
                }
            });
        } else {
            console.log('No custom assessment required, applying directly');
            // No custom assessment required, apply directly
            applyForJob(jobId);
        }
    } catch (error) {
        console.error('Error initiating job application:', error);
        console.error('Error details:', error);
        showToast('Error loading job details: ' + error.message, 'error');
    }
}

// Helper function to check if student has completed assessment for a job
async function checkAssessmentStatus(jobId) {
    try {
        if (!currentUser || currentUser.role !== 'student') {
            return { completed: false, passed: false };
        }
        
        const response = await apiCall(`/custom-assessments/student-status/${jobId}`);
        return response.data || { completed: false, passed: false };
    } catch (error) {
        console.log('No assessment status found for job:', jobId);
        return { completed: false, passed: false };
    }
}

// Helper function to get assessment button text and styling
function getAssessmentButtonInfo(hasAssessment, assessmentStatus) {
    if (!hasAssessment) {
        return {
            text: 'View Details & Apply',
            class: 'bg-[#56AE67] text-white px-4 py-2 rounded-lg hover:bg-[#3d8b4f] transition',
            icon: ''
        };
    }
    
    if (assessmentStatus.completed && assessmentStatus.passed) {
        return {
            text: 'Assessment Passed - Apply Now',
            class: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition',
            icon: '<i class="fas fa-check mr-1"></i>'
        };
    } else if (assessmentStatus.completed && !assessmentStatus.passed) {
        return {
            text: 'Assessment Failed - Retake Required',
            class: 'bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition',
            icon: '<i class="fas fa-redo mr-1"></i>'
        };
    } else {
        return {
            text: 'Take Assessment Required',
            class: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition',
            icon: '<i class="fas fa-clipboard-list mr-1"></i>'
        };
    }
}

async function showAllJobs() {
    try {
        // Use job-matches API if user is a student for personalized recommendations
        const isStudent = currentUser && currentUser.role === 'student';
        const endpoint = isStudent ? '/students/job-matches' : '/jobs';
        const response = await apiCall(endpoint);
        const data = response.data || [];
        
        console.log('Jobs data received:', { isStudent, endpoint, dataLength: data.length, firstItem: data[0] });
        
        // Extract jobs from response (job-matches returns {job, matchScore, ...}, jobs API returns job objects directly)
        let jobsWithMatches;
        if (isStudent) {
            // Student API returns array of {job, matchScore, matchedSkills, ...}
            jobsWithMatches = data;
        } else {
            // Jobs API returns array of job objects directly
            jobsWithMatches = data.map(j => ({job: j, matchScore: 0}));
        }

        // Create modal if it doesn't exist
        let modal = document.getElementById('all-jobs-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'all-jobs-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 hidden';
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            <i class="fas fa-briefcase mr-2 text-[#56AE67]"></i>${isStudent ? 'Recommended Jobs For You' : 'All Available Jobs'}
                        </h2>
                        <button onclick="closeAllJobsModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                    ${isStudent ? `
                        <div class="px-6 py-3 bg-gradient-to-r from-[#56AE67]/10 to-[#3d8b4f]/10 border-b border-gray-200 dark:border-gray-700">
                            <p class="text-sm text-gray-700 dark:text-gray-300">
                                <i class="fas fa-magic mr-2 text-[#56AE67]"></i>
                                Jobs are ranked based on your assessment results and skill proficiency
                            </p>
                        </div>
                    ` : ''}
                    <div class="p-6 overflow-y-auto flex-1 scrollbar-custom" id="all-jobs-container" style="max-height: calc(90vh - 100px);">
                        <div class="flex items-center justify-center py-8">
                            <i class="fas fa-spinner fa-spin text-[#56AE67] text-3xl"></i>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Add click outside to close
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeAllJobsModal();
                }
            });
        }

        // Show the modal
        modal.classList.remove('hidden');

        const jobsContainer = document.getElementById('all-jobs-container');
        if (!jobsContainer) return;

        if (jobsWithMatches.length === 0) {
            jobsContainer.innerHTML = `
                <div class="text-center py-16">
                    <i class="fas fa-briefcase text-gray-300 dark:text-gray-600 text-6xl mb-4"></i>
                    <p class="text-gray-500 dark:text-gray-400 text-lg">No jobs available at the moment.</p>
                    <p class="text-gray-400 dark:text-gray-500 text-sm mt-2">${isStudent ? 'Complete your assessment to get personalized job recommendations!' : 'Check back later for new opportunities!'}</p>
                </div>
            `;
            return;
        }

        // Show loading state
        jobsContainer.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <i class="fas fa-spinner fa-spin text-[#56AE67] text-3xl"></i>
            </div>
        `;

        // Create job cards with match scores
        const jobCards = await Promise.all(jobsWithMatches.map(async jobData => {
            const job = jobData.job || jobData;
            const matchScore = jobData.matchScore || 0;
            const matchedSkills = jobData.matchedSkills || [];
            const assessmentInfluenced = jobData.assessmentInfluenced || false;
            
            // Check if job has assessment using enhanced detection - normalize boolean
            const hasAssessment = (job.requireCustomAssessment === true || job.requireCustomAssessment === 'true') || (job.customAssessment != null && job.customAssessment !== '');
            
            // Check assessment status for students
            let assessmentStatus = { completed: false, passed: false };
            if (hasAssessment && currentUser && currentUser.role === 'student') {
                assessmentStatus = await checkAssessmentStatus(job._id);
            }
            
            const buttonInfo = getAssessmentButtonInfo(hasAssessment, assessmentStatus);
            
            // Match score color
            const getMatchScoreColor = (score) => {
                if (score >= 80) return 'bg-green-500';
                if (score >= 60) return 'bg-blue-500';
                if (score >= 40) return 'bg-yellow-500';
                return 'bg-gray-400';
            };
            
            return `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
                    ${isStudent && matchScore > 0 ? `
                        <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex items-center space-x-3">
                                <div class="flex items-center space-x-2">
                                    <div class="relative w-16 h-16">
                                        <svg class="transform -rotate-90 w-16 h-16">
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="transparent" class="text-gray-200 dark:text-gray-700"/>
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="transparent" 
                                                class="${getMatchScoreColor(matchScore)}"
                                                stroke-dasharray="${2 * Math.PI * 28}"
                                                stroke-dashoffset="${2 * Math.PI * 28 * (1 - matchScore / 100)}"
                                                stroke-linecap="round"/>
                                        </svg>
                                        <div class="absolute inset-0 flex items-center justify-center">
                                            <span class="text-sm font-bold text-gray-900 dark:text-white">${matchScore}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p class="text-sm font-semibold text-gray-900 dark:text-white">Match Score</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">
                                            ${matchScore >= 80 ? 'Excellent Match!' : matchScore >= 60 ? 'Good Match' : matchScore >= 40 ? 'Fair Match' : 'Low Match'}
                                        </p>
                                    </div>
                                </div>
                                ${assessmentInfluenced ? `
                                    <span class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded-full font-medium">
                                        <i class="fas fa-star mr-1"></i>Based on Assessment
                                    </span>
                                ` : ''}
                            </div>
                            ${matchedSkills.length > 0 ? `
                                <div class="text-xs text-gray-600 dark:text-gray-400">
                                    <i class="fas fa-check-circle text-green-500 mr-1"></i>
                                    ${matchedSkills.length} skill${matchedSkills.length > 1 ? 's' : ''} matched
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">${job.title}</h3>
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-building text-gray-400"></i>
                                <p class="text-gray-600 dark:text-gray-300">${job.company?.companyName || job.companyName}</p>
                            </div>
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-map-marker-alt text-gray-400"></i>
                                <p class="text-sm text-gray-500 dark:text-gray-400">${job.location?.city || job.location} ${job.location?.remote ? '(Remote)' : ''}</p>
                            </div>
                            <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">${job.description}</p>
                        </div>
                        <div class="text-right ml-4">
                            <p class="text-lg font-bold text-green-600 dark:text-green-400">${job.salary ? formatSalary(job.salary) : 'Competitive'}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${job.jobType || job.type}</p>
                        </div>
                    </div>
                    <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3">
                            <span>
                                <i class="far fa-calendar mr-1"></i>
                                Posted ${formatDate(job.createdAt)}
                            </span>
                            ${hasAssessment ? `
                                <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                                    <i class="fas fa-clipboard-list mr-1"></i>Assessment Required
                                </span>
                                ${assessmentStatus.completed ? `
                                    <span class="px-2 py-1 ${assessmentStatus.passed ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'} text-xs rounded">
                                        ${assessmentStatus.passed ? '<i class="fas fa-check mr-1"></i>Passed' : '<i class="fas fa-times mr-1"></i>Failed'}
                                    </span>
                                ` : ''}
                            ` : ''}
                        </div>
                        <div class="space-x-2">
                            ${currentUser && currentUser.role === 'student' ? `
                                ${hasAssessment && !assessmentStatus.completed ? `
                                    <button onclick="takeCustomAssessmentForJob('${job._id}')" class="${buttonInfo.class}">
                                        ${buttonInfo.icon}${buttonInfo.text}
                                    </button>
                                ` : `
                                    <button onclick="viewJob('${job._id}')" class="${buttonInfo.class}">
                                        ${buttonInfo.icon}${buttonInfo.text}
                                    </button>
                                `}
                            ` : `
                                <button onclick="viewJob('${job._id}')" class="bg-[#56AE67] text-white px-4 py-2 rounded-lg hover:bg-[#3d8b4f] transition">
                                    View Details
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }));

        jobsContainer.innerHTML = jobCards.join('');

    } catch (error) {
        console.error('Error loading jobs:', error);
        showToast('Failed to load jobs. Please try again.', 'error');
        
        // Show error in modal if it exists
        const jobsContainer = document.getElementById('all-jobs-container');
        if (jobsContainer) {
            jobsContainer.innerHTML = `
                <div class="text-center py-16">
                    <i class="fas fa-exclamation-circle text-red-500 text-6xl mb-4"></i>
                    <p class="text-gray-700 dark:text-gray-300 text-lg mb-2">Failed to load jobs</p>
                    <p class="text-gray-500 dark:text-gray-400 text-sm">${error.message}</p>
                    <button onclick="showAllJobs()" class="mt-4 bg-[#56AE67] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition font-bold text-lg">
                        <i class="fas fa-redo mr-2"></i>Try Again
                    </button>
                </div>
            `;
        }
    }
}

function closeAllJobsModal() {
    const modal = document.getElementById('all-jobs-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function showAllApplications() {
    if (!currentUser || currentUser.role !== 'student') {
        showToast('Only students can view applications', 'error');
        return;
    }

    try {
        const response = await apiCall('/students/applications');
        const applications = response.data || [];

        const applicationsContainer = document.getElementById('applications-list');
        if (!applicationsContainer) return;

        if (applications.length === 0) {
            applicationsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">No applications found.</p>';
            return;
        }

        applicationsContainer.innerHTML = applications.map(app => `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">${app.job.title}</h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-2">${app.job.companyName}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">${app.job.location}</p>
                        <div class="flex items-center space-x-4 text-sm">
                            <span class="px-2 py-1 rounded-full ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
                                ${capitalizeFirst(app.status)}
                            </span>
                            <span class="text-gray-500 dark:text-gray-400">Applied ${formatDate(app.appliedAt)}</span>
                        </div>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        Salary: ${formatSalary(app.job.salary)}
                    </div>
                    <div class="space-x-2">
                        <button onclick="viewJob('${app.job._id}')" class="bg-[#56AE67] text-white px-4 py-2 rounded-lg hover:bg-[#3d8b4f] transition">
                            View Job
                        </button>
                        ${app.status === 'pending' ? `
                            <button onclick="withdrawApplication('${app._id}')" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                                Withdraw
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading applications:', error);
        showToast('Failed to load applications. Please try again.', 'error');
    }
}

async function viewJob(jobId) {
    try {
        console.log('viewJob function called with jobId:', jobId);
        alert('viewJob called for job: ' + jobId);
        
        const response = await apiCall(`/jobs/${jobId}`);
        const job = response.data || response;
        
        console.log('=== JOB DETAILS DEBUG ===');
        console.log('Full job object:', job);
        console.log('job.requireCustomAssessment value:', job.requireCustomAssessment);
        console.log('job.requireCustomAssessment type:', typeof job.requireCustomAssessment);
        console.log('job.requireCustomAssessment === true:', job.requireCustomAssessment === true);
        console.log('job.requireCustomAssessment === "true":', job.requireCustomAssessment === 'true');
        console.log('job.customAssessment:', job.customAssessment);
        console.log('currentUser?.role:', currentUser?.role);
        console.log('Assessment condition result:', (job.requireCustomAssessment === true || job.requireCustomAssessment === 'true'));
        console.log('========================');

        // Normalize boolean value - handle string "true"/"false" from database
        const hasRequiredAssessment = job.requireCustomAssessment === true || job.requireCustomAssessment === 'true';
        const hasAssessmentId = job.customAssessment != null && job.customAssessment !== '';
        
        console.log('Normalized hasRequiredAssessment:', hasRequiredAssessment);
        console.log('Normalized hasAssessmentId:', hasAssessmentId);

        // Create or update job details modal
        let modal = document.getElementById('job-details-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'job-details-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Job Details</h2>
                            <button onclick="closeJobDetailsModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <div id="job-details-content"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const content = document.getElementById('job-details-content');
        content.innerHTML = `
            <div class="space-y-6">
                <div>
                    <h3 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">${job.title}</h3>
                    <p class="text-xl text-gray-600 dark:text-gray-300 mb-4">${job.companyName}</p>
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Location</p>
                            <p class="font-medium text-gray-900 dark:text-white">${job.location}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Salary</p>
                            <p class="font-medium text-gray-900 dark:text-white">${formatSalary(job.salary)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Job Type</p>
                            <p class="font-medium text-gray-900 dark:text-white">${job.type}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Posted</p>
                            <p class="font-medium text-gray-900 dark:text-white">${formatDate(job.createdAt)}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Job Description</h4>
                    <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${job.description}</p>
                </div>

                ${job.requirements ? `
                    <div>
                        <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Requirements</h4>
                        <ul class="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                            ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${job.benefits ? `
                    <div>
                        <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Benefits</h4>
                        <ul class="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                            ${job.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${hasRequiredAssessment || hasAssessmentId ? `
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <div class="flex items-center justify-center h-12 w-12 rounded-full bg-white bg-opacity-30">
                                    <i class="fas fa-clipboard-list text-2xl"></i>
                                </div>
                            </div>
                            <div class="ml-4 flex-1">
                                <h4 class="text-xl font-bold mb-2">
                                    <i class="fas fa-exclamation-circle mr-2"></i>Assessment Required
                                </h4>
                                <p class="text-sm leading-relaxed mb-3 text-blue-50">
                                    This job requires you to complete a custom assessment to demonstrate your skills. 
                                    Click "Take Assessment" below to start the assessment.
                                </p>
                                <div class="flex items-center space-x-4 text-sm">
                                    <div class="flex items-center">
                                        <i class="fas fa-clock mr-2"></i>
                                        <span>Timed Assessment</span>
                                    </div>
                                    <div class="flex items-center">
                                        <i class="fas fa-check-circle mr-2"></i>
                                        <span>Auto-graded</span>
                                    </div>
                                    <div class="flex items-center">
                                        <i class="fas fa-arrow-right mr-2"></i>
                                        <span>Click button below to start</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button onclick="closeJobDetailsModal()" class="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition">
                        Close
                    </button>
                    ${currentUser && currentUser.role === 'student' ? `
                        ${(hasRequiredAssessment || hasAssessmentId) ? `
                            <button onclick="takeCustomAssessmentForJob('${job._id}')" id="take-assessment-btn-${job._id}"
                                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                                <i class="fas fa-clipboard-list mr-2"></i>Take Assessment
                            </button>
                            <button onclick="applyForJob('${job._id}')" id="apply-btn-${job._id}"
                                class="px-6 py-3 bg-gray-400 text-white rounded-lg font-bold text-lg cursor-not-allowed opacity-50" disabled>
                                <i class="fas fa-lock mr-2"></i>Complete Assessment First
                            </button>
                        ` : `
                            <button onclick="applyForJob('${job._id}')" 
                                class="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                                <i class="fas fa-paper-plane mr-2"></i>Apply for this Job
                            </button>
                        `}
                    ` : ''}
                </div>
            </div>
        `;

        modal.classList.remove('hidden');

    } catch (error) {
        console.error('Error loading job details:', error);
        showToast('Failed to load job details. Please try again.', 'error');
    }
}

function closeJobDetailsModal() {
    const modal = document.getElementById('job-details-modal');
    if (modal) modal.classList.add('hidden');
}

// Store assessment submission ID globally
window.currentAssessmentSubmissionId = null;

async function takeCustomAssessmentForJob(jobId) {
    console.log('takeCustomAssessmentForJob called with jobId:', jobId);
    try {
        showToast('Loading assessment...', 'info');
        
        // Close the All Jobs modal if it's open
        closeAllJobsModal();
        
        // Fetch the custom assessment for this job
        console.log('Fetching assessment from API:', `/custom-assessments/job/${jobId}`);
        const assessment = await apiCall(`/custom-assessments/job/${jobId}`);
        console.log('Assessment API response:', assessment);
        
        if (!assessment || !assessment._id) {
            console.error('No assessment found - assessment object:', assessment);
            showToast('No assessment found for this job', 'error');
            return;
        }

        // Show the assessment modal with a callback to enable the apply button
        showCustomAssessmentModal(assessment, jobId, async (result) => {
            console.log('Assessment callback received:', result);
            
            if (result && result.success && result.submissionId) {
                // Store the submission ID
                window.currentAssessmentSubmissionId = result.submissionId;
                console.log('Stored assessment submission ID:', window.currentAssessmentSubmissionId);
                
                showToast('Assessment completed! Loading job details...', 'success');
                
                // Wait a moment then open the job details modal with apply button enabled
                setTimeout(async () => {
                    await viewJob(jobId);
                    
                    // Enable the apply button in the job details modal
                    const applyBtn = document.getElementById(`apply-btn-${jobId}`);
                    const takeAssessmentBtn = document.getElementById(`take-assessment-btn-${jobId}`);
                    
                    if (applyBtn) {
                        applyBtn.disabled = false;
                        applyBtn.classList.remove('bg-gray-400', 'cursor-not-allowed', 'opacity-50');
                        applyBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                        applyBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Apply for this Job';
                        console.log('Apply button enabled');
                    }
                    
                    if (takeAssessmentBtn) {
                        takeAssessmentBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                        takeAssessmentBtn.classList.add('bg-green-600', 'opacity-50', 'cursor-not-allowed');
                        takeAssessmentBtn.disabled = true;
                        takeAssessmentBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Assessment Completed';
                        console.log('Take Assessment button updated to completed state');
                    }
                }, 500);
            } else {
                showToast('Please complete the assessment to apply for this job', 'warning');
            }
        });
    } catch (error) {
        console.error('Error loading assessment:', error);
        showToast('Error loading assessment: ' + error.message, 'error');
    }
}

async function withdrawApplication(applicationId) {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await apiCall(`/applications/${applicationId}/withdraw`, {
            method: 'POST'
        });

        if (response.success) {
            showToast('Application withdrawn successfully', 'success');
            // Refresh applications list
            showAllApplications();
        } else {
            showToast(response.message || 'Failed to withdraw application', 'error');
        }

    } catch (error) {
        console.error('Error withdrawing application:', error);
        showToast('Failed to withdraw application. Please try again.', 'error');
    }
}

window.validateAPIConfiguration = window.validateAPIConfiguration || function () {
    console.warn('validateAPIConfiguration() fallback active.');
    return true;
};
window.apiCall = window.apiCall || (async function () {
    throw new Error('apiCall() fallback: helpers.js missing. Ensure js/helpers.js is served at /js/helpers.js');
});

window.loadPlatformStats = window.loadPlatformStats || function () { /* no-op */ };
window.loadAssessmentSection = window.loadAssessmentSection || function () {
    if (typeof startAssessment === 'function') return startAssessment();
    if (typeof showAssessmentPage === 'function') return showAssessmentPage();
    if (typeof showToast === 'function') showToast('Assessment not available', 'warning');
};
window.currentPage = currentPage;

// Dark Mode Toggle Function
function toggleDarkMode() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    
    // Update toggle button icon
    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (toggleBtn) {
        const moonIcon = toggleBtn.querySelector('.fa-moon');
        const sunIcon = toggleBtn.querySelector('.fa-sun');
        if (moonIcon && sunIcon) {
            if (isDark) {
                moonIcon.classList.add('hidden');
                moonIcon.classList.remove('dark:hidden');
                sunIcon.classList.remove('hidden');
                sunIcon.classList.add('dark:inline');
            } else {
                moonIcon.classList.remove('hidden');
                moonIcon.classList.add('dark:hidden');
                sunIcon.classList.add('hidden');
                sunIcon.classList.remove('dark:inline');
            }
        }
    }
    
    console.log('Dark mode:', isDark ? 'enabled' : 'disabled');
}

// Initialize dark mode preference on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        document.documentElement.classList.add('dark');
    }
});






