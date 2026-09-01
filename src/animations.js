import { animate, stagger, createLayout } from 'animejs';

// ----------------- 1. Navbar & Hero Entry Animations -----------------
export function initHeroAnimations() {
    const nav = document.querySelector('nav.glass-nav');
    if (nav) {
        animate(nav, {
            translateX: ['-50%', '-50%'],
            translateY: [-25, 0],
            opacity: [0, 1],
            duration: 650,
            ease: 'outQuint'
        });
    }

    const heroBadge = document.querySelector('header .inline-flex');
    if (heroBadge) {
        animate(heroBadge, {
            opacity: [0, 1],
            duration: 700,
            delay: 200,
            ease: 'outCubic'
        });
    }

    const heroTexts = document.querySelectorAll('header h1, header p');
    if (heroTexts.length > 0) {
        animate(heroTexts, {
            translateY: [25, 0],
            opacity: [0, 1],
            delay: stagger(100, { start: 300 }),
            duration: 800,
            ease: 'outCubic'
        });
    }

    const heroButtons = document.querySelectorAll('header .flex.gap-4 a, header .flex-col a');
    if (heroButtons.length > 0) {
        animate(heroButtons, {
            opacity: [0, 1],
            delay: stagger(80, { start: 500 }),
            duration: 700,
            ease: 'outCubic'
        });
    }
}

// ----------------- 2. Optimized 60FPS Scroll Reveal -----------------
export function initScrollRevealAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const sectionsToAnimate = [
        { selector: '#formats', targets: '#formats .glass-card' },
        { selector: '#gallery', targets: '#gallery .glass-card' },
        { selector: '#custom-design', targets: '#custom-design .glass-card' },
        { selector: '#pricing', targets: '#pricing .glass-card' },
        { selector: '#quality', targets: '#quality .glass-card' },
        { selector: '#calculator', targets: '#calculator .glass-card' }
    ];

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const config = sectionsToAnimate.find(s => entry.target.matches(s.selector));
                if (config) {
                    const elements = entry.target.querySelectorAll(config.targets.replace(config.selector + ' ', ''));
                    if (elements.length > 0) {
                        animate(elements, {
                            translateY: [30, 0],
                            opacity: [0, 1],
                            delay: stagger(80),
                            duration: 750,
                            ease: 'outCubic'
                        });
                    }
                }
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

    sectionsToAnimate.forEach(s => {
        const el = document.querySelector(s.selector);
        if (el) observer.observe(el);
    });
}

// ----------------- 3. Smooth Sample Cards Entry (Called after samples fetch) -----------------
export function animateSampleCards() {
    const cards = document.querySelectorAll('#samples-grid > div');
    if (!cards || cards.length === 0) return;

    animate(cards, {
        translateY: [25, 0],
        opacity: [0, 1],
        delay: stagger(60),
        duration: 650,
        ease: 'outCubic'
    });
}

// ----------------- 4. Button Micro-Tap Animation -----------------
export function animateButtonTap(element) {
    if (!element) return;
    animate(element, {
        scale: [0.96, 1],
        duration: 250,
        ease: 'outCubic'
    });
}

// ----------------- 5. Anime.js AutoLayout FLIP Engine -----------------
export function createGridLayout(containerSelector) {
    const el = document.querySelector(containerSelector);
    if (!el) return null;
    try {
        return createLayout(el, {
            duration: 550,
            ease: 'outCubic'
        });
    } catch (e) {
        console.warn('Anime.js createLayout init failed:', e);
        return null;
    }
}

// ----------------- 6. Shared Card Selection & Page Transition -----------------
export function smoothPageNavigate(targetUrl, clickedCard) {
    if (!targetUrl) return;
    if (clickedCard) {
        clickedCard.setAttribute('data-clicked', 'true');
        
        // 1. Elevate clicked card into focus
        animate(clickedCard, {
            scale: 1.03,
            duration: 320,
            ease: 'outCubic'
        });

        // 2. Dim other cards and header
        const otherCards = document.querySelectorAll('.glass-card:not([data-clicked="true"])');
        if (otherCards.length > 0) {
            animate(otherCards, {
                opacity: 0.3,
                scale: 0.98,
                duration: 260,
                ease: 'outCubic'
            });
        }

        setTimeout(() => {
            window.location.href = targetUrl;
        }, 260);
    } else {
        window.location.href = targetUrl;
    }
}

// ----------------- 7. Product Detail Page Entrance -----------------
export function initProductPageEntrance() {
    // 1. Main Artwork Showcase Image
    const showcaseFrame = document.querySelector('.art-frame-shadow, #product-image-container');
    if (showcaseFrame) {
        animate(showcaseFrame, {
            scale: [0.93, 1],
            opacity: [0, 1],
            duration: 750,
            ease: 'outCubic'
        });
    }

    // 2. Right Sidebar Detail Elements (Title, Price, Formats, Buttons)
    const detailElements = document.querySelectorAll('main .space-y-6 > div, main .space-y-8 > div');
    if (detailElements.length > 0) {
        animate(detailElements, {
            translateY: [20, 0],
            opacity: [0, 1],
            delay: stagger(60, { start: 120 }),
            duration: 650,
            ease: 'outCubic'
        });
    }
}
