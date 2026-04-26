import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Calendar, Star, Play, Sword, Heart, Trophy, BookOpen, ChevronLeft, ChevronRight, LayoutGrid, Zap } from 'lucide-react';
import AnimeCard from '../components/AnimeCard';
import Carousel from '../components/Carousel';
import { fetchCached, sleep } from '../utils/cache';
import { useWatchlist } from '../context/WatchlistContext';
import WatchlistButton from '../components/WatchlistButton';
import SEO from '../components/SEO';

// ─── Framer-motion variants ────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] } }),
};

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
    <div style={{ position: 'relative', height: 480, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* BG crossfade */}
      <AnimatePresence mode="sync">
        <motion.img key={`bg-${anime.mal_id}`} src={anime.images.jpg.large_image_url} alt=""
          variants={bgVariants} initial="enter" animate="center" exit="exit"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
        />
      </AnimatePresence>

      {/* Gradient Overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.45) 45%, rgba(2,6,23,0) 100%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)', opacity: 0.6 }} />

      {/* Hero Content Distribution */}
      <AnimatePresence mode="wait">
        <motion.div key={`hero-${anime.mal_id}`} initial="hidden" animate="visible" exit="exit" style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
          
          {/* Top: Chips */}
          <motion.div variants={textVariants} initial="enter" animate="center" exit="exit"
            style={{ position: 'absolute', top: 24, left: 24, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
          >
            <span style={{ background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 1.6s ease-in-out infinite' }} />
              AIRING NOW
            </span>
            {anime.genres?.slice(0, 2).map(g => (
              <Link key={g.mal_id} to={`/genre/${g.mal_id}/${g.name.toLowerCase().replace(/\s+/g, '-')}`} className="badge" style={{ fontSize: 11, transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                {g.name}
              </Link>
            ))}
          </motion.div>

          {/* Bottom: Main Text */}
          <motion.div variants={textVariants} initial="enter" animate="center" exit="exit"
            className="hero-content"
            style={{ position: 'absolute', bottom: 40, left: 24, right: 24 }}
          >
            <div style={{ color: '#fff' }}>
              <Link to={`/anime/${anime.mal_id}`} style={{ textDecoration: 'none', color: '#fff' }}>
                <h1 style={{ color: '#fff' }}>
                  {anime.title_english || anime.title}
                </h1>
              </Link>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, marginBottom: 24, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {anime.synopsis}
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Link to={`/anime/${anime.mal_id}`} className="btn-primary" style={{ textDecoration: 'none' }}>
                  <Play size={14} fill="currentColor" /> View Details
                </Link>
                {anime.score ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                    <Star size={12} fill="var(--primary)" color="var(--primary)" />
                    <strong style={{ color: '#fff' }}>{anime.score}</strong>
                    <span style={{ opacity: 0.55 }}>· #{anime.rank}</span>
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
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
          className="slider-btn"
          style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 10, ...style }}
        >
          <Icon size={22} />
        </button>
      ))}

      {/* Dot nav */}
      <div style={{ position: 'absolute', bottom: 20, right: 28, zIndex: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
        {slides.map((slide, i) => (
          <button key={slide.mal_id} onClick={() => setActive(i)}
            style={{ width: i === active ? 24 : 8, height: 8, borderRadius: 99, border: 'none', cursor: 'pointer', transition: 'all 0.3s', background: i === active ? 'var(--primary)' : 'rgba(255,255,255,0.35)', padding: 0 }}
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
      className="flex items-end justify-between gap-md" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
      <div className="flex items-center gap-md">
        <div className="section-icon">
          <Icon size={18} color="var(--primary)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 className="text-lg font-bold" style={{ margin: 0, lineHeight: 1.2 }}>{title}</h2>
          {subtitle && <p className="text-sm" style={{ margin: 0, opacity: 0.8, color: 'var(--text-tertiary)' }}>{subtitle}</p>}
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
        <div key={i} className="skeleton" style={{ flex: '0 0 200px', height: 300, borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', opacity: 0.6 }} />
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
  const { allEntries, isInList, removeFromList } = useWatchlist();

  // 1. Initial data load
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const seenIds = new Set();
        const dedupeSection = (arr) => {
          if (!arr) return [];
          return arr.filter(item => {
            if (seenIds.has(item.mal_id)) return false;
            seenIds.add(item.mal_id);
            return true;
          });
        };

        const updateSection = (key, data) => {
          if (!cancelled) {
            setData(prev => ({ ...prev, [key]: dedupeSection(data) }));
          }
        };

        const airingRaw = await fetchCached('https://api.jikan.moe/v4/top/anime?filter=airing&limit=15', 'home_airing');
        updateSection('airing', airingRaw);
        await sleep(400);

        const upcomingRaw = await fetchCached('https://api.jikan.moe/v4/top/anime?filter=upcoming&limit=15', 'home_upcoming');
        updateSection('upcoming', upcomingRaw);
        await sleep(400);

        const topRaw = await fetchCached('https://api.jikan.moe/v4/top/anime?limit=15', 'home_top');
        updateSection('top', topRaw);
        await sleep(400);

        const moviesRaw = await fetchCached('https://api.jikan.moe/v4/top/anime?type=movie&limit=15', 'home_movies');
        updateSection('movies', moviesRaw);
        await sleep(400);

        const actionRaw = await fetchCached('https://api.jikan.moe/v4/anime?genres=1&order_by=score&sort=desc&limit=15', 'home_action');
        updateSection('action', actionRaw);
        await sleep(400);

        const romanceRaw = await fetchCached('https://api.jikan.moe/v4/anime?genres=22&order_by=score&sort=desc&limit=15', 'home_romance');
        updateSection('romance', romanceRaw);

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) { setErrorMsg(err.message); setLoading(false); }
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
            
            const recRes = await fetchCached(`https://api.jikan.moe/v4/anime/${primary.mal_id}/recommendations`, `home_recs_${primary.mal_id}`);
            const rawList = recRes?.filter(r => r?.entry).slice(0, 12) || [];
            
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

            const enrichedList = [];
            for (const rec of rawList) {
                if (displayedIds.has(rec.entry.mal_id)) continue;
                if (enrichedList.length >= 8) break;

                try {
                    const fullData = await fetchCached(`https://api.jikan.moe/v4/anime/${rec.entry.mal_id}`, `anime_full_${rec.entry.mal_id}`);
                    if (fullData) enrichedList.push(fullData);
                    await sleep(400); 
                } catch (e) {
                    enrichedList.push({
                        mal_id: rec.entry.mal_id,
                        title: rec.entry.title,
                        images: rec.entry.images,
                    });
                }
            }

            setData(prev => ({ ...prev, recommended: enrichedList, recSource: primary.title }));
        } catch (err) {
            console.error('Failed to load recommendations', err);
        } finally {
            setLoadingRecs(false);
        }
    };
    loadRecs();
  }, [allEntries, data.recommended.length, loading, data.airing, data.upcoming, data.top, data.movies, data.action, data.romance]);


  if (errorMsg) return (
    <div style={{ textAlign: 'center', marginTop: 100, color: '#ef4444', fontWeight: 600 }}>{errorMsg}</div>
  );

  return (
    <div className="page-container" style={{ paddingBottom: 0 }}>
      <SEO 
        title="Your Ultimate Anime Hub" 
        description="Discover, track, and manage your anime watchlist with AniDoc. Explore the latest airing shows and get smart recommendations." 
        url="/"
      />

      {/* ── FRAMER MOTION HERO SLIDER ── */}
      {data.airing.length > 0
        ? <HeroSlider slides={data.airing.slice(0, 6)} />
        : loading && <div style={{ height: 480, borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }} className="skeleton" />
      }

      {/* ── YOUR WATCHLIST ── (only if user has items) */}
      {allEntries.length > 0 && (
        <section>
          <SectionHeader Icon={BookOpen} title="Your Watchlist" subtitle={`${allEntries.length} anime saved`} />
          <Carousel
            items={allEntries}
            renderItem={(entry, idx) => (
              <motion.div
                key={entry.mal_id} custom={idx} variants={fadeUp} initial="hidden" animate="visible"
                style={{ flex: '0 0 200px', width: 200, flexShrink: 0, scrollSnapAlign: 'start', position: 'relative' }}
              >
                {/* Quick-delete button */}
                <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 150 }}>
                  <WatchlistButton anime={entry} variant="dots" />
                </div>

                <Link to={`/anime/${entry.mal_id}`} className="card-interactive" style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="card-img-wrap">
                    <img src={entry.image} alt={entry.title} className="card-img" />
                    {entry.score && (
                      <span className="badge" style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid var(--badge-border)', color: '#fff', fontSize: 12, gap: 4, height: 28, padding: '0 10px', display: 'flex', alignItems: 'center' }}>
                        <Star size={11} fill="var(--primary)" color="var(--primary)" /> {entry.score}
                      </span>
                    )}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      zIndex: 10, display: 'flex'
                    }}>
                      <WatchlistButton anime={entry} variant="badge" />
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {entry.userRating
                        ? <span style={{ fontSize: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3 }}><Star size={11} fill="var(--primary)" /> {entry.userRating}/10</span>
                        : <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No rating yet</span>
                      }
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}
          />
        </section>
      )}
      
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
                renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} style={{ flex: '0 0 200px', width: 200, flexShrink: 0, scrollSnapAlign: 'start' }} />} 
            />
          )}
        </section>
      )}

      {/* ── TOP AIRING ── */}
      <section>
        {data.airing.length === 0 && loading ? <SkeletonRow /> : data.airing.length > 0 && (
          <>
            <SectionHeader Icon={TrendingUp} title="Top Airing Right Now" subtitle="The hottest shows currently on air" linkTo="/search?filter=airing" />
            <Carousel items={data.airing} renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} style={{ flex: '0 0 200px', width: 200, flexShrink: 0, scrollSnapAlign: 'start' }} />} />
          </>
        )}
      </section>

      {/* ── TOP MOVIES ── */}
      <section>
        {data.movies.length === 0 && loading ? <SkeletonRow /> : data.movies.length > 0 && (
          <>
            <SectionHeader Icon={Star} title="Must-Watch Movies" subtitle="The greatest anime films ever made" />
            <Carousel items={data.movies} renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} style={{ flex: '0 0 200px', width: 200, flexShrink: 0, scrollSnapAlign: 'start' }} />} />
          </>
        )}
      </section>

      {/* ── ACTION & ADVENTURE ── */}
      <section>
        {data.action.length === 0 && loading ? <SkeletonRow /> : data.action.length > 0 && (
          <>
            <SectionHeader Icon={Zap} title="Action & Adventure" subtitle="High-octane fights and epic journeys" />
            <Carousel items={data.action} renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} style={{ flex: '0 0 200px', width: 200, flexShrink: 0, scrollSnapAlign: 'start' }} />} />
          </>
        )}
      </section>

      {/* ── ROMANCE ── */}
      <section>
        {data.romance.length === 0 && loading ? <SkeletonRow /> : data.romance.length > 0 && (
          <>
            <SectionHeader Icon={Heart} title="Romance" subtitle="Love stories that will make you feel things" />
            <Carousel items={data.romance} renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} style={{ flex: '0 0 200px', width: 200, flexShrink: 0, scrollSnapAlign: 'start' }} />} />
          </>
        )}
      </section>

      {/* ── ANTICIPATED ── */}
      <section>
        {data.upcoming.length === 0 && loading ? <SkeletonRow /> : data.upcoming.length > 0 && (
          <>
            <SectionHeader Icon={Calendar} title="Anticipated Next Season" subtitle="Coming soon — save them to your watchlist" />
            <Carousel items={data.upcoming} renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} style={{ flex: '0 0 200px', width: 200, flexShrink: 0, scrollSnapAlign: 'start' }} />} />
          </>
        )}
      </section>

      {/* ── ALL-TIME CLASSICS ── */}
      <section>
        {data.top.length === 0 && loading ? <SkeletonRow /> : data.top.length > 0 && (
          <>
            <SectionHeader Icon={Trophy} title="All-Time Classics" subtitle="The highest-rated anime of all time" linkTo="/search?filter=top" />
            <Carousel items={data.top} renderItem={(a, i) => <AnimeCard key={a.mal_id} anime={a} index={i} style={{ flex: '0 0 200px', width: 200, flexShrink: 0, scrollSnapAlign: 'start' }} />} />
          </>
        )}
      </section>
    </div>
  );
}
