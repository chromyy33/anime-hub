import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Users, Heart, Trophy, Tv, Calendar, Clock, Film, ExternalLink, PlaySquare, ArrowUpRight, Download, Image as ImageIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import Carousel from '../components/Carousel';
import SEO from '../components/SEO';
import WatchlistButton from '../components/WatchlistButton';
import AnimeCard from '../components/AnimeCard';
import GalleryModal from '../components/GalleryModal';

function DetailsSkeleton() {
  return (
    <div style={{ paddingBottom: 60 }} className="skeleton">
      <div className="details-layout">
        <div className="details-left">
          <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--bg-surface)', borderRadius: 16 }} />
          <div style={{ height: 160, background: 'var(--bg-surface)', marginTop: 24, borderRadius: 12 }} />
        </div>
        <div style={{ flex: 1, minWidth: 'min(100%, 320px)' }}>
          <div style={{ width: '70%', height: 54, background: 'var(--bg-surface)', marginBottom: 12, borderRadius: 8 }} />
          <div style={{ width: '30%', height: 28, background: 'var(--bg-surface)', marginBottom: 40, borderRadius: 4 }} />
          <div style={{ height: 300, background: 'var(--bg-surface)', borderRadius: 16 }} />
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
    const loadData = async () => {
      setLoading(true);
      try {
        // Step 1: Essential data
        const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`);
        if (!res.ok) throw new Error();
        const full = await res.json();
        setAnime(full.data);
        setLoading(false);

        // Step 2: Background secondary data (staggered for rate limits)
        setTimeout(async () => {
            const charRes = await fetch(`https://api.jikan.moe/v4/anime/${id}/characters`);
            const charJson = await charRes.json();
            if (charJson.data) setCharacters(charJson.data.sort((a, b) => b.favorites - a.favorites).slice(0, 12));
        }, 800);

        setTimeout(async () => {
            const recRes = await fetch(`https://api.jikan.moe/v4/anime/${id}/recommendations`);
            const recJson = await recRes.json();
            if (recJson.data) setRecommendations(recJson.data.slice(0, 12));
        }, 1600);

        setTimeout(async () => {
            const picRes = await fetch(`https://api.jikan.moe/v4/anime/${id}/pictures`);
            const picJson = await picRes.json();
            if (picJson.data) setPictures(picJson.data);
        }, 2400);

        setTimeout(async () => {
            const revRes = await fetch(`https://api.jikan.moe/v4/anime/${id}/reviews`);
            const revJson = await revRes.json();
            if (revJson.data) setReviews(revJson.data.slice(0, 5));
        }, 3200);

      } catch (err) {
        setError("Failed to load anime metadata. Jikan API might be rate-limiting.");
        setLoading(false);
      }
    };
    loadData();
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch poster/score/synopsis for prequel & sequel entries
  useEffect(() => {
    if (!anime?.relations) return;
    const RICH = ['Prequel', 'Sequel', 'Parent Story', 'Full Story'];
    const toFetch = [];
    anime.relations.forEach(rel => {
      if (RICH.includes(rel.relation)) {
        rel.entry.filter(e => e.type === 'anime').forEach(e => toFetch.push(e.mal_id));
      }
    });
    toFetch.forEach((malId, i) => {
      setTimeout(() => {
        fetch(`https://api.jikan.moe/v4/anime/${malId}`)
          .then(r => r.json())
          .then(d => { if (d.data) setRelatedDetails(prev => ({ ...prev, [malId]: d.data })); })
          .catch(console.error);
      }, i * 900);
    });
  }, [anime]);

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
  if (error && !anime) return <div className="text-center" style={{marginTop: 100, color: '#ef4444'}}>{error}</div>;

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
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, 
          color: 'var(--text-tertiary)', background: 'none', border: 'none',
          cursor: 'pointer', marginBottom: 16, fontSize: 14, fontWeight: 600,
          transition: 'color 0.2s', padding: 0, fontFamily: 'inherit' }}
        onMouseOver={e => e.currentTarget.style.color='var(--primary)'}
        onMouseOut={e => e.currentTarget.style.color='var(--text-tertiary)'}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* MOBILE HEADER: Shown only on mobile < 768px */}
      <div className="mobile-title-block">
        <div className="badge-container" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, justifyContent: 'flex-start' }}>
          {anime.genres?.slice(0, 3).map(g => (
            <span key={g.mal_id} className="badge">{g.name}</span>
          ))}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginBottom: 16, width: '100%' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em', textAlign: 'left' }}>
            {anime.title_english || anime.title}
          </h1>
          {anime.status === 'Currently Airing' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'rgba(16,185,129,0.1)', padding: '6px 14px', borderRadius: 99, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              <Calendar size={12} /> 
              AIRING: {localAiring ? `${localAiring.day} at ${localAiring.time}` : anime.broadcast.string}
            </span>
          )}
        </div>

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
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
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              <img 
                src={anime.images.jpg.large_image_url} 
                alt={anime.title} 
                style={{ width: '100%', display: 'block' }} 
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><Star size={16} color="var(--primary)"/> {anime.score || 'N/A'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><Trophy size={16} color="var(--primary)"/> #{anime.rank || 'N/A'}</div>
              </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="card sidebar-card" style={{ marginTop: 24 }}>
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
                <button onClick={() => setShowGallery(true)} className="btn-ghost w-full flex-center gap-sm" style={{ marginTop: 16 }}>
                    <Download size={15} /> Download Wallpapers ({pictures.length})
                </button>
            )}
          </div>

          {/* Streaming & Links */}
          {(anime.streaming?.length > 0 || anime.external?.length > 0) && (
             <div className="card" style={{ padding: 20, marginTop: 24 }}>
                {anime.streaming?.length > 0 && (
                    <div style={{ marginBottom: anime.external?.length > 0 ? 20 : 0 }}>
                        <h4 style={{ marginBottom: 10, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 600 }}>Available On</h4>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {anime.streaming.map((stream, idx) => (
                            <a key={idx} href={stream.url} target="_blank" rel="noreferrer" className="badge"
                               style={{ textDecoration: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', fontSize: 13, gap: 8 }}
                            >
                                <PlaySquare size={14} style={{ opacity: 0.8 }} />
                                {stream.name}
                                <ArrowUpRight size={12} style={{ opacity: 0.5 }} />
                            </a>
                        ))}
                        </div>
                    </div>
                )}
                {anime.external?.length > 0 && (
                    <div>
                        <h4 style={{ marginBottom: 10, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 600 }}>External Links</h4>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {anime.external.map((ext, idx) => (
                            <a key={idx} href={ext.url} target="_blank" rel="noreferrer" className="badge"
                               style={{ textDecoration: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', fontSize: 13, gap: 8 }}
                            >
                                {ext.name}
                                <ExternalLink size={13} style={{ opacity: 0.6 }} />
                            </a>
                        ))}
                        </div>
                    </div>
                )}
             </div>
          )}

          {/* Theme Songs */}
          {anime.theme && (anime.theme.openings?.length > 0 || anime.theme.endings?.length > 0) && (
              <div className="card" style={{ padding: 20, marginTop: 24 }}>
                  <h4 style={{ marginBottom: 12, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 600 }}>Theme Songs</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {anime.theme.openings?.length > 0 && (
                          <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 6, letterSpacing: '0.06em' }}>
                                OPENINGS <span style={{ opacity: 0.6, fontWeight: 400 }}>({anime.theme.openings.length})</span>
                              </div>
                              {/* Fixed height + styled scroll for large lists */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                                  {anime.theme.openings.map((op) => (
                                      <a key={op} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title + ' ' + op)}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'flex-start', padding: 8, background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', gap: 8, transition: 'border-color 0.2s', flexShrink: 0 }} onMouseOver={e=>e.currentTarget.style.borderColor='var(--primary)'} onMouseOut={e=>e.currentTarget.style.borderColor='var(--border-subtle)'}>
                                          <PlaySquare size={15} color="var(--primary)" style={{marginTop: 1, flexShrink: 0}} />
                                          <span style={{flex: 1}}>{op}</span>
                                          <ArrowUpRight size={13} color="var(--text-tertiary)" style={{flexShrink: 0}} />
                                      </a>
                                  ))}
                              </div>
                          </div>
                      )}
                      {anime.theme.endings?.length > 0 && (
                          <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 6, letterSpacing: '0.06em' }}>
                                ENDINGS <span style={{ opacity: 0.6, fontWeight: 400 }}>({anime.theme.endings.length})</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                                  {anime.theme.endings.map((ed) => (
                                      <a key={ed} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title + ' ' + ed)}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'flex-start', padding: 8, background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', gap: 8, transition: 'border-color 0.2s', flexShrink: 0 }} onMouseOver={e=>e.currentTarget.style.borderColor='var(--primary)'} onMouseOut={e=>e.currentTarget.style.borderColor='var(--border-subtle)'}>
                                          <PlaySquare size={15} color="var(--primary)" style={{marginTop: 1, flexShrink: 0}} />
                                          <span style={{flex: 1}}>{ed}</span>
                                          <ArrowUpRight size={13} color="var(--text-tertiary)" style={{flexShrink: 0}} />
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
        <div style={{ flex: '1', minWidth: 320, maxWidth: '100%', overflow: 'hidden' }}>
          
          <div className="desktop-title-block">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {anime.genres?.map(g => (
                  <Link key={g.mal_id} to={`/genre/${g.mal_id}/${g.name.toLowerCase().replace(/\s+/g, '-')}`} className="badge" style={{ transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                    {g.name}
                  </Link>
                ))}
              </div>
              {anime.status === 'Currently Airing' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'rgba(16,185,129,0.1)', padding: '4px 12px', borderRadius: 99, letterSpacing: '0.04em' }}>
                  <Calendar size={13} /> 
                  NEXT EPISODE: {localAiring ? `${localAiring.day} at ${localAiring.time}` : anime.broadcast.string}
                  {localAiring && <span style={{ opacity: 0.5, fontWeight: 400, marginLeft: 4 }}>(Local Time)</span>}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 8, letterSpacing: '-1px', lineHeight: 1.1 }}>
              {anime.title_english || anime.title}
            </h1>
            <h2 style={{ fontSize: 18, color: 'var(--text-tertiary)', fontWeight: 400, marginBottom: 20 }}>
              {anime.title_japanese}
            </h2>
            {/* Watchlist CTA */}
            <div style={{ marginBottom: 32 }}>
              <WatchlistButton anime={anime} />
            </div>
            </motion.div>
          </div>

          {/* Official Trailer Embed */}
          {anime.trailer?.embed_url && (
            <div className="trailer-container" style={{ marginBottom: 40, width: '100%' }}>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 16, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                  <iframe 
                    src={anime.trailer.embed_url} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    frameBorder="0" 
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                </div>
            </div>
          )}

          {/* Synopsis & Background */}
          <h3 className="section-title" style={{ fontSize: 22, margin: '0 0 16px 0' }}>Synopsis</h3>
          <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)', fontSize: 16, marginBottom: 40, whiteSpace: 'pre-line' }}>
            {anime.synopsis}
          </p>

          {anime.background && (
              <>
                  <h3 className="section-title" style={{ fontSize: 22, margin: '0 0 16px 0' }}>Background</h3>
                  <p style={{ lineHeight: 1.8, color: 'var(--text-tertiary)', fontSize: 15, marginBottom: 40, whiteSpace: 'pre-line' }}>
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
              <div style={{ marginBottom: 40 }}>
                <h3 className="section-title" style={{ fontSize: 22, margin: '0 0 20px 0' }}>Related Media</h3>

                {/* Rich cards: Prequel / Sequel */}
                {richGroups.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: otherGroups.length > 0 ? 24 : 0 }}>
                    {richGroups.map((rel, idx) =>
                      rel.entry.filter(e => e.type === 'anime').map((e, i) => {
                        const d = relatedDetails[e.mal_id];
                        return (
                          <Link key={`${idx}-${i}`} to={`/anime/${e.mal_id}`}
                            style={{ textDecoration: 'none', display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', overflow: 'hidden', transition: 'border-color 0.15s' }}
                            onMouseOver={ev => ev.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseOut={ev => ev.currentTarget.style.borderColor = 'var(--border-subtle)'}
                          >
                            {/* Poster — fixed 120px wide */}
                            <div style={{ width: 120, flexShrink: 0, background: 'var(--bg-base)', minHeight: 90 }}>
                              {d?.images?.jpg?.large_image_url
                                ? <img src={d.images.jpg.large_image_url} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                : <div style={{ width: '100%', height: '100%', minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, fontSize: 24 }}>?</div>
                              }
                            </div>
                            {/* Info */}
                            <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5, minWidth: 0 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary)' }}>{rel.relation}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {d?.title_english || e.name}
                              </div>
                              {d?.score && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                  <Star size={11} fill="var(--primary)" color="var(--primary)" />
                                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.score}</span>
                                  {d?.type && <span style={{ color: 'var(--text-tertiary)', marginLeft: 4 }}>{d.type} · {d.episodes ? `${d.episodes} eps` : d.status}</span>}
                                </div>
                              )}
                              {d?.synopsis && (
                                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {d.synopsis}
                                </p>
                              )}
                              {!d && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Loading details…</span>}
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Other relations: Adaptation, Spin-off, etc. — simple pills */}
                {otherGroups.length > 0 && (
                  <div style={{ 
                    display: 'flex', flexDirection: 'column', gap: 16, 
                    maxHeight: 280, overflowY: 'auto', paddingRight: 8,
                    borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginTop: 10
                  }}>
                    {otherGroups.map((rel, idx) => (
                      <div key={idx}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', marginBottom: 8 }}>
                          {rel.relation}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {rel.entry.map((e, i) =>
                            e.type === 'anime' ? (
                                <Link key={i} to={`/anime/${e.mal_id}`}
                                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', transition: 'border-color 0.15s' }}
                                  onMouseOver={ev => ev.currentTarget.style.borderColor = 'var(--primary)'}
                                  onMouseOut={ev => ev.currentTarget.style.borderColor = 'var(--border-subtle)'}
                                >
                                  {e.name} <ArrowUpRight size={13} color="var(--primary)" />
                                </Link>
                            ) : (
                              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', fontSize: 13, color: 'var(--text-tertiary)' }}>
                                {e.name} <span style={{ fontSize: 11, background: 'var(--bg-base)', padding: '1px 5px', borderRadius: 3 }}>{e.type}</span>
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
              <div style={{ marginBottom: 40 }}>
                  <h3 className="section-title" style={{ fontSize: 20, margin: '0 0 16px 0' }}>Episode Guide</h3>
                  <div className="card" style={{ maxHeight: 360, overflowY: 'auto', padding: 0 }}>
                      {episodes.map((ep, idx) => (
                          <div key={ep.mal_id} style={{ display: 'flex', gap: 16, padding: '12px 16px', borderBottom: idx !== episodes.length - 1 ? '1px solid var(--border-subtle)' : 'none', alignItems: 'center' }}>
                              <div style={{ width: 80, height: 45, background: 'var(--bg-surface-active)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <PlaySquare size={20} color="var(--text-tertiary)" />
                              </div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', width: 30, flexShrink: 0 }}>{ep.mal_id}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ep.title}</div>
                                  {ep.title_japanese && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ep.title_japanese}</div>}
                              </div>
                              {ep.aired && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{new Date(ep.aired).toLocaleDateString()}</div>}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* DYNAMIC CAROUSELS */}
          <Carousel 
            title="Main Characters & Voice Actors"
            items={characters}
            renderItem={(char) => {
                const voiceActor = char.voice_actors?.find(va => va.language === 'Japanese');
                return (
                <Link to={`/character/${char.character.mal_id}`} key={char.character.mal_id} className="card-interactive scroll-item" style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'row', height: 100, textDecoration: 'none', color: 'inherit' }}>
                    {/* Character portrait */}
                    <img src={char.character.images.jpg.image_url} alt={char.character.name} style={{ width: 72, height: '100%', objectFit: 'cover', flexShrink: 0 }} />
                    {/* Character info */}
                    <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{char.character.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 2 }}>{char.role}</div>
                        {voiceActor && (
                            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {voiceActor.person.name}
                            </div>
                        )}
                    </div>
                    {/* VA portrait */}
                    {voiceActor && <img src={voiceActor.person.images.jpg.image_url} alt={voiceActor.person.name} style={{ width: 72, height: '100%', objectFit: 'cover', flexShrink: 0 }} />}
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
                  style={{ flex: '0 0 200px', width: 200, flexShrink: 0, scrollSnapAlign: 'start' }} 
                />
            )}
          />

          {/* USER REVIEWS */}
          {reviews.length > 0 && (
              <div style={{ marginTop: 40 }}>
                  <h3 className="section-title" style={{ fontSize: 22, margin: '0 0 24px 0' }}>Top User Reviews</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                      {reviews.map(review => (
                          <div key={review.mal_id} className="card" style={{ padding: 20 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                  <img src={review.user.images.jpg.image_url} alt={review.user.username} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                  <div>
                                      <div style={{ fontWeight: 700, fontSize: 14 }}>{review.user.username}</div>
                                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{new Date(review.date).toLocaleDateString()}</div>
                                  </div>
                                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontWeight: 700, fontSize: 14 }}>
                                      <Star size={14} fill="#ef4444" /> {review.score}
                                  </div>
                              </div>
                              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-line', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 8, WebkitBoxOrient: 'vertical' }}>
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
