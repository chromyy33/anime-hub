import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, SearchX, ChevronLeft, ChevronRight, SlidersHorizontal, X, Check, ChevronDown } from 'lucide-react';
import SEO from '../components/SEO';
import AnimeCard from '../components/AnimeCard';

// ─── Popular genres (curated) ─────────────────────────────────────────
const POPULAR_GENRES = [
  { mal_id: 1,  name: 'Action' },
  { mal_id: 2,  name: 'Adventure' },
  { mal_id: 4,  name: 'Comedy' },
  { mal_id: 8,  name: 'Drama' },
  { mal_id: 10, name: 'Fantasy' },
  { mal_id: 14, name: 'Horror' },
  { mal_id: 7,  name: 'Mystery' },
  { mal_id: 22, name: 'Romance' },
  { mal_id: 24, name: 'Sci-Fi' },
  { mal_id: 36, name: 'Slice of Life' },
  { mal_id: 30, name: 'Sports' },
  { mal_id: 37, name: 'Supernatural' },
  { mal_id: 41, name: 'Suspense' },
  { mal_id: 18, name: 'Mecha' },
  { mal_id: 40, name: 'Psychological' },
  { mal_id: 27, name: 'Shounen' },
  { mal_id: 25, name: 'Shoujo' },
  { mal_id: 42, name: 'Seinen' },
];

// ─── Animation variants ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.3, delay: i * 0.04, ease: [0.4, 0, 0.2, 1] } }),
};

// ─── Genre multi-select pill ───────────────────────────────────────────
function GenrePill({ genre, selected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(genre.mal_id)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500,
        border: `1px solid ${selected ? 'var(--primary)' : 'var(--border-subtle)'}`,
        background: selected ? 'rgba(16,185,129,0.12)' : 'var(--bg-surface)',
        color: selected ? 'var(--primary)' : 'var(--text-tertiary)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {selected && <Check size={11} strokeWidth={3} />}
      {genre.name}
    </button>
  );
}

// ─── Score range display ───────────────────────────────────────────────
function ScoreSlider({ label, value, onChange, min = 0, max = 10, step = 0.5 }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
          {label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: value > 0 ? 'var(--primary)' : 'var(--text-tertiary)' }}>
          {value}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', outline: 'none', display: 'block' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {[0, 5, 10].map(n => (
          <span key={n} style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{n}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Custom styled dropdown (replaces native <select>) ────────────────
function FilterSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref}>
      <label style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            border: `1px solid ${open ? 'var(--primary)' : 'var(--border-subtle)'}`,
            background: 'var(--bg-surface)', color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontSize: 13, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span>{selected.label}</span>
          <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                background: `linear-gradient(135deg, rgba(16, 185, 129, 0.06), transparent), var(--bg-elevated)`, 
                border: '1px solid var(--border-strong)',
                backdropFilter: 'blur(var(--glass-blur))', WebkitBackdropFilter: 'blur(var(--glass-blur))',
                borderRadius: 'var(--radius-sm)', boxShadow: 'inset 0 0 0 1px var(--glass-border), var(--shadow-lg)', overflow: 'hidden',
              }}
            >
              {options.map(o => (
                <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                  style={{
                    width: '100%', padding: '9px 12px', textAlign: 'left', border: 'none',
                    background: o.value === value ? 'rgba(16,185,129,0.08)' : 'transparent',
                    color: o.value === value ? 'var(--primary)' : 'var(--text-primary)',
                    fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', fontFamily: 'inherit',
                    transition: 'background 0.1s',
                  }}
                  onMouseOver={e => { if (o.value !== value) e.currentTarget.style.background = 'var(--bg-surface-hover)'; }}
                  onMouseOut={e => { if (o.value !== value) e.currentTarget.style.background = 'transparent'; }}
                >
                  {o.label}
                  {o.value === value && <Check size={13} strokeWidth={3} />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main SearchPage ───────────────────────────────────────────────────
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query  = searchParams.get('q')    || '';
  const page   = parseInt(searchParams.get('page') || '1', 10);

  // ── Filters from URL ────────────────────────────────────────────────
  const urlGenres = searchParams.get('genres') || '';
  const urlType   = searchParams.get('type')   || '';
  const urlStatus = searchParams.get('status') || '';
  const urlSort   = searchParams.get('order_by') || 'score';
  const urlMinScore = parseFloat(searchParams.get('min_score') || '0');
  const urlYear   = searchParams.get('start_date') ? searchParams.get('start_date').slice(0, 4) : '';

  // ── Local filter state (drafts until Apply) ─────────────────────────
  const [selectedGenres, setSelectedGenres] = useState(() => urlGenres ? urlGenres.split(',').map(Number) : []);
  const [type,     setType]     = useState(urlType);
  const [status,   setStatus]   = useState(urlStatus);
  const [sort,     setSort]     = useState(urlSort);
  const [minScore, setMinScore] = useState(urlMinScore);
  const [year,     setYear]     = useState(urlYear);

  // ── Data state ──────────────────────────────────────────────────────
  const [results,    setResults]    = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ── Active filter count badge ────────────────────────────────────────
  const activeCount = [
    selectedGenres.length > 0,
    !!type, !!status,
    minScore > 0,
    !!year,
    sort !== 'score',
  ].filter(Boolean).length;

  // ── Build API URL from current URL params ────────────────────────────
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (query)    params.set('q', query);
    if (urlGenres) params.set('genres', urlGenres);
    if (urlType)   params.set('type', urlType);
    if (urlStatus) params.set('status', urlStatus);
    params.set('order_by', urlSort);
    params.set('sort', 'desc');
    if (urlMinScore > 0) params.set('min_score', urlMinScore);
    if (urlYear)   { params.set('start_date', `${urlYear}-01-01`); params.set('end_date', `${urlYear}-12-31`); }
    params.set('limit', '24');
    params.set('page', page);
    params.set('sfw', 'true');
    return `https://api.jikan.moe/v4/anime?${params.toString()}`;
  }, [query, urlGenres, urlType, urlStatus, urlSort, urlMinScore, urlYear, page]);

  // ── Fetch results ────────────────────────────────────────────────────
  useEffect(() => {
    if (!query && !urlGenres && !urlType && !urlStatus && urlMinScore === 0 && !urlYear) return;
    setLoading(true);
    setResults([]);
    fetch(buildUrl())
      .then(r => r.json())
      .then(data => {
        setResults(data.data || []);
        setPagination(data.pagination || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [buildUrl]);

  // ── Apply filters → update URL (resets to page 1) ───────────────────
  const applyFilters = () => {
    const p = {};
    if (query) p.q = query;
    if (selectedGenres.length) p.genres = selectedGenres.join(',');
    if (type)   p.type = type;
    if (status) p.status = status;
    p.order_by = sort;
    if (minScore > 0) p.min_score = minScore;
    if (year)   p.start_date = year;
    p.page = '1';
    setSearchParams(p);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSelectedGenres([]); setType(''); setStatus('');
    setSort('score'); setMinScore(0); setYear('');
    const p = {}; if (query) p.q = query; p.page = '1';
    setSearchParams(p);
  };

  const goToPage = (p) => {
    const cur = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...cur, page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleGenre = (id) => {
    setSelectedGenres(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const filteredGenres = POPULAR_GENRES;

  const hasResults = !loading && results.length > 0;
  const isEmpty    = !loading && results.length === 0 && (query || urlGenres);

  return (
    <div style={{ paddingBottom: 60 }}>
      <SEO 
        title={query ? `Search: ${query}` : 'Browse Anime'} 
        description={query ? `Search results for ${query} on AniDoc.` : "Browse and filter the vast anime library on AniDoc."}
        url={`/search${query ? `?q=${query}` : ''}`}
      />

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', marginBottom: 32 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          {pagination && <p className="text-xs text-muted" style={{ marginBottom: 6 }}>
            {pagination.items?.total?.toLocaleString()} results
            {query && <> for <span className="text-primary font-semibold">"{query}"</span></>}
          </p>}
          <h1 className="page-title" style={{ margin: 0, lineHeight: 1.2 }}>
            {query ? <>Results for <span className="text-accent">"{query}"</span></> : 'Browse Anime'}
          </h1>
        </div>

        {/* Filter toggle button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {activeCount > 0 && (
            <button onClick={clearFilters}
              style={{ fontSize: 13, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <X size={14} /> Clear filters
            </button>
          )}
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              border: `1px solid ${showFilters ? 'var(--primary)' : 'var(--border-strong)'}`,
              borderRadius: 'var(--radius-sm)', background: showFilters ? 'rgba(16,185,129,0.08)' : 'var(--bg-surface)',
              color: showFilters ? 'var(--primary)' : 'var(--text-primary)', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all 0.15s', fontFamily: 'inherit',
            }}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeCount > 0 && (
              <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '1px 6px', lineHeight: 1.4 }}>
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Filter Panel (collapsible) ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="card filter-panel" style={{ marginBottom: 24 }}>
              <div className="grid-list" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 24 }}>

                <FilterSelect label="Type" value={type} onChange={setType} options={[
                  { value: '', label: 'Any type' },
                  { value: 'tv', label: 'TV Series' },
                  { value: 'movie', label: 'Movie' },
                  { value: 'ova', label: 'OVA' },
                  { value: 'ona', label: 'ONA' },
                  { value: 'special', label: 'Special' },
                ]} />

                <FilterSelect label="Status" value={status} onChange={setStatus} options={[
                  { value: '', label: 'Any status' },
                  { value: 'airing', label: 'Currently Airing' },
                  { value: 'complete', label: 'Finished' },
                  { value: 'upcoming', label: 'Upcoming' },
                ]} />

                <FilterSelect label="Sort by" value={sort} onChange={setSort} options={[
                  { value: 'score', label: 'Score' },
                  { value: 'popularity', label: 'Popularity' },
                  { value: 'members', label: 'Members' },
                  { value: 'favorites', label: 'Favorites' },
                  { value: 'start_date', label: 'Newest first' },
                ]} />

                <div>
                  <label className="card-label" style={{ marginBottom: 6 }}>Year</label>
                  <input
                    type="number" placeholder="e.g. 2023" value={year}
                    onChange={e => setYear(e.target.value)}
                    min="1960" max={new Date().getFullYear() + 1}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>

                <ScoreSlider label="Min Score" value={minScore} onChange={setMinScore} />
              </div>

              {/* Genre multi-select */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Popular Genres {selectedGenres.length > 0 && <span style={{ color: 'var(--primary)' }}>({selectedGenres.length} selected)</span>}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 140, overflowY: 'auto', paddingRight: 4 }}>
                  {filteredGenres.map(g => (
                    <GenrePill key={g.mal_id} genre={g} selected={selectedGenres.includes(g.mal_id)} onToggle={toggleGenre} />
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                <button onClick={() => setShowFilters(false)}
                  className="filter-action-btn"
                  style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button onClick={applyFilters} className="btn-primary filter-action-btn">
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter chips (below panel when closed) */}
      {!showFilters && activeCount > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {urlType && <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'var(--primary)', color: 'var(--primary)' }}>Type: {urlType.toUpperCase()}</span>}
          {urlStatus && <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'var(--primary)', color: 'var(--primary)' }}>Status: {urlStatus}</span>}
          {urlMinScore > 0 && <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'var(--primary)', color: 'var(--primary)' }}>Score ≥ {urlMinScore}</span>}
          {urlYear && <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'var(--primary)', color: 'var(--primary)' }}>Year: {urlYear}</span>}
          {urlSort !== 'score' && <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'var(--primary)', color: 'var(--primary)' }}>Sort: {urlSort}</span>}
          {urlGenres && urlGenres.split(',').map(gid => {
            const g = POPULAR_GENRES.find(x => x.mal_id === Number(gid));
            return g ? <span key={gid} className="badge" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'var(--primary)', color: 'var(--primary)' }}>{g.name}</span> : null;
          })}
        </div>
      )}

      {/* ── Skeleton ── */}
      {loading && (
        <div className="grid-list">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card skeleton" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div style={{ paddingTop: '145%' }} />
              <div style={{ padding: 12 }}>
                <div style={{ height: 13, background: 'var(--border-strong)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 11, background: 'var(--border-subtle)', borderRadius: 4, width: '55%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {isEmpty && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, color: 'var(--text-tertiary)' }}>
          <SearchX size={48} strokeWidth={1.5} />
          <p style={{ marginTop: 16, fontSize: 16 }}>No results found{query ? ` for "${query}"` : ''}</p>
          {activeCount > 0 && <button onClick={clearFilters} style={{ marginTop: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>Clear filters and try again</button>}
        </div>
      )}

      {/* ── No query state ── */}
      {!query && !urlGenres && !urlType && !urlStatus && !urlMinScore && !urlYear && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-tertiary)' }}>
          <SearchX size={48} strokeWidth={1.5} />
          <p style={{ marginTop: 16, fontSize: 16 }}>Search above or open Filters to browse.</p>
        </div>
      )}

      {/* ── Results grid ── */}
      {hasResults && (
        <div className="grid-list">
          {results.map((anime, idx) => (
            <AnimeCard key={anime.mal_id} anime={anime} index={idx} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.last_visible_page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 48 }}>
          <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
            className="btn-ghost" style={{ opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
            <ChevronLeft size={16} /> Prev
          </button>

          {(() => {
            const total = pagination.last_visible_page;
            const pages = []; const start = Math.max(1, page - 2); const end = Math.min(total, page + 2);
            if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < total) { if (end < total - 1) pages.push('...'); pages.push(total); }
            return pages.map((p, i) => p === '...' ? (
              <span key={`e-${i}`} style={{ padding: '0 6px', color: 'var(--text-tertiary)', fontSize: 14 }}>…</span>
            ) : (
              <button key={p} onClick={() => goToPage(p)}
                className={p === page ? "btn-primary" : "btn-ghost"}
                style={{ padding: '0.6em 1em', minWidth: '2.5em' }}>
                {p}
              </button>
            ));
          })()}

          <button onClick={() => goToPage(page + 1)} disabled={!pagination.has_next_page}
            className="btn-ghost" style={{ opacity: !pagination.has_next_page ? 0.5 : 1, cursor: !pagination.has_next_page ? 'not-allowed' : 'pointer' }}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
