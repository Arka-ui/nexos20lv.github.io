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
    initReadingProgress
} from './modules/ui-effects.js';
import { initScrollAnimations } from './modules/scroll-animations.js';
import { initLazyImages } from './modules/lazy-images.js';
import { initWebVitals } from './modules/web-vitals.js';

document.addEventListener('DOMContentLoaded', () => {
    // Basic clickjacking defense when served without strict headers.
    if (window.self !== window.top) {
        window.top.location = window.self.location;
    }

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

    function t(key) {
        return getNested(i18n[currentLang], key) ?? getNested(i18n[fallbackLang], key) ?? key;
    }

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
            // Basic sanitization for trusted but dynamic content
            element.innerHTML = raw.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
        });

        document.querySelectorAll('[data-i18n-content]').forEach((element) => {
            element.setAttribute('content', t(element.dataset.i18nContent));
        });

        document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
            element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
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
    initContactForm({ config, t });
    runWhenIdle(() => initTerminal(), 2200);

    initReadingProgress();

    console.log('System Initialized: Ultra Modern Portfolio V3');
});
