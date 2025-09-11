/**
 * API Utility Module
 * Handles all HTTP requests to the backend API
 */

class ApiClient {
    constructor() {
        // Base URL for API endpoints - modify this to match your backend
        this.baseURL = window.location.origin;
        this.apiPrefix = '/api';
        
        // Default headers
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    /**
     * Get authorization header with JWT token
     */
    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        if (token) {
            return {
                ...this.defaultHeaders,
                'Authorization': `Bearer ${token}`
            };
        }
        return this.defaultHeaders;
    }

    /**
     * Generic request method
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${this.apiPrefix}${endpoint}`;
        
        const config = {
            headers: this.getAuthHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            // Handle different response types
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new ApiError(
                    data.message || `HTTP error! status: ${response.status}`,
                    response.status,
                    data
                );
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            
            // Check if it's a network error
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new ApiError(
                    'Network error - please check your connection',
                    0,
                    { originalError: error.message, isNetworkError: true }
                );
            }
            
            // Network or other errors
            throw new ApiError(
                error.message || 'Network error or server unavailable',
                0,
                { originalError: error.message }
            );
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET',
        });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    }

    // Authentication endpoints
    async login(credentials) {
        return this.post('/auth/login', credentials);
    }

    async register(userData) {
        return this.post('/auth/register', userData);
    }

    async logout() {
        return this.post('/auth/logout');
    }

    async validateToken() {
        return this.get('/auth/validate');
    }

    // User endpoints
    async getOnlineUsers() {
        return this.get('/users/online');
    }

    async getAllUsers() {
        return this.get('/users/all');
    }

    async getUserByUsername(username) {
        return this.get(`/users/${username}`);
    }

    async updateUserStatus(username, isOnline) {
        return this.post('/users/status', { username, isOnline });
    }

    async searchUsers(query) {
        return this.get('/users/search', { query });
    }

    // Message endpoints
    async getRoomMessages(roomName) {
        return this.get(`/messages/room/${roomName}`);
    }

    async getPrivateMessages(user1, user2) {
        return this.get('/messages/private', { user1, user2 });
    }

    async getRecentMessages(username, limit = 50) {
        return this.get(`/messages/recent/${username}`, { limit });
    }

    async deleteMessage(messageId, username) {
        return this.delete(`/messages/${messageId}?username=${username}`);
    }

    async updateMessage(messageId, content, username) {
        return this.put(`/messages/${messageId}`, null, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: new URLSearchParams({ content, username })
        });
    }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }

    /**
     * Check if error is due to authentication issues
     */
    isAuthError() {
        return this.status === 401 || this.status === 403;
    }

    /**
     * Check if error is due to network issues
     */
    isNetworkError() {
        return this.status === 0;
    }

    /**
     * Check if error is a client error (4xx)
     */
    isClientError() {
        return this.status >= 400 && this.status < 500;
    }

    /**
     * Check if error is a server error (5xx)
     */
    isServerError() {
        return this.status >= 500;
    }
}

/**
 * Request interceptor for handling common scenarios
 */
class RequestInterceptor {
    static async handleAuthError(error) {
        if (error.isAuthError()) {
            // Clear stored auth data
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            
            // Redirect to login if not already there
            if (!window.location.pathname.includes('login')) {
                window.location.href = '/login.html';
            }
        }
        throw error;
    }

    static async handleNetworkError(error) {
        if (error.isNetworkError()) {
            // Show network error message
            if (window.showAlert) {
                window.showAlert('Network error. Please check your connection.', 'error');
            }
        }
        throw error;
    }
}

// Create global API instance
const api = new ApiClient();

// Add global error handling
const originalRequest = api.request.bind(api);
api.request = async function(endpoint, options) {
    try {
        return await originalRequest(endpoint, options);
    } catch (error) {
        await RequestInterceptor.handleAuthError(error);
        await RequestInterceptor.handleNetworkError(error);
        throw error;
    }
};

// Export for use in other modules
window.api = api;
window.ApiError = ApiError;

// Utility functions for common API patterns
window.apiUtils = {
    /**
     * Retry a request with exponential backoff
     */
    async retryRequest(requestFn, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                
                if (i === maxRetries || error.isClientError()) {
                    break;
                }
                
                // Exponential backoff
                const delay = baseDelay * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    },

    /**
     * Handle API response with loading state
     */
    async withLoading(requestFn, loadingElement = null) {
        if (loadingElement) {
            loadingElement.classList.add('loading');
        }
        
        if (window.showLoading) {
            window.showLoading();
        }
        
        try {
            const result = await requestFn();
            return result;
        } finally {
            if (loadingElement) {
                loadingElement.classList.remove('loading');
            }
            
            if (window.hideLoading) {
                window.hideLoading();
            }
        }
    },

    /**
     * Debounce API calls (useful for search)
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Format error message for display
     */
    formatErrorMessage(error) {
        if (error instanceof ApiError) {
            if (error.data && error.data.message) {
                return error.data.message;
            }
            return error.message;
        }
        return 'An unexpected error occurred';
    }
};