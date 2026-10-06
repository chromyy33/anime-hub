import { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Carousel.module.css';

export default function Carousel({ title, items, renderItem }) {
  const scrollRef = useRef(null);
  const [showLeft,  setShowLeft]  = useState(false);
  const [showRight, setShowRight] = useState(false);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasOverflow = scrollWidth > clientWidth + 12;
    setShowLeft(hasOverflow && scrollLeft > 12);
    setShowRight(hasOverflow && scrollLeft < scrollWidth - clientWidth - 12);
  }, []);

  useLayoutEffect(() => {
    measure();
    const t = setTimeout(measure, 120);
    return () => clearTimeout(t);
  }, [items, measure]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const [isDragging, setIsDragging] = useState(false);
  // Ref (not state): mousemove fires faster than re-renders.
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  // Touch devices fire synthetic mouse events after a touch scroll — those
  // must never start the mouse-drag path (they'd yank the track on release).
  const lastTouchEnd = useRef(0);

  // Glide to the nearest full page after a drag release. A short drag past
  // ~1.5 tiles advances a whole page; a shorter one settles back — Hotstar feel.
  // Anchored to the drag-start page so pages never drift out of alignment.
  const settle = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const pageW = el.clientWidth;
    const startPage = Math.round(drag.current.startLeft / pageW);
    const delta = el.scrollLeft - drag.current.startLeft;
    const step = Math.abs(delta) > Math.min(300, pageW * 0.25) ? Math.sign(delta) : 0;
    const maxPage = Math.max(0, Math.ceil((el.scrollWidth - el.clientWidth) / pageW));
    const target = Math.min(Math.max(startPage + step, 0), maxPage);
    el.scrollTo({ left: target * pageW, behavior: 'smooth' });
  }, []);

  const endDrag = useCallback((shouldSettle) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setIsDragging(false);
    if (shouldSettle) settle();
  }, [settle]);

  // A press released outside the track still settles (only if it started here).
  useEffect(() => {
    const onUp = () => endDrag(true);
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [endDrag]);

  const onMouseDown = (e) => {
    const el = scrollRef.current;
    if (!el || e.button !== 0) return;
    if (Date.now() - lastTouchEnd.current < 600) return; // post-touch ghost event
    e.preventDefault(); // kills text selection + image ghost-drag; clicks still fire
    drag.current = { active: true, startX: e.pageX, startLeft: el.scrollLeft, moved: false };
    setIsDragging(true);
  };

  const onMouseLeave = () => {
    // Gesture abandoned mid-press: stop tracking, don't settle.
    drag.current.active = false;
    setIsDragging(false);
  };

  const onMouseMove = (e) => {
    const d = drag.current;
    const el = scrollRef.current;
    if (!d.active || !el) return;
    const dx = e.pageX - d.startX;
    if (Math.abs(dx) > 6) d.moved = true;
    el.scrollLeft = d.startLeft - dx;
  };

  // A real drag must not activate cards/links on release.
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  // Hotstar-style paging: one full viewport of items per click,
  // anchored so repeated clicks never drift out of alignment.
  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const page = Math.round(el.scrollLeft / el.clientWidth) + (dir === 'left' ? -1 : 1);
    const maxPage = Math.max(0, Math.ceil((el.scrollWidth - el.clientWidth) / el.clientWidth));
    el.scrollTo({ left: Math.min(Math.max(page, 0), maxPage) * el.clientWidth, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <div className={styles.carouselContainer}>
      {title && (
        <h3 className={`${styles.title} section-title`}>
          {title}
        </h3>
      )}

      <div className={styles.sliderWrapper}>
        {showLeft && (
          <button onClick={() => scroll('left')} className={`${styles.sliderBtn} ${styles.left}`}>
            <ChevronLeft size={22} />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={measure}
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
          onMouseUp={() => endDrag(true)}
          onMouseMove={onMouseMove}
          onClickCapture={onClickCapture}
          className={`${styles.horizontalScroll} ${isDragging ? styles.dragging : ''}`}
        >
          {items.map(renderItem)}
        </div>

        {showRight && (
          <button onClick={() => scroll('right')} className={`${styles.sliderBtn} ${styles.right}`}>
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </div>
  );
}

