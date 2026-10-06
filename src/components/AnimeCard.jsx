import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { useWatchlist } from '../context/WatchlistContext';
import WatchlistButton from './WatchlistButton';
import styles from './AnimeCard.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] } }),
};

export default function AnimeCard({ anime, index, variant = 'grid', style = {}, className = '' }) {
  const navigate = useNavigate();
  const { isHidden, hideAnime, unhideAnime } = useWatchlist();

  const handleGenreClick = (e, g) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/genre/${g.mal_id}/${g.name.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const handleNotInterested = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!anime?.mal_id) return;
    const title = anime.title_english || anime.title;
    hideAnime(anime.mal_id, { title, image: anime.images?.jpg?.image_url });
    // YouTube-style recovery: immediate Undo, then the Hidden list owns it.
    const id = toast.info(
      <div className={styles.undoToast}>
        <span>Hidden from recommendations</span>
        <button
          className={styles.undoBtn}
          onClick={() => { unhideAnime(anime.mal_id); toast.dismiss(id); }}
        >
          Undo
        </button>
      </div>,
      { autoClose: 6000, closeOnClick: false }
    );
  };

  // Dismissed via "Not interested" — leave no gap.
  if (variant === 'grid' && anime?.mal_id && isHidden(anime.mal_id)) return null;

  // Grid Variant (Used in Search/Home)
  if (variant === 'grid') {
    return (
      <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible" style={style} className={className}>
        <Link to={`/anime/${anime.mal_id}`} className={styles.gridCardLink}>
          
          {/* Quick Add Button */}
          <div className={styles.watchlistBtnWrap}>
            <WatchlistButton anime={anime} variant="icon" />
          </div>

          <div className={styles.cardImgWrap}>
            <img src={anime.images?.jpg?.large_image_url} alt={anime.title} className={styles.cardImg} loading="lazy" decoding="async" />
            {anime.score && (
              <span className={styles.scoreBadge}>
                <Star size={11} fill="var(--primary)" color="var(--primary)" /> {anime.score}
              </span>
            )}
            {anime.type && (
              <span className={styles.typeBadge}>
                {anime.type}
              </span>
            )}
            <button
              onClick={handleNotInterested}
              title="Not interested"
              aria-label={`Not interested in ${anime.title_english || anime.title}`}
              className={styles.notInterestedBtn}
            >
              <EyeOff size={13} />
            </button>
            {anime.synopsis && (
              <div className={styles.cardSynopsis}>
                <p className={styles.cardSynopsisText}>{anime.synopsis}</p>
              </div>
            )}
          </div>
          <div className={styles.gridInfo}>
            <h3 className={styles.gridTitle}>
              {anime.title_english || anime.title}
            </h3>
            <div className={styles.gridMetaRow}>
              <span className={styles.gridMetaYear}>{anime.year || anime.type || 'TBA'}</span>
              {anime.genres?.[0] && (
                <span 
                  onClick={(e) => handleGenreClick(e, anime.genres[0])}
                  className={styles.genreChip}
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
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible" style={style} className={className}>
      <Link to={`/anime/${anime.mal_id}`} className={styles.listCardLink}>
        
        {/* Quick Add Button */}
        <div className={styles.listWatchlistBtnWrap}>
          <WatchlistButton anime={anime} variant="icon" />
        </div>

        <div className={styles.listImgWrap}>
            <img src={anime.images?.jpg?.image_url} alt={anime.title} className={styles.listImg} loading="lazy" decoding="async" />
        </div>
        <div className={styles.listInfo}>
            <div className={styles.listTimeRow}>
                <Clock size={12} color="var(--primary)" />
                <span className={styles.listTime}>
                    {anime.local?.time || anime.broadcast?.time || 'TBA'}
                </span>
                {anime.local && <span className={styles.listTimeMeta}>(Local)</span>}
                {anime.airing === false && <span className={styles.listFinishedBadge}>FINISHED</span>}
            </div>
            <h3 className={styles.listTitle}>
                {anime.title_english || anime.title}
            </h3>
            <div className={styles.listGenreRow}>
                {anime.genres?.slice(0, 3).map(g => (
                    <span 
                      key={g.mal_id} 
                      onClick={(e) => handleGenreClick(e, g)}
                      className={styles.genreChip}
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

