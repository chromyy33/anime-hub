import { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle2, Trash2, LayoutGrid } from 'lucide-react';

const LS_KEY = 'animehub_watchlist';
const WatchlistContext = createContext(null);

function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState(loadWatchlist);

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
    toast.success("Added to watchlist", {
      icon: <CheckCircle2 size={18} color="var(--primary)" />
    });
  }, []);

  const removeFromList = useCallback((malId) => {
    let title = 'Anime';
    setWatchlist(prev => {
      title = prev[malId]?.title || 'Anime';
      const next = { ...prev };
      delete next[malId];
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    toast.info("Removed from list", {
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
    toast.success("Status updated", {
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

  const getEntry = useCallback((malId) => watchlist[malId] || null, [watchlist]);
  const isInList = useCallback((malId) => !!watchlist[malId], [watchlist]);
  const allEntries = Object.values(watchlist);

  return (
    <WatchlistContext.Provider value={{ watchlist, allEntries, addToList, removeFromList, setStatus, setUserRating, getEntry, isInList }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return ctx;
}
