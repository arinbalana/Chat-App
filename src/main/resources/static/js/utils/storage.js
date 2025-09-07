/**
 * Storage Utility Module
 * Handles localStorage operations with error handling and data validation
 */

class StorageManager {
    constructor() {
        this.prefix = 'chatapp_';
        this.isAvailable = this.checkStorageAvailability();
    }

    /**
     * Check if localStorage is available
     */
    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage is not available:', e);
            return false;
        }
    }

    /**
     * Get prefixed key
     */
    getKey(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * Set item in localStorage
     */
    setItem(key, value) {
        if (!this.isAvailable) {
            console.warn('Storage not available');
            return false;
        }

        try {
            const serializedValue = JSON.stringify({
                data: value,
                timestamp: Date.now(),
                type: typeof value
            });
            localStorage.setItem(this.getKey(key), serializedValue);
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    }

    /**
     * Get item from localStorage
     */
    getItem(key, defaultValue = null) {
        if (!this.isAvailable) {
            return defaultValue;
        }

        try {
            const item = localStorage.getItem(this.getKey(key));
            if (item === null) {
                return defaultValue;
            }

            const parsed = JSON.parse(item);
            return parsed.data;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return defaultValue;
        }
    }

    /**
     * Remove item from localStorage
     */
    removeItem(key) {
        if (!this.isAvailable) {
            return false;
        }

        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (error) {
            console.error('Error removing from storage:', error);
            return false;
        }
    }

    /**
     * Clear all app-related items
     */
    clear() {
        if (!this.isAvailable) {
            return false;
        }

        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    /**
     * Get item with expiration check
     */
    getItemWithExpiry(key, defaultValue = null) {
        if (!this.isAvailable) {
            return defaultValue;
        }

        try {
            const item = localStorage.getItem(this.getKey(key));
            if (item === null) {
                return defaultValue;
            }

            const parsed = JSON.parse(item);
            
            // Check if item has expired
            if (parsed.expiry && Date.now() > parsed.expiry) {
                this.removeItem(key);
                return defaultValue;
            }

            return parsed.data;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return defaultValue;
        }
    }

    /**
     * Set item with expiration time
     */
    setItemWithExpiry(key, value, expiryMinutes = 60) {
        if (!this.isAvailable) {
            return false;
        }

        try {
            const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);
            const serializedValue = JSON.stringify({
                data: value,
                timestamp: Date.now(),
                expiry: expiryTime,
                type: typeof value
            });
            localStorage.setItem(this.getKey(key), serializedValue);
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    }

    /**
     * Get storage usage information
     */
    getStorageInfo() {
        if (!this.isAvailable) {
            return null;
        }

        try {
            let totalSize = 0;
            let appSize = 0;
            const appKeys = [];

            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const size = localStorage[key].length;
                    totalSize += size;
                    
                    if (key.startsWith(this.prefix)) {
                        appSize += size;
                        appKeys.push(key);
                    }
                }
            }

            return {
                totalSize,
                appSize,
                appKeys: appKeys.length,
                available: this.isAvailable
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }
}

// Create global storage instance
const storage = new StorageManager();

// Authentication-specific storage methods
const authStorage = {
    setToken(token) {
        return storage.setItemWithExpiry('authToken', token, 1440); // 24 hours
    },

    getToken() {
        return storage.getItemWithExpiry('authToken');
    },

    removeToken() {
        return storage.removeItem('authToken');
    },

    setUser(user) {
        return storage.setItem('currentUser', user);
    },

    getUser() {
        return storage.getItem('currentUser');
    },

    removeUser() {
        return storage.removeItem('currentUser');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    logout() {
        this.removeToken();
        this.removeUser();
        storage.removeItem('chatSettings');
        storage.removeItem('recentChats');
    }
};

// Chat-specific storage methods
const chatStorage = {
    setSettings(settings) {
        return storage.setItem('chatSettings', settings);
    },

    getSettings() {
        return storage.getItem('chatSettings', {
            notifications: true,
            soundEnabled: true,
            theme: 'light',
            fontSize: 'medium'
        });
    },

    addRecentChat(chatInfo) {
        const recent = this.getRecentChats();
        const filtered = recent.filter(chat => chat.id !== chatInfo.id);
        filtered.unshift(chatInfo);
        
        // Keep only last 10 recent chats
        const limited = filtered.slice(0, 10);
        return storage.setItem('recentChats', limited);
    },

    getRecentChats() {
        return storage.getItem('recentChats', []);
    },

    clearRecentChats() {
        return storage.removeItem('recentChats');
    },

    // Cache messages temporarily
    cacheMessages(roomId, messages) {
        const key = `messages_${roomId}`;
        return storage.setItemWithExpiry(key, messages, 30); // 30 minutes
    },

    getCachedMessages(roomId) {
        const key = `messages_${roomId}`;
        return storage.getItemWithExpiry(key, []);
    },

    clearMessageCache(roomId = null) {
        if (roomId) {
            return storage.removeItem(`messages_${roomId}`);
        } else {
            // Clear all message caches
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.includes('messages_')) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        }
    }
};

// Theme storage methods
const themeStorage = {
    setTheme(theme) {
        return storage.setItem('theme', theme);
    },

    getTheme() {
        return storage.getItem('theme', 'light');
    },

    toggleTheme() {
        const current = this.getTheme();
        const newTheme = current === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        return newTheme;
    }
};

// Export storage utilities
window.storage = storage;
window.authStorage = authStorage;
window.chatStorage = chatStorage;
window.themeStorage = themeStorage;

// Storage event listener for cross-tab synchronization
window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(storage.prefix)) {
        const key = e.key.replace(storage.prefix, '');
        
        // Handle auth token changes
        if (key === 'authToken') {
            if (!e.newValue && window.location.pathname !== '/login.html') {
                // Token was removed, redirect to login
                window.location.href = '/login.html';
            }
        }
        
        // Handle user changes
        if (key === 'currentUser') {
            // Update UI with new user info
            const event = new CustomEvent('userUpdated', {
                detail: e.newValue ? JSON.parse(e.newValue) : null
            });
            window.dispatchEvent(event);
        }
        
        // Handle theme changes
        if (key === 'theme') {
            const event = new CustomEvent('themeChanged', {
                detail: e.newValue ? JSON.parse(e.newValue) : 'light'
            });
            window.dispatchEvent(event);
        }
    }
});

// Utility functions
window.storageUtils = {
    /**
     * Migrate old storage format to new format
     */
    migrate() {
        try {
            // Check for old format data and migrate
            const oldToken = localStorage.getItem('token');
            if (oldToken && !authStorage.getToken()) {
                authStorage.setToken(oldToken);
                localStorage.removeItem('token');
            }

            const oldUser = localStorage.getItem('user');
            if (oldUser && !authStorage.getUser()) {
                authStorage.setUser(JSON.parse(oldUser));
                localStorage.removeItem('user');
            }
        } catch (error) {
            console.error('Storage migration error:', error);
        }
    },

    /**
     * Clean up expired items
     */
    cleanup() {
        if (!storage.isAvailable) return;

        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(storage.prefix)) {
                    try {
                        const item = localStorage.getItem(key);
                        const parsed = JSON.parse(item);
                        
                        if (parsed.expiry && Date.now() > parsed.expiry) {
                            localStorage.removeItem(key);
                        }
                    } catch (e) {
                        // Invalid JSON, remove the item
                        localStorage.removeItem(key);
                    }
                }
            });
        } catch (error) {
            console.error('Storage cleanup error:', error);
        }
    },

    /**
     * Export user data
     */
    exportData() {
        if (!storage.isAvailable) return null;

        try {
            const data = {};
            const keys = Object.keys(localStorage);
            
            keys.forEach(key => {
                if (key.startsWith(storage.prefix)) {
                    data[key] = localStorage.getItem(key);
                }
            });

            return {
                timestamp: Date.now(),
                data: data
            };
        } catch (error) {
            console.error('Export error:', error);
            return null;
        }
    },

    /**
     * Import user data
     */
    importData(exportedData) {
        if (!storage.isAvailable || !exportedData || !exportedData.data) {
            return false;
        }

        try {
            Object.keys(exportedData.data).forEach(key => {
                localStorage.setItem(key, exportedData.data[key]);
            });
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }
};

// Run cleanup on page load
document.addEventListener('DOMContentLoaded', () => {
    window.storageUtils.migrate();
    window.storageUtils.cleanup();
});

// Run cleanup periodically
setInterval(() => {
    window.storageUtils.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes