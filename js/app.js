import { ParticleSystem } from './particles.js';
import { i18n } from './i18n.js';
import { config } from './config.js';

document.addEventListener('DOMContentLoaded', () => {

    // 0. i18n (FR default)
    const langButtons = document.querySelectorAll('.lang-btn');
    const getNested = (object, path) => path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), object);
    const fallbackLang = 'fr';
    let currentLang = localStorage.getItem('portfolio-lang');
    if (!currentLang || !i18n[currentLang]) currentLang = fallbackLang;
    let lastDiscordStatus = null;

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

        const modalElement = document.getElementById('project-modal');
        if (modalElement?.classList.contains('open')) {
            openModal(activeIndex);
        }
    }

    langButtons.forEach((button) => {
        button.addEventListener('click', () => {
            applyLanguage(button.dataset.lang);
        });
    });

    applyLanguage(currentLang);

    // 1. Advanced Loader
    const initLoader = async () => {
        const loader = document.getElementById('loader');
        const logsContainer = document.getElementById('loader-logs');
        const progressBar = document.querySelector('.loader-bar');

        if (!loader || !logsContainer || !progressBar) return;

        const logKeys = ['kernel', 'mem', 'network', 'mesh', 'experience', 'projects', 'supabase', 'database', 'i18n', 'ready'];
        const totalLogs = logKeys.length;

        // Initial delay
        await new Promise(r => setTimeout(r, 50));

        for (let i = 0; i < totalLogs; i++) {
            const key = logKeys[i];
            const logContent = t(`loader.${key}`);

            const line = document.createElement('div');
            line.className = 'terminal-line';
            line.textContent = logContent;
            logsContainer.appendChild(line);

            // Update bar
            const progress = ((i + 1) / totalLogs) * 100;
            progressBar.style.width = `${progress}%`;

            // Random processing delay (Optimized speed)
            await new Promise(r => setTimeout(r, 50 + Math.random() * 50));
        }

        // Final delay before reveal
        await new Promise(r => setTimeout(r, 300));
        loader.classList.add('fade-out');
        setTimeout(() => loader.style.display = 'none', 800);
    };

    initLoader();

    // 1.5 High Performance Mode
    const initPerformanceMode = () => {
        const perfToggle = document.getElementById('perfToggle');
        const isPerfMode = localStorage.getItem('perf-mode') === 'true';

        if (isPerfMode) {
            document.body.classList.add('perf-mode');
            perfToggle?.classList.add('active');
        }

        perfToggle?.addEventListener('click', () => {
            const active = document.body.classList.toggle('perf-mode');
            perfToggle.classList.toggle('active', active);
            localStorage.setItem('perf-mode', active);
        });
    };

    initPerformanceMode();

    // 2. Initialize Particles (Disabled for new design)
    // const canvas = document.getElementById('bg-canvas');
    // if (canvas) {
    //     new ParticleSystem('bg-canvas');
    // }

    // 3. Custom Cursor (New Design)
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    let mx = 0, my = 0, rx = 0, ry = 0;

    if (dot && ring && window.matchMedia("(pointer: fine)").matches) {
        document.addEventListener('mousemove', e => {
            mx = e.clientX;
            my = e.clientY;
        });

        function animCursor() {
            dot.style.left = mx + 'px';
            dot.style.top = my + 'px';
            rx += (mx - rx) * 0.12;
            ry += (my - ry) * 0.12;
            ring.style.left = rx + 'px';
            ring.style.top = ry + 'px';
            requestAnimationFrame(animCursor);
        }
        animCursor();
    }

    // 3.5 Scroll Reveal & Navbar Scroll Spy
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    const reveals = document.querySelectorAll('.reveal');

    // Intersection Observer for Reveals
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });
    reveals.forEach(el => revealObserver.observe(el));

    // Scroll Spy for Navbar
    window.addEventListener('scroll', () => {
        let current = "";
        const scrollPos = window.scrollY + 150;

        sections.forEach(section => {
            if (scrollPos >= section.offsetTop) {
                current = section.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${current}`) {
                link.classList.add("active");
            }
        });
    });

    // 4. 3D Tilt Effect (Optimized)
    if (window.matchMedia("(pointer: fine)").matches) {
        const cards = document.querySelectorAll('.card-3d');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                // Remove transition during movement to prevent jitter
                card.style.transition = 'none';
            });

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Max tilt 10 degrees
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                // Restore transition for smooth return
                card.style.transition = 'all 0.5s ease';
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            });
        });
    }

    // 5. Header Scroll
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 6. Lanyard Integration (WebSocket)
    const discordID = '1288079115248992297';
    const avatarImg = document.getElementById('discord-avatar');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('discord-status-text');
    const activityContainer = document.getElementById('discord-activity');

    const colors = {
        online: '#00ff88',
        idle: '#faa61a',
        dnd: '#f04747',
        offline: '#747f8d'
    };

    function connectLanyard() {
        const ws = new WebSocket('wss://api.lanyard.rest/socket');

        ws.onopen = () => {
            // Initialize subscription
            ws.send(JSON.stringify({
                op: 2,
                d: { subscribe_to_id: discordID }
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const { t, d } = data;

            if (t === 'INIT_STATE' || t === 'PRESENCE_UPDATE') {
                updatePresence(d);
            }
        };

        ws.onclose = () => {
            // Reconnect after 5s
            setTimeout(connectLanyard, 5000);
        };
    }

    function updatePresence(data) {
        // Handle sync vs update structure
        const presence = data.activities ? data : data;

        // 1. Update Avatar & Indicator
        if (presence.discord_user) {
            const avatarId = presence.discord_user.avatar;
            avatarImg.src = `https://cdn.discordapp.com/avatars/${discordID}/${avatarId}.png`;
        }

        // Update Global Status Text & Color
        const status = presence.discord_status || 'offline';
        lastDiscordStatus = status;

        if (statusIndicator) {
            statusIndicator.style.backgroundColor = colors[status] || colors.offline;
            statusIndicator.style.boxShadow = `0 0 10px ${colors[status] || colors.offline}`;
        }

        if (statusText) {
            statusText.textContent = t(`discord.status.${status}`);
        }

        // 2. Update Activity
        const spotify = presence.spotify;
        const activities = presence.activities || [];

        // Find a game (type 0) if not spotify
        const game = activities.find(a => a.type === 0);

        if (spotify) {
            renderSpotify(spotify);
        } else if (game) {
            renderGame(game);
        } else {
            renderIdle();
        }

        // 3. Update Status from Supabase (Real-time fallback handles it)
        updateHeroFromJSON();
    }

    // --- Supabase Real-time Sync ---
    const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;

    async function updateHeroFromSupabase() {
        const heroTag = document.getElementById('hero-availability');
        if (!heroTag || !supabaseClient) return;

        // 1. Initial Fetch
        const { data, error } = await supabaseClient
            .from('portfolio_status')
            .select('*')
            .eq('id', 1)
            .single();

        if (data) {
            applyStatusToUI(data);
        }

        // 2. Real-time Subscription
        supabaseClient
            .channel('status_updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'portfolio_status', filter: 'id=eq.1' }, payload => {
                applyStatusToUI(payload.new);
            })
            .subscribe();
    }

    function applyStatusToUI(data) {
        const heroTag = document.getElementById('hero-availability');
        if (!heroTag) return;

        let icon = '';
        let text = '';

        if (data.is_available === false) {
            icon = '<i class="bi bi-dash-circle-fill" style="color: #ff4b4b;"></i>';
            if (data.active_projects > 0) {
                text = t('hero.status.busy').replace('{count}', data.active_projects);
            } else {
                text = t('hero.status.busy_general');
            }
        } else {
            icon = '<i class="bi bi-check-circle-fill" style="color: #00ff88;"></i>';
            if (data.active_projects > 0) {
                text = t('hero.status.available_busy').replace('{count}', data.active_projects);
            } else {
                text = t('hero.status.available');
            }
        }

        const span = document.createElement('span');
        span.textContent = text;
        heroTag.innerHTML = '';
        heroTag.insertAdjacentHTML('afterbegin', icon);
        heroTag.appendChild(span);
    }

    // Availability sync logic (Old logic replaced by Supabase)
    async function updateHeroFromJSON() {
        // We now keep this as a fallback if Supabase is not configured
        if (config.supabaseUrl.includes('{{')) {
            const heroTag = document.getElementById('hero-availability');
            if (!heroTag) return;

            try {
                const res = await fetch(`js/status.json?t=${Date.now()}`);
                const data = await res.json();

                if (data.isAvailable === false) {
                    if (data.activeProjects > 0) {
                        heroTag.textContent = t('hero.status.busy').replace('{count}', data.activeProjects);
                    } else {
                        heroTag.textContent = t('hero.status.busy_general');
                    }
                } else {
                    if (data.activeProjects > 0) {
                        heroTag.textContent = t('hero.status.available_busy').replace('{count}', data.activeProjects);
                    } else {
                        heroTag.textContent = t('hero.status.available');
                    }
                }
            } catch (e) {
                // Fallback to i18n manual config
                const conf = i18n.config;
                if (conf.isAvailable === false) {
                    if (conf.activeProjects > 0) {
                        heroTag.textContent = t('hero.status.busy').replace('{count}', conf.activeProjects);
                    } else {
                        heroTag.textContent = t('hero.status.busy_general');
                    }
                } else {
                    if (conf.activeProjects > 0) {
                        heroTag.textContent = t('hero.status.available_busy').replace('{count}', conf.activeProjects);
                    } else {
                        heroTag.textContent = t('hero.status.available');
                    }
                }
            }
        } else {
            updateHeroFromSupabase();
        }
    }

    function renderSpotify(spotify) {
        // Calc progress
        const total = spotify.timestamps.end - spotify.timestamps.start;
        const current = Date.now() - spotify.timestamps.start;
        const progress = Math.min((current / total) * 100, 100);

        const activityRow = document.createElement('div');
        activityRow.className = 'activity-row';

        const img = document.createElement('img');
        img.src = spotify.album_art_url;
        img.className = 'activity-icon';
        img.alt = 'Album Art';

        const info = document.createElement('div');
        info.className = 'activity-info';

        const name = document.createElement('span');
        name.className = 'act-name';
        name.textContent = t('discord.listening');

        const details = document.createElement('span');
        details.className = 'act-details';
        details.style.color = '#1db954';
        details.style.fontWeight = '600';
        details.textContent = spotify.song;

        const state = document.createElement('span');
        state.className = 'act-state';
        state.textContent = `${t('discord.by')} ${spotify.artist}`;

        const bar = document.createElement('div');
        bar.className = 'spotify-bar';
        const progressEl = document.createElement('div');
        progressEl.className = 'spotify-progress';
        progressEl.style.width = `${progress}%`;
        bar.appendChild(progressEl);

        info.append(name, details, state, bar);
        activityRow.append(img, info);

        activityContainer.innerHTML = '';
        activityContainer.appendChild(activityRow);
    }

    function renderGame(game) {
        let iconUrl = 'https://cdn.discordapp.com/embed/avatars/0.png'; // Fallback

        if (game.assets && game.assets.large_image) {
            if (game.assets.large_image.startsWith('mp:')) {
                iconUrl = `https://media.discordapp.net/${game.assets.large_image.replace('mp:', '')}`;
            } else {
                iconUrl = `https://cdn.discordapp.com/app-assets/${game.application_id}/${game.assets.large_image}.png`;
            }
        }

        const activityRow = document.createElement('div');
        activityRow.className = 'activity-row';

        const img = document.createElement('img');
        img.src = iconUrl;
        img.className = 'activity-icon';
        img.alt = 'Game Icon';

        const info = document.createElement('div');
        info.className = 'activity-info';

        const name = document.createElement('span');
        name.className = 'act-name';
        name.textContent = game.name;

        const details = document.createElement('span');
        details.className = 'act-details';
        details.textContent = game.details || t('discord.playing');

        const state = document.createElement('span');
        state.className = 'act-state';
        state.textContent = game.state || '';

        info.append(name, details, state);
        activityRow.append(img, info);

        activityContainer.innerHTML = '';
        activityContainer.appendChild(activityRow);
    }

    function renderIdle() {
        activityContainer.innerHTML = '';
        const placeholder = document.createElement('div');
        placeholder.className = 'activity-placeholder mono';
        placeholder.style.fontSize = '0.8rem';
        placeholder.style.opacity = '0.7';

        const prompt = document.createElement('span');
        prompt.style.color = 'var(--primary)';
        prompt.textContent = '> ';

        placeholder.appendChild(prompt);
        placeholder.append(t('discord.awaitingInput'));

        activityContainer.appendChild(placeholder);
    }

    // Start WebSocket
    if (document.getElementById('discord-activity')) {
        connectLanyard();
    }

    // Toggle Card logic
    const card = document.getElementById('lanyard-card');
    const toggleBtn = document.querySelector('.card-toggle');
    const toggleIcon = document.querySelector('.toggle-icon');

    if (card && toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            card.classList.toggle('minimized');

            if (card.classList.contains('minimized')) {
                toggleIcon.textContent = '+';
            } else {
                toggleIcon.textContent = '−';
            }
        });

        // Expand on click if minimized
        card.addEventListener('click', () => {
            if (card.classList.contains('minimized')) {
                card.classList.remove('minimized');
                toggleIcon.textContent = '−';
            }
        });
    }

    // 7. Projects Grid & Modal Logic
    const items = document.querySelectorAll('.carousel-item');
    const modal = document.getElementById('project-modal');
    const closeModal = document.querySelector('.close-modal');
    let activeIndex = 0;

    function markActiveItem(index) {
        items.forEach((item, itemIndex) => {
            item.classList.toggle('active', itemIndex === index);
        });
    }

    // Modal Logic
    async function openModal(index) {
        activeIndex = index;
        markActiveItem(index);

        const projectData = i18n[currentLang].projects[index + 1];
        const item = items[index];
        const title = projectData?.title || item.querySelector('.project-title').textContent;
        const meta = projectData?.meta || item.querySelector('.project-meta').textContent;
        const repo = projectData?.repo;

        // Data extraction
        const detailsClone = item.querySelector('.hidden-details').cloneNode(true);
        detailsClone.style.display = 'block';

        // Get project icon
        const projectIcon = item.querySelector('i.bi')?.cloneNode(true) || document.createElement('i');
        if (!projectIcon.classList.contains('bi')) { // Default if not found
            projectIcon.className = 'bi bi-folder-fill';
        }

        // Populate Modal
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-meta').textContent = meta;

        const descContainer = document.getElementById('modal-desc');
        descContainer.innerHTML = '';
        descContainer.appendChild(detailsClone);

        // GitHub Stats for Modal
        const modalStats = document.getElementById('gh-modal-stats');
        modalStats.innerHTML = '';
        if (repo) {
            try {
                // Fetch basic stats
                const repoRes = await fetch(`https://api.github.com/repos/${repo}`);
                const repoData = await repoRes.json();

                // Fetch languages
                const langRes = await fetch(`https://api.github.com/repos/${repo}/languages`);
                const languages = await langRes.json();

                if (repoData.stargazers_count !== undefined) {
                    const colors = {
                        'JavaScript': '#f7df1e', 'TypeScript': '#3178c6', 'PHP': '#777bb3',
                        'Python': '#3776ab', 'HTML': '#e34c26', 'CSS': '#563d7c',
                        'SCSS': '#c6538c', 'C++': '#f34b7d', 'Java': '#b07219',
                        'Godot': '#478cbf', 'GDScript': '#478cbf', 'Shell': '#89e051',
                        'Vue': '#41b883', 'Batchfile': '#C1F12E', 'C#': '#178600',
                        'Ruby': '#701516', 'Go': '#00ADD8', 'Rust': '#dea584',
                        'Swift': '#F05138', 'Kotlin': '#A97BFF', 'Dart': '#00B4AB',
                        'Objective-C': '#438eff', 'C': '#555555', 'R': '#198CE7',
                        'Matlab': '#e16737', 'Perl': '#0298c3', 'Haskell': '#5e5086',
                        'Scala': '#c22d40', 'Elixir': '#6e4a7e', 'Clojure': '#db5855',
                        'Lua': '#000080', 'SQL': '#e38c00', 'PowerShell': '#012456',
                        'Markdown': '#083fa1', 'JSON': '#292929', 'YAML': '#cb171e',
                        'Arduino': '#bd79d1', 'Assembly': '#6E4C13', 'Processing': '#0096D8',
                        'Unity': '#222c37', 'PostScript': '#da291c', 'ActionScript': '#882B0F'
                    };

                    let statsHTML = `
                        <div class="gh-modal-meta-stats">
                            <div class="gh-modal-stat">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                <span>${repoData.stargazers_count} stars</span>
                            </div>
                            <div class="gh-modal-stat">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.2 13.3l-6.2-1.3V3c0-.6-.4-1-1-1S10 2.4 10 3v9l-6.2 1.3c-.6.1-1 .7-.9 1.3.1.6.7 1 1.3.9l5.8-1.2v5.6l-2.3 2.3c-.4.4-.4 1 0 1.4s1 .4 1.4 0l1.9-1.9 1.9 1.9c.4.4 1 .4 1.4 0s.4-1 0-1.4l-2.3-2.3v-5.6l5.8 1.2c.6.1 1.2-.3 1.3-.9.1-.6-.3-1.2-.9-1.3z"/></svg>
                                <span>${repoData.forks_count} forks</span>
                            </div>
                        </div>
                    `;

                    // Add Language Bar
                    const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);
                    if (totalBytes > 0) {
                        statsHTML += `<div class="gh-modal-languages">
                            <div class="gh-lang-bar-container" style="height: 6px; margin: 1rem 0 0.5rem 0;">`;

                        Object.entries(languages).forEach(([lang, bytes]) => {
                            const percent = (bytes / totalBytes) * 100;
                            const color = colors[lang] || '#8b5cf6';
                            statsHTML += `<div class="gh-lang-bar-segment" style="width: ${percent}%; background-color: ${color};"></div>`;
                        });

                        statsHTML += `</div><div class="gh-lang-labels" style="justify-content: flex-start; gap: 1rem;">`;

                        Object.entries(languages).slice(0, 4).forEach(([lang, bytes]) => {
                            const percent = (bytes / totalBytes) * 100;
                            const color = colors[lang] || '#8b5cf6';
                            statsHTML += `
                                <div class="gh-lang-label">
                                    <span class="gh-lang-dot" style="background-color: ${color}"></span>
                                    <span>${lang}</span>
                                    <span style="opacity: 0.5; font-size: 0.7rem;">${Math.round(percent)}%</span>
                                </div>
                            `;
                        });
                        statsHTML += `</div></div>`;
                    }

                    modalStats.innerHTML = statsHTML;
                }
            } catch (e) { console.error('Error fetching modal repo stats:', e); }
        }

        // Show Overlay (Fix: use class instead of showModal)
        modal.classList.add('open');
        document.body.classList.add('modal-open');
        if (dot && ring) {
            dot.style.display = 'none';
            ring.style.display = 'none';
        }
    }

    // Availability Sync (Manual or GitHub)
    const updateHeroAvailability = () => {
        const heroTag = document.getElementById('hero-availability');
        if (!heroTag) return;

        // Priority to manual config in i18n.js
        const config = i18n.config;
        if (config) {
            if (!config.isAvailable) {
                // If explicitly not available (you can add a 'not available' string if needed, 
                // but usually busy means not available for NEW projects)
                // For now, let's keep it simple:
            }

            if (config.activeProjects > 0) {
                heroTag.textContent = t('hero.status.busy').replace('{count}', config.activeProjects);
                return;
            } else {
                heroTag.textContent = t('hero.status.available');
                return;
            }
        }
    };

    updateHeroAvailability();

    // Interactions
    items.forEach((item, index) => {
        item.setAttribute('tabindex', '0');
        item.querySelector('.learn-more-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(index);
        });

        item.addEventListener('click', (e) => {
            openModal(index);
        });

        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(index);
            }
        });
    });

    // Close logic
    function hideModal() {
        modal.classList.remove('open');
        document.body.classList.remove('modal-open');
        if (dot && ring) {
            dot.style.display = '';
            ring.style.display = '';
        }
    }

    closeModal?.addEventListener('click', (e) => {
        e.stopPropagation();
        hideModal();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });

    // 8. Project Search (Ctrl+K)
    const initProjectSearch = () => {
        const searchModal = document.getElementById('search-modal');
        const searchInput = document.getElementById('projects-search');
        const resultsContainer = document.getElementById('search-results');

        if (!searchModal || !searchInput || !resultsContainer) return;

        const toggleSearch = (show) => {
            searchModal.classList.toggle('open', show);
            if (show) {
                searchInput.value = '';
                searchInput.focus();
                renderSearchResults('');
            } else {
                if (dot && ring) {
                    dot.style.display = '';
                    ring.style.display = '';
                }
            }
        };

        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (dot && ring) {
                    dot.style.display = 'none';
                    ring.style.display = 'none';
                }
                toggleSearch(!searchModal.classList.contains('open'));
            }
            if (e.key === 'Escape' && searchModal.classList.contains('open')) {
                toggleSearch(false);
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

            // --- Command Palette Logic ---
            if (q.startsWith('>')) {
                const cmd = q.substring(1).trim();
                renderCommands(cmd);
                return;
            }

            const projects = i18n[currentLang].projects;

            const matches = Object.keys(projects)
                .filter(key => !isNaN(key))
                .map(key => ({ id: key, ...projects[key] }))
                .filter(p =>
                    p.title.toLowerCase().includes(q) ||
                    p.desc.toLowerCase().includes(q) ||
                    p.meta.toLowerCase().includes(q)
                );

            if (matches.length === 0) {
                resultsContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">${t('search.noResults')}</div>`;
                return;
            }

            matches.forEach(p => {
                const item = document.createElement('div');
                item.className = 'search-item';
                item.innerHTML = `
                    <div class="search-icon">${getProjectIcon(p.id)}</div>
                    <div class="search-info">
                        <strong>${p.title}</strong>
                        <span>${p.meta} — ${p.desc}</span>
                    </div>
                `;
                item.addEventListener('click', () => {
                    toggleSearch(false);
                    openModal(parseInt(p.id) - 1);
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

            const matches = commands.filter(c => c.id.includes(cmd) || c.label.toLowerCase().includes(cmd));

            if (matches.length === 0) {
                resultsContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No command found starting with "${cmd}"</div>`;
                return;
            }

            matches.forEach(c => {
                const item = document.createElement('div');
                item.className = 'search-item';
                item.innerHTML = `
                    <div class="search-icon">${c.icon}</div>
                    <div class="search-info">
                        <strong>${c.label}</strong>
                        <span>Command: >${c.id}</span>
                    </div>
                `;
                item.addEventListener('click', () => {
                    toggleSearch(false);
                    c.action();
                });
                resultsContainer.appendChild(item);
            });
        }

        function scrollToSection(id) {
            const el = document.getElementById(id);
            if (el) {
                const offset = 80;
                const bodyRect = document.body.getBoundingClientRect().top;
                const elementRect = el.getBoundingClientRect().top;
                const elementPosition = elementRect - bodyRect;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }

        function getProjectIcon(id) {
            const icons = { '1': '🎤', '2': '⚔️', '3': '💊', '4': '✨', '5': '🚀', '6': '🗺️', '7': '🏠', '8': '📊' };
            return icons[id] || '📁';
        }
    };

    initProjectSearch();

    // 9. GitHub Integration
    const initGitHubStats = async () => {
        const username = 'nexos20lv';
        const reposEl = document.getElementById('gh-repos');
        const starsEl = document.getElementById('gh-stars');
        const langBar = document.getElementById('gh-lang-bar');
        const langLabels = document.getElementById('gh-lang-labels');

        if (!reposEl) return;

        try {
            const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
            const repos = await response.json();

            if (!Array.isArray(repos)) throw new Error('Invalid response');

            const totalRepos = repos.length;
            const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);

            reposEl.textContent = totalRepos;
            starsEl.textContent = totalStars;

            // Fetch language bytes for all repos
            const langMap = {};
            const langPromises = repos.map(async (repo) => {
                try {
                    const res = await fetch(repo.languages_url);
                    const languages = await res.json();
                    Object.keys(languages).forEach(lang => {
                        langMap[lang] = (langMap[lang] || 0) + languages[lang];
                    });
                } catch (e) {
                    console.error(`Error fetching languages for ${repo.name}:`, e);
                }
            });

            await Promise.all(langPromises);

            const colors = {
                'JavaScript': '#f7df1e', 'TypeScript': '#3178c6', 'PHP': '#777bb3',
                'Python': '#3776ab', 'HTML': '#e34c26', 'CSS': '#563d7c',
                'SCSS': '#c6538c', 'C++': '#f34b7d', 'Java': '#b07219',
                'Godot': '#478cbf', 'GDScript': '#478cbf', 'Shell': '#89e051',
                'Vue': '#41b883', 'Batchfile': '#C1F12E', 'C#': '#178600',
                'Ruby': '#701516', 'Go': '#00ADD8', 'Rust': '#dea584',
                'Swift': '#F05138', 'Kotlin': '#A97BFF', 'Dart': '#00B4AB',
                'Objective-C': '#438eff', 'C': '#555555', 'R': '#198CE7',
                'Matlab': '#e16737', 'Perl': '#0298c3', 'Haskell': '#5e5086',
                'Scala': '#c22d40', 'Elixir': '#6e4a7e', 'Clojure': '#db5855',
                'Lua': '#000080', 'SQL': '#e38c00', 'PowerShell': '#012456',
                'Markdown': '#083fa1', 'JSON': '#292929', 'YAML': '#cb171e',
                'Arduino': '#bd79d1', 'Assembly': '#6E4C13', 'Processing': '#0096D8',
                'Unity': '#222c37', 'PostScript': '#da291c', 'ActionScript': '#882B0F'
            };

            const sortedLangs = Object.entries(langMap)
                .sort((a, b) => b[1] - a[1]);

            const topLangs = sortedLangs.slice(0, 6);
            const totalBytes = sortedLangs.reduce((acc, l) => acc + l[1], 0);

            langBar.innerHTML = '';
            langLabels.innerHTML = '';

            topLangs.forEach(([lang, bytes]) => {
                const percent = (bytes / totalBytes) * 100;
                const color = colors[lang] || '#8b5cf6';

                const segment = document.createElement('div');
                segment.className = 'gh-lang-bar-segment';
                segment.style.width = '0%';
                segment.style.backgroundColor = color;
                langBar.appendChild(segment);

                const label = document.createElement('div');
                label.className = 'gh-lang-label';
                label.innerHTML = `
                    <span class="gh-lang-dot" style="background-color: ${color}"></span>
                    <span>${lang}</span>
                    <span style="opacity: 0.5; font-size: 0.7rem;">${Math.round(percent)}%</span>
                `;
                langLabels.appendChild(label);

                setTimeout(() => segment.style.width = `${percent}%`, 100);
            });

        } catch (err) {
            console.error('GitHub Fetch Error:', err);
            reposEl.textContent = '??';
            starsEl.textContent = '??';
        }
    };

    initGitHubStats();

    // 10. Contact Form Logic
    const contactForm = document.getElementById('contact-form');
    const feedback = document.getElementById('form-feedback');

    if (contactForm && feedback) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('contact-submit');
            const originalText = submitBtn.innerHTML;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loader-dots">...</span>';

            const formData = new FormData(contactForm);
            const payload = {
                embeds: [{
                    title: 'Nouveau Message du Portfolio 📬',
                    color: 0x8b5cf6,
                    fields: [
                        { name: 'Nom', value: formData.get('name'), inline: true },
                        { name: 'Email', value: formData.get('email'), inline: true },
                        { name: 'Message', value: formData.get('message') }
                    ],
                    timestamp: new Date().toISOString()
                }]
            };

            // Safety Check: Ensure Supabase is configured
            if (!config.supabaseUrl || config.supabaseUrl.includes('{{')) {
                console.warn("⚠️ Supabase not configured.");
                feedback.textContent = t('contact.error');
                feedback.className = 'form-feedback error';
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            // Call Supabase Edge Function instead of Discord directly
            const functionUrl = `${config.supabaseUrl}/functions/v1/contact-handler`;

            try {
                const res = await fetch(functionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.supabaseAnonKey}`
                    },
                    body: JSON.stringify({ payload })
                });

                if (res.ok) {
                    feedback.textContent = t('contact.success');
                    feedback.classList.remove('error');
                    feedback.classList.add('success');
                    feedback.style.display = 'block';
                    contactForm.reset();
                } else {
                    throw new Error();
                }
            } catch (err) {
                feedback.textContent = t('contact.error');
                feedback.classList.remove('success');
                feedback.classList.add('error');
                feedback.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                setTimeout(() => {
                    feedback.style.display = 'none';
                }, 5000);
            }
        });
    }

    console.log("System Initialized: Ultra Modern Portfolio V3");

    // 10. Reading Progress Bar
    const initReadingProgress = () => {
        const progressBar = document.getElementById('reading-progress');
        if (!progressBar) return;

        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + "%";
        });
    };

    // 11. Interactive Terminal
    const toggleTerminal = (show) => {
        const modal = document.getElementById('terminal-modal');
        const input = document.getElementById('terminal-input');
        if (!modal || !input) return;

        modal.classList.toggle('open', show);
        if (show) {
            input.focus();
            if (dot && ring) {
                dot.style.display = 'none';
                ring.style.display = 'none';
            }
        } else {
            if (dot && ring) {
                dot.style.display = '';
                ring.style.display = '';
            }
        }
    };

    const initTerminal = () => {
        const input = document.getElementById('terminal-input');
        const content = document.getElementById('terminal-content');
        const modal = document.getElementById('terminal-modal');
        const closeBtn = document.querySelector('.close-terminal');

        if (!input || !content || !modal) return;

        const commands = {
            help: () => 'Available commands: about, projects, experience, contact, theme, fr, en, clear, exit, neofetch',
            about: () => 'Pierre Bouteman - Full-Stack Developer based in France. Currently in 1ère STI2D.',
            projects: () => 'Listing projects... Command "> projects" in Ctrl+K for a visual list.',
            experience: () => 'Experience: Personal projects (Nexaria, HA Desktop), STI2D Student, Internships at Déclic Info & ASC Computer.',
            contact: () => 'Contact: pierre.bouteman@icloud.com | Discord: @nexos20lv',
            theme: () => {
                document.getElementById('perfToggle')?.click();
                return 'Toggled High Performance Mode.';
            },
            fr: () => {
                applyLanguage('fr');
                return 'Langue changée en Français.';
            },
            en: () => {
                applyLanguage('en');
                return 'Language switched to English.';
            },
            neofetch: () => `
                <div style="display:flex; gap: 2rem;">
                    <div style="color:var(--primary); font-family:var(--font-mono); white-space:pre;">
   #####
  #######
  ##O#O##
  #######
  #######
  #######
                    </div>
                    <div>
                        <b style="color:var(--primary)">pierre@bouteman.dev</b><br>
                        ---------------------<br>
                        <b>OS:</b> Portfolio OS V3<br>
                        <b>Kernel:</b> 2.1.0-stable<br>
                        <b>Uptime:</b> ${Math.round(performance.now() / 1000)}s<br>
                        <b>Shell:</b> pierre-sh 1.0<br>
                        <b>Resolution:</b> ${window.innerWidth}x${window.innerHeight}<br>
                        <b>Stack:</b> HTML, CSS, Vanilla JS
                    </div>
                </div>`,
            clear: () => {
                content.innerHTML = '<div class="terminal-welcome">Type \'help\' for available commands.</div>';
                return '';
            },
            exit: () => {
                toggleTerminal(false);
                return 'Exiting...';
            }
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const rawValue = input.value.trim();
                const cmd = rawValue.toLowerCase();
                input.value = '';

                // Add command to feedback
                const cmdLine = document.createElement('div');
                cmdLine.className = 'terminal-line cmd';
                cmdLine.textContent = `> ${rawValue}`;
                content.appendChild(cmdLine);

                if (cmd) {
                    const result = commands[cmd] ? commands[cmd]() : `Command not found: ${cmd}. Type 'help' for possible commands.`;
                    if (result) {
                        const resLine = document.createElement('div');
                        resLine.className = 'terminal-line';
                        resLine.innerHTML = result;
                        content.appendChild(resLine);
                    }
                }
                content.scrollTop = content.scrollHeight;
            }
        });

        closeBtn?.addEventListener('click', () => toggleTerminal(false));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) toggleTerminal(false);
        });
    };

    initTerminal();

    initReadingProgress();

    // Initial fetch of availability
    updateHeroFromJSON();
});
