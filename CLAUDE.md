# AniDoc — Agent Instructions

Single-file design system: `src/design-system.jsx` (tokens + `DS*` components + visual showcase at `/design-system`).
Use it for all new UI. Reference CSS vars, never raw hex.

## Visual language

Recorded from source (`src/index.css`, `*.module.css`, pages). Not chosen — this is what the codebase actually uses.

### Colours (CSS vars — always reference these, not hex)
- **Brand, light:** `--primary: #059669` (fills), `--primary-hover: #047857`, `--primary-ink: #047857` (small emerald text, 5.48:1 on white), `--text-accent: #047857`. Washes: `--primary-dim rgba(5,150,105,0.10)` subtle / `--primary-wash rgba(5,150,105,0.16)` hover; `--primary-line rgba(5,150,105,0.35)` emerald borders; `--focus-ring rgba(5,150,105,0.35)`.
- **Brand, dark:** `--primary: #10b981`, `--primary-hover: #34d399`, `--primary-ink: #34d399` (micro-labels), `--text-accent: #10b981`. `--primary-dim rgba(16,185,129,0.12)` / `--wash …0.18` / `--line …0.35`; `--focus-ring rgba(16,185,129,0.45)`.
- **Text on fills:** `--text-on-primary` — `#ffffff` light, `#022c22` ink dark (white-on-emerald is 2.54:1 in dark, never use it). Applies to `.btn-primary`, `.chip-filter.active`, pagination active, guide numbers, AIRING chips, completed status.
- **Danger (tokenized):** `--danger` `#dc2626` light / `#f87171` dark + `--danger-dim` per-theme wash. Errors, hearts, remove-hover.
- **Scrims (imagery labels):** `--scrim rgba(2,6,23,0.80)`, `--scrim-soft rgba(2,6,23,0.60)` — score/type badges, icon buttons over posters. White text on scrims stays.
- **Surfaces (glass), light:** `--bg-base: #f8fafc`; `--bg-surface: rgba(255,255,255,0.60)` / hover `.72` / active `.50`; `--bg-elevated: rgba(255,255,255,0.82)`; `--bg-solid: #ffffff` (opaque — dropdowns/popovers, never translucent); `--menu-border: #cbd5e1` (menu outlines); `--glass-border: rgba(255,255,255,0.9)`.
- **Surfaces, dark:** `--bg-base: #0a0c10`; `--bg-surface: rgba(24,28,35,0.72)` / hover `rgba(33,39,47,0.80)` / active `.62`; `--bg-elevated: rgba(30,35,42,0.80)`; `--bg-solid: #1a1e25`; `--menu-border: rgba(255,255,255,0.16)`; `--glass-border: rgba(255,255,255,0.1)`.
- **Text, light:** `--text-primary: #020817`, `--text-secondary: #0f172a`, `--text-tertiary: #475569`, `--text-on-primary: #ffffff`.
- **Text, dark:** `--text-primary: #f0f6fc`, `--text-secondary: #c9d1d9`, `--text-tertiary: #9ba1b0`.
- **Borders:** light `--border-subtle: #e2e8f0` / `--border-strong: #cbd5e1`; dark `#1e2029` / `#30363d`. `--badge-border: rgba(255,255,255,0.15)` both themes.
- **Watchlist status strips:** watching bg flips `#000` (light) ↔ `#fff` (dark) with inverted text; plan `rgba(71,85,105,0.85)` ↔ `rgba(30,41,59,0.85)`.
- **Ad-hoc, not tokenized (keep as-is):** ambient mesh `rgba(16,185,129,…)` + `rgba(59,130,246,0.10)`; hero gradient overlays; card-hover emerald glow; skeleton shimmer; range-thumb glow. Decorative only — never for text or boundaries.

### Type
- Headings/brand: `Outfit`. UI body: `Plus Jakarta Sans`.
- Scale (desktop → mobile): xs 11→10, sm 13→12, base 14→13, md 16→15, lg 20→18, xl 24→22, 2xl 32→28, 3xl 44→36.
- Recurring: `.page-title` 32/800/-0.02em; `.section-title` 20/700 + 40px `.section-icon` tile; `.card-label` 11/700/uppercase/0.07em.

### Spacing / radii / shadows
- Spacing rhythm: 4 · 8 · 16 · 24 · 40 · 64 (`--spacing-*`). 4pt grid — every layout value (padding, margin, gap, offsets, boxes) must be divisible by 4; hairlines ≤2px, fonts, borders, radii and motion are exempt. Shell `1920px`, page/schedule/footer `1400px` unified track; navbar content rides it via `max(gutter, (100vw − 1400px)/2)` mirroring `.app-container` gutters (40/24/16).
- Radii: sm 6, md 10, lg 16, xl 24. Only pills are 99px.
- Shadows neutral only (`--shadow-sm/md/lg/xl`). Glass recipe: surface + `inset 0 0 0 1px var(--glass-border)` + blur 48px (12px navbar/slider, 32px dropdown).
- Interactive cards: lift `-3px` + `0 0 0 2px var(--primary)` ring on hover (no colored glow, no image zoom); grid posters reveal a synopsis overlay (white-on-scrim, 5-line clamp); image wrapper ratio `140%`.

### Components → canonical class / DS export
- Buttons: `.btn-primary` → `DSButton`, `.btn-ghost` → `DSButton variant="ghost"`, `.icon-btn` → `DSIconButton`. Watchlist split/icon/badge lives in `WatchlistButton.jsx` — don't rebuild. Its menu portals to `document.body` (`.wl-portal`, viewport-pinned) so it can never hide behind cards; carousels therefore carry no dropdown room.
- Search: `.search-input` (42px, icon-left, clear-X right, emerald focus ring) → `DSSearchBar`. Navbar adds square submit button.
- Tags: `.badge` neutral → `DSBadge`; `.chip-genre` emerald → `DSGenreChip`; `.chip-filter` (+`.active`) day/tab → `DSFilterChip`; `.genre-pill` (+`.selected`) round multi-select → `DSPill`.
- Text rules: emerald text → `var(--text-accent)` (never `var(--primary)`); micro-labels ≤12px may use `--primary-ink`. Text utilities `.text-accent/.text-primary/.text-muted/.no-underline` now exist — the pages already use them.
- Cards/layout: `.card` → `DSCard`; `.card-interactive` → `DSCardInteractive`; `.info-row`, `.card-label`, `.page-header`, `.section-title`; score/type overlays → `DSScoreBadge` / `DSTypeBadge` (always white-on-dark glass). Carousels are Swiper (`components/Carousel.jsx`): integer slides-per-view per breakpoint (never cut cards), arrows page by `slidesPerGroup`, custom buttons auto-disabled at bounds; the old hand-rolled scroller is gone.
- Forms/feedback: custom glass dropdowns (never native select styling), 16px emerald range thumbs, `.skeleton` shimmer + `.spinner`, glass toasts with emerald progress bar.

### Conspicuously absent
No gradients on buttons/surfaces (hero overlays + dropdown tint + ambient mesh only). No colored shadows. No secondary brand color — emerald is the only accent; blue exists only in the background mesh, red only for errors/destructive. Spacing never off-rhythm; body copy never pure black/white.
