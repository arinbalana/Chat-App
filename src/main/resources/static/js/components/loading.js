/**
 * Loading Component
 * Manages loading states and overlays
 */

class LoadingManager {
    constructor() {
        this.overlay = null;
        this.activeLoaders = new Set();
        this.init();
    }

    init() {
        this.createOverlay();
        this.setupGlobalMethods();
    }

    /**
     * Create loading overlay
     */
    createOverlay() {
        this.overlay = document.getElementById('loadingOverlay');
        
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'loadingOverlay';
            this.overlay.className = 'loading-overlay hidden';
            this.overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <p class="loading-text">Loading...</p>
            `;
            document.body.appendChild(this.overlay);
        }
    }

    /**
     * Show loading overlay
     */
    show(message = 'Loading...', id = 'default') {
        if (!this.overlay) this.createOverlay();

        // Add to active loaders
        this.activeLoaders.add(id);

        // Update message
        const textElement = this.overlay.querySelector('.loading-text');
        if (textElement) {
            textElement.textContent = message;
        }

        // Show overlay
        this.overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Add fade-in animation
        requestAnimationFrame(() => {
            this.overlay.style.opacity = '1';
        });
    }

    /**
     * Hide loading overlay
     */
    hide(id = 'default') {
        // Remove from active loaders
        this.activeLoaders.delete(id);

        // Only hide if no other loaders are active
        if (this.activeLoaders.size === 0 && this.overlay) {
            this.overlay.style.opacity = '0';
            
            setTimeout(() => {
                if (this.activeLoaders.size === 0) {
                    this.overlay.classList.add('hidden');
                    document.body.style.overflow = '';
                }
            }, 200);
        }
    }

    /**
     * Show loading for a specific element
     */
    showElement(element, message = '') {
        if (!element) return;

        // Create element-specific loader
        const loader = document.createElement('div');
        loader.className = 'element-loading';
        loader.innerHTML = `
            <div class="loading-spinner-small"></div>
            ${message ? `<span class="loading-message">${message}</span>` : ''}
        `;

        // Position loader
        const rect = element.getBoundingClientRect();
        loader.style.cssText = `
            position: absolute;
            top: ${rect.top + window.scrollY}px;
            left: ${rect.left + window.scrollX}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.9);
            z-index: 1000;
            border-radius: inherit;
        `;

        // Add to DOM
        document.body.appendChild(loader);
        element.dataset.loaderId = Date.now().toString();
        loader.dataset.elementId = element.dataset.loaderId;

        return loader;
    }

    /**
     * Hide loading for a specific element
     */
    hideElement(element) {
        if (!element || !element.dataset.loaderId) return;

        const loader = document.querySelector(`[data-element-id="${element.dataset.loaderId}"]`);
        if (loader) {
            loader.remove();
            delete element.dataset.loaderId;
        }
    }

    /**
     * Show button loading state
     */
    showButton(button, message = '') {
        if (!button) return;

        // Store original content
        button.dataset.originalContent = button.innerHTML;
        button.disabled = true;
        button.classList.add('loading');

        // Update button content
        const spinner = '<span class="btn-spinner"></span>';
        const text = message || 'Loading...';
        button.innerHTML = `${spinner} <span class="btn-text">${text}</span>`;
    }

    /**
     * Hide button loading state
     */
    hideButton(button) {
        if (!button) return;

        button.disabled = false;
        button.classList.remove('loading');

        // Restore original content
        if (button.dataset.originalContent) {
            button.innerHTML = button.dataset.originalContent;
            delete button.dataset.originalContent;
        }
    }

    /**
     * Setup global methods
     */
    setupGlobalMethods() {
        // Global show/hide methods
        window.showLoading = (message, id) => this.show(message, id);
        window.hideLoading = (id) => this.hide(id);
        
        // Element-specific methods
        window.showElementLoading = (element, message) => this.showElement(element, message);
        window.hideElementLoading = (element) => this.hideElement(element);
        
        // Button-specific methods
        window.showButtonLoading = (button, message) => this.showButton(button, message);
        window.hideButtonLoading = (button) => this.hideButton(button);
    }

    /**
     * Create inline loader
     */
    createInlineLoader(size = 'medium') {
        const loader = document.createElement('div');
        loader.className = `inline-loader loader-${size}`;
        loader.innerHTML = '<div class="loading-spinner"></div>';
        return loader;
    }

    /**
     * Wrap async function with loading
     */
    async withLoading(asyncFn, options = {}) {
        const {
            message = 'Loading...',
            id = 'default',
            element = null,
            button = null
        } = options;

        try {
            // Show appropriate loading
            if (button) {
                this.showButton(button, message);
            } else if (element) {
                this.showElement(element, message);
            } else {
                this.show(message, id);
            }

            // Execute async function
            const result = await asyncFn();
            return result;

        } catch (error) {
            throw error;
        } finally {
            // Hide loading
            if (button) {
                this.hideButton(button);
            } else if (element) {
                this.hideElement(element);
            } else {
                this.hide(id);
            }
        }
    }
}

// Progress bar component
class ProgressBar {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' 
            ? document.getElementById(container) 
            : container;
        
        this.options = {
            animated: true,
            showPercentage: true,
            color: 'var(--primary-color)',
            height: '8px',
            ...options
        };

        this.progress = 0;
        this.init();
    }

    init() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar" style="height: ${this.options.height}">
                    <div class="progress-fill" style="background: ${this.options.color}"></div>
                </div>
                ${this.options.showPercentage ? '<div class="progress-text">0%</div>' : ''}
            </div>
        `;

        this.fillElement = this.container.querySelector('.progress-fill');
        this.textElement = this.container.querySelector('.progress-text');
    }

    setProgress(value) {
        this.progress = Math.max(0, Math.min(100, value));
        
        if (this.fillElement) {
            this.fillElement.style.width = `${this.progress}%`;
        }

        if (this.textElement) {
            this.textElement.textContent = `${Math.round(this.progress)}%`;
        }

        // Trigger event
        const event = new CustomEvent('progressChange', {
            detail: { progress: this.progress }
        });
        this.container.dispatchEvent(event);
    }

    complete() {
        this.setProgress(100);
        
        setTimeout(() => {
            if (this.container) {
                this.container.classList.add('progress-complete');
            }
        }, 100);
    }

    reset() {
        this.setProgress(0);
        if (this.container) {
            this.container.classList.remove('progress-complete');
        }
    }
}

// Skeleton loader component
class SkeletonLoader {
    static create(type = 'text', options = {}) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loader';

        switch (type) {
            case 'text':
                skeleton.classList.add('skeleton-text');
                skeleton.style.width = options.width || '100%';
                skeleton.style.height = options.height || '1em';
                break;
            
            case 'circle':
                skeleton.classList.add('skeleton-circle');
                const size = options.size || '40px';
                skeleton.style.width = size;
                skeleton.style.height = size;
                break;
            
            case 'rectangle':
                skeleton.classList.add('skeleton-rectangle');
                skeleton.style.width = options.width || '100%';
                skeleton.style.height = options.height || '200px';
                break;
            
            case 'card':
                skeleton.innerHTML = `
                    <div class="skeleton-rectangle" style="height: 200px; margin-bottom: 1rem;"></div>
                    <div class="skeleton-text" style="width: 80%; margin-bottom: 0.5rem;"></div>
                    <div class="skeleton-text" style="width: 60%;"></div>
                `;
                break;
        }

        return skeleton;
    }

    static replace(element, type = 'text', options = {}) {
        if (!element) return null;

        const skeleton = this.create(type, options);
        element.style.display = 'none';
        element.parentNode.insertBefore(skeleton, element);
        
        return {
            restore: () => {
                skeleton.remove();
                element.style.display = '';
            }
        };
    }
}

// Initialize loading manager
const loadingManager = new LoadingManager();

// Export components
window.loadingManager = loadingManager;
window.ProgressBar = ProgressBar;
window.SkeletonLoader = SkeletonLoader;

// Add CSS for loading components
const loadingStyles = `
<style>
.element-loading {
    backdrop-filter: blur(2px);
}

.loading-spinner-small {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top: 2px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.loading-message {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
}

.inline-loader {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.loader-small .loading-spinner { width: 16px; height: 16px; }
.loader-medium .loading-spinner { width: 24px; height: 24px; }
.loader-large .loading-spinner { width: 32px; height: 32px; }

.progress-container {
    width: 100%;
}

.progress-bar {
    width: 100%;
    background: var(--gray-200);
    border-radius: var(--radius-full);
    overflow: hidden;
    position: relative;
}

.progress-fill {
    height: 100%;
    background: var(--primary-color);
    border-radius: var(--radius-full);
    transition: width 0.3s ease;
    position: relative;
}

.progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: shimmer 2s infinite;
}

.progress-text {
    text-align: center;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
}

.progress-complete .progress-fill {
    background: var(--success-color);
}

.skeleton-loader {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}

.skeleton-text {
    border-radius: 4px;
    margin-bottom: 0.5rem;
}

.skeleton-circle {
    border-radius: 50%;
}

.skeleton-rectangle {
    border-radius: 8px;
}

@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

.btn.loading {
    pointer-events: none;
    opacity: 0.7;
}

.btn-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', loadingStyles);