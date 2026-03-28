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
