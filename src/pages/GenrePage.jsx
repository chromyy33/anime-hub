import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import SEO from '../components/SEO';
import AnimeCard from '../components/AnimeCard';
import { searchAnime } from '../utils/anilist';
import styles from './GenrePage.module.css';

export default function GenrePage() {
  const { id, name } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const genreName = name
    ? name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : (isNaN(Number(id)) ? id : 'Action');

  useEffect(() => {
    setError(null);
    setLoading(true);
    let cancelled = false;

    searchAnime({
      genre: genreName,
      sort: 'SCORE_DESC',
      page,
      perPage: 24
    })
      .then(data => {
        if (!cancelled) {
          setResults(data.results || []);
          setPagination(data.pagination || null);
          setLoading(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load results.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [genreName, page]);

  const goToPage = (p) => {
    setSearchParams({ page: p });
  };

  return (
    <div className={styles.wrap}>
      <SEO 
        title={`${name.replace(/-/g, ' ')} Anime`} 
        description={`Explore the best ${name.replace(/-/g, ' ')} anime on AniDoc. Top rated and trending titles in the ${name.replace(/-/g, ' ')} genre.`}
        url={`/genre/${id}/${name}`}
      />
      {/* Header */}
      <div className={`page-header ${styles.headerRow}`}>
        <div className={`section-icon ${styles.headerIcon}`}>
          <LayoutGrid size={24} />
        </div>
        <div>
          <h1 className={`page-title ${styles.title}`}>
            {name.replace(/-/g, ' ')} Anime
          </h1>
          <p className="page-subtitle">
            Exploring the best of {name.replace(/-/g, ' ')}
          </p>
        </div>
      </div>
 
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Grid */}
      {!error && (loading ? (
        <div className="grid-list">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`card skeleton ${styles.skeletonCard}`}>
              <div className={styles.skeletonMedia} />
              <div className={styles.skeletonBody}>
                <div className={styles.skeletonBar} />
                <div className={styles.skeletonBarShort} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-list">
          {results.map((anime, idx) => (
            <AnimeCard key={anime.mal_id} anime={anime} index={idx} />
          ))}
        </div>
      ))}

      {/* Pagination */}
      {pagination && pagination.last_visible_page > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => goToPage(page - 1)} disabled={page <= 1} aria-label="Previous page"
            className={styles.pageBtn}>
            <ChevronLeft size={16} /> Prev
          </button>

          {(() => {
            const total = pagination.last_visible_page;
            const pages = []; const start = Math.max(1, page - 2); const end = Math.min(total, page + 2);
            if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < total) { if (end < total - 1) pages.push('...'); pages.push(total); }
            return pages.map((p, i) => p === '...' ? (
              <span key={`e-${i}`} className={styles.ellipsis}>…</span>
            ) : (
              <button key={p} onClick={() => goToPage(p)} aria-label={`Go to page ${p}`}
                className={`${styles.pageNum} ${p === page ? styles.active : ''}`}>
                {p}
              </button>
            ));
          })()}

          <button onClick={() => goToPage(page + 1)} disabled={!pagination.has_next_page} aria-label="Next page"
            className={styles.pageBtn}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
