import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Calendar, Star, Play, Heart, Trophy, ChevronLeft, ChevronRight, LayoutGrid, Zap } from 'lucide-react';
import AnimeCard from '../components/AnimeCard';
import Carousel from '../components/Carousel';
import { fetchHomeData, fetchAnimeDetails } from '../utils/anilist';
import { useWatchlist } from '../context/WatchlistContext';
import SEO from '../components/SEO';
import styles from './Home.module.css';

const sectionVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

// ─── Framer Motion hero slider ─────────────────────────────────────────
const bgVariants = {
  enter:  { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.9, ease: 'easeOut' } },
  exit:   { opacity: 0, transition: { duration: 0.45, ease: 'easeIn' } },
};
const textVariants = {
  enter:  { opacity: 0, y: 22 },
  center: { opacity: 1, y: 0, transition: { duration: 0.55, delay: 0.2, ease: [0.4, 0, 0.2, 1] } },
  exit:   { opacity: 0, y: -10, transition: { duration: 0.25 } },
};

function HeroSlider({ slides }) {
  const [active, setActive] = useState(0);
  const total = slides.length;
  const next = useCallback(() => setActive(i => (i + 1) % total), [total]);
  const prev = useCallback(() => setActive(i => (i - 1 + total) % total), [total]);

  useEffect(() => {
    const t = setTimeout(next, 6000);
    return () => clearTimeout(t);
  }, [active, next]);

  const anime = slides[active];

  return (
    <div className={styles.hero}>
      {/* BG crossfade */}
      <AnimatePresence mode="sync">
        <motion.img key={`bg-${anime.mal_id}`} src={anime.images.jpg.large_image_url} alt=""
          variants={bgVariants} initial="enter" animate="center" exit="exit"
          className={styles.heroBg}
        />
      </AnimatePresence>

      {/* Gradient Overlays */}
      <div className={styles.heroShadeBottom} />
      <div className={styles.heroShadeTop} />

      {/* Hero Content Distribution */}
      <AnimatePresence mode="wait">
        <motion.div key={`hero-${anime.mal_id}`} initial="hidden" animate="visible" exit="exit" className={styles.heroFrame}>
          
          {/* Top: Chips */}
          <motion.div variants={textVariants} initial="enter" animate="center" exit="exit"
            className={styles.heroChips}
          >
            <span className={styles.heroLive}>
              <span className={styles.heroLiveDot} />
              AIRING NOW
            </span>
            {anime.genres?.slice(0, 2).map(g => (
              <Link key={g.mal_id} to={`/genre/${g.mal_id}/${g.name.toLowerCase().replace(/\s+/g, '-')}`} className={`badge ${styles.heroGenre}`}>
                {g.name}
              </Link>
            ))}
          </motion.div>

          {/* Bottom: Main Text */}
          <motion.div variants={textVariants} initial="enter" animate="center" exit="exit"
            className={`hero-content ${styles.heroMain}`}
          >
            <div className={styles.heroText}>
              <Link to={`/anime/${anime.mal_id}`} className={styles.heroTitleLink}>
                <h1 className={styles.heroTitle}>
                  {anime.title_english || anime.title}
                </h1>
              </Link>
              <p className={styles.heroSynopsis}>
                {anime.synopsis}
              </p>
              <div className={styles.heroActions}>
                <Link to={`/anime/${anime.mal_id}`} className={`btn-primary ${styles.heroCta}`}>
                  <Play size={14} fill="currentColor" /> View Details
                </Link>
                {anime.score ? (
                  <span className={styles.heroScore}>
                    <Star size={12} fill="var(--primary)" color="var(--primary)" />
                    <strong className={styles.heroScoreVal}>{anime.score}</strong>
                    {anime.rank && (
                      <span className={styles.heroScoreRank}>· #{anime.rank}</span>
                    )}
                  </span>
                ) : (
                  <span className={styles.heroNoScore}>
                    <Star size={12} color="rgba(255,255,255,0.3)" />
                    <span>No rating yet</span>
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next */}
      {[{ dir: 'prev', onClick: prev, style: { left: 10 }, Icon: ChevronLeft },
        { dir: 'next', onClick: next, style: { right: 10 }, Icon: ChevronRight }].map(({ dir, onClick, style, Icon }) => (
        <button key={dir} onClick={onClick}
          className={`slider-btn ${styles.heroArrow}`}
          style={style}
        >
          <Icon size={22} />
        </button>
      ))}

      {/* Dot nav */}
      <div className={styles.heroDots}>
        {slides.map((slide, i) => (
          <button key={slide.mal_id} onClick={() => setActive(i)}
            className={`${styles.heroDot} ${i === active ? styles.active : ''}`}
          />
        ))}
      </div>
    </div>
  );
}


// ─── Section Header ────────────────────────────────────────────────────
function SectionHeader({ Icon, title, subtitle, linkTo }) {
  return (
    <motion.div variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
      className={`flex items-end justify-between gap-md ${styles.sectionHead}`}>
      <div className="flex items-center gap-md">
        <div className="section-icon">
          <Icon size={18} color="var(--primary)" />
        </div>
        <div className={styles.sectionHeadText}>
          <h2 className={`text-lg font-bold ${styles.sectionHeadTitle}`}>{title}</h2>
          {subtitle && <p className={`text-sm ${styles.sectionHeadSub}`}>{subtitle}</p>}
        </div>
      </div>
      {linkTo && (
        <Link to={linkTo} className="text-sm font-semibold text-accent no-underline">View all →</Link>
      )}
    </motion.div>
  );
}

// ─── Skeleton loader ───────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex gap-md overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`skeleton ${styles.skeletonItem}`} />
      ))}
    </div>
  );
}

// ─── Home ──────────────────────────────────────────────────────────────
export default function Home() {
  const [data, setData] = useState({ airing: [], upcoming: [], top: [], movies: [], action: [], romance: [], recommended: [] });
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { allEntries, hiddenIds } = useWatchlist();

  // 1. Initial data load
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const homeData = await fetchHomeData();
        if (!cancelled) {
          setData(prev => ({
            ...prev,
            airing: homeData.airing || [],
            upcoming: homeData.upcoming || [],
            top: homeData.top || [],
            movies: homeData.movies || [],
            action: homeData.action || [],
            romance: homeData.romance || []
          }));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.message || 'Failed to load anime data');
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // 2. Fetch Smart Recommendations based on Watchlist
  useEffect(() => {
    if (allEntries.length === 0 || data.recommended.length > 0 || loading) return;

    const loadRecs = async () => {
      setLoadingRecs(true);
      try {
        const sorted = [...allEntries].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
        const primary = sorted.find(a => a.status === 'watching') || sorted[0];
        
        const details = await fetchAnimeDetails(primary.mal_id);
        const rawList = (details?.recommendations || []).map(r => r.entry).filter(Boolean);
        
        // Collect all IDs currently shown in other sections to filter them out
        const displayedIds = new Set([
          ...data.airing.map(a => a.mal_id),
          ...data.upcoming.map(a => a.mal_id),
          ...data.top.map(a => a.mal_id),
          ...data.movies.map(a => a.mal_id),
          ...data.action.map(a => a.mal_id),
          ...data.romance.map(a => a.mal_id),
          ...allEntries.map(a => a.mal_id)
        ]);

        const filtered = rawList.filter(item => !displayedIds.has(item.mal_id) && !hiddenIds.some(h => h.mal_id === item.mal_id)).slice(0, 10);
        setData(prev => ({ ...prev, recommended: filtered, recSource: primary.title }));
      } catch (err) {
        console.error('Failed to load recommendations', err);
      } finally {
        setLoadingRecs(false);
      }
    };
    loadRecs();
  }, [allEntries, hiddenIds, data.recommended.length, loading, data.airing, data.upcoming, data.top, data.movies, data.action, data.romance]);


  if (errorMsg) return (
    <div className={styles.loadError}>{errorMsg}</div>
  );

  return (
    <div className={`page-container ${styles.pageWrap}`}>
      <SEO 
        title="Your Ultimate Anime Hub" 
        description="Discover, track, and manage your anime watchlist with AniDoc. Explore the latest airing shows and get smart recommendations." 
        url="/"
      />

      {/* ── FRAMER MOTION HERO SLIDER ── */}
      {data.airing.length > 0
        ? <HeroSlider slides={data.airing.slice(0, 6)} />
        : loading && <div className={`skeleton ${styles.heroSkeleton}`} />
      }

      {/* ── SMART RECOMMENDATIONS ── */}
      {(loadingRecs || data.recommended.length > 0) && (
        <section>
          <SectionHeader 
            Icon={LayoutGrid} 
            title="Just For You" 
            subtitle={data.recSource ? `Based on your interest in ${data.recSource}` : "Recommended for you"} 
          />
          {loadingRecs ? (
            <SkeletonRow />
          ) : (
            <Carousel 
                items={data.recommended} 
                renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} />} 
            />
          )}
        </section>
      )}

      {/* ── TOP AIRING ── */}
      <section>
        {data.airing.length === 0 && loading ? <SkeletonRow /> : data.airing.length > 0 && (
          <>
            <SectionHeader Icon={TrendingUp} title="Top Airing Right Now" subtitle="The hottest shows currently on air" linkTo="/search?filter=airing" />
            <Carousel items={data.airing} renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} />} />
          </>
        )}
      </section>

      {/* ── TOP MOVIES ── */}
      <section>
        {data.movies.length === 0 && loading ? <SkeletonRow /> : data.movies.length > 0 && (
          <>
            <SectionHeader Icon={Star} title="Must-Watch Movies" subtitle="The greatest anime films ever made" />
            <Carousel items={data.movies} renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} />} />
          </>
        )}
      </section>

      {/* ── ACTION & ADVENTURE ── */}
      <section>
        {data.action.length === 0 && loading ? <SkeletonRow /> : data.action.length > 0 && (
          <>
            <SectionHeader Icon={Zap} title="Action & Adventure" subtitle="High-octane fights and epic journeys" />
            <Carousel items={data.action} renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} />} />
          </>
        )}
      </section>

      {/* ── ROMANCE ── */}
      <section>
        {data.romance.length === 0 && loading ? <SkeletonRow /> : data.romance.length > 0 && (
          <>
            <SectionHeader Icon={Heart} title="Romance" subtitle="Love stories that will make you feel things" />
            <Carousel items={data.romance} renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} />} />
          </>
        )}
      </section>

      {/* ── ANTICIPATED ── */}
      <section>
        {data.upcoming.length === 0 && loading ? <SkeletonRow /> : data.upcoming.length > 0 && (
          <>
            <SectionHeader Icon={Calendar} title="Anticipated Next Season" subtitle="Coming soon — save them to your watchlist" />
            <Carousel items={data.upcoming} renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} />} />
          </>
        )}
      </section>

      {/* ── ALL-TIME CLASSICS ── */}
      <section>
        {data.top.length === 0 && loading ? <SkeletonRow /> : data.top.length > 0 && (
          <>
            <SectionHeader Icon={Trophy} title="All-Time Classics" subtitle="The highest-rated anime of all time" linkTo="/search?filter=top" />
            <Carousel items={data.top} renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} />} />
          </>
        )}
      </section>
    </div>
  );
}
