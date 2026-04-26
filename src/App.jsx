import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Search, Calendar, Moon, Sun, X, ArrowLeft, ArrowRight,
  Filter, Play, Star, Clock, BookmarkPlus, ChevronDown, Check, ExternalLink,
  Menu, TrendingUp, Zap
} from 'lucide-react';
import Home from './pages/Home';
import AnimeDetails from './pages/AnimeDetails';
import SearchPage from './pages/SearchPage';
import GenrePage from './pages/GenrePage';
import SchedulePage from './pages/SchedulePage';
import CharacterDetails from './pages/CharacterDetails';
import Footer from './components/Footer';
import { fetchCached } from './utils/cache';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Navbar({ isDark, setIsDark }) {
  const navigate = useNavigate();
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop,    setShowDrop]    = useState(false);
  const [loadingSug,  setLoadingSug]  = useState(false);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [animeOfDay, setAnimeOfDay] = useState(null);

  // Fetch Anime of the Day
  useEffect(() => {
    const fetchAOD = async () => {
      try {
        const randomPage = Math.floor(Math.random() * 4) + 1;
        const data = await fetchCached(`https://api.jikan.moe/v4/top/anime?page=${randomPage}`, `top_page_${randomPage}`);
        // fetchCached already returns the .data array for Jikan endpoints
        if (Array.isArray(data) && data.length > 0) {
          const random = data[Math.floor(Math.random() * data.length)];
          setAnimeOfDay(random);
        }
      } catch (err) { console.error("AOD fetch failed", err); }
    };
    fetchAOD();
  }, []);

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
    debounceRef.current = setTimeout(() => {
      setLoadingSug(true);
      fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query.trim())}&limit=6`)
        .then(r => r.json())
        .then(data => {
          setSuggestions(data.data || []);
          setShowDrop(true);
          setLoadingSug(false);
        })
        .catch(() => setLoadingSug(false));
    }, 350);
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
      <nav className="navbar">
      <Link to="/" className="nav-brand" onClick={() => setMobileOpen(false)}>
        <Sparkles size={28} color="var(--primary)" fill="var(--primary)" />
        <span className="brand-text">AniDoc</span>
      </Link>

      <div ref={wrapRef} className="navbar-search">
        <form onSubmit={handleSearch} className="flex items-center w-full gap-xs">
          <div className="relative flex items-center" style={{ flex: '1' }}>
            <Search size={16} color="var(--text-tertiary)" className="search-icon-fixed" />
            <input
              type="text"
              className="search-input"
              placeholder="Search anime..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDrop(true)}
              style={{ paddingLeft: 40, height: 42, borderRadius: 'var(--radius-sm)', width: '100%', transition: 'all 0.1s', fontSize: '13px' }}
              autoComplete="off"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setSuggestions([]); setShowDrop(false); }} className="search-clear-btn" style={{ right: 12 }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button 
            type="submit" 
            className="btn-primary desktop-only" 
            style={{ 
              height: 42, 
              width: 42, 
              borderRadius: 'var(--radius-sm)', 
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Search size={18} />
          </button>
        </form>

        <AnimatePresence>
          {showDrop && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
              style={{ 
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', 
                background: `linear-gradient(135deg, rgba(16, 185, 129, 0.06), transparent), ${isDark ? '#1a1d24' : '#ffffff'}`, 
                border: '1px solid var(--border-strong)', 
                boxShadow: 'inset 0 0 0 1px var(--glass-border), var(--shadow-lg)', 
                borderRadius: 'var(--radius-md)', zIndex: 200, overflow: 'hidden' 
              }}
            >
              {!loadingSug && suggestions.map(anime => (
                <div key={anime.mal_id} onClick={() => pickSuggestion(anime)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <img src={anime.images.jpg.image_url} alt="" style={{ width: 34, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{anime.title_english || anime.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{anime.type} {anime.year ? `· ${anime.year}` : ''}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Navigation */}
      <div className="desktop-only" style={{ alignItems: 'center', gap: 10 }}>
        <Link to="/schedule" className="icon-btn" title="Airing Schedule">
          <Calendar size={20} />
        </Link>
        <button className="icon-btn" onClick={() => setIsDark(!isDark)}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Mobile Toggle */}
      <div className="mobile-only">
        <button className="icon-btn" onClick={() => setMobileOpen(!mobileOpen)} style={{ zIndex: 1100 }}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

    </nav>

    {/* Mobile Menu Backdrop */}
    <AnimatePresence>
      {mobileOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1999, backdropFilter: 'blur(4px)' }}
        />
      )}
    </AnimatePresence>

    {/* Mobile Menu Overlay - Side Drawer */}
    <AnimatePresence>
      {mobileOpen && (
        <motion.div 
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="mobile-menu-overlay"
        >
          {/* Menu Header - Just Close Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <button className="icon-btn" onClick={() => setMobileOpen(false)} style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-strong)' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Link to="/schedule" className="mobile-menu-item" onClick={() => setMobileOpen(false)}>
              <Calendar size={18} color="var(--primary)" />
              Schedule
            </Link>
            <Link to="/" className="mobile-menu-item" onClick={() => { setMobileOpen(false); window.scrollTo({ top: 800, behavior: 'smooth' }); }}>
              <TrendingUp size={18} color="var(--primary)" />
              Top Airing
            </Link>
            <Link to="/search" className="mobile-menu-item" onClick={() => setMobileOpen(false)}>
              <Search size={18} color="var(--primary)" />
              Browse All
            </Link>
          </div>

          {animeOfDay && (
            <div style={{ marginTop: 24 }}>
              <div className="menu-section-title">Anime of the Day</div>
              <Link 
                to={`/anime/${animeOfDay.mal_id}`} 
                onClick={() => setMobileOpen(false)}
                style={{ 
                  display: 'block', textDecoration: 'none', 
                  background: 'var(--bg-surface-active)',
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <div style={{ height: 120, position: 'relative' }}>
                  <img src={animeOfDay.images.jpg.large_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }} />
                  <div style={{ position: 'absolute', bottom: 8, left: 12, right: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>Trending Now</div>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {animeOfDay.title_english || animeOfDay.title}
                    </div>
                  </div>
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#fff', backdropFilter: 'blur(4px)' }}>
                    <Star size={10} fill="var(--primary)" color="var(--primary)" />
                    {animeOfDay.score}
                  </div>
                </div>
                <div style={{ padding: 12 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {animeOfDay.synopsis}
                  </p>
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
                    <span>Rank #{animeOfDay.rank}</span>
                    <span>·</span>
                    <span>{animeOfDay.type}</span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          <div style={{ marginTop: 'auto', padding: '20px 0', borderTop: '1px solid var(--border-subtle)' }}>
            <button 
              onClick={() => setIsDark(!isDark)}
              style={{ 
                width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', 
                background: 'var(--bg-surface-hover)', border: '1px solid var(--border-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <div style={{ width: 40, height: 20, borderRadius: 20, background: isDark ? 'var(--primary)' : 'var(--border-strong)', position: 'relative' }}>
                 <div style={{ position: 'absolute', top: 2, left: isDark ? 22 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('animehub_theme', JSON.stringify(isDark));
  }, [isDark]);

  return (
    <Router>
      <ScrollToTop />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar isDark={isDark} setIsDark={setIsDark} />
        <main className="app-container" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/anime/:id"  element={<AnimeDetails />} />
            <Route path="/search"     element={<SearchPage />} />
            <Route path="/genre/:id/:name" element={<GenrePage />} />
            <Route path="/schedule"   element={<SchedulePage />} />
            <Route path="/character/:id" element={<CharacterDetails />} />
          </Routes>
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
