import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft, X, Download, Star, Film, Mic2, Info, ChevronRight } from 'lucide-react';
import { fetchCached } from '../utils/cache';

// ─── Character Skeleton ──────────────────────────────────────────────
function CharacterSkeleton() {
  return (
    <div style={{ paddingBottom: 60 }} className="skeleton">
      <div style={{ width: 100, height: 20, background: 'var(--bg-surface)', marginBottom: 32, borderRadius: 4 }} />
      <div className="details-layout">
        <div className="details-left">
          <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--bg-surface)', borderRadius: 16 }} />
          <div style={{ height: 120, background: 'var(--bg-surface)', marginTop: 24, borderRadius: 12 }} />
        </div>
        <div style={{ flex: 1, minWidth: 'min(100%, 320px)' }}>
          <div style={{ width: '60%', height: 48, background: 'var(--bg-surface)', marginBottom: 12, borderRadius: 8 }} />
          <div style={{ width: '30%', height: 24, background: 'var(--bg-surface)', marginBottom: 40, borderRadius: 4 }} />
          <div style={{ height: 200, background: 'var(--bg-surface)', marginBottom: 48, borderRadius: 12 }} />
          <div style={{ height: 400, background: 'var(--bg-surface)', borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

export default function CharacterDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [pictures, setPictures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [activeLang, setActiveLang] = useState('Japanese');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [charRes, picRes] = await Promise.all([
          fetchCached(`https://api.jikan.moe/v4/characters/${id}/full`, `char_full_${id}`),
          fetchCached(`https://api.jikan.moe/v4/characters/${id}/pictures`, `char_pics_${id}`)
        ]);
        setData(charRes);
        setPictures(picRes || []);
        
        // Auto-select first available language if Japanese isn't found
        if (charRes?.voices) {
            const langs = [...new Set(charRes.voices.map(v => v.language))];
            if (!langs.includes('Japanese') && langs.length > 0) {
                setActiveLang(langs[0]);
            }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id]);

  const voiceLangs = useMemo(() => {
    if (!data?.voices) return [];
    return [...new Set(data.voices.map(v => v.language))].sort();
  }, [data]);

  const filteredVoices = useMemo(() => {
    if (!data?.voices) return [];
    return data.voices.filter(v => v.language === activeLang);
  }, [data, activeLang]);

  const downloadImage = (url, filename) => {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => window.open(url, '_blank'));
  };

  if (loading) return <CharacterSkeleton />;
  if (!data) return <div className="text-center" style={{ marginTop: 100, color: '#ef4444' }}>Character not found.</div>;

  return (
    <div style={{ paddingBottom: 60 }}>
      <style>
        {`
          .va-tab { transition: all 0.2s; border-bottom: 2px solid transparent; }
          .va-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
          .anime-list::-webkit-scrollbar { width: 4px; }
          .anime-list::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 10px; }
        `}
      </style>

      {/* Back Navigation */}
      <Link to={-1} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', textDecoration: 'none', marginBottom: 32, fontSize: 14, fontWeight: 600 }} className="hover-primary">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="details-layout">
        
        {/* LEFT COLUMN */}
        <div className="details-left">
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-subtle)' }}>
                <img src={data.images?.jpg?.image_url} alt={data.name} style={{ width: '100%', display: 'block', minHeight: 400, background: 'var(--bg-surface)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                        <Heart size={16} color="var(--primary)" fill="var(--primary)"/> 
                        {data.favorites?.toLocaleString() || 0}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="card sidebar-card">
                <p className="card-label">Identification</p>
                <div className="flex-col gap-sm">
                    <div className="info-row">
                        <span className="info-row__label">Native</span>
                        <span className="info-row__value">{data.name_kanji || 'N/A'}</span>
                    </div>
                    {data.nicknames?.length > 0 && (
                        <div className="info-row">
                            <span className="info-row__label">Aliases</span>
                            <span className="info-row__value">{data.nicknames.join(', ')}</span>
                        </div>
                    )}
                </div>

                {pictures.length > 0 && (
                    <button
                        onClick={() => setShowGallery(true)}
                        className="btn-ghost w-full flex-center gap-sm"
                        style={{ marginTop: 20 }}
                    >
                        <Download size={15} /> Download Wallpapers ({pictures.length})
                    </button>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: 1, minWidth: 320 }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 8, letterSpacing: '-1px', lineHeight: 1.1 }}>{data.name}</h1>
                <h2 style={{ fontSize: 18, color: 'var(--text-muted)', fontWeight: 400, marginBottom: 32 }}>{data.name_kanji}</h2>

                <h3 className="section-title">Biography</h3>
                <p style={{ lineHeight: 1.8, color: 'var(--text-main)', fontSize: 16, marginBottom: 48, whiteSpace: 'pre-line' }}>
                    {data.about || "No biography available."}
                </p>

                {/* Animeography - Contained List */}
                <div style={{ marginBottom: 48 }}>
                    <h3 className="section-title">Animeography</h3>
                    <div className="card" style={{ padding: 2, background: 'var(--bg-surface)' }}>
                        <div className="anime-list" style={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 480, overflowY: 'auto' }}>
                            {data.anime?.map((item, idx) => (
                                <Link key={idx} to={`/anime/${item.anime.mal_id}`}
                                    style={{ 
                                        textDecoration: 'none', 
                                        display: 'flex', 
                                        background: 'var(--bg-surface)', 
                                        padding: '12px 16px',
                                        transition: 'background 0.2s',
                                        borderBottom: idx === data.anime.length - 1 ? 'none' : '1px solid var(--border-subtle)'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                                >
                                    <div style={{ width: 56, height: 80, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-base)' }}>
                                        <img src={item.anime.images?.jpg?.image_url} alt={item.anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1, paddingLeft: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.anime.title}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>{item.role}</span>
                                            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border-strong)' }} />
                                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.anime.type}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-tertiary)', opacity: 0.4 }}>
                                        <Film size={14} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Voice Actors with Button-Chip Language Filter */}
                {data.voices?.length > 0 && (
                    <div style={{ marginBottom: 40 }}>
                        <h3 className="section-title" style={{ marginBottom: 16 }}>Voice Actors</h3>
                        
                        <div className="flex flex-wrap gap-sm" style={{ marginBottom: 24 }}>
                            {voiceLangs.map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setActiveLang(lang)}
                                    className={`chip-filter ${activeLang === lang ? 'active' : ''}`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {filteredVoices.map((v, idx) => (
                                <div key={idx} className="card" style={{ display: 'flex', gap: 14, padding: 12, alignItems: 'center' }}>
                                    <img src={v.person.images?.jpg?.image_url} alt={v.person.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border-subtle)' }} />
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.person.name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                            <Mic2 size={12} color="var(--primary)" />
                                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{v.language} Voice Actor</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
      </div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}
                onClick={(e) => { if (e.target === e.currentTarget) setShowGallery(false); }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                        <h2 style={{ color: '#fff', margin: 0, fontSize: 20 }}>Character Wallpapers</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0', fontSize: 13 }}>{pictures.length} HD images available</p>
                    </div>
                    <button onClick={() => setShowGallery(false)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', padding: '8px 16px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <X size={20}/> Close
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 40 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                        {pictures.map((p, i) => (
                            <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: '#111', height: 320 }}>
                                <img src={p.jpg?.large_image_url || p.jpg?.image_url} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                <button
                                    onClick={() => downloadImage(p.jpg?.large_image_url || p.jpg?.image_url, `${data.name.replace(/\s+/g, '-')}-wallpaper-${i+1}.jpg`)}
                                    style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', width: 36, height: 36, borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
