import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle2, Trash2, LayoutGrid } from 'lucide-react';

const LS_KEY = 'animehub_watchlist';
const HIDDEN_KEY = 'animehub_hidden';
const WatchlistContext = createContext(null);

function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}

function loadHidden() {
  try {
    const raw = JSON.parse(localStorage.getItem(HIDDEN_KEY)) || [];
    // Migrate legacy number-arrays to entry objects.
    return raw.map(h => typeof h === 'number' ? { mal_id: h } : h);
  } catch { return []; }
}

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState(loadWatchlist);
  const [hiddenIds, setHiddenIds] = useState(loadHidden);

  const addToList = useCallback((anime, status = 'plan') => {
    const entry = {
      mal_id: anime.mal_id,
      title: anime.title_english || anime.title,
      image: anime.images?.jpg?.image_url,
      score: anime.score,
      status,
      userRating: null,
      addedAt: Date.now(),
    };
    setWatchlist(prev => {
      const next = { ...prev, [anime.mal_id]: entry };
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    toast.success("Saved to your watchlist", {
      icon: <CheckCircle2 size={18} color="var(--primary)" />
    });
  }, []);

  const removeFromList = useCallback((malId) => {
    setWatchlist(prev => {
      const next = { ...prev };
      delete next[malId];
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    toast.info("Removed from your watchlist", {
      icon: <Trash2 size={18} color="var(--primary)" />
    });
  }, []);

  const setStatus = useCallback((malId, status) => {
    setWatchlist(prev => {
      if (!prev[malId]) return prev;
      const next = { ...prev, [malId]: { ...prev[malId], status } };
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    toast.success("Watchlist updated", {
      icon: <LayoutGrid size={18} color="var(--primary)" />
    });
  }, []);

  const setUserRating = useCallback((malId, rating) => {
    setWatchlist(prev => {
      if (!prev[malId]) return prev;
      const next = { ...prev, [malId]: { ...prev[malId], userRating: rating } };
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === LS_KEY) setWatchlist(JSON.parse(e.newValue) || {});
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const getEntry = useCallback((malId) => watchlist[malId] || null, [watchlist]);
  const isInList = useCallback((malId) => !!watchlist[malId], [watchlist]);
  const allEntries = useMemo(() => Object.values(watchlist), [watchlist]);

  // "Not interested" dismissals — hidden from discovery surfaces, persisted.
  // Stored as entry objects so the Hidden list can show titles/posters.
  // YouTube buries recovery in My Activity; we surface it: an Undo toast
  // on dismiss plus a visible Hidden list on the watchlist page.
  const isHidden = useCallback((malId) => hiddenIds.some(h => h.mal_id === malId), [hiddenIds]);
  const hideAnime = useCallback((malId, meta = {}) => {
    setHiddenIds(prev => {
      if (prev.some(h => h.mal_id === malId)) return prev;
      const next = [...prev, { mal_id: malId, title: meta.title, image: meta.image }];
      try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const unhideAnime = useCallback((malId) => {
    setHiddenIds(prev => {
      if (!prev.some(h => h.mal_id === malId)) return prev;
      const next = prev.filter(h => h.mal_id !== malId);
      try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Memoized: unrelated parent renders (theme toggle, menu) must not
  // cascade into every card on the page through a fresh object identity.
  const value = useMemo(() => ({
    watchlist, allEntries, addToList, removeFromList,
    setStatus, setUserRating, getEntry, isInList,
    hiddenIds, isHidden, hideAnime, unhideAnime,
  }), [watchlist, allEntries, addToList, removeFromList, setStatus, setUserRating, getEntry, isInList, hiddenIds, isHidden, hideAnime, unhideAnime]);

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return ctx;
}
