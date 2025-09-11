/**
 * Chat Page JavaScript
 * Handles real-time chat functionality and UI interactions
 */

class ChatPage {
    constructor() {
        this.currentUser = null;
        this.currentRoom = 'public';
        this.messages = new Map();
        this.users = new Map();
        this.typingUsers = new Set();
        this.typingTimeout = null;
        this.isConnected = false;
        
        this.init();
    }

    async init() {
        try {
            // Check authentication
            if (!this.checkAuthentication()) {
                return;
            }

            // Initialize UI components
            this.setupUI();
            
            // Connect to WebSocket
            await this.connectToChat();
            
            // Load initial data
            await this.loadInitialData();
            
        } catch (error) {
            console.error('Chat initialization error:', error);
            window.showError('Failed to initialize chat. Please refresh the page.');
        }
    }

    /**
     * Check user authentication
     */
    checkAuthentication() {
        if (!window.authStorage || !window.authStorage.isAuthenticated()) {
            window.showError('Please log in to access the chat.');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return false;
        }

        this.currentUser = window.authStorage.getUser();
        if (!this.currentUser || !this.currentUser.username) {
            window.showError('Invalid user session. Please log in again.');
            window.authStorage.logout();
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return false;
        }

        return true;
    }

    /**
     * Setup UI components and event listeners
     */
    setupUI() {
        this.setupHeader();
        this.setupSidebar();
        this.setupMessageInput();
        this.setupScrollHandling();
        this.setupModals();
        this.setupKeyboardShortcuts();
    }

    /**
     * Setup chat header
     */
    setupHeader() {
        // Update current username
        const usernameElement = document.getElementById('currentUsername');
        if (usernameElement && this.currentUser) {
            usernameElement.textContent = this.currentUser.username;
        }

        // Setup sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('chatSidebar');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && 
                    !sidebar.contains(e.target) && 
                    !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            });
        }

        // Setup user menu
        this.setupUserMenu();
    }

    /**
     * Setup user menu
     */
    setupUserMenu() {
        const userMenuToggle = document.getElementById('userMenuToggle');
        const userMenuDropdown = document.getElementById('userMenuDropdown');
        const userMenu = userMenuToggle?.closest('.user-menu');

        if (userMenuToggle && userMenuDropdown) {
            userMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.classList.toggle('active');
            });

            // Close menu when clicking outside
            document.addEventListener('click', () => {
                userMenu.classList.remove('active');
            });

            // Menu item handlers
            document.getElementById('profileBtn')?.addEventListener('click', () => {
                this.showProfileModal();
            });

            document.getElementById('settingsBtn')?.addEventListener('click', () => {
                this.showSettingsModal();
            });

            document.getElementById('logoutBtn')?.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    /**
     * Setup sidebar functionality
     */
    setupSidebar() {
        // Room switching
        const roomItems = document.querySelectorAll('.room-item');
        roomItems.forEach(item => {
            item.addEventListener('click', () => {
                const roomName = item.dataset.room;
                if (roomName && roomName !== this.currentRoom) {
                    this.switchRoom(roomName);
                }
            });
        });
    }

    /**
     * Setup message input and form
     */
    setupMessageInput() {
        const messageForm = document.getElementById('messageForm');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');

        if (messageForm && messageInput) {
            // Handle form submission
            messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage();
            });

            // Handle typing indicators
            let typingTimer;
            messageInput.addEventListener('input', () => {
                if (!this.isConnected) return;

                // Send typing indicator
                window.wsUtils.sendTyping(true);
                
                // Clear previous timer
                clearTimeout(typingTimer);
                
                // Stop typing after 2 seconds of inactivity
                typingTimer = setTimeout(() => {
                    window.wsUtils.sendTyping(false);
                }, 2000);
            });

            // Update send button state
            messageInput.addEventListener('input', () => {
                const hasContent = messageInput.value.trim().length > 0;
                sendBtn.disabled = !hasContent || !this.isConnected;
            });

            // Handle enter key (send on Enter, new line on Shift+Enter)
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Emoji button (placeholder)
        const emojiBtn = document.getElementById('emojiBtn');
        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => {
                // Placeholder for emoji picker
                window.showInfo('Emoji picker coming soon! 😊');
            });
        }
    }

    /**
     * Setup scroll handling
     */
    setupScrollHandling() {
        const messagesContainer = document.getElementById('messagesContainer');
        const messagesList = document.getElementById('messagesList');
        const scrollToBottom = document.getElementById('scrollToBottom');

        if (messagesContainer && messagesList && scrollToBottom) {
            // Show/hide scroll to bottom button
            messagesList.addEventListener('scroll', () => {
                const { scrollTop, scrollHeight, clientHeight } = messagesList;
                const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
                
                scrollToBottom.classList.toggle('visible', !isNearBottom);
            });

            // Scroll to bottom button click
            scrollToBottom.addEventListener('click', () => {
                this.scrollToBottom(true);
            });
        }
    }

    /**
     * Setup modals
     */
    setupModals() {
        // Profile modal is handled by the modal manager
        // Additional modal setup can be added here
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: Focus message input
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const messageInput = document.getElementById('messageInput');
                if (messageInput) {
                    messageInput.focus();
                }
            }

            // Escape: Close sidebar on mobile
            if (e.key === 'Escape') {
                const sidebar = document.getElementById('chatSidebar');
                if (sidebar && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    /**
     * Connect to WebSocket chat
     */
    async connectToChat() {
        try {
            window.showLoading('Connecting to chat...');
            
            // Setup WebSocket event handlers
            this.setupWebSocketHandlers();
            
            // Initialize WebSocket connection
            const connected = await window.wsUtils.initializeChat(this.currentUser.username);
            
            if (connected) {
                this.isConnected = true;
                this.updateConnectionStatus('connected');
                window.showSuccess('Connected to chat!', { duration: 2000 });
            } else {
                throw new Error('Failed to connect to chat server');
            }
            
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.isConnected = false;
            this.updateConnectionStatus('disconnected');
            window.showError('Failed to connect to chat. Please refresh the page.');
        } finally {
            window.hideLoading();
        }
    }

    /**
     * Setup WebSocket event handlers
     */
    setupWebSocketHandlers() {
        // Handle incoming messages
        window.addEventListener('chatMessage', (e) => {
            const { message, type } = e.detail;
            this.handleIncomingMessage(message, type);
        });

        // Handle user updates
        window.addEventListener('userUpdate', (e) => {
            const userData = e.detail;
            this.handleUserUpdate(userData);
        });

        // Handle connection status changes
        window.wsManager.onConnect = () => {
            this.isConnected = true;
            this.updateConnectionStatus('connected');
        };

        window.wsManager.onDisconnect = () => {
            this.isConnected = false;
            this.updateConnectionStatus('disconnected');
        };

        window.wsManager.onError = () => {
            this.isConnected = false;
            this.updateConnectionStatus('error');
        };
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            // Load recent messages
            await this.loadMessages(this.currentRoom);
            
            // Load online users
            await this.loadOnlineUsers();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            window.showWarning('Some data could not be loaded. Chat functionality may be limited.');
        }
    }

    /**
     * Load messages for current room
     */
    async loadMessages(roomName) {
        try {
            const messages = await window.api.getRoomMessages(roomName);
            
            // Clear existing messages
            this.messages.set(roomName, messages);
            
            // Render messages
            this.renderMessages(messages);
            
            // Scroll to bottom
            setTimeout(() => this.scrollToBottom(), 100);
            
        } catch (error) {
            console.error('Error loading messages:', error);
            window.showError('Failed to load chat history.');
        }
    }

    /**
     * Load online users
     */
    async loadOnlineUsers() {
        try {
            const users = await window.api.getOnlineUsers();
            
            // Update users map
            this.users.clear();
            users.forEach(user => {
                this.users.set(user.username, user);
            });
            
            // Render users list
            this.renderUsersList(users);
            
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    /**
     * Send message
     */
    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput || !this.isConnected) return;

        const content = messageInput.value.trim();
        if (!content) return;

        // Validate message length
        if (content.length > 1000) {
            window.showError('Message is too long. Maximum 1000 characters.');
            return;
        }

        try {
            // Send message via WebSocket
            window.wsUtils.sendMessage(content);
            
            // Clear input
            messageInput.value = '';
            
            // Update send button state
            const sendBtn = document.getElementById('sendBtn');
            if (sendBtn) {
                sendBtn.disabled = true;
            }
            
            // Stop typing indicator
            window.wsUtils.sendTyping(false);
            
        } catch (error) {
            console.error('Error sending message:', error);
            window.showError('Failed to send message. Please try again.');
        }
    }

        return messageDiv;
    }

    /**
     * Handle incoming message
     */
    handleIncomingMessage(message, type) {
        // Handle private messages
        if (message.receiver && (message.receiver === this.currentUser.username || message.sender === this.currentUser.username)) {
            this.addPrivateMessageToUI(message);
            this.playNotificationSound(message);
            this.showDesktopNotification(message);
            return;
        }
        
        // Add message to current room messages
        const roomMessages = this.messages.get(this.currentRoom) || [];
        roomMessages.push(message);
        this.messages.set(this.currentRoom, roomMessages);

        // Handle different message types
        switch (message.type) {
            case 'CHAT':
                this.addMessageToUI(message);
                break;
            case 'JOIN':
                this.addSystemMessage(message);
                break;
            case 'LEAVE':
                this.addSystemMessage(message);
                break;
            case 'TYPING':
                this.handleTypingIndicator(message);
                break;
        }

        // Play notification sound (if enabled)
        this.playNotificationSound(message);
        
        // Show desktop notification (if enabled and not focused)
        this.showDesktopNotification(message);
    }

    /**
     * Handle user update
     */
    handleUserUpdate(userData) {
        if (userData.username) {
            this.users.set(userData.username, userData);
        }
        
        // Re-render users list
        const usersArray = Array.from(this.users.values());
        this.renderUsersList(usersArray);
    }

    /**
     * Handle typing indicator
     */
    handleTypingIndicator(message) {
        const { sender, content } = message;
        
        if (sender === this.currentUser.username) return; // Ignore own typing
        
        if (content === 'typing') {
            this.typingUsers.add(sender);
        } else {
            this.typingUsers.delete(sender);
        }
        
        this.updateTypingIndicator();
    }

    /**
     * Update typing indicator display
     */
    updateTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (!typingIndicator) return;

        if (this.typingUsers.size === 0) {
            typingIndicator.textContent = '';
            return;
        }

        const typingArray = Array.from(this.typingUsers);
        let text = '';

        if (typingArray.length === 1) {
            text = `${typingArray[0]} is typing...`;
        } else if (typingArray.length === 2) {
            text = `${typingArray[0]} and ${typingArray[1]} are typing...`;
        } else {
            text = `${typingArray.length} people are typing...`;
        }

        typingIndicator.innerHTML = `<span class="typing-dots">${text}</span>`;
    }

    /**
     * Add message to UI
     */
    addMessageToUI(message) {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;

        const messageElement = this.createMessageElement(message);
        messagesList.appendChild(messageElement);

        // Auto-scroll if user is near bottom
        this.autoScroll();
    }

    /**
     * Add system message to UI
     */
    addSystemMessage(message) {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;

        const messageElement = this.createSystemMessageElement(message);
        messagesList.appendChild(messageElement);

        this.autoScroll();
    }

    /**
     * Create message element
     */
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        const isOwnMessage = message.sender === this.currentUser.username;
        
        messageDiv.className = `message ${isOwnMessage ? 'own' : ''}`;
        
        const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${this.getAvatarText(message.sender)}
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${message.sender}</span>
                    <span class="message-time">${timestamp}</span>
                </div>
                <div class="message-bubble">
                    <p class="message-text">${this.escapeHtml(message.content)}</p>
                </div>
            </div>
        `;

        return messageDiv;
    }

    /**
     * Create system message element
     */
    createSystemMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        
        const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="message-bubble">
                <p class="message-text">${this.escapeHtml(message.content)}</p>
                <span class="message-time">${timestamp}</span>
            </div>
        `;

        return messageDiv;
    }

    /**
     * Render all messages
     */
    renderMessages(messages) {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;

        messagesList.innerHTML = '';

        messages.forEach(message => {
            if (message.type === 'CHAT') {
                this.addMessageToUI(message);
            } else if (message.type === 'JOIN' || message.type === 'LEAVE') {
                this.addSystemMessage(message);
            }
        });
    }

    /**
     * Render users list
     */
    renderUsersList(users) {
        const usersList = document.getElementById('onlineUsersList');
        const userCount = document.getElementById('onlineUserCount');
        
        if (!usersList) return;

        // Update user count
        if (userCount) {
            userCount.textContent = users.length;
        }

        // Clear existing users
        usersList.innerHTML = '';

        // Add users
        users.forEach(user => {
            const userElement = this.createUserElement(user);
            usersList.appendChild(userElement);
        });
    }

    /**
     * Create user element
     */
    createUserElement(user) {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.dataset.username = user.username;

        userDiv.innerHTML = `
            <div class="user-avatar">
                ${this.getAvatarText(user.username)}
            </div>
            <span class="user-name">${user.username}</span>
        `;

        // Add click handler for private messaging (future feature)
        userDiv.addEventListener('click', () => {
            if (user.username !== this.currentUser.username) {
                this.startPrivateChat(user.username);
            }
        });

        return userDiv;
    }

    /**
     * Start private chat with user
     */
    startPrivateChat(username) {
        // Create or show private chat modal
        const modal = this.createPrivateChatModal(username);
        window.showModal(modal.id);
    }

    /**
     * Create private chat modal
     */
    createPrivateChatModal(username) {
        const modalId = `privateChat_${username}`;
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal private-chat-modal">
                    <div class="modal-header">
                        <h3>Chat with ${username}</h3>
                        <button class="modal-close" data-modal="${modalId}">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="private-messages" id="privateMessages_${username}">
                            <!-- Private messages will be loaded here -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <div class="private-message-input">
                            <input type="text" 
                                   id="privateInput_${username}" 
                                   placeholder="Type a private message..."
                                   maxlength="1000">
                            <button class="btn btn-primary" 
                                    onclick="chatPage.sendPrivateMessage('${username}')">
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Setup private message input
            const input = document.getElementById(`privateInput_${username}`);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.sendPrivateMessage(username);
                }
            });
            
            // Load existing private messages
            this.loadPrivateMessages(username);
        }
        
        return modal;
    }

    /**
     * Send private message
     */
    sendPrivateMessage(receiver) {
        const input = document.getElementById(`privateInput_${receiver}`);
        if (!input) return;
        
        const content = input.value.trim();
        if (!content) return;
        
        // Send via WebSocket
        window.wsUtils.sendPrivateMessage(content, receiver);
        
        // Clear input
        input.value = '';
        
        // Add message to UI immediately
        this.addPrivateMessageToUI({
            content,
            sender: this.currentUser.username,
            receiver,
            timestamp: new Date().toISOString(),
            type: 'CHAT'
        });
    }

    /**
     * Load private messages
     */
    async loadPrivateMessages(username) {
        try {
            const messages = await window.api.getPrivateMessages(this.currentUser.username, username);
            const container = document.getElementById(`privateMessages_${username}`);
            
            if (container) {
                container.innerHTML = '';
                messages.forEach(message => {
                    this.addPrivateMessageToUI(message);
                });
            }
        } catch (error) {
            console.error('Error loading private messages:', error);
        }
    }

    /**
     * Add private message to UI
     */
    addPrivateMessageToUI(message) {
        const container = document.getElementById(`privateMessages_${message.receiver === this.currentUser.username ? message.sender : message.receiver}`);
        if (!container) return;
        
        const messageElement = this.createPrivateMessageElement(message);
        container.appendChild(messageElement);
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Create private message element
     */
    createPrivateMessageElement(message) {
        const messageDiv = document.createElement('div');
        const isOwnMessage = message.sender === this.currentUser.username;
        
        messageDiv.className = `private-message ${isOwnMessage ? 'own' : ''}`;
        
        const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${message.sender}</span>
                    <span class="message-time">${timestamp}</span>
                </div>
                <div class="message-bubble">
                    <p class="message-text">${this.escapeHtml(message.content)}</p>
                </div>
            </div>
        `;
    /**
     * Get avatar text (first letter of username)
     */
    getAvatarText(username) {
        return username ? username.charAt(0).toUpperCase() : '?';
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Auto-scroll to bottom if user is near bottom
     */
    autoScroll() {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;

        const { scrollTop, scrollHeight, clientHeight } = messagesList;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

        if (isNearBottom) {
            this.scrollToBottom();
        }
    }

    /**
     * Scroll to bottom
     */
    scrollToBottom(smooth = false) {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;

        messagesList.scrollTo({
            top: messagesList.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    /**
     * Switch chat room
     */
    async switchRoom(roomName) {
        if (roomName === this.currentRoom) return;

        try {
            // Update UI
            this.updateActiveRoom(roomName);
            
            // Load messages for new room
            await this.loadMessages(roomName);
            
            // Update current room
            this.currentRoom = roomName;
            
            // Update chat title
            const chatTitle = document.getElementById('currentChatTitle');
            if (chatTitle) {
                chatTitle.textContent = roomName === 'public' ? 'Public Chat' : roomName;
            }
            
        } catch (error) {
            console.error('Error switching room:', error);
            window.showError('Failed to switch room.');
        }
    }

    /**
     * Update active room in UI
     */
    updateActiveRoom(roomName) {
        const roomItems = document.querySelectorAll('.room-item');
        roomItems.forEach(item => {
            item.classList.toggle('active', item.dataset.room === roomName);
        });
    }

    /**
     * Update connection status
     */
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('chatStatus');
        const connectionStatus = document.getElementById('connectionStatus');

        if (statusElement) {
            switch (status) {
                case 'connected':
                    statusElement.textContent = 'Connected';
                    break;
                case 'disconnected':
                    statusElement.textContent = 'Disconnected';
                    break;
                case 'error':
                    statusElement.textContent = 'Connection Error';
                    break;
                default:
                    statusElement.textContent = 'Connecting...';
            }
        }

        if (connectionStatus) {
            connectionStatus.className = `connection-status ${status}`;
        }

        // Update send button state
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');
        if (sendBtn && messageInput) {
            sendBtn.disabled = status !== 'connected' || !messageInput.value.trim();
        }
    }

    /**
     * Show profile modal
     */
    showProfileModal() {
        const modal = document.getElementById('profileModal');
        if (modal && this.currentUser) {
            // Update profile information
            const profileUsername = document.getElementById('profileUsername');
            const profileEmail = document.getElementById('profileEmail');
            const profileAvatar = document.getElementById('profileAvatar');

            if (profileUsername) profileUsername.textContent = this.currentUser.username;
            if (profileEmail) profileEmail.textContent = this.currentUser.email;
            if (profileAvatar) profileAvatar.textContent = this.getAvatarText(this.currentUser.username);

            window.showModal('profileModal');
        }
    }

    /**
     * Show settings modal (placeholder)
     */
    showSettingsModal() {
        window.showInfo('Settings panel coming soon!');
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        const confirmed = await window.confirm(
            'Are you sure you want to logout?',
            { type: 'warning', confirmText: 'Logout' }
        );

        if (confirmed) {
            try {
                window.showLoading('Logging out...');
                
                // Disconnect from WebSocket
                window.wsUtils.leaveChat();
                
                // Call logout API
                await window.api.logout();
                
                // Clear local storage
                window.authStorage.logout();
                
                // Redirect to login
                window.location.href = '/login.html';
                
            } catch (error) {
                console.error('Logout error:', error);
                // Still logout locally even if API call fails
                window.authStorage.logout();
                window.location.href = '/login.html';
            } finally {
                window.hideLoading();
            }
        }
    }

    /**
     * Play notification sound
     */
    playNotificationSound(message) {
        // Only play for other users' messages
        if (message.sender === this.currentUser.username) return;
        
        // Check if sounds are enabled
        const settings = window.chatStorage.getSettings();
        if (!settings.soundEnabled) return;

        // Create and play audio (you would need to add actual sound files)
        try {
            const audio = new Audio('/assets/sounds/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignore audio play errors (user interaction required)
            });
        } catch (error) {
            // Ignore audio errors
        }
    }

    /**
     * Show desktop notification
     */
    showDesktopNotification(message) {
        // Only show for other users' messages
        if (message.sender === this.currentUser.username) return;
        
        // Only show if page is not focused
        if (document.hasFocus()) return;

        // Check if notifications are enabled
        const settings = window.chatStorage.getSettings();
        if (!settings.notifications) return;

        // Check notification permission
        if (Notification.permission === 'granted') {
            new Notification(`${message.sender} in ChatApp`, {
                body: message.content,
                icon: '/assets/favicon.ico',
                tag: 'chat-message'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showDesktopNotification(message);
                }
            });
        }
    }
}

// Initialize chat page
document.addEventListener('DOMContentLoaded', () => {
    window.chatPage = new ChatPage();
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, reduce activity
        console.log('Chat page hidden');
    } else {
        // Page is visible, resume full activity
        console.log('Chat page visible');
    }
});

// Handle beforeunload
window.addEventListener('beforeunload', () => {
    // Disconnect from WebSocket
    if (window.wsUtils) {
        window.wsUtils.leaveChat();
    }
});