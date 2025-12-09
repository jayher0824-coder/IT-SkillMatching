// Chat System Manager
class ChatManager {
    constructor() {
        this.conversations = [];
        this.currentConversation = null;
        this.messages = [];
        this.pollingInterval = null;
        this.messagePollingInterval = null;
        this.unreadCount = 0;
    }

    async init() {
        await this.loadConversations();
        this.startPolling();
    }

    async loadConversations() {
        try {
            const response = await apiCall('/messages/conversations');
            if (response.success) {
                this.conversations = response.data;
                this.updateConversationsList();
                this.updateUnreadCount();
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    async createConversation(participantId, type = 'direct', subject = null) {
        try {
            const response = await apiCall('/messages/conversations', {
                method: 'POST',
                body: JSON.stringify({ participantId, type, subject })
            });
            
            if (response.success) {
                const conversation = response.data;
                const existingIndex = this.conversations.findIndex(c => c._id === conversation._id);
                if (existingIndex >= 0) {
                    this.conversations[existingIndex] = conversation;
                } else {
                    this.conversations.unshift(conversation);
                }
                this.updateConversationsList();
                await this.selectConversation(conversation._id);
                return conversation;
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            showToast('Failed to start conversation', 'error');
        }
    }

    async selectConversation(conversationId) {
        console.log('Selecting conversation:', conversationId);
        console.log('Available conversations:', this.conversations.map(c => c._id));
        
        this.currentConversation = this.conversations.find(c => c._id === conversationId);
        
        if (!this.currentConversation) {
            console.error('Conversation not found:', conversationId);
            // Try to reload conversations and find it
            await this.loadConversations();
            this.currentConversation = this.conversations.find(c => c._id === conversationId);
            
            if (!this.currentConversation) {
                console.error('Still cannot find conversation after reload');
                alert('Could not load conversation. Please try again.');
                return;
            }
        }

        console.log('Current conversation set:', this.currentConversation);

        // Load messages
        await this.loadMessages(conversationId);
        
        // Mark as read
        await this.markAsRead(conversationId);
        
        // Update UI
        this.updateChatView();
        
        // Start message polling
        this.startMessagePolling(conversationId);
        
        // Update active state in sidebar
        document.querySelectorAll('.chat-list-item').forEach(item => {
            item.classList.toggle('active', item.dataset.conversationId === conversationId);
        });
    }

    async loadMessages(conversationId, before = null) {
        try {
            const url = before 
                ? `/messages/conversations/${conversationId}/messages?before=${before}`
                : `/messages/conversations/${conversationId}/messages`;
                
            const response = await apiCall(url);
            if (response.success) {
                if (before) {
                    this.messages = [...response.data, ...this.messages];
                } else {
                    this.messages = response.data;
                }
                this.updateMessagesView();
                if (!before) {
                    this.scrollToBottom();
                }
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    async sendMessage(content) {
        console.log('sendMessage called with content:', content);
        console.log('Current conversation:', this.currentConversation);
        
        if (!this.currentConversation) {
            console.error('No conversation selected');
            alert('Please select a conversation first. Click on a conversation from the list.');
            return;
        }
        
        if (!content || !content.trim()) {
            console.error('Empty message');
            return;
        }

        try {
            const conversationId = this.currentConversation._id;
            if (!conversationId) {
                console.error('Current conversation has no _id:', this.currentConversation);
                alert('Invalid conversation. Please select again.');
                return;
            }
            
            console.log('Sending message to conversation:', conversationId);
            const response = await apiCall(`/messages/conversations/${conversationId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ content: content.trim() })
            });
            
            console.log('Message sent response:', response);
            
            if (response.success) {
                this.messages.push(response.data);
                this.updateMessagesView();
                this.scrollToBottom();
                
                // Update conversation list
                await this.loadConversations();
                
                // Clear input
                const input = document.getElementById('chat-message-input');
                if (input) {
                    input.value = '';
                    input.style.height = 'auto';
                }
            } else {
                console.error('Failed to send message:', response);
                alert('Failed to send message: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message: ' + error.message);
        }
    }

    async markAsRead(conversationId) {
        try {
            await apiCall(`/messages/conversations/${conversationId}/read`, {
                method: 'PUT'
            });
            
            // Update local conversation
            const conversation = this.conversations.find(c => c._id === conversationId);
            if (conversation) {
                conversation.unreadCount = 0;
                this.updateConversationsList();
                this.updateUnreadCount();
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }

    updateConversationsList() {
        const listContainer = document.getElementById('chat-conversations-list');
        if (!listContainer) return;

        if (this.conversations.length === 0) {
            listContainer.innerHTML = `
                <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-comments text-4xl mb-2"></i>
                    <p>No conversations yet</p>
                    <p class="text-sm mt-1">Start a new conversation</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = this.conversations.map(conv => {
            const other = conv.otherParticipant;
            const lastMessage = conv.lastMessage?.content || 'No messages yet';
            const lastMessageTime = conv.lastMessageAt ? this.formatTime(conv.lastMessageAt) : '';
            const unreadBadge = conv.unreadCount > 0 
                ? `<span class="unread-badge">${conv.unreadCount}</span>`
                : '';

            return `
                <div class="chat-list-item" data-conversation-id="${conv._id}" onclick="window.chatManager.selectConversation('${conv._id}')">
                    <div class="flex items-start justify-between">
                        <div class="flex items-start gap-3 flex-1 min-w-0">
                            <div class="chat-message-avatar">
                                ${this.getInitials(other?.email || 'User')}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1">
                                    <h4 class="font-semibold text-gray-900 dark:text-white truncate">
                                        ${other?.email || 'Unknown User'}
                                    </h4>
                                    ${unreadBadge}
                                </div>
                                <p class="text-sm text-gray-600 dark:text-gray-400 truncate">${lastMessage}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">${lastMessageTime}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateChatView() {
        const chatHeader = document.getElementById('chat-header');
        const messagesContainer = document.getElementById('chat-messages-container');
        const messageInput = document.getElementById('chat-message-input');
        const sendButton = document.querySelector('.chat-send-btn');
        
        if (!this.currentConversation) {
            if (chatHeader) chatHeader.innerHTML = '';
            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    <div class="chat-empty-state">
                        <i class="fas fa-comment-dots text-6xl mb-4 text-gray-300 dark:text-gray-600"></i>
                        <h3 class="text-xl font-semibold mb-2">Select a conversation</h3>
                        <p>Choose a conversation from the list to start messaging</p>
                    </div>
                `;
            }
            // Disable input when no conversation selected
            if (messageInput) {
                messageInput.disabled = true;
                messageInput.placeholder = 'Select a conversation to start messaging...';
            }
            if (sendButton) sendButton.disabled = true;
            return;
        }

        // Enable input when conversation is selected
        if (messageInput) {
            messageInput.disabled = false;
            messageInput.placeholder = 'Type a message...';
        }
        if (sendButton) sendButton.disabled = false;

        const other = this.currentConversation.otherParticipant;
        
        if (chatHeader) {
            chatHeader.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <button onclick="window.chatManager.showMobileSidebar()" class="md:hidden text-gray-600 dark:text-gray-400">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="chat-message-avatar">
                            ${this.getInitials(other?.email || 'User')}
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 dark:text-white">
                                ${other?.email || 'Unknown User'}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 capitalize">${other?.role || ''}</p>
                        </div>
                    </div>
                </div>
            `;
        }

        this.updateMessagesView();
    }

    updateMessagesView() {
        const messagesContainer = document.getElementById('chat-messages-container');
        if (!messagesContainer) return;

        const currentUser = JSON.parse(sessionStorage.getItem('user'));
        
        messagesContainer.innerHTML = this.messages.map(msg => {
            const isOwn = msg.sender._id === currentUser._id;
            const time = this.formatTime(msg.createdAt);
            
            return `
                <div class="chat-message ${isOwn ? 'own' : ''}">
                    <div class="chat-message-avatar">
                        ${this.getInitials(msg.sender.email)}
                    </div>
                    <div>
                        <div class="chat-message-content">
                            ${this.escapeHtml(msg.content)}
                        </div>
                        <div class="chat-message-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages-container');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    }

    startPolling() {
        // Poll conversations every 30 seconds
        this.pollingInterval = setInterval(() => {
            this.loadConversations();
        }, 30000);
    }

    startMessagePolling(conversationId) {
        // Clear existing interval
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
        }

        // Poll messages every 5 seconds
        this.messagePollingInterval = setInterval(() => {
            if (this.currentConversation && this.currentConversation._id === conversationId) {
                this.loadMessages(conversationId);
            }
        }, 5000);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
        }
    }

    updateUnreadCount() {
        this.unreadCount = this.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        
        // Update badge in UI
        const badge = document.getElementById('messages-unread-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    showMobileSidebar() {
        const sidebar = document.querySelector('.chat-sidebar');
        const main = document.querySelector('.chat-main');
        
        if (sidebar) sidebar.classList.add('mobile-show');
        if (main) main.classList.remove('mobile-show');
    }

    showMobileChat() {
        const sidebar = document.querySelector('.chat-sidebar');
        const main = document.querySelector('.chat-main');
        
        if (sidebar) sidebar.classList.remove('mobile-show');
        if (main) main.classList.add('mobile-show');
    }

    getInitials(email) {
        if (!email) return 'U';
        const parts = email.split('@')[0].split('.');
        if (parts.length > 1) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return email.substring(0, 2).toUpperCase();
    }

    formatTime(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        if (diff < 604800000) return d.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }
}

// Initialize chat manager
window.chatManager = new ChatManager();

// Auto-resize textarea
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Send message on Enter (Shift+Enter for new line)
function handleChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

// Send message function
async function sendChatMessage() {
    const input = document.getElementById('chat-message-input');
    if (!input) return;
    
    const content = input.value.trim();
    if (!content) return;
    
    await window.chatManager.sendMessage(content);
}

// Search conversations
function searchConversations() {
    const searchInput = document.getElementById('chat-search-input');
    const searchTerm = searchInput?.value.toLowerCase() || '';
    
    const items = document.querySelectorAll('.chat-list-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}
