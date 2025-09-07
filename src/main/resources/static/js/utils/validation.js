/**
 * Validation Utility Module
 * Provides form validation functions and utilities
 */

class ValidationUtils {
    constructor() {
        this.patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            username: /^[a-zA-Z0-9_]{3,50}$/,
            password: /^.{6,}$/,
            phone: /^\+?[\d\s\-\(\)]{10,}$/,
            url: /^https?:\/\/.+/
        };

        this.messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            username: 'Username must be 3-50 characters and contain only letters, numbers, and underscores',
            password: 'Password must be at least 6 characters long',
            passwordMatch: 'Passwords do not match',
            minLength: 'Must be at least {min} characters long',
            maxLength: 'Must be no more than {max} characters long',
            phone: 'Please enter a valid phone number',
            url: 'Please enter a valid URL'
        };
    }

    /**
     * Validate a single field
     */
    validateField(value, rules) {
        const errors = [];
        
        // Required validation
        if (rules.required && (!value || value.trim() === '')) {
            errors.push(this.messages.required);
            return errors; // Return early if required field is empty
        }

        // Skip other validations if field is empty and not required
        if (!value || value.trim() === '') {
            return errors;
        }

        // Type-specific validations
        if (rules.type) {
            switch (rules.type) {
                case 'email':
                    if (!this.patterns.email.test(value)) {
                        errors.push(this.messages.email);
                    }
                    break;
                case 'username':
                    if (!this.patterns.username.test(value)) {
                        errors.push(this.messages.username);
                    }
                    break;
                case 'password':
                    if (!this.patterns.password.test(value)) {
                        errors.push(this.messages.password);
                    }
                    break;
                case 'phone':
                    if (!this.patterns.phone.test(value)) {
                        errors.push(this.messages.phone);
                    }
                    break;
                case 'url':
                    if (!this.patterns.url.test(value)) {
                        errors.push(this.messages.url);
                    }
                    break;
            }
        }

        // Length validations
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(this.messages.minLength.replace('{min}', rules.minLength));
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(this.messages.maxLength.replace('{max}', rules.maxLength));
        }

        // Custom pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(rules.message || 'Invalid format');
        }

        // Custom validation function
        if (rules.custom && typeof rules.custom === 'function') {
            const customResult = rules.custom(value);
            if (customResult !== true) {
                errors.push(customResult || 'Invalid value');
            }
        }

        return errors;
    }

    /**
     * Validate an entire form
     */
    validateForm(formData, rules) {
        const errors = {};
        let isValid = true;

        Object.keys(rules).forEach(fieldName => {
            const fieldValue = formData[fieldName];
            const fieldRules = rules[fieldName];
            const fieldErrors = this.validateField(fieldValue, fieldRules);

            if (fieldErrors.length > 0) {
                errors[fieldName] = fieldErrors;
                isValid = false;
            }
        });

        // Cross-field validations
        if (rules.confirmPassword && formData.password && formData.confirmPassword) {
            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = errors.confirmPassword || [];
                errors.confirmPassword.push(this.messages.passwordMatch);
                isValid = false;
            }
        }

        return {
            isValid,
            errors
        };
    }

    /**
     * Real-time field validation
     */
    setupRealTimeValidation(form, rules) {
        const fields = form.querySelectorAll('input, textarea, select');
        
        fields.forEach(field => {
            const fieldName = field.name || field.id;
            if (!rules[fieldName]) return;

            // Validate on blur
            field.addEventListener('blur', () => {
                this.validateAndShowFieldError(field, rules[fieldName]);
            });

            // Clear errors on input (with debounce)
            let timeout;
            field.addEventListener('input', () => {
                clearTimeout(timeout);
                this.clearFieldError(field);
                
                timeout = setTimeout(() => {
                    this.validateAndShowFieldError(field, rules[fieldName]);
                }, 500);
            });
        });
    }

    /**
     * Validate field and show error
     */
    validateAndShowFieldError(field, rules) {
        const errors = this.validateField(field.value, rules);
        
        if (errors.length > 0) {
            this.showFieldError(field, errors[0]);
            return false;
        } else {
            this.clearFieldError(field);
            return true;
        }
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        // Add error class
        formGroup.classList.add('has-error');
        
        // Find or create error element
        let errorElement = formGroup.querySelector('.form-error');
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'form-error';
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        
        // Add shake animation
        formGroup.classList.add('shake');
        setTimeout(() => {
            formGroup.classList.remove('shake');
        }, 400);
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.remove('has-error');
        
        const errorElement = formGroup.querySelector('.form-error');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    /**
     * Clear all form errors
     */
    clearFormErrors(form) {
        const errorElements = form.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.textContent = '';
        });

        const formGroups = form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('has-error');
        });
    }

    /**
     * Show form errors from server response
     */
    showFormErrors(form, errors) {
        Object.keys(errors).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (field && errors[fieldName].length > 0) {
                this.showFieldError(field, errors[fieldName][0]);
            }
        });
    }

    /**
     * Get form data as object
     */
    getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    /**
     * Sanitize input value
     */
    sanitize(value, type = 'text') {
        if (!value) return '';
        
        let sanitized = value.toString().trim();
        
        switch (type) {
            case 'email':
                sanitized = sanitized.toLowerCase();
                break;
            case 'username':
                sanitized = sanitized.toLowerCase().replace(/[^a-z0-9_]/g, '');
                break;
            case 'phone':
                sanitized = sanitized.replace(/[^\d\+\-\(\)\s]/g, '');
                break;
            case 'html':
                sanitized = sanitized
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;');
                break;
        }
        
        return sanitized;
    }

    /**
     * Password strength checker
     */
    checkPasswordStrength(password) {
        if (!password) return { score: 0, feedback: [] };

        const feedback = [];
        let score = 0;

        // Length check
        if (password.length >= 8) {
            score += 1;
        } else {
            feedback.push('Use at least 8 characters');
        }

        // Character variety checks
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('Add lowercase letters');

        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('Add uppercase letters');

        if (/[0-9]/.test(password)) score += 1;
        else feedback.push('Add numbers');

        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        else feedback.push('Add special characters');

        // Common patterns check
        if (!/(.)\1{2,}/.test(password)) score += 1;
        else feedback.push('Avoid repeated characters');

        const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        
        return {
            score,
            strength: strength[score] || 'Very Weak',
            feedback
        };
    }
}

// Create global validation instance
const validator = new ValidationUtils();

// Common validation rules
const commonRules = {
    login: {
        username: {
            required: true,
            type: 'username'
        },
        password: {
            required: true,
            minLength: 6
        }
    },

    register: {
        username: {
            required: true,
            type: 'username',
            minLength: 3,
            maxLength: 50
        },
        email: {
            required: true,
            type: 'email'
        },
        password: {
            required: true,
            type: 'password',
            minLength: 6
        },
        confirmPassword: {
            required: true,
            minLength: 6
        }
    },

    profile: {
        email: {
            required: true,
            type: 'email'
        },
        phone: {
            required: false,
            type: 'phone'
        }
    },

    message: {
        content: {
            required: true,
            maxLength: 1000
        }
    }
};

// Export validation utilities
window.validator = validator;
window.commonRules = commonRules;

// Utility functions
window.validationUtils = {
    /**
     * Setup form validation
     */
    setupForm(formId, rules) {
        const form = document.getElementById(formId);
        if (!form) return;

        // Setup real-time validation
        validator.setupRealTimeValidation(form, rules);

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = validator.getFormData(form);
            const validation = validator.validateForm(formData, rules);
            
            if (validation.isValid) {
                // Trigger custom event with form data
                const event = new CustomEvent('formValid', {
                    detail: { formData, form }
                });
                form.dispatchEvent(event);
            } else {
                validator.showFormErrors(form, validation.errors);
            }
        });

        return form;
    },

    /**
     * Validate single field
     */
    validateField(fieldId, rules) {
        const field = document.getElementById(fieldId);
        if (!field) return false;

        return validator.validateAndShowFieldError(field, rules);
    },

    /**
     * Show password strength indicator
     */
    setupPasswordStrength(passwordFieldId, indicatorId) {
        const passwordField = document.getElementById(passwordFieldId);
        const indicator = document.getElementById(indicatorId);
        
        if (!passwordField || !indicator) return;

        passwordField.addEventListener('input', () => {
            const strength = validator.checkPasswordStrength(passwordField.value);
            
            indicator.innerHTML = `
                <div class="password-strength">
                    <div class="strength-bar">
                        <div class="strength-fill" style="width: ${(strength.score / 5) * 100}%"></div>
                    </div>
                    <span class="strength-text">${strength.strength}</span>
                </div>
            `;
            
            // Add CSS classes based on strength
            indicator.className = `password-indicator strength-${strength.score}`;
        });
    }
};