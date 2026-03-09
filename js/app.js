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
            element.innerHTML = t(element.dataset.i18nHtml);
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
        await new Promise(r => setTimeout(r, 400));

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
            
            // Random processing delay
            await new Promise(r => setTimeout(r, 300 + Math.random() * 300));
        }

        // Final delay before reveal
        await new Promise(r => setTimeout(r, 600));
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
        
        heroTag.innerHTML = `${icon} ${text}`;
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

        activityContainer.innerHTML = `
            <div class="activity-row">
                <img src="${spotify.album_art_url}" class="activity-icon" alt="Album Art">
                <div class="activity-info">
                    <span class="act-name">${t('discord.listening')}</span>
                    <span class="act-details" style="color:#1db954; font-weight:600">${spotify.song}</span>
                    <span class="act-state">${t('discord.by')} ${spotify.artist}</span>
                    <div class="spotify-bar">
                        <div class="spotify-progress" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
        `;
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

        activityContainer.innerHTML = `
             <div class="activity-row">
                <img src="${iconUrl}" class="activity-icon" alt="Game Icon">
                <div class="activity-info">
                    <span class="act-name">${game.name}</span>
                    <span class="act-details">${game.details || t('discord.playing')}</span>
                    <span class="act-state">${game.state || ''}</span>
                </div>
            </div>
        `;
    }

    function renderIdle() {
        activityContainer.innerHTML = `
             <div class="activity-placeholder mono" style="font-size:0.8rem; opacity:0.7">
                     <span style="color:var(--primary)">></span> ${t('discord.awaitingInput')}
             </div>
        `;
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
                const res = await fetch(`https://api.github.com/repos/${repo}`);
                const data = await res.json();
                if (data.stargazers_count !== undefined) {
                    modalStats.innerHTML = `
                        <div class="gh-modal-stat">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                            <span>${data.stargazers_count} stars</span>
                        </div>
                        <div class="gh-modal-stat">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.2 13.3l-6.2-1.3V3c0-.6-.4-1-1-1S10 2.4 10 3v9l-6.2 1.3c-.6.1-1 .7-.9 1.3.1.6.7 1 1.3.9l5.8-1.2v5.6l-2.3 2.3c-.4.4-.4 1 0 1.4s1 .4 1.4 0l1.9-1.9 1.9 1.9c.4.4 1 .4 1.4 0s.4-1 0-1.4l-2.3-2.3v-5.6l5.8 1.2c.6.1 1.2-.3 1.3-.9.1-.6-.3-1.2-.9-1.3z"/></svg>
                            <span>${data.forks_count} forks</span>
                        </div>
                    `;
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
                    // Match with index (1-based id in i18n, 0-based index in items)
                    openModal(parseInt(p.id) - 1);
                });
                resultsContainer.appendChild(item);
            });
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

            const langMap = {};
            repos.forEach(repo => {
                if (repo.language) {
                    langMap[repo.language] = (langMap[repo.language] || 0) + 1;
                }
            });

            const topLangs = Object.entries(langMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            const totalLangCount = topLangs.reduce((acc, l) => acc + l[1], 0);

            const colors = {
                'JavaScript': '#f7df1e',
                'TypeScript': '#3178c6',
                'PHP': '#777bb3',
                'Python': '#3776ab',
                'HTML': '#e34c26',
                'CSS': '#563d7c',
                'C++': '#f34b7d',
                'Java': '#b07219',
                'Godot': '#478cbf'
            };

            langBar.innerHTML = '';
            langLabels.innerHTML = '';

            topLangs.forEach(([lang, count]) => {
                const percent = (count / totalLangCount) * 100;
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
    
    // Initial fetch of availability
    updateHeroFromJSON();
});
