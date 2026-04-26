import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Carousel({ title, items, renderItem }) {
  const scrollRef = useRef(null);
  const [showLeft,  setShowLeft]  = useState(false);
  const [showRight, setShowRight] = useState(false);

  const measure = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasOverflow = scrollWidth > clientWidth + 12;
    setShowLeft(hasOverflow && scrollLeft > 12);
    setShowRight(hasOverflow && scrollLeft < scrollWidth - clientWidth - 12);
  };

  useLayoutEffect(() => {
    measure();
    const t = setTimeout(measure, 120);
    return () => clearTimeout(t);
  }, [items]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -820 : 820, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginBottom: 40 }}>
      {title && (
        <h3 className="section-title" style={{ fontSize: 22, marginBottom: 20 }}>
          {title}
        </h3>
      )}

      <div style={{ position: 'relative' }}>
        {showLeft && (
          <button onClick={() => scroll('left')} className="slider-btn left">
            <ChevronLeft size={22} />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={measure}
          className="horizontal-scroll"
        >
          {items.map(renderItem)}
        </div>

        {showRight && (
          <button onClick={() => scroll('right')} className="slider-btn right">
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
