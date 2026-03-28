# Portfolio v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mobile-first renovation of all portfolio sections — fix broken mobile navigation, add visual polish, improve functional UX, and ensure accessibility across all breakpoints.

**Architecture:** Pure vanilla HTML/CSS/JS static site (no build step). CSS changes go to `css/components.css` (or the new `css/components-critical.css`). JS changes go to existing modules in `js/modules/`. The app orchestrator in `js/app.js` wires everything. No new modules needed — only additions to existing files.

**Tech Stack:** Vanilla JS ES modules, CSS custom properties, IntersectionObserver, touch events, CSS `mask-image`, `100dvh`

---

## File Map

| File | What changes |
|------|-------------|
| `index.html` | Hamburger button, skip-link, `id="main-content"` on `<main>`, `data-type` attrs on `.tl-item`, back-to-top anchor |
| `css/base.css` | Reading progress bar styles, skip-link styles |
| `css/components.css` | Hamburger drawer, hero mobile fixes, about grid, timeline visual, projects mobile, contact/footer, Discord dot, focus-visible |
| `css/components-critical.css` | NEW — nav + hero + marquee above-fold styles extracted |
| `js/modules/ui-effects.js` | `initHamburgerMenu()`, `initBackToTop()` exported functions |
| `js/modules/modal.js` | Swipe-down-to-close gesture in `openOverlay` |
| `js/app.js` | Call `initHamburgerMenu()`, `initBackToTop()`, `initReadingProgress()` |

---

## Task 1: Reading progress bar + skip-to-content link

**Files:**
- Modify: `css/base.css`
- Modify: `index.html`
- Modify: `js/app.js`

**Context:** `#reading-progress` div already exists in `index.html` (line 82). `initReadingProgress()` already exists in `ui-effects.js` (line 235) and is already imported in `app.js` (line 41) — it just needs to be called. The skip-link needs both HTML and CSS.

- [ ] **Step 1: Add reading progress bar CSS to `css/base.css`**

Open `css/base.css`. After the scrollbar styles (`/* ── SCROLLBAR ── */` block, around line 387), add:

```css
/* ── READING PROGRESS ── */
#reading-progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    width: 0%;
    background: linear-gradient(to right, var(--violet), var(--accent));
    z-index: 1002;
    pointer-events: none;
    transition: width 0.1s linear;
}

@media (prefers-reduced-motion: reduce) {
    #reading-progress {
        transition: none;
    }
}
```

- [ ] **Step 2: Add skip-to-content CSS to `css/base.css`**

Immediately after the reading progress block:

```css
/* ── SKIP LINK ── */
.skip-link {
    position: absolute;
    top: -48px;
    left: 1rem;
    padding: 0.5rem 1rem;
    background: var(--violet);
    color: #fff;
    font-family: var(--font-mono);
    font-size: 0.875rem;
    border-radius: var(--radius-sm);
    z-index: 10001;
    transition: top 0.2s;
}

.skip-link:focus {
    top: 0.75rem;
}
```

- [ ] **Step 3: Add skip-link HTML to `index.html`**

Open `index.html`. Add as the very first child of `<body>` (before `<div id="reading-progress">`):

```html
<a href="#main-content" class="skip-link">Aller au contenu principal</a>
```

- [ ] **Step 4: Add `id="main-content"` to `<main>`**

In `index.html`, find `<main>` (line ~145) and change it to:

```html
<main id="main-content">
```

- [ ] **Step 5: Call `initReadingProgress()` in `app.js`**

In `js/app.js`, find the block (around line 339-342):
```js
    initScrollRevealAndNavSpy();
    initMotionEnhancements();
    initTiltEffect();
    initHeaderScroll();
```

Add `initReadingProgress()` after `initHeaderScroll()`:
```js
    initScrollRevealAndNavSpy();
    initMotionEnhancements();
    initTiltEffect();
    initHeaderScroll();
    initReadingProgress();
```

- [ ] **Step 6: Manual test**

Open the site in a browser. Scroll down — a thin violet-to-accent gradient bar should appear at the very top of the viewport, growing as you scroll. Tab from the address bar — a "Aller au contenu principal" button should appear in the top-left corner.

- [ ] **Step 7: Commit**

```bash
git add css/base.css index.html js/app.js
git commit -m "feat: reading progress bar and skip-to-content link"
```

---

## Task 2: Hamburger menu (mobile nav)

**Files:**
- Modify: `index.html`
- Modify: `css/components.css`
- Modify: `js/modules/ui-effects.js`
- Modify: `js/app.js`

**Context:** On mobile (<768px), `.nav-links` is `display: none` with no replacement. The fix: add a hamburger `<button>` next to `.nav-right`, wire a JS toggle that opens/closes a `.nav-drawer` overlay, trap focus inside using the existing `createOverlayManager` from `modal.js` which is already imported in `app.js`.

- [ ] **Step 1: Add hamburger button and nav drawer to `index.html`**

In `index.html`, find the `<header>` block. The current structure is:
```html
<header>
    <div class="container">
        <nav>
            <a href="#" class="logo">...</a>
            <div class="nav-right">
                <ul class="nav-links">...</ul>
                <div class="nav-actions">...</div>
            </div>
        </nav>
    </div>
</header>
```

Replace it with (keeping all inner content identical, just adding the hamburger button inside `.nav-right` before `<ul class="nav-links">`):

```html
<button type="button" class="hamburger-btn" id="hamburgerBtn" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="navDrawer">
    <span class="hamburger-bar"></span>
    <span class="hamburger-bar"></span>
    <span class="hamburger-bar"></span>
</button>
```

Add this button as the FIRST child of `.nav-right` (before `<ul class="nav-links">`).

Also add the drawer HTML immediately after `</header>` (before `<main>`):

```html
<div class="nav-drawer" id="navDrawer" aria-hidden="true">
    <div class="nav-drawer-overlay" id="navDrawerOverlay"></div>
    <div class="nav-drawer-panel">
        <button type="button" class="nav-drawer-close" id="navDrawerClose" aria-label="Fermer le menu">×</button>
        <ul class="nav-drawer-links">
            <li><a href="#about"><i class="bi bi-person-fill"></i> <span data-i18n="nav.about">À propos</span></a></li>
            <li><a href="#experience"><i class="bi bi-briefcase-fill"></i> <span data-i18n="nav.experience">Expérience</span></a></li>
            <li><a href="#projects"><i class="bi bi-code-slash"></i> <span data-i18n="nav.projects">Projets</span></a></li>
            <li><a href="#contact"><i class="bi bi-envelope-at-fill"></i> <span data-i18n="nav.contact">Contact</span></a></li>
        </ul>
        <div class="nav-drawer-lang">
            <div class="lang-switch" role="group" aria-label="Language switcher">
                <button type="button" class="lang-btn active" data-lang="fr">FR</button>
                <button type="button" class="lang-btn" data-lang="en">EN</button>
            </div>
        </div>
    </div>
</div>
```

- [ ] **Step 2: Add hamburger + drawer CSS to `css/components.css`**

Find the `/* Mobile Rebuild Layer */` block (around line 3150) and add BEFORE it (so the rules apply at all sizes and the mobile block overrides desktop):

```css
/* ── HAMBURGER BUTTON ── */
.hamburger-btn {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 36px;
    height: 36px;
    padding: 6px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    z-index: 1001;
}

.hamburger-bar {
    display: block;
    width: 18px;
    height: 2px;
    background: var(--text-main);
    border-radius: 2px;
    transition: transform 0.25s var(--ease-smooth), opacity 0.2s;
}

body.nav-open .hamburger-btn .hamburger-bar:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
}
body.nav-open .hamburger-btn .hamburger-bar:nth-child(2) {
    opacity: 0;
}
body.nav-open .hamburger-btn .hamburger-bar:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
}

/* ── NAV DRAWER ── */
.nav-drawer {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 999;
}

.nav-drawer[aria-hidden="false"] {
    display: block;
}

.nav-drawer-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    animation: fadeIn 0.25s ease;
}

.nav-drawer-panel {
    position: absolute;
    top: 0;
    right: 0;
    width: min(280px, 85vw);
    height: 100%;
    background: var(--surface);
    border-left: 1px solid var(--border);
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    animation: slideInRight 0.25s var(--ease-smooth);
}

@keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}

.nav-drawer-close {
    align-self: flex-end;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-muted);
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
}

.nav-drawer-links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.nav-drawer-links a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    font-size: 0.9rem;
    letter-spacing: 0.5px;
    transition: color 0.2s, background 0.2s;
}

.nav-drawer-links a:hover,
.nav-drawer-links a.active {
    color: var(--text-main);
    background: rgba(124, 58, 237, 0.12);
}

.nav-drawer-lang {
    margin-top: auto;
}

@media (prefers-reduced-motion: reduce) {
    .nav-drawer-overlay,
    .nav-drawer-panel {
        animation: none;
    }
    .hamburger-bar {
        transition: none;
    }
}
```

Inside the `@media (max-width: 768px)` block in `/* Mobile Rebuild Layer */`, add:

```css
    .hamburger-btn {
        display: flex;
    }
```

- [ ] **Step 3: Add `initHamburgerMenu()` to `js/modules/ui-effects.js`**

Add this function at the end of `ui-effects.js` (after `initReadingProgress`):

```js
/**
 * Initializes the hamburger menu for mobile navigation.
 * Opens/closes a nav drawer with focus trap and keyboard support.
 */
export function initHamburgerMenu() {
    const btn = document.getElementById('hamburgerBtn');
    const drawer = document.getElementById('navDrawer');
    const overlay = document.getElementById('navDrawerOverlay');
    const closeBtn = document.getElementById('navDrawerClose');

    if (!btn || !drawer) return;

    const drawerLinks = drawer.querySelectorAll('a, button');

    const openDrawer = () => {
        drawer.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
        document.body.classList.add('nav-open');
        document.body.style.overflow = 'hidden';
        closeBtn?.focus();
    };

    const closeDrawer = () => {
        drawer.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
        document.body.style.overflow = '';
        btn.focus();
    };

    btn.addEventListener('click', () => {
        if (drawer.getAttribute('aria-hidden') === 'false') {
            closeDrawer();
        } else {
            openDrawer();
        }
    });

    overlay?.addEventListener('click', closeDrawer);
    closeBtn?.addEventListener('click', closeDrawer);

    drawer.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeDrawer();
    });

    // Close drawer when a nav link is clicked
    drawerLinks.forEach((link) => {
        if (link.tagName === 'A') {
            link.addEventListener('click', closeDrawer);
        }
    });

    // Sync drawer lang buttons with main lang buttons
    const drawerLangBtns = drawer.querySelectorAll('.lang-btn');
    const mainLangBtns = document.querySelectorAll('header .lang-btn');

    drawerLangBtns.forEach((drawerBtn) => {
        drawerBtn.addEventListener('click', () => {
            // Trigger the corresponding main lang button
            const lang = drawerBtn.dataset.lang;
            mainLangBtns.forEach((mainBtn) => {
                if (mainBtn.dataset.lang === lang) mainBtn.click();
            });
            // Update active state in drawer
            drawerLangBtns.forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
        });
    });
}
```

- [ ] **Step 4: Call `initHamburgerMenu()` in `js/app.js`**

In `js/app.js`, add the import at the top with the other `ui-effects` imports:

```js
import {
    initLoader,
    initCustomCursor,
    initScrollRevealAndNavSpy,
    initMotionEnhancements,
    initTiltEffect,
    initHeaderScroll,
    initReadingProgress,
    initHamburgerMenu
} from './modules/ui-effects.js';
```

Then call it after `initReadingProgress()`:

```js
    initReadingProgress();
    initHamburgerMenu();
```

- [ ] **Step 5: Manual test**

Resize browser to <768px. A `☰` button should appear in the nav. Click it — drawer slides in from the right with nav links. Click overlay or `×` — drawer closes. Press Escape — drawer closes. Tab through drawer links. Click a nav link — drawer closes and page scrolls to section.

- [ ] **Step 6: Commit**

```bash
git add index.html css/components.css js/modules/ui-effects.js js/app.js
git commit -m "feat: hamburger menu for mobile navigation"
```

---

## Task 3: Hero section mobile fixes

**Files:**
- Modify: `css/components.css`

**Context:** Three issues: (1) `.hero-actions` (the CTA container) has no mobile stack styles — `.cta-group` does but that class isn't used in the HTML. (2) On <380px, the h1 clamp minimum cuts words. (3) The `.marquee` has no edge fade. Also adding the staggered entrance animation.

- [ ] **Step 1: Fix `.hero-actions` mobile stacking**

In `css/components.css`, find the `@media (max-width: 768px)` block inside `/* Mobile Rebuild Layer */`. Add:

```css
    .hero-actions {
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        max-width: 320px;
        margin: 0 auto;
    }

    .hero-actions .btn {
        width: 100%;
        justify-content: center;
    }
```

- [ ] **Step 2: Fix hero-tag + live-visitors mobile layout**

In `css/components.css`, find where `.hero-tag` and `.live-visitors` are defined and ensure they have a flex parent on desktop. Locate `.hero-content` or add a wrapper rule. Add in the mobile block:

```css
    .hero-content > .hero-tag,
    .hero-content > .live-visitors {
        align-self: center;
    }
```

Also ensure the hero-content items are centered on mobile. In the mobile block, add:

```css
    .hero-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
```

- [ ] **Step 3: Fix headline clamp on very small screens**

Find `h1` override in the 768px mobile block (around line 2806 — `h1 { font-size: clamp(1.9rem, 10vw, 3.3rem); }`). Change the minimum:

```css
    h1 {
        font-size: clamp(1.6rem, 10vw, 3.3rem);
        margin-bottom: 1.5rem;
    }
```

- [ ] **Step 4: Add marquee edge fade**

Find `.marquee` in `css/components.css`. Add the mask property to it:

```css
.marquee {
    /* existing properties... */
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
    mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
}
```

- [ ] **Step 5: Add staggered hero entrance animation**

Find where `.hero .reveal` or `.hero-content` items are defined. Add the delay variables to hero children. Add to `css/components.css` (in the hero section, not inside a media query):

```css
/* Hero staggered entrance */
.hero .hero-tag       { animation-delay: 0ms; }
.hero .live-visitors  { animation-delay: 100ms; }
.hero h1              { animation-delay: 200ms; }
.hero .hero-sub       { animation-delay: 300ms; }
.hero .hero-actions   { animation-delay: 400ms; }

@media (prefers-reduced-motion: reduce) {
    .hero .hero-tag,
    .hero .live-visitors,
    .hero h1,
    .hero .hero-sub,
    .hero .hero-actions {
        animation-delay: 0ms;
    }
}
```

- [ ] **Step 6: Manual test**

On mobile (<768px): CTAs should stack vertically, full width. At 360px: headline should not overflow. On all sizes: marquee fades at edges. On first load: hero elements should cascade in (tag → visitors → title → desc → CTAs).

- [ ] **Step 7: Commit**

```bash
git add css/components.css
git commit -m "style: hero mobile fixes — CTA stack, headline clamp, marquee fade, stagger"
```

---

## Task 4: About section mobile fix + touch cleanup

**Files:**
- Modify: `css/components.css`

**Context:** `.bio-grid` has 3 children (bio text + 2 glass panels). On mobile they need to stack as a single column. The `data-tilt` effect leaves sticky hover states on touch devices.

- [ ] **Step 1: Fix bio-grid mobile layout**

Find `.bio-grid` in `css/components.css`. In the `@media (max-width: 768px)` Mobile Rebuild Layer block, add:

```css
    .bio-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }

    .bio-grid > * {
        width: 100%;
    }
```

- [ ] **Step 2: Clean up tilt hover artefacts on touch devices**

Add after the `.bio-grid` mobile rule (still in mobile block, or in a separate hover media query):

```css
@media (hover: none) {
    .glass-panel[data-tilt],
    .card-3d[data-tilt] {
        transform: none !important;
        transition: none !important;
    }
}
```

- [ ] **Step 3: Manual test**

On mobile: About section should show as a single column (text → expertise → GitHub metrics). On a touch device (or Chrome DevTools touch simulation): hovering glass panels should not leave a sticky transform.

- [ ] **Step 4: Commit**

```bash
git add css/components.css
git commit -m "style: about section — single column on mobile, fix touch hover artefacts"
```

---

## Task 5: Experience timeline — visual line, color coding, mobile expand/collapse

**Files:**
- Modify: `index.html`
- Modify: `css/components.css`
- Modify: `js/modules/ui-effects.js`
- Modify: `js/app.js`

**Context:** The current `.timeline` is a flat list. We add: (1) a vertical connecting line via `.timeline::before`, (2) dots per item via `.tl-item::before`, (3) color coding via `data-type` attribute, (4) expand/collapse on mobile via JS toggle.

- [ ] **Step 1: Add `data-type` attributes to `.tl-item` elements in `index.html`**

Find the `<section id="experience">` in `index.html`. Update each `.tl-item` div:

```html
<!-- Personal projects -->
<div class="tl-item reveal" data-type="personal">

<!-- Lycée (school) -->
<div class="tl-item reveal" data-type="school">

<!-- Stage Seconde (internship) -->
<div class="tl-item reveal" data-type="internship">

<!-- Stage 3ème (internship) -->
<div class="tl-item reveal" data-type="internship">

<!-- Collège (school) -->
<div class="tl-item reveal" data-type="school">
```

- [ ] **Step 2: Add visual timeline line and dots to `css/components.css`**

Find the existing `.timeline` and `.tl-item` CSS. Add/update:

```css
.timeline {
    position: relative;
    padding-left: 1.5rem;
}

.timeline::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.5rem;
    bottom: 0.5rem;
    width: 2px;
    background: linear-gradient(to bottom, var(--violet), transparent);
    border-radius: 2px;
}

.tl-item {
    position: relative;
    padding-left: 1.5rem;
}

.tl-item::before {
    content: '';
    position: absolute;
    left: -5px;
    top: 0.5rem;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--violet);
    box-shadow: 0 0 6px var(--glow);
}

/* Color coding by type */
.tl-item[data-type="personal"] { border-left: 2px solid var(--violet); }
.tl-item[data-type="school"]   { border-left: 2px solid var(--accent); }
.tl-item[data-type="internship"] { border-left: 2px solid var(--violet-light); }

.tl-item[data-type="personal"]::before   { background: var(--violet); }
.tl-item[data-type="school"]::before     { background: var(--accent); }
.tl-item[data-type="internship"]::before { background: var(--violet-light); }
```

- [ ] **Step 3: Add expand/collapse CSS for mobile**

In the `@media (max-width: 768px)` block, add:

```css
    .tl-desc {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s var(--ease-smooth);
    }

    .tl-item.expanded .tl-desc {
        max-height: 300px;
    }

    .tl-toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        margin-top: 0.25rem;
        font-size: 0.75rem;
        color: var(--violet-light);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        font-family: var(--font-mono);
    }

    @media (prefers-reduced-motion: reduce) {
        .tl-desc {
            transition: none;
        }
    }
```

On desktop (outside the 768px block), ensure `.tl-desc` is always visible:

```css
/* Desktop: always show desc */
@media (min-width: 769px) {
    .tl-desc {
        max-height: none !important;
    }
    .tl-toggle {
        display: none;
    }
}
```

- [ ] **Step 4: Add toggle buttons to HTML in `index.html`**

For each `.tl-item` in the experience section, add a toggle button after `.tl-role`:

```html
<div class="tl-role" data-i18n="experience.1.title">...</div>
<button type="button" class="tl-toggle" aria-expanded="false">
    <i class="bi bi-chevron-down"></i>
    <span>Voir</span>
</button>
<div class="tl-desc" data-i18n="experience.1.desc">...</div>
```

Repeat for all 5 `.tl-item` elements.

- [ ] **Step 5: Add `initTimelineCollapse()` to `js/modules/ui-effects.js`**

```js
/**
 * On mobile (<768px), collapses timeline descriptions and adds expand/collapse toggle.
 */
export function initTimelineCollapse() {
    if (window.matchMedia('(min-width: 769px)').matches) return;

    const items = document.querySelectorAll('.tl-item');
    items.forEach((item) => {
        const toggle = item.querySelector('.tl-toggle');
        const desc = item.querySelector('.tl-desc');
        if (!toggle || !desc) return;

        toggle.addEventListener('click', () => {
            const expanded = item.classList.toggle('expanded');
            toggle.setAttribute('aria-expanded', String(expanded));
            const icon = toggle.querySelector('i');
            const label = toggle.querySelector('span');
            if (icon) icon.className = expanded ? 'bi bi-chevron-up' : 'bi bi-chevron-down';
            if (label) label.textContent = expanded ? 'Réduire' : 'Voir';
        });
    });
}
```

- [ ] **Step 6: Export and call in `js/app.js`**

Update the import from `ui-effects.js`:

```js
import {
    initLoader,
    initCustomCursor,
    initScrollRevealAndNavSpy,
    initMotionEnhancements,
    initTiltEffect,
    initHeaderScroll,
    initReadingProgress,
    initHamburgerMenu,
    initTimelineCollapse
} from './modules/ui-effects.js';
```

Call it after `initHamburgerMenu()`:

```js
    initHamburgerMenu();
    initTimelineCollapse();
```

- [ ] **Step 7: Manual test**

Desktop: timeline shows vertical line on left, colored dots and left borders per type, all descriptions visible. Mobile: descriptions are collapsed, toggle button shows `▼ Voir`, click expands with `▲ Réduire`.

- [ ] **Step 8: Commit**

```bash
git add index.html css/components.css js/modules/ui-effects.js js/app.js
git commit -m "feat: experience timeline — visual line, color coding, mobile expand/collapse"
```

---

## Task 6: Projects section mobile fixes

**Files:**
- Modify: `css/components.css`
- Modify: `js/modules/modal.js`

**Context:** Four issues: (1) project grid needs single column on mobile, (2) filter buttons overflow — need horizontal scroll, (3) card hover `translateY(-6px)` is too aggressive, (4) project modal needs thumb-friendly close button and swipe-down gesture on mobile.

- [ ] **Step 1: Fix projects grid and pills on mobile**

In the `@media (max-width: 600px)` block (or add one), add:

```css
@media (max-width: 600px) {
    .carousel-grid,
    .projects-grid {
        grid-template-columns: 1fr;
    }

    .tech-pill {
        white-space: nowrap;
    }

    .featured-metrics {
        grid-template-columns: repeat(2, 1fr);
    }
}
```

- [ ] **Step 2: Fix filter buttons horizontal scroll**

Find the filter buttons container class (likely `.client-filters` or `.project-filters`). Add:

```css
.client-filters,
.project-filters {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.5rem;
}

@media (max-width: 768px) {
    .client-filters,
    .project-filters {
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 0.5rem;
        -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
        mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
    }

    .client-filter-btn,
    .project-filter-btn {
        scroll-snap-align: start;
        flex-shrink: 0;
    }
}
```

- [ ] **Step 3: Soften card hover**

Find `.carousel-item:hover` in `css/components.css`. Change `translateY(-6px)` to `translateY(-3px)`:

```css
.carousel-item:hover {
    /* existing properties */
    transform: translateY(-3px);
}
```

- [ ] **Step 4: Fix project modal for mobile**

Find `.modal-overlay` and `.modal-content` styles. In the `@media (max-width: 768px)` block, add:

```css
    .modal-overlay.open .modal-content,
    #project-modal.open .modal-content,
    #skill-modal.open .modal-content {
        height: 100dvh;
        max-height: 100dvh;
        border-radius: 16px 16px 0 0;
        margin: 0;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        overflow-y: auto;
    }

    .close-modal {
        position: sticky;
        top: 0.75rem;
        z-index: 10;
    }
```

- [ ] **Step 5: Add swipe-down-to-close in `js/modules/modal.js`**

In `modal.js`, update the `openOverlay` function to attach swipe detection on mobile. Add the swipe handler inside `openOverlay`:

```js
    const openOverlay = (overlay, triggerElement, onEscape) => {
        if (!overlay) return;
        if (activeOverlay && activeOverlay !== overlay) {
            releaseFocusTrap(activeOverlay);
            activeOverlay.setAttribute('aria-hidden', 'true');
        }
        lastFocusedElement = triggerElement || document.activeElement;
        activeOverlay = overlay;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        trapFocus(overlay, onEscape);

        // Swipe-down to close on mobile touch devices
        if (window.matchMedia('(max-width: 768px)').matches) {
            let touchStartY = 0;
            const onTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
            const onTouchEnd = (e) => {
                const delta = e.changedTouches[0].clientY - touchStartY;
                if (delta > 80) {
                    overlay.removeEventListener('touchstart', onTouchStart);
                    overlay.removeEventListener('touchend', onTouchEnd);
                    onEscape?.();
                }
            };
            overlay.addEventListener('touchstart', onTouchStart, { passive: true });
            overlay.addEventListener('touchend', onTouchEnd, { passive: true });
        }
    };
```

- [ ] **Step 6: Manual test**

On mobile: project filter buttons scroll horizontally with fade on edges. Project grid is single column. Card hover is less jumpy. Open a project modal — it slides up from the bottom, takes full height, and swipe-down closes it.

- [ ] **Step 7: Commit**

```bash
git add css/components.css js/modules/modal.js
git commit -m "style: projects mobile — grid, filter scroll, card hover, modal swipe-to-close"
```

---

## Task 7: Contact, footer, Discord card mobile

**Files:**
- Modify: `css/components.css`
- Modify: `js/modules/ui-effects.js`
- Modify: `js/app.js`
- Modify: `index.html`

**Context:** iOS auto-zoom fix (font-size < 16px triggers it), inline field validation, back-to-top button, Discord card collapsing to a dot on mobile.

- [ ] **Step 1: iOS font-size zoom fix**

In the `@media (max-width: 768px)` block, add:

```css
    input,
    textarea,
    select {
        font-size: 16px !important;
    }
```

- [ ] **Step 2: Increase contact-link tap targets on mobile**

In the `@media (max-width: 768px)` block, add:

```css
    .contact-link {
        padding: 1rem 1.25rem;
    }
```

- [ ] **Step 3: Discord card → dot on mobile**

In the `@media (max-width: 768px)` block, update the Discord card to collapse to a dot:

```css
    .discord-card {
        bottom: 1.5rem;
        left: auto;
        right: 1.5rem;
        width: 12px;
        height: 12px;
        padding: 0;
        border-radius: 50%;
        overflow: hidden;
        cursor: pointer;
        background: var(--violet);
        border-color: transparent;
        box-shadow: 0 0 8px var(--glow);
        transition: all 0.3s var(--ease-smooth);
    }

    .discord-card.expanded-mobile {
        width: min(320px, calc(100vw - 2rem));
        height: auto;
        padding: var(--space-3);
        border-radius: var(--radius-lg);
        border-color: rgba(189, 0, 255, 0.2);
        background: rgba(10, 5, 20, 0.92);
    }

    .discord-card > *:not(.card-toggle) {
        opacity: 0;
        pointer-events: none;
    }

    .discord-card.expanded-mobile > * {
        opacity: 1;
        pointer-events: auto;
    }
```

Add a click handler to the Discord card in `initHamburgerMenu` (or a separate init). Since the Discord card already has a `.card-toggle` button, we tap into that. In `js/modules/ui-effects.js`, add to `initHamburgerMenu` or as a separate small function:

```js
/**
 * On mobile, collapses Discord card to a dot; tap to expand.
 */
export function initDiscordCardMobile() {
    if (!window.matchMedia('(max-width: 768px)').matches) return;

    const card = document.getElementById('lanyard-card');
    if (!card) return;

    card.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.toggle('expanded-mobile');
    });
}
```

- [ ] **Step 4: Add back-to-top button**

In `index.html`, add before the closing `</body>` tag:

```html
<a href="#" class="back-to-top" aria-label="Retour en haut">↑</a>
```

Add CSS in `css/components.css`:

```css
/* ── BACK TO TOP ── */
.back-to-top {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 50%;
    color: var(--violet-light);
    font-size: 1rem;
    backdrop-filter: var(--glass-blur);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s, transform 0.3s;
    z-index: 998;
}

.back-to-top.visible {
    opacity: 1;
    pointer-events: auto;
}

.back-to-top:hover {
    transform: translateY(-2px);
    border-color: var(--violet);
    box-shadow: var(--glow-hover);
}

@media (max-width: 768px) {
    .back-to-top {
        bottom: 4rem;
        right: 1.5rem;
    }
}

@media (prefers-reduced-motion: reduce) {
    .back-to-top {
        transition: opacity 0.3s;
    }
}
```

- [ ] **Step 5: Add `initBackToTop()` to `js/modules/ui-effects.js`**

```js
/**
 * Shows a back-to-top button after 30% scroll depth.
 */
export function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    const threshold = document.documentElement.scrollHeight * 0.3;

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > threshold);
    }, { passive: true });

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
```

- [ ] **Step 6: Update `js/app.js` imports and calls**

Update the import:

```js
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
```

Add calls:

```js
    initHamburgerMenu();
    initTimelineCollapse();
    initDiscordCardMobile();
    initBackToTop();
```

- [ ] **Step 7: Manual test**

On iOS Safari (or emulation): tap any form input — no auto-zoom. Social contact links: tap targets feel spacious. Discord card on mobile: shows as small violet dot, tap → expands. Scroll to 30% page depth — back-to-top button appears in bottom-right; click scrolls to top smoothly.

- [ ] **Step 8: Commit**

```bash
git add index.html css/components.css js/modules/ui-effects.js js/app.js
git commit -m "feat: contact/footer — iOS zoom fix, back-to-top, Discord dot on mobile"
```

---

## Task 8: Focus-visible audit + inline form validation

**Files:**
- Modify: `css/components.css`
- Modify: `js/modules/contact-form.js`

**Context:** Several interactive elements lack visible focus outlines for keyboard users. The contact form has no inline per-field validation.

- [ ] **Step 1: Add global focus-visible styles**

Find the section in `css/components.css` that styles `.perf-btn`, `.lang-btn`, `.skill-item`. Add:

```css
/* ── FOCUS VISIBLE ── */
.perf-btn:focus-visible,
.lang-btn:focus-visible,
.skill-item:focus-visible,
.close-modal:focus-visible,
.card-toggle:focus-visible,
.hamburger-btn:focus-visible,
.nav-drawer-close:focus-visible,
.tl-toggle:focus-visible,
.back-to-top:focus-visible {
    outline: 2px solid var(--violet);
    outline-offset: 3px;
}
```

Remove any `outline: none` that appears without a replacement (search for `outline: none` and only keep those already paired with a `focus-visible` rule).

- [ ] **Step 2: Add `.field-error` CSS**

In `css/components.css`, find the contact form styles. Add:

```css
.form-group {
    position: relative;
}

.form-group.field-error input,
.form-group.field-error textarea {
    border-color: #f87171;
}

.form-group.field-error::after {
    content: attr(data-error-msg);
    display: block;
    font-size: 0.75rem;
    color: #f87171;
    margin-top: 0.25rem;
    font-family: var(--font-mono);
}
```

- [ ] **Step 3: Add `data-error-msg` attributes to form groups in `index.html`**

Find each `.form-group` in the contact form. Add `data-error-msg` attributes:

```html
<div class="form-group" data-error-msg="Ce champ est requis">
    <input type="text" id="contact-name" ...>
</div>

<div class="form-group" data-error-msg="Adresse email invalide">
    <input type="email" id="contact-email" ...>
</div>

<div class="form-group" data-error-msg="Le message est trop court">
    <textarea id="contact-message" ...></textarea>
</div>
```

- [ ] **Step 4: Add blur validation to `js/modules/contact-form.js`**

In the `initContactForm` function, after the form elements are retrieved, add blur validation:

```js
    // Inline field validation on blur
    const validateField = (input) => {
        const group = input.closest('.form-group');
        if (!group) return;

        let isValid = true;
        if (input.type === 'email') {
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        } else if (input.tagName === 'TEXTAREA') {
            isValid = input.value.trim().length >= 10;
        } else {
            isValid = input.value.trim().length > 0;
        }

        group.classList.toggle('field-error', !isValid && input.value.trim() !== '');
    };

    form.querySelectorAll('input, textarea').forEach((field) => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.closest('.form-group')?.classList.contains('field-error')) {
                validateField(field);
            }
        });
    });
```

- [ ] **Step 5: Manual test**

Tab through the page — every interactive element should show a clear violet outline when focused. In the contact form, tab past the name field while empty → no error (no error on empty unfocused). Type a character then clear and blur → error appears. Type valid value → error disappears.

- [ ] **Step 6: Commit**

```bash
git add css/components.css index.html js/modules/contact-form.js
git commit -m "feat: focus-visible audit and inline form field validation"
```

---

## Task 9: CSS critical split for above-fold performance

**Files:**
- Create: `css/components-critical.css`
- Modify: `index.html`

**Context:** `components.css` is 4483 lines and blocks rendering. Extract the styles needed for the first visible area (nav + hero + marquee) into a preloaded `components-critical.css`.

- [ ] **Step 1: Identify above-fold styles**

The above-fold components are: Discord card, header/nav, hero section, marquee. These correspond to roughly the first ~250 lines of `components.css` plus the hamburger/drawer styles added in Task 2. Extract them.

- [ ] **Step 2: Create `css/components-critical.css`**

Create the file with the content extracted from `components.css` for: `.discord-card`, `header`, `nav`, `.nav-links`, `.nav-right`, `.nav-actions`, `.logo`, `.lang-switch`, `.lang-btn`, `.perf-btn`, `.hero`, `.hero-content`, `.hero-tag`, `.hero-sub`, `.hero-actions`, `.live-visitors`, `.marquee`, `.marquee-content`, `.skill-item`, `.hamburger-btn`, `.nav-drawer`.

Also include the mobile overrides for these elements from the 768px block.

The extracted rules should NOT be removed from `components.css` — they stay in both files. The browser deduplicates via cascade; the critical file just ensures faster first paint.

- [ ] **Step 3: Update `index.html` to preload critical CSS**

Find the existing CSS links in `<head>`. Add before the `components.css` link:

```html
<link rel="preload" href="css/components-critical.css" as="style" onload="this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="css/components-critical.css"></noscript>
```

Keep the existing full `components.css` link unchanged.

- [ ] **Step 4: Manual test**

Open DevTools → Network tab. Throttle to Slow 3G. Reload. The above-fold content (nav + hero) should paint before the full `components.css` finishes loading. No layout shift or FOUC should occur.

- [ ] **Step 5: Commit**

```bash
git add css/components-critical.css index.html
git commit -m "perf: extract critical above-fold CSS for faster first paint"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| Hamburger menu | T2 |
| Active nav link | Already implemented in `initScrollRevealAndNavSpy` — no new work needed |
| Reading progress bar | T1 |
| Inter-section separators | ⚠️ Not covered — adding below |
| Hero CTA mobile fix | T3 |
| Hero headline clamp | T3 |
| Marquee edge fade | T3 |
| Hero stagger animation | T3 |
| bio-grid mobile | T4 |
| Touch hover cleanup | T4 |
| Timeline visual line | T5 |
| Timeline color coding | T5 |
| Timeline expand/collapse | T5 |
| Projects grid mobile | T6 |
| Filter buttons scroll | T6 |
| Card hover soften | T6 |
| Modal mobile + swipe | T6 |
| Search input focus style | ⚠️ Not covered — adding below |
| iOS zoom fix | T7 |
| Contact-link tap targets | T7 |
| Back-to-top | T7 |
| Discord dot on mobile | T7 |
| Focus-visible | T8 |
| Inline form validation | T8 |
| Skip to content | T1 |
| CSS critical split | T9 |
| Booking section overflow audit | ⚠️ Not covered — adding below |
| Scroll reveal rootMargin | ⚠️ Minor — adding to T8 |
| Reduced motion audit for new components | Covered in each task |

**Missing items — adding:**

**Inter-section separators** → add to Task 3 (hero/marquee area) as a CSS-only step.
**Search input focus** → add to Task 6.
**Booking overflow audit** → add to Task 7.
**Scroll reveal rootMargin** → add to Task 4 (touches `ui-effects.js`).

---

## Task 3 — Addendum: Inter-section separator

In **Task 3 Step 4**, also add:

```css
/* Inter-section fade */
.section::after {
    content: '';
    display: block;
    height: 60px;
    background: linear-gradient(to bottom, transparent, var(--bg));
    pointer-events: none;
}
```

---

## Task 4 — Addendum: Scroll reveal rootMargin

In **Task 4** after the bio-grid step, also update `initScrollRevealAndNavSpy` in `ui-effects.js`:

Change the `revealObserver` rootMargin from default to:

```js
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });
```

---

## Task 6 — Addendum: Search input focus style

In **Task 6**, also add to `css/components.css`:

```css
.project-search-input:focus,
.search-input:focus {
    outline: none;
    border-color: var(--violet);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
}
```

---

## Task 7 — Addendum: Booking section overflow audit

In **Task 7**, also add to the 768px mobile block:

```css
    .booking-section,
    .booking-section * {
        max-width: 100%;
        overflow-x: hidden;
    }
```
