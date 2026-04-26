import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookmarkPlus, Check, Eye, Clock, ChevronDown, Trash2, MoreHorizontal } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';

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
  const [sliderVal, setSliderVal] = useState(entry?.userRating ?? 0);
  const ref = useRef(null);

  useEffect(() => { setSliderVal(entry?.userRating ?? 0); }, [entry?.userRating]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!anime) return null;

  // ── Colour tokens by status ──
  const statusStyle = !inList ? {
    border: isBadge ? 'none' : '1px solid var(--border-strong)',
    bg: isBadge ? 'var(--status-plan-bg)' : 'var(--bg-surface)',
    color: isBadge ? '#fff' : 'var(--text-secondary)',
  } : entry.status === 'completed' ? {
    border: isBadge ? 'none' : '1px solid var(--primary)',
    bg: 'var(--primary)',
    color: '#fff',
  } : entry.status === 'watching' ? {
    border: isBadge ? 'none' : '1px solid var(--border-strong)',
    bg: 'var(--status-watching-bg)',
    color: 'var(--status-watching-color)',
  } : {
    border: isBadge ? 'none' : '1px solid var(--border-strong)',
    bg: isBadge ? 'var(--status-plan-bg)' : 'var(--bg-surface-hover)',
    color: isBadge ? '#fff' : 'var(--text-primary)',
  };

  const cfg = entry ? STATUS_CONFIG[entry.status] : null;
  const StatusIcon = (isIcon && inList) || isDots ? MoreHorizontal : (cfg?.Icon ?? BookmarkPlus);

  const handleDirectClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inList) addToList(anime, 'plan');
    else setOpen(v => !v);
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(v => !v);
  };

  const handleStatusSelect = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    inList ? setStatus(anime.mal_id, key) : addToList(anime, key);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', width: isBadge ? '100%' : 'inline-flex' }}>
      {isIcon || isDots ? (
        <button
          onClick={handleDirectClick}
          title={inList ? `Watchlist: ${cfg?.label}` : 'Add to Watchlist'}
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'rgba(0,0,0,0.6)', 
            color: '#fff',
            border: '1px solid var(--badge-border)', 
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(12px)', transition: 'all 0.2s',
          }}
        >
          <StatusIcon size={14} strokeWidth={inList && !isDots ? 3 : 2} />
        </button>
      ) : isBadge ? (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            height: 30, width: '100%',
            background: statusStyle.bg,
            color: statusStyle.color,
            fontWeight: 800, fontSize: 10,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            pointerEvents: 'none',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <StatusIcon size={12} />
          {inList ? cfg.label : 'Add to Watchlist'}
        </div>
      ) : (
        <>
          {/* ─── 70% left: action label ─── */}
          <button
            onClick={handleDirectClick}
            style={{
              display: 'flex', alignItems: 'center', gap: isMinimal ? 6 : 8,
              height: isMinimal ? 32 : 40, padding: isMinimal ? '0 10px' : '0 16px',
              borderRadius: `var(--radius-sm) 0 0 var(--radius-sm)`,
              border: statusStyle.border,
              borderRight: 'none',
              background: statusStyle.bg,
              color: statusStyle.color,
              fontWeight: 700, fontSize: isMinimal ? 11 : 14, cursor: 'pointer',
              transition: 'all 0.18s',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              whiteSpace: 'nowrap',
              textTransform: isMinimal ? 'uppercase' : 'none',
              letterSpacing: isMinimal ? '0.04em' : 'normal',
              minWidth: isMinimal ? 100 : 140,
              justifyContent: 'center'
            }}
          >
            <StatusIcon size={isMinimal ? 13 : 15} />
            {inList ? cfg.label : 'Add to Watchlist'}
          </button>

          {/* Divider line */}
          <div style={{ width: 1, background: 'var(--border-strong)', flexShrink: 0, alignSelf: 'stretch' }} />

          {/* ─── 30% right: chevron opens dropdown ─── */}
          <button
            onClick={toggleDropdown}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: isMinimal ? 28 : 36, height: isMinimal ? 32 : 40,
              borderRadius: `0 var(--radius-sm) var(--radius-sm) 0`,
              border: statusStyle.border,
              borderLeft: 'none',
              background: statusStyle.bg,
              color: statusStyle.color,
              cursor: 'pointer',
              transition: 'all 0.18s',
              flexShrink: 0,
            }}
            aria-label="Open watchlist options"
            aria-expanded={open}
          >
            <ChevronDown size={isMinimal ? 13 : 15} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </>
      )}

      {/* ─── Dropdown ─── */}
      <AnimatePresence>
        {open && !isBadge && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{
              position: 'absolute', 
              top: 'calc(100% + 8px)', 
              bottom: 'unset',
              left: 0, 
              zIndex: 1000,
              background: `linear-gradient(165deg, rgba(255, 255, 255, 0.1), transparent), var(--bg-elevated)`,
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid var(--badge-border)',
              boxShadow: '0 12px 40px -8px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-md)',
              width: 210, overflow: 'hidden',
            }}
          >
            {/* Status options */}
            <div style={{ padding: '8px 0' }}>
              <div style={{ padding: '6px 14px 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
                {inList ? 'Update Status' : 'Add to list as…'}
              </div>
              {Object.entries(STATUS_CONFIG).map(([key, { label, Icon }]) => {
                const isActive = entry?.status === key;
                return (
                  <button
                    key={key}
                    onClick={(e) => handleStatusSelect(e, key)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', border: 'none', cursor: 'pointer',
                      background: isActive ? 'rgba(16,185,129,0.08)' : 'transparent',
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                      textAlign: 'left', transition: 'background 0.1s',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                    onMouseOver={e => { if (!isActive) e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; }}
                    onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={14} color={isActive ? 'var(--primary)' : 'var(--text-tertiary)'} aria-hidden="true" />
                    {label}
                    {isActive && <Check size={12} style={{ marginLeft: 'auto', color: 'var(--primary)' }} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {/* Rating slider */}
            {inList && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
                    Your Rating
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: sliderVal > 0 ? 'var(--primary)' : 'var(--text-tertiary)' }}>
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
                  style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', outline: 'none', display: 'block' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  {[0, 5, 10].map(n => (
                    <span key={n} style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{n}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Delete */}
            {inList && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '6px 8px' }}>
                <button
                  onClick={(e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    removeFromList(anime.mal_id); 
                    setOpen(false); 
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', background: 'transparent', border: 'none',
                    cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 12,
                    borderRadius: 4, transition: 'all 0.12s',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = 'rgb(239,68,68)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                >
                  <Trash2 size={13} /> Remove from list
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
