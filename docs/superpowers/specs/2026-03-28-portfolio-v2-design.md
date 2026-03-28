# Portfolio v2 — Design Spec
**Date:** 2026-03-28
**Approach:** Option B — Mobile-first balanced renovation
**Scope:** Visual + functional + mobile fixes across all sections, no new sections

---

## Goals

1. Fix mobile navigation (currently broken — no hamburger menu)
2. Visual polish and impact improvements across all sections
3. Functional enhancements (active nav, timeline expand, modal UX)
4. Balanced progress on all axes: visual, content, functional, mobile

---

## Section 1 — Navigation & Global Structure

### Hamburger menu (CRITICAL — mobile nav is currently inaccessible)
- Button `☰` visible on mobile (<768px), replaces hidden `.nav-links`
- Opens a right-side drawer with all nav links, lang-switch, perf/accessibility buttons
- Closes on overlay click or Escape key
- JS: small addition to `ui-effects.js` — toggle class on `<body>`, focus trap via `modal.js`
- ARIA: `aria-expanded`, `aria-controls`, `aria-label` on the toggle button
- `prefers-reduced-motion`: drawer appears instantly (no slide animation)

### Active nav link
- `IntersectionObserver` on each `<section>` marks corresponding nav link as `.active`
- CSS already has `.nav-links a.active` styles — just needs JS wiring in `ui-effects.js`

### Reading progress bar
- `#reading-progress` already exists in HTML, just needs CSS + JS
- CSS: `position: fixed; top: 0; left: 0; height: 3px; background: var(--violet); z-index: 1001`
- JS: `scroll` event → `scrollY / (document.body.scrollHeight - innerHeight) * 100`

### Inter-section separators
- Each `<section>` gets a subtle `::after` gradient fade: `linear-gradient(to bottom, transparent, var(--bg))` at 60px height
- Pure CSS, no JS

---

## Section 2 — Hero

### CTA buttons mobile fix
- `.hero-actions` (not `.cta-group`) needs the mobile stack styles
- On <768px: `flex-direction: column`, `width: 100%`, `max-width: 320px`, `margin: 0 auto`
- Each btn: `width: 100%`, `justify-content: center`

### hero-tag + live-visitors layout
- Desktop: inline on same line with `·` separator, `flex-wrap: nowrap`
- Mobile (<480px): stacked column, `gap: 0.5rem`

### Headline clamp fix
- Current minimum `1.9rem` cuts words on <380px screens
- New: `clamp(1.6rem, 10vw, 3.3rem)` for the mobile h1 override

### Marquee edge fade
- Add `mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)` to `.marquee`
- Pure CSS, no JS

### Staggered entrance animation
- Hero child elements get `--delay` CSS custom property: `0ms`, `100ms`, `200ms`, `300ms`, `400ms`
- Applied via `.hero-tag { --delay: 0ms }`, `.live-visitors { --delay: 100ms }`, `h1 { --delay: 200ms }`, `.hero-sub { --delay: 300ms }`, `.hero-actions { --delay: 400ms }`
- `animation: fadeInUp 0.6s var(--ease-smooth) var(--delay) both`
- Respects `prefers-reduced-motion`

---

## Section 3 — About

### bio-grid mobile
- On <768px: single column, `grid-template-columns: 1fr`
- Order: bio text (1) → expertise panel (2) → github metrics (3)
- Each glass panel: `width: 100%`

### Touch hover cleanup
- `@media (hover: none)` removes tilt/hover transform artefacts on `.glass-panel[data-tilt]`
- Prevents sticky hover states on iOS

---

## Section 4 — Experience (Timeline)

### Visual timeline line
- `.timeline::before`: `content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, var(--violet), transparent)`
- Each `.tl-item`: `position: relative; padding-left: 1.5rem`
- `.tl-item::before`: dot — `8px circle`, `background: var(--violet)`, `position: absolute; left: -3px; top: 0.4rem`

### Color coding by type
- Personal projects: `border-left: 2px solid var(--violet)`
- School entries: `border-left: 2px solid var(--accent)`
- Internships: `border-left: 2px solid var(--violet-light)`
- Implemented via data attributes: `data-type="personal|school|internship"` on `.tl-item`

### Expand/collapse on mobile
- On <768px: `.tl-desc` is hidden by default (`max-height: 0; overflow: hidden`)
- `.tl-item` gets a `▼` toggle button
- Click toggles `.expanded` class → `max-height: 200px` transition
- `prefers-reduced-motion`: no transition, instant show/hide

---

## Section 5 — Projects

### Grid mobile
- `.carousel-grid` (or equivalent): `grid-template-columns: 1fr` on <600px
- Tech pills: `flex-wrap: wrap`, `overflow: hidden` removed
- Featured metrics panel: 2-col grid on <768px (was 3-col)

### Filter buttons scroll
- On <768px: filter container gets `overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch`
- Each filter btn: `scroll-snap-align: start; flex-shrink: 0`
- Edge fade: `mask-image` same technique as marquee
- No word wrap on individual buttons

### Card hover refinement
- `translateY(-6px)` → `translateY(-3px)` + stronger `box-shadow` at hover state
- Prevents first-row cards from partially leaving the viewport

### Project modal mobile
- Close button repositioned: `position: sticky; bottom: 1rem` on <768px for thumb reachability
- Swipe-down to close: `touchstart`/`touchmove`/`touchend` handler in `modal.js`, threshold 80px
- Modal takes full height on mobile: `height: 100dvh; border-radius: 16px 16px 0 0`

### Search input focus
- Align with contact form inputs: `border: 1px solid var(--violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.2)` on focus

---

## Section 6 — Contact & Footer

### iOS zoom fix
- All `input`, `textarea`, `select` in mobile media query: `font-size: 16px !important`
- Prevents iOS Safari auto-zoom on focus

### Inline field validation
- `blur` event per field: if invalid, add `.field-error` class to parent `.form-group`
- `.field-error input` / `.field-error textarea`: `border-color: #f87171`
- `.field-error::after`: small error message below field (`content: attr(data-error-msg)`)
- Error messages stored as `data-error-msg` attributes on `.form-group` elements

### Contact links tap target
- On <768px: `.contact-link` padding increased to `1rem 1.25rem` (min 44px tap target)

### Back-to-top link
- `<a href="#" class="back-to-top">↑ Top</a>` in footer
- Hidden until 30% scroll depth via JS class toggle
- CSS: `position: fixed; bottom: 1.5rem; right: 1.5rem; opacity: 0; pointer-events: none` → `.visible` adds `opacity: 1`
- On mobile: `bottom: 4rem; right: 1.5rem` — stacked above Discord dot (Discord dot occupies `bottom: 1.5rem`)

### Discord card mobile
- On <768px: collapse to a 12px status dot in bottom-right corner (`bottom: 1.5rem; right: 1.5rem`)
- Tap expands the full card (toggle `.expanded` class), card expands upward/leftward
- Move from bottom-left to bottom-right to avoid Android back gesture zone
- Back-to-top sits at `bottom: 4rem` above it — no overlap

### Booking section audit
- Audit current booking/calendar layout for overflow on mobile
- If any element exceeds viewport width, apply `overflow-x: hidden` + constrain `max-width: 100%`
- No redesign of booking logic — CSS overflow fixes only

---

## Section 7 — Transversal

### Scroll reveal refinement
- `rootMargin: "0px 0px -80px 0px"` on IntersectionObserver so elements animate closer to viewport center
- `once: true` flag (already likely set) — no re-trigger on scroll up

### CSS split for above-fold performance
- Extract nav + hero + marquee styles (~150 lines) to `css/components-critical.css`
- Load with `<link rel="preload" as="style">` then `onload="this.rel='stylesheet'"`
- Full `components.css` loads normally — no build step needed
- `<noscript>` fallback loads both normally

### Focus visible
- Add `outline: 2px solid var(--violet); outline-offset: 3px` to `:focus-visible` for:
  - `.perf-btn`, `.lang-btn`, `.skill-item`, `.close-modal`, `.card-toggle`
- Remove `outline: none` from any rule that strips focus without replacement

### Skip to content link
- Add `<a href="#main-content" class="skip-link">Aller au contenu</a>` as first child of `<body>`
- `id="main-content"` on `<main>`
- CSS: `position: absolute; top: -40px; left: 1rem` → `:focus { top: 1rem }` (slides in on focus)

### Reduced motion audit
- Hamburger drawer: `transition: none` when `prefers-reduced-motion: reduce`
- Timeline collapse: `transition: none`
- Back-to-top: `transition: none`

---

## Files Changed

| File | Type of change |
|------|---------------|
| `index.html` | Hamburger btn, skip-link, data-type attrs on tl-items, back-to-top, main id |
| `css/components.css` | Mobile fixes, timeline, marquee fade, hero stagger, focus-visible, Discord dot |
| `css/components-critical.css` | NEW — above-fold extracted styles |
| `css/base.css` | Skip-link style, reading progress bar |
| `js/modules/ui-effects.js` | Hamburger toggle, active nav observer, reading progress, back-to-top |
| `js/modules/modal.js` | Swipe-down to close gesture |
| `js/app.js` | Wire up new init functions |

---

## Out of Scope

- New sections (blog, uses page, testimonials)
- Design system / token changes beyond what's needed for fixes
- Dark/light mode toggle
- Build tooling / bundler
- Content changes (text, projects list)
