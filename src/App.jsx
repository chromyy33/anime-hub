import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, PlayCircle, Search, Star, X, Calendar } from 'lucide-react';
import Home from './pages/Home';
import AnimeDetails from './pages/AnimeDetails';
import SearchPage from './pages/SearchPage';
import GenrePage from './pages/GenrePage';
import SchedulePage from './pages/SchedulePage';
import CharacterDetails from './pages/CharacterDetails';

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
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <PlayCircle size={28} color="var(--primary)" />
        <span className="brand-text">AniStream</span>
      </Link>

      {/* Search with 85-15 Split */}
      <div ref={wrapRef} className="navbar-search">
        <form onSubmit={handleSearch} className="flex items-center w-full gap-xs">
          <div className="relative flex items-center" style={{ flex: '0 0 85%' }}>
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
          <button type="submit" className="btn-primary search-submit-btn" style={{ flex: '0 0 15%', height: 42, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <Search size={18} />
          </button>
        </form>

        {/* Dropdown */}
        <AnimatePresence>
          {showDrop && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={{ 
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '85%', 
                background: `linear-gradient(135deg, rgba(16, 185, 129, 0.06), transparent), ${isDark ? '#1a1d24' : '#ffffff'}`, 
                border: '1px solid var(--border-strong)', 
                boxShadow: 'inset 0 0 0 1px var(--glass-border), var(--shadow-lg)', 
                borderRadius: 'var(--radius-md)', zIndex: 200, overflow: 'hidden' 
              }}
            >
              {loadingSug && (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>Searching…</div>
              )}
              {!loadingSug && suggestions.map(anime => (
                <div
                  key={anime.mal_id}
                  onClick={() => pickSuggestion(anime)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', transition: 'background 0.12s', borderBottom: '1px solid var(--border-subtle)' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <img
                    src={anime.images.jpg.image_url}
                    alt={anime.title}
                    style={{ width: 34, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {anime.title_english || anime.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {anime.type || ''} {anime.year ? `· ${anime.year}` : ''}
                    </div>
                  </div>
                  {anime.score && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
                      <Star size={12} fill="var(--primary)" color="var(--primary)" />
                      {anime.score}
                    </div>
                  )}
                </div>
              ))}
              {!loadingSug && suggestions.length > 0 && (
                <button
                  onClick={handleSearch}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface-hover)', border: 'none', borderTop: '1px solid var(--border-subtle)', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}
                >
                  See all results for "{query}" →
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link to="/schedule" className="icon-btn" title="Airing Schedule" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={20} />
        </Link>
        <button 
          className="icon-btn" 
          onClick={() => setIsDark(!isDark)} 
          aria-label="Toggle Theme"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
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
        <main className="app-container">
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/anime/:id"  element={<AnimeDetails />} />
            <Route path="/search"     element={<SearchPage />} />
            <Route path="/genre/:id/:name" element={<GenrePage />} />
            <Route path="/schedule"   element={<SchedulePage />} />
            <Route path="/character/:id" element={<CharacterDetails />} />
          </Routes>
        </main>
        <ToastContainer 
          position="bottom-center"
          autoClose={4000}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={isDark ? "dark" : "light"}
          toastStyle={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            borderRadius: 'var(--radius-md)',
            background: isDark ? 'rgba(30, 34, 41, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(var(--glass-blur))',
            WebkitBackdropFilter: 'blur(var(--glass-blur))',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-primary)',
            boxShadow: 'inset 0 0 0 1px var(--glass-border), var(--shadow-lg)',
            padding: '12px 16px',
            minHeight: 'auto',
            display: 'flex',
            alignItems: 'center'
          }}
          bodyStyle={{
            margin: 0,
            padding: 0,
            flex: 1,
            display: 'flex',
            alignItems: 'center'
          }}
          closeButton={({ closeToast }) => (
            <button 
              onClick={closeToast}
              style={{
                background: 'none', border: 'none', color: 'var(--text-tertiary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px', height: '100%', alignSelf: 'center', marginLeft: 'auto'
              }}
            >
              <X size={14} />
            </button>
          )}
        />
      </div>
    </Router>
  );
}

export default App;
