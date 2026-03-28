/**
 * @module project-search-ui
 * @description Full-text project search overlay. Triggered by Ctrl/Cmd+K or search button.
 * Searches project titles and descriptions from i18n data.
 */

/**
 * @param {{ i18n: object, getCurrentLang: Function, t: Function, openOverlay: Function, closeOverlay: Function, dot: HTMLElement, ring: HTMLElement, openModal: Function, applyLanguage: Function, toggleTerminal: Function }} options
 * @returns {void}
 */
export function initProjectSearchUI({
    i18n,
    getCurrentLang,
    t,
    openOverlay,
    closeOverlay,
    dot,
    ring,
    openModal,
    applyLanguage,
    toggleTerminal
}) {
    const searchModal = document.getElementById('search-modal');
    const searchInput = document.getElementById('projects-search');
    const resultsContainer = document.getElementById('search-results');

    if (!searchModal || !searchInput || !resultsContainer) return;

    const toggleSearch = (show, triggerElement) => {
        if (show) {
            if (dot && ring) {
                dot.style.display = 'none';
                ring.style.display = 'none';
            }
            openOverlay(searchModal, triggerElement, () => toggleSearch(false));
            searchInput.value = '';
            searchInput.focus();
            renderSearchResults('');
        } else {
            closeOverlay(searchModal);
            if (dot && ring) {
                dot.style.display = '';
                ring.style.display = '';
            }
        }
    };

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            toggleSearch(!searchModal.classList.contains('open'), document.activeElement);
        }
    });

    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) toggleSearch(false);
    });

    searchInput.addEventListener('input', (e) => {
        renderSearchResults(e.target.value);
    });

    function renderSearchResults(query) {
        resultsContainer.innerHTML = '';
        const q = query.toLowerCase().trim();

        if (q.startsWith('>')) {
            const cmd = q.substring(1).trim();
            renderCommands(cmd);
            return;
        }

        const projects = i18n[getCurrentLang()].projects;

        const matches = Object.keys(projects)
            .filter((key) => !isNaN(key))
            .map((key) => ({ id: key, ...projects[key] }))
            .filter((project) => (
                project.title.toLowerCase().includes(q)
                || project.desc.toLowerCase().includes(q)
                || project.meta.toLowerCase().includes(q)
            ));

        if (matches.length === 0) {
            const noResults = document.createElement('div');
            noResults.style.cssText = 'padding: 2rem; text-align: center; color: var(--text-muted);';
            noResults.textContent = t('search.noResults');
            resultsContainer.appendChild(noResults);
            return;
        }

        matches.forEach((project) => {
            const item = document.createElement('div');
            item.className = 'search-item';
            item.tabIndex = 0;

            const icon = document.createElement('div');
            icon.className = 'search-icon';
            icon.textContent = getProjectIcon(project.id);

            const info = document.createElement('div');
            info.className = 'search-info';

            const title = document.createElement('strong');
            title.textContent = project.title;

            const metaDesc = document.createElement('span');
            metaDesc.textContent = `${project.meta} — ${project.desc}`;

            info.append(title, metaDesc);
            item.append(icon, info);

            item.addEventListener('click', () => {
                toggleSearch(false);
                openModal(parseInt(project.id, 10) - 1, item);
            });
            item.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleSearch(false);
                    openModal(parseInt(project.id, 10) - 1, item);
                }
            });
            resultsContainer.appendChild(item);
        });
    }

    function renderCommands(cmd) {
        const commands = [
            { id: 'about', label: 'Go to About', icon: '👤', action: () => scrollToSection('about') },
            { id: 'experience', label: 'Go to Experience', icon: '💼', action: () => scrollToSection('experience') },
            { id: 'projects', label: 'Go to Projects', icon: '🚀', action: () => scrollToSection('projects') },
            { id: 'contact', label: 'Go to Contact', icon: '📧', action: () => scrollToSection('contact') },
            { id: 'theme', label: 'Toggle High Performance Mode', icon: '⚡', action: () => document.getElementById('perfToggle')?.click() },
            { id: 'fr', label: 'Switch to French', icon: '🇫🇷', action: () => applyLanguage('fr') },
            { id: 'en', label: 'Switch to English', icon: '🇬🇧', action: () => applyLanguage('en') },
            { id: 'terminal', label: 'Open Terminal', icon: '⌨️', action: () => toggleTerminal(true) }
        ];

        const matches = commands.filter((command) => command.id.includes(cmd) || command.label.toLowerCase().includes(cmd));

        if (matches.length === 0) {
            const noResult = document.createElement('div');
            noResult.style.cssText = 'padding: 2rem; text-align: center; color: var(--text-muted);';
            noResult.textContent = `No command found starting with "${cmd}"`;
            resultsContainer.appendChild(noResult);
            return;
        }

        matches.forEach((command) => {
            const item = document.createElement('div');
            item.className = 'search-item';
            item.tabIndex = 0;

            const icon = document.createElement('div');
            icon.className = 'search-icon';
            icon.textContent = command.icon;

            const info = document.createElement('div');
            info.className = 'search-info';

            const label = document.createElement('strong');
            label.textContent = command.label;

            const cmdText = document.createElement('span');
            cmdText.textContent = `Command: >${command.id}`;

            info.append(label, cmdText);
            item.append(icon, info);

            item.addEventListener('click', () => {
                toggleSearch(false);
                command.action();
            });
            item.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleSearch(false);
                    command.action();
                }
            });
            resultsContainer.appendChild(item);
        });
    }

    function scrollToSection(id) {
        const el = document.getElementById(id);
        if (!el) return;

        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }

    function getProjectIcon(id) {
        const icons = { '1': '🎤', '2': '⚔️', '3': '💊', '4': '✨', '5': '🚀', '6': '🗺️', '7': '🏠', '8': '📊' };
        return icons[id] || '📁';
    }
}
