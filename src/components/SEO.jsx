import { useEffect } from 'react';

/**
 * SEO Component to manage page-specific metadata
 * Updates the document title and meta tags dynamically
 */
export default function SEO({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  schema
}) {
  useEffect(() => {
    // 1. Update Title
    const fullTitle = title ? `${title} — AniDoc` : 'AniDoc — Your Ultimate Anime Hub';
    document.title = fullTitle;

    // 2. Update Meta Tags Helper
    const updateMeta = (selector, content) => {
      if (!content) return;
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };

    const siteUrl = 'https://anidoc33.netlify.app';
    const currentUrl = url ? `${siteUrl}${url}` : siteUrl;
    const defaultImage = `${siteUrl}/og-image.png`;

    // Primary Meta
    updateMeta('meta[name="title"]', fullTitle);
    updateMeta('meta[name="description"]', description || "Discover, track, and manage your anime watchlist with AniDoc.");

    // Open Graph
    updateMeta('meta[property="og:title"]', fullTitle);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[property="og:image"]', image || defaultImage);
    updateMeta('meta[property="og:url"]', currentUrl);
    updateMeta('meta[property="og:type"]', type);

    // Twitter
    updateMeta('meta[name="twitter:title"]', fullTitle);
    updateMeta('meta[name="twitter:description"]', description);
    updateMeta('meta[name="twitter:image"]', image || defaultImage);
    updateMeta('meta[name="twitter:url"]', currentUrl);

    // 3. JSON-LD Schema
    const existingSchema = document.getElementById('json-ld-schema');
    if (existingSchema) existingSchema.remove();

    if (schema) {
      const script = document.createElement('script');
      script.id = 'json-ld-schema';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    // 4. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

  }, [title, description, image, url, type, schema]);

  return null; // This component doesn't render anything
}
