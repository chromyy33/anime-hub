import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, SearchX, ChevronLeft, ChevronRight, SlidersHorizontal, X, Check, ChevronDown } from 'lucide-react';
import SEO from '../components/SEO';
import AnimeCard from '../components/AnimeCard';
import { searchAnime } from '../utils/anilist';
import styles from './SearchPage.module.css';

// ─── Popular genres (AniList compatible) ──────────────────────────────
export const POPULAR_GENRES = [
  { id: 'Action', name: 'Action' },
  { id: 'Adventure', name: 'Adventure' },
  { id: 'Comedy', name: 'Comedy' },
  { id: 'Drama', name: 'Drama' },
  { id: 'Fantasy', name: 'Fantasy' },
  { id: 'Horror', name: 'Horror' },
  { id: 'Mahou Shoujo', name: 'Mahou Shoujo' },
  { id: 'Mecha', name: 'Mecha' },
  { id: 'Music', name: 'Music' },
  { id: 'Mystery', name: 'Mystery' },
  { id: 'Psychological', name: 'Psychological' },
  { id: 'Romance', name: 'Romance' },
  { id: 'Sci-Fi', name: 'Sci-Fi' },
  { id: 'Slice of Life', name: 'Slice of Life' },
  { id: 'Sports', name: 'Sports' },
  { id: 'Supernatural', name: 'Supernatural' },
  { id: 'Thriller', name: 'Thriller' },
];

export const JIKAN_TO_ANILIST_GENRES = {
  '1': 'Action', '2': 'Adventure', '4': 'Comedy', '8': 'Drama', '10': 'Fantasy',
  '14': 'Horror', '7': 'Mystery', '22': 'Romance', '24': 'Sci-Fi', '36': 'Slice of Life',
  '30': 'Sports', '37': 'Supernatural', '41': 'Thriller', '18': 'Mecha', '40': 'Psychological'
};

// ─── Animation variants ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.3, delay: i * 0.04, ease: [0.4, 0, 0.2, 1] } }),
};

// ─── Genre multi-select pill ───────────────────────────────────────────
function GenrePill({ genre, selected, onToggle }) {
  const gId = genre.id || genre.name;
  return (
    <button
      onClick={() => onToggle(gId)}
      className={`${styles.pill} ${selected ? styles.selected : ''}`}
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
      <div className={styles.scoreHead}>
        <span className={styles.scoreLabel}>
          {label}
        </span>
        <span className={`${styles.scoreVal} ${value > 0 ? styles.rated : ''}`}>
          {value}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={styles.scoreInput}
      />
      <div className={styles.scoreTicks}>
        {[0, 5, 10].map(n => (
          <span key={n} className={styles.scoreTick}>{n}</span>
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
      <label className={styles.selectLabel}>{label}</label>
      <div className={styles.selectAnchor}>
        <button
          onClick={() => setOpen(o => !o)}
          className={`${styles.selectTrigger} ${value ? styles.hasValue : ''} ${open ? styles.open : ''}`}
        >
          <span>{selected.label}</span>
          <ChevronDown size={14} className={`${styles.selectChevron} ${open ? styles.open : ''}`} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={styles.selectMenu}
            >
              {options.map(o => (
                <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`${styles.selectOption} ${o.value === value ? styles.active : ''}`}
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
  // Section "View all" links land here (?filter=airing / ?filter=top).
  // Translate once into the real filter params everything downstream uses.
  const urlFilter = searchParams.get('filter') || '';
  const effStatus = urlStatus || (urlFilter === 'airing' ? 'airing' : '');

  // ── Local filter state (drafts until Apply) ─────────────────────────
  const [selectedGenres, setSelectedGenres] = useState(() => {
    if (!urlGenres) return [];
    return urlGenres.split(',').map(g => JIKAN_TO_ANILIST_GENRES[g] || g);
  });
  const [type,     setType]     = useState(urlType);
  const [status,   setStatus]   = useState(effStatus);
  const [sort,     setSort]     = useState(urlSort);
  const [minScore, setMinScore] = useState(urlMinScore);
  const [year,     setYear]     = useState(urlYear);

  // ── Data state ──────────────────────────────────────────────────────
  const [results,    setResults]    = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── Active filter count badge ────────────────────────────────────────
  const activeCount = [
    selectedGenres.length > 0,
    !!type, !!status,
    minScore > 0,
    !!year,
    sort !== 'score',
  ].filter(Boolean).length;

  // ── Fetch results ────────────────────────────────────────────────────
  useEffect(() => {
    setError(null);
    setLoading(true);
    let cancelled = false;

    const genreStr = urlGenres
      ? (JIKAN_TO_ANILIST_GENRES[urlGenres] || urlGenres.split(',')[0])
      : '';

    searchAnime({
      query,
      genre: genreStr,
      format: urlType,
      status: effStatus,
      sort: urlSort,
      minScore: urlMinScore,
      year: urlYear,
      page
    })
      .then(data => {
        if (!cancelled) {
          setResults(data.results || []);
          setPagination(data.pagination || null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError('Search failed. Please try again.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [query, urlGenres, urlType, urlStatus, urlFilter, effStatus, urlSort, urlMinScore, urlYear, page]);

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


  const hasSearch  = query || urlGenres || urlType || urlStatus || urlMinScore > 0 || urlYear;
  const hasResults = !loading && results.length > 0;
  // Empty-with-search covers every filter type; the browse hint only shows
  // when nothing was asked for AND nothing came back (default browse fills
  // the grid, so it must not show alongside results).
  const isEmpty    = !loading && results.length === 0 && !!hasSearch;

  return (
    <div className={styles.wrap}>
      <SEO 
        title={query ? `Search: ${query}` : 'Browse Anime'} 
        description={query ? `Search results for ${query} on AniDoc.` : "Browse and filter the vast anime library on AniDoc."}
        url={`/search${query ? `?q=${query}` : ''}`}
      />

      {/* ── Page Header ── */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          {pagination && <p className={`text-xs ${styles.resultCount}`}>
            {pagination.items?.total?.toLocaleString()} results
            {query && <> for <span className="text-primary font-semibold">"{query}"</span></>}
          </p>}
          <h1 className={`page-title ${styles.resultTitle}`}>
            {query ? <>Results for <span className="text-accent">"{query}"</span></> : 'Browse Anime'}
          </h1>
        </div>

        {/* Filter toggle button */}
        <div className={styles.filterToggleRow}>
          {activeCount > 0 && (
            <button onClick={clearFilters} className={styles.clearFilters}>
              <X size={14} /> Clear filters
            </button>
          )}
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`${styles.filterToggle} ${showFilters ? styles.open : ''}`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeCount > 0 && (
              <span className={styles.filterCount}>
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
            className={styles.panelAnim}
          >
            <div className={`card filter-panel ${styles.panelCard}`}>
              <div className={`grid-list ${styles.filterGrid}`}>

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
                  <label className={`card-label ${styles.yearLabel}`}>Year</label>
                  <input
                    type="number" placeholder="e.g. 2023" value={year}
                    onChange={e => setYear(e.target.value)}
                    min="1960" max={new Date().getFullYear() + 1}
                    className={styles.yearInput}
                  />
                </div>

                <ScoreSlider label="Min Score" value={minScore} onChange={setMinScore} />
              </div>

              {/* Genre multi-select */}
              <div className={styles.genreArea}>
                <div className={styles.genreHead}>
                  <span className={styles.genreLabel}>
                    Popular Genres {selectedGenres.length > 0 && <span className={styles.genrePicked}>({selectedGenres.length} selected)</span>}
                  </span>
                </div>
                 <div className={styles.genreGrid}>
                  {POPULAR_GENRES.map(g => (
                    <GenrePill key={g.id} genre={g} selected={selectedGenres.includes(g.id)} onToggle={toggleGenre} />
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <div className={styles.panelActions}>
                <button onClick={() => setShowFilters(false)}
                  className={`filter-action-btn ${styles.cancelBtn}`}>
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
        <div className={styles.activeChips}>
          {urlType && <span className={`badge ${styles.activeChip}`}>Type: {urlType.toUpperCase()}</span>}
          {effStatus && <span className={`badge ${styles.activeChip}`}>Status: {effStatus}</span>}
          {urlMinScore > 0 && <span className={`badge ${styles.activeChip}`}>Score ≥ {urlMinScore}</span>}
          {urlYear && <span className={`badge ${styles.activeChip}`}>Year: {urlYear}</span>}
          {urlSort !== 'score' && <span className={`badge ${styles.activeChip}`}>Sort: {urlSort}</span>}
          {urlGenres && urlGenres.split(',').map(gid => {
            const resolved = JIKAN_TO_ANILIST_GENRES[gid] || gid;
            const g = POPULAR_GENRES.find(x => x.id === resolved || x.name === resolved);
            return g ? <span key={gid} className={`badge ${styles.activeChip}`}>{g.name}</span> : null;
          })}
        </div>
      )}

      {/* ── Skeleton ── */}
      {loading && (
        <div className="grid-list">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`card skeleton ${styles.skelCard}`}>
              <div className={styles.skelMedia} />
              <div className={styles.skelBody}>
                <div className={styles.skelBar} />
                <div className={styles.skelBarShort} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {isEmpty && (
        <div className={styles.emptyWrap}>
          <SearchX size={48} strokeWidth={1.5} />
          <p className={styles.emptyIcon}>No results found{query ? ` for "${query}"` : ''}</p>
          {activeCount > 0 && <button onClick={clearFilters} className={styles.emptyRetry}>Clear filters and try again</button>}
        </div>
      )}

       {/* ── Error state ── */}
      {error && (
        <div className={styles.loadError}>
          {error}
        </div>
      )}

      {/* ── No query state (only when truly nothing to show) ── */}
      {!loading && results.length === 0 && !hasSearch && (
        <div className={styles.browseHint}>
          <SearchX size={48} strokeWidth={1.5} />
          <p className={styles.browseHintText}>Search above or open Filters to browse.</p>
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
        <div className={styles.pagination}>
          <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
            className={`btn-ghost ${page <= 1 ? styles.pageBtnDim : styles.pageBtnLive}`}>
            <ChevronLeft size={16} /> Prev
          </button>

          {(() => {
            const total = pagination.last_visible_page;
            const pages = []; const start = Math.max(1, page - 2); const end = Math.min(total, page + 2);
            if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < total) { if (end < total - 1) pages.push('...'); pages.push(total); }
            return pages.map((p, i) => p === '...' ? (
              <span key={`e-${i}`} className={styles.pageEllipsis}>…</span>
            ) : (
              <button key={p} onClick={() => goToPage(p)}
                className={`${p === page ? "btn-primary" : "btn-ghost"} ${styles.pageNum}`}>
                {p}
              </button>
            ));
          })()}

          <button onClick={() => goToPage(page + 1)} disabled={!pagination.has_next_page}
            className={`btn-ghost ${!pagination.has_next_page ? styles.pageBtnDim : styles.pageBtnLive}`}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
