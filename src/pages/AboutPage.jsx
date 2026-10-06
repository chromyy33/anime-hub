import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, BookmarkPlus, Calendar, Users, Database, Sparkles, ArrowUpRight, ListChecks, Clock, Layers } from 'lucide-react';
import SEO from '../components/SEO';
import { fetchHomeData } from '../utils/anilist';
import styles from './AboutPage.module.css';

const BELIEFS = [
  {
    Icon: ListChecks,
    title: 'Your list, your rules',
    text: 'Watching, Plan to Watch, Completed — plus your own ratings. No accounts, no sync maze, no ads in the way.',
  },
  {
    Icon: Clock,
    title: 'Timing matters',
    text: 'Episodes drop on a schedule. Everything here is converted to your local time so you never do timezone math.',
  },
  {
    Icon: Layers,
    title: 'Depth over noise',
    text: 'Characters, voice actors, theme songs, trailers, relations — the context that turns watching into understanding.',
  },
];

const FEATURES = [
  {
    Icon: Compass,
    title: 'Discover',
    text: 'Top airing shows, must-watch movies, genre rails and recommendations tuned to what you already saved.',
  },
  {
    Icon: BookmarkPlus,
    title: 'Track',
    text: 'Bookmark anything in one tap, move it between statuses, rate it when you finish — all offline-first in your browser.',
  },
  {
    Icon: Calendar,
    title: 'Never miss an episode',
    text: 'The weekly airing calendar in your timezone, exportable to your own calendar as an .ics file.',
  },
  {
    Icon: Users,
    title: 'Go deeper',
    text: 'Full character and voice-actor pages, opening and ending themes, episode guides and related media.',
  },
];

export default function AboutPage() {
  const [posters, setPosters] = useState([]);
  const [postersLoading, setPostersLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchHomeData()
      .then(d => {
        if (!cancelled) {
          setPosters((d.top || []).slice(0, 10));
          setPostersLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setPostersLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={`page-container ${styles.wrap}`}>
      <SEO
        title="About AniDoc"
        description="AniDoc is a fan-built anime tracker: discover shows, keep a watchlist, and follow the airing schedule in your timezone."
        url="/about"
      />

      {/* ── Hero: customer first ── */}
      <div className={styles.hero}>
        <span className={styles.eyebrow}>
          <Sparkles size={13} /> About AniDoc
        </span>
        <h1 className={styles.heroTitle}>
          Never lose track of a <span className={styles.heroTitleAccent}>story you love</span>.
        </h1>
        <p className={styles.heroLede}>
          AniDoc is a home for your anime life — the shows you are watching, the ones
          you keep meaning to start, and the episodes airing this week. Built by a fan,
          for fans who have ever asked “wait, which episode am I on?”
        </p>
        <div className={styles.heroCtas}>
          <Link to="/search" className={`btn-primary ${styles.heroCta}`}>
            Browse anime
          </Link>
          <Link to="/schedule" className={`btn-ghost ${styles.heroCta}`}>
            Check the schedule
          </Link>
        </div>
      </div>

      {/* ── Beliefs ── */}
      <div className={styles.beliefs}>
        {BELIEFS.map(({ Icon, title, text }) => (
          <div key={title} className={`card ${styles.belief}`}>
            <p className={styles.beliefTitle}>
              <Icon size={18} color="var(--primary)" /> {title}
            </p>
            <p className={styles.beliefText}>{text}</p>
          </div>
        ))}
      </div>

      {/* ── Live poster marquee: top-rated shows, straight from the API ── */}
      {(postersLoading || posters.length > 0) && (
        <div className={styles.stripWrap}>
          <p className={styles.stripLabel}>Top-rated shows fans track here</p>
          {postersLoading ? (
            <div className={styles.stripSkelRow}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`skeleton ${styles.stripSkel}`} />
              ))}
            </div>
          ) : (
            <div className={styles.stripViewport}>
              <div className={styles.stripTrack}>
                {/* Duplicated set: -50% loop point lands exactly on the seam. */}
                {[0, 1].map(copy => (
                  <div key={copy} className={styles.stripSet} aria-hidden={copy === 1}>
                    {posters.map(a => (
                      <Link
                        key={`${a.mal_id}-${copy}`}
                        to={`/anime/${a.mal_id}`}
                        className={styles.posterLink}
                        title={a.title_english || a.title}
                        tabIndex={copy === 1 ? -1 : undefined}
                      >
                        <img
                          src={a.images?.jpg?.image_url}
                          alt={copy === 0 ? (a.title_english || a.title) : ''}
                          className={styles.posterImg}
                          loading="lazy"
                          decoding="async"
                        />
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Story + facts ── */}
      <h2 className="section-title">
        <span className="section-icon"><Database size={18} color="var(--primary)" /></span>
        Why it exists
      </h2>
      <div className={styles.storyGrid}>
        <div className={styles.storyBody}>
          <p style={{ margin: 0 }}>
            Tracking anime used to mean scattered notes, half-remembered episode counts,
            and timezone conversions done by hand every season. <strong>AniDoc started as
            an attempt to put all of that in one calm place</strong> — your list, your
            ratings, and the schedule, designed to stay out of the way of the shows
            themselves.
          </p>
          <p style={{ margin: 0 }}>
            It is an independent, fan-built project: designed and coded by{' '}
            <strong>chromyy33</strong>, co-coded with Google's Antigravity, with show
            data from open anime databases. There are no accounts to create and nothing
            to subscribe to — your watchlist lives in your browser, and it is yours.
          </p>
        </div>
        <div className={`card ${styles.factsCard}`}>
          <p className="card-label">At a glance</p>
          <div className={styles.factRow}>
            <span className="text-muted">Built by</span>
            <a href="https://github.com/chromyy33" target="_blank" rel="noreferrer" className={styles.factLink}>
              chromyy33 <ArrowUpRight size={12} />
            </a>
          </div>
          <div className={styles.factRow}>
            <span className="text-muted">Co-coded with</span>
            <a href="https://antigravity.google/" target="_blank" rel="noreferrer" className={styles.factLink}>
              Antigravity <ArrowUpRight size={12} />
            </a>
          </div>
          <div className={styles.factRow}>
            <span className="text-muted">Show data</span>
            <a href="https://anilist.co/" target="_blank" rel="noreferrer" className={styles.factLink}>
              AniList API <ArrowUpRight size={12} />
            </a>
          </div>
          <div className={styles.factRow}>
            <span className="text-muted">Icons</span>
            <a href="https://lucide.dev/" target="_blank" rel="noreferrer" className={styles.factLink}>
              Lucide <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* ── What it does ── */}
      <h2 className="section-title">
        <span className="section-icon"><Compass size={18} color="var(--primary)" /></span>
        What you can do here
      </h2>
      <div className={styles.featureGrid}>
        {FEATURES.map(({ Icon, title, text }) => (
          <div key={title} className={`card ${styles.featureCard}`}>
            <p className={styles.featureTitle}>
              <Icon size={18} color="var(--primary)" /> {title}
            </p>
            <p className={styles.featureText}>{text}</p>
          </div>
        ))}
      </div>

      {/* ── Honest data note ── */}
      <p className={styles.dataNote}>
        Titles, artwork, scores and schedules come from open anime databases
        (see <a href="https://anilist.co/" target="_blank" rel="noreferrer">AniList</a>).
        Everything shown belongs to its respective creators and licensors — AniDoc
        just keeps your place in it.
      </p>

      {/* ── CTA ── */}
      <div className={`card ${styles.ctaBand}`}>
        <div>
          <p className={styles.ctaTitle}>Find your next obsession.</p>
          <p className={styles.ctaText}>Thousands of shows, one search bar, zero commitment.</p>
        </div>
        <div className={styles.heroCtas}>
          <Link to="/search" className={`btn-primary ${styles.heroCta}`}>
            Start browsing
          </Link>
          <Link to="/watchlist" className={`btn-ghost ${styles.heroCta}`}>
            Open your watchlist
          </Link>
        </div>
      </div>
    </div>
  );
}
