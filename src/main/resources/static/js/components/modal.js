/**
 * Modal Component
 * Manages modal dialogs and overlays
 */

class ModalManager {
    constructor() {
        this.activeModals = new Map();
        this.modalStack = [];
        this.init();
    }

    init() {
        this.setupGlobalMethods();
        this.setupEventListeners();
    }

    /**
     * Show modal
     */
    show(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal with ID '${modalId}' not found`);
            return false;
        }

        // Store modal state
        this.activeModals.set(modalId, {
            element: modal,
            options,
            previousFocus: document.activeElement
        });

        // Add to modal stack
        this.modalStack.push(modalId);

        // Show modal
        modal.classList.add('active');
        document.body.classList.add('modal-open');

        // Focus management
        this.focusModal(modal);

        // Setup close handlers
        this.setupCloseHandlers(modal, modalId);

        // Trigger event
        const event = new CustomEvent('modalShow', {
            detail: { modalId, modal, options }
        });
        modal.dispatchEvent(event);

        return true;
    }

    /**
     * Hide modal
     */
    hide(modalId) {
        const modalData = this.activeModals.get(modalId);
        if (!modalData) return false;

        const { element: modal, previousFocus } = modalData;

        // Remove from stack
        const stackIndex = this.modalStack.indexOf(modalId);
        if (stackIndex > -1) {
            this.modalStack.splice(stackIndex, 1);
        }

        // Hide modal
        modal.classList.remove('active');

        // Remove body class if no modals are active
        if (this.modalStack.length === 0) {
            document.body.classList.remove('modal-open');
        }

        // Restore focus
        if (previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus();
        }

        // Clean up
        this.activeModals.delete(modalId);

        // Trigger event
        const event = new CustomEvent('modalHide', {
            detail: { modalId, modal }
        });
        modal.dispatchEvent(event);

        return true;
    }

    /**
     * Toggle modal
     */
    toggle(modalId, options = {}) {
        if (this.isActive(modalId)) {
            return this.hide(modalId);
        } else {
            return this.show(modalId, options);
        }
    }

    /**
     * Check if modal is active
     */
    isActive(modalId) {
        return this.activeModals.has(modalId);
    }

    /**
     * Hide all modals
     */
    hideAll() {
        const modalIds = Array.from(this.activeModals.keys());
        modalIds.forEach(id => this.hide(id));
    }

    /**
     * Create dynamic modal
     */
    create(options = {}) {
        const {
            id = `modal_${Date.now()}`,
            title = 'Modal',
            content = '',
            size = 'medium',
            closable = true,
            backdrop = true,
            keyboard = true,
            buttons = []
        } = options;

        // Create modal element
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = `modal-overlay ${size}`;
        
        let buttonsHtml = '';
        if (buttons.length > 0) {
            buttonsHtml = `
                <div class="modal-footer">
                    ${buttons.map(btn => 
                        `<button class="btn btn-${btn.type || 'secondary'}" data-action="${btn.action || 'close'}">${btn.text}</button>`
                    ).join('')}
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    ${closable ? '<button class="modal-close" data-modal="' + id + '">&times;</button>' : ''}
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${buttonsHtml}
            </div>
        `;

        // Add to DOM
        document.body.appendChild(modal);

        // Setup button handlers
        buttons.forEach(btn => {
            const button = modal.querySelector(`[data-action="${btn.action || 'close'}"]`);
            if (button) {
                button.addEventListener('click', () => {
                    if (btn.callback) {
                        const result = btn.callback();
                        if (result !== false) {
                            this.hide(id);
                        }
                    } else {
                        this.hide(id);
                    }
                });
            }
        });

        return {
            id,
            element: modal,
            show: () => this.show(id, { backdrop, keyboard }),
            hide: () => this.hide(id),
            destroy: () => {
                this.hide(id);
                modal.remove();
            }
        };
    }

    /**
     * Setup close handlers for modal
     */
    setupCloseHandlers(modal, modalId) {
        // Close button
        const closeButtons = modal.querySelectorAll(`[data-modal="${modalId}"], .modal-close`);
        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.hide(modalId);
            });
        });

        // Backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                const modalData = this.activeModals.get(modalId);
                if (modalData && modalData.options.backdrop !== false) {
                    this.hide(modalId);
                }
            }
        });
    }

    /**
     * Focus management
     */
    focusModal(modal) {
        // Find first focusable element
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        // Trap focus within modal
        this.trapFocus(modal, focusableElements);
    }

    /**
     * Trap focus within modal
     */
    trapFocus(modal, focusableElements) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        modal.addEventListener('keydown', handleTabKey);

        // Store handler for cleanup
        modal._focusTrapHandler = handleTabKey;
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalStack.length > 0) {
                const topModalId = this.modalStack[this.modalStack.length - 1];
                const modalData = this.activeModals.get(topModalId);
                
                if (modalData && modalData.options.keyboard !== false) {
                    this.hide(topModalId);
                }
            }
        });

        // Handle existing modals on page load
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeExistingModals();
        });
    }

    /**
     * Initialize existing modals in DOM
     */
    initializeExistingModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        
        modals.forEach(modal => {
            const modalId = modal.id;
            if (!modalId) return;

            // Setup close handlers
            this.setupCloseHandlers(modal, modalId);

            // Setup triggers
            const triggers = document.querySelectorAll(`[data-modal="${modalId}"]`);
            triggers.forEach(trigger => {
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.show(modalId);
                });
            });
        });
    }

    /**
     * Setup global methods
     */
    setupGlobalMethods() {
        window.showModal = (modalId, options) => this.show(modalId, options);
        window.hideModal = (modalId) => this.hide(modalId);
        window.toggleModal = (modalId, options) => this.toggle(modalId, options);
        window.createModal = (options) => this.create(options);
    }
}

// Image modal component
class ImageModal {
    constructor() {
        this.modal = null;
        this.currentIndex = 0;
        this.images = [];
        this.init();
    }

    init() {
        this.createModal();
        this.setupImageClickHandlers();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'image-modal-overlay';
        this.modal.innerHTML = `
            <div class="image-modal">
                <button class="image-modal-close">&times;</button>
                <button class="image-modal-prev">‹</button>
                <button class="image-modal-next">›</button>
                <div class="image-modal-content">
                    <img class="image-modal-img" src="" alt="">
                    <div class="image-modal-caption"></div>
                </div>
                <div class="image-modal-counter"></div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Event listeners
        this.modal.querySelector('.image-modal-close').addEventListener('click', () => this.hide());
        this.modal.querySelector('.image-modal-prev').addEventListener('click', () => this.prev());
        this.modal.querySelector('.image-modal-next').addEventListener('click', () => this.next());
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (this.modal.classList.contains('active')) {
                switch (e.key) {
                    case 'Escape':
                        this.hide();
                        break;
                    case 'ArrowLeft':
                        this.prev();
                        break;
                    case 'ArrowRight':
                        this.next();
                        break;
                }
            }
        });
    }

    show(images, startIndex = 0) {
        this.images = Array.isArray(images) ? images : [images];
        this.currentIndex = startIndex;
        
        this.updateImage();
        this.modal.classList.add('active');
        document.body.classList.add('modal-open');
    }

    hide() {
        this.modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }

    next() {
        if (this.images.length > 1) {
            this.currentIndex = (this.currentIndex + 1) % this.images.length;
            this.updateImage();
        }
    }

    prev() {
        if (this.images.length > 1) {
            this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
            this.updateImage();
        }
    }

    updateImage() {
        const image = this.images[this.currentIndex];
        const img = this.modal.querySelector('.image-modal-img');
        const caption = this.modal.querySelector('.image-modal-caption');
        const counter = this.modal.querySelector('.image-modal-counter');

        if (typeof image === 'string') {
            img.src = image;
            caption.textContent = '';
        } else {
            img.src = image.src;
            caption.textContent = image.caption || '';
        }

        // Update counter
        if (this.images.length > 1) {
            counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
            counter.style.display = 'block';
        } else {
            counter.style.display = 'none';
        }

        // Show/hide navigation
        const prevBtn = this.modal.querySelector('.image-modal-prev');
        const nextBtn = this.modal.querySelector('.image-modal-next');
        
        if (this.images.length > 1) {
            prevBtn.style.display = 'block';
            nextBtn.style.display = 'block';
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }
    }

    setupImageClickHandlers() {
        // Auto-setup for images with data-modal="image"
        document.addEventListener('click', (e) => {
            const img = e.target.closest('[data-modal="image"]');
            if (img) {
                e.preventDefault();
                
                // Check if part of a gallery
                const gallery = img.closest('[data-gallery]');
                if (gallery) {
                    const galleryImages = Array.from(gallery.querySelectorAll('[data-modal="image"]'));
                    const images = galleryImages.map(img => ({
                        src: img.src || img.href,
                        caption: img.alt || img.title
                    }));
                    const index = galleryImages.indexOf(img);
                    this.show(images, index);
                } else {
                    this.show([{
                        src: img.src || img.href,
                        caption: img.alt || img.title
                    }]);
                }
            }
        });
    }
}

// Initialize managers
const modalManager = new ModalManager();
const imageModal = new ImageModal();

// Export components
window.modalManager = modalManager;
window.imageModal = imageModal;

// Add CSS for modals
const modalStyles = `
<style>
.modal-open {
    overflow: hidden;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    backdrop-filter: blur(4px);
    padding: 1rem;
}

.modal-overlay.active {
    opacity: 1;
    visibility: visible;
}

.modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    transform: scale(0.9) translateY(20px);
    transition: transform 0.3s ease;
}

.modal-overlay.active .modal {
    transform: scale(1) translateY(0);
}

.modal.small { max-width: 400px; }
.modal.medium { max-width: 600px; }
.modal.large { max-width: 800px; }
.modal.full { max-width: 95vw; max-height: 95vh; }

.modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-secondary);
}

.modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-muted);
    transition: color 0.2s;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
}

.modal-close:hover {
    color: var(--text-primary);
    background: var(--gray-100);
}

.modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    max-height: 60vh;
}

.modal-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    background: var(--bg-secondary);
}

.image-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1060;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.image-modal-overlay.active {
    opacity: 1;
    visibility: visible;
}

.image-modal {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-modal-content {
    text-align: center;
}

.image-modal-img {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.image-modal-caption {
    color: white;
    margin-top: 1rem;
    font-size: 1rem;
    max-width: 600px;
}

.image-modal-close {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-modal-close:hover {
    background: rgba(0, 0, 0, 0.7);
}

.image-modal-prev,
.image-modal-next {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-modal-prev {
    left: 20px;
}

.image-modal-next {
    right: 20px;
}

.image-modal-prev:hover,
.image-modal-next:hover {
    background: rgba(0, 0, 0, 0.7);
}

.image-modal-counter {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
}

@media (max-width: 768px) {
    .modal-overlay {
        padding: 0.5rem;
    }
    
    .modal {
        max-width: none;
        width: 100%;
        margin: 0;
    }
    
    .modal-header,
    .modal-body,
    .modal-footer {
        padding: 1rem;
    }
    
    .image-modal-prev,
    .image-modal-next {
        width: 40px;
        height: 40px;
        font-size: 1.25rem;
    }
    
    .image-modal-prev {
        left: 10px;
    }
    
    .image-modal-next {
        right: 10px;
    }
    
    .image-modal-close {
        top: 10px;
        right: 10px;
        width: 35px;
        height: 35px;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', modalStyles);