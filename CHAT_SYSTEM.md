# Chat System Documentation

## Overview
The chat system enables real-time messaging between students, companies, and administrators on the IT OJT Platform.

## Features
- ✅ **Real-time messaging** between users
- ✅ **Conversation management** - direct messages and support chats
- ✅ **Message history** - persistent storage and retrieval
- ✅ **Unread indicators** - track unread messages per conversation
- ✅ **Notifications** - get notified when receiving new messages
- ✅ **Responsive design** - works on desktop and mobile
- ✅ **Auto-polling** - messages refresh automatically
- ✅ **Search** - find conversations quickly
- ✅ **Dark mode** support

## Access the Chat

### Standalone Page
Navigate to: **`https://your-domain.com/messages.html`**

### Dashboard Integration (Coming Soon)
The chat system is ready to be integrated into the main dashboard by adding a "Messages" tab.

## User Roles & Permissions

### Students Can:
- Message companies they've applied to
- Contact administrators for support
- View message history

### Companies Can:
- Message students who applied to their jobs
- Contact administrators for support
- View message history

### Administrators Can:
- Message anyone (students and companies)
- Provide support to all users
- Monitor conversations

## How It Works

### Starting a Conversation
1. Click the **+ icon** in the messages page
2. Select a user from the dropdown
3. Click "Start Conversation"
4. The conversation opens automatically

### Sending Messages
1. Type your message in the input box
2. Press **Enter** to send (or click Send button)
3. Use **Shift + Enter** for new lines
4. Messages appear instantly in the chat

### Managing Conversations
- Click any conversation in the sidebar to open it
- Unread messages show a red badge with count
- Messages are automatically marked as read when opened
- Search conversations using the search box

## API Endpoints

### Get Conversations
```
GET /api/messages/conversations
```
Returns all conversations for the logged-in user.

### Create/Get Conversation
```
POST /api/messages/conversations
Body: { participantId, type, subject }
```
Creates a new conversation or returns existing one.

### Get Messages
```
GET /api/messages/conversations/:id/messages
Query: ?limit=50&before=2024-01-01
```
Returns messages in a conversation with pagination support.

### Send Message
```
POST /api/messages/conversations/:id/messages
Body: { content }
```
Sends a new message in the conversation.

### Mark as Read
```
PUT /api/messages/conversations/:id/read
```
Marks all unread messages in a conversation as read.

### Get Unread Count
```
GET /api/messages/unread-count
```
Returns total unread message count for the user.

## Database Models

### Conversation Model
- `participants`: Array of User IDs
- `type`: 'direct' or 'support'
- `lastMessage`: Reference to last message
- `lastMessageAt`: Timestamp
- `unreadCount`: Map of user IDs to counts
- `archived`: Boolean flag

### Message Model
- `conversation`: Reference to Conversation
- `sender`: Reference to User
- `content`: Message text (max 2000 chars)
- `read`: Boolean flag
- `readAt`: Timestamp
- `deleted`: Soft delete flag
- `createdAt`: Timestamp

## Customization

### Colors
The chat system uses the brand color `#56AE67`. To customize:
- Edit `/css/chat.css`
- Update color variables

### Polling Intervals
- Conversations: 30 seconds
- Messages: 5 seconds (when conversation is open)
- To change: Edit `chat.js` intervals

### Message Limits
- Character limit: 2000 per message
- Message history: 50 per load
- To change: Edit API routes and models

## Integration with Dashboard

To add chat to your dashboard:

```javascript
// In dashboard.js, add a Messages tab:

function showMessages() {
    contentArea.innerHTML = `
        <div class="chat-container">
            <!-- Copy HTML from messages.html -->
        </div>
    `;
    
    // Initialize chat
    window.chatManager.init();
}
```

Or simply add a link to `/messages.html` in your navigation.

## Troubleshooting

### Messages not sending
- Check authentication token is valid
- Verify participant exists in conversation
- Check network tab for API errors

### Messages not updating
- Ensure polling is active
- Check browser console for errors
- Verify WebSocket/polling connection

### Unread counts incorrect
- Call `/api/messages/conversations/:id/read` when opening chat
- Refresh conversation list periodically

## Future Enhancements

Potential features to add:
- [ ] File attachments/images
- [ ] Message reactions/emojis
- [ ] Voice messages
- [ ] Video chat integration
- [ ] Message editing/deletion
- [ ] Group conversations
- [ ] WebSocket for true real-time (instead of polling)
- [ ] Push notifications
- [ ] Message search within conversations
- [ ] Conversation archiving

## Security Considerations

- ✅ All endpoints protected with authentication middleware
- ✅ Users can only access their own conversations
- ✅ Message content is escaped to prevent XSS
- ✅ Rate limiting recommended for production
- ✅ Input validation on all endpoints

## Support

For issues or questions about the chat system:
1. Check the browser console for errors
2. Verify authentication is working
3. Check Render logs for server errors
4. Review API responses in Network tab

---

**Built with:** MongoDB, Express.js, Vanilla JavaScript
**Styling:** Tailwind CSS + Custom CSS
**Icons:** Font Awesome 6.0
