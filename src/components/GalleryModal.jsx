import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

export default function GalleryModal({ show, onClose, images, title, filenamePrefix }) {
  
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
          className="gallery-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Header */}
          <div className="gallery-header">
            <div className="gallery-title-block">
              <h2 className="gallery-title">{title}</h2>
              <p className="gallery-subtitle">{images.length} premium wallpapers available</p>
            </div>
            <button onClick={onClose} className="gallery-close-btn">
              <X size={20} /> <span>Close</span>
            </button>
          </div>

          {/* Grid Container */}
          <div className="gallery-scroll-container">
            <div className="gallery-grid">
              {images.map((pic, idx) => {
                const imgUrl = pic.jpg?.large_image_url || pic.jpg?.image_url;
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="gallery-card"
                  >
                    <img
                      src={imgUrl}
                      alt={`Wallpaper ${idx + 1}`}
                      className="gallery-img"
                      loading="lazy"
                    />
                    <div className="gallery-card-overlay">
                      <button
                        onClick={() => downloadImage(imgUrl, `${filenamePrefix}-wallpaper-${idx + 1}.jpg`)}
                        className="gallery-download-btn"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
