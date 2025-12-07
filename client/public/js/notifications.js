// Notification Manager
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.listeners = [];
        this.pollInterval = null;
    }

    // Start polling for notifications
    startPolling(intervalMs = 30000) {
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
            const token = localStorage.getItem('token');
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
            const token = localStorage.getItem('token');
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
            const token = localStorage.getItem('token');
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
            const token = localStorage.getItem('token');
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
            'application_received': 'fa-file-alt',
            'application_status': 'fa-clipboard-check',
            'assessment_reminder': 'fa-clock',
            'job_posted': 'fa-briefcase',
            'feedback_received': 'fa-comment',
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
