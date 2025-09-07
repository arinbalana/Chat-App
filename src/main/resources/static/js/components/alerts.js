/**
 * Alert Component
 * Manages alert messages and notifications
 */

class AlertManager {
    constructor() {
        this.container = null;
        this.alerts = new Map();
        this.defaultDuration = 5000;
        this.maxAlerts = 5;
        this.init();
    }

    init() {
        this.createContainer();
        this.setupGlobalMethods();
    }

    /**
     * Create alert container
     */
    createContainer() {
        this.container = document.getElementById('alertContainer');
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'alertContainer';
            this.container.className = 'alert-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show alert message
     */
    show(message, type = 'info', options = {}) {
        const {
            duration = this.defaultDuration,
            closable = true,
            persistent = false,
            id = null
        } = options;

        // Generate unique ID if not provided
        const alertId = id || `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Remove existing alert with same ID
        if (this.alerts.has(alertId)) {
            this.hide(alertId);
        }

        // Limit number of alerts
        if (this.alerts.size >= this.maxAlerts) {
            const oldestId = this.alerts.keys().next().value;
            this.hide(oldestId);
        }

        // Create alert element
        const alert = this.createAlertElement(message, type, closable, alertId);
        
        // Add to container
        this.container.appendChild(alert);
        
        // Store alert reference
        this.alerts.set(alertId, {
            element: alert,
            type,
            message,
            timestamp: Date.now()
        });

        // Auto-hide after duration (unless persistent)
        if (!persistent && duration > 0) {
            setTimeout(() => {
                this.hide(alertId);
            }, duration);
        }

        // Trigger animation
        requestAnimationFrame(() => {
            alert.classList.add('alert-show');
        });

        return alertId;
    }

    /**
     * Create alert element
     */
    createAlertElement(message, type, closable, id) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.dataset.alertId = id;

        // Icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const icon = icons[type] || icons.info;

        alert.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">${icon}</span>
                <span class="alert-message">${message}</span>
            </div>
            ${closable ? '<button class="alert-close" type="button">&times;</button>' : ''}
        `;

        // Add close functionality
        if (closable) {
            const closeBtn = alert.querySelector('.alert-close');
            closeBtn.addEventListener('click', () => {
                this.hide(id);
            });
        }

        // Add click to dismiss (optional)
        alert.addEventListener('click', (e) => {
            if (e.target === alert || e.target.classList.contains('alert-content')) {
                this.hide(id);
            }
        });

        return alert;
    }

    /**
     * Hide alert
     */
    hide(alertId) {
        const alertData = this.alerts.get(alertId);
        if (!alertData) return;

        const { element } = alertData;
        
        // Add hide animation
        element.classList.add('alert-hide');
        
        // Remove after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.alerts.delete(alertId);
        }, 300);
    }

    /**
     * Hide all alerts
     */
    hideAll() {
        const alertIds = Array.from(this.alerts.keys());
        alertIds.forEach(id => this.hide(id));
    }

    /**
     * Update existing alert
     */
    update(alertId, message, type = null) {
        const alertData = this.alerts.get(alertId);
        if (!alertData) return false;

        const { element } = alertData;
        const messageElement = element.querySelector('.alert-message');
        
        if (messageElement) {
            messageElement.textContent = message;
        }

        if (type && type !== alertData.type) {
            element.className = `alert alert-${type} alert-show`;
            alertData.type = type;
        }

        alertData.message = message;
        return true;
    }

    /**
     * Get alert by ID
     */
    get(alertId) {
        return this.alerts.get(alertId);
    }

    /**
     * Get all alerts
     */
    getAll() {
        return Array.from(this.alerts.values());
    }

    /**
     * Setup global methods
     */
    setupGlobalMethods() {
        // Global alert methods
        window.showAlert = (message, type, options) => this.show(message, type, options);
        window.hideAlert = (id) => this.hide(id);
        window.hideAllAlerts = () => this.hideAll();
        
        // Convenience methods
        window.showSuccess = (message, options) => this.show(message, 'success', options);
        window.showError = (message, options) => this.show(message, 'error', options);
        window.showWarning = (message, options) => this.show(message, 'warning', options);
        window.showInfo = (message, options) => this.show(message, 'info', options);
    }
}

// Toast notification system
class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.position = 'top-right';
        this.init();
    }

    init() {
        this.createContainer();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = `toast-container toast-${this.position}`;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', options = {}) {
        const {
            duration = 4000,
            closable = true,
            actions = []
        } = options;

        const toastId = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const toast = this.createToastElement(message, type, closable, actions, toastId);

        this.container.appendChild(toast);
        this.toasts.set(toastId, { element: toast, type, message });

        // Show animation
        requestAnimationFrame(() => {
            toast.classList.add('toast-show');
        });

        // Auto-hide
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toastId);
            }, duration);
        }

        return toastId;
    }

    createToastElement(message, type, closable, actions, id) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.dataset.toastId = id;

        let actionsHtml = '';
        if (actions.length > 0) {
            actionsHtml = `
                <div class="toast-actions">
                    ${actions.map(action => 
                        `<button class="toast-action" data-action="${action.id}">${action.label}</button>`
                    ).join('')}
                </div>
            `;
        }

        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-message">${message}</div>
                ${actionsHtml}
            </div>
            ${closable ? '<button class="toast-close">&times;</button>' : ''}
        `;

        // Add event listeners
        if (closable) {
            toast.querySelector('.toast-close').addEventListener('click', () => {
                this.hide(id);
            });
        }

        // Action buttons
        actions.forEach(action => {
            const button = toast.querySelector(`[data-action="${action.id}"]`);
            if (button) {
                button.addEventListener('click', () => {
                    if (action.callback) {
                        action.callback();
                    }
                    if (action.dismiss !== false) {
                        this.hide(id);
                    }
                });
            }
        });

        return toast;
    }

    hide(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;

        const { element } = toastData;
        element.classList.add('toast-hide');

        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.toasts.delete(toastId);
        }, 300);
    }

    setPosition(position) {
        this.position = position;
        this.container.className = `toast-container toast-${position}`;
    }
}

// Confirmation dialog
class ConfirmDialog {
    static show(message, options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                type = 'warning'
            } = options;

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            
            overlay.innerHTML = `
                <div class="modal confirm-dialog">
                    <div class="modal-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="modal-body">
                        <div class="confirm-content">
                            <div class="confirm-icon confirm-${type}">
                                ${type === 'warning' ? '⚠' : type === 'danger' ? '⚠' : 'ℹ'}
                            </div>
                            <p class="confirm-message">${message}</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary confirm-cancel">${cancelText}</button>
                        <button class="btn btn-${type === 'danger' ? 'error' : 'primary'} confirm-ok">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Event listeners
            const handleConfirm = () => {
                overlay.remove();
                resolve(true);
            };

            const handleCancel = () => {
                overlay.remove();
                resolve(false);
            };

            overlay.querySelector('.confirm-ok').addEventListener('click', handleConfirm);
            overlay.querySelector('.confirm-cancel').addEventListener('click', handleCancel);
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    handleCancel();
                }
            });

            // Close on escape key
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                    document.removeEventListener('keydown', handleKeydown);
                }
            };
            document.addEventListener('keydown', handleKeydown);
        });
    }
}

// Initialize managers
const alertManager = new AlertManager();
const toastManager = new ToastManager();

// Export components
window.alertManager = alertManager;
window.toastManager = toastManager;
window.ConfirmDialog = ConfirmDialog;

// Global toast methods
window.showToast = (message, type, options) => toastManager.show(message, type, options);
window.showSuccessToast = (message, options) => toastManager.show(message, 'success', options);
window.showErrorToast = (message, options) => toastManager.show(message, 'error', options);
window.showWarningToast = (message, options) => toastManager.show(message, 'warning', options);
window.showInfoToast = (message, options) => toastManager.show(message, 'info', options);

// Global confirm method
window.confirm = (message, options) => ConfirmDialog.show(message, options);

// Add CSS for alerts and toasts
const alertStyles = `
<style>
.alert-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1060;
    max-width: 400px;
    width: 100%;
}

.alert {
    margin-bottom: 1rem;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.alert-show {
    transform: translateX(0);
    opacity: 1;
}

.alert-hide {
    transform: translateX(100%);
    opacity: 0;
}

.alert-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.alert-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
}

.alert-message {
    flex: 1;
    font-size: 0.875rem;
    line-height: 1.4;
}

.alert-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
}

.alert-close:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
}

.toast-container {
    position: fixed;
    z-index: 1070;
    pointer-events: none;
}

.toast-top-right {
    top: 20px;
    right: 20px;
}

.toast-top-left {
    top: 20px;
    left: 20px;
}

.toast-bottom-right {
    bottom: 20px;
    right: 20px;
}

.toast-bottom-left {
    bottom: 20px;
    left: 20px;
}

.toast {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-bottom: 1rem;
    max-width: 350px;
    pointer-events: auto;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.toast-show {
    transform: translateX(0);
    opacity: 1;
}

.toast-hide {
    transform: translateX(100%);
    opacity: 0;
}

.toast-content {
    padding: 1rem;
}

.toast-message {
    font-size: 0.875rem;
    line-height: 1.4;
    margin-bottom: 0.5rem;
}

.toast-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
}

.toast-action {
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
}

.toast-action:hover {
    background: var(--gray-100);
}

.toast-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
}

.toast-close:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
}

.confirm-dialog {
    max-width: 400px;
}

.confirm-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-align: left;
}

.confirm-icon {
    font-size: 2rem;
    flex-shrink: 0;
}

.confirm-warning { color: var(--warning-color); }
.confirm-danger { color: var(--error-color); }
.confirm-info { color: var(--primary-color); }

.confirm-message {
    margin: 0;
    font-size: 1rem;
    line-height: 1.4;
}

@media (max-width: 480px) {
    .alert-container,
    .toast-container {
        left: 10px;
        right: 10px;
        max-width: none;
    }
    
    .toast {
        max-width: none;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', alertStyles);