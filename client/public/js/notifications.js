// Notification Manager
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.listeners = [];
        this.pollInterval = null;
    }

    // Start polling for notifications
    startPolling(intervalMs = 10000) {
        this.fetchNotifications();
        this.pollInterval = setInterval(() => {
            this.fetchNotifications();
        }, intervalMs);
    }

    // Stop polling
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    // Fetch notifications from server
    async fetchNotifications() {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch('/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch notifications');

            const data = await response.json();
            if (data.success) {
                this.notifications = data.data;
                this.unreadCount = data.unreadCount;
                this.notifyListeners();
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to mark notification as read');

            const data = await response.json();
            if (data.success) {
                await this.fetchNotifications();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    // Mark all as read
    async markAllAsRead() {
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await fetch('/api/notifications/read-all', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to mark all as read');

            const data = await response.json();
            if (data.success) {
                await this.fetchNotifications();
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    // Delete notification
    async deleteNotification(notificationId) {
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete notification');

            const data = await response.json();
            if (data.success) {
                await this.fetchNotifications();
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }

    // Subscribe to notification updates
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(callback => {
            callback({
                notifications: this.notifications,
                unreadCount: this.unreadCount
            });
        });
    }

    // Get notification icon based on type
    getNotificationIcon(type) {
        const icons = {
            'password_reset': 'fa-key',
            'password_change_approved': 'fa-check-circle',
            'password_change_rejected': 'fa-times-circle',
            'application_submitted': 'fa-paper-plane',
            'application_received': 'fa-file-alt',
            'application_status': 'fa-clipboard-check',
            'new_application': 'fa-user-plus',
            'assessment_reminder': 'fa-clock',
            'job_posted': 'fa-briefcase',
            'feedback_received': 'fa-comment',
            'feedback_response': 'fa-comment-dots',
            'new_message': 'fa-envelope',
            'retake_approved': 'fa-redo',
            'retake_rejected': 'fa-ban',
            'system': 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    }

    // Get notification color based on type
    getNotificationColor(type) {
        const colors = {
            'password_change_approved': 'text-green-600',
            'password_change_rejected': 'text-red-600',
            'application_received': 'text-blue-600',
            'application_status': 'text-indigo-600',
            'assessment_reminder': 'text-yellow-600',
            'job_posted': 'text-purple-600',
            'feedback_received': 'text-teal-600',
            'retake_approved': 'text-green-600',
            'retake_rejected': 'text-red-600',
            'system': 'text-gray-600'
        };
        return colors[type] || 'text-gray-600';
    }

    // Format time ago
    timeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
            }
        }
        
        return 'Just now';
    }
}

// Create global instance
window.notificationManager = new NotificationManager();

// Load and initialize notification bell component
function loadNotificationBell(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container with ID "${containerId}" not found`);
        return;
    }

    console.log(`Loading notification bell for container: ${containerId}`);

    // Load the component HTML
    fetch('/components/notification-bell.html')
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load notification-bell.html: ${response.status}`);
            return response.text();
        })
        .then(html => {
            container.innerHTML = html;
            console.log(`Notification bell HTML loaded into ${containerId}`);
            initializeNotificationBell();
        })
        .catch(error => {
            console.error('Error loading notification bell:', error);
            // Fallback: create a simple bell button
            container.innerHTML = `
                <button id="notification-button" class="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none transition-colors duration-200" aria-label="Notifications" type="button">
                    <i class="fas fa-bell text-lg md:text-xl"></i>
                    <span id="notification-badge" class="hidden absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">0</span>
                </button>
                <div id="notification-panel" class="hidden absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50" style="max-height: 600px; overflow-y: auto;">
                    <div class="p-8 text-center"><p class="text-gray-600 dark:text-gray-400">Failed to load notifications</p></div>
                </div>
            `;
            initializeNotificationBell();
        });
}

// Initialize notification bell functionality
function initializeNotificationBell() {
    const notificationButton = document.getElementById('notification-button');
    const notificationPanel = document.getElementById('notification-panel');
    const notificationsList = document.getElementById('notifications-list');
    const notificationsEmpty = document.getElementById('notifications-empty');
    const notificationBadge = document.getElementById('notification-badge');
    const markAllReadBtn = document.getElementById('mark-all-read-btn');
    const clearReadBtn = document.getElementById('clear-read-btn');

    if (!notificationButton) {
        console.warn('Notification button element not found');
        return;
    }

    console.log('Initializing notification bell with elements:', {
        button: !!notificationButton,
        panel: !!notificationPanel,
        list: !!notificationsList,
        empty: !!notificationsEmpty,
        badge: !!notificationBadge,
        markAllReadBtn: !!markAllReadBtn,
        clearReadBtn: !!clearReadBtn
    });

    // Toggle dropdown on bell click
    notificationButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (notificationPanel) {
            notificationPanel.classList.toggle('hidden');
            console.log('Panel toggled, now hidden:', notificationPanel.classList.contains('hidden'));
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (notificationPanel && !e.target.closest('.notification-container') && !e.target.closest('#notification-button')) {
            notificationPanel.classList.add('hidden');
        }
    });

    // Mark all as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            if (window.notificationManager) {
                await window.notificationManager.markAllAsRead();
            }
        });
    }

    // Clear read notifications
    if (clearReadBtn) {
        clearReadBtn.addEventListener('click', async () => {
            if (window.notificationManager) {
                // Delete all read notifications
                const readNotifications = window.notificationManager.notifications.filter(n => n.read);
                for (const notif of readNotifications) {
                    await window.notificationManager.deleteNotification(notif._id);
                }
            }
        });
    }

    // Subscribe to notification updates
    if (window.notificationManager) {
        window.notificationManager.subscribe((data) => {
            updateNotificationBell(data);
        });

        // Start polling for notifications
        window.notificationManager.startPolling(10000);

        // Initial fetch
        window.notificationManager.fetchNotifications();
    } else {
        console.warn('NotificationManager not found on window');
    }
}

// Update notification bell UI
function updateNotificationBell(data) {
    const notificationsList = document.getElementById('notifications-list');
    const notificationsEmpty = document.getElementById('notifications-empty');
    const notificationBadge = document.getElementById('notification-badge');

    if (!notificationsList) {
        console.warn('Notifications list element not found');
        return;
    }

    console.log('Updating notification bell with data:', {
        notificationsCount: data.notifications?.length || 0,
        unreadCount: data.unreadCount || 0
    });

    // Update badge
    if (notificationBadge) {
        if (data.unreadCount > 0) {
            notificationBadge.textContent = Math.min(data.unreadCount, 99) + (data.unreadCount > 99 ? '+' : '');
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    }

    // Clear previous notifications
    notificationsList.innerHTML = '';

    if (!data.notifications || data.notifications.length === 0) {
        if (notificationsEmpty) {
            notificationsEmpty.classList.remove('hidden');
        }
        return;
    }

    if (notificationsEmpty) {
        notificationsEmpty.classList.add('hidden');
    }

    // Render notifications
    data.notifications.forEach(notification => {
        const notifEl = createNotificationElement(notification);
        notificationsList.appendChild(notifEl);
    });
}

// Create notification element
function createNotificationElement(notification) {
    const div = document.createElement('div');
    const unreadClass = !notification.read ? 'notification-item unread' : 'notification-item';
    div.className = `${unreadClass} p-4 cursor-pointer relative`;
    div.dataset.notificationId = notification._id;

    const icon = window.notificationManager.getNotificationIcon(notification.type);
    const color = window.notificationManager.getNotificationColor(notification.type);
    const timeAgo = window.notificationManager.timeAgo(notification.createdAt);

    div.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex items-start space-x-3 flex-1">
                <i class="fas ${icon} ${color} mt-1 flex-shrink-0 text-lg"></i>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                        ${notification.title}
                        ${!notification.read ? '<span class="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>' : ''}
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${notification.message}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">${timeAgo}</p>
                </div>
            </div>
            <button 
                class="text-gray-400 dark:text-gray-600 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0 ml-2"
                type="button"
                aria-label="Delete notification"
            >
                <i class="fas fa-times text-sm"></i>
            </button>
        </div>
    `;

    // Mark as read on click
    div.addEventListener('click', async (e) => {
        if (!e.target.closest('button')) {
            await window.notificationManager.markAsRead(notification._id);
        }
    });

    // Delete button handler
    const deleteBtn = div.querySelector('button');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await window.notificationManager.deleteNotification(notification._id);
        });
    }

    return div;
}

// Delete single notification
async function deleteNotification(notificationId) {
    if (window.notificationManager) {
        await window.notificationManager.deleteNotification(notificationId);
    }
}

// Fetch and update notifications (for use after loading notification bell)
async function fetchAndUpdateNotifications() {
    if (window.notificationManager) {
        console.log('Fetching notifications...');
        await window.notificationManager.fetchNotifications();
        // Start polling if not already started
        if (!window.notificationManager.pollInterval) {
            window.notificationManager.startPolling(10000);
        }
    }
}

// Make function available globally
if (typeof window !== 'undefined') {
    window.fetchAndUpdateNotifications = window.fetchAndUpdateNotifications || fetchAndUpdateNotifications;
    window.initializeNotificationBell = window.initializeNotificationBell || initializeNotificationBell;
}

