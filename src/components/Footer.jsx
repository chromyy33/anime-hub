import { Link } from 'react-router-dom';
import { ExternalLink, Heart, Sparkles, Terminal } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        
        {/* Brand Section */}
        <div className={styles.footerBrand}>
          <Link to="/" className={styles.footerLogo}>
            <div className={styles.footerLogoBox}>
              <Sparkles size={18} color="#fff" fill="#fff" aria-hidden="true" />
            </div>
            ANI<span className={styles.footerLogoAccent}>DOC</span>
          </Link>
          <p className={styles.footerDesc}>
            Discover anime, track what you watch, and never miss an episode.
          </p>
        </div>

        {/* Quick Links Section */}
        <div>
          <h4 className={styles.footerSectionTitle}>Navigation</h4>
          <ul className={styles.footerLinksList}>
            <li><Link to="/" className={styles.footerLink}>Home</Link></li>
            <li><Link to="/watchlist" className={styles.footerLink}>Watchlist</Link></li>
            <li><Link to="/about" className={styles.footerLink}>About</Link></li>
            <li><Link to="/search" className={styles.footerLink}>Browse Anime</Link></li>
            <li><Link to="/schedule" className={styles.footerLink}>Airing Schedule</Link></li>
          </ul>
        </div>

        {/* Credits Section */}
        <div className={styles.footerCredits}>
          <h4 className={styles.footerSectionTitle}>Credits</h4>
          <div className={styles.creditItem}>
            <span>Made with</span>
            <Heart size={14} fill="var(--danger)" color="var(--danger)" aria-hidden="true" />
            <span>by</span>
            <a 
              href="https://github.com/chromyy33" 
              target="_blank" 
              rel="noreferrer"
              className={`${styles.footerLink} ${styles.footerCreditLink}`}
            >
              chromyy33 <ExternalLink size={12} className={styles.footerCreditLinkIcon} aria-hidden="true" />
            </a>
          </div>
          <div className={styles.creditItem}>
            <span>Co-coded with</span>
            <a 
              href="https://antigravity.google/" 
              target="_blank" 
              rel="noreferrer"
              className={`${styles.footerLink} ${styles.footerCreditLinkAccent}`}
            >
              <Terminal size={12} aria-hidden="true" /> ANTIGRAVITY
            </a>
          </div>
          <p className={styles.footerLegalText}>
            Icons by <a href="https://lucide.dev/" target="_blank" rel="noreferrer" className={`${styles.footerLink} ${styles.footerLinkUnderline}`}>Lucide</a>. 
            Data by <a href="https://anilist.co/" target="_blank" rel="noreferrer" className={`${styles.footerLink} ${styles.footerLinkUnderline}`}>AniList API</a>.
          </p>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className={styles.footerBottom}>
        <div>© {currentYear} AniDoc. All rights reserved.</div>
      </div>
    </footer>
  );
}

