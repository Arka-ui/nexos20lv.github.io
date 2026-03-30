import { i18n } from '../i18n.js';

/**
 * @module discord-realtime
 * @description Connects to the Lanyard WebSocket API for real-time Discord presence
 * (status, activity, Spotify). Reconnects automatically with exponential backoff.
 * Also subscribes to Supabase realtime for live visitor count.
 *
 * Protocol: wss://api.lanyard.rest/socket — heartbeat every 30s.
 */

/**
 * @param {{ config: object, t: Function, getCurrentLang: Function, getBackoffDelay: Function, onStatusChange: (status: string) => void, onVisitorsCountChange: (count: number) => void }} options
 * @returns {void}
 */
export function initDiscordRealtime({
    config,
    t,
    getCurrentLang,
    getBackoffDelay,
    onStatusChange,
    onVisitorsCountChange
}) {
    const discordID = config.discordId;
    const avatarImg = document.getElementById('discord-avatar');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('discord-status-text');
    const activityContainer = document.getElementById('discord-activity');
    const discordApplicationIconCache = new Map();

    let lanyardAttempts = 0;
    let lanyardReconnectTimer = null;
    let visitorsAttempts = 0;
    let visitorsChannel = null;
    let statusAttempts = 0;
    let statusChannel = null;
    let hasSupabaseStatusSync = false;
    let activityPopupOverlay = null;
    let activityPopupDialog = null;
    let activityPopupBody = null;
    let activityPopupTitle = null;
    let activityPopupLastTrigger = null;

    const presenceColors = {
        online: '#00ff88',
        idle: '#faa61a',
        dnd: '#f04747',
        offline: '#747f8d'
    };

    const supabaseClient = (typeof supabase !== 'undefined')
        ? supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
        : null;

    function connectLanyard() {
        const ws = new WebSocket(config.endpoints.lanyardSocket);

        ws.onopen = () => {
            lanyardAttempts = 0;
            ws.send(JSON.stringify({
                op: 2,
                d: { subscribe_to_id: discordID }
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const { t: type, d } = data;

            if (type === 'INIT_STATE' || type === 'PRESENCE_UPDATE') {
                updatePresence(d);
            }
        };

        ws.onerror = () => {
            ws.close();
        };

        ws.onclose = () => {
            const delay = getBackoffDelay(lanyardAttempts++, config.retries);
            clearTimeout(lanyardReconnectTimer);
            lanyardReconnectTimer = setTimeout(connectLanyard, delay);
        };
    }

    function getDiscordCdnAssetUrl(applicationId, assetId) {
        if (!applicationId || !assetId) return '';

        if (assetId.startsWith('mp:')) {
            return `https://media.discordapp.net/${assetId.replace('mp:', '')}`;
        }

        return `https://cdn.discordapp.com/app-assets/${applicationId}/${assetId}.png?size=256`;
    }

    async function getDiscordApplicationIconUrl(applicationId) {
        if (!applicationId) return '';

        if (discordApplicationIconCache.has(applicationId)) {
            return discordApplicationIconCache.get(applicationId);
        }

        try {
            const response = await fetch(`${config.endpoints.discordAppRpc}/${applicationId}/rpc`);
            if (!response.ok) {
                discordApplicationIconCache.set(applicationId, '');
                return '';
            }

            const payload = await response.json();
            const iconHash = typeof payload?.icon === 'string' ? payload.icon : '';
            const iconUrl = iconHash
                ? `https://cdn.discordapp.com/app-icons/${applicationId}/${iconHash}.png?size=256`
                : '';

            discordApplicationIconCache.set(applicationId, iconUrl);
            return iconUrl;
        } catch {
            discordApplicationIconCache.set(applicationId, '');
            return '';
        }
    }

    function updatePresence(data) {
        const presence = data.activities ? data : data;

        if (presence.discord_user) {
            const avatarId = presence.discord_user.avatar;
            avatarImg.src = `https://cdn.discordapp.com/avatars/${discordID}/${avatarId}.png`;
        }

        const status = presence.discord_status || 'offline';
        onStatusChange?.(status);

        if (statusIndicator) {
            statusIndicator.style.backgroundColor = presenceColors[status] || presenceColors.offline;
            statusIndicator.style.boxShadow = `0 0 10px ${presenceColors[status] || presenceColors.offline}`;
        }

        if (statusText) {
            statusText.textContent = t(`discord.status.${status}`);
        }

        const spotify = presence.spotify;
        const activities = presence.activities || [];
        const game = activities.find((activity) => activity.type === 0);

        if (spotify && game) {
            renderSpotifyAndGame(spotify, game);
        } else if (spotify) {
            renderSpotify(spotify);
        } else if (game) {
            renderGame(game);
        } else {
            renderIdle();
        }
    }

    function initLiveVisitorsCounter() {
        if (!supabaseClient) {
            onVisitorsCountChange?.(null);
            return;
        }

        const subscribeVisitorsChannel = () => {
            const presenceKey = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            visitorsChannel = supabaseClient.channel('portfolio-live-visitors', {
                config: {
                    presence: { key: presenceKey }
                }
            });

            const syncVisitorsCount = () => {
                const state = visitorsChannel.presenceState();
                const count = Object.values(state).reduce((acc, entries) => {
                    if (Array.isArray(entries)) return acc + entries.length;
                    return acc + 1;
                }, 0);

                onVisitorsCountChange?.(count);
            };

            visitorsChannel
                .on('presence', { event: 'sync' }, syncVisitorsCount)
                .on('presence', { event: 'join' }, syncVisitorsCount)
                .on('presence', { event: 'leave' }, syncVisitorsCount)
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        visitorsAttempts = 0;
                        await visitorsChannel.track({
                            online_at: new Date().toISOString(),
                            lang: getCurrentLang()
                        });
                        syncVisitorsCount();
                        return;
                    }

                    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                        supabaseClient.removeChannel(visitorsChannel);
                        const delay = getBackoffDelay(visitorsAttempts++, config.retries);
                        setTimeout(subscribeVisitorsChannel, delay);
                    }
                });
        };

        subscribeVisitorsChannel();

        window.addEventListener('beforeunload', () => {
            if (!visitorsChannel) return;
            visitorsChannel.untrack();
            supabaseClient.removeChannel(visitorsChannel);
        });
    }

    async function updateHeroFromSupabase() {
        const heroTag = document.getElementById('hero-availability');
        if (!heroTag || !supabaseClient || hasSupabaseStatusSync) return;
        hasSupabaseStatusSync = true;

        const { data } = await supabaseClient
            .from('portfolio_status')
            .select('*')
            .eq('id', 1)
            .single();

        if (data) {
            applyStatusToUI(data);
        }

        const subscribeStatusChannel = () => {
            statusChannel = supabaseClient
                .channel('status_updates')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'portfolio_status',
                    filter: 'id=eq.1'
                }, (payload) => {
                    applyStatusToUI(payload.new);
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        statusAttempts = 0;
                        return;
                    }

                    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                        supabaseClient.removeChannel(statusChannel);
                        const delay = getBackoffDelay(statusAttempts++, config.retries);
                        setTimeout(subscribeStatusChannel, delay);
                    }
                });
        };

        subscribeStatusChannel();
    }

    // Expose la fonction et stocke la dernière donnée reçue
    window.applyStatusToUI = applyStatusToUI;
    function applyStatusToUI(data) {
        window.lastSupabaseStatus = data;
        const heroTag = document.getElementById('hero-availability');
        if (!heroTag) return;

        let iconClass = 'bi bi-check-circle-fill';
        let iconColor = '#00ff88';
        let text = '';

        if (data.is_available === false) {
            iconClass = 'bi bi-dash-circle-fill';
            iconColor = '#ff4b4b';
            if (data.active_projects > 0) {
                text = t('hero.status.busy').replace('{count}', data.active_projects);
            } else {
                text = t('hero.status.busy_general');
            }
        } else if (data.active_projects > 0) {
            text = t('hero.status.available_busy').replace('{count}', data.active_projects);
        } else {
            text = t('hero.status.available');
        }

        const icon = document.createElement('i');
        icon.className = iconClass;
        icon.style.color = iconColor;

        const span = document.createElement('span');
        span.textContent = text;
        heroTag.innerHTML = '';
        heroTag.append(icon, span);
    }

    async function updateHeroFromJSON() {
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
                } else if (data.activeProjects > 0) {
                    heroTag.textContent = t('hero.status.available_busy').replace('{count}', data.activeProjects);
                } else {
                    heroTag.textContent = t('hero.status.available');
                }
            } catch {
                const conf = i18n.config;
                if (conf.isAvailable === false) {
                    if (conf.activeProjects > 0) {
                        heroTag.textContent = t('hero.status.busy').replace('{count}', conf.activeProjects);
                    } else {
                        heroTag.textContent = t('hero.status.busy_general');
                    }
                } else if (conf.activeProjects > 0) {
                    heroTag.textContent = t('hero.status.available_busy').replace('{count}', conf.activeProjects);
                } else {
                    heroTag.textContent = t('hero.status.available');
                }
            }
        } else {
            updateHeroFromSupabase();
        }
    }

    function activityLabel(fr, en) {
        return getCurrentLang?.() === 'en' ? en : fr;
    }

    function formatDurationMs(milliseconds) {
        if (!Number.isFinite(milliseconds) || milliseconds <= 0) return 'N/A';

        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${String(minutes).padStart(2, '0')}m`;
        }

        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    function formatClock(epochMs) {
        if (!Number.isFinite(epochMs)) return 'N/A';
        try {
            return new Date(epochMs).toLocaleTimeString(getCurrentLang?.() || 'fr', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    }

    function closeActivityPopup() {
        if (!activityPopupOverlay) return;
        activityPopupOverlay.classList.remove('open');
        activityPopupOverlay.hidden = true;
        document.body.classList.remove('activity-popup-open');
        if (activityPopupLastTrigger && typeof activityPopupLastTrigger.focus === 'function') {
            try {
                activityPopupLastTrigger.focus();
            } catch {
                // Ignore focus restoration issues when source element has been re-rendered.
            }
        }
        activityPopupLastTrigger = null;
    }

    function ensureActivityPopup() {
        if (activityPopupOverlay) return;

        activityPopupOverlay = document.createElement('div');
        activityPopupOverlay.className = 'activity-popup-overlay';
        activityPopupOverlay.hidden = true;

        activityPopupDialog = document.createElement('section');
        activityPopupDialog.className = 'activity-popup';
        activityPopupDialog.setAttribute('role', 'dialog');
        activityPopupDialog.setAttribute('aria-modal', 'true');

        const header = document.createElement('div');
        header.className = 'activity-popup-header';

        activityPopupTitle = document.createElement('h3');
        activityPopupTitle.className = 'activity-popup-title';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'activity-popup-close';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', activityLabel('Fermer', 'Close'));
        closeBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            closeActivityPopup();
        });

        header.append(activityPopupTitle, closeBtn);

        activityPopupBody = document.createElement('div');
        activityPopupBody.className = 'activity-popup-body';

        activityPopupDialog.append(header, activityPopupBody);
        activityPopupOverlay.appendChild(activityPopupDialog);
        document.body.appendChild(activityPopupOverlay);

        activityPopupOverlay.addEventListener('click', (event) => {
            if (event.target === activityPopupOverlay) {
                closeActivityPopup();
            }
        });

        activityPopupDialog.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && activityPopupOverlay && !activityPopupOverlay.hidden) {
                closeActivityPopup();
            }
        });
    }

    function openActivityPopup(options = {}, triggerElement = null) {
        ensureActivityPopup();

        const { title, entries = [], actionHref = '', actionLabel = '' } = options;
        activityPopupTitle.textContent = title || activityLabel('Détails', 'Details');
        activityPopupBody.innerHTML = '';

        const meta = document.createElement('div');
        meta.className = 'activity-meta';

        entries
            .filter((entry) => entry && entry.label && entry.value !== undefined && entry.value !== null && `${entry.value}`.trim() !== '')
            .forEach((entry, index) => {
                const item = document.createElement('div');
                item.className = 'activity-meta-item';
                item.style.setProperty('--stagger-index', String(index));

                const label = document.createElement('span');
                label.className = 'activity-meta-label';
                label.textContent = `${entry.label}:`;

                const value = document.createElement('span');
                value.className = 'activity-meta-value';
                value.textContent = `${entry.value}`;

                item.append(label, value);
                meta.appendChild(item);
            });

        if (meta.childElementCount > 0) {
            activityPopupBody.appendChild(meta);
        }

        if (actionHref && actionLabel) {
            const action = document.createElement('a');
            action.className = 'activity-action';
            action.href = actionHref;
            action.target = '_blank';
            action.rel = 'noopener noreferrer';
            action.textContent = actionLabel;
            activityPopupBody.appendChild(action);
        }

        activityPopupLastTrigger = triggerElement;
        activityPopupOverlay.hidden = false;
        activityPopupOverlay.classList.add('open');
        document.body.classList.add('activity-popup-open');
        const closeBtn = activityPopupDialog.querySelector('.activity-popup-close');
        if (closeBtn instanceof HTMLElement) {
            closeBtn.focus();
        }
    }

    function addActivityDetails(row, options = {}) {
        row.classList.add('activity-interactive');
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        row.setAttribute('aria-haspopup', 'dialog');

        const open = () => openActivityPopup(options, row);

        row.addEventListener('click', open);
        row.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open();
            }
        });
    }

    function buildSpotifyRow(spotify) {
        const total = spotify.timestamps.end - spotify.timestamps.start;
        const current = Date.now() - spotify.timestamps.start;
        const progress = Math.min((current / total) * 100, 100);
        const defaultCover = 'https://cdn.discordapp.com/embed/avatars/0.png';

        let albumCoverUrl = typeof spotify?.album_art_url === 'string' ? spotify.album_art_url.trim() : '';
        if (albumCoverUrl.startsWith('http://')) {
            albumCoverUrl = albumCoverUrl.replace('http://', 'https://');
        }
        if (!albumCoverUrl.startsWith('https://')) {
            albumCoverUrl = defaultCover;
        }

        const activityRow = document.createElement('div');
        activityRow.className = 'activity-row';

        const img = document.createElement('img');
        img.src = albumCoverUrl;
        img.className = 'activity-icon';
        img.alt = 'Album Art';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.onerror = () => {
            img.onerror = null;
            img.src = defaultCover;
        };

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

        const rowMain = document.createElement('div');
        rowMain.className = 'activity-row-main';
        rowMain.append(img, info);
        activityRow.append(rowMain);

        addActivityDetails(activityRow, {
            title: activityLabel('Détails Spotify', 'Spotify Details'),
            entries: [
                { label: activityLabel('Titre', 'Song'), value: spotify.song },
                { label: activityLabel('Artiste', 'Artist'), value: spotify.artist },
                { label: activityLabel('Album', 'Album'), value: spotify.album || '' },
                { label: activityLabel('Durée', 'Duration'), value: formatDurationMs(total) },
                { label: activityLabel('Début', 'Start'), value: formatClock(spotify.timestamps.start) },
                { label: activityLabel('Fin', 'End'), value: formatClock(spotify.timestamps.end) }
            ],
            actionHref: spotify.track_id ? `https://open.spotify.com/track/${spotify.track_id}` : '',
            actionLabel: activityLabel('Ouvrir sur Spotify', 'Open in Spotify')
        });

        return activityRow;
    }

    function renderSpotify(spotify) {
        const activityRow = buildSpotifyRow(spotify);

        activityContainer.innerHTML = '';
        activityContainer.appendChild(activityRow);
    }

    async function buildGameRow(game) {
        let iconUrl = getDiscordCdnAssetUrl(game.application_id, game.assets?.large_image)
            || getDiscordCdnAssetUrl(game.application_id, game.assets?.small_image)
            || await getDiscordApplicationIconUrl(game.application_id)
            || 'https://cdn.discordapp.com/embed/avatars/0.png';

        const activityRow = document.createElement('div');
        activityRow.className = 'activity-row';

        const img = document.createElement('img');
        img.src = iconUrl;
        img.className = 'activity-icon';
        img.alt = 'Game Icon';
        img.loading = 'lazy';

        const assetFallbackUrl = getDiscordCdnAssetUrl(game.application_id, game.assets?.small_image)
            || getDiscordCdnAssetUrl(game.application_id, game.assets?.large_image)
            || 'https://cdn.discordapp.com/embed/avatars/0.png';
        img.onerror = () => {
            if (img.src !== assetFallbackUrl) {
                img.src = assetFallbackUrl;
                return;
            }

            img.onerror = null;
            img.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
        };

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

        const rowMain = document.createElement('div');
        rowMain.className = 'activity-row-main';
        rowMain.append(img, info);
        activityRow.append(rowMain);

        addActivityDetails(activityRow, {
            title: activityLabel('Détails activité', 'Activity Details'),
            entries: [
                { label: activityLabel('Nom', 'Name'), value: game.name || '' },
                { label: activityLabel('Statut', 'Status'), value: game.details || t('discord.playing') },
                { label: activityLabel('État', 'State'), value: game.state || '' },
                { label: activityLabel('Application ID', 'Application ID'), value: game.application_id || '' },
                { label: activityLabel('Début', 'Start'), value: formatClock(game.timestamps?.start) },
                { label: activityLabel('Durée', 'Elapsed'), value: formatDurationMs(game.timestamps?.start ? Date.now() - game.timestamps.start : NaN) }
            ]
        });

        return activityRow;
    }

    async function renderSpotifyAndGame(spotify, game) {
        const spotifyRow = buildSpotifyRow(spotify);
        const gameRow = await buildGameRow(game);

        const stack = document.createElement('div');
        stack.className = 'activity-stack';
        stack.append(spotifyRow, gameRow);

        activityContainer.innerHTML = '';
        activityContainer.appendChild(stack);
    }

    async function renderGame(game) {
        const activityRow = await buildGameRow(game);

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

    if (document.getElementById('discord-activity')) {
        connectLanyard();
    }

    initLiveVisitorsCounter();
    updateHeroFromJSON();

    const card = document.getElementById('lanyard-card');
    const toggleBtn = document.querySelector('.card-toggle');
    const toggleIcon = document.querySelector('.toggle-icon');

    if (card && toggleBtn) {
        toggleBtn.setAttribute('aria-expanded', 'true');

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            card.classList.toggle('minimized');

            if (card.classList.contains('minimized')) {
                toggleIcon.textContent = '+';
                toggleBtn.setAttribute('aria-expanded', 'false');
            } else {
                toggleIcon.textContent = '−';
                toggleBtn.setAttribute('aria-expanded', 'true');
            }
        });

        card.addEventListener('click', () => {
            if (card.classList.contains('minimized')) {
                card.classList.remove('minimized');
                toggleIcon.textContent = '−';
                toggleBtn.setAttribute('aria-expanded', 'true');
            }
        });
    }
}
