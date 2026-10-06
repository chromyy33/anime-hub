import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Download, ArrowRight, Search, LayoutGrid, Info, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { fetchWeeklySchedule } from '../utils/anilist';
import { useWatchlist } from '../context/WatchlistContext';
import SEO from '../components/SEO';
import AnimeCard from '../components/AnimeCard';
import styles from './SchedulePage.module.css';

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
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const grouped = await fetchWeeklySchedule();
        if (!cancelled) {
          setScheduleData(grouped);
        }
      } catch (err) {
        console.error('Schedule load error:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
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
    <div className={styles.wrap}>
      <SEO 
        title="Airing Schedule" 
        description="Check the weekly anime airing schedule on AniDoc. Real-time release dates and times for your favorite ongoing shows."
        url="/schedule"
      />
      
      <div className="schedule-container">
        {/* Header Area */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>
              Airing Calendar
            </h1>
            <p className={styles.subtitle}>
              The complete weekly release schedule converted to your <strong>local 24h time</strong>.
            </p>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.timezone}>
                <Clock size={12} /> {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
            <button onClick={downloadICS} className={`btn-primary ${styles.exportBtn}`}>
              <Download size={16} /> Export Calendar
            </button>
          </div>
        </div>

        {/* Step Guide for Export */}
        <div className={styles.guide}>
            <div className="guide-item">
                <div className={styles.guideStep}>1</div>
                <p className={styles.guideText}>Add airing shows to <strong>"Watching"</strong></p>
            </div>
            <div className="guide-item">
                <div className={styles.guideStep}>2</div>
                <p className={styles.guideText}>Click <strong>Export Calendar</strong> above</p>
            </div>
            <div className="guide-item">
                <div className={styles.guideStep}>3</div>
                <p className={styles.guideText}>Sync <strong>.ics file</strong> with your calendar app</p>
            </div>
        </div>

        {/* Day Selector & Search Row */}
        <div className={`flex flex-wrap items-center justify-between gap-lg ${styles.controlsRow}`}>
          
          <div className={styles.dayCol}>
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
                    className={`flex ${styles.dayScroll}`}
                  >
                    {DAYS.map(day => (
                      <button
                        key={day}
                        onClick={() => setActiveDay(day)}
                        className={`chip-filter ${activeDay === day ? 'active' : ''} ${styles.dayBtn}`}
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
              <div className={`text-sm text-secondary ${styles.resultsNote}`}>
                  Showing results for <span className={`text-accent ${styles.resultsQuery}`}>"{searchQuery}"</span> across the entire week:
              </div>
            )}
          </div>

          <div className={styles.searchCol}>
            <Search size={16} color="var(--text-tertiary)" className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search weekly lineup..."
              className={`search-input ${styles.searchField}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className={`grid-list ${styles.grid}`}>
             {Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className={`card skeleton ${styles.skeletonCard}`} />
             ))}
          </div>
        ) : (
          <div className={`grid-list ${styles.grid}`}>
            {activeList.length > 0 ? (
              activeList.map((anime) => (
                <AnimeCard key={anime.mal_id} anime={anime} variant="list" />
              ))
            ) : (
              <div className={styles.empty}>
                  <LayoutGrid size={40} className={styles.emptyIcon} />
                  <p className={styles.emptyText}>No results found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
