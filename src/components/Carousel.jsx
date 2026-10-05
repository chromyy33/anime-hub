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
  const [startX, setStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);

  const onMouseDown = (e) => {
    // Only allow mouse dragging on tablets and mobile (< 1024px)
    if (window.innerWidth >= 1024) return;
    
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setDragScrollLeft(el.scrollLeft);
  };

  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);

  const onMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    el.scrollLeft = dragScrollLeft - walk;
  };

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -600 : 600, behavior: 'smooth' });
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
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          className={styles.horizontalScroll}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
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

