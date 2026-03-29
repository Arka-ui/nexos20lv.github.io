/**
 * @module app
 * @description Main application bootstrap. Initializes all modules in dependency order:
 * 1. i18n + language switching
 * 2. Loader animation + performance/accessibility modes
 * 3. Scroll, lazy-loading, web vitals, custom cursor
 * 4. Discord realtime + visitor count
 * 5. Projects UI (GitHub stats deferred)
 * 6. Terminal + project search (deferred via runWhenIdle)
 * 7. Contact form + quick guided tour
 *
 * Entry: js/main.js → js/app.js
 * Heavy initialization is deferred with runWhenIdle() to keep TTI low.
 */

import { i18n } from './i18n.js';
import { config } from './config.js';
import {
    runWhenIdle,
    shouldAutoEnablePerfMode,
    initPerformanceMode,
    initAccessibilityMode,
    initUltraCompactMode
} from './modules/perf-mode.js';
import { createOverlayManager } from './modules/modal.js';
import { getBackoffDelay } from './modules/retry.js';
import { LANGUAGE_COLORS } from './modules/github-colors.js';
import { initDiscordRealtime } from './modules/discord-realtime.js';
import { initTerminalUI } from './modules/terminal-ui.js';
import { initSkillsModal } from './modules/skills-modal.js';
import { initContactForm } from './modules/contact-form.js';
import { initProjectSearchUI } from './modules/project-search-ui.js';
import { initProjectsUI } from './modules/projects-ui.js';
import {
    initLoader,
    initCustomCursor,
    initScrollRevealAndNavSpy,
    initMotionEnhancements,
    initTiltEffect,
    initHeaderScroll,
    initReadingProgress,
    initHamburgerMenu,
    initTimelineCollapse,
    initDiscordCardMobile,
    initBackToTop
} from './modules/ui-effects.js';
import { initScrollAnimations } from './modules/scroll-animations.js';
import { initLazyImages } from './modules/lazy-images.js';
import { initWebVitals } from './modules/web-vitals.js';

document.addEventListener('DOMContentLoaded', () => {
    // Basic clickjacking defense. try/catch needed: cross-origin sandboxed iframes
    // throw SecurityError on .top access. frame-ancestors 'none' in CSP is the real guard.
    try {
        if (window.self !== window.top) {
            window.top.location = window.self.location;
        }
    } catch (_) { /* cross-origin frame — CSP frame-ancestors handles this */ }

    // i18n
    const langButtons = document.querySelectorAll('.lang-btn');
    const getNested = (object, path) => path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), object);
    const fallbackLang = 'fr';
    let currentLang = localStorage.getItem('portfolio-lang');
    if (!currentLang || !i18n[currentLang]) currentLang = fallbackLang;
    let lastDiscordStatus = null;
    let liveVisitorsCount = null;
    const { openOverlay, closeOverlay } = createOverlayManager();
    let projectsUI = null;

    /**
     * Updates the hero live visitor counter element.
     * @param {number} count - Non-integer or negative values show loading state.
     */
    function renderLiveVisitorsCount(count) {
        const visitorsText = document.getElementById('live-visitors-text');
        if (!visitorsText) return;

        if (!Number.isInteger(count) || count < 0) {
            visitorsText.textContent = t('visitors.loading');
            return;
        }

        const key = count > 1 ? 'visitors.plural' : 'visitors.singular';
        visitorsText.textContent = t(key).replace('{count}', count);
    }

    /**
     * Translates a dot-notation i18n key. Falls back: currentLang → fr → key itself.
     * @param {string} key - e.g. 'hero.title.prefix'
     * @returns {string}
     */
    function t(key) {
        return getNested(i18n[currentLang], key) ?? getNested(i18n[fallbackLang], key) ?? key;
    }

    /**
     * Applies a language to all i18n-bound DOM elements and persists the choice.
     * Handles: textContent, sanitized HTML, content/aria-label/placeholder attributes.
     * @param {string} lang - 'fr' | 'en'
     */
    function applyLanguage(lang) {
        if (!i18n[lang]) return;

        currentLang = lang;
        localStorage.setItem('portfolio-lang', currentLang);
        document.documentElement.lang = currentLang;

        langButtons.forEach((button) => {
            button.classList.toggle('active', button.dataset.lang === currentLang);
        });

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            element.textContent = t(element.dataset.i18n);
        });

        document.querySelectorAll('[data-i18n-html]').forEach((element) => {
            const raw = t(element.dataset.i18nHtml);
            // DOM-based sanitizer: only allows safe tags and attributes.
            // <template>.content is an inert fragment — no script execution or network requests.
            const ALLOWED_TAGS = new Set(['STRONG', 'EM', 'SPAN', 'BR', 'A']);
            const ALLOWED_ATTRS = { A: ['href'] };

            const tpl = document.createElement('template');
            tpl.innerHTML = raw;
            const frag = tpl.content;

            frag.querySelectorAll('*').forEach((node) => {
                if (!ALLOWED_TAGS.has(node.tagName)) {
                    node.replaceWith(...node.childNodes);
                    return;
                }
                Array.from(node.attributes).forEach((attr) => {
                    const allowed = ALLOWED_ATTRS[node.tagName] ?? [];
                    if (!allowed.includes(attr.name)) node.removeAttribute(attr.name);
                });

                // Block javascript: and data: URIs in href
                if (node.tagName === 'A' && node.hasAttribute('href')) {
                    const scheme = node.getAttribute('href').trimStart().toLowerCase();
                    if (scheme.startsWith('javascript:') || scheme.startsWith('data:')) {
                        node.removeAttribute('href');
                    }
                }
            });

            element.replaceChildren(frag);
        });

        document.querySelectorAll('[data-i18n-content]').forEach((element) => {
            element.setAttribute('content', t(element.dataset.i18nContent));
        });

        document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
            element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
            element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
        });

        if (lastDiscordStatus) {
            const statusNode = document.getElementById('discord-status-text');
            if (statusNode) {
                statusNode.textContent = t(`discord.status.${lastDiscordStatus}`);
            }
        }

        renderLiveVisitorsCount(liveVisitorsCount);
        projectsUI?.applyProjectStatusBadges();
        projectsUI?.refreshOpenModal();
    }

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    function setTourFocus(target, sections) {
        sections.forEach((section) => section.classList.remove('quick-tour-focus'));
        target?.classList.add('quick-tour-focus');
    }

    function createTourIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'quick-tour-indicator';
        indicator.className = 'quick-tour-indicator';
        indicator.setAttribute('role', 'status');
        indicator.setAttribute('aria-live', 'polite');
        indicator.innerHTML = `
            <div class="quick-tour-head">
                <span class="quick-tour-text"></span>
                <button type="button" class="quick-tour-skip-btn"></button>
            </div>
            <div class="quick-tour-progress">
                <div class="quick-tour-progress-fill"></div>
            </div>
        `;
        return indicator;
    }

    function waitWithSkip(ms, tourState) {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                tourState.skipWait = null;
                resolve();
            }, ms);

            tourState.skipWait = () => {
                clearTimeout(timer);
                tourState.skipWait = null;
                resolve();
            };
        });
    }

    /**
     * Sets up the 30-second portfolio tour button.
     * Tour: projects section → 3 featured modals → contact section.
     * Skip button resolves the current wait promise immediately.
     */
    function initQuickGuidedTour() {
        const quickTourBtn = document.getElementById('quick-tour-btn');
        const projectsSection = document.getElementById('projects');
        const contactSection = document.getElementById('contact');
        if (!quickTourBtn || !projectsSection || !contactSection) return;

        const tourSections = [projectsSection, contactSection];
        const tourIndicator = createTourIndicator();
        const tourText = tourIndicator.querySelector('.quick-tour-text');
        const tourProgress = tourIndicator.querySelector('.quick-tour-progress-fill');
        const tourSkipBtn = tourIndicator.querySelector('.quick-tour-skip-btn');
        const tourState = { skipWait: null };
        document.body.appendChild(tourIndicator);

        const setStep = (stepLabel, stepIndex, totalSteps = 3) => {
            if (tourText) {
                tourText.textContent = `${t('hero.cta.tourRunning')} ${stepLabel}`;
            }
            if (tourSkipBtn) {
                tourSkipBtn.textContent = t('hero.tour.skip');
            }
            if (tourProgress) {
                const ratio = Math.max(0, Math.min(1, stepIndex / totalSteps));
                tourProgress.style.width = `${Math.round(ratio * 100)}%`;
            }
            tourIndicator.classList.add('visible');
        };

        const closeProjectModalIfOpen = async () => {
            const closeProjectBtn = document.querySelector('#project-modal .close-modal');
            if (closeProjectBtn instanceof HTMLElement) {
                closeProjectBtn.click();
                await wait(260);
            }
        };

        quickTourBtn.addEventListener('click', async () => {
            if (!projectsUI) return;

            quickTourBtn.disabled = true;
            const quickTourText = quickTourBtn.querySelector('span');
            const originalText = quickTourText ? quickTourText.textContent : '';
            if (quickTourText) quickTourText.textContent = t('hero.cta.tourRunning');

            const onSkipClick = () => {
                if (typeof tourState.skipWait === 'function') {
                    tourState.skipWait();
                }
            };
            tourSkipBtn?.addEventListener('click', onSkipClick);

            try {
                setStep(t('hero.tour.step1'), 1);
                setTourFocus(projectsSection, tourSections);
                projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                await waitWithSkip(1000, tourState);

                setStep(t('hero.tour.step2'), 2);
                const featuredProjectIndexes = [0, 4, 7];
                for (const index of featuredProjectIndexes) {
                    await projectsUI.openModal(index);
                    await waitWithSkip(1450, tourState);
                    await closeProjectModalIfOpen();
                    await waitWithSkip(160, tourState);
                }

                await waitWithSkip(320, tourState);
                setStep(t('hero.tour.step3'), 3);
                setTourFocus(contactSection, tourSections);
                contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                await waitWithSkip(900, tourState);

                const contactNameInput = document.getElementById('contact-name');
                if (contactNameInput instanceof HTMLElement) {
                    contactNameInput.focus({ preventScroll: true });
                }
                await waitWithSkip(600, tourState);
            } finally {
                tourSkipBtn?.removeEventListener('click', onSkipClick);
                quickTourBtn.disabled = false;
                if (quickTourText) quickTourText.textContent = originalText || t('hero.cta.tour');
                tourIndicator.classList.remove('visible');
                if (tourProgress) {
                    tourProgress.style.width = '0%';
                }
                setTourFocus(null, tourSections);
            }
        });
    }

    langButtons.forEach((button) => {
        button.addEventListener('click', () => {
            applyLanguage(button.dataset.lang);
        });
    });

    applyLanguage(currentLang);

    // Core UI effects
    initLoader(t);
    initPerformanceMode(
        document.getElementById('perfToggle'),
        shouldAutoEnablePerfMode(config.perf)
    );
    initAccessibilityMode(document.getElementById('accessibilityToggle'));
    initUltraCompactMode();

    // Performance & Monitoring
    initScrollAnimations();
    initLazyImages();
    initWebVitals();

    const { dot, ring } = initCustomCursor();

    // Feature modules
    initSkillsModal({
        openOverlay,
        closeOverlay,
        dot,
        ring,
        t,
        getCurrentLang: () => currentLang
    });

    initScrollRevealAndNavSpy();
    initMotionEnhancements();
    initTiltEffect();
    initHeaderScroll();

    initDiscordRealtime({
        config,
        t,
        getCurrentLang: () => currentLang,
        getBackoffDelay,
        onStatusChange: (status) => {
            lastDiscordStatus = status;
        },
        onVisitorsCountChange: (count) => {
            liveVisitorsCount = count;
            renderLiveVisitorsCount(liveVisitorsCount);
        }
    });

    projectsUI = initProjectsUI({
        i18n,
        config,
        t,
        getCurrentLang: () => currentLang,
        openOverlay,
        closeOverlay,
        dot,
        ring,
        languageColors: LANGUAGE_COLORS
    });

    const { toggleTerminal, initTerminal } = initTerminalUI({
        openOverlay,
        closeOverlay,
        dot,
        ring,
        applyLanguage
    });

    runWhenIdle(() => initProjectSearchUI({
        i18n,
        getCurrentLang: () => currentLang,
        t,
        openOverlay,
        closeOverlay,
        dot,
        ring,
        openModal: projectsUI.openModal,
        applyLanguage,
        toggleTerminal
    }));

    runWhenIdle(() => projectsUI.initGitHubStats(), 2200);
    runWhenIdle(() => projectsUI.initFeaturedMetrics(), 1800);
    initContactForm({ config, t });
    initQuickGuidedTour();
    runWhenIdle(() => initTerminal(), 2200);

    initReadingProgress();
    initHamburgerMenu();
    initTimelineCollapse();
    initDiscordCardMobile();
    initBackToTop();

    console.log('System Initialized: Ultra Modern Portfolio V3');
});
