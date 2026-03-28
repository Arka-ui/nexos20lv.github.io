# Portfolio Modernization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all bugs and security issues, refresh the visual design section by section (keeping the dark violet DA), and add JSDoc + README documentation.

**Architecture:** Static vanilla HTML/CSS/JS site. No build step. Changes are direct edits to source files. `js/main.js` → `js/app.js` (333-line orchestrator) → `js/modules/*.js`. Note: `js/modules/app-features.js` is a dead legacy file not imported anywhere — do not touch it.

**Tech Stack:** HTML5, CSS3 (custom properties), vanilla ES modules, Supabase, Lanyard WebSocket, GitHub API.

**Local dev:** `npx serve .` from repo root, then open `http://localhost:3000`.

---

## Task 1: index.html — Critical HTML & SEO fixes

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add missing `<title>` tag**

In `index.html`, inside `<head>` just after the `<meta charset>` line (line 5), add:
```html
<title>Pierre Bouteman | Développeur Full-Stack</title>
```

- [ ] **Step 2: Inline the broken ld+json structured data**

Replace line 68:
```html
<script type="application/ld+json" src="assets/structured-data.json"></script>
```
With the inlined content from `assets/structured-data.json`:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Person", "name": "Pierre Bouteman", "url": "https://nexos20lv.github.io/", "jobTitle": "Developpeur Full-Stack", "sameAs": ["https://github.com/nexos20lv", "https://discord.com/users/1288079115248992297"] },
    { "@type": "WebSite", "name": "Portfolio de Pierre Bouteman", "url": "https://nexos20lv.github.io/", "inLanguage": ["fr", "en"] },
    { "@type": "ItemList", "name": "Projets portfolio", "itemListElement": [
      { "@type": "SoftwareSourceCode", "position": 1, "name": "Conferences Orientation", "url": "https://conferencesorientationpdz.eclozionmc.ovh/" },
      { "@type": "SoftwareSourceCode", "position": 2, "name": "Nexaria", "url": "https://nexaria.netlib.re" },
      { "@type": "SoftwareSourceCode", "position": 3, "name": "Guerre Des Capsules", "url": "https://github.com/nexos20lv/La-Guerre-Des-Capsules" },
      { "@type": "SoftwareSourceCode", "position": 4, "name": "Portfolio", "url": "https://github.com/nexos20lv/nexos20lv.github.io" },
      { "@type": "SoftwareSourceCode", "position": 5, "name": "Nexaria Launcher", "url": "https://github.com/nexos20lv/Nexaria-Launcher" },
      { "@type": "SoftwareSourceCode", "position": 6, "name": "WebMap", "url": "https://github.com/nexos20lv/WebMap" },
      { "@type": "SoftwareSourceCode", "position": 7, "name": "Home Assistant Desktop", "url": "https://github.com/nexos20lv/Home-Assistant-Desktop" },
      { "@type": "SoftwareSourceCode", "position": 8, "name": "AzureLab Dashboard", "url": "https://github.com/nexos20lv/AzureLab-Dashboard" }
    ]}
  ]
}
</script>
```

- [ ] **Step 3: Fix duplicate og:image and twitter:image**

Remove the `opengraph.githubassets.com` og:image and twitter:image lines. Keep only the `raw.githubusercontent.com` SVG version. Final state — exactly one of each:
```html
<meta property="og:image" content="https://raw.githubusercontent.com/nexos20lv/nexos20lv.github.io/main/assets/og-image.svg">
<meta property="og:image:secure_url" content="https://raw.githubusercontent.com/nexos20lv/nexos20lv.github.io/main/assets/og-image.svg">
<meta property="og:image:type" content="image/svg+xml">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:image" content="https://raw.githubusercontent.com/nexos20lv/nexos20lv.github.io/main/assets/og-image.svg">
<meta name="twitter:image:alt" content="Aperçu du portfolio de Pierre Bouteman">
```

- [ ] **Step 4: Harden the Content Security Policy**

In the CSP meta tag, make two changes:
1. Remove `style-src-attr 'unsafe-inline';`
2. Add `frame-ancestors 'none';` at the end of the policy string.

Updated CSP meta:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self';
    script-src 'self' 'sha256-vvt4KWwuNr51XfE5m+hzeNEGhiOfZzG97ccfqGsPwvE=' https://cdn.jsdelivr.net https://api.lanyard.rest;
    style-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net;
    font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net;
    img-src 'self' data: https://cdn.discordapp.com https://cdn.discordapp.net https://media.discordapp.net https://avatars.githubusercontent.com https://api.github.com https://opengraph.githubassets.com https://s.wordpress.com https://i.scdn.co https://mosaic.scdn.co;
    connect-src 'self' https://cdn.jsdelivr.net wss://api.lanyard.rest wss://*.supabase.co https://api.github.com https://*.supabase.co https://discord.com;
    frame-src https://conferencesorientationpdz.eclozionmc.ovh https://nexaria.netlib.re;
    base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none';">
```

- [ ] **Step 5: Verify in browser**

Run `npx serve .`. Check:
- Browser tab shows "Pierre Bouteman | Développeur Full-Stack"
- DevTools → Elements → `ld+json` script has inline JSON (no src attribute)
- No CSP violation warnings in Console

- [ ] **Step 6: Commit**
```bash
git add index.html
git commit -m "fix: title tag, inline ld+json, deduplicate og meta, harden CSP"
```

---

## Task 2: js/app.js — JS bug fixes

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Fix frame buster (add try/catch)**

Replace lines 34–36:
```js
    // Basic clickjacking defense when served without strict headers.
    if (window.self !== window.top) {
        window.top.location = window.self.location;
    }
```
With:
```js
    // Basic clickjacking defense. try/catch needed: cross-origin sandboxed iframes
    // throw SecurityError on .top access. frame-ancestors 'none' in CSP is the real guard.
    try {
        if (window.self !== window.top) {
            window.top.location = window.self.location;
        }
    } catch (_) { /* cross-origin frame — CSP frame-ancestors handles this */ }
```

- [ ] **Step 2: Replace fragile HTML sanitizer with DOM-based allowlist**

The current approach strips only script tags via regex, missing other vectors.
Replace the `data-i18n-html` handler block (lines 81–85) with a DOM-based sanitizer:

```js
        document.querySelectorAll('[data-i18n-html]').forEach((element) => {
            const raw = t(element.dataset.i18nHtml);
            // Use <template> for safe parsing — no script execution, no network requests.
            // Then walk the fragment and strip anything outside the allowlist.
            const ALLOWED_TAGS = new Set(['STRONG', 'EM', 'SPAN', 'BR', 'A']);
            const ALLOWED_ATTRS = { A: ['href'] };

            const tpl = document.createElement('template');
            tpl.innerHTML = raw; // safe: template content is inert
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
            });

            element.replaceChildren(frag);
        });
```

Note: `<template>.content` is an inert document fragment — browsers do not execute scripts or load resources from it. This is the standard safe parsing approach without external libraries.

- [ ] **Step 3: Add missing data-i18n-placeholder handler**

Inside `applyLanguage()` (after the `aria-label` handler block, around line 93), add:
```js
        document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
            element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
        });
```

- [ ] **Step 4: Verify in browser**

- Switch language to EN → form placeholders change to English
- Check console for zero errors
- All `data-i18n-html` elements render correctly (bold text, links preserved)

- [ ] **Step 5: Commit**
```bash
git add js/app.js
git commit -m "fix: frame buster try/catch, DOM-based i18n sanitizer, i18n placeholder handler"
```

---

## Task 3: css/base.css — Design tokens & scrollbar

**Files:**
- Modify: `css/base.css`

- [ ] **Step 1: Add new design tokens to `:root`**

In `css/base.css`, at the end of the `:root` block (after `--transition-base: 0.3s;`), add:
```css
    /* Elevation & Glass system */
    --shadow-card: 0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(124,58,237,0.08);
    --glow-hover: 0 0 24px rgba(124,58,237,0.3), 0 0 48px rgba(124,58,237,0.12);
    --glass-bg: rgba(21, 17, 34, 0.6);
    --glass-border: rgba(124, 58, 237, 0.2);
    --glass-blur: blur(16px);
```

- [ ] **Step 2: Style the scrollbar**

At the end of `css/base.css`, add:
```css
/* ── SCROLLBAR ── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb {
    background: rgba(124, 58, 237, 0.4);
    border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover { background: rgba(124, 58, 237, 0.7); }
```

- [ ] **Step 3: Verify**

Scrollbar is thin and violet-tinted. No visual regressions.

- [ ] **Step 4: Commit**
```bash
git add css/base.css
git commit -m "style: add glass/shadow/glow design tokens and styled scrollbar"
```

---

## Task 4: Hero visual refresh

**Files:**
- Modify: `css/base.css`
- Modify: `css/components.css`

- [ ] **Step 1: Larger headline + animated gradient text**

In `css/base.css`, after the `.hero-content` block, add:
```css
.hero h1 {
    font-size: clamp(3.5rem, 8vw, 7rem);
    line-height: 1.05;
    letter-spacing: -0.03em;
    font-family: var(--font-heading);
    font-weight: 800;
}
.hero h1 .glow-word {
    background: linear-gradient(135deg, var(--violet-light) 0%, var(--accent) 60%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    background-size: 200% 200%;
    animation: gradient-shift 4s ease-in-out infinite alternate;
}
@keyframes gradient-shift {
    from { background-position: 0% 50%; }
    to { background-position: 100% 50%; }
}
```

- [ ] **Step 2: Strengthen hero orb with pulse animation**

In `css/base.css`, find `.hero::before` and replace it with:
```css
.hero::before {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 70vw; height: 70vw;
    background: radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, transparent 65%);
    z-index: -1;
    pointer-events: none;
    filter: blur(60px);
    animation: hero-pulse 5s ease-in-out infinite alternate;
}
@keyframes hero-pulse {
    from { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
}
```

- [ ] **Step 3: Improve hero-tag pill and hero-sub**

In `css/components.css`, find `.hero-tag` and update:
```css
.hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    letter-spacing: 1.5px;
    color: var(--violet-light);
    margin-bottom: 2rem;
    padding: 0.4rem 1rem;
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-pill);
    background: var(--glass-bg);
}
.hero-sub {
    font-size: clamp(1rem, 1.5vw, 1.2rem);
    color: var(--text-muted);
    max-width: 640px;
    margin: 1.5rem auto 2.5rem;
    line-height: 1.75;
}
```

- [ ] **Step 4: Improve btn-primary hover glow**

In `css/components.css`, find `.btn-primary:hover` and add/update:
```css
.btn-primary:hover {
    box-shadow: var(--glow-hover);
    transform: translateY(-2px);
}
```

- [ ] **Step 5: Verify**

Hero headline is large with animated gradient on "Full-Stack". Orb pulses gently. Status tag is a glass pill. Primary buttons glow on hover.

- [ ] **Step 6: Commit**
```bash
git add css/base.css css/components.css
git commit -m "style: hero refresh — larger headline, gradient text, orb pulse, btn glow"
```

---

## Task 5: About section visual refresh

**Files:**
- Modify: `css/components.css`

- [ ] **Step 1: Improve bio-grid gap and big-text readability**

Find `.bio-grid` (around line 2601) and `.big-text` (around line 2608):
```css
.bio-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 5rem;
    align-items: flex-start;
}
.big-text {
    font-size: clamp(1.1rem, 1.4vw, 1.3rem);
    line-height: 1.85;
    color: rgba(233, 228, 245, 0.85);
}
```

- [ ] **Step 2: Improve glass-panel with tokens**

Find `.glass-panel` (around line 2623), replace:
```css
.glass-panel {
    padding: var(--space-6);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    box-shadow: var(--shadow-card);
    transition: box-shadow 0.3s var(--ease-smooth);
}
.glass-panel:hover {
    box-shadow: var(--glow-hover);
}
```

- [ ] **Step 3: Thicker GitHub language bar**

Find `.gh-lang-bar-container` and update:
```css
.gh-lang-bar-container {
    display: flex;
    height: 8px;
    border-radius: var(--radius-pill);
    overflow: hidden;
    gap: 2px;
    margin-bottom: 0.75rem;
}
```

- [ ] **Step 4: Verify**

About section: more breathing room, glassy panels with hover glow, thicker language bar.

- [ ] **Step 5: Commit**
```bash
git add css/components.css
git commit -m "style: about section — wider gap, glass panels, github bar"
```

---

## Task 6: Projects section visual refresh

**Files:**
- Modify: `css/components.css`

- [ ] **Step 1: Improve carousel card glass and hover**

Find `.carousel-item` (around line 240):
```css
.carousel-item {
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: calc(var(--space-5) + 0.15rem);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur) saturate(160%);
    -webkit-backdrop-filter: var(--glass-blur) saturate(160%);
    transition: all 0.4s var(--ease-smooth);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    box-shadow: var(--shadow-card);
}
.carousel-item:hover {
    border-color: rgba(124, 58, 237, 0.45);
    transform: translateY(-6px) scale(1.01);
    box-shadow: var(--glow-hover);
}
```

- [ ] **Step 2: Improve tech pills**

Find `.tech-pill` (around line 2569):
```css
.tech-pill {
    display: inline-flex;
    align-items: center;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.5px;
    padding: 0.25rem 0.65rem;
    border-radius: var(--radius-pill);
    background: rgba(124, 58, 237, 0.15);
    border: 1px solid rgba(124, 58, 237, 0.3);
    color: var(--violet-pale);
    transition: background 0.2s, border-color 0.2s;
}
.carousel-item:hover .tech-pill {
    background: rgba(124, 58, 237, 0.25);
    border-color: rgba(124, 58, 237, 0.5);
}
```

- [ ] **Step 3: Improve active client-filter-btn**

Find `.client-filter-btn.active`:
```css
.client-filter-btn.active {
    background: var(--violet);
    color: #fff;
    border-color: var(--violet);
    box-shadow: 0 0 12px rgba(124, 58, 237, 0.4);
}
```

- [ ] **Step 4: Improve featured metric display**

Find `.featured-metric-value` and `.featured-metric-label`:
```css
.featured-metric-value {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--violet-light);
}
.featured-metric-label {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 1px;
    color: var(--text-muted);
    text-transform: uppercase;
}
```

- [ ] **Step 5: Verify**

Cards: stronger hover glow. Tech pills: colored. Active filter: clearly visible. Metrics: bold and violet.

- [ ] **Step 6: Commit**
```bash
git add css/components.css
git commit -m "style: projects — glass cards, tech pills, filter buttons, metrics panel"
```

---

## Task 7: Contact & footer visual refresh

**Files:**
- Modify: `css/components.css`

- [ ] **Step 1: Form input focus glow**

Find and update `.form-group input:focus, .form-group textarea:focus`:
```css
.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--violet);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2), 0 0 16px rgba(124, 58, 237, 0.1);
}
```

- [ ] **Step 2: Contact links as mini-cards**

Find `.contact-link` (around line 2420), replace:
```css
.contact-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    font-size: 0.9rem;
    transition: all 0.25s var(--ease-smooth);
    width: 100%;
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
}
.contact-link:hover {
    background: rgba(124, 58, 237, 0.12);
    border-color: rgba(124, 58, 237, 0.4);
    color: #fff;
    box-shadow: var(--glow-hover);
    transform: translateX(4px);
}
.contact-link .icon {
    font-size: 1.1rem;
    color: var(--violet-light);
    flex-shrink: 0;
}
```

- [ ] **Step 3: Footer separator**

Find `footer` in `components.css`, add:
```css
footer {
    border-top: 1px solid var(--border);
    padding-top: 2rem;
    margin-top: 3rem;
}
```

- [ ] **Step 4: Verify**

Form: violet glow ring on focus. Social links: mini-card style with slide+glow on hover. Footer: subtle top divider.

- [ ] **Step 5: Commit**
```bash
git add css/components.css
git commit -m "style: contact form glow, social links as mini-cards, footer divider"
```

---

## Task 8: JSDoc — Utility modules

**Files:** `js/modules/retry.js`, `js/modules/github-colors.js`, `js/modules/lazy-images.js`, `js/modules/scroll-animations.js`, `js/modules/modal.js`, `js/modules/web-vitals.js`

Read each file before editing it.

- [ ] **Step 1: retry.js** — Add at top: `@module retry` + `@description Exponential backoff delay calculation for WebSocket/API retries.` Before `getBackoffDelay`: `@param {number} attempt` + `@param {{ baseDelayMs, maxDelayMs }} config` + `@returns {number}`

- [ ] **Step 2: github-colors.js** — Add at top: `@module github-colors` + `@description Maps GitHub language names to hex colors for the language bar.` + `@type {Record<string, string>}`

- [ ] **Step 3: lazy-images.js** — Add `@module lazy-images` + `@description IntersectionObserver lazy loading for img[data-src]`. Before `initLazyImages`: `@returns {void}` + describe the IntersectionObserver fallback.

- [ ] **Step 4: scroll-animations.js** — Add `@module scroll-animations` + `@description Triggers [data-animate] CSS classes on viewport entry`. Before `initScrollAnimations`: `@returns {void}`.

- [ ] **Step 5: modal.js** — Add `@module modal` + `@description Accessible overlay manager with focus trap`. Before `createOverlayManager`: `@returns {{ openOverlay, closeOverlay }}`. Before inner `openOverlay`: `@param {HTMLElement} overlay` + `@param {HTMLElement|null} triggerElement` + `@param {Function} [onEscape]`. Before inner `closeOverlay`: `@param {HTMLElement} overlay`.

- [ ] **Step 6: web-vitals.js** — Add `@module web-vitals` + `@description Collects Core Web Vitals (LCP, FID, CLS) and logs to console.` Before `initWebVitals`: `@returns {void}`.

- [ ] **Step 7: Commit**
```bash
git add js/modules/retry.js js/modules/github-colors.js js/modules/lazy-images.js \
        js/modules/scroll-animations.js js/modules/modal.js js/modules/web-vitals.js
git commit -m "docs: JSDoc for utility modules (retry, colors, lazy-images, animations, modal, vitals)"
```

---

## Task 9: JSDoc — Feature modules

**Files:** `js/modules/perf-mode.js`, `js/modules/ui-effects.js`, `js/modules/terminal-ui.js`, `js/modules/skills-modal.js`, `js/modules/project-search-ui.js`

Read each file before editing.

- [ ] **Step 1: perf-mode.js** — `@module perf-mode` + `@description Manages performance, accessibility, ultra-compact modes. Auto-detects low-end devices.` Add `@param`/`@returns` before: `runWhenIdle`, `shouldAutoEnablePerfMode`, `initPerformanceMode`, `initAccessibilityMode`, `initUltraCompactMode`.

- [ ] **Step 2: ui-effects.js** — `@module ui-effects` + `@description Loader, custom cursor, scroll reveal, card tilt, sticky header, reading progress.` Add `@param`/`@returns` before each exported `init*` function.

- [ ] **Step 3: terminal-ui.js** — `@module terminal-ui` + `@description Interactive terminal overlay with command history.` Before `initTerminalUI`: `@param {{ openOverlay, closeOverlay, dot, ring, applyLanguage }} options` + `@returns {{ toggleTerminal, initTerminal }}`.

- [ ] **Step 4: skills-modal.js** — `@module skills-modal` + `@description Opens detail modal on skill marquee click. Content from i18n skills.* keys.` Before `initSkillsModal`: `@param {{ openOverlay, closeOverlay, dot, ring, t, getCurrentLang }} options` + `@returns {void}`.

- [ ] **Step 5: project-search-ui.js** — `@module project-search-ui` + `@description Full-text project search overlay, triggered by Ctrl/Cmd+K.` Before `initProjectSearchUI`: `@param {{ i18n, getCurrentLang, t, openOverlay, closeOverlay, dot, ring, openModal, applyLanguage, toggleTerminal }} options` + `@returns {void}`.

- [ ] **Step 6: Commit**
```bash
git add js/modules/perf-mode.js js/modules/ui-effects.js js/modules/terminal-ui.js \
        js/modules/skills-modal.js js/modules/project-search-ui.js
git commit -m "docs: JSDoc for feature modules (perf, ui-effects, terminal, skills, search)"
```

---

## Task 10: JSDoc — Core modules

**Files:** `js/modules/contact-form.js`, `js/modules/discord-realtime.js`, `js/modules/projects-ui.js`

Read each file before editing.

- [ ] **Step 1: contact-form.js** — At top: `@module contact-form` + describe the payload format (`provider: 'telegram'`, `type: 'contact'|'booking'`, `timestamp`, `contact: {name, email, message}`, `text: string`). Before `initContactForm`: `@param {{ config: {supabaseUrl, supabaseAnonKey}, t }} options` + `@returns {void}`.

- [ ] **Step 2: discord-realtime.js** — At top: `@module discord-realtime` + `@description Lanyard WebSocket for Discord presence. Exponential backoff reconnect. Supabase realtime for visitor count. Protocol: heartbeat every 30s.` Before `initDiscordRealtime`: `@param {{ config, t, getCurrentLang, getBackoffDelay, onStatusChange, onVisitorsCountChange }} options` + `@returns {void}`.

- [ ] **Step 3: projects-ui.js** — At top: `@module projects-ui` + `@description Project carousel, modal, GitHub stats, client-mode filters. Project data is in the projectData array. GitHub API calls are deferred via runWhenIdle. To add a project: add entry to projectData AND a .carousel-item in index.html.` Before `initProjectsUI`: `@param {{ i18n, config, t, getCurrentLang, openOverlay, closeOverlay, dot, ring, languageColors }} options` + `@returns {{ openModal, applyProjectStatusBadges, refreshOpenModal, initGitHubStats, initFeaturedMetrics }}`.

- [ ] **Step 4: Commit**
```bash
git add js/modules/contact-form.js js/modules/discord-realtime.js js/modules/projects-ui.js
git commit -m "docs: JSDoc for core modules (contact-form, discord-realtime, projects-ui)"
```

---

## Task 11: JSDoc — js/app.js

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add file-level module doc**

At the very top of `js/app.js` (before imports), add:
```js
/**
 * @module app
 * @description Main application bootstrap. Init order:
 * 1. i18n + language switching
 * 2. Loader animation + perf/a11y modes
 * 3. Scroll, lazy-loading, web vitals, custom cursor
 * 4. Discord realtime + visitor count
 * 5. Projects UI (GitHub stats deferred)
 * 6. Terminal + project search (deferred via runWhenIdle)
 * 7. Contact form + quick guided tour
 *
 * Entry: js/main.js → js/app.js
 * Heavy init is deferred with runWhenIdle() to keep TTI low.
 */
```

- [ ] **Step 2: Add JSDoc to inner functions**

Before `renderLiveVisitorsCount`:
```js
    /**
     * Updates the hero live visitor counter element.
     * @param {number} count - Non-integer or negative shows loading state.
     */
```
Before `t`:
```js
    /**
     * Translates a dot-notation i18n key. Falls back: currentLang → fr → key.
     * @param {string} key - e.g. 'hero.title.prefix'
     * @returns {string}
     */
```
Before `applyLanguage`:
```js
    /**
     * Applies a language to all i18n-bound DOM elements and persists the choice.
     * Handles: textContent, sanitized HTML, content/aria-label/placeholder attributes.
     * @param {string} lang - 'fr' | 'en'
     */
```
Before `initQuickGuidedTour`:
```js
    /**
     * Sets up the 30-second portfolio tour button.
     * Tour: projects section → 3 featured modals → contact section.
     * Skip button resolves the current wait promise immediately.
     */
```

- [ ] **Step 3: Commit**
```bash
git add js/app.js
git commit -m "docs: JSDoc for app.js orchestrator"
```

---

## Task 12: README rewrite

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README.md**

Write the following content to `README.md`:

```markdown
# Pierre Bouteman — Portfolio

Live: [nexos20lv.github.io](https://nexos20lv.github.io/)

Personal portfolio — dark-themed, vanilla JS, no build step.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (single-page, `index.html`) |
| Styles | CSS3 custom properties (`css/base.css`, `css/components.css`, `css/animations.css`) |
| Logic | Vanilla ES modules (`js/app.js` + `js/modules/`) |
| Realtime | [Lanyard](https://github.com/phineas/lanyard) WebSocket — Discord presence |
| Backend | [Supabase](https://supabase.com/) — contact form edge function + live visitor count |
| External APIs | GitHub REST API v3 — repo stats & language breakdown |
| Hosting | GitHub Pages + custom CNAME |

---

## File Structure

```text
.
├── index.html              # Single-page HTML — all sections inline
├── css/
│   ├── base.css            # Reset, design tokens, layout primitives, loader
│   ├── components.css      # All component styles (nav, hero, projects, contact…)
│   └── animations.css      # Keyframes + [data-animate] scroll animation classes
├── js/
│   ├── main.js             # Entry point: imports app.js
│   ├── app.js              # Orchestrator — initializes all modules in order
│   ├── config.js           # Runtime config (Supabase, GitHub, Discord)
│   ├── i18n.js             # FR/EN translation strings
│   └── modules/
│       ├── contact-form.js       # Contact + booking → Supabase edge function
│       ├── discord-realtime.js   # Lanyard WebSocket → Discord presence card
│       ├── projects-ui.js        # Carousel, modal, GitHub stats, filters
│       ├── perf-mode.js          # Perf / a11y / ultra-compact modes
│       ├── ui-effects.js         # Loader, cursor, scroll reveal, tilt, header
│       ├── modal.js              # Accessible overlay (focus trap + keyboard)
│       ├── terminal-ui.js        # Interactive terminal overlay
│       ├── skills-modal.js       # Skill marquee → detail modal
│       ├── project-search-ui.js  # Ctrl+K project search overlay
│       ├── web-vitals.js         # Core Web Vitals (console only)
│       ├── lazy-images.js        # IntersectionObserver lazy loading
│       ├── scroll-animations.js  # [data-animate] viewport trigger
│       ├── retry.js              # Exponential backoff helper
│       └── github-colors.js      # GitHub language → hex color map
├── assets/
│   ├── logo.svg
│   ├── og-image.svg
│   └── structured-data.json      # Schema.org source (inlined in index.html)
├── supabase/functions/
│   └── contact-handler/          # Edge function: form → Telegram
└── sw.js                         # Service worker (caching)
```

---

## Local Setup

No build step. Any static server works:

```bash
npx serve .          # then open http://localhost:3000
python3 -m http.server 8080
# or VS Code Live Server extension
```

---

## Configuration

Edit `js/config.js`:

```js
export const config = {
    supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
    supabaseAnonKey: 'sb_publishable_...',  // public anon key — safe to commit
    githubUsername: 'nexos20lv',
    discordId: '...',
};
```

`supabaseAnonKey` is intentionally public — Supabase RLS restricts access. Never use a service role key here.

---

## Adding a Project

**1. Add HTML card** in `index.html` inside `.carousel-track`:

```html
<article class="carousel-item reveal" data-index="N" data-category="web" data-client-need="web">
    <div class="card-content">
        <i class="bi bi-YOUR-ICON"></i>
        <div class="project-meta" data-i18n="projects.N.meta">TYPE</div>
        <h3 class="project-title" data-i18n="projects.N.title">Titre</h3>
        <p class="project-desc" data-i18n="projects.N.desc">Description.</p>
        <div class="tech-stack"><span class="tech-pill">Tech</span></div>
        <div class="hidden-details">
            <p data-i18n="projects.N.details.1">Detail.</p>
            <a href="URL" target="_blank" rel="noopener noreferrer"
               class="btn btn-primary" data-i18n="projects.N.action">Voir</a>
        </div>
        <button class="btn btn-secondary btn-sm learn-more-btn learn-more-spaced">
            <span data-i18n="projects.learnMore">En savoir plus</span>
        </button>
    </div>
</article>
```

`N` = next index (0-based). `data-index` must match DOM position.

**2. Add project data** in `js/modules/projects-ui.js`, `projectData` array:

```js
{ index: N, githubRepo: 'nexos20lv/repo', status: 'production', hasBuildBadge: false }
```

**3. Add i18n keys** in `js/i18n.js` under `projects` for both `fr` and `en`:

```js
'N': { meta: 'APP WEB', title: '...', desc: '...', details: { '1': '...', '2': '...' }, action: '...' }
```

---

## Adding / Modifying Translations

All strings are in `js/i18n.js`:

```js
export const i18n = {
    fr: { nav: { about: 'À propos' }, ... },
    en: { nav: { about: 'About' }, ... },
};
```

To add a language: add `de: { ... }` to `i18n` (copy `en` as base) and add `<button class="lang-btn" data-lang="de">DE</button>` in `index.html`.

---

## CSP SHA-256 Hash

If you modify any inline `<script>` in `index.html`, regenerate its hash:

```bash
printf '%s' 'SCRIPT CONTENT HERE' | openssl dgst -sha256 -binary | openssl base64
```

Update the `'sha256-...'` value in the `script-src` directive of the CSP meta tag.

---

## Deployment

Push to `main` → GitHub Pages auto-deploys. Custom domain via `CNAME` file. HTTPS is automatic.
```

- [ ] **Step 2: Verify README**

Open `README.md` in VS Code preview. Check all tables, code blocks, and headings render correctly.

- [ ] **Step 3: Commit**
```bash
git add README.md
git commit -m "docs: full README rewrite — setup, structure, adding projects, i18n, CSP"
```

---

## Spec Coverage

- ✅ Title tag → Task 1
- ✅ ld+json fix → Task 1
- ✅ Duplicate OG/Twitter meta → Task 1
- ✅ CSP frame-ancestors + remove unsafe-inline style-src-attr → Task 1
- ✅ Frame buster try/catch → Task 2
- ✅ DOM-based i18n sanitizer → Task 2
- ✅ data-i18n-placeholder handler → Task 2
- ✅ Design tokens (shadow, glow, glass) → Task 3
- ✅ Custom scrollbar → Task 3
- ✅ Hero headline, gradient text, orb, CTA buttons → Task 4
- ✅ About bio-grid, big-text, glass-panel, lang bar → Task 5
- ✅ Projects cards, tech pills, filters, metrics → Task 6
- ✅ Contact form focus, social links, footer → Task 7
- ✅ JSDoc utility modules → Task 8
- ✅ JSDoc feature modules → Task 9
- ✅ JSDoc core modules → Task 10
- ✅ JSDoc app.js → Task 11
- ✅ README rewrite → Task 12
