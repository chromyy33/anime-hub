import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { BookmarkPlus, Check, Eye, Clock, ChevronDown, Trash2, MoreHorizontal } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import styles from './WatchlistButton.module.css';

const STATUS_CONFIG = {
  plan:      { label: 'Plan to Watch', Icon: Clock },
  watching:  { label: 'Watching',      Icon: Eye   },
  completed: { label: 'Completed',     Icon: Check },
};

export default function WatchlistButton({ anime, variant = 'default' }) {
  const { addToList, removeFromList, setStatus, setUserRating, getEntry } = useWatchlist();
  const entry  = getEntry(anime?.mal_id);
  const inList = !!entry;
  
  const isMinimal = variant === 'minimal';
  const isIcon = variant === 'icon';
  const isBadge = variant === 'badge';
  const isDots = variant === 'dots';

  const [open,      setOpen]      = useState(false);
  const [menuPos,   setMenuPos]   = useState(null); // { top, left } — viewport-pinned
  const [sliderVal, setSliderVal] = useState(entry?.userRating ?? 0);
  const ref = useRef(null);      // trigger wrapper
  const menuRef = useRef(null);  // portaled menu

  useEffect(() => { setSliderVal(entry?.userRating ?? 0); }, [entry?.userRating]);

  useEffect(() => {
    const handler = (e) => {
      const t = e.target;
      if (ref.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!anime) return null;

  // ── Compute status classes ──
  const statusClass = !inList
    ? styles.statusDefault
    : entry.status === 'completed'
    ? styles.statusCompleted
    : entry.status === 'watching'
    ? styles.statusWatching
    : styles.statusPlan;

  const cfg = entry ? STATUS_CONFIG[entry.status] : null;
  const StatusIcon = (isIcon && inList) || isDots ? MoreHorizontal : (cfg?.Icon ?? BookmarkPlus);

  // Menu placement: portaled to document.body and pinned to the trigger's
  // bottom-left edge (original anchoring) — never trapped behind cards.
  const MENU_GAP = 8;

  const computePos = useCallback(() => {
    const el = ref.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.bottom + MENU_GAP };
  }, []);

  const openMenu = useCallback(() => {
    setMenuPos(computePos());
    setOpen(true);
  }, [computePos]);

  const closeMenu = useCallback(() => setOpen(false), []);

  // Follow the trigger while open (page scroll, carousel scroll, resize).
  // rAF-throttled: scroll fires faster than React can paint.
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const follow = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setMenuPos(computePos()));
    };
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
    };
  }, [open, computePos]);

  const handleDirectClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inList) addToList(anime, 'plan');
    else if (open) closeMenu();
    else openMenu();
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (open) closeMenu();
    else openMenu();
  };

  const handleStatusSelect = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    inList ? setStatus(anime.mal_id, key) : addToList(anime, key);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`${styles.container} ${isBadge ? styles.isBadge : ''}`}>
      {isIcon || isDots ? (
        <button
          onClick={handleDirectClick}
          title={inList ? `Watchlist: ${cfg?.label}` : 'Add to Watchlist'}
          className={styles.iconBtn}
        >
          <StatusIcon size={14} strokeWidth={inList && !isDots ? 3 : 2} />
        </button>
      ) : isBadge ? (
        <div className={`${styles.badgeState} ${statusClass} ${styles.isBadgeState}`}>
          <StatusIcon size={12} />
          {inList ? cfg.label : 'Add to Watchlist'}
        </div>
      ) : (
        <>
          {/* ─── 70% left: action label ─── */}
          <button
            onClick={handleDirectClick}
            className={`${styles.btnLeft} ${isMinimal ? styles.isMinimal : ''} ${statusClass}`}
          >
            <StatusIcon size={isMinimal ? 13 : 15} />
            {inList ? cfg.label : 'Add to Watchlist'}
          </button>

          {/* Divider line */}
          <div className={styles.divider} />

          {/* ─── 30% right: chevron opens dropdown ─── */}
          <button
            onClick={toggleDropdown}
            className={`${styles.btnRight} ${isMinimal ? styles.isMinimal : ''} ${statusClass}`}
            aria-label="Open watchlist options"
            aria-expanded={open}
          >
            <ChevronDown size={isMinimal ? 13 : 15} className={`${styles.chev} ${open ? styles.chevOpen : ''}`} />
          </button>
        </>
      )}

      {/* ─── Dropdown: portaled straight to body (no AnimatePresence wrapper —
          it cannot track exit lifecycles through a portal boundary; enter
          animation still plays on mount, close is instant) ─── */}
      {open && !isBadge && menuPos && createPortal(
          <motion.div
            ref={menuRef}
            key="wl-menu"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="wl-portal"
            style={{ left: menuPos.left, top: menuPos.top }}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className={styles.dropdownMenu}>
            {/* Status options */}
            <div className={styles.menuPad}>
              <div className={styles.dropdownHeader}>
                {inList ? 'Update Status' : 'Add to list as…'}
              </div>
              {Object.entries(STATUS_CONFIG).map(([key, { label, Icon }]) => {
                const isActive = entry?.status === key;
                return (
                  <button
                    key={key}
                    onClick={(e) => handleStatusSelect(e, key)}
                    className={`${styles.statusOptionBtn} ${isActive ? styles.statusOptionBtnActive : ''}`}
                  >
                    <Icon size={14} color={isActive ? 'var(--primary)' : 'var(--text-tertiary)'} aria-hidden="true" />
                    {label}
                    {isActive && <Check size={12} className={styles.checkIcon} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {/* Rating slider */}
            {inList && (
              <div className={styles.ratingSection}>
                <div className={styles.ratingHeader}>
                  <span className={styles.ratingTitle}>
                    Your Rating
                  </span>
                  <span className={`${styles.ratingVal} ${sliderVal > 0 ? styles.hasRating : ''}`}>
                    {sliderVal > 0 ? `${sliderVal} / 10` : 'Not rated'}
                  </span>
                </div>
                <input
                  type="range" min="0" max="10" step="1"
                  value={sliderVal}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    e.stopPropagation();
                    const v = Number(e.target.value);
                    setSliderVal(v);
                    setUserRating(anime.mal_id, v > 0 ? v : null);
                  }}
                  className={styles.ratingSlider}
                />
                <div className={styles.ratingTicks}>
                  {[0, 5, 10].map(n => (
                    <span key={n} className={styles.ratingTickLabel}>{n}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Delete */}
            {inList && (
              <div className={styles.removeSection}>
                <button
                  onClick={(e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    removeFromList(anime.mal_id); 
                    setOpen(false); 
                  }}
                  className={styles.removeBtn}
                >
                  <Trash2 size={13} /> Remove from list
                </button>
              </div>
            )}
            </div>
          </motion.div>,
          document.body
        )}
    </div>
  );
}

