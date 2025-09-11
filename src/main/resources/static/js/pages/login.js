/**
 * Login Page JavaScript
 * Handles login form functionality and authentication
 */

class LoginPage {
    constructor() {
        this.form = null;
        this.isSubmitting = false;
        this.init();
    }

    init() {
        this.setupForm();
        this.setupPasswordToggle();
        this.checkExistingAuth();
        this.setupSocialLogin();
    }

    /**
     * Setup login form
     */
    setupForm() {
        this.form = document.getElementById('loginForm');
        if (!this.form) return;

        // Setup form validation
        window.validationUtils.setupForm('loginForm', window.commonRules.login);

        // Handle form submission
        this.form.addEventListener('formValid', (e) => {
            this.handleLogin(e.detail.formData);
        });

        // Setup real-time validation feedback
        this.setupRealTimeValidation();

        // Handle enter key
        this.form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isSubmitting) {
                e.preventDefault();
                this.form.dispatchEvent(new Event('submit'));
            }
        });
    }

    /**
     * Setup real-time validation
     */
    setupRealTimeValidation() {
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');

        // Username validation
        if (usernameField) {
            usernameField.addEventListener('blur', () => {
                this.validateField('username');
            });

            usernameField.addEventListener('input', () => {
                this.clearFieldError('username');
            });
        }

        // Password validation
        if (passwordField) {
            passwordField.addEventListener('blur', () => {
                this.validateField('password');
            });

            passwordField.addEventListener('input', () => {
                this.clearFieldError('password');
            });
        }
    }

    /**
     * Validate individual field
     */
    validateField(fieldName) {
        const field = document.getElementById(fieldName);
        const rules = window.commonRules.login[fieldName];
        
        if (field && rules) {
            return window.validator.validateAndShowFieldError(field, rules);
        }
        return true;
    }

    /**
     * Clear field error
     */
    clearFieldError(fieldName) {
        const field = document.getElementById(fieldName);
        if (field) {
            window.validator.clearFieldError(field);
        }
    }

    /**
     * Setup password toggle functionality
     */
    setupPasswordToggle() {
        const passwordToggle = document.getElementById('passwordToggle');
        const passwordField = document.getElementById('password');

        if (passwordToggle && passwordField) {
            passwordToggle.addEventListener('click', () => {
                const isPassword = passwordField.type === 'password';
                passwordField.type = isPassword ? 'text' : 'password';
                
                const icon = passwordToggle.querySelector('.toggle-icon');
                icon.textContent = isPassword ? '🙈' : '👁️';
                
                // Maintain focus on password field
                passwordField.focus();
            });
        }
    }

    /**
     * Handle login form submission
     */
    async handleLogin(formData) {
        if (this.isSubmitting) return;

        this.isSubmitting = true;
        const submitBtn = document.getElementById('loginBtn');

        try {
            // Show loading state
            window.showButtonLoading(submitBtn, 'Signing in...');
            
            // Clear previous errors
            this.clearAllErrors();

            // Sanitize input data
            const loginData = {
                username: window.validator.sanitize(formData.username, 'username'),
                password: formData.password // Don't sanitize password
            };

            // Validate data
            const validation = window.validator.validateForm(loginData, window.commonRules.login);
            if (!validation.isValid) {
                window.validator.showFormErrors(this.form, validation.errors);
                return;
            }

            // Call login API
            const response = await window.api.login(loginData);

            // Handle successful login
            await this.handleLoginSuccess(response);

        } catch (error) {
            console.error('Login error:', error);
            this.handleLoginError(error);
        } finally {
            this.isSubmitting = false;
            window.hideButtonLoading(submitBtn);
        }
    }

    /**
     * Handle successful login
     */
    async handleLoginSuccess(response) {
        // Store authentication data
        if (response.token) {
            window.authStorage.setToken(response.token);
        }

        if (response.username || response.email) {
            window.authStorage.setUser({
                username: response.username,
                email: response.email
            });
        }

        // Show success message
        window.showSuccess('Login successful! Redirecting...', { duration: 2000 });

        // Redirect to chat page
        setTimeout(() => {
            window.location.href = '/chat.html';
        }, 1000);
    }

    /**
     * Handle login error
     */
    handleLoginError(error) {
        let errorMessage = 'Login failed. Please try again.';

        if (error instanceof window.ApiError) {
            if (error.status === 401) {
                errorMessage = 'Invalid username or password.';
                // Highlight the relevant fields
                this.highlightErrorFields(['username', 'password']);
            } else if (error.status === 429) {
                errorMessage = 'Too many login attempts. Please try again later.';
            } else if (error.status === 0) {
                errorMessage = 'Cannot connect to server. Please check your connection.';
            } else if (error.data && error.data.message) {
                errorMessage = error.data.message;
            }
        } else if (error.data && error.data.isNetworkError) {
            errorMessage = 'Network error. Please check your connection.';
        } else if (error.name === 'TypeError') {
            errorMessage = 'Network error. Please check your connection and try again.';
        }

        // Show error message
        window.showError(errorMessage, { duration: 5000 });

        // Focus on username field for retry
        const usernameField = document.getElementById('username');
        if (usernameField) {
            usernameField.focus();
        }
    }

    /**
     * Highlight error fields
     */
    highlightErrorFields(fieldNames) {
        fieldNames.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                const formGroup = field.closest('.form-group');
                if (formGroup) {
                    formGroup.classList.add('has-error');
                    formGroup.classList.add('shake');
                    
                    setTimeout(() => {
                        formGroup.classList.remove('shake');
                    }, 400);
                }
            }
        });
    }

    /**
     * Clear all form errors
     */
    clearAllErrors() {
        window.validator.clearFormErrors(this.form);
        window.hideAllAlerts();
    }

    /**
     * Check for existing authentication
     */
    checkExistingAuth() {
        if (window.authStorage && window.authStorage.isAuthenticated()) {
            // User is already logged in, redirect to chat
            window.showInfo('You are already logged in. Redirecting...', { duration: 2000 });
            setTimeout(() => {
                window.location.href = '/chat.html';
            }, 1000);
        }
    }

    /**
     * Setup social login (placeholder for future implementation)
     */
    setupSocialLogin() {
        // This is a placeholder for social login functionality
        // You can implement Google, Facebook, etc. login here
        
        const socialButtons = document.querySelectorAll('[data-social-login]');
        socialButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const provider = button.dataset.socialLogin;
                window.showInfo(`${provider} login coming soon!`);
            });
        });
    }

    /**
     * Setup demo login (for testing)
     */
    setupDemoLogin() {
        // Add demo login button for testing
        const demoBtn = document.createElement('button');
        demoBtn.type = 'button';
        demoBtn.className = 'btn btn-outline btn-full';
        demoBtn.textContent = 'Demo Login';
        demoBtn.style.marginTop = '1rem';
        
        demoBtn.addEventListener('click', () => {
            document.getElementById('username').value = 'demo';
            document.getElementById('password').value = 'demo123';
            this.form.dispatchEvent(new Event('submit'));
        });

        const formActions = document.querySelector('.form-actions');
        if (formActions) {
            formActions.appendChild(demoBtn);
        }
    }

    /**
     * Setup remember me functionality
     */
    setupRememberMe() {
        const rememberCheckbox = document.getElementById('rememberMe');
        if (!rememberCheckbox) return;

        // Load saved username if remember me was checked
        const savedUsername = localStorage.getItem('rememberedUsername');
        if (savedUsername) {
            document.getElementById('username').value = savedUsername;
            rememberCheckbox.checked = true;
        }

        // Save/clear username based on checkbox
        this.form.addEventListener('formValid', () => {
            const username = document.getElementById('username').value;
            
            if (rememberCheckbox.checked) {
                localStorage.setItem('rememberedUsername', username);
            } else {
                localStorage.removeItem('rememberedUsername');
            }
        });
    }
}

// Auto-fill functionality
class AutoFillManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupAutoComplete();
        this.setupFormRecovery();
    }

    /**
     * Setup autocomplete attributes
     */
    setupAutoComplete() {
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');

        if (usernameField) {
            usernameField.setAttribute('autocomplete', 'username');
        }

        if (passwordField) {
            passwordField.setAttribute('autocomplete', 'current-password');
        }
    }

    /**
     * Setup form recovery (restore form data on page refresh)
     */
    setupFormRecovery() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        // Save form data on input
        const inputs = form.querySelectorAll('input:not([type="password"])');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                sessionStorage.setItem(`login_${input.name}`, input.value);
            });
        });

        // Restore form data on page load
        inputs.forEach(input => {
            const savedValue = sessionStorage.getItem(`login_${input.name}`);
            if (savedValue) {
                input.value = savedValue;
            }
        });

        // Clear saved data on successful login
        window.addEventListener('beforeunload', () => {
            if (window.authStorage && window.authStorage.isAuthenticated()) {
                inputs.forEach(input => {
                    sessionStorage.removeItem(`login_${input.name}`);
                });
            }
        });
    }
}

// Initialize login page
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
    new AutoFillManager();
});

// Handle browser back button
window.addEventListener('popstate', () => {
    if (window.authStorage && window.authStorage.isAuthenticated()) {
        window.location.href = '/chat.html';
    }
});

// Add CSS for login page enhancements
const loginStyles = `
<style>
.auth-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    flex-direction: column;
}

.auth-main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 0;
}

.auth-container {
    width: 100%;
    max-width: 400px;
    padding: 0 1rem;
}

.auth-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    padding: 2rem;
    backdrop-filter: blur(10px);
}

.auth-header {
    text-align: center;
    margin-bottom: 2rem;
}

.auth-header h2 {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.auth-header p {
    color: var(--text-muted);
    margin: 0;
}

.password-input {
    position: relative;
}

.password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    color: var(--text-muted);
    border-radius: 4px;
    transition: all 0.2s;
}

.password-toggle:hover {
    background: var(--gray-100);
    color: var(--text-primary);
}

.form-group.has-error input {
    border-color: var(--error-color);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-group.shake {
    animation: shake 0.4s ease-in-out;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
}

.demo-login {
    margin-top: 1rem;
    font-size: 0.875rem;
    opacity: 0.8;
}

.social-login {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
}

.social-login-buttons {
    display: flex;
    gap: 0.75rem;
}

.social-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: white;
    color: var(--text-primary);
    text-decoration: none;
    transition: all 0.2s;
    font-size: 0.875rem;
}

.social-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-300);
}

@media (max-width: 480px) {
    .auth-card {
        padding: 1.5rem;
        margin: 1rem;
        border-radius: 12px;
    }
    
    .social-login-buttons {
        flex-direction: column;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', loginStyles);