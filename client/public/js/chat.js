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
                const currentId = this.currentConversation?._id?.toString();
                this.conversations = response.data;
                
                // Preserve current conversation reference with updated data
                if (currentId) {
                    this.currentConversation = this.conversations.find(c => 
                        (c._id?.toString() || c._id) === currentId
                    );
                    console.log('Preserved current conversation after reload:', this.currentConversation?._id);
                }
                
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
        console.log('=== SELECT CONVERSATION START ===');
        console.log('Selecting conversation ID:', conversationId, 'Type:', typeof conversationId);
        console.log('Available conversations:', this.conversations.map(c => ({ 
            id: c._id, 
            idType: typeof c._id,
            email: c.otherParticipant?.email 
        })));
        
        // Try to find with both string and object comparison
        this.currentConversation = this.conversations.find(c => {
            const cId = c._id?.toString() || c._id;
            const searchId = conversationId?.toString() || conversationId;
            return cId === searchId;
        });
        
        if (!this.currentConversation) {
            console.error('Conversation not found with ID:', conversationId);
            console.log('Reloading conversations...');
            
            // Try to reload conversations and find it
            await this.loadConversations();
            
            this.currentConversation = this.conversations.find(c => {
                const cId = c._id?.toString() || c._id;
                const searchId = conversationId?.toString() || conversationId;
                return cId === searchId;
            });
            
            if (!this.currentConversation) {
                console.error('Still cannot find conversation after reload');
                console.log('All conversation IDs:', this.conversations.map(c => c._id));
                alert('Could not load conversation. Please refresh the page and try again.');
                return;
            }
        }

        console.log('✓ Current conversation set successfully:', {
            id: this.currentConversation._id,
            otherUser: this.currentConversation.otherParticipant?.email
        });

        // Show mobile chat view on mobile devices
        this.showMobileChat();

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
            const itemId = item.dataset.conversationId?.toString();
            const currId = conversationId?.toString();
            item.classList.toggle('active', itemId === currId);
        });
        
        console.log('=== SELECT CONVERSATION END ===');
    }

    async loadMessages(conversationId, before = null) {
        try {
            const url = before 
                ? `/messages/conversations/${conversationId}/messages?before=${before}`
                : `/messages/conversations/${conversationId}/messages`;
                
            const response = await apiCall(url);
            if (response.success) {
                // Filter out messages with null/undefined sender
                const validMessages = response.data.filter(msg => {
                    if (!msg.sender || !msg.sender._id) {
                        console.warn('Skipping message with missing sender:', msg._id);
                        return false;
                    }
                    return true;
                });
                
                if (before) {
                    this.messages = [...validMessages, ...this.messages];
                } else {
                    this.messages = validMessages;
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
        console.log('=== SEND MESSAGE START ===');
        console.log('Content:', content?.substring(0, 50));
        console.log('Current conversation:', this.currentConversation);
        
        if (!this.currentConversation) {
            console.error('❌ No conversation selected');
            alert('Please click on a conversation from the list first, then try sending again.');
            return;
        }
        
        if (!content || !content.trim()) {
            console.error('❌ Empty message');
            return;
        }

        try {
            const conversationId = this.currentConversation._id;
            if (!conversationId) {
                console.error('❌ Current conversation missing _id:', this.currentConversation);
                alert('Invalid conversation. Please click the conversation again.');
                // Try to fix by reloading
                await this.loadConversations();
                return;
            }
            
            console.log('✓ Sending to conversation ID:', conversationId);
            const response = await apiCall(`/messages/conversations/${conversationId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ content: content.trim() })
            });
            
            console.log('✓ Message sent, response:', response);
            
            if (response.success) {
                // Validate that sender is populated
                if (!response.data.sender || !response.data.sender._id) {
                    console.error('❌ Received message without populated sender:', response.data);
                    alert('Error: Message was sent but sender information is missing. Please refresh the page.');
                    return;
                }
                
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
                
                console.log('=== SEND MESSAGE SUCCESS ===');
            } else {
                console.error('❌ Failed to send message:', response);
                alert('Failed to send message: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Error sending message:', error);
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
                    <button onclick="window.chatManager.deleteCurrentConversation()" class="text-red-500 hover:text-red-700 ml-4 text-sm flex items-center" title="Delete Conversation"><i class="fas fa-trash mr-1"></i>Delete</button>
                </div>
            `;
        }
    // Delete the current conversation
    async deleteCurrentConversation() {
        if (!this.currentConversation) return;
        if (!confirm('Delete this conversation and all its messages?')) return;
        const id = this.currentConversation._id;
        try {
            const response = await apiCall(`/messages/conversations/${id}`, { method: 'DELETE' });
            if (response.success) {
                // Remove from local conversations and reset view
                this.conversations = this.conversations.filter(c => c._id !== id);
                this.currentConversation = null;
                this.messages = [];
                this.updateConversationsList();
                this.updateChatView();
                showToast('Conversation deleted', 'success');
            } else {
                showToast(response.message || 'Failed to delete conversation', 'error');
            }
        } catch (error) {
            showToast('Error deleting conversation', 'error');
        }
    }

        this.updateMessagesView();
    }

    updateMessagesView() {
        const messagesContainer = document.getElementById('chat-messages-container');
        if (!messagesContainer) return;

        // Try both 'user' and 'userData' keys for compatibility
        let currentUser = sessionStorage.getItem('user');
        if (currentUser) {
            try {
                currentUser = JSON.parse(currentUser);
            } catch (e) {
                currentUser = null;
            }
        }
        
        // Fallback to userData if user is not found
        if (!currentUser) {
            const userData = sessionStorage.getItem('userData');
            if (userData) {
                try {
                    currentUser = JSON.parse(userData);
                } catch (e) {
                    console.error('Failed to parse userData:', e);
                }
            }
        }
        
        if (!currentUser || !currentUser._id) {
            console.error('Current user not found in session storage');
            console.log('Available session keys:', Object.keys(sessionStorage));
            messagesContainer.innerHTML = `
                <div class="chat-empty-state">
                    <i class="fas fa-exclamation-triangle text-6xl mb-4 text-yellow-500"></i>
                    <h3 class="text-xl font-semibold mb-2">Session Error</h3>
                    <p>Please <a href="/dashboard.html" class="text-[#56AE67] underline">return to dashboard</a> to refresh your session.</p>
                </div>
            `;
            return;
        }
        
        // Filter out invalid messages first
        const validMessages = this.messages.filter(msg => {
            if (!msg || !msg.sender || !msg.sender._id) {
                console.warn('Filtering out message with missing sender:', msg?._id);
                return false;
            }
            return true;
        });
        
        messagesContainer.innerHTML = validMessages.map(msg => {
            const isOwn = msg.sender._id === currentUser._id;
            const time = this.formatTime(msg.createdAt);
            return `
                <div class="chat-message ${isOwn ? 'own' : ''}" data-message-id="${msg._id}">
                    <div class="chat-message-avatar">
                        ${this.getInitials(msg.sender.email || 'Unknown')}
                    </div>
                    <div>
                        <div class="chat-message-content">
                            ${this.escapeHtml(msg.content)}
                            ${isOwn ? `<button class="chat-delete-btn text-xs text-red-500 ml-2" title="Delete" onclick="window.chatManager.deleteMessage('${msg._id}')"><i class='fas fa-trash'></i></button>` : ''}
                        </div>
                        <div class="chat-message-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');
        // Delete a message by ID
        async deleteMessage(messageId) {
            if (!confirm('Delete this message?')) return;
            try {
                const response = await apiCall(`/messages/${messageId}`, { method: 'DELETE' });
                if (response.success) {
                    // Remove from local messages and update view
                    this.messages = this.messages.filter(m => m._id !== messageId);
                    this.updateMessagesView();
                } else {
                    showToast(response.message || 'Failed to delete message', 'error');
                }
            } catch (error) {
                showToast('Error deleting message', 'error');
            }
        }
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
        // Use the global sanitize function if available, otherwise fallback
        if (typeof window.escapeHTML === 'function') {
            return window.escapeHTML(text).replace(/\n/g, '<br>');
        }
        
        // Fallback implementation
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
window.searchConversations = function() {
    const searchInput = document.getElementById('chat-search-input');
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const items = document.querySelectorAll('.chat-list-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}
