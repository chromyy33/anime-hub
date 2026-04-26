import { Link } from 'react-router-dom';
import { ExternalLink, Heart, Sparkles, Terminal } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* Brand Section */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo" style={{ textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#fff" fill="#fff" aria-hidden="true" />
            </div>
            ANI<span style={{ color: 'var(--primary)' }}>DOC</span>
          </Link>
          <p className="footer-desc">
            A premium anime tracking experience built for the modern fan. 
            Discover, track, and manage your watchlist with ease.
          </p>
        </div>

        {/* Quick Links Section */}
        <div>
          <h4 className="footer-section-title">Navigation</h4>
          <ul className="footer-links-list">
            <li><Link to="/" className="footer-link">Home</Link></li>
            <li><Link to="/search" className="footer-link">Browse Anime</Link></li>
            <li><Link to="/schedule" className="footer-link">Airing Schedule</Link></li>
          </ul>
        </div>

        {/* Credits Section */}
        <div className="footer-credits">
          <h4 className="footer-section-title">Credits</h4>
          <div className="credit-item">
            <span>Made with</span>
            <Heart size={14} fill="#ef4444" color="#ef4444" aria-hidden="true" />
            <span>by</span>
            <a 
              href="https://github.com/chromyy33" 
              target="_blank" 
              rel="noreferrer"
              className="footer-link"
              style={{ fontWeight: 700, color: 'var(--text-primary)' }}
            >
              chromyy33 <ExternalLink size={12} style={{ opacity: 0.5 }} aria-hidden="true" />
            </a>
          </div>
          <div className="credit-item">
            <span>Co-coded with</span>
            <a 
              href="https://antigravity.google/" 
              target="_blank" 
              rel="noreferrer"
              className="footer-link"
              style={{ fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Terminal size={12} aria-hidden="true" /> ANTIGRAVITY
            </a>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12, lineHeight: 1.6 }}>
            Icons by <a href="https://lucide.dev/" target="_blank" rel="noreferrer" className="footer-link" style={{ textDecoration: 'underline', fontSize: 'inherit' }}>Lucide</a>. 
            Data by <a href="https://jikan.moe/" target="_blank" rel="noreferrer" className="footer-link" style={{ textDecoration: 'underline', fontSize: 'inherit' }}>Jikan API</a>.
          </p>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div>© {currentYear} AniDoc. All rights reserved.</div>
      </div>
    </footer>
  );
}
