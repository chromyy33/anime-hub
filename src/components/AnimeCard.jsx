import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, BookmarkPlus, Check, Eye } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import WatchlistButton from './WatchlistButton';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] } }),
};

export default function AnimeCard({ anime, index, variant = 'grid', style = {} }) {
  const navigate = useNavigate();
  const { addToList, removeFromList, getEntry } = useWatchlist();
  const entry = getEntry(anime?.mal_id);
  const inList = !!entry;

  const handleGenreClick = (e, g) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/genre/${g.mal_id}/${g.name.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inList) {
        removeFromList(anime.mal_id);
    } else {
        addToList(anime, 'plan');
    }
  };

  // Grid Variant (Used in Search/Home)
  if (variant === 'grid') {
    return (
      <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible" style={style}>
        <Link to={`/anime/${anime.mal_id}`} className="card-interactive" style={{ textDecoration: 'none', display: 'block', position: 'relative' }}>
          
          {/* Quick Add Button */}
          <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
            <WatchlistButton anime={anime} variant="icon" />
          </div>

          <div className="card-img-wrap">
            <img src={anime.images.jpg.large_image_url} alt={anime.title} className="card-img" />
            {anime.score && (
              <span className="badge" style={{ 
                position: 'absolute', top: 10, right: 10, 
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', 
                border: 'none', color: '#fff', fontSize: 12, padding: '3px 8px', gap: 4 
              }}>
                <Star size={11} fill="var(--primary)" color="var(--primary)" /> {anime.score}
              </span>
            )}
            {anime.type && (
              <span style={{ 
                position: 'absolute', bottom: 8, left: 8, 
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', 
                padding: '2px 7px', borderRadius: 4, 
                background: 'rgba(15,23,42,0.8)', color: 'var(--text-primary)', 
                backdropFilter: 'blur(4px)', letterSpacing: '0.04em' 
              }}>
                {anime.type}
              </span>
            )}
          </div>
          <div style={{ padding: '14px 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
              {anime.title_english || anime.title}
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>{anime.year || anime.type || 'TBA'}</span>
              {anime.genres?.[0] && (
                <span 
                  onClick={(e) => handleGenreClick(e, anime.genres[0])}
                  style={{ fontSize: 11, color: 'var(--primary)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                >
                  {anime.genres[0].name}
                </span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // List Variant (Used in Schedule)
  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible" style={style}>
      <Link to={`/anime/${anime.mal_id}`} className="card-interactive" 
        style={{ 
          textDecoration: 'none', display: 'flex', gap: 16, padding: 14, 
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          position: 'relative', opacity: anime.airing === false ? 0.6 : 1
        }}>
        
        {/* Quick Add Button */}
        <button 
            onClick={handleQuickAdd}
            style={{
                position: 'absolute', top: 12, right: 12, zIndex: 10,
                width: 28, height: 28, borderRadius: 6,
                background: inList ? 'var(--primary)' : 'var(--bg-base)',
                color: inList ? '#fff' : 'var(--text-tertiary)', 
                border: '1px solid var(--border-subtle)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
        >
            {inList ? <Check size={14} strokeWidth={3} /> : <BookmarkPlus size={14} />}
        </button>

        <div style={{ width: 85, height: 115, flexShrink: 0 }}>
            <img src={anime.images.jpg.image_url} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Clock size={12} color="var(--primary)" />
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>
                    {anime.local?.time || anime.broadcast?.time || 'TBA'}
                </span>
                {anime.local && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>(Local)</span>}
                {anime.airing === false && <span style={{ fontSize: 10, color: 'var(--text-tertiary)', background: 'var(--bg-base)', padding: '1px 5px', borderRadius: 3, marginLeft: 'auto' }}>FINISHED</span>}
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {anime.title_english || anime.title}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {anime.genres?.slice(0, 3).map(g => (
                    <span 
                      key={g.mal_id} 
                      onClick={(e) => handleGenreClick(e, g)}
                      style={{ fontSize: 11, color: 'var(--primary)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                    >
                        {g.name}
                    </span>
                ))}
            </div>
        </div>
      </Link>
    </motion.div>
  );
}
