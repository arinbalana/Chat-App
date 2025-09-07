/**
 * Register Page JavaScript
 * Handles registration form functionality and user creation
 */

class RegisterPage {
    constructor() {
        this.form = null;
        this.isSubmitting = false;
        this.passwordStrength = { score: 0 };
        this.init();
    }

    init() {
        this.setupForm();
        this.setupPasswordToggles();
        this.setupPasswordStrength();
        this.checkExistingAuth();
        this.setupUsernameAvailability();
    }

    /**
     * Setup registration form
     */
    setupForm() {
        this.form = document.getElementById('registerForm');
        if (!this.form) return;

        // Setup form validation
        window.validationUtils.setupForm('registerForm', window.commonRules.register);

        // Handle form submission
        this.form.addEventListener('formValid', (e) => {
            this.handleRegistration(e.detail.formData);
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
        const fields = ['username', 'email', 'password', 'confirmPassword'];
        
        fields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (!field) return;

            field.addEventListener('blur', () => {
                this.validateField(fieldName);
            });

            field.addEventListener('input', () => {
                this.clearFieldError(fieldName);
                
                // Special handling for password confirmation
                if (fieldName === 'password' || fieldName === 'confirmPassword') {
                    this.validatePasswordMatch();
                }
            });
        });
    }

    /**
     * Validate individual field
     */
    validateField(fieldName) {
        const field = document.getElementById(fieldName);
        const rules = window.commonRules.register[fieldName];
        
        if (field && rules) {
            return window.validator.validateAndShowFieldError(field, rules);
        }
        return true;
    }

    /**
     * Validate password match
     */
    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError('confirmPassword', 'Passwords do not match');
            return false;
        } else if (confirmPassword) {
            this.clearFieldError('confirmPassword');
            return true;
        }
        return true;
    }

    /**
     * Show field error
     */
    showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
        if (field) {
            window.validator.showFieldError(field, message);
        }
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
    setupPasswordToggles() {
        const toggles = [
            { toggle: 'passwordToggle', field: 'password' },
            { toggle: 'confirmPasswordToggle', field: 'confirmPassword' }
        ];

        toggles.forEach(({ toggle, field }) => {
            const toggleBtn = document.getElementById(toggle);
            const passwordField = document.getElementById(field);

            if (toggleBtn && passwordField) {
                toggleBtn.addEventListener('click', () => {
                    const isPassword = passwordField.type === 'password';
                    passwordField.type = isPassword ? 'text' : 'password';
                    
                    const icon = toggleBtn.querySelector('.toggle-icon');
                    icon.textContent = isPassword ? '🙈' : '👁️';
                    
                    // Maintain focus on password field
                    passwordField.focus();
                });
            }
        });
    }

    /**
     * Setup password strength indicator
     */
    setupPasswordStrength() {
        const passwordField = document.getElementById('password');
        if (!passwordField) return;

        // Create strength indicator
        const strengthIndicator = document.createElement('div');
        strengthIndicator.className = 'password-strength-indicator';
        strengthIndicator.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill"></div>
            </div>
            <div class="strength-text"></div>
            <div class="strength-feedback"></div>
        `;

        // Insert after password field
        passwordField.parentNode.insertBefore(strengthIndicator, passwordField.nextSibling);

        // Update strength on input
        passwordField.addEventListener('input', () => {
            this.updatePasswordStrength(passwordField.value, strengthIndicator);
        });
    }

    /**
     * Update password strength indicator
     */
    updatePasswordStrength(password, indicator) {
        this.passwordStrength = window.validator.checkPasswordStrength(password);
        
        const fillElement = indicator.querySelector('.strength-fill');
        const textElement = indicator.querySelector('.strength-text');
        const feedbackElement = indicator.querySelector('.strength-feedback');

        // Update progress bar
        const percentage = (this.passwordStrength.score / 5) * 100;
        fillElement.style.width = `${percentage}%`;

        // Update colors based on strength
        const colors = ['#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981', '#059669'];
        fillElement.style.backgroundColor = colors[this.passwordStrength.score] || colors[0];

        // Update text
        textElement.textContent = this.passwordStrength.strength;
        textElement.style.color = colors[this.passwordStrength.score] || colors[0];

        // Update feedback
        if (this.passwordStrength.feedback.length > 0 && password.length > 0) {
            feedbackElement.innerHTML = this.passwordStrength.feedback
                .slice(0, 2) // Show only first 2 suggestions
                .map(tip => `<div class="strength-tip">• ${tip}</div>`)
                .join('');
            feedbackElement.style.display = 'block';
        } else {
            feedbackElement.style.display = 'none';
        }
    }

    /**
     * Setup username availability checking
     */
    setupUsernameAvailability() {
        const usernameField = document.getElementById('username');
        if (!usernameField) return;

        let checkTimeout;
        
        usernameField.addEventListener('input', () => {
            clearTimeout(checkTimeout);
            
            const username = usernameField.value.trim();
            if (username.length >= 3) {
                checkTimeout = setTimeout(() => {
                    this.checkUsernameAvailability(username);
                }, 500);
            }
        });
    }

    /**
     * Check username availability
     */
    async checkUsernameAvailability(username) {
        const usernameField = document.getElementById('username');
        const formGroup = usernameField.closest('.form-group');
        
        try {
            // Add loading indicator
            formGroup.classList.add('checking');
            
            // This would typically call an API endpoint
            // For now, we'll simulate the check
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Simulate some taken usernames
            const takenUsernames = ['admin', 'user', 'test', 'demo'];
            const isAvailable = !takenUsernames.includes(username.toLowerCase());
            
            if (isAvailable) {
                this.showUsernameStatus('available', '✓ Username is available');
            } else {
                this.showUsernameStatus('taken', '✕ Username is already taken');
            }
            
        } catch (error) {
            console.error('Username check error:', error);
        } finally {
            formGroup.classList.remove('checking');
        }
    }

    /**
     * Show username availability status
     */
    showUsernameStatus(status, message) {
        const usernameField = document.getElementById('username');
        const formGroup = usernameField.closest('.form-group');
        
        // Remove existing status
        const existingStatus = formGroup.querySelector('.username-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Add new status
        const statusElement = document.createElement('div');
        statusElement.className = `username-status status-${status}`;
        statusElement.textContent = message;
        
        formGroup.appendChild(statusElement);
    }

    /**
     * Handle registration form submission
     */
    async handleRegistration(formData) {
        if (this.isSubmitting) return;

        this.isSubmitting = true;
        const submitBtn = document.getElementById('registerBtn');

        try {
            // Show loading state
            window.showButtonLoading(submitBtn, 'Creating account...');
            
            // Clear previous errors
            this.clearAllErrors();

            // Validate password strength
            if (this.passwordStrength.score < 2) {
                this.showFieldError('password', 'Please choose a stronger password');
                return;
            }

            // Sanitize input data
            const registrationData = {
                username: window.validator.sanitize(formData.username, 'username'),
                email: window.validator.sanitize(formData.email, 'email'),
                password: formData.password // Don't sanitize password
            };

            // Validate data
            const validation = window.validator.validateForm(registrationData, window.commonRules.register);
            if (!validation.isValid) {
                window.validator.showFormErrors(this.form, validation.errors);
                return;
            }

            // Check password match
            if (formData.password !== formData.confirmPassword) {
                this.showFieldError('confirmPassword', 'Passwords do not match');
                return;
            }

            // Call registration API
            const response = await window.api.register(registrationData);

            // Handle successful registration
            await this.handleRegistrationSuccess(response);

        } catch (error) {
            console.error('Registration error:', error);
            this.handleRegistrationError(error);
        } finally {
            this.isSubmitting = false;
            window.hideButtonLoading(submitBtn);
        }
    }

    /**
     * Handle successful registration
     */
    async handleRegistrationSuccess(response) {
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
        window.showSuccess('Account created successfully! Welcome to ChatApp!', { duration: 3000 });

        // Redirect to chat page
        setTimeout(() => {
            window.location.href = '/chat.html';
        }, 1500);
    }

    /**
     * Handle registration error
     */
    handleRegistrationError(error) {
        let errorMessage = 'Registration failed. Please try again.';

        if (error instanceof window.ApiError) {
            if (error.status === 409) {
                // Conflict - username or email already exists
                if (error.data && error.data.message) {
                    errorMessage = error.data.message;
                    
                    // Highlight specific fields based on error
                    if (error.data.message.toLowerCase().includes('username')) {
                        this.highlightErrorFields(['username']);
                    } else if (error.data.message.toLowerCase().includes('email')) {
                        this.highlightErrorFields(['email']);
                    }
                } else {
                    errorMessage = 'Username or email already exists.';
                    this.highlightErrorFields(['username', 'email']);
                }
            } else if (error.status === 400) {
                errorMessage = 'Please check your input and try again.';
            } else if (error.data && error.data.message) {
                errorMessage = error.data.message;
            }
        } else if (error.isNetworkError && error.isNetworkError()) {
            errorMessage = 'Network error. Please check your connection.';
        }

        // Show error message
        window.showError(errorMessage, { duration: 5000 });

        // Focus on first field with error
        const firstErrorField = this.form.querySelector('.has-error input');
        if (firstErrorField) {
            firstErrorField.focus();
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
        
        // Clear username status
        const usernameStatus = document.querySelector('.username-status');
        if (usernameStatus) {
            usernameStatus.remove();
        }
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
}

// Terms of Service and Privacy Policy handler
class LegalAgreementHandler {
    constructor() {
        this.init();
    }

    init() {
        this.setupAgreementLinks();
        this.setupAgreementValidation();
    }

    setupAgreementLinks() {
        // Handle terms and privacy policy links
        const termsLink = document.querySelector('[data-terms]');
        const privacyLink = document.querySelector('[data-privacy]');

        if (termsLink) {
            termsLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showTermsModal();
            });
        }

        if (privacyLink) {
            privacyLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPrivacyModal();
            });
        }
    }

    setupAgreementValidation() {
        const form = document.getElementById('registerForm');
        const agreementCheckbox = document.getElementById('agreement');

        if (form && agreementCheckbox) {
            form.addEventListener('submit', (e) => {
                if (!agreementCheckbox.checked) {
                    e.preventDefault();
                    window.showError('Please agree to the Terms of Service and Privacy Policy.');
                    agreementCheckbox.focus();
                }
            });
        }
    }

    showTermsModal() {
        const modal = window.createModal({
            title: 'Terms of Service',
            content: `
                <div class="legal-content">
                    <h4>1. Acceptance of Terms</h4>
                    <p>By using ChatApp, you agree to these terms of service.</p>
                    
                    <h4>2. User Conduct</h4>
                    <p>You agree to use the service responsibly and not engage in harmful activities.</p>
                    
                    <h4>3. Privacy</h4>
                    <p>We respect your privacy and handle your data according to our Privacy Policy.</p>
                    
                    <h4>4. Service Availability</h4>
                    <p>We strive to keep the service available but cannot guarantee 100% uptime.</p>
                    
                    <p><em>This is a simplified version. Full terms would be more comprehensive.</em></p>
                </div>
            `,
            size: 'large',
            buttons: [
                { text: 'Close', type: 'secondary', action: 'close' }
            ]
        });

        modal.show();
    }

    showPrivacyModal() {
        const modal = window.createModal({
            title: 'Privacy Policy',
            content: `
                <div class="legal-content">
                    <h4>Information We Collect</h4>
                    <p>We collect information you provide directly, such as your username and email.</p>
                    
                    <h4>How We Use Information</h4>
                    <p>We use your information to provide and improve our chat service.</p>
                    
                    <h4>Information Sharing</h4>
                    <p>We do not sell or share your personal information with third parties.</p>
                    
                    <h4>Data Security</h4>
                    <p>We implement security measures to protect your information.</p>
                    
                    <h4>Contact Us</h4>
                    <p>If you have questions about this policy, please contact us.</p>
                    
                    <p><em>This is a simplified version. Full privacy policy would be more detailed.</em></p>
                </div>
            `,
            size: 'large',
            buttons: [
                { text: 'Close', type: 'secondary', action: 'close' }
            ]
        });

        modal.show();
    }
}

// Initialize register page
document.addEventListener('DOMContentLoaded', () => {
    new RegisterPage();
    new LegalAgreementHandler();
});

// Add CSS for register page enhancements
const registerStyles = `
<style>
.password-strength-indicator {
    margin-top: 0.5rem;
}

.strength-bar {
    height: 4px;
    background: var(--gray-200);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.strength-fill {
    height: 100%;
    width: 0%;
    transition: all 0.3s ease;
    border-radius: 2px;
}

.strength-text {
    font-size: 0.75rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.strength-feedback {
    display: none;
}

.strength-tip {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 0.25rem;
}

.username-status {
    font-size: 0.75rem;
    margin-top: 0.5rem;
    padding: 0.25rem 0;
}

.status-available {
    color: var(--success-color);
}

.status-taken {
    color: var(--error-color);
}

.form-group.checking {
    position: relative;
}

.form-group.checking::after {
    content: '';
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    border: 2px solid var(--gray-300);
    border-top: 2px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.legal-content {
    max-height: 400px;
    overflow-y: auto;
}

.legal-content h4 {
    color: var(--text-primary);
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
}

.legal-content h4:first-child {
    margin-top: 0;
}

.legal-content p {
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 1rem;
}

.agreement-checkbox {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-top: 1.5rem;
}

.agreement-checkbox input[type="checkbox"] {
    margin-top: 0.25rem;
    flex-shrink: 0;
}

.agreement-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.5;
}

.agreement-text a {
    color: var(--primary-color);
    text-decoration: none;
}

.agreement-text a:hover {
    text-decoration: underline;
}

@media (max-width: 480px) {
    .strength-feedback {
        font-size: 0.7rem;
    }
    
    .legal-content {
        max-height: 300px;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', registerStyles);