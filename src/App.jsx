import { useState, useEffect, useRef, useCallback, memo, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Search, Calendar, Moon, Sun, X,
  Star, Clock, Menu, TrendingUp, Bookmark
} from 'lucide-react';
// Route-split: each page loads on demand instead of bloating the initial bundle.
const Home = lazy(() => import('./pages/Home'));
const AnimeDetails = lazy(() => import('./pages/AnimeDetails'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const GenrePage = lazy(() => import('./pages/GenrePage'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const CharacterDetails = lazy(() => import('./pages/CharacterDetails'));
const DesignSystemPage = lazy(() => import('./design-system'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
import Footer from './components/Footer';
import { fetchSuggestions, fetchAnimeOfDay } from './utils/anilist';
import { useWatchlist } from './context/WatchlistContext';
import styles from './components/Navbar.module.css';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ─── Mobile Menu Component (Memoized) ──────────────────────────────────
const MobileMenu = memo(({ open, onClose, animeOfDay, isDark, setIsDark }) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className={styles.mobileMenuBackdrop}
          />
          <motion.div 
            key="drawer"
            initial={{ x: '100vw' }} animate={{ x: 0 }} exit={{ x: '100vw' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className={styles.mobileMenuDrawer}
          >
            <div className={styles.mobileMenuHeader}>
              <button className={`icon-btn ${styles.mobileMenuCloseBtn}`} onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.mobileMenuItemsContainer}>
              <Link to="/schedule" className={styles.mobileMenuItem} onClick={onClose}>
                <Calendar size={18} color="var(--primary)" />
                Schedule
              </Link>
              <Link to="/watchlist" className={styles.mobileMenuItem} onClick={onClose}>
                <Bookmark size={18} color="var(--primary)" />
                Watchlist
              </Link>
              <Link to="/" className={styles.mobileMenuItem} onClick={onClose}>
                <TrendingUp size={18} color="var(--primary)" />
                Top Airing
              </Link>
              <Link to="/search" className={styles.mobileMenuItem} onClick={onClose}>
                <Search size={18} color="var(--primary)" />
                Browse All
              </Link>
            </div>

            {animeOfDay && (
              <div className={styles.aodSection}>
                <div className={styles.aodSectionTitle}>Anime of the Day</div>
                <Link to={`/anime/${animeOfDay.mal_id}`} onClick={onClose} className={styles.aodCard}>
                  <div className={styles.aodHero}>
                    <img src={animeOfDay.images.jpg.large_image_url} alt="" className={styles.aodHeroImg} />
                    <div className={styles.aodHeroOverlay} />
                    <div className={styles.aodHeroContent}>
                      <div className={styles.aodHeroTag}>Trending Now</div>
                      <div className={styles.aodHeroTitle}>
                        {animeOfDay.title_english || animeOfDay.title}
                      </div>
                    </div>
                    <div className={styles.aodBadge}>
                      <Star size={10} fill="var(--primary)" color="var(--primary)" />
                      {animeOfDay.score}
                    </div>
                  </div>
                  <div className={styles.aodBody}>
                    <p className={styles.aodSynopsis}>
                      {animeOfDay.synopsis}
                    </p>
                    <div className={styles.aodMeta}>
                      <span>Rank #{animeOfDay.rank}</span>
                      <span>·</span>
                      <span>{animeOfDay.type}</span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            <div className={styles.themeToggleContainer}>
              <button onClick={() => setIsDark(!isDark)} className={styles.themeToggleButton}>
                <div className={styles.themeToggleLeft}>
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
                <div className={`${styles.themeSwitchTrack} ${isDark ? styles.themeSwitchTrackActive : ''}`}>
                   <div className={`${styles.themeSwitchThumb} ${isDark ? styles.themeSwitchThumbActive : ''}`} />
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

MobileMenu.displayName = 'MobileMenu';

function Navbar({ isDark, setIsDark, setMobileOpen, mobileOpen }) {
  const navigate = useNavigate();
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop,    setShowDrop]    = useState(false);
  const [loadingSug,  setLoadingSug]  = useState(false);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);
  const { allEntries } = useWatchlist();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced auto-suggest
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setSuggestions([]); setShowDrop(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingSug(true);
      try {
        const list = await fetchSuggestions(query.trim());
        setSuggestions(list || []);
        setShowDrop(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSug(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowDrop(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  const pickSuggestion = (anime) => {
    setShowDrop(false);
    setQuery('');
    navigate(`/anime/${anime.mal_id}`);
  };

  return (
    <>
      <nav className={styles.navbar}>
      <Link to="/" className={styles.navBrand} onClick={() => setMobileOpen(false)}>
        <Sparkles size={28} color="var(--primary)" fill="var(--primary)" />
        <span className={styles.brandText}>AniDoc</span>
      </Link>

      <div ref={wrapRef} className={styles.navbarSearch}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInputContainer}>
            <Search size={16} color="var(--text-tertiary)" className={styles.searchIconFixed} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search anime..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDrop(true)}
              autoComplete="off"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setSuggestions([]); setShowDrop(false); }} className={styles.searchClearBtn}>
                <X size={14} />
              </button>
            )}
          </div>
          <button 
            type="submit" 
            className={`btn-primary ${styles.desktopOnly} ${styles.searchSubmitBtn}`}
          >
            <Search size={18} />
          </button>
        </form>

        <AnimatePresence>
          {showDrop && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
              className={styles.searchDropdownMenu}
            >
              {!loadingSug && suggestions.map(anime => (
                <div key={anime.mal_id} onClick={() => pickSuggestion(anime)} className={styles.searchSuggestionItem}>
                  <img src={anime.images.jpg.image_url} alt="" className={styles.searchSuggestionImg} />
                  <div className={styles.searchSuggestionTextWrap}>
                    <div className={styles.searchSuggestionTitle}>{anime.title_english || anime.title}</div>
                    <div className={styles.searchSuggestionMeta}>{anime.type} {anime.year ? `· ${anime.year}` : ''}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Navigation */}
      <div className={`${styles.desktopOnly} ${styles.desktopNavGroup}`}>
        <Link to="/watchlist" className={`icon-btn ${styles.navIconBtn}`} title="Your Watchlist">
          <Bookmark size={20} />
          {allEntries.length > 0 && (
            <span className={styles.navBadge}>{allEntries.length > 99 ? '99+' : allEntries.length}</span>
          )}
        </Link>
        <Link to="/schedule" className="icon-btn" title="Airing Schedule">
          <Calendar size={20} />
        </Link>
        <button className="icon-btn" onClick={() => setIsDark(!isDark)}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Mobile Toggle */}
      <div className={styles.mobileOnly}>
        <button className={`icon-btn ${styles.menuToggle}`} onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

    </nav>
    </>
  );
}


// Global Scroll to Top logic
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('animehub_theme');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [animeOfDay, setAnimeOfDay] = useState(null);

  const handleMenuClose = useCallback(() => setMobileOpen(false), []);

  // Fetch Anime of the Day
  useEffect(() => {
    const fetchAOD = async () => {
      try {
        const stored = localStorage.getItem('animehub_aod');
        if (stored) {
          const { anime, expiry } = JSON.parse(stored);
          if (Date.now() < expiry) {
            setAnimeOfDay(anime);
            return;
          }
        }

        const random = await fetchAnimeOfDay();
        if (random) {
          localStorage.setItem('animehub_aod', JSON.stringify({
            anime: random,
            expiry: Date.now() + 24 * 60 * 60 * 1000
          }));
          setAnimeOfDay(random);
        }
      } catch (err) { console.error("AOD fetch failed", err); }
    };
    fetchAOD();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('animehub_theme', JSON.stringify(isDark));
  }, [isDark]);

  return (
    <Router>
      <ScrollToTop />
      <div className="app-shell">
        <Navbar isDark={isDark} setIsDark={setIsDark} setMobileOpen={setMobileOpen} mobileOpen={mobileOpen} />
        <MobileMenu 
          open={mobileOpen}
          onClose={handleMenuClose}
          animeOfDay={animeOfDay}
          isDark={isDark}
          setIsDark={setIsDark}
        />
        <main className="app-container app-main">
          <Suspense fallback={<div className="skeleton route-fallback" />}>
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/anime/:id"  element={<AnimeDetails />} />
            <Route path="/search"     element={<SearchPage />} />
            <Route path="/genre/:id/:name" element={<GenrePage />} />
            <Route path="/schedule"   element={<SchedulePage />} />
            <Route path="/watchlist"   element={<WatchlistPage />} />
            <Route path="/character/:id" element={<CharacterDetails />} />
            <Route path="/design-system" element={<DesignSystemPage />} />
          </Routes>
          </Suspense>
          <Footer />
        </main>
        <ToastContainer 
          position="bottom-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={isDark ? "dark" : "light"}
        />
      </div>
    </Router>
  );
}

export default App;
