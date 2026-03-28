/**
 * @module projects-ui
 * @description Manages the project carousel, project detail modal, GitHub API stats,
 * featured metrics panel, and client-mode filters.
 *
 * Project data is defined in the projectData array inside this module.
 * GitHub API calls are deferred via runWhenIdle to keep initial render fast.
 *
 * To add a project: add an entry to projectData AND a .carousel-item card
 * in index.html with a matching data-index attribute.
 */

/**
 * @param {{ i18n: object, config: object, t: Function, getCurrentLang: Function, openOverlay: Function, closeOverlay: Function, dot: HTMLElement, ring: HTMLElement, languageColors: Record<string, string> }} options
 * @returns {{ openModal: Function, applyProjectStatusBadges: Function, refreshOpenModal: Function, initGitHubStats: Function, initFeaturedMetrics: Function }}
 */
export function initProjectsUI({
    i18n,
    config,
    t,
    getCurrentLang,
    openOverlay,
    closeOverlay,
    dot,
    ring,
    languageColors
}) {
    const items = document.querySelectorAll('.carousel-item');
    const filterButtons = document.querySelectorAll('.client-filter-btn');
    const modal = document.getElementById('project-modal');
    const closeModalBtn = modal?.querySelector('.close-modal');
    let activeIndex = 0;

    const projectStatusByIndex = {
        0: 'production',
        1: 'production',
        2: 'archived',
        3: 'production',
        4: 'production',
        5: 'testing',
        6: 'production',
        7: 'production'
    };

    const projectBuildByIndex = {
        5: true
    };

    function getProjectStatusLabel(statusKey) {
        return t(`projects.status.${statusKey}`);
    }

    function getProjectBuildLabel() {
        return t('projects.buildBadge');
    }

    function getSafeLanguageEntries(payload) {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return [];
        }

        return Object.entries(payload).filter(([, bytes]) => (
            typeof bytes === 'number' && Number.isFinite(bytes) && bytes > 0
        ));
    }

    function isGitHubRateLimited(response, payload) {
        const message = payload && typeof payload.message === 'string'
            ? payload.message.toLowerCase()
            : '';
        return response?.status === 403 || message.includes('api rate limit exceeded');
    }

    function createGitHubRateLimitBadge(text = 'API rate limited') {
        const badge = document.createElement('div');
        badge.className = 'gh-api-badge';
        badge.textContent = text;
        return badge;
    }

    function formatProjectDate(dateInput) {
        if (!dateInput) return '--';
        const date = new Date(dateInput);
        if (Number.isNaN(date.getTime())) return '--';
        return new Intl.DateTimeFormat(getCurrentLang(), {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        }).format(date);
    }

    function createProjectQualityBadge(label, value, tone = 'neutral') {
        const badge = document.createElement('div');
        badge.className = `project-quality-badge ${tone}`;

        const labelSpan = document.createElement('span');
        labelSpan.className = 'quality-label';
        labelSpan.textContent = label;

        const valueSpan = document.createElement('span');
        valueSpan.className = 'quality-value';
        valueSpan.textContent = value;

        badge.append(labelSpan, valueSpan);
        return badge;
    }

    function markActiveItem(index) {
        items.forEach((item, itemIndex) => {
            item.classList.toggle('active', itemIndex === index);
        });
    }

    function getVisibleItems() {
        return Array.from(items).filter((item) => !item.classList.contains('project-hidden'));
    }

    function applyClientFilter(filterKey) {
        const normalized = filterKey || 'all';

        items.forEach((item) => {
            const need = item.dataset.clientNeed || 'all';
            const isMatch = normalized === 'all' || need === normalized;
            item.classList.toggle('project-hidden', !isMatch);
        });

        filterButtons.forEach((button) => {
            button.classList.toggle('active', button.dataset.clientFilter === normalized);
        });

        const visibleItems = getVisibleItems();
        if (!visibleItems.length) {
            activeIndex = -1;
            items.forEach((item) => item.classList.remove('active'));
            return;
        }

        const firstVisibleIndex = Number(visibleItems[0].dataset.index || 0);
        activeIndex = firstVisibleIndex;
        markActiveItem(activeIndex);
    }

    function initClientModeFilter() {
        if (!filterButtons.length) return;

        filterButtons.forEach((button) => {
            button.addEventListener('click', () => {
                applyClientFilter(button.dataset.clientFilter || 'all');
            });
        });
    }

    function formatBuildDuration(startedAt, updatedAt) {
        if (!startedAt || !updatedAt) return '--';
        const start = new Date(startedAt).getTime();
        const end = new Date(updatedAt).getTime();
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return '--';

        const totalSec = Math.round((end - start) / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        if (min <= 0) return `${sec}s`;
        return `${min}m ${sec.toString().padStart(2, '0')}s`;
    }

    async function initFeaturedMetrics() {
        const starsNode = document.getElementById('featured-stars-total');
        const releaseNode = document.getElementById('featured-latest-release');
        const buildNode = document.getElementById('featured-build-time');
        if (!starsNode || !releaseNode || !buildNode) return;

        const featuredRepos = [
            'nexos20lv/Nexaria-Launcher',
            'nexos20lv/Home-Assistant-Desktop',
            'nexos20lv/AzureLab-Dashboard'
        ];

        try {
            const repoPayloads = await Promise.all(featuredRepos.map(async (repo) => {
                const [repoRes, releaseRes, runsRes] = await Promise.all([
                    fetch(`${config.endpoints.githubApi}/repos/${repo}`),
                    fetch(`${config.endpoints.githubApi}/repos/${repo}/releases/latest`),
                    fetch(`${config.endpoints.githubApi}/repos/${repo}/actions/runs?per_page=1`)
                ]);

                const repoData = await repoRes.json().catch(() => ({}));
                const releaseData = await releaseRes.json().catch(() => ({}));
                const runsData = await runsRes.json().catch(() => ({}));

                return {
                    repo,
                    repoOk: repoRes.ok,
                    releaseOk: releaseRes.ok,
                    repoData,
                    releaseData,
                    latestRun: Array.isArray(runsData?.workflow_runs) ? runsData.workflow_runs[0] : null
                };
            }));

            const starsTotal = repoPayloads.reduce((acc, payload) => {
                const stars = payload.repoOk ? Number(payload.repoData?.stargazers_count || 0) : 0;
                return acc + (Number.isFinite(stars) ? stars : 0);
            }, 0);
            starsNode.textContent = String(starsTotal);

            const releases = repoPayloads
                .filter((payload) => payload.releaseOk && payload.releaseData?.tag_name)
                .map((payload) => ({
                    tag: payload.releaseData.tag_name,
                    date: new Date(payload.releaseData.published_at || payload.releaseData.created_at || 0).getTime()
                }))
                .filter((release) => Number.isFinite(release.date));

            if (releases.length) {
                releases.sort((a, b) => b.date - a.date);
                releaseNode.textContent = releases[0].tag;
            } else {
                releaseNode.textContent = '--';
            }

            const latestRuns = repoPayloads
                .map((payload) => payload.latestRun)
                .filter(Boolean)
                .map((run) => ({
                    startedAt: run.run_started_at,
                    updatedAt: run.updated_at,
                    created: new Date(run.created_at || run.updated_at || 0).getTime()
                }))
                .filter((run) => Number.isFinite(run.created));

            if (latestRuns.length) {
                latestRuns.sort((a, b) => b.created - a.created);
                buildNode.textContent = formatBuildDuration(latestRuns[0].startedAt, latestRuns[0].updatedAt);
            } else {
                buildNode.textContent = '--';
            }
        } catch (error) {
            console.error('Error loading featured metrics:', error);
            starsNode.textContent = '--';
            releaseNode.textContent = '--';
            buildNode.textContent = '--';
        }
    }

    function applyProjectStatusBadges() {
        if (!items.length) return;

        items.forEach((card, index) => {
            const statusKey = projectStatusByIndex[index] || 'creation';
            const metaNode = card.querySelector('.project-meta');
            if (!metaNode) return;

            let badge = card.querySelector('.project-status-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'project-status-badge';
                metaNode.insertAdjacentElement('afterend', badge);
            }

            badge.dataset.status = statusKey;
            badge.textContent = getProjectStatusLabel(statusKey);
            badge.setAttribute('aria-label', `Status: ${badge.textContent}`);

            let buildBadge = card.querySelector('.project-build-badge');
            if (!buildBadge) {
                buildBadge = document.createElement('span');
                buildBadge.className = 'project-build-badge';
                badge.insertAdjacentElement('afterend', buildBadge);
            }

            const isBuild = Boolean(projectBuildByIndex[index]);
            buildBadge.textContent = getProjectBuildLabel();
            buildBadge.style.display = isBuild ? 'inline-flex' : 'none';
        });
    }

    async function openModal(index, triggerElement) {
        activeIndex = index;
        markActiveItem(index);

        if (!modal) return;

        document.body.classList.add('modal-open');
        if (dot && ring) {
            dot.style.display = 'none';
            ring.style.display = 'none';
        }
        openOverlay(modal, triggerElement, hideModal);

        const projectData = i18n[getCurrentLang()].projects[index + 1];
        const item = items[index];
        if (!item) return;
        const title = projectData?.title || item.querySelector('.project-title')?.textContent || '';
        const meta = projectData?.meta || item.querySelector('.project-meta')?.textContent || '';
        const statusKey = projectStatusByIndex[index] || 'creation';
        const repo = projectData?.repo;

        const detailsClone = item.querySelector('.hidden-details')?.cloneNode(true);
        if (detailsClone) {
            detailsClone.style.display = 'block';
        }

        const modalTitle = document.getElementById('modal-title');
        const modalMeta = document.getElementById('modal-meta');
        if (modalTitle) modalTitle.textContent = title;
        if (modalMeta) modalMeta.textContent = meta;

        const modalStatus = document.getElementById('modal-status');
        if (modalStatus) {
            modalStatus.dataset.status = statusKey;
            modalStatus.textContent = getProjectStatusLabel(statusKey);
        }

        const modalBuild = document.getElementById('modal-build');
        if (modalBuild) {
            modalBuild.textContent = getProjectBuildLabel();
            modalBuild.style.display = projectBuildByIndex[index] ? 'inline-flex' : 'none';
        }

        const descContainer = document.getElementById('modal-desc');
        if (descContainer) {
            descContainer.innerHTML = '';
            if (detailsClone) {
                descContainer.appendChild(detailsClone);
            }
        }

        const modalQuality = document.getElementById('modal-quality');
        if (modalQuality) {
            modalQuality.innerHTML = '';
            modalQuality.style.display = repo ? '' : 'none';
        }

        const modalStats = document.getElementById('gh-modal-stats');
        if (modalStats) {
            modalStats.innerHTML = '';
            modalStats.style.display = repo ? '' : 'none';
        }

        if (!repo) return;

        try {
            const repoRes = await fetch(`${config.endpoints.githubApi}/repos/${repo}`);
            const repoData = await repoRes.json();
            if (!repoRes.ok) {
                if (isGitHubRateLimited(repoRes, repoData)) {
                    if (modalStats) {
                        modalStats.appendChild(createGitHubRateLimitBadge());
                    }
                    return;
                }
                throw new Error(repoData?.message || `GitHub repo error ${repoRes.status}`);
            }

            const [langRes, releaseRes, runsRes] = await Promise.all([
                fetch(`${config.endpoints.githubApi}/repos/${repo}/languages`),
                fetch(`${config.endpoints.githubApi}/repos/${repo}/releases/latest`),
                fetch(`${config.endpoints.githubApi}/repos/${repo}/actions/runs?per_page=1`)
            ]);

            const languagesPayload = await langRes.json().catch(() => ({}));
            const hasLangRateLimit = !langRes.ok && isGitHubRateLimited(langRes, languagesPayload);
            const languages = langRes.ok ? languagesPayload : {};
            const languageEntries = getSafeLanguageEntries(languages).sort((a, b) => b[1] - a[1]);

            const releasePayload = await releaseRes.json().catch(() => ({}));
            const runsPayload = await runsRes.json().catch(() => ({}));

            if (modalQuality) {
                const latestRun = Array.isArray(runsPayload?.workflow_runs) ? runsPayload.workflow_runs[0] : null;
                const ciValue = latestRun
                    ? (latestRun.conclusion === 'success' ? 'passing' : (latestRun.conclusion || latestRun.status || '--'))
                    : '--';
                const ciTone = latestRun?.conclusion === 'success' ? 'ok' : (latestRun ? 'warn' : 'neutral');

                const latestReleaseTag = releaseRes.ok && releasePayload?.tag_name
                    ? releasePayload.tag_name
                    : repoData.default_branch || '--';
                const releaseState = releaseRes.ok && releasePayload?.tag_name
                    ? (releasePayload.prerelease ? t('projects.quality.prerelease') : t('projects.quality.stable'))
                    : t('projects.quality.none');

                modalQuality.append(
                    createProjectQualityBadge(t('projects.quality.ci'), ciValue, ciTone),
                    createProjectQualityBadge(t('projects.quality.updated'), formatProjectDate(repoData.pushed_at), 'neutral'),
                    createProjectQualityBadge(t('projects.quality.version'), latestReleaseTag, 'neutral'),
                    createProjectQualityBadge(t('projects.quality.release'), releaseState, 'neutral')
                );
            }

            if (repoData.stargazers_count === undefined || !modalStats) {
                return;
            }

            modalStats.innerHTML = '';

            const metaStats = document.createElement('div');
            metaStats.className = 'gh-modal-meta-stats';

            const starsDiv = document.createElement('div');
            starsDiv.className = 'gh-modal-stat';
            starsDiv.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
            const starsSpan = document.createElement('span');
            starsSpan.textContent = `${repoData.stargazers_count} stars`;
            starsDiv.appendChild(starsSpan);

            const forksDiv = document.createElement('div');
            forksDiv.className = 'gh-modal-stat';
            forksDiv.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.2 13.3l-6.2-1.3V3c0-.6-.4-1-1-1S10 2.4 10 3v9l-6.2 1.3c-.6.1-1 .7-.9 1.3.1.6.7 1 1.3.9l5.8-1.2v5.6l-2.3 2.3c-.4.4-.4 1 0 1.4s1 .4 1.4 0l1.9-1.9 1.9 1.9c.4.4 1 .4 1.4 0s.4-1 0-1.4l-2.3-2.3v-5.6l5.8 1.2c.6.1 1.2-.3 1.3-.9.1-.6-.3-1.2-.9-1.3z"/></svg>';
            const forksSpan = document.createElement('span');
            forksSpan.textContent = `${repoData.forks_count} forks`;
            forksDiv.appendChild(forksSpan);

            metaStats.append(starsDiv, forksDiv);
            modalStats.appendChild(metaStats);

            const totalBytes = languageEntries.reduce((acc, [, bytes]) => acc + bytes, 0);
            if (totalBytes > 0) {
                const langContainer = document.createElement('div');
                langContainer.className = 'gh-modal-languages';

                const langBar = document.createElement('div');
                langBar.className = 'gh-lang-bar-container';
                langBar.style.cssText = 'height: 6px; margin: 1rem 0 0.5rem 0;';

                const labelsDiv = document.createElement('div');
                labelsDiv.className = 'gh-lang-labels';
                labelsDiv.style.cssText = 'justify-content: flex-start; gap: 1rem;';

                languageEntries.forEach(([lang, bytes]) => {
                    const percent = (bytes / totalBytes) * 100;
                    const color = languageColors[lang] || '#8b5cf6';
                    const segment = document.createElement('div');
                    segment.className = 'gh-lang-bar-segment';
                    segment.style.width = `${percent}%`;
                    segment.style.backgroundColor = color;
                    langBar.appendChild(segment);
                });

                languageEntries.slice(0, 4).forEach(([lang, bytes]) => {
                    const percent = (bytes / totalBytes) * 100;
                    const color = languageColors[lang] || '#8b5cf6';

                    const label = document.createElement('div');
                    label.className = 'gh-lang-label';

                    const dot = document.createElement('span');
                    dot.className = 'gh-lang-dot';
                    dot.style.backgroundColor = color;

                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = lang;

                    const percentSpan = document.createElement('span');
                    percentSpan.style.cssText = 'opacity: 0.5; font-size: 0.7rem;';
                    percentSpan.textContent = `${Math.round(percent)}%`;

                    label.append(dot, nameSpan, percentSpan);
                    labelsDiv.appendChild(label);
                });

                langContainer.append(langBar, labelsDiv);
                modalStats.appendChild(langContainer);
            }

            if (hasLangRateLimit) {
                modalStats.appendChild(createGitHubRateLimitBadge());
            }
        } catch (e) {
            console.error('Error fetching modal repo stats:', e);
        }
    }

    function hideModal() {
        if (!modal) return;
        closeOverlay(modal);
        document.body.classList.remove('modal-open');
        if (dot && ring) {
            dot.style.display = '';
            ring.style.display = '';
        }
    }

    function refreshOpenModal() {
        if (modal?.classList.contains('open')) {
            openModal(activeIndex);
        }
    }

    function updateHeroAvailability() {
        const heroTag = document.getElementById('hero-availability');
        if (!heroTag) return;

        const availabilityConfig = i18n.config;
        if (!availabilityConfig) return;

        if (availabilityConfig.activeProjects > 0) {
            heroTag.textContent = t('hero.status.busy').replace('{count}', availabilityConfig.activeProjects);
        } else {
            heroTag.textContent = t('hero.status.available');
        }
    }

    function attachProjectInteractions() {
        items.forEach((item, index) => {
            item.setAttribute('tabindex', '0');
            item.querySelector('.learn-more-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (item.classList.contains('project-hidden')) return;
                openModal(index, e.currentTarget);
            });

            item.addEventListener('click', (e) => {
                if (item.classList.contains('project-hidden')) return;
                openModal(index, e.currentTarget);
            });

            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (item.classList.contains('project-hidden')) return;
                    openModal(index, e.currentTarget);
                }
            });
        });

        closeModalBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            hideModal();
        });

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });
    }

    async function initGitHubStats() {
        const username = config.githubUsername;
        const reposEl = document.getElementById('gh-repos');
        const starsEl = document.getElementById('gh-stars');
        const langBar = document.getElementById('gh-lang-bar');
        const langLabels = document.getElementById('gh-lang-labels');

        if (!reposEl) return;

        try {
            const response = await fetch(`${config.endpoints.githubApi}/users/${username}/repos?per_page=100&sort=updated`);
            const reposPayload = await response.json();
            if (!response.ok) {
                if (isGitHubRateLimited(response, reposPayload)) {
                    reposEl.textContent = '--';
                    starsEl.textContent = '--';
                    langBar.innerHTML = '';
                    langLabels.innerHTML = '';
                    langLabels.appendChild(createGitHubRateLimitBadge());
                    return;
                }
                throw new Error(reposPayload?.message || `GitHub user repos error ${response.status}`);
            }

            if (!Array.isArray(reposPayload)) throw new Error('Invalid response');

            reposEl.textContent = String(reposPayload.length);
            starsEl.textContent = String(reposPayload.reduce((acc, repo) => acc + repo.stargazers_count, 0));

            const langMap = {};
            let hasRateLimitedLanguageRequest = false;

            const langPromises = reposPayload.map(async (repo) => {
                try {
                    const res = await fetch(repo.languages_url);
                    if (!res.ok) {
                        const payload = await res.json().catch(() => ({}));
                        if (isGitHubRateLimited(res, payload)) {
                            hasRateLimitedLanguageRequest = true;
                        }
                        return;
                    }

                    const languages = await res.json();
                    getSafeLanguageEntries(languages).forEach(([lang, bytes]) => {
                        langMap[lang] = (langMap[lang] || 0) + bytes;
                    });
                } catch (e) {
                    console.error(`Error fetching languages for ${repo.name}:`, e);
                }
            });

            await Promise.all(langPromises);

            const sortedLangs = Object.entries(langMap)
                .sort((a, b) => b[1] - a[1]);

            const topLangs = sortedLangs.slice(0, 6);
            const totalBytes = sortedLangs.reduce((acc, [, bytes]) => acc + bytes, 0);

            langBar.innerHTML = '';
            langLabels.innerHTML = '';

            if (!totalBytes || topLangs.length === 0) {
                const label = document.createElement('div');
                label.className = 'gh-lang-label';
                label.textContent = 'Aucune donnee de langage disponible';
                langLabels.appendChild(label);
                return;
            }

            topLangs.forEach(([lang, bytes]) => {
                const percent = (bytes / totalBytes) * 100;
                const color = languageColors[lang] || '#8b5cf6';

                const segment = document.createElement('div');
                segment.className = 'gh-lang-bar-segment';
                segment.style.width = '0%';
                segment.style.backgroundColor = color;
                langBar.appendChild(segment);

                const label = document.createElement('div');
                label.className = 'gh-lang-label';

                const dot = document.createElement('span');
                dot.className = 'gh-lang-dot';
                dot.style.backgroundColor = color;

                const langName = document.createElement('span');
                langName.textContent = lang;

                const langPercent = document.createElement('span');
                langPercent.style.cssText = 'opacity: 0.5; font-size: 0.7rem;';
                langPercent.textContent = `${Math.round(percent)}%`;

                label.append(dot, langName, langPercent);
                langLabels.appendChild(label);

                setTimeout(() => {
                    segment.style.width = `${percent}%`;
                }, 100);
            });

            if (hasRateLimitedLanguageRequest) {
                langLabels.appendChild(createGitHubRateLimitBadge());
            }
        } catch (err) {
            console.error('GitHub Fetch Error:', err);
            reposEl.textContent = '??';
            starsEl.textContent = '??';
        }
    }

    attachProjectInteractions();
    applyProjectStatusBadges();
    initClientModeFilter();
    applyClientFilter('all');
    updateHeroAvailability();

    return {
        openModal,
        applyProjectStatusBadges,
        refreshOpenModal,
        initGitHubStats,
        initFeaturedMetrics,
        updateHeroAvailability
    };
}
