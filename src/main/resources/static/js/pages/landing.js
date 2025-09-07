/**
 * Landing Page JavaScript
 * Handles landing page interactions and animations
 */

class LandingPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupAnimations();
        this.setupInteractions();
        this.checkAuthentication();
    }

    /**
     * Setup page animations
     */
    setupAnimations() {
        // Animate hero content on load
        this.animateHeroContent();
        
        // Setup scroll animations
        this.setupScrollAnimations();
        
        // Animate feature cards
        this.animateFeatureCards();
    }

    /**
     * Animate hero content
     */
    animateHeroContent() {
        const heroTitle = document.querySelector('.hero-title');
        const heroDescription = document.querySelector('.hero-description');
        const heroActions = document.querySelector('.hero-actions');
        const heroVisual = document.querySelector('.hero-visual');

        // Stagger animations
        const elements = [heroTitle, heroDescription, heroActions, heroVisual];
        
        elements.forEach((element, index) => {
            if (element) {
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                element.style.transition = 'all 0.6s ease';
                
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, index * 200);
            }
        });
    }

    /**
     * Setup scroll animations
     */
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animateElements = document.querySelectorAll('.features, .feature-card');
        animateElements.forEach(el => {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
        });
    }

    /**
     * Animate feature cards
     */
    animateFeatureCards() {
        const featureCards = document.querySelectorAll('.feature-card');
        
        featureCards.forEach((card, index) => {
            // Add hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
            
            // Initial animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 800 + (index * 150));
        });
    }

    /**
     * Setup page interactions
     */
    setupInteractions() {
        // Smooth scrolling for anchor links
        this.setupSmoothScrolling();
        
        // Button interactions
        this.setupButtonInteractions();
        
        // Chat preview animation
        this.setupChatPreview();
    }

    /**
     * Setup smooth scrolling
     */
    setupSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Setup button interactions
     */
    setupButtonInteractions() {
        const buttons = document.querySelectorAll('.btn');
        
        buttons.forEach(button => {
            // Add ripple effect
            button.addEventListener('click', (e) => {
                this.createRippleEffect(e, button);
            });
            
            // Add loading state for navigation buttons
            if (button.href && (button.href.includes('login') || button.href.includes('register'))) {
                button.addEventListener('click', (e) => {
                    if (!e.defaultPrevented) {
                        window.showButtonLoading(button, 'Loading...');
                    }
                });
            }
        });
    }

    /**
     * Create ripple effect on button click
     */
    createRippleEffect(event, button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Setup chat preview animation
     */
    setupChatPreview() {
        const chatPreview = document.querySelector('.chat-preview');
        if (!chatPreview) return;

        const bubbles = chatPreview.querySelectorAll('.chat-bubble');
        
        // Animate chat bubbles in sequence
        bubbles.forEach((bubble, index) => {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translateY(20px) scale(0.9)';
            bubble.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                bubble.style.opacity = '1';
                bubble.style.transform = 'translateY(0) scale(1)';
            }, 1500 + (index * 800));
        });

        // Add typing animation
        this.addTypingAnimation(chatPreview);
    }

    /**
     * Add typing animation to chat preview
     */
    addTypingAnimation(chatPreview) {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-bubble chat-bubble-received typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        // Show typing indicator periodically
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance
                chatPreview.appendChild(typingIndicator);
                
                setTimeout(() => {
                    if (typingIndicator.parentNode) {
                        typingIndicator.remove();
                    }
                }, 2000);
            }
        }, 5000);
    }

    /**
     * Check if user is already authenticated
     */
    checkAuthentication() {
        if (window.authStorage && window.authStorage.isAuthenticated()) {
            // User is already logged in, show different CTA
            this.updateAuthenticatedState();
        }
    }

    /**
     * Update UI for authenticated users
     */
    updateAuthenticatedState() {
        const heroActions = document.querySelector('.hero-actions');
        const navActions = document.querySelector('.nav');
        
        if (heroActions) {
            heroActions.innerHTML = `
                <a href="/chat.html" class="btn btn-primary btn-large">Go to Chat</a>
                <button class="btn btn-outline btn-large" id="logoutBtn">Logout</button>
            `;
            
            // Setup logout functionality
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', this.handleLogout.bind(this));
            }
        }
        
        if (navActions) {
            const user = window.authStorage.getUser();
            navActions.innerHTML = `
                <span class="user-greeting">Welcome, ${user?.username || 'User'}!</span>
                <a href="/chat.html" class="btn btn-primary">Chat</a>
            `;
        }
    }

    /**
     * Handle user logout
     */
    async handleLogout() {
        try {
            window.showLoading('Logging out...');
            
            // Call logout API
            await window.api.logout();
            
            // Clear local storage
            window.authStorage.logout();
            
            // Reload page to reset state
            window.location.reload();
            
        } catch (error) {
            console.error('Logout error:', error);
            window.showError('Failed to logout. Please try again.');
        } finally {
            window.hideLoading();
        }
    }
}

// Parallax effect for hero section
class ParallaxEffect {
    constructor() {
        this.elements = [];
        this.init();
    }

    init() {
        // Find parallax elements
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallax) || 0.5;
            this.elements.push({ element, speed });
        });

        // Setup scroll listener
        if (this.elements.length > 0) {
            this.setupScrollListener();
        }
    }

    setupScrollListener() {
        let ticking = false;

        const updateParallax = () => {
            const scrollTop = window.pageYOffset;
            
            this.elements.forEach(({ element, speed }) => {
                const yPos = -(scrollTop * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
            
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        });
    }
}

// Initialize landing page
document.addEventListener('DOMContentLoaded', () => {
    new LandingPage();
    new ParallaxEffect();
});

// Add CSS for landing page animations
const landingStyles = `
<style>
.animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s ease;
}

.animate-on-scroll.animate-in {
    opacity: 1;
    transform: translateY(0);
}

.chat-preview {
    position: relative;
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    margin: 0 auto;
}

.chat-bubble {
    background: white;
    padding: 0.75rem 1rem;
    border-radius: 18px;
    margin-bottom: 0.75rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
    max-width: 80%;
    word-wrap: break-word;
}

.chat-bubble-sent {
    background: var(--primary-color);
    color: white;
    margin-left: auto;
    border-bottom-right-radius: 6px;
}

.chat-bubble-received {
    background: white;
    color: var(--text-primary);
    margin-right: auto;
    border-bottom-left-radius: 6px;
}

.chat-bubble p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.4;
}

.timestamp {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-top: 0.25rem;
    display: block;
}

.typing-indicator {
    background: white !important;
    padding: 1rem !important;
}

.typing-dots {
    display: flex;
    gap: 0.25rem;
    align-items: center;
}

.typing-dots span {
    width: 6px;
    height: 6px;
    background: var(--gray-400);
    border-radius: 50%;
    animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing {
    0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
    }
    30% {
        transform: translateY(-10px);
        opacity: 1;
    }
}

@keyframes ripple {
    to {
        transform: scale(2);
        opacity: 0;
    }
}

.feature-card {
    transition: all 0.3s ease;
    cursor: pointer;
}

.feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    display: block;
}

.user-greeting {
    color: var(--text-primary);
    font-weight: 500;
    margin-right: 1rem;
}

@media (max-width: 768px) {
    .chat-preview {
        padding: 1.5rem;
        max-width: 100%;
    }
    
    .user-greeting {
        display: none;
    }
}

@media (prefers-reduced-motion: reduce) {
    .animate-on-scroll,
    .chat-bubble,
    .feature-card {
        animation: none !important;
        transition: none !important;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', landingStyles);