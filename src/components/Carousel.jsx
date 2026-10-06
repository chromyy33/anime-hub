import { useRef, useState, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import 'swiper/css';
import styles from './Carousel.module.css';

// Whole-card paging: integer slides per view chosen from the container
// width, so a card is never cut in half. Arrows advance exactly one page
// (slidesPerGroup mirrors slidesPerView at every breakpoint).
//
// NOTE: arrows are driven imperatively (slidePrev/slideNext) with our own
// edge state — never via Swiper's Navigation module + element refs, whose
// mount-timing binding proved unreliable.
// Whole-card paging: integer slides per view, so a card is never cut.
// Counts key off the CONTAINER (breakpointsBase), not the window — a rail
// in the narrow details column adapts to its own width: room for 3 shows
// 3, room for 4 shows 4, never fewer pixels per card than the home design.
const PAGE_SETS = {
  // 200px poster cards (pitch ~216px with the gap).
  standard: { 0: 2, 560: 3, 820: 4, 1080: 5, 1360: 6 },
  // Character rows: fill the slide, ~340px at 3-up (design width).
  chars: { 0: 1, 620: 2, 980: 3 },
};

const keyOf = (item, i) =>
  item?.mal_id ?? item?.character?.mal_id ?? item?.entry?.mal_id ?? i;

export default function Carousel({ title, items, renderItem, variant = 'standard', navInHeader = false }) {
  const swiperRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const { hiddenIds } = useWatchlist();

  // Dismissed ("Not interested") anime never reach the track — filtering here
  // (not inside the card) so no blank slides are left behind. Character rows
  // carry no top-level anime id and are always kept.
  const visibleItems = (items || []).filter(item => {
    const id = item?.mal_id ?? item?.entry?.mal_id;
    return id == null || !hiddenIds.some(h => h.mal_id === id);
  });

  // Show arrows only when there is somewhere to go.
  const syncEdges = useCallback((swiper) => {
    const locked = swiper.isLocked;
    setCanPrev(!locked && !swiper.isBeginning);
    setCanNext(!locked && !swiper.isEnd);
  }, []);

  if (!visibleItems.length) return null;

  const counts = PAGE_SETS[variant] || PAGE_SETS.standard;
  const firstCount = counts[0];
  const breakpoints = Object.fromEntries(
    Object.entries(counts).map(([w, n]) => [w, { slidesPerView: n, slidesPerGroup: n }])
  );

  const go = (dir) => {
    const swiper = swiperRef.current;
    if (!swiper || swiper.destroyed) return;
    if (dir === 'left') swiper.slidePrev();
    else swiper.slideNext();
  };

  return (
    <div className={styles.carouselContainer}>
      {title && !navInHeader && (
        <h3 className={`${styles.title} section-title`}>
          {title}
        </h3>
      )}
      {title && navInHeader && (
        <div className={styles.headRow}>
          <h3 className={styles.headTitle}>{title}</h3>
          <div className={styles.headArrows}>
            <button
              onClick={() => go('left')}
              aria-label="Scroll left"
              className={styles.headArrow}
              disabled={!canPrev}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => go('right')}
              aria-label="Scroll right"
              className={styles.headArrow}
              disabled={!canNext}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      <div className={styles.sliderWrapper}>
        {!navInHeader && canPrev && (
          <button onClick={() => go('left')} aria-label="Scroll left" className={`${styles.sliderBtn} ${styles.left}`}>
            <ChevronLeft size={22} />
          </button>
        )}

        <div className={styles.viewportPad}>
          <Swiper
            slidesPerView={firstCount}
            slidesPerGroup={firstCount}
            breakpointsBase="container"
            breakpoints={breakpoints}
            spaceBetween={8}
            speed={450}
            grabCursor
            preventClicks
            preventClicksPropagation
            watchOverflow
            observer
            observeParents
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              syncEdges(swiper);
            }}
            onSlideChange={syncEdges}
            onReachBeginning={syncEdges}
            onReachEnd={syncEdges}
            onLock={syncEdges}
            onUnlock={syncEdges}
            onUpdate={syncEdges}
          >
            {visibleItems.map((item, i) => (
              <SwiperSlide key={keyOf(item, i)}>
                {renderItem(item, i)}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {!navInHeader && canNext && (
          <button onClick={() => go('right')} aria-label="Scroll right" className={`${styles.sliderBtn} ${styles.right}`}>
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
