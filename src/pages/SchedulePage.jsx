import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Download, ArrowRight, Search, LayoutGrid, Info, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { fetchCached } from '../utils/cache';
import { useWatchlist } from '../context/WatchlistContext';
import SEO from '../components/SEO';
import AnimeCard from '../components/AnimeCard';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SchedulePage() {
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(false);
  const scrollRef = useRef(null);
  const { allEntries } = useWatchlist();
  

  // Helper for time conversion
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
      const localOffsetM = Math.abs(localOffsetMin % 60);

      let localH = utcH + localOffsetH;
      let localM = m + localOffsetM;
      if (localM >= 60) { localM -= 60; localH += 1; }
      if (localM < 0) { localM += 60; localH -= 1; }
      
      let finalDayOffset = utcDayOffset;
      if (localH >= 24) { localH -= 24; finalDayOffset += 1; }
      if (localH < 0) { localH += 24; finalDayOffset -= 1; }

      const finalDayIdx = (dayIdx + finalDayOffset + 7) % 7;
      return { 
        day: days[finalDayIdx].toLowerCase().slice(0, -1),
        time: `${localH.toString().padStart(2, '0')}:${localM.toString().padStart(2, '0')}`
      };
    } catch (e) { return null; }
  };

  // Fetch full schedule once
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const allDaysData = await Promise.all(DAYS.map(day => 
            fetchCached(`https://api.jikan.moe/v4/schedules?filter=${day}`, `sched_${day}`)
        ));
        
        const grouped = {};
        DAYS.forEach((day, i) => {
            grouped[day] = allDaysData[i].map(item => ({
                ...item,
                local: getLocalTime(item.broadcast)
            }));
        });
        setScheduleData(grouped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeList = useMemo(() => {
    let list = [];
    if (searchQuery) {
        const allItems = Object.values(scheduleData).flat();
        list = allItems.filter(a => 
            (a.title_english || a.title).toLowerCase().includes(searchQuery.toLowerCase())
        );
    } else {
        list = scheduleData[activeDay] || [];
    }
    // Sort by local time (or JST fallback) ascending
    return [...list].sort((a, b) => {
        const tA = a.local?.time || a.broadcast?.time || '99:99';
        const tB = b.local?.time || b.broadcast?.time || '99:99';
        return tA.localeCompare(tB);
    });
  }, [scheduleData, activeDay, searchQuery]);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftBtn(scrollLeft > 5);
      setShowRightBtn(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [scheduleData]);

  const scroll = (dir) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const downloadICS = () => {
    const airingWatchlist = allEntries.filter(a => a.status === 'watching');
    if (airingWatchlist.length === 0) {
        toast.info("Add airing anime to your Watching list first!");
        return;
    }
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AniDoc//Anime Schedule//EN\n";
    airingWatchlist.forEach(anime => {
        icsContent += `BEGIN:VEVENT\nSUMMARY:New Episode: ${anime.title}\nRRULE:FREQ=WEEKLY\nDTSTART:20240101T000000Z\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'my_anime_calendar.ics');
    link.click();
  };

  return (
    <div style={{ paddingBottom: 60, fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif" }}>
      <SEO 
        title="Airing Schedule" 
        description="Check the weekly anime airing schedule on AniDoc. Real-time release dates and times for your favorite ongoing shows."
        url="/schedule"
      />
      
      <div className="schedule-container">
        {/* Header Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Outfit', color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Airing Calendar
            </h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, maxWidth: 540, lineHeight: 1.5 }}>
              The complete weekly release schedule converted to your <strong>local 24h time</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12} /> {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
            <button onClick={downloadICS} className="btn-primary" style={{ padding: '8px 18px', gap: 8, fontSize: 13, borderRadius: 'var(--radius-sm)', height: 38 }}>
              <Download size={16} /> Export Calendar
            </button>
          </div>
        </div>

        {/* Step Guide for Export */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32, marginBottom: 48, padding: 20, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div className="guide-item">
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>1</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Add airing shows to <strong>"Watching"</strong></p>
            </div>
            <div className="guide-item">
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>2</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Click <strong>Export Calendar</strong> above</p>
            </div>
            <div className="guide-item">
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>3</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Sync <strong>.ics file</strong> with your calendar app</p>
            </div>
        </div>

        {/* Day Selector & Search Row */}
        <div className="flex flex-wrap items-center justify-between gap-lg" style={{ marginBottom: 40 }}>
          
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', alignItems: 'center' }}>
            {!searchQuery ? (
              <>
                {showLeftBtn && (
                  <button className="scroll-btn" onClick={() => scroll('left')}>
                    <ChevronLeft size={18} />
                  </button>
                )}
                <div className={`scroll-mask ${showLeftBtn ? 'has-overflow-left' : ''} ${showRightBtn ? 'has-overflow-right' : ''}`}>
                  <div 
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="flex" 
                    style={{ 
                      overflowX: 'auto', 
                      padding: '4px 0', 
                      gap: '8px',
                      scrollbarWidth: 'none', 
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch',
                      scrollBehavior: 'smooth',
                    }}
                  >
                    {DAYS.map(day => (
                      <button
                        key={day}
                        onClick={() => setActiveDay(day)}
                        className={`chip-filter ${activeDay === day ? 'active' : ''}`}
                        style={{ textTransform: 'capitalize', height: 44, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                {showRightBtn && (
                  <button className="scroll-btn" onClick={() => scroll('right')}>
                    <ChevronRight size={18} />
                  </button>
                )}
              </>
            ) : (
              <div className="text-sm text-secondary" style={{ fontWeight: 500, height: 44, display: 'flex', alignItems: 'center' }}>
                  Showing results for <span className="text-accent" style={{ margin: '0 4px' }}>"{searchQuery}"</span> across the entire week:
              </div>
            )}
          </div>

          <div className="navbar-search" style={{ flex: '0 0 370px', maxWidth: '100%' }}>
            <Search size={18} className="search-icon-fixed" style={{ top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search weekly lineup..."
              className="search-input w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 48, height: 44 }}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid-list" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))' }}>
             {Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="card skeleton" style={{ height: 120, borderRadius: 'var(--radius-md)' }} />
             ))}
          </div>
        ) : (
          <div className="grid-list" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))' }}>
            {activeList.length > 0 ? (
              activeList.map((anime) => (
                <AnimeCard key={anime.mal_id} anime={anime} variant="list" />
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 0', color: 'var(--text-tertiary)' }}>
                  <LayoutGrid size={40} style={{ opacity: 0.1, marginBottom: 16 }} />
                  <p style={{ fontSize: 14 }}>No results found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
