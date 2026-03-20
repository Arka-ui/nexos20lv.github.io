# 🏗️ Architecture Portfolio

> Vue d'ensemble complète du flux de données, de l'infrastructure et des patterns utilisés.

## 📊 Diagramme flux global

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────┐    ┌──────────────────────┐                 │
│  │   index.html       │    │  CSS (base,         │                 │
│  │   (DOM)            │    │   components,       │                 │
│  │                    │    │   animations)       │                 │
│  └──────────┬─────────┘    └──────────┬───────────┘                 │
│             │                         │                              │
│  ┌──────────▼─────────────────────────▼──────────┐                  │
│  │         JavaScript Main (app.js)              │                  │
│  │  - i18n (FR/EN)                               │                  │
│  │  - Module initialization                      │                  │
│  │  - Event listeners & handlers                 │                  │
│  └──────────┬──────────────────────────────────┬─┘                  │
│             │                                  │                     │
│  ┌──────────▼──────────────────────────────────▼──────────────────┐  │
│  │                      MODULES                                    │  │
│  │                                                                  │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐            │  │
│  │  │ perf-mode   │  │ modal        │  │ scroll-      │            │  │
│  │  │ (perf/a11y) │  │ (overlay mgr)│  │ animations   │            │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘            │  │
│  │                                                                  │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐            │  │
│  │  │ discord-    │  │ projects-ui  │  │ lazy-images  │            │  │
│  │  │ realtime    │  │ (search)     │  │ (progressive)│            │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘            │  │
│  │                                                                  │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐            │  │
│  │  │ ui-effects  │  │ retry        │  │ web-vitals   │            │  │
│  │  │ (animations)│  │ (backoff)    │  │ (monitoring) │            │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘            │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                           ▲                                         │
│                           │ (events)                                │
│                    ┌──────┴──────────┐                             │
│                    │   Service       │                             │
│                    │   Worker        │                             │
│                    │   (Cache)       │                             │
│                    └─────────────────┘                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
        │                   │                   │                   │
        │ HTTP              │ WebSocket         │ API              │ Images
        │                   │ (Lanyard)         │ (GitHub)         │ (Lazy Load)
       ▼                   ▼                   ▼                   ▼
    ┌─────────┐         ┌─────────────┐   ┌──────────┐        ┌────────┐
    │ Supabase│         │ Lanyard     │   │  GitHub  │        │ CSN    │
    │Realtime │         │ API (Discord│   │   API    │        │(images)│
    │(Presence│         │  Presence)  │   │          │        │        │
    │ Events) │         └─────────────┘   └──────────┘        └────────┘
    └─────────┘
```

## 🔄 Flux de données temps réel

### 1. **Discord Presence** (WebSocket)

```
Lanyard API (wss://api.lanyard.rest/socket)
    ↓
discord-realtime.js
    ⟶ Connect & receive presence events
    ⟶ Parse user status, activity, avatar
    ↓
app.js (store lastDiscordStatus)
    ↓
DOM update (#discord-status-text, avatar)
    ↓
Live rendering in Discord card
```

**Retry logic**: `retry.js` avec backoff exponential (1.2s → 30s max)
**Fallback**: Affiche "offline" si connexion échoue

### 2. **Visiteurs en direct** (Supabase Realtime)

```
app.js (initSupabasePresence)
    ↓
Supabase.from('presence').on('*').subscribe()
    ↓
Real-time count changes
    ↓
renderLiveVisitorsCount(count)
    ↓
Update DOM (#live-visitors-text)
```

**Interaction**: 
- Client connecté = +1 visiteur
- Client déconnecté / timeout = -1 visiteur

### 3. **Statistiques GitHub**

```
projects-ui.js (init, then lazy)
    ↓
GitHub API: /repos/{owner}/
    ⟶ Stars, forks, updated date
    ⟶ Langage principal
    ↓
Rate limit management (60 req/hr public, 5000 private)
    ↓
LANGUAGE_COLORS.js (map lang → color)
    ↓
Inject color badges in project cards
```

**Cache**: localStorage + 5 min TTL
**Fallback**: Affiche "N/A" si API rate-limited

## 🛠️ Modules clés

### `js/modules/perf-mode.js`
- Détecte device bas-end (mémoire < 4GB, CPU < 4 cores)
- Désactive animations si `prefers-reduced-motion`
- Mode compact via `?compact=1` URL param
- Idle init via `requestIdleCallback`

**Exports**: 
```javascript
runWhenIdle(callback)
shouldAutoEnablePerfMode()
initPerformanceMode()
initAccessibilityMode()
initUltraCompactMode()
```

### `js/modules/modal.js`
- Overlay manager (focus trap, aria-hidden)
- Projects modal, skills modal, contact form
- Keyboard support (Escape to close)

**Exports**:
```javascript
createOverlayManager() → { openOverlay, closeOverlay }
```

### `js/modules/scroll-animations.js` ⭐ NEW
- Intersection Observer pour fade-in, slide, scale
- Data-driven: `<div data-animate="fade-in">`

**Exports**:
```javascript
initScrollAnimations() → { observer, observe }
animationPresets
```

### `js/modules/lazy-images.js` ⭐ NEW
- Native lazy loading + fallback observer
- WebP detection & srcset support
- Preload critical images

**Exports**:
```javascript
initLazyImages()
preloadImages(urls)
buildSrcSet(basePath, options)
```

### `js/modules/web-vitals.js` ⭐ NEW
- Core Web Vitals: LCP, FID, CLS, TTFB, FCP
- Logs in window.__VITALS__ & localStorage
- Beacon on page unload

**Exports**:
```javascript
initWebVitals() → vitals object
getVitalsLog()
clearVitalsLog()
```

## 📦 Service Worker

**Localisation**: `sw.js`

**Stratégies de cache**:
```
┌────────────────────────────────────────┐
│ Fetch URL                              │
└────────────────────────────────────────┘
       ↓
   ┌───────────────────┐
   │ Type de ressource?│
   └───────────────────┘
       ↙     ↓     ↘
    JS/CSS  API   HTML
      ↓     ↓      ↓
    Cache  Network Stale-
    First  First  While-
                 Revalidate
```

**Registration** (dans `js/main.js`):
```javascript
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}
```

## 🎯 Performance optimizations

### 1. **Images progressives**
```html
<!-- Lazy load avec WebP -->
<img 
    src="placeholder.gif" 
    data-src="image.jpg" 
    data-srcWebp="image.webp"
    loading="lazy" 
    data-animate="fade-in"
/>
```

### 2. **CSS animations**
- Prefère GPU: `transform` & `opacity`
- Respecte `prefers-reduced-motion`
- Stagger effect via `--stagger-index`

### 3. **Code splitting**
- Modules ES6 (lazy evaluated)
- Idle initialization (requestIdleCallback)
- Retry avec jitter pour API calls

### 4. **Monitoring**
```
Web Vitals → localStorage → Analytics endpoint
     ↓          ↓
  Real-time   Debug via getVitalsLog()
```

## 🔐 Sécurité

### CSP (Content Security Policy)
```
script-src: 'self' GitHub Actions SHA256 + trusted CDNs
style-src: 'self' Google Fonts + CDNs
font-src: 'self' Google Fonts
img-src: 'self' + approved domains (Discord, GitHub, Spotify)
connect-src: APIs (GitHub, Lanyard, Supabase)
frame-src: Restreint aux iframes approuvés
```

### Service Worker boundaries
- Same-origin par défaut
- Allowed external: fonts.googleapis, cdn.jsdelivr.net, api.github.com
- API calls: networkFirst pour fraîcheur

## 🌍 Internationalization (i18n)

```
js/i18n.js
    ↓
    ├─ en: { ... }
    └─ fr: { ... }
        ↓
app.js applyLanguage(lang)
    ↓
[data-i18n="key"] → textContent
[data-i18n-html="key"] → innerHTML (sanitized)
[data-i18n-content="key"] → meta content
```

**Storage**: localStorage key `portfolio-lang`

## 📊 Tests visuels CI/CD

**Workflow**: `.github/workflows/visual-tests.yml`

```
Push/PR event
    ↓
├─ Start local server (http-server)
├─ Wait for readiness (curl loop)
│
├─ Desktop tests
│  └─ Puppeteer snapshots @1920x1080
│
├─ Mobile tests
│  └─ iPhone 12, SE, Pixel 5/6, iPad, Android
│
├─ Performance check
│  └─ LCP, FCP, TTFB, long tasks
│
└─ Comment PR avec résultats
```

## 🚀 Déploiement

**GitHub Pages** + CNAME
```
main branch
    ↓
GitHub Actions (build artifacts)
    ↓
/repo → nexos20lv.github.io
    ↓
https://nexos20lv.github.io/
```

**Environment**:
- `js/config.js` (Supabase URL, GitHub token endpoints)
- No secrets in browser (anon key is public)
- Service role token only in bot (Node.js)

## 📝 Checklist: Améliorer l'architecture

- [ ] Ajouter analytics endpoint pour Web Vitals
- [ ] Configurer Chromatic token pour tests visuels
- [ ] Implémenter image compression pipeline (WebP generation)
- [ ] Ajouter monitoring d'erreurs (Sentry optional)
- [ ] Documenter pattern de form validation
- [ ] Tester PWA offline support
- [ ] Benchmarker impact de chaque module

---

**Dernière MàJ**: Mars 2026
