// helpers.js - Utility functions for the IT OJT Platform

// API Base URL
// Expose API_BASE as a window property to avoid duplicate top-level const declarations
if (typeof window !== 'undefined') {
    window.API_BASE = window.API_BASE || '/api';
}

// Validate API Configuration
function validateAPIConfiguration() {
    try {
        // Check if API_BASE is defined
        if (!API_BASE) {
            console.error('API_BASE is not defined');
            return false;
        }

        // Check if fetch is available
        if (!window.fetch) {
            console.error('Fetch API is not available');
            return false;
        }

        console.log('API configuration validated successfully');
        return true;
    } catch (error) {
        console.error('Error validating API configuration:', error);
        return false;
    }
}

// API Call Helper Function
async function apiCall(endpoint, options = {}) {
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    // Get auth token from sessionStorage if available
    const authToken = sessionStorage.getItem('authToken');
    if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        // If body is FormData, let the browser set the Content-Type (including boundary)
        if (config.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        const API_BASE = window.API_BASE || '/api';
        const fullUrl = API_BASE + endpoint;
        console.log('API Request:', { url: fullUrl, method: config.method || 'GET', hasBody: !!config.body });
        
        const response = await fetch(fullUrl, config);

        console.log('API Response:', { status: response.status, statusText: response.statusText, ok: response.ok });

        // Try to parse JSON safely
        let text = null;
        try {
            text = await response.text();
        } catch (e) {
            // ignore
        }

        let data = null;
        if (text) {
            try {
                data = JSON.parse(text);
            } catch (e) {
                // non-JSON response
                data = null;
                
            }
        }

        if (!response.ok) {
            // Handle validation errors array from express-validator
            let message = 'API call failed';
            if (data && data.errors && Array.isArray(data.errors)) {
                message = data.errors.map(err => err.msg || err.message).join('; ');
                console.error('Validation errors:', data.errors);
            } else if (data && data.message) {
                message = data.message;
                console.error('API error message:', data.message);
            } else {
                message = response.statusText || 'API call failed';
            }
            console.error('Full error response:', data);
            const err = new Error(message);
            err.status = response.status;
            err.response = data;
            throw err;
        }

        // Return response as-is from server (server provides envelope: { success, token, user, data, message })
        if (!data) {
            throw new Error('Empty response from server');
        }

        // If success is explicitly false, throw error
        if (data.success === false) {
            throw new Error(data.message || 'API call failed');
        }

        return data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Load Platform Stats
async function loadPlatformStats() {
    try {
        const response = await apiCall('/stats');
        const stats = response.data || {};

        // Update stats in the DOM (guard for missing elements)
        const elJobs = document.getElementById('total-jobs');
        const elCompanies = document.getElementById('total-companies');
        const elApplications = document.getElementById('total-applications');
        if (elJobs) elJobs.textContent = stats.totalJobs || '-';
        if (elCompanies) elCompanies.textContent = stats.totalCompanies || '-';
        if (elApplications) elApplications.textContent = stats.totalApplications || '-';

        console.log('Platform stats loaded successfully');
    } catch (error) {
        console.error('Error loading platform stats:', error);
        // Set defaults if API fails
        document.getElementById('total-jobs').textContent = '-';
        document.getElementById('total-companies').textContent = '-';
        document.getElementById('total-applications').textContent = '-';
    }
}

// Load Assessment Section
function loadAssessmentSection() {
    // This function can be expanded to load assessment-related content
    console.log('Assessment section loaded');
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');

    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-green-500'
    }[type] || 'bg-green-500';

    toast.className = `${bgColor} text-white px-6 py-3 rounded-lg mb-2 shadow-lg transform translate-x-full transition-transform duration-300`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Slide in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);

    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

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

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format Salary
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

// Capitalize First Letter
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Export functions for potential module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateAPIConfiguration,
        apiCall,
        loadPlatformStats,
        loadAssessmentSection,
        showToast,
        isTokenExpired,
        formatDate,
        formatSalary,
        capitalizeFirst,
        loadNotificationBell
    };
}

// Load notification bell component
async function loadNotificationBell(containerId) {
    try {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('Notification bell container not found:', containerId);
            return;
        }

        console.log('Loading notification bell for container:', containerId);
        
        const response = await fetch('/components/notification-bell.html');
        if (!response.ok) throw new Error('Failed to load notification bell');
        
        const html = await response.text();
        container.innerHTML = html;
        console.log('Notification bell HTML loaded into', containerId);
        
        // Initialize the notification bell after a brief delay
        setTimeout(() => {
            console.log('Initializing notification bell functionality');
            if (typeof window.initializeNotificationBell === 'function') {
                window.initializeNotificationBell();
                console.log('Notification bell initialized');
            }
            if (typeof window.fetchAndUpdateNotifications === 'function') {
                window.fetchAndUpdateNotifications();
                console.log('Notifications fetched');
            }
        }, 200);
        
    } catch (error) {
        console.error('Error loading notification bell:', error);
    }
}

// Also attach to window for browser global access when loaded as a <script>
if (typeof window !== 'undefined') {
    window.validateAPIConfiguration = window.validateAPIConfiguration || validateAPIConfiguration;
    window.apiCall = window.apiCall || apiCall;
    window.loadPlatformStats = window.loadPlatformStats || loadPlatformStats;
    window.loadAssessmentSection = window.loadAssessmentSection || loadAssessmentSection;
    window.showToast = window.showToast || showToast;
    window.isTokenExpired = window.isTokenExpired || isTokenExpired;
    window.formatDate = window.formatDate || formatDate;
    window.formatSalary = window.formatSalary || formatSalary;
    window.capitalizeFirst = window.capitalizeFirst || capitalizeFirst;
    window.loadNotificationBell = window.loadNotificationBell || loadNotificationBell;
}
