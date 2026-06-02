import { SITE_URL } from '../hooks/usePageMeta';

export const SEO_ROUTES = {
  '/': {
    title: 'Covoiturage Fiable et Sécurisé',
    description: 'Waiz - Réservez vos trajets de covoiturage à Madagascar. Chauffeurs vérifiés, tarifs transparents, réservation en ligne simple et rapide.',
    keywords: 'covoiturage Madagascar, réserver trajet, transport Antananarivo, taxi en ligne, VTC Madagascar',
    canonical: SITE_URL,
  },
  '/login': {
    title: 'Connexion',
    description: 'Connectez-vous à votre compte Waiz pour réserver ou proposer des trajets de covoiturage.',
    keywords: 'connexion Waiz, login covoiturage, compte chauffeur, compte passager',
    canonical: `${SITE_URL}/login`,
    noIndex: true,
  },
  '/inscription': {
    title: 'Inscription Chauffeur',
    description: 'Rejoignez Waiz en tant que chauffeur. Inscrivez-vous gratuitement et commencez à proposer vos trajets de covoiturage.',
    keywords: 'inscription chauffeur, devenir chauffeur Waiz, covoiturage chauffeur Madagascar',
    canonical: `${SITE_URL}/inscription`,
  },
  '/abonnement': {
    title: 'Abonnement Chauffeur',
    description: 'Choisissez votre formule d\'abonnement Waiz : Basique, Pro ou Premium. Débloquez toutes les fonctionnalités pour gérer vos courses.',
    keywords: 'abonnement chauffeur, formule Waiz, tarif covoiturage, plan Pro Premium',
    canonical: `${SITE_URL}/abonnement`,
    noIndex: true,
  },
  '/reserver': {
    title: 'Réserver un Trajet',
    description: 'Réservez votre prochain trajet de covoiturage avec Waiz. Choisissez votre destination et trouvez un chauffeur disponible.',
    keywords: 'réserver trajet, covoiturage en ligne, course Madagascar',
    canonical: `${SITE_URL}/reserver`,
    noIndex: true,
  },
  '/dashboard': {
    title: 'Tableau de Bord',
    description: 'Gérez vos courses, clients et statistiques depuis votre tableau de bord chauffeur Waiz.',
    noIndex: true,
  },
};

export function getSeoForPath(pathname) {
  return SEO_ROUTES[pathname] || null;
}
