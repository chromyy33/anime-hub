import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Users, Heart, Trophy, Tv, Calendar, Clock, Film, ExternalLink, PlaySquare, ArrowUpRight, Download, Image as ImageIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import Carousel from '../components/Carousel';
import SEO from '../components/SEO';
import WatchlistButton from '../components/WatchlistButton';
import AnimeCard from '../components/AnimeCard';
import GalleryModal from '../components/GalleryModal';
import { fetchAnimeDetails } from '../utils/anilist';
import styles from './AnimeDetails.module.css';

function DetailsSkeleton() {
  return (
    <div className={`page-container ${styles.skelWrap}`}>
      <div className={`skeleton ${styles.skelBack}`} />
      <div className="details-layout">
        <div className="details-left">
          <div className={`skeleton ${styles.skelPoster}`} />
          <div className={`skeleton ${styles.skelStats}`} />
        </div>
        <div className={styles.skelCol}>
          <div className={`skeleton ${styles.skelTitle}`} />
          <div className={`skeleton ${styles.skelSub}`} />
          <div className={`skeleton ${styles.skelBody}`} />
        </div>
      </div>
    </div>
  );
}

export default function AnimeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [staff, setStaff] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [pictures, setPictures] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [relatedDetails, setRelatedDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAnimeDetails(id);
        if (cancelled) return;
        if (!result || !result.anime) {
          setError("Anime not found.");
          setLoading(false);
          return;
        }
        setAnime(result.anime);
        setCharacters(result.characters || []);
        setRecommendations(result.recommendations || []);
        setPictures(result.pictures || []);
        setReviews(result.reviews || []);
        setRelatedDetails(result.relatedDetails || {});
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load anime metadata. Please try again.");
          setLoading(false);
        }
      }
    };
    loadData();
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [id]);

  const getLocalTime = (broadcast) => {
    if (!broadcast || !broadcast.time || !broadcast.day) return null;
    try {
      const days = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
      const dayIdx = days.indexOf(broadcast.day);
      if (dayIdx === -1) return null;

      const [h, m] = broadcast.time.split(':').map(Number);
      let utcH = h - 9;
      let utcDayOffset = 0;
      if (utcH < 0) { utcH += 24; utcDayOffset = -1; }

      const localOffsetMin = -new Date().getTimezoneOffset();
      const localOffsetH = Math.floor(localOffsetMin / 60);
      const localOffsetM = localOffsetMin % 60;

      let localH = utcH + localOffsetH;
      let localM = m + localOffsetM;
      if (localM >= 60) { localM -= 60; localH += 1; }
      if (localM < 0) { localM += 60; localH -= 1; }
      
      let finalDayOffset = utcDayOffset;
      if (localH >= 24) { localH -= 24; finalDayOffset += 1; }
      if (localH < 0) { localH += 24; finalDayOffset -= 1; }

      const finalDayIdx = (dayIdx + finalDayOffset + 7) % 7;
      const finalDay = days[finalDayIdx];
      const finalTime = `${localH.toString().padStart(2, '0')}:${localM.toString().padStart(2, '0')}`;
      
      return { day: finalDay, time: finalTime };
    } catch (e) { return null; }
  };

  const localAiring = getLocalTime(anime?.broadcast);

  const formatRating = (rating) => {
      if (!rating) return 'N/A';
      if (rating.startsWith('R - 17+')) return 'R17+';
      if (rating.startsWith('R+')) return 'R+';
      const short = rating.split(' - ')[0];
      return short || rating;
  }


  const seoSchema = useMemo(() => anime ? {
    "@context": "https://schema.org",
    "@type": anime.type === 'Movie' ? 'Movie' : 'TVSeries',
    "name": anime.title_english || anime.title,
    "alternateName": anime.title,
    "description": anime.synopsis,
    "image": anime.images?.jpg?.large_image_url,
    "genre": anime.genres?.map(g => g.name),
    "numberOfEpisodes": anime.episodes,
    "aggregateRating": anime.score ? {
      "@type": "AggregateRating",
      "ratingValue": anime.score,
      "bestRating": "10",
      "ratingCount": anime.scored_by || 0
    } : undefined
  } : null, [anime]);

  if (loading) return <DetailsSkeleton />;
  if (error && !anime) return <div className={`text-center ${styles.loadError}`}>{error}</div>;

  return (
    <div className="page-container">
      <SEO 
        title={anime ? (anime.title_english || anime.title) : 'Loading...'} 
        description={anime?.synopsis?.slice(0, 160)}
        image={anime?.images?.jpg?.large_image_url}
        url={`/anime/${id}`}
        type="video.tv_show"
        schema={seoSchema}
      />
      
      {/* Back Navigation */}
      <button 
        onClick={() => navigate(-1)}
        className={styles.backBtn}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* MOBILE HEADER: Shown only on mobile < 768px */}
      <div className="mobile-title-block">
        <div className={`badge-container ${styles.mobileBadges}`}>
          {anime.genres?.slice(0, 3).map(g => (
            <span key={g.mal_id} className="badge">{g.name}</span>
          ))}
          {anime.status === 'Currently Airing' && (
            <span className={styles.mobilePill}>
              <Calendar size={12} />
              AIRING: {localAiring ? `${localAiring.day} at ${localAiring.time}` : anime.broadcast.string}
            </span>
          )}
        </div>

        <div className={styles.mobileTitleCol}>
          <h1 className={styles.mobileTitle}>
            {anime.title_english || anime.title}
          </h1>
        </div>

        <div className={styles.mobileCta}>
          <WatchlistButton anime={anime} variant="minimal" />
        </div>
      </div>
      {/* TWO COLUMN LAYOUT */}
      <div className="details-layout">
        
        {/* ============================================================== */}
        {/* LEFT COLUMN: Poster, Stats, Info, Links, Themes */}
        {/* ============================================================== */}
        <div className="details-left">
          {/* Poster & Main Stats */}
          <div className={styles.posterCard}>
              <img 
                src={anime.images.jpg.large_image_url} 
                alt={anime.title} 
                className={styles.posterImg}
              />
              <div className={styles.posterOverlay}>
                  <div className={styles.posterStat}><Star size={16} color="var(--primary)"/> {anime.score || 'N/A'}</div>
                  <div className={styles.posterStat}><Trophy size={16} color="var(--primary)"/> #{anime.rank || 'N/A'}</div>
              </div>
          </div>

          {/* Quick Stats Grid */}
          <div className={`card sidebar-card ${styles.statsGap}`}>
            <p className="card-label">Stats</p>
            <div className="flex-col gap-sm">
              {[
                { icon: Users, label: 'Members', value: anime.members?.toLocaleString() || 'N/A' },
                { icon: Heart, label: 'Favorites', value: anime.favorites?.toLocaleString() || 'N/A' },
                { icon: Tv,    label: 'Type',     value: anime.type || 'N/A' },
                { icon: Film,  label: 'Episodes', value: anime.episodes || 'Unknown' },
                { icon: Calendar, label: 'Status', value: anime.status || 'N/A' },
                { icon: Clock, label: 'Duration', value: anime.duration || 'N/A' },
              ].map((stat, i) => (
                <div key={i} className="flex-between">
                  <div className="flex items-center gap-sm text-muted text-sm">
                    <stat.icon size={14} color="var(--text-tertiary)" />
                    {stat.label}
                  </div>
                  <span className="font-semibold text-sm text-primary">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Detailed Info */}
          <div className="card sidebar-card">
            <p className="card-label">Information</p>
            <div className="flex-col gap-sm">
              <div className="info-row">
                <span className="info-row__label">Aired</span>
                <span className="info-row__value">{anime.aired?.string}</span>
              </div>
              {anime.broadcast?.time && (
                <div className="info-row">
                  <span className="info-row__label">Broadcast</span>
                  <span className="info-row__value">{localAiring ? `${localAiring.day} at ${localAiring.time}` : anime.broadcast.string}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-row__label">Studios</span>
                <span className="info-row__value">{anime.studios?.map(s => s.name).join(', ') || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">Source</span>
                <span className="info-row__value">{anime.source}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">Rating</span>
                <span className="info-row__value">{formatRating(anime.rating)}</span>
              </div>
            </div>
            {pictures && pictures.length > 0 && (
                <button onClick={() => setShowGallery(true)} className={`btn-ghost w-full flex-center gap-sm ${styles.dlBtn}`}>
                    <Download size={15} /> Download Wallpapers ({pictures.length})
                </button>
            )}
          </div>

          {/* Streaming & Links */}
          {(anime.streaming?.length > 0 || anime.external?.length > 0) && (
             <div className={`card ${styles.linksCard}`}>
                {anime.streaming?.length > 0 && (
                    <div className={anime.external?.length > 0 ? styles.linksGroup : styles.linksGroupFlush}>
                        <h4 className={styles.linksTitle}>Available On</h4>
                        <div className={styles.linksRow}>
                        {anime.streaming.map((stream, idx) => (
                            <a key={idx} href={stream.url} target="_blank" rel="noreferrer" className={`badge ${styles.linkChip}`}
                            >
                                <PlaySquare size={14} className={styles.linkIconDim} />
                                {stream.name}
                                <ArrowUpRight size={12} className={styles.linkIconFaint} />
                            </a>
                        ))}
                        </div>
                    </div>
                )}
                {anime.external?.length > 0 && (
                    <div>
                        <h4 className={styles.linksTitle}>External Links</h4>
                        <div className={styles.linksRow}>
                        {anime.external.map((ext, idx) => (
                            <a key={idx} href={ext.url} target="_blank" rel="noreferrer" className={`badge ${styles.linkChip}`}
                            >
                                {ext.name}
                                <ExternalLink size={13} className={styles.linkIconMid} />
                            </a>
                        ))}
                        </div>
                    </div>
                )}
             </div>
          )}

          {/* Theme Songs */}
          {anime.theme && (anime.theme.openings?.length > 0 || anime.theme.endings?.length > 0) && (
              <div className={`card ${styles.themesCard}`}>
                  <h4 className={styles.themesTitle}>Theme Songs</h4>
                  <div className={styles.themesCol}>
                      {anime.theme.openings?.length > 0 && (
                          <div>
                              <div className={styles.themesKind}>
                                OPENINGS <span className={styles.themesKindCount}>({anime.theme.openings.length})</span>
                              </div>
                              {/* Fixed height + styled scroll for large lists */}
                              <div className={styles.themesList}>
                                  {anime.theme.openings.map((op) => (
                                      <a key={op} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title + ' ' + op)}`} target="_blank" rel="noreferrer" className={styles.themeItem}>
                                          <PlaySquare size={15} color="var(--primary)" className={styles.themeItemIcon} />
                                          <span className={styles.themeItemName}>{op}</span>
                                          <ArrowUpRight size={13} color="var(--text-tertiary)" className={styles.themeItemExt} />
                                      </a>
                                  ))}
                              </div>
                          </div>
                      )}
                      {anime.theme.endings?.length > 0 && (
                          <div>
                              <div className={styles.themesKind}>
                                ENDINGS <span className={styles.themesKindCount}>({anime.theme.endings.length})</span>
                              </div>
                              <div className={styles.themesList}>
                                  {anime.theme.endings.map((ed) => (
                                      <a key={ed} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title + ' ' + ed)}`} target="_blank" rel="noreferrer" className={styles.themeItem}>
                                          <PlaySquare size={15} color="var(--primary)" className={styles.themeItemIcon} />
                                          <span className={styles.themeItemName}>{ed}</span>
                                          <ArrowUpRight size={13} color="var(--text-tertiary)" className={styles.themeItemExt} />
                                      </a>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          )}
        </div>


        {/* ============================================================== */}
        {/* RIGHT COLUMN: Title, Video, Synopsis, Carousels */}
        {/* ============================================================== */}
        <div className={styles.colMain}>
          
          <div className="desktop-title-block">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Header */}
            <div className={styles.genreRow}>
              <div className={styles.genreChips}>
                {anime.genres?.map(g => (
                  <Link key={g.mal_id} to={`/genre/${g.mal_id}/${g.name.toLowerCase().replace(/\s+/g, '-')}`} className={`badge ${styles.genreLink}`}>
                    {g.name}
                  </Link>
                ))}
              </div>
              {anime.status === 'Currently Airing' && (
                <span className={styles.airingPill}>
                  <Calendar size={13} /> 
                  NEXT EPISODE: {localAiring ? `${localAiring.day} at ${localAiring.time}` : anime.broadcast.string}
                  {localAiring && <span className={styles.airingLocal}>(Local Time)</span>}
                </span>
              )}
            </div>
            <h1 className={styles.heroTitle}>
              {anime.title_english || anime.title}
            </h1>
            <h2 className={styles.heroSub}>
              {anime.title_japanese}
            </h2>
            {/* Watchlist CTA */}
            <div className={styles.watchCta}>
              <WatchlistButton anime={anime} />
            </div>
            </motion.div>
          </div>

          {/* Official Trailer Embed */}
          {anime.trailer?.embed_url && (
            <div className={`trailer-container ${styles.trailerWrap}`}>
                <div className={styles.trailerFrame}>
                  <iframe 
                    src={anime.trailer.embed_url} 
                    frameBorder="0" 
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                </div>
            </div>
          )}

          {/* Synopsis & Background */}
          <h3 className={`section-title ${styles.sectionH}`}>Synopsis</h3>
          <p className={styles.synopsis}>
            {anime.synopsis}
          </p>

          {anime.background && (
              <>
                  <h3 className={`section-title ${styles.sectionH}`}>Background</h3>
                  <p className={styles.background}>
                    {anime.background}
                  </p>
              </>
          )}

          {/* Related Media */}
          {anime.relations && anime.relations.length > 0 && (() => {
            const RICH = ['Prequel', 'Sequel', 'Parent Story', 'Full Story'];
            const richGroups = anime.relations.filter(r => RICH.includes(r.relation));
            const otherGroups = anime.relations.filter(r => !RICH.includes(r.relation));
            return (
              <div className={styles.relatedWrap}>
                <h3 className={`section-title ${styles.relatedTitle}`}>Related Media</h3>

                {/* Rich cards: Prequel / Sequel */}
                {richGroups.length > 0 && (
                  <div className={`${styles.relatedRich} ${otherGroups.length > 0 ? styles.relatedRichSpaced : ''}`}>
                    {richGroups.map((rel, idx) =>
                      rel.entry.filter(e => e.type === 'anime').map((e, i) => {
                        const d = relatedDetails[e.mal_id];
                        return (
                          <Link key={`${idx}-${i}`} to={`/anime/${e.mal_id}`} className={styles.relatedCard}>
                            {/* Poster — fixed 120px wide */}
                            <div className={styles.relatedPoster}>
                              {d?.images?.jpg?.large_image_url
                                ? <img src={d.images.jpg.large_image_url} alt={e.name} className={styles.relatedPosterImg} loading="lazy" decoding="async" />
                                : <div className={styles.relatedPosterEmpty}>?</div>
                              }
                            </div>
                            {/* Info */}
                            <div className={styles.relatedInfo}>
                               <div className={styles.relatedKind}>{rel.relation}</div>
                              <div className={styles.relatedName}>
                                {d?.title_english || e.name}
                              </div>
                              {d?.score && (
                                <div className={styles.relatedScore}>
                                  <Star size={11} fill="var(--primary)" color="var(--primary)" />
                                  <span className={styles.relatedScoreVal}>{d.score}</span>
                                  {d?.type && <span className={styles.relatedScoreMeta}>{d.type} · {d.episodes ? `${d.episodes} eps` : d.status}</span>}
                                </div>
                              )}
                              {d?.synopsis && (
                                <p className={styles.relatedSynopsis}>
                                  {d.synopsis}
                                </p>
                              )}
                              {!d && <span className={styles.relatedLoading}>Loading details…</span>}
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Other relations: Adaptation, Spin-off, etc. — simple pills */}
                {otherGroups.length > 0 && (
                  <div className={styles.relatedOthers}>
                    {otherGroups.map((rel, idx) => (
                      <div key={idx}>
                        <div className={styles.relatedOtherKind}>
                          {rel.relation}
                        </div>
                        <div className={styles.relatedPills}>
                          {rel.entry.map((e, i) =>
                            e.type === 'anime' ? (
                                <Link key={i} to={`/anime/${e.mal_id}`} className={styles.relatedPill}>
                                  {e.name} <ArrowUpRight size={13} color="var(--primary)" />
                                </Link>
                            ) : (
                              <span key={i} className={styles.relatedStatic}>
                                {e.name} <span className={styles.relatedStaticTag}>{e.type}</span>
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* COMPACT EPISODE GUIDE WITH THUMBNAILS */}
          {episodes.length > 0 && (
              <div className={styles.epWrap}>
                  <h3 className={`section-title ${styles.epTitle}`}>Episode Guide</h3>
                  <div className={`card ${styles.epList}`}>
                      {episodes.map((ep, idx) => (
                          <div key={ep.mal_id} className={styles.epRow}>
                              <div className={styles.epThumb}>
                                  <PlaySquare size={20} color="var(--text-tertiary)" />
                              </div>
                               <div className={styles.epNum}>{ep.mal_id}</div>
                              <div className={styles.epInfo}>
                                  <div className={styles.epName}>{ep.title}</div>
                                  {ep.title_japanese && <div className={styles.epNameJp}>{ep.title_japanese}</div>}
                              </div>
                              {ep.aired && <div className={styles.epDate}>{new Date(ep.aired).toLocaleDateString()}</div>}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* DYNAMIC CAROUSELS */}
          <Carousel 
            title="Main Characters & Voice Actors"
            items={characters}
            variant="chars"
            navInHeader
            renderItem={(char) => {
                const voiceActor = char.voice_actors?.find(va => va.language === 'Japanese');
                return (
                <Link to={`/character/${char.character.mal_id}`} key={char.character.mal_id} className={`card-interactive ${styles.charCard}`}>
                    {/* Character portrait */}
                    <img src={char.character.images.jpg.image_url} alt={char.character.name} className={styles.charImg} />
                    {/* Character info */}
                    <div className={styles.charInfo}>
                        <div className={styles.charName}>{char.character.name}</div>
                        <div className={styles.charRole}>{char.role}</div>
                        {voiceActor && (
                            <div className={styles.charVa}>
                                {voiceActor.person.name}
                            </div>
                        )}
                    </div>
                    {/* VA portrait */}
                    {voiceActor && <img src={voiceActor.person.images.jpg.image_url} alt={voiceActor.person.name} className={styles.charImg} />}
                </Link>
                );
            }}
          />


          {/* Recommendations carousel follows directly */}

          <Carousel 
            title="If You Liked This, Watch These"
            items={recommendations.filter(r => r?.entry)}
            renderItem={(rec, i) => (
                <AnimeCard 
                  key={rec.entry.mal_id} 
                  anime={rec.entry} 
                  index={i}
                                  />
            )}
          />

          {/* USER REVIEWS */}
          {reviews.length > 0 && (
              <div className={styles.reviewsWrap}>
                  <h3 className={`section-title ${styles.reviewsTitle}`}>Top User Reviews</h3>
                  <div className={styles.reviewsGrid}>
                      {reviews.map(review => (
                          <div key={review.mal_id} className={`card ${styles.reviewCard}`}>
                              <div className={styles.reviewHead}>
                                  <img src={review.user.images.jpg.image_url} alt={review.user.username} className={styles.reviewAvatar} loading="lazy" decoding="async" />
                                  <div>
                                      <div className={styles.reviewUser}>{review.user.username}</div>
                                      <div className={styles.reviewDate}>{new Date(review.date).toLocaleDateString()}</div>
                                  </div>
                                   <div className={styles.reviewScore}>
                                       <Star size={14} fill="var(--primary)" /> {review.score}
                                  </div>
                              </div>
                              <p className={styles.reviewBody}>
                                  {review.review}
                              </p>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <GalleryModal 
            show={showGallery} 
            onClose={() => setShowGallery(false)} 
            images={pictures}
            title="Promo Gallery"
            filenamePrefix={anime.title.replace(/\s+/g, '-')}
          />

        </div>
      </div>
    </div>
  );
}
