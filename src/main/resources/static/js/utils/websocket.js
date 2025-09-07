/**
 * WebSocket Utility Module
 * Handles WebSocket connections for real-time chat functionality
 */

class WebSocketManager {
    constructor() {
        this.socket = null;
        this.stompClient = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.subscriptions = new Map();
        this.messageQueue = [];
        this.heartbeatInterval = null;
        
        // Event handlers
        this.onConnect = null;
        this.onDisconnect = null;
        this.onError = null;
        this.onMessage = null;
        
        // Bind methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
    }

    /**
     * Connect to WebSocket server
     */
    async connect(username) {
        if (this.isConnected) {
            console.log('Already connected to WebSocket');
            return;
        }

        try {
            // Use SockJS for better compatibility
            const socketUrl = `${window.location.origin}/ws`;
            this.socket = new SockJS(socketUrl);
            this.stompClient = Stomp.over(this.socket);
            
            // Disable debug logging in production
            this.stompClient.debug = (str) => {
                if (window.location.hostname === 'localhost') {
                    console.log(str);
                }
            };

            // Connection headers
            const headers = {};
            const token = window.authStorage?.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            return new Promise((resolve, reject) => {
                this.stompClient.connect(
                    headers,
                    (frame) => {
                        console.log('Connected to WebSocket:', frame);
                        this.isConnected = true;
                        this.reconnectAttempts = 0;
                        
                        // Store username in session
                        this.username = username;
                        
                        // Setup subscriptions
                        this.setupSubscriptions();
                        
                        // Send queued messages
                        this.processMessageQueue();
                        
                        // Start heartbeat
                        this.startHeartbeat();
                        
                        // Notify connection
                        this.addUser(username);
                        
                        if (this.onConnect) {
                            this.onConnect(frame);
                        }
                        
                        resolve(frame);
                    },
                    (error) => {
                        console.error('WebSocket connection error:', error);
                        this.isConnected = false;
                        
                        if (this.onError) {
                            this.onError(error);
                        }
                        
                        // Attempt reconnection
                        this.attemptReconnect();
                        
                        reject(error);
                    }
                );
            });
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            throw error;
        }
    }

    /**
     * Setup message subscriptions
     */
    setupSubscriptions() {
        if (!this.stompClient || !this.isConnected) return;

        // Subscribe to public messages
        this.subscribe('/topic/public', (message) => {
            const messageData = JSON.parse(message.body);
            this.handleMessage(messageData, 'public');
        });

        // Subscribe to private messages for current user
        if (this.username) {
            this.subscribe(`/user/${this.username}/queue/private`, (message) => {
                const messageData = JSON.parse(message.body);
                this.handleMessage(messageData, 'private');
            });
        }

        // Subscribe to user status updates
        this.subscribe('/topic/users', (message) => {
            const userData = JSON.parse(message.body);
            this.handleUserUpdate(userData);
        });
    }

    /**
     * Subscribe to a topic
     */
    subscribe(destination, callback) {
        if (!this.stompClient || !this.isConnected) {
            console.warn('Cannot subscribe: not connected');
            return null;
        }

        const subscription = this.stompClient.subscribe(destination, callback);
        this.subscriptions.set(destination, subscription);
        return subscription;
    }

    /**
     * Unsubscribe from a topic
     */
    unsubscribe(destination) {
        const subscription = this.subscriptions.get(destination);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(destination);
        }
    }

    /**
     * Send a message
     */
    sendMessage(destination, message) {
        if (!this.isConnected) {
            console.warn('Not connected, queuing message');
            this.messageQueue.push({ destination, message });
            return;
        }

        try {
            this.stompClient.send(destination, {}, JSON.stringify(message));
        } catch (error) {
            console.error('Error sending message:', error);
            // Queue message for retry
            this.messageQueue.push({ destination, message });
        }
    }

    /**
     * Send chat message
     */
    sendChatMessage(content, type = 'CHAT', receiver = null, chatRoom = 'public') {
        const message = {
            content,
            sender: this.username,
            type,
            receiver,
            chatRoom,
            timestamp: new Date().toISOString()
        };

        if (receiver) {
            // Private message
            this.sendMessage('/app/chat.private', message);
        } else {
            // Public message
            this.sendMessage('/app/chat.sendMessage', message);
        }
    }

    /**
     * Add user to chat
     */
    addUser(username) {
        const message = {
            sender: username,
            type: 'JOIN',
            content: `${username} joined the chat!`,
            timestamp: new Date().toISOString()
        };

        this.sendMessage('/app/chat.addUser', message);
    }

    /**
     * Handle incoming messages
     */
    handleMessage(message, type) {
        // Add timestamp if not present
        if (!message.timestamp) {
            message.timestamp = new Date().toISOString();
        }

        // Trigger custom event
        const event = new CustomEvent('chatMessage', {
            detail: { message, type }
        });
        window.dispatchEvent(event);

        // Call callback if provided
        if (this.onMessage) {
            this.onMessage(message, type);
        }
    }

    /**
     * Handle user updates
     */
    handleUserUpdate(userData) {
        const event = new CustomEvent('userUpdate', {
            detail: userData
        });
        window.dispatchEvent(event);
    }

    /**
     * Process queued messages
     */
    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const { destination, message } = this.messageQueue.shift();
            this.sendMessage(destination, message);
        }
    }

    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        this.stopHeartbeat(); // Clear any existing heartbeat
        
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected && this.stompClient) {
                try {
                    // Send a ping message
                    this.stompClient.send('/app/ping', {}, JSON.stringify({
                        type: 'PING',
                        sender: this.username,
                        timestamp: new Date().toISOString()
                    }));
                } catch (error) {
                    console.error('Heartbeat failed:', error);
                    this.handleDisconnection();
                }
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Handle disconnection
     */
    handleDisconnection() {
        this.isConnected = false;
        this.stopHeartbeat();
        
        // Clear subscriptions
        this.subscriptions.clear();
        
        if (this.onDisconnect) {
            this.onDisconnect();
        }
        
        // Attempt reconnection
        this.attemptReconnect();
    }

    /**
     * Attempt to reconnect
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            if (!this.isConnected && this.username) {
                this.connect(this.username).catch(error => {
                    console.error('Reconnection failed:', error);
                });
            }
        }, delay);
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        if (!this.isConnected) return;

        try {
            // Send leave message
            if (this.username) {
                const leaveMessage = {
                    sender: this.username,
                    type: 'LEAVE',
                    content: `${this.username} left the chat!`,
                    timestamp: new Date().toISOString()
                };
                this.sendMessage('/app/chat.sendMessage', leaveMessage);
            }

            // Stop heartbeat
            this.stopHeartbeat();

            // Unsubscribe from all topics
            this.subscriptions.forEach((subscription) => {
                subscription.unsubscribe();
            });
            this.subscriptions.clear();

            // Disconnect STOMP client
            if (this.stompClient) {
                this.stompClient.disconnect(() => {
                    console.log('Disconnected from WebSocket');
                });
            }

            this.isConnected = false;
            this.stompClient = null;
            this.socket = null;
            this.username = null;

        } catch (error) {
            console.error('Error during disconnect:', error);
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            username: this.username,
            subscriptions: Array.from(this.subscriptions.keys())
        };
    }
}

// Create global WebSocket instance
const wsManager = new WebSocketManager();

// Connection status indicator
class ConnectionStatusIndicator {
    constructor() {
        this.indicator = null;
        this.init();
    }

    init() {
        // Create status indicator if it doesn't exist
        this.indicator = document.getElementById('connectionStatus');
        if (!this.indicator) {
            this.createIndicator();
        }

        // Listen for connection events
        wsManager.onConnect = () => this.updateStatus('connected');
        wsManager.onDisconnect = () => this.updateStatus('disconnected');
        wsManager.onError = () => this.updateStatus('error');
    }

    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.id = 'connectionStatus';
        this.indicator.className = 'connection-status';
        this.indicator.innerHTML = `
            <div class="status-indicator"></div>
            <span class="status-text">Connecting...</span>
        `;
        document.body.appendChild(this.indicator);
    }

    updateStatus(status) {
        if (!this.indicator) return;

        const statusText = this.indicator.querySelector('.status-text');
        
        this.indicator.className = `connection-status ${status}`;
        
        switch (status) {
            case 'connected':
                statusText.textContent = 'Connected';
                break;
            case 'disconnected':
                statusText.textContent = 'Disconnected';
                break;
            case 'error':
                statusText.textContent = 'Connection Error';
                break;
            default:
                statusText.textContent = 'Connecting...';
        }
    }
}

// Initialize connection status indicator
let connectionStatus;
document.addEventListener('DOMContentLoaded', () => {
    connectionStatus = new ConnectionStatusIndicator();
});

// Export WebSocket utilities
window.wsManager = wsManager;
window.ConnectionStatusIndicator = ConnectionStatusIndicator;

// Utility functions
window.wsUtils = {
    /**
     * Initialize WebSocket connection for chat
     */
    async initializeChat(username) {
        try {
            await wsManager.connect(username);
            return true;
        } catch (error) {
            console.error('Failed to initialize chat:', error);
            return false;
        }
    },

    /**
     * Send a chat message
     */
    sendMessage(content, receiver = null) {
        wsManager.sendChatMessage(content, 'CHAT', receiver);
    },

    /**
     * Send typing indicator
     */
    sendTyping(isTyping, receiver = null) {
        const message = {
            sender: wsManager.username,
            type: 'TYPING',
            content: isTyping ? 'typing' : 'stopped',
            receiver,
            timestamp: new Date().toISOString()
        };

        if (receiver) {
            wsManager.sendMessage('/app/chat.private', message);
        } else {
            wsManager.sendMessage('/app/chat.sendMessage', message);
        }
    },

    /**
     * Leave chat
     */
    leaveChat() {
        wsManager.disconnect();
    },

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return wsManager.getStatus();
    }
};

// Handle page unload
window.addEventListener('beforeunload', () => {
    wsManager.disconnect();
});

// Handle visibility change (tab switching)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, reduce activity
        wsManager.stopHeartbeat();
    } else {
        // Page is visible, resume activity
        if (wsManager.isConnected) {
            wsManager.startHeartbeat();
        }
    }
});