import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft, Star, Film, Mic2, Info, ChevronRight, Download } from 'lucide-react';
import { fetchCharacterDetails } from '../utils/anilist';
import SEO from '../components/SEO';
import GalleryModal from '../components/GalleryModal';
import styles from './CharacterDetails.module.css';

// ─── Character Skeleton ──────────────────────────────────────────────
function CharacterSkeleton() {
  return (
    <div className={`page-container ${styles.wrap}`}>
      <div className={`skeleton ${styles.skelBack} ${styles.skelItem}`} />
      <div className="details-layout">
        <div className="details-left">
          <div className={`skeleton ${styles.skelPoster} ${styles.skelItem}`} />
          <div className={`skeleton ${styles.skelStats} ${styles.skelItem}`} />
        </div>
        <div className={styles.colMain}>
          <div className={`skeleton ${styles.skelTitle} ${styles.skelItem}`} />
          <div className={`skeleton ${styles.skelSub} ${styles.skelItem}`} />
          <div className={`skeleton ${styles.skelBlock} ${styles.skelItem}`} />
          <div className={`skeleton ${styles.skelBlockLg} ${styles.skelItem}`} />
        </div>
      </div>
    </div>
  );
}

export default function CharacterDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [pictures, setPictures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [activeLang, setActiveLang] = useState('Japanese');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchCharacterDetails(id);
        if (cancelled) return;
        if (res && res.character) {
          setData(res.character);
          setPictures(res.pictures || []);
          
          if (res.character.voices && res.character.voices.length > 0) {
            const langs = [...new Set(res.character.voices.map(v => v.language))];
            if (!langs.includes('Japanese')) {
              setActiveLang(langs[0]);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [id]);

  const voiceLangs = useMemo(() => {
    if (!data?.voices) return [];
    return [...new Set(data.voices.map(v => v.language))].sort();
  }, [data]);

  const filteredVoices = useMemo(() => {
    if (!data?.voices) return [];
    return data.voices.filter(v => v.language === activeLang);
  }, [data, activeLang]);


  const seoSchema = useMemo(() => data ? {
    "@context": "https://schema.org",
    "@type": "Thing",
    "name": data.name,
    "description": data.about,
    "image": data.images?.jpg?.image_url
  } : null, [data]);

  if (loading) return <CharacterSkeleton />;
  if (!data) return <div className={`text-center ${styles.notFound}`}>We couldn't find that character.</div>;

  return (
    <div className={`page-container ${styles.wrap}`}>
      <SEO 
        title={data ? data.name : 'Loading...'} 
        description={data?.about?.slice(0, 160)}
        image={data?.images?.jpg?.image_url}
        url={`/character/${id}`}
        type="profile"
        schema={seoSchema}
      />

      {/* Back Navigation */}
      <button
        onClick={() => navigate(-1)}
        className={styles.backBtn}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="details-layout">
        
        {/* LEFT COLUMN */}
        <div className="details-left">
            <div className={styles.posterWrap}>
                <img src={data.images?.jpg?.image_url} alt={data.name} className={styles.posterImg} />
                <div className={styles.posterOverlay}>
                    <div className={styles.posterFav}>
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
                        className={`btn-ghost w-full flex-center gap-sm ${styles.statsBtn}`}
                    >
                        <Download size={15} /> Download Wallpapers ({pictures.length})
                    </button>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.colMain}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className={styles.nameTitle}>{data.name}</h1>
                <h2 className={styles.nameSub}>{data.name_kanji}</h2>

                <h3 className="section-title">Biography</h3>
                <p className={styles.bio}>
                    {data.about || "No biography added for this character yet."}
                </p>

                {/* Animeography - Contained List */}
                <div className={styles.sectionGap}>
                    <h3 className="section-title">Animeography</h3>
                    <div className={`card ${styles.listShell}`}>
                        <div className={`anime-list ${styles.animeList}`}>
                            {data.anime?.map((item) => (
                                <Link key={item.anime.mal_id} to={`/anime/${item.anime.mal_id}`}
                                    className={styles.animeRow}
                                >
                                    <div className={styles.animeThumb}>
                                        <img src={item.anime.images?.jpg?.image_url} alt={item.anime.title} className={styles.animeThumbImg} loading="lazy" decoding="async" />
                                    </div>
                                    <div className={styles.animeInfo}>
                                        <div className={styles.animeTitle}>{item.anime.title}</div>
                                        <div className={styles.animeMeta}>
                                            <span className={styles.animeRole}>{item.role}</span>
                                            <span className={styles.animeDot} />
                                            <span className={styles.animeType}>{item.anime.type}</span>
                                        </div>
                                    </div>
                                    <div className={styles.animeExt}>
                                        <Film size={14} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Voice Actors with Button-Chip Language Filter */}
                {data.voices?.length > 0 && (
                    <div className={styles.vaSectionGap}>
                        <h3 className={`section-title ${styles.vaTitle}`}>Voice Actors</h3>
                        
                        <div className={`flex flex-wrap gap-sm ${styles.langRow}`}>
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

                        <div className={styles.vaGrid}>
                            {filteredVoices.map((v) => (
                                <div key={v.person.mal_id} className={`card ${styles.vaCard}`}>
                                    <img src={v.person.images?.jpg?.image_url} alt={v.person.name} className={styles.vaImg} loading="lazy" decoding="async" />
                                    <div className={styles.vaInfo}>
                                        <div className={styles.vaName}>{v.person.name}</div>
                                        <div className={styles.vaLang}>
                                            <Mic2 size={12} color="var(--primary)" />
                                            <span>{v.language} Voice Actor</span>
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

      <GalleryModal 
        show={showGallery} 
        onClose={() => setShowGallery(false)} 
        images={pictures}
        title="Character Wallpapers"
        filenamePrefix={data.name.replace(/\s+/g, '-')}
      />
    </div>
  );
}
