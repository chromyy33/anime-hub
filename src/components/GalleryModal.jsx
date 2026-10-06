import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './GalleryModal.module.css';

export default function GalleryModal({ show, onClose, images, title, filenamePrefix }) {
  const [activeIndex, setActiveIndex] = useState(null);

  // Body scroll lock
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  const handlePrev = (e) => {
    e?.stopPropagation();
    setActiveIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setActiveIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const handler = (e) => { 
      if (e.key === 'Escape') {
        if (activeIndex !== null) {
          setActiveIndex(null);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight' && activeIndex !== null) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && activeIndex !== null) {
        handlePrev();
      }
    };
    if (show) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show, onClose, activeIndex]);

  // Reset activeIndex when modal is closed
  useEffect(() => {
    if (!show) {
      setActiveIndex(null);
    }
  }, [show]);

  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  if (!images) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={styles.overlay}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.titleBlock}>
              <h2 className={styles.title}>{title}</h2>
              <p className={styles.subtitle}>{images.length} premium wallpapers available</p>
            </div>
            <button onClick={onClose} className={styles.closeBtn}>
              <X size={20} /> <span>Close</span>
            </button>
          </div>

          {/* Grid Container */}
          <div className={styles.scrollContainer}>
            <div className={styles.grid}>
              {images.map((pic, idx) => {
                const imgUrl = pic.jpg?.large_image_url || pic.jpg?.image_url;
                return (
                  <motion.div 
                    key={imgUrl || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                    className={styles.card}
                    onClick={() => setActiveIndex(idx)}
                    className={styles.zoomable}
                  >
                    <img
                      src={imgUrl}
                      alt={`Wallpaper ${idx + 1}`}
                      className={styles.img}
                      loading="lazy"
                    />
                    <div className={styles.cardOverlay}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(imgUrl, `${filenamePrefix}-wallpaper-${idx + 1}.jpg`);
                        }}
                        className={styles.downloadBtn}
                        title="Download HD"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Lightbox Modal */}
          <AnimatePresence>
            {activeIndex !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={styles.lightboxOverlay}
                onClick={(e) => { if (e.target === e.currentTarget) setActiveIndex(null); }}
              >
                {/* Lightbox Header */}
                <div className={styles.lightboxHeader}>
                  <span className={styles.lightboxCounter}>{activeIndex + 1} / {images.length}</span>
                  <div className={styles.lightboxActions}>
                    <button
                      onClick={() => {
                        const imgUrl = images[activeIndex].jpg?.large_image_url || images[activeIndex].jpg?.image_url;
                        downloadImage(imgUrl, `${filenamePrefix}-wallpaper-${activeIndex + 1}.jpg`);
                      }}
                      className={styles.lightboxActionBtn}
                      title="Download HD"
                    >
                      <Download size={20} />
                    </button>
                    <button
                      onClick={() => setActiveIndex(null)}
                      className={styles.lightboxActionBtn}
                      title="Close Lightbox"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Lightbox Main Section */}
                <div className={styles.lightboxContent}>
                  <button className={styles.lightboxNavBtn} onClick={handlePrev} aria-label="Previous image">
                    <ChevronLeft size={36} />
                  </button>

                  <div className={styles.lightboxImageWrapper}>
                    <motion.img
                      key={activeIndex}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      src={images[activeIndex].jpg?.large_image_url || images[activeIndex].jpg?.image_url}
                      alt={`Wallpaper ${activeIndex + 1}`}
                      className={styles.lightboxImg}
                    />
                  </div>

                  <button className={styles.lightboxNavBtn} onClick={handleNext} aria-label="Next image">
                    <ChevronRight size={36} />
                  </button>
                </div>

                {/* Lightbox Thumbnails Grid */}
                <div className={styles.lightboxThumbnails}>
                  <div className={styles.lightboxThumbGrid}>
                    {images.map((pic, idx) => {
                      const imgUrl = pic.jpg?.large_image_url || pic.jpg?.image_url;
                      return (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          className={`${styles.lightboxThumb} ${idx === activeIndex ? styles.lightboxThumbActive : ''}`}
                          onClick={() => setActiveIndex(idx)}
                        />
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
