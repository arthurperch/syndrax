/**
 * Syndrax LLC - Enterprise Website JavaScript
 * Navigation, animations, and interactive features
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // Element References
    // =========================================
    const navbar = document.getElementById('navbar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    const contactForm = document.getElementById('contactForm');
    const fadeElements = document.querySelectorAll('.fade-in');

    // =========================================
    // Navbar Scroll Effect
    // =========================================
    const handleNavbarScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleNavbarScroll);
    handleNavbarScroll(); // Initial check

    // =========================================
    // Mobile Menu Toggle
    // =========================================
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navLinks.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close mobile menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navbar.contains(e.target) && navLinks.classList.contains('active')) {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Close mobile menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // =========================================
    // Smooth Scroll for Anchor Links
    // =========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            if (targetId === '#' || targetId === '') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                const navbarHeight = navbar ? navbar.offsetHeight : 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // =========================================
    // Scroll Animations (Intersection Observer)
    // =========================================
    if (fadeElements.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        fadeElements.forEach(element => {
            observer.observe(element);
        });
    }

    // =========================================
    // Contact Form Handler
    // =========================================
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            // Validation
            if (!name || !email || !message) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            
            // Get submit button
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Show loading state
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';
            
            // Simulate form submission (no backend)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Success
            showNotification('Thank you for your message! We\'ll get back to you within 24-48 hours.', 'success');
            contactForm.reset();
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.opacity = '';
        });
    }

    // =========================================
    // Notification System
    // =========================================
    function showNotification(message, type = 'success') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Close notification">&times;</button>
        `;
        
        // Styles
        const bgColor = type === 'success' ? '#10b981' : '#ef4444';
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            max-width: 400px;
            padding: 18px 24px;
            padding-right: 48px;
            background: ${bgColor};
            color: white;
            border-radius: 12px;
            font-family: 'Inter', sans-serif;
            font-size: 0.95rem;
            font-weight: 500;
            line-height: 1.5;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            animation: slideInNotification 0.4s ease;
        `;
        
        // Close button styles
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.style.cssText = `
            position: absolute;
            top: 50%;
            right: 16px;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.2s;
            line-height: 1;
            padding: 0;
        `;
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.opacity = '1';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.opacity = '0.8';
        });
        
        closeBtn.addEventListener('click', () => {
            removeNotification(notification);
        });
        
        // Add animation keyframes
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInNotification {
                    from {
                        transform: translateX(100%) translateY(0);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0) translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutNotification {
                    from {
                        transform: translateX(0) translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%) translateY(0);
                        opacity: 0;
                    }
                }
                
                @media (max-width: 480px) {
                    .notification {
                        left: 16px !important;
                        right: 16px !important;
                        max-width: none !important;
                        bottom: 16px !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 6 seconds
        setTimeout(() => {
            removeNotification(notification);
        }, 6000);
    }
    
    function removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutNotification 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }

    // =========================================
    // Active Navigation Link Indicator
    // =========================================
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinksItems = document.querySelectorAll('.nav-links a');
    
    navLinksItems.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    // =========================================
    // Parallax Effect for Hero Section (subtle)
    // =========================================
    const heroGradientOrbs = document.querySelectorAll('.hero-gradient-orb');
    
    if (heroGradientOrbs.length > 0 && window.innerWidth > 768) {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrolled = window.pageYOffset;
                    heroGradientOrbs.forEach((orb, index) => {
                        const speed = index === 0 ? 0.3 : 0.2;
                        orb.style.transform = `translateX(-50%) translateY(${scrolled * speed}px)`;
                    });
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // =========================================
    // Keyboard Accessibility
    // =========================================
    document.addEventListener('keydown', (e) => {
        // Allow Enter or Space to activate links and buttons
        if (e.key === 'Enter' || e.key === ' ') {
            const activeElement = document.activeElement;
            if (activeElement.tagName === 'A' || activeElement.tagName === 'BUTTON') {
                // Native behavior handles this
            }
        }
    });

    // =========================================
    // Reduced Motion Support
    // =========================================
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
        // Disable animations for users who prefer reduced motion
        document.documentElement.style.setProperty('--transition', '0s');
        document.documentElement.style.setProperty('--transition-fast', '0s');
        document.documentElement.style.setProperty('--transition-slow', '0s');
        
        // Make fade-in elements visible immediately
        fadeElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }

    // =========================================
    // Console Welcome Message
    // =========================================
    console.log('%c🚀 Syndrax LLC', 'font-size: 24px; font-weight: bold; color: #3b82f6;');
    console.log('%cEnterprise Technology. Engineered for Scale.', 'font-size: 14px; color: #94a3b8;');
    console.log('%chttps://syndrax.io', 'font-size: 12px; color: #06b6d4;');
});
