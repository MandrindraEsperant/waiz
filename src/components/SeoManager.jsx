import { useLocation } from 'react-router-dom';
import { usePageMeta, DEFAULTS } from '../hooks/usePageMeta';
import { getSeoForPath } from '../config/seo';

function SeoManager() {
  const { pathname } = useLocation();
  const config = getSeoForPath(pathname) || DEFAULTS;
  usePageMeta(config);
  return null;
}

export default SeoManager;
