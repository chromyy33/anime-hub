import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import SEO from '../components/SEO';
import AnimeCard from '../components/AnimeCard';

export default function GenrePage() {
  const { id, name } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`https://api.jikan.moe/v4/anime?genres=${id}&order_by=score&sort=desc&limit=24&page=${page}`)
      .then(r => r.json())
      .then(data => {
        setResults(data.data || []);
        setPagination(data.pagination || null);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(() => setLoading(false));
  }, [id, page]);

  const goToPage = (p) => {
    setSearchParams({ page: p });
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      <SEO 
        title={`${name.replace(/-/g, ' ')} Anime`} 
        description={`Explore the best ${name.replace(/-/g, ' ')} anime on AniDoc. Top rated and trending titles in the ${name} genre.`}
        url={`/genre/${id}/${name}`}
      />
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="section-icon" style={{ width: 48, height: 48 }}>
          <LayoutGrid size={24} />
        </div>
        <div>
          <h1 className="page-title" style={{ margin: 0, textTransform: 'capitalize' }}>
            {name.replace(/-/g, ' ')} Anime
          </h1>
          <p className="page-subtitle">
            Exploring the best of {name.replace(/-/g, ' ')}
          </p>
        </div>
      </div>
 
      {/* Grid */}
      {loading ? (
        <div className="grid-list">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card skeleton" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div style={{ paddingTop: '145%' }} />
              <div style={{ padding: 12 }}>
                <div style={{ height: 14, background: 'var(--border-strong)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 12, background: 'var(--border-subtle)', borderRadius: 4, width: '60%' }} />
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
      )}

      {/* Pagination */}
      {pagination && pagination.last_visible_page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 48 }}>
          <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: page <= 1 ? 'var(--text-tertiary)' : 'var(--text-primary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: 14 }}>
            <ChevronLeft size={16} /> Prev
          </button>

          {(() => {
            const total = pagination.last_visible_page;
            const pages = []; const start = Math.max(1, page - 2); const end = Math.min(total, page + 2);
            if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < total) { if (end < total - 1) pages.push('...'); pages.push(total); }
            return pages.map((p, i) => p === '...' ? (
              <span key={`e-${i}`} style={{ padding: '0 6px', color: 'var(--text-tertiary)', fontSize: 14 }}>…</span>
            ) : (
              <button key={p} onClick={() => goToPage(p)}
                style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', border: '1px solid', borderColor: p === page ? 'var(--primary)' : 'var(--border-subtle)', background: p === page ? 'var(--primary)' : 'var(--bg-surface)', color: p === page ? '#fff' : 'var(--text-primary)', fontWeight: p === page ? 700 : 400, cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }}>
                {p}
              </button>
            ));
          })()}

          <button onClick={() => goToPage(page + 1)} disabled={!pagination.has_next_page}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: !pagination.has_next_page ? 'var(--text-tertiary)' : 'var(--text-primary)', cursor: !pagination.has_next_page ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: 14 }}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
