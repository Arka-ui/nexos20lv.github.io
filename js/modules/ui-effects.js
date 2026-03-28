/**
 * @module ui-effects
 * @description Visual effects: loader animation, custom cursor, scroll reveal,
 * parallax motion, card tilt, sticky header, and reading progress bar.
 */

/**
 * Initializes and animates the loading screen with progress bar and log entries.
 * @param {Function} t - Translation function for loader messages.
 */
export function initLoader(t) {
    const loader = document.getElementById('loader');
    const logsContainer = document.getElementById('loader-logs');
    const progressBar = document.querySelector('.loader-bar');

    if (!loader || !logsContainer || !progressBar) return;

    const logKeys = ['kernel', 'mem', 'network', 'mesh', 'experience', 'projects', 'supabase', 'database', 'i18n', 'ready'];
    const totalLogs = logKeys.length;

    (async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));

        for (let i = 0; i < totalLogs; i += 1) {
            const key = logKeys[i];
            const logContent = t(`loader.${key}`);

            const line = document.createElement('div');
            line.className = 'terminal-line';
            line.textContent = logContent;
            logsContainer.appendChild(line);

            const progress = ((i + 1) / totalLogs) * 100;
            progressBar.style.width = `${progress}%`;

            await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 50));
        }

        await new Promise((resolve) => setTimeout(resolve, 300));
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 800);
    })();
}

/**
 * Initializes custom cursor dot and ring elements for fine-pointer devices.
 * @returns {{ dot: HTMLElement|null, ring: HTMLElement|null }}
 */
export function initCustomCursor() {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');

    if (dot && window.matchMedia('(pointer: fine)').matches && !document.body.classList.contains('native-cursor')) {
        let mx = 0;
        let my = 0;

        document.addEventListener('mousemove', (event) => {
            mx = event.clientX;
            my = event.clientY;
        });

        const animate = () => {
            dot.style.left = `${mx}px`;
            dot.style.top = `${my}px`;
            requestAnimationFrame(animate);
        };

        animate();
    }

    return { dot, ring };
}

/**
 * Observes elements with .reveal class and marks navigation links as active during scroll.
 */
export function initScrollRevealAndNavSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    const reveals = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    reveals.forEach((element) => revealObserver.observe(element));

    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPos = window.scrollY + 150;

        sections.forEach((section) => {
            if (scrollPos >= section.offsetTop) {
                current = section.getAttribute('id') || '';
            }
        });

        navLinks.forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

/**
 * Applies parallax, stagger animations, and motion effects when not in perf mode.
 */
export function initMotionEnhancements() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('perf-mode')) {
        return;
    }

    document.body.classList.add('motion-ready');

    const heroRevealItems = document.querySelectorAll('.hero .reveal');
    heroRevealItems.forEach((element, index) => {
        element.style.setProperty('--reveal-order', String(index));
    });

    const staggerGroups = [
        '.carousel-item',
        '.contact-social-link',
        '.timeline-item'
    ];

    const staggerItems = [];
    staggerGroups.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
            element.classList.add('motion-stagger');
            staggerItems.push(element);
        });
    });

    const staggerObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('motion-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    staggerItems.forEach((element, index) => {
        element.style.setProperty('--stagger-index', String(index % 8));
        staggerObserver.observe(element);
    });

    if (!window.matchMedia('(pointer: fine)').matches) return;

    const heroContent = document.querySelector('.hero-content');
    if (!heroContent) return;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const smoothParallax = () => {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        heroContent.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        requestAnimationFrame(smoothParallax);
    };

    document.addEventListener('mousemove', (event) => {
        const xRatio = (event.clientX / window.innerWidth) - 0.5;
        const yRatio = (event.clientY / window.innerHeight) - 0.5;
        targetX = xRatio * 10;
        targetY = yRatio * 6;
    });

    smoothParallax();
}

/**
 * Adds 3D tilt transform effect to cards on mousemove for fine-pointer devices.
 */
export function initTiltEffect() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const cards = document.querySelectorAll('.card-3d');
    cards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
        });

        card.addEventListener('mousemove', (event) => {
            const rect = card.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = 'all 0.5s ease';
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
}

/**
 * Adds 'scrolled' class to header when page scrolls past a threshold.
 */
export function initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/**
 * Updates reading progress bar width based on page scroll position.
 */
export function initReadingProgress() {
    const progressBar = document.getElementById('reading-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = `${scrolled}%`;
    });
}
