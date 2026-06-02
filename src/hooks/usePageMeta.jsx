import { useEffect } from 'react';

const SITE_URL = 'https://waiz.app';
const SITE_NAME = 'Waiz';

const DEFAULTS = {
  title: 'Waiz - Covoiturage Fiable et Sécurisé | Réservez Vos Trajets en Ligne',
  description: 'Waiz - Plateforme de covoiturage en ligne à Madagascar. Connectez-vous avec des chauffeurs vérifiés, réservez facilement vos trajets. Accès 24/7 à des courses fiables et sécurisées.',
  keywords: 'covoiturage, transport, taxi, chauffeur, Madagascar, Antananarivo, réservation courses, VTC, ride sharing',
  ogImage: `${SITE_URL}/cov.jpg`,
  canonical: SITE_URL,
  robots: 'index, follow',
};

function setMetaTag(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLinkTag(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function usePageMeta({ title, description, keywords, canonical, ogImage, robots, noIndex } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULTS.title;
    const desc = description || DEFAULTS.description;
    const keys = keywords || DEFAULTS.keywords;
    const url = canonical || DEFAULTS.canonical;
    const image = ogImage || DEFAULTS.ogImage;
    const robotsContent = noIndex ? 'noindex, nofollow' : (robots || DEFAULTS.robots);

    document.title = fullTitle;
    setMetaTag('name', 'description', desc);
    setMetaTag('name', 'keywords', keys);
    setMetaTag('name', 'robots', robotsContent);
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', desc);
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', desc);
    setMetaTag('name', 'twitter:image', image);
    setLinkTag('canonical', url);

    return () => {
      document.title = DEFAULTS.title;
      setMetaTag('name', 'description', DEFAULTS.description);
      setMetaTag('name', 'keywords', DEFAULTS.keywords);
      setMetaTag('name', 'robots', DEFAULTS.robots);
      setMetaTag('property', 'og:title', DEFAULTS.title);
      setMetaTag('property', 'og:description', DEFAULTS.description);
      setMetaTag('property', 'og:url', DEFAULTS.canonical);
      setMetaTag('property', 'og:image', DEFAULTS.ogImage);
      setMetaTag('name', 'twitter:title', DEFAULTS.title);
      setMetaTag('name', 'twitter:description', DEFAULTS.description);
      setMetaTag('name', 'twitter:image', DEFAULTS.ogImage);
      setLinkTag('canonical', DEFAULTS.canonical);
    };
  }, [title, description, keywords, canonical, ogImage, robots, noIndex]);
}

export { DEFAULTS, SITE_URL, SITE_NAME };
