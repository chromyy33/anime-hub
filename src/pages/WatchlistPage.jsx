import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkPlus, Star, Pencil, Trash2 } from 'lucide-react';
import SEO from '../components/SEO';
import WatchlistButton from '../components/WatchlistButton';
import { useWatchlist } from '../context/WatchlistContext';
import styles from './WatchlistPage.module.css';

/** Compact inline rating — no menu round-trip needed.
 *  Unrated: short slider. Rated: value + edit button (tap to re-rate). */
function RowRating({ entry }) {
  const { setUserRating } = useWatchlist();
  const value = entry.userRating ?? 0;
  const [editing, setEditing] = useState(false);

  if (value > 0 && !editing) {
    return (
      <>
        <span className={`${styles.rateVal} ${styles.rated}`}>{value}/10</span>
        <button
          type="button"
          className={styles.rateEdit}
          onClick={() => setEditing(true)}
          title="Edit your rating"
          aria-label={`Edit your rating for ${entry.title}`}
        >
          <Pencil size={12} />
        </button>
      </>
    );
  }

  return (
    <>
      <input
        type="range" min="0" max="10" step="1"
        value={value}
        aria-label={`Rate ${entry.title}`}
        className={styles.rateSlider}
        onChange={e => {
          const v = Number(e.target.value);
          setUserRating(entry.mal_id, v > 0 ? v : null);
          if (v > 0) setEditing(false);
        }}
      />
      <span className={`${styles.rateVal} ${value > 0 ? styles.rated : ''}`}>
        {value > 0 ? `${value}/10` : 'Rate it'}
      </span>
    </>
  );
}

const STATUS_LABELS = {
  watching: 'Watching',
  plan: 'Plan to Watch',
  completed: 'Completed',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'watching', label: 'Watching' },
  { key: 'plan', label: 'Plan to Watch' },
  { key: 'completed', label: 'Completed' },
];

export default function WatchlistPage() {
  const { allEntries, removeFromList, hiddenIds, unhideAnime } = useWatchlist();
  const [filter, setFilter] = useState('all');
  const [pendingRemove, setPendingRemove] = useState(null); // entry awaiting delete confirm

  const counts = useMemo(() => {
    const c = { all: allEntries.length, watching: 0, plan: 0, completed: 0 };
    for (const e of allEntries) {
      if (c[e.status] !== undefined) c[e.status] += 1;
    }
    return c;
  }, [allEntries]);

  const visible = useMemo(() => {
    if (filter === 'hidden') return [...hiddenIds];
    const list = filter === 'all' ? [...allEntries] : allEntries.filter(e => e.status === filter);
    return list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  }, [allEntries, hiddenIds, filter]);

  // Escape closes the confirm dialog.
  useEffect(() => {
    if (!pendingRemove) return;
    const onKey = (e) => { if (e.key === 'Escape') setPendingRemove(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pendingRemove]);

  return (
    <div className={`page-container ${styles.wrap}`}>
      <SEO
        title="Your Watchlist"
        description="All the anime you saved on AniDoc. Update statuses, rate shows, and manage your list."
        url="/watchlist"
      />

      <div className="page-header">
        <h1 className="page-title">
          Your Watchlist
          {counts.all > 0 && <span className={styles.count}>{counts.all} saved</span>}
        </h1>
        <p className="page-subtitle">Everything you saved, in one place. Update statuses or rate shows as you go.</p>
      </div>

      {counts.all === 0 ? (
        <div className={`card ${styles.empty}`}>
          <BookmarkPlus size={48} strokeWidth={1.5} />
          <p className={styles.emptyTitle}>Nothing saved yet</p>
          <p className={styles.emptyText}>
            Tap the bookmark on any anime to save it here, then track Watching, Plan to Watch and Completed.
          </p>
          <Link to="/search" className={`btn-primary ${styles.emptyCta}`}>
            Browse anime
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.filters}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`chip-filter ${filter === f.key ? 'active' : ''}`}
              >
                {f.label} · {counts[f.key]}
              </button>
            ))}
            {hiddenIds.length > 0 && (
              <button
                onClick={() => setFilter(f => f === 'hidden' ? 'all' : 'hidden')}
                className={`chip-filter ${filter === 'hidden' ? 'active' : ''}`}
                title="Titles you marked Not interested — restore any of them here"
              >
                Hidden · {hiddenIds.length}
              </button>
            )}
          </div>

          {filter === 'hidden' ? (
            <div className={styles.list}>
              <p className={styles.hiddenNote}>
                These titles stay out of your recommendations. Changed your mind? Bring any of them back.
              </p>
              {visible.map(h => (
                <div key={h.mal_id} className={`card ${styles.row}`}>
                  {h.image ? (
                    <span className={styles.thumbLink}>
                      <img src={h.image} alt={h.title || 'Hidden title'} className={styles.thumb} loading="lazy" decoding="async" />
                    </span>
                  ) : (
                    <span className={`${styles.thumbLink} ${styles.thumbEmpty}`}>?</span>
                  )}
                  <div className={styles.info}>
                    <span className={styles.statusLine}>Not interested</span>
                    <div className={styles.titleRow}>
                      {h.title ? (
                        <Link to={`/anime/${h.mal_id}`} className={styles.title}>{h.title}</Link>
                      ) : (
                        <span className={styles.title}>Title #{h.mal_id}</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.action}>
                    <span className={styles.actionPair}>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => unhideAnime(h.mal_id)}
                      >
                        Unhide
                      </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className={styles.list}>
            {visible.map(entry => (
              <div key={entry.mal_id} className={`card ${styles.row}`}>
                <Link to={`/anime/${entry.mal_id}`} className={styles.thumbLink}>
                  <img src={entry.image} alt={entry.title} className={styles.thumb} loading="lazy" decoding="async" />
                </Link>
                <div className={styles.info}>
                  <span className={styles.statusLine}>
                    {STATUS_LABELS[entry.status] || 'Plan to Watch'}
                  </span>
                  <div className={styles.titleRow}>
                    <Link to={`/anime/${entry.mal_id}`} className={styles.title}>
                      {entry.title}
                    </Link>
                    {entry.score && (
                      <span className={styles.titleScore}>
                        <Star size={11} fill="var(--primary)" /> {entry.score}
                      </span>
                    )}
                  </div>
                  <div className={styles.rateInline}>
                    <RowRating entry={entry} />
                  </div>
                </div>
                <div className={styles.action}>
                  <span className={styles.actionPair}>
                    <WatchlistButton anime={entry} variant="icon" />
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => setPendingRemove(entry)}
                      title={`Remove ${entry.title} from watchlist`}
                      aria-label={`Remove ${entry.title} from watchlist`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              </div>
            ))}
          </div>
          )}

      {pendingRemove && (
        <div className={styles.modalOverlay} onClick={() => setPendingRemove(null)}>
          <div
            className={styles.modalCard}
            role="alertdialog"
            aria-modal="true"
            aria-label={`Remove ${pendingRemove.title}?`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>Remove from watchlist?</h3>
            <p className={styles.modalText}>
              “{pendingRemove.title}” will leave your list{pendingRemove.userRating ? `, along with your ${pendingRemove.userRating}/10 rating` : ''}. You can always add it back later.
            </p>
            <div className={styles.modalActions}>
              <button type="button" className="btn-ghost" onClick={() => setPendingRemove(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => { removeFromList(pendingRemove.mal_id); setPendingRemove(null); }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
