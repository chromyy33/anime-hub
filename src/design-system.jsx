/* ═══════════════════════════════════════════════════════════════════════
   AniDoc Design System — single-file source of truth
   ─────────────────────────────────────────────────────────────────────
   WHAT THIS IS
   • Tokens recorded AS FOUND in src/index.css (+ module CSS).
     Do not invent new values — reference the CSS var, e.g. var(--primary).
   • Standardized components that wrap the existing global classes
     (.btn-primary, .search-input, .badge, .chip-genre, .chip-filter, …)
     so new pages stop re-inventing inline styles.
   • A visual showcase (default export) mounted at /design-system.

   USAGE
   import { DSButton, DSSearchBar, DSGenreChip, DSFilterChip, DSBadge } from './design-system';
   <DSButton>View Details</DSButton>
   <DSSearchBar value={q} onChange={setQ} onSubmit={go} />
   <DSGenreChip>Action</DSGenreChip>
   ═══════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { Search, X, Star, Check, Moon, Sun, Info } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────
   1. TOKENS — recorded verbatim from :root and [data-theme='dark']
   ───────────────────────────────────────────────────────────────────── */

export const tokens = {
  light: {
    // Brand — fills keep emerald-600; small TEXT uses ink (AA ≥ 4.5:1)
    '--primary': '#059669',
    '--primary-hover': '#047857',
    '--primary-ink': '#047857',
    '--primary-dim': 'rgba(5, 150, 105, 0.10)',
    '--primary-wash': 'rgba(5, 150, 105, 0.16)',
    '--primary-line': 'rgba(5, 150, 105, 0.35)',
    '--focus-ring': 'rgba(5, 150, 105, 0.35)',
    '--text-accent': '#047857',
    '--text-on-primary': '#ffffff',
    '--danger': '#dc2626',
    '--danger-dim': 'rgba(220, 38, 38, 0.12)',
    '--scrim': 'rgba(2, 6, 23, 0.80)',
    '--scrim-soft': 'rgba(2, 6, 23, 0.60)',
    // Surfaces (glass)
    '--bg-base': '#f8fafc',
    '--bg-surface': 'rgba(255, 255, 255, 0.60)',
    '--bg-surface-hover': 'rgba(255, 255, 255, 0.72)',
    '--bg-surface-active': 'rgba(255, 255, 255, 0.50)',
    '--bg-elevated': 'rgba(255, 255, 255, 0.82)',
    '--bg-solid': '#ffffff',
    '--menu-border': '#cbd5e1',
    '--glass-border': 'rgba(255, 255, 255, 0.9)',
    // Text
    '--text-primary': '#020817',
    '--text-secondary': '#0f172a',
    '--text-tertiary': '#475569',
    // Borders
    '--border-subtle': '#e2e8f0',
    '--border-strong': '#cbd5e1',
    '--badge-border': 'rgba(255, 255, 255, 0.15)',
    // Status strips
    '--status-watching-bg': '#000000',
    '--status-watching-color': '#ffffff',
    '--status-plan-bg': 'rgba(71, 85, 105, 0.85)',
  },
  dark: {
    '--primary': '#10b981',
    '--primary-hover': '#34d399',
    '--primary-ink': '#34d399',
    '--primary-dim': 'rgba(16, 185, 129, 0.12)',
    '--primary-wash': 'rgba(16, 185, 129, 0.18)',
    '--primary-line': 'rgba(16, 185, 129, 0.35)',
    '--focus-ring': 'rgba(16, 185, 129, 0.45)',
    '--text-accent': '#10b981',
    '--text-on-primary': '#022c22',
    '--danger': '#f87171',
    '--danger-dim': 'rgba(248, 113, 113, 0.14)',
    '--scrim': 'rgba(2, 6, 23, 0.80)',
    '--scrim-soft': 'rgba(2, 6, 23, 0.60)',
    '--bg-base': '#0a0c10',
    '--bg-surface': 'rgba(24, 28, 35, 0.72)',
    '--bg-surface-hover': 'rgba(33, 39, 47, 0.80)',
    '--bg-surface-active': 'rgba(24, 28, 35, 0.62)',
    '--bg-elevated': 'rgba(30, 35, 42, 0.80)',
    '--bg-solid': '#1a1e25',
    '--menu-border': 'rgba(255, 255, 255, 0.16)',
    '--glass-border': 'rgba(255, 255, 255, 0.1)',
    '--text-primary': '#f0f6fc',
    '--text-secondary': '#c9d1d9',
    '--text-tertiary': '#9ba1b0',
    '--border-subtle': '#1e2029',
    '--border-strong': '#30363d',
    '--badge-border': 'rgba(255, 255, 255, 0.15)',
    '--status-watching-bg': '#ffffff',
    '--status-watching-color': '#000000',
    '--status-plan-bg': 'rgba(30, 41, 59, 0.85)',
  },
  // Decorative only (ambient mesh, glows, shimmer) — not for text or boundaries
  ambientMesh: ['rgba(16,185,129,0.12)', 'rgba(59,130,246,0.10)'],

  font: {
    heading: "'Outfit', system-ui, sans-serif",
    body: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  },
  type: {
    xs: 'var(--text-xs)', // 11px (10 mobile)
    sm: 'var(--text-sm)', // 13px (12 mobile)
    base: 'var(--text-base)', // 14px (13 mobile)
    md: 'var(--text-md)', // 16px (15 mobile)
    lg: 'var(--text-lg)', // 20px (18 mobile)
    xl: 'var(--text-xl)', // 24px (22 mobile)
    '2xl': 'var(--text-2xl)', // 32px (28 mobile)
    '3xl': 'var(--text-3xl)', // 44px (36 mobile)
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 40, '2xl': 64 },
  radius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)' },
  blur: 'var(--glass-blur)', // 48px surfaces · 12px navbar/slider · 32px dropdown
  maxWidth: 'var(--max-app-width)', // 1920px shell · 1400px page-container · 1300px schedule
};

export const themeVars = [
  { name: '--primary', label: 'Primary' },
  { name: '--primary-hover', label: 'Primary hover' },
  { name: '--primary-ink', label: 'Primary ink' },
  { name: '--primary-dim', label: 'Primary dim' },
  { name: '--primary-wash', label: 'Primary wash' },
  { name: '--danger', label: 'Danger' },
  { name: '--bg-base', label: 'Base' },
  { name: '--bg-surface', label: 'Surface' },
  { name: '--bg-surface-hover', label: 'Surface hover' },
  { name: '--bg-elevated', label: 'Elevated' },
  { name: '--text-primary', label: 'Text 1°' },
  { name: '--text-secondary', label: 'Text 2°' },
  { name: '--text-tertiary', label: 'Text 3°' },
  { name: '--text-accent', label: 'Accent text' },
  { name: '--border-subtle', label: 'Border subtle' },
  { name: '--border-strong', label: 'Border strong' },
];

/* ─────────────────────────────────────────────────────────────────────
   2. STANDARDIZED COMPONENTS — thin wrappers over global classes.
      Use these instead of copying inline styles between pages.
   ───────────────────────────────────────────────────────────────────── */

/** Primary / ghost button → .btn-primary / .btn-ghost */
export function DSButton({ variant = 'primary', children, style, ...rest }) {
  return (
    <button className={variant === 'ghost' ? 'btn-ghost' : 'btn-primary'} style={style} {...rest}>
      {children}
    </button>
  );
}

/** Square icon button → .icon-btn */
export function DSIconButton({ children, label, style, ...rest }) {
  return (
    <button className="icon-btn" title={label} aria-label={label} style={style} {...rest}>
      {children}
    </button>
  );
}

/**
 * Standard search bar → .search-input pattern.
 * Icon left, clear-button right, emerald focus ring. Same in navbar,
 * schedule page, and filter panels — keep it identical everywhere.
 */
export function DSSearchBar({ value, onChange, onSubmit, placeholder = 'Search anime...', style }) {
  const inner = (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
      <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: 14, pointerEvents: 'none' }} />
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        autoComplete="off"
        style={{ paddingLeft: 40, height: 42 }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange?.('')}
          aria-label="Clear search"
          style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
  if (onSubmit) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(value); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', ...style }}>
        {inner}
        <button type="submit" className="btn-primary" style={{ height: 42, width: 42, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Search">
          <Search size={18} />
        </button>
      </form>
    );
  }
  return <div style={{ width: '100%', ...style }}>{inner}</div>;
}

/** Neutral badge → .badge (score pills, type pills, links) */
export function DSBadge({ children, style, ...rest }) {
  return <span className="badge" style={style} {...rest}>{children}</span>;
}

/** Emerald genre tag → .chip-genre */
export function DSGenreChip({ children, style, ...rest }) {
  return <span className="chip-genre" style={style} {...rest}>{children}</span>;
}

/** Day / tab toggle → .chip-filter (+ .active) */
export function DSFilterChip({ active, children, style, ...rest }) {
  return (
    <button className={`chip-filter${active ? ' active' : ''}`} style={style} {...rest}>
      {children}
    </button>
  );
}

/** Round multi-select pill → .genre-pill pattern (SearchPage filters) */
export function DSPill({ selected, children, style, ...rest }) {
  return (
    <button
      className={`genre-pill${selected ? ' selected' : ''}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...(style || {}) }}
      {...rest}
    >
      {selected && <Check size={11} strokeWidth={3} />}
      {children}
    </button>
  );
}

/** Static surface → .card */
export function DSCard({ children, style, ...rest }) {
  return <div className="card" style={{ padding: 20, ...style }} {...rest}>{children}</div>;
}

/** Clickable surface → .card-interactive (lift + emerald ring on hover) */
export function DSCardInteractive({ children, style, ...rest }) {
  return <div className="card-interactive" style={style} {...rest}>{children}</div>;
}

/** Uppercase mini label → .card-label */
export function DSCardLabel({ children }) {
  return <p className="card-label">{children}</p>;
}

/** Label → value row → .info-row */
export function DSInfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-row__label">{label}</span>
      <span className="info-row__value">{value}</span>
    </div>
  );
}

/** Page title + subtitle → .page-header */
export function DSPageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Section heading with icon tile → .section-title + .section-icon */
export function DSSectionHeader({ icon, title, subtitle, action }) {
  return (
    <div className="flex-between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
      <div className="flex items-center gap-md">
        <div className="section-icon">{icon}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 className="text-lg font-bold" style={{ margin: 0, lineHeight: 1.2 }}>{title}</h2>
          {subtitle && <p className="text-sm" style={{ margin: 0, color: 'var(--text-tertiary)' }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/** Score overlay → scrim pill, always white-on-dark in both themes */
export function DSScoreBadge({ score }) {
  return (
    <span className="badge" style={{ position: 'absolute', top: 10, right: 10, background: 'var(--scrim)', border: '1px solid var(--badge-border)', color: '#fff', backdropFilter: 'blur(12px)' }}>
      <Star size={11} fill="var(--primary)" color="var(--primary)" /> {score}
    </span>
  );
}

/** Format tag (TV / Movie) → scrim, bottom-left of poster */
export function DSTypeBadge({ children }) {
  return (
    <span style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', padding: '0 10px', borderRadius: 4, height: 28, background: 'var(--scrim)', color: '#fff', border: '1px solid var(--badge-border)', backdropFilter: 'blur(12px)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center' }}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   3. SHOWCASE — visual outlook & usage cues. Mounted at /design-system.
   ───────────────────────────────────────────────────────────────────── */

function Swatch({ name, label, textColor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div style={{ height: 56, borderRadius: 'var(--radius-md)', background: `var(${name})`, border: '1px solid var(--border-strong)', boxShadow: 'inset 0 0 0 1px var(--glass-border)' }} />
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: 11, color: textColor || 'var(--text-tertiary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
    </div>
  );
}

function Section({ index, title, cue, children }) {
  return (
    <section className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-accent)', fontFamily: 'monospace' }}>{index}</span>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
      </div>
      {cue && (
        <p style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 20px 0', lineHeight: 1.6 }}>
          <Info size={14} style={{ flexShrink: 0, marginTop: 3 }} color="var(--primary)" />
          <span>{cue}</span>
        </p>
      )}
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  const [q, setQ] = useState('');
  const [day, setDay] = useState('Mon');
  const [pills, setPills] = useState(['Action']);
  const [score, setScore] = useState(7);
  const togglePill = (g) => setPills((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]));

  return (
    <div className="page-container">
      <DSPageHeader
        title="Design System"
        subtitle="Single-file source of truth — src/design-system.jsx. Contrast-verified tokens (AA) + components that consume them."
        action={<DSBadge><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} /> Live — follows app theme</DSBadge>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 01 COLORS */}
        <Section index="01" title="Colors — light & dark" cue="Light: emerald-600 #059669 fills on near-white glass; small emerald text uses ink #047857 (AA 5.48:1). Dark: emerald-500 #10b981 fills with deep-ink labels #022c22 (AA 5.97:1 — white was 2.54:1), deeper canvas #0a0c10 for layer separation. Danger is tokenized: #dc2626 / #f87171. Toggle the moon/sun in the navbar to proof both themes here.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { theme: 'Light', bg: '#f8fafc', fg: '#020817', vars: tokens.light },
              { theme: 'Dark', bg: '#0c0e12', fg: '#f0f6fc', vars: tokens.dark },
            ].map((t) => (
              <div key={t.theme} style={{ background: t.bg, borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--border-strong)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.fg, marginBottom: 4 }}>{t.theme} theme</div>
                <div style={{ fontSize: 11, color: t.theme === 'Light' ? '#475569' : '#9ba1b0', marginBottom: 12, fontFamily: 'monospace' }}>
                  primary {t.vars['--primary']} · base {t.vars['--bg-base']} · ink {t.vars['--primary-ink']}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 12 }}>
                  {themeVars.map((v) => (
                    <div key={v.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ height: 40, borderRadius: 8, background: t.vars[v.name], border: '1px solid rgba(128,128,128,0.35)' }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: t.fg }}>{v.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 12 }}>Current theme (live vars)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
              {themeVars.map((v) => <Swatch key={v.name} name={v.name} label={v.label} />)}
            </div>
          </div>
        </Section>

        {/* 02 TYPE */}
        <Section index="02" title="Typography" cue="Outfit for headings / brand, Plus Jakarta Sans for UI body. Page titles 32/800/-0.02em; section titles 20/700; card labels 11/700 uppercase. Body copy stays in --text-secondary, never pure black/white.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: tokens.font.heading, fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Outfit 44 — Page hero / display</div>
            <div className="page-title">Page title — 32 / 800 (class .page-title)</div>
            <div className="section-title" style={{ margin: 0 }}><span className="section-icon"><Star size={16} color="var(--primary)" /></span>Section title — 20 / 700 + icon tile</div>
            <p className="card-label" style={{ margin: 0 }}>Card label — 11 / 700 / uppercase / 0.07em</p>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0, maxWidth: 640 }}>Body 14 — Plus Jakarta Sans, line-height 1.6–1.8, color --text-secondary. Muted hints and placeholders use --text-tertiary. Emerald --text-accent is reserved for links, active states and scores.</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-tertiary)' }}>
              {['xs 11', 'sm 13', 'base 14', 'md 16', 'lg 20', 'xl 24', '2xl 32', '3xl 44'].map((s) => <span key={s} style={{ fontFamily: 'monospace' }}>{s}</span>)}
            </div>
          </div>
        </Section>

        {/* 03 SHAPE */}
        <Section index="03" title="Shape, depth & rhythm" cue="Radii 6 / 10 / 16 / 24 — pills are the only 99px exception. Glass = surface + inset 1px var(--glass-border) + blur 48px (12px nav, 32px dropdown). Spacing rhythm 4 · 8 · 16 · 24 · 40 · 64.">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {[['sm · 6', 6], ['md · 10', 10], ['lg · 16', 16], ['xl · 24', 24]].map(([l, r]) => (
              <div key={l} style={{ width: 96, height: 64, borderRadius: r, background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', boxShadow: 'inset 0 0 0 1px var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>{l}</div>
            ))}
            <div style={{ width: 120, height: 64, borderRadius: 99, background: 'var(--primary-dim)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-accent)' }}>pill · 99</div>
          </div>
        </Section>

        {/* 04 BUTTONS */}
        <Section index="04" title="Buttons" cue="Two flavours only: solid emerald .btn-primary for the one main action, .btn-ghost outline for everything secondary. Labels use --text-on-primary: white in light, deep-ink #022c22 in dark (white-on-emerald fails in dark). Square .icon-btn for icon-only. Watchlist split-button lives in WatchlistButton.jsx — don't rebuild it here.">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <DSButton>View Details</DSButton>
            <DSButton variant="ghost">Cancel</DSButton>
            <DSIconButton label="Toggle theme">{typeof window !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</DSIconButton>
            <DSIconButton label="Search"><Search size={18} /></DSIconButton>
          </div>
          <pre style={{ marginTop: 16, fontSize: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 12, overflowX: 'auto', color: 'var(--text-tertiary)' }}>{`<DSButton>View Details</DSButton>\n<DSButton variant="ghost">Cancel</DSButton>\n<DSIconButton label="Search"><Search size={18} /></DSIconButton>`}</pre>
        </Section>

        {/* 05 SEARCH */}
        <Section index="05" title="Search bar" cue="One pattern everywhere: 42px height, icon left, clear-X right, emerald focus ring (3px var(--focus-ring), visible in both themes). Navbar adds a square submit button; schedule/filter pages use the bare input. Use <DSSearchBar/> — stop copying the navbar markup.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
            <DSSearchBar value={q} onChange={setQ} onSubmit={() => {}} placeholder="Search anime..." />
            <DSSearchBar value={q} onChange={setQ} placeholder="Without submit button…" />
          </div>
          <pre style={{ marginTop: 16, fontSize: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 12, overflowX: 'auto', color: 'var(--text-tertiary)' }}>{`<DSSearchBar value={q} onChange={setQ} onSubmit={go} />`}</pre>
        </Section>

        {/* 06 TAGS */}
        <Section index="06" title="Tags, chips & badges" cue=".badge = neutral outline (scores, links, meta). .chip-genre = emerald tag set in --text-accent with a --primary-line border (AA in both themes). .chip-filter = day/tab toggle (active = solid emerald + on-primary ink). .genre-pill = round multi-select with check. Active-filter chips are badge + dim wash + accent text.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <DSBadge><Star size={11} fill="var(--primary)" color="var(--primary)" /> 8.91</DSBadge>
              <DSBadge>TV</DSBadge>
              <DSBadge>24 eps</DSBadge>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <DSGenreChip>Action</DSGenreChip>
              <DSGenreChip>Romance</DSGenreChip>
              <DSGenreChip>Sci-Fi</DSGenreChip>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Mon', 'Tue', 'Wed', 'Thu'].map((d) => (
                <DSFilterChip key={d} active={day === d} onClick={() => setDay(d)}>{d}</DSFilterChip>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Action', 'Comedy', 'Drama', 'Fantasy'].map((g) => (
                <DSPill key={g} selected={pills.includes(g)} onClick={() => togglePill(g)}>{g}</DSPill>
              ))}
            </div>
          </div>
        </Section>

        {/* 07 CARDS */}
        <Section index="07" title="Cards & layout" cue=".card = static glass panel (sidebar, filters, reviews). .card-interactive = hover lift -6px + 2px emerald ring. Card image wrapper is always 140% ratio with zoom 1.06 on hover. Grids use .grid-list; carousels hide scrollbars and snap.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <DSCard>
              <DSCardLabel>Stats</DSCardLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <DSInfoRow label="Type" value="TV" />
                <DSInfoRow label="Episodes" value="24" />
                <DSInfoRow label="Status" value="Airing" />
              </div>
            </DSCard>
            <DSCardInteractive style={{ overflow: 'hidden' }}>
              <div style={{ position: 'relative', paddingTop: '56%', background: 'var(--bg-surface-hover)', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--primary-dim), transparent)' }} />
                <DSScoreBadge score="8.91" />
                <DSTypeBadge>TV</DSTypeBadge>
              </div>
              <div style={{ padding: '14px 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Interactive card</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>2024</span>
                  <DSGenreChip>Action</DSGenreChip>
                </div>
              </div>
            </DSCardInteractive>
          </div>
          <div style={{ marginTop: 16 }}>
            <DSSectionHeader icon={<Star size={18} color="var(--primary)" />} title="Section header" subtitle="Icon tile + title + muted subtitle" action={<span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-accent)' }}>View all →</span>} />
          </div>
        </Section>

        {/* 08 FORMS */}
        <Section index="08" title="Form controls" cue="Dropdowns are custom glass menus (blur 48, emerald active row) — never native <select> styling. Range thumbs are 16px emerald with base-colored ring. Year is a plain number input on surface. Toasts are glass cards with an emerald progress bar.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Sort by</label>
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: 13, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Score</span><span style={{ color: 'var(--text-tertiary)' }}>▾</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Min score</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-accent)' }}>{score}</span>
              </div>
              <input type="range" min="0" max="10" step="0.5" value={score} onChange={(e) => setScore(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="spinner" />
              <div className="skeleton" style={{ width: 120, height: 16, borderRadius: 4 }} />
            </div>
          </div>
        </Section>

        {/* 09 RULES */}
        <Section index="09" title="Rules for future code" cue="The fastest way to keep the site consistent. When in doubt, open this page side-by-side with what you're building.">
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <li>Reference <code style={{ fontFamily: 'monospace' }}>var(--…)</code> tokens — never paste hex. No new <code style={{ fontFamily: 'monospace' }}>rgba(16,185,129,…)</code> washes: use <code style={{ fontFamily: 'monospace' }}>dim</code> (subtle), <code style={{ fontFamily: 'monospace' }}>wash</code> (hover), <code style={{ fontFamily: 'monospace' }}>line</code> (borders).</li>
            <li>Emerald text always uses <code style={{ fontFamily: 'monospace' }}>--text-accent</code> (light #047857 AA, dark #10b981 AAA) — never <code style={{ fontFamily: 'monospace' }}>--primary</code> for text. Micro-labels (≤12px) may use <code style={{ fontFamily: 'monospace' }}>--primary-ink</code>.</li>
            <li>Text on emerald fills always uses <code style={{ fontFamily: 'monospace' }}>--text-on-primary</code> (white light / #022c22 ink dark). Danger uses <code style={{ fontFamily: 'monospace' }}>--danger / --danger-dim</code>; imagery labels use <code style={{ fontFamily: 'monospace' }}>--scrim</code>.</li>
            <li>Use the <code style={{ fontFamily: 'monospace' }}>DS*</code> exports in this file instead of new inline styles or new CSS modules for buttons, search, chips, badges, cards.</li>
            <li>Emerald (--primary) is the only accent. Blue appears solely in the ambient background mesh; red solely for errors / destructive hover.</li>
            <li>Conspicuously absent: no gradients on buttons or surfaces (hero overlays + dropdown tint only), no shadows with color (neutral only), no second brand color, spacing never off-rhythm.</li>
            <li>Glass recipe: <code style={{ fontFamily: 'monospace' }}>background: var(--bg-surface); border: 1px solid var(--border-subtle); box-shadow: inset 0 0 0 1px var(--glass-border)</code> + blur. Elevation in dark reads through lighter fills, not shadows.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
