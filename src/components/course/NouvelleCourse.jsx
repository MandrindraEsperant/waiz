import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MenuApp from '../Menu';
import {
  FaSave, FaTimes, FaChevronDown, FaSearch,
  FaCar, FaUser, FaMapMarkerAlt, FaArrowRight, FaHandshake,
  FaCheck, FaExclamationTriangle, FaSpinner, FaSyncAlt,
  FaRoute, FaDollarSign, FaLocationArrow, FaClock, FaInfoCircle,
  FaDirections, FaRoad, FaTrafficLight, FaWeightHanging, FaHistory
} from 'react-icons/fa';
import { useLanguage } from '../../contexts/LanguageContext';
import fr from '../../locales/client/fr.json';
import en from '../../locales/client/en.json';
import mg from '../../locales/client/mg.json';
import './NouvelleCourse.css';

// Imports pour la carte
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Composant pour les événements de la carte
const MapEventHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick && onMapClick(e.latlng, e);
    }
  });
  return null;
};

// Icônes personnalisées
const departureIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const arrivalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Fonction pour obtenir un itinéraire réel avec OSRM
const getRealRoute = async (start, end) => {
  try {
    const baseUrl = 'https://router.project-osrm.org';

    const response = await fetch(
      `${baseUrl}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`
    );

    if (!response.ok) {
      throw new Error('Erreur API OSRM');
    }

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distance = route.distance / 1000;
      const duration = route.duration / 60;
      const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

      const steps = route.legs[0].steps.map(step => ({
        distance: (step.distance / 1000).toFixed(2),
        duration: (step.duration / 60).toFixed(1),
        instruction: step.maneuver?.instruction || '',
        type: step.maneuver?.type || 'turn',
      }));

      return {
        coordinates,
        distance: distance.toFixed(2),
        duration: Math.round(duration),
        steps,
        summary: {
          total_distance: route.distance,
          total_duration: route.duration
        }
      };
    }

    return null;
  } catch (error) {
    console.error('Erreur récupération itinéraire OSRM:', error);
    try {
      return await getAlternativeOSRMRoute(start, end);
    } catch (fallbackError) {
      console.error('Échec serveur alternatif:', fallbackError);
      return null;
    }
  }
};

// Fonction alternative avec un autre serveur OSRM
const getAlternativeOSRMRoute = async (start, end) => {
  try {
    const baseUrl = 'https://routing.openstreetmap.de';

    const response = await fetch(
      `${baseUrl}/routed-car/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
    );

    if (!response.ok) {
      throw new Error('Erreur serveur alternatif');
    }

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distance = route.distance / 1000;
      const duration = route.duration / 60;
      const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

      return {
        coordinates,
        distance: distance.toFixed(2),
        duration: Math.round(duration),
        steps: [],
        summary: {
          total_distance: route.distance,
          total_duration: route.duration
        }
      };
    }

    return null;
  } catch (error) {
    throw error;
  }
};

// Fonction de fallback
const getFallbackRoute = (start, end) => {
  const R = 6371;
  const dLat = (end.lat - start.lat) * Math.PI / 180;
  const dLon = (end.lng - start.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  const numPoints = 10;
  const coordinates = [];

  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    const lat = start.lat + (end.lat - start.lat) * ratio + (Math.random() * 0.001 - 0.0005);
    const lng = start.lng + (end.lng - start.lng) * ratio + (Math.random() * 0.001 - 0.0005);
    coordinates.push([lat, lng]);
  }

  return {
    coordinates,
    distance: distance.toFixed(2),
    duration: Math.round(distance * 2.5),
    steps: [],
    summary: {
      distance: distance * 1000,
      duration: distance * 150
    }
  };
};

function NouvelleCourse() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const translations = { fr, en, mg };
  const t = translations[language] || translations.fr;

  // États pour les onglets
  const [activeTab, setActiveTab] = useState('client');
  const [clientStepCompleted, setClientStepCompleted] = useState(false);

  // États communs
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [routeCalculating, setRouteCalculating] = useState(false);
  const [zoneCreating, setZoneCreating] = useState(false);

  // États Client - CORRECTION: utiliser Nom_client et Telephone_client
  const [client, setClient] = useState({
    Nom_client: '',
    Telephone_client: ''
  });
  const [clientErrors, setClientErrors] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('MG');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [searchTimer, setSearchTimer] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [ridesRemaining, setRidesRemaining] = useState(null);
  const [loadingQuota, setLoadingQuota] = useState(false);

  // États Course
  const [formData, setFormData] = useState({
    clients: [],
    chauffeurs: [],
    voitures: [],
    zones: []
  });

  const [courseErrors, setCourseErrors] = useState({});
  const [newCourse, setNewCourse] = useState({
    client_ID: '',
    chauffeur_ID: '',
    voiture_ID: '',
    zone_depart_ID: '',
    zone_arriver_ID: '',
    Heure_depart: '',
    Tarif_proposer_client: '',
    Tarif_final_accepter: null,
    Status_tarif: 'proposé',
    Temps_attente_avant_acceptation: 0,
    Status_course: 'En cours',
    Evenement_special: null
  });

  // États pour la carte
  const [departurePosition, setDeparturePosition] = useState(null);
  const [arrivalPosition, setArrivalPosition] = useState(null);
  const [selectedZoneType, setSelectedZoneType] = useState('departure');
  const [heatmapData, setHeatmapData] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [zoneDepartName, setZoneDepartName] = useState('');
  const [zoneArriverName, setZoneArriverName] = useState('');
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [routeDetails, setRouteDetails] = useState(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);

  const countrySelectorRef = useRef(null);
  const clientSearchRef = useRef(null);
  const nameInputRef = useRef(null);

  // Liste des pays
  const countries = useMemo(() => [
    { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬' },
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'US', name: language === 'fr' ? 'États-Unis' : language === 'mg' ? 'Etazonia' : 'United States', dialCode: '+1', flag: '🇺🇸' },
    { code: 'BE', name: language === 'fr' ? 'Belgique' : language === 'mg' ? 'Bélzika' : 'Belgium', dialCode: '+32', flag: '🇧🇪' },
    { code: 'CH', name: language === 'fr' ? 'Suisse' : language === 'mg' ? 'Soisa' : 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
    { code: 'CA', name: language === 'fr' ? 'Canada' : language === 'mg' ? 'Kanada' : 'Canada', dialCode: '+1', flag: '🇨🇦' },
    { code: 'GB', name: language === 'fr' ? 'Royaume-Uni' : language === 'mg' ? 'Fanjakana Mitambatra' : 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  ], [language]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return countries;
    return countries.filter(country =>
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.dialCode.includes(countrySearch) ||
      country.code.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countries, countrySearch]);

  const getHistoricalTarifs = async (departureZoneId, arrivalZoneId, departureZoneName, arrivalZoneName) => {
    try {
      console.log('🔍 Recherche historique avec:', {
        departureZoneId,
        arrivalZoneId,
        departureZoneName,
        arrivalZoneName
      });

      // STRATÉGIE 1: Chercher avec les IDs exacts
      if (departureZoneId && arrivalZoneId) {
        try {
          console.log('📡 Recherche exacte par IDs...');
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/apiCourse/courses-by-zones`, {
            params: {
              zone_depart_ID: departureZoneId,
              zone_arriver_ID: arrivalZoneId,
              limit: 20
            }
          });

          if (response.data && response.data.length > 0) {
            console.log(`✅ ${response.data.length} courses exactes trouvées par IDs`);
            return processHistoricalCourses(response.data, departureZoneId, arrivalZoneId, true);
          }
        } catch (error) {
          console.log('Recherche exacte échouée:', error.message);
        }
      }

      // STRATÉGIE 2: Chercher par NOMS de zones
      if (departureZoneName && arrivalZoneName) {
        try {
          console.log('📡 Recherche par noms de zones...');
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/apiCourse/courses-by-zone-names`, {
            params: {
              zone_depart_name: departureZoneName,
              zone_arriver_name: arrivalZoneName,
              limit: 20
            }
          });

          if (response.data && response.data.length > 0) {
            console.log(`✅ ${response.data.length} courses trouvées par noms`);

            const firstCourse = response.data[0];
            const foundDepartureId = firstCourse.zone_depart_ID || departureZoneId;
            const foundArrivalId = firstCourse.zone_arriver_ID || arrivalZoneId;

            return processHistoricalCourses(response.data, foundDepartureId, foundArrivalId, true);
          }
        } catch (error) {
          console.log('Recherche par noms échouée:', error.message);
        }
      }

      // STRATÉGIE 3: Chercher l'inverse
      if (departureZoneName && arrivalZoneName) {
        try {
          console.log('📡 Recherche inverse...');
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/apiCourse/courses-by-zone-names`, {
            params: {
              zone_depart_name: arrivalZoneName,
              zone_arriver_name: departureZoneName,
              limit: 10
            }
          });

          if (response.data && response.data.length > 0) {
            console.log(`🔄 ${response.data.length} courses inversées trouvées`);
            return processHistoricalCourses(response.data, arrivalZoneId, departureZoneId, false);
          }
        } catch (error) {
          console.log('Recherche inverse échouée:', error.message);
        }
      }

      console.log('❌ Aucune course historique trouvée');
      return {
        hasHistory: false,
        exactMatch: false,
        count: 0
      };
    } catch (error) {
      console.error('❌ Erreur recherche tarifs historiques:', error);
      return {
        hasHistory: false,
        exactMatch: false,
        count: 0
      };
    }
  };

  // Fonction helper améliorée
  const processHistoricalCourses = (courses, zoneDepartId, zoneArriverId, exactMatch) => {
    console.log(`🔧 Traitement de ${courses.length} courses`);

    // Filtrer les courses avec tarif final accepté
    const validCourses = courses.filter(course => {
      const hasValidPrice = course.Tarif_final_accepter &&
        course.Tarif_final_accepter > 0;
      const isCompleted = course.Status_course &&
        ['terminée', 'TERMINÉE', 'Terminée', 'termine', 'Termine'].includes(course.Status_course);

      return hasValidPrice && isCompleted;
    });

    if (validCourses.length === 0) {
      console.log('⚠️ Aucune course valide (tarif accepté et terminée)');
      return {
        hasHistory: false,
        exactMatch: false,
        count: 0
      };
    }

    console.log(`✅ ${validCourses.length} courses valides`);

    // Trier par date récente
    validCourses.sort((a, b) => new Date(b.Heure_depart) - new Date(a.Heure_depart));

    // Calculer les statistiques
    const prices = validCourses.map(c => c.Tarif_final_accepter);
    const total = prices.reduce((sum, price) => sum + price, 0);
    const average = Math.round(total / validCourses.length);
    const mostRecentPrice = validCourses[0].Tarif_final_accepter;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Ajuster selon l'heure
    const currentHour = new Date().getHours();
    let suggestedPrice = average;

    if (currentHour >= 22 || currentHour < 6) {
      suggestedPrice = Math.round(suggestedPrice * 1.2);
    } else if (currentHour >= 18 && currentHour < 22) {
      suggestedPrice = Math.round(suggestedPrice * 1.1);
    }

    return {
      hasHistory: true,
      exactMatch: exactMatch,
      count: validCourses.length,
      suggestedPrice: suggestedPrice,
      mostRecentPrice: mostRecentPrice,
      average: average,
      min: minPrice,
      max: maxPrice,
      recentCourses: validCourses.slice(0, 5),
      zoneDepartId,
      zoneArriverId,
      zoneNames: {
        depart: validCourses[0]?.ZoneDepart?.Nom || 'Inconnu',
        arrivee: validCourses[0]?.ZoneArriver?.Nom || 'Inconnu'
      }
    };
  };

  const calculateDistanceAndPrice = async (departure, arrival, departureZoneId, arrivalZoneId, departureZoneName, arrivalZoneName) => {
    if (!departure || !arrival) return null;

    try {
      // ==================== ÉTAPE 1: Rechercher PRIORITAIREMENT les tarifs historiques ====================
      let historicalTarif = null;
      if ((departureZoneId && arrivalZoneId) || (departureZoneName && arrivalZoneName)) {
        historicalTarif = await getHistoricalTarifs(
          departureZoneId,
          arrivalZoneId,
          departureZoneName,
          arrivalZoneName
        );
      }

      // ==================== ÉTAPE 2: Si on a un historique, l'utiliser comme prix recommandé ====================
      if (historicalTarif && historicalTarif.hasHistory) {
        console.log(`✅ Historique trouvé: ${historicalTarif.count} courses entre ces zones`);

        // PRIORITÉ 1: Utiliser l'historique comme prix recommandé
        const historicalPrice = historicalTarif.exactMatch ?
          historicalTarif.suggestedPrice :
          historicalTarif.average || historicalTarif.suggestedPrice;

        // Ajuster selon l'heure (tarif nocturne)
        const currentHour = new Date().getHours();
        let suggestedPrice = historicalPrice;

        if (currentHour >= 22 || currentHour < 6) {
          suggestedPrice = Math.round(historicalPrice * 1.2);
        } else if (currentHour >= 18 && currentHour < 22) {
          suggestedPrice = Math.round(historicalPrice * 1.1);
        }

        // Calculer la fourchette basée sur l'historique
        const minPrice = Math.max(7000, historicalTarif.min ? Math.round(historicalTarif.min * 0.8) : Math.round(suggestedPrice * 0.8));
        const maxPrice = historicalTarif.max ? Math.round(historicalTarif.max * 1.2) : Math.round(suggestedPrice * 1.2);

        return {
          distance: null,
          estimatedPrice: suggestedPrice,
          minPrice,
          maxPrice,
          duration: null,
          routeCoordinates: [],
          routeSteps: [],
          routeSummary: null,
          historicalData: {
            suggestedPrice: suggestedPrice,
            mostRecentPrice: historicalTarif.mostRecentPrice,
            average: historicalTarif.average,
            min: historicalTarif.min,
            max: historicalTarif.max,
            count: historicalTarif.count,
            hasHistory: true,
            exactMatch: historicalTarif.exactMatch,
            message: historicalTarif.exactMatch ?
              `✅ Course identique trouvée! (${historicalTarif.count} courses)` :
              `💰 ${historicalTarif.count} courses similaires trouvées`
          }
        };
      }

      // ==================== ÉTAPE 3: Si PAS d'historique, alors calculer par distance ====================
      console.log('⚠️ Aucun historique trouvé, calcul par distance...');

      const routeInfo = await getRealRoute(departure, arrival) || getFallbackRoute(departure, arrival);

      const calculatePrice = (distance) => {
        const MIN_TARIF = 7000;

        // Formule basée sur la distance
        const basePrice = MIN_TARIF;
        const pricePerKm = 1000;
        const calculatedPrice = Math.round(basePrice + (parseFloat(distance) * pricePerKm));

        return Math.max(calculatedPrice, MIN_TARIF);
      };

      const estimatedPrice = calculatePrice(parseFloat(routeInfo.distance));
      const minPrice = Math.max(7000, Math.round(estimatedPrice * 0.8));
      const maxPrice = Math.round(estimatedPrice * 1.2);

      return {
        distance: routeInfo.distance,
        estimatedPrice,
        minPrice,
        maxPrice,
        duration: routeInfo.duration,
        routeCoordinates: routeInfo.coordinates,
        routeSteps: routeInfo.steps,
        routeSummary: routeInfo.summary,
        historicalData: {
          hasHistory: false,
          exactMatch: false,
          message: language === 'fr' ? "⚠️ Aucune course historique trouvée (tarif basé sur la distance)" :
            language === 'mg' ? "⚠️ Tsy misy course fahiny hita (vidiny mifototra amin'ny halaviana)" :
              "⚠️ No historical courses found (price based on distance)"
        }
      };
    } catch (error) {
      console.error('Erreur calcul itinéraire:', error);
      return null;
    }
  };

  // Ajoutez cette fonction vers la ligne 500 environ
  const fetchSubscriptionQuota = async () => {
    try {
      setLoadingQuota(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/abonnements/quota`);

      if (response.data.success) {
        setSubscriptionInfo(response.data.data);

        // Si le plan a une limite (pas illimité)
        if (response.data.data.limit !== 'Illimité') {
          setRidesRemaining(response.data.data.remaining);

          // Afficher un toast d'avertissement si le quota est faible
          if (response.data.data.remaining <= 3 && response.data.data.remaining > 0) {
            showToast(
              language === 'fr' ? `⚠️ Il vous reste ${response.data.data.remaining} courses sur votre forfait ${response.data.data.plan}` :
                language === 'mg' ? `⚠️ Mbola ${response.data.data.remaining} course sisa amin'ny fonosana ${response.data.data.plan}` :
                  `⚠️ You have ${response.data.data.remaining} rides left on your ${response.data.data.plan} plan`,
              false
            );
          }

          // Si le quota est épuisé, bloquer la création
          if (response.data.data.remaining <= 0) {
            showToast(
              language === 'fr' ? '❌ Vous avez atteint votre limite de courses mensuelle. Passez à un forfait supérieur.' :
                language === 'mg' ? '❌ Efa tonga fetran\'ny course isam-bolana. Mividy fonosana ambony.' :
                  '❌ You have reached your monthly ride limit. Upgrade your plan.',
              true
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur récupération quota:', error);
    } finally {
      setLoadingQuota(false);
    }
  };

  // Ajoutez cette fonction vers la ligne 550
  const checkQuotaBeforeSubmit = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/abonnements/quota`);

      if (response.data.success) {
        const data = response.data.data;

        // Si le plan a une limite (pas illimité)
        if (data.limit !== 'Illimité') {
          if (data.remaining <= 0) {
            showToast(
              language === 'fr' ? '❌ Vous avez atteint votre limite de courses mensuelle. Passez à un forfait supérieur.' :
                language === 'mg' ? '❌ Efa tonga fetran\'ny course isam-bolana. Mividy fonosana ambony.' :
                  '❌ You have reached your monthly ride limit. Upgrade your plan.',
              true
            );
            return false;
          }

          if (data.remaining === 1) {
            showToast(
              language === 'fr' ? '⚠️ Attention: C\'est votre dernière course du mois!' :
                language === 'mg' ? '⚠️ Fampitandremana: Ity no course farany amin\'ity volana ity!' :
                  '⚠️ Warning: This is your last ride of the month!',
              false
            );
          }
        }
        return true;
      }
      return true;
    } catch (error) {
      console.error('❌ Erreur vérification quota:', error);
      return true; // En cas d'erreur, on laisse passer par sécurité
    }
  };

  // ==================== EFFETS ====================
  useEffect(() => {
    loadFormData();
    loadHeatmapData();
    fetchSubscriptionQuota();
  }, []);

  useEffect(() => {
    if (activeTab === 'course' && clientStepCompleted) {
      const getFormattedTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
      };

      setNewCourse(prev => ({
        ...prev,
        Heure_depart: getFormattedTime()
      }));

      const intervalId = setInterval(() => {
        const newTime = getFormattedTime();
        setNewCourse(prev => ({
          ...prev,
          Heure_depart: newTime
        }));
      }, 60000);

      const timer = setTimeout(() => {
        prefillDriverAndCar();
      }, 500);

      return () => {
        clearTimeout(timer);
        clearInterval(intervalId);
      };
    }
  }, [activeTab, clientStepCompleted]);

  useEffect(() => {
    if (departurePosition && arrivalPosition) {
      calculateRoute();
    } else {
      setRoutePath([]);
      setDistanceInfo(null);
      setRouteDetails(null);
    }
  }, [departurePosition, arrivalPosition]);

  // ==================== FONCTIONS CRÉATION AUTO ZONE ====================
  const getZoneNameFromPosition = async (position, type) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=16&addressdetails=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          const address = data.address;

          if (address.road && address.city) {
            return `${address.road}, ${address.city}`;
          }
          if (address.quarter) {
            return address.quarter;
          }
          if (address.suburb) {
            return address.suburb;
          }
          if (address.neighbourhood) {
            return address.neighbourhood;
          }
          if (address.city) {
            return address.city;
          }
          if (address.town) {
            return address.town;
          }
          if (address.village) {
            return address.village;
          }
        }
      }
    } catch (error) {
      console.log('Géocodage échoué:', error);
    }

    const prefix = type === 'departure' ? 'Départ' : 'Arrivée';
    return `${prefix} ${position.lat.toFixed(4)},${position.lng.toFixed(4)}`;
  };

  const createZoneIfNotExists = async (position, zoneName) => {
    setZoneCreating(true);
    try {
      console.log('🔄 Création auto zone:', { zoneName, position });

      // Vérifier par nom
      const existingZoneByName = formData.zones?.find(zone =>
        zone.Nom && zone.Nom.toLowerCase() === zoneName.toLowerCase()
      );

      if (existingZoneByName) {
        console.log('✅ Zone existe déjà par nom:', existingZoneByName.Nom);
        return existingZoneByName.zone_ID;
      }

      // Vérifier par proximité (100m)
      const existingByProximity = formData.zones?.find(zone => {
        const latDiff = Math.abs(zone.Latitude - position.lat);
        const lngDiff = Math.abs(zone.Longitude - position.lng);
        return latDiff < 0.001 && lngDiff < 0.001;
      });

      if (existingByProximity) {
        console.log('✅ Zone existe déjà par proximité:', existingByProximity.Nom);
        return existingByProximity.zone_ID;
      }

      // Créer la nouvelle zone
      const zoneData = {
        Nom: zoneName,
        Latitude: position.lat,
        Longitude: position.lng
      };

      console.log('📤 Envoi création zone:', zoneData);

      let response;
      try {
        response = await axios.post(`${import.meta.env.VITE_API_URL}/apiZone/ajouterZone`, zoneData);
      } catch (error) {
        // Essayer avec l'autre format
        const zoneDataAlt = {
          nom: zoneName,
          latitude: position.lat,
          longitude: position.lng
        };
        response = await axios.post(`${import.meta.env.VITE_API_URL}/apiZone/ajouterZone`, zoneDataAlt);
      }

      if (response.data && response.data.id) {
        console.log('✅ Zone créée avec ID:', response.data.id);

        // Ajouter aux zones locales
        const updatedZones = [...formData.zones, {
          zone_ID: response.data.id,
          Nom: zoneName,
          Latitude: position.lat,
          Longitude: position.lng
        }];

        setFormData(prev => ({ ...prev, zones: updatedZones }));

        showToast(
          language === 'fr' ? `Zone "${zoneName}" créée automatiquement` :
            language === 'mg' ? `Faritra "${zoneName}" noforonina ho azy` :
              `Zone "${zoneName}" created automatically`
        );

        return response.data.id;
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur création auto zone:', error);
      showToast(
        language === 'fr' ? 'Erreur lors de la création de la zone' :
          language === 'mg' ? 'Hadisoana rehefa mamorona faritra' :
            'Error creating zone',
        true
      );
      return null;
    } finally {
      setZoneCreating(false);
    }
  };

  // ==================== FONCTIONS ITINÉRAIRE ====================
  const calculateRoute = async () => {
    if (!departurePosition || !arrivalPosition) return;

    setRouteCalculating(true);
    try {
      // Récupérer les IDs et noms de zone
      const zoneDepartId = newCourse.zone_depart_ID;
      const zoneArriverId = newCourse.zone_arriver_ID;

      const info = await calculateDistanceAndPrice(
        departurePosition,
        arrivalPosition,
        zoneDepartId,
        zoneArriverId,
        zoneDepartName,
        zoneArriverName
      );

      if (info) {
        setDistanceInfo(info);

        // Afficher l'itinéraire seulement si pas d'exact match
        if (!info.historicalData?.exactMatch) {
          setRoutePath(info.routeCoordinates);
        } else {
          setRoutePath([]); // Pas de tracé pour les matches exacts
        }

        setRouteDetails(info);

        // Afficher un message spécifique
        if (info.historicalData?.hasHistory) {
          if (info.historicalData.exactMatch) {
            showToast(
              language === 'fr' ? `✅ Course identique trouvée! Tarif: ${info.estimatedPrice.toLocaleString()} Ar` :
                language === 'mg' ? `✅ Course mitovy hita! Vidiny: ${info.estimatedPrice.toLocaleString()} Ar` :
                  `✅ Identical course found! Rate: ${info.estimatedPrice.toLocaleString()} Ar`
            );
          } else {
            showToast(
              language === 'fr' ? `💰 ${info.historicalData.count} courses similaires trouvées` :
                language === 'mg' ? `💰 ${info.historicalData.count} course mitovy hita` :
                  `💰 ${info.historicalData.count} similar courses found`
            );
          }
        }

        // Suggérer automatiquement le prix
        if (!newCourse.Tarif_proposer_client || parseFloat(newCourse.Tarif_proposer_client) < 7000) {
          setNewCourse(prev => ({
            ...prev,
            Tarif_proposer_client: info.estimatedPrice.toString()
          }));
        }
      }
    } catch (error) {
      console.error('Erreur calcul itinéraire:', error);
      showToast(
        language === 'fr' ? 'Erreur lors du calcul de l\'itinéraire' :
          language === 'mg' ? 'Hadisoana rehefa mikajy ny lalana' :
            'Error calculating route',
        true
      );
    } finally {
      setRouteCalculating(false);
    }
  };

  const recalculateRoute = () => {
    if (departurePosition && arrivalPosition) {
      calculateRoute();
      showToast(
        language === 'fr' ? 'Recalcul de l\'itinéraire...' :
          language === 'mg' ? 'Mamerina mikajy ny lalana...' :
            'Recalculating route...'
      );
    }
  };

  // ==================== FONCTIONS CLIENT ====================
  const extractPhoneNumber = (phoneString, countryDialCode) => {
    if (!phoneString) return '';
    let cleaned = phoneString.replace(countryDialCode, '');
    cleaned = cleaned.replace(/\D/g, '');
    return cleaned;
  };

  const handleClientInputChange = (e) => {
    const { name, value } = e.target;

    let formattedValue = value;

    if (name === 'Telephone_client') {
      formattedValue = value.replace(/\D/g, '');

      if (searchTimer) {
        clearTimeout(searchTimer);
      }

      if (formattedValue.length >= 3) {
        setIsSearching(true);
        const timer = setTimeout(() => {
          searchClientsByPhone(formattedValue);
        }, 400);
        setSearchTimer(timer);
      } else {
        setClientSuggestions([]);
        setSelectedClientId(null);
        setIsSearching(false);
        setNameSuggestions([]);
        setShowNameDropdown(false);
      }
    } else if (name === 'Nom_client') {
      if (selectedClientId) {
        setSelectedClientId(null);
        setNewCourse(prev => ({ ...prev, client_ID: '' }));
      }
    }

    setClient(prevState => ({
      ...prevState,
      [name]: formattedValue
    }));

    if (clientErrors[name]) {
      setClientErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const searchClientsByPhone = async (phone) => {
    try {
      if (!phone || phone.length < 3) {
        setClientSuggestions([]);
        setSelectedClientId(null);
        setNameSuggestions([]);
        setShowNameDropdown(false);
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/rechercherClientsParTelephone`, {
        params: { telephone: phone }
      });

      if (response.data && response.data.length > 0) {
        const suggestions = response.data;
        setClientSuggestions(suggestions);

        const nameSuggestionsList = suggestions.map(client => ({
          id: client.client_ID,
          nom: client.Nom_client,
          telephone: client.Telephone_client
        }));

        setNameSuggestions(nameSuggestionsList);
        setShowNameDropdown(true);

        const exactMatches = suggestions.filter(suggestion => {
          const clientPhoneClean = suggestion.Telephone_client.replace(/\D/g, '');
          const searchedPhoneClean = phone.replace(/\D/g, '');
          return clientPhoneClean.endsWith(searchedPhoneClean);
        });

        if (exactMatches.length === 1) {
          const exactMatch = exactMatches[0];
          handleClientSelect(exactMatch);
        }

      } else {
        setClientSuggestions([]);
        setSelectedClientId(null);
        setNameSuggestions([]);
        setShowNameDropdown(false);
      }
    } catch (error) {
      console.error('❌ Erreur recherche clients:', error);
      setClientSuggestions([]);
      setNameSuggestions([]);
      setShowNameDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClientSelect = (selectedClient) => {
    const currentCountry = getCurrentCountry();

    const phoneWithoutPrefix = extractPhoneNumber(selectedClient.Telephone_client, currentCountry.dialCode);

    setClient({
      Nom_client: selectedClient.Nom_client,
      Telephone_client: phoneWithoutPrefix
    });

    setClientSuggestions([]);
    setSelectedClientId(selectedClient.client_ID);
    setNameSuggestions([]);
    setShowNameDropdown(false);

    setNewCourse(prev => ({
      ...prev,
      client_ID: selectedClient.client_ID.toString()
    }));
  };

  const handleNameSelect = (selectedName) => {
    setClient(prev => ({
      ...prev,
      Nom_client: selectedName.nom
    }));

    const selectedClient = clientSuggestions.find(client =>
      client.client_ID === selectedName.id
    );

    if (selectedClient) {
      handleClientSelect(selectedClient);
    }

    setShowNameDropdown(false);
  };

  const handleCountrySelect = (countryCode) => {
    setSelectedCountry(countryCode);
    setShowCountryDropdown(false);
    setCountrySearch('');

    if (client.Telephone_client && client.Telephone_client.length >= 3) {
      searchClientsByPhone(client.Telephone_client);
    }
  };

  const loadHeatmapData = async () => {
    try {
      setMapLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/heatmap`);
      if (response.data.success) {
        setHeatmapData(response.data.data);
      }
    } catch (error) {
      console.error('❌ Erreur chargement heatmap:', error);
      setHeatmapData([
        { zone: "Analakely", latitude: -18.9100, longitude: 47.5250, demand: 85 },
        { zone: "Ivandry", latitude: -18.8800, longitude: 47.5300, demand: 65 },
        { zone: "Antanimena", latitude: -18.8900, longitude: 47.5150, demand: 45 },
        { zone: "Anosy", latitude: -18.9200, longitude: 47.5150, demand: 35 },
      ]);
    } finally {
      setMapLoading(false);
    }
  };

  const handleMapClick = async (latlng) => {
    if (selectedZoneType === 'departure') {
      setDeparturePosition(latlng);

      // Obtenir un nom pour la zone
      const zoneName = await getZoneNameFromPosition(latlng, 'departure');
      setZoneDepartName(zoneName);

      // Créer automatiquement la zone si elle n'existe pas
      const zoneId = await createZoneIfNotExists(latlng, zoneName);

      if (zoneId) {
        setNewCourse(prev => ({
          ...prev,
          zone_depart_ID: zoneId.toString()
        }));
      } else {
        findNearestZone(latlng, 'departure');
      }

    } else {
      setArrivalPosition(latlng);

      // Obtenir un nom pour la zone
      const zoneName = await getZoneNameFromPosition(latlng, 'arrival');
      setZoneArriverName(zoneName);

      // Créer automatiquement la zone si elle n'existe pas
      const zoneId = await createZoneIfNotExists(latlng, zoneName);

      if (zoneId) {
        setNewCourse(prev => ({
          ...prev,
          zone_arriver_ID: zoneId.toString()
        }));
      } else {
        findNearestZone(latlng, 'arrival');
      }
    }
  };

  const findNearestZone = (position, type) => {
    if (!heatmapData.length) return;

    let nearestZone = null;
    let minDistance = Infinity;

    heatmapData.forEach(zone => {
      const distance = Math.sqrt(
        Math.pow(zone.latitude - position.lat, 2) +
        Math.pow(zone.longitude - position.lng, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = zone;
      }
    });

    if (nearestZone && minDistance < 0.01) {
      if (type === 'departure') {
        setZoneDepartName(nearestZone.zone);
        const zone = formData.zones?.find(z => z.Nom === nearestZone.zone);
        if (zone) {
          setNewCourse(prev => ({
            ...prev,
            zone_depart_ID: zone.zone_ID.toString()
          }));
        }
      } else {
        setZoneArriverName(nearestZone.zone);
        const zone = formData.zones?.find(z => z.Nom === nearestZone.zone);
        if (zone) {
          setNewCourse(prev => ({
            ...prev,
            zone_arriver_ID: zone.zone_ID.toString()
          }));
        }
      }
    }
  };

  const handleZoneSelect = async (zone, type) => {
    const position = { lat: zone.latitude, lng: zone.longitude };

    if (type === 'departure') {
      setDeparturePosition(position);
      setZoneDepartName(zone.zone);

      // Vérifier si la zone existe dans formData
      let foundZone = formData.zones?.find(z => z.Nom === zone.zone);

      if (!foundZone) {
        // Créer la zone si elle n'existe pas
        const zoneId = await createZoneIfNotExists(position, zone.zone);
        if (zoneId) {
          setNewCourse(prev => ({
            ...prev,
            zone_depart_ID: zoneId.toString()
          }));
          return;
        }
      }

      if (foundZone) {
        setNewCourse(prev => ({
          ...prev,
          zone_depart_ID: foundZone.zone_ID.toString()
        }));
      }
    } else {
      setArrivalPosition(position);
      setZoneArriverName(zone.zone);

      // Vérifier si la zone existe dans formData
      let foundZone = formData.zones?.find(z => z.Nom === zone.zone);

      if (!foundZone) {
        // Créer la zone si elle n'existe pas
        const zoneId = await createZoneIfNotExists(position, zone.zone);
        if (zoneId) {
          setNewCourse(prev => ({
            ...prev,
            zone_arriver_ID: zoneId.toString()
          }));
          return;
        }
      }

      if (foundZone) {
        setNewCourse(prev => ({
          ...prev,
          zone_arriver_ID: foundZone.zone_ID.toString()
        }));
      }
    }
  };

  // ==================== FONCTIONS PRÉREMPLISSAGE ====================

  const prefillDriverAndCar = async () => {
    try {
      console.log('🚗 Préremplissage chauffeur et véhicule...');

      // Récupérer l'ID du chauffeur connecté depuis différentes sources possibles
      let chauffeurId = localStorage.getItem('chauffeur_id');

      if (!chauffeurId) {
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            chauffeurId = user.id || user.chauffeur_ID || user.userId;
          } catch (e) {
            console.error('❌ Erreur parsing user:', e);
          }
        }
      }

      if (!chauffeurId) {
        console.log('❌ Aucun ID chauffeur trouvé');
        return;
      }

      console.log('🆔 Chauffeur ID trouvé:', chauffeurId);

      // Récupérer le token
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('❌ Aucun token trouvé');
        showToast(
          language === 'fr' ? 'Session expirée. Veuillez vous reconnecter.' :
            language === 'mg' ? 'Lasa ny session. Mba midira indray.' :
              'Session expired. Please login again.',
          true
        );
        return;
      }

      console.log('🔑 Token trouvé, envoi requête avec authentification...');

      // Faire la requête avec le token dans les headers
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/apiCourse/chauffeur-vehicule-disponibles`, {
        params: {
          chauffeurId: chauffeurId
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Réponse reçue:', response.data);

      if (response.data) {
        const { chauffeur, voiture } = response.data;

        if (chauffeur) {
          setNewCourse(prev => ({
            ...prev,
            chauffeur_ID: chauffeur.chauffeur_ID?.toString() || ''
          }));
          console.log('✅ Chauffeur prérempli:', chauffeur.Nom);
        }

        if (voiture) {
          setNewCourse(prev => ({
            ...prev,
            voiture_ID: voiture.voiture_ID?.toString() || ''
          }));
          console.log('✅ Voiture préremplie:', voiture.Marque);
        }
      }
    } catch (error) {
      console.error('❌ Erreur préremplissage:', error);

      // Gestion spécifique des erreurs
      if (error.response) {
        if (error.response.status === 401) {
          console.error('❌ Erreur 401: Non autorisé - Token invalide ou expiré');
          showToast(
            language === 'fr' ? 'Session expirée. Veuillez vous reconnecter.' :
              language === 'mg' ? 'Lasa ny session. Mba midira indray.' :
                'Session expired. Please login again.',
            true
          );

          // Rediriger vers login après un délai
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else if (error.response.status === 404) {
          console.error('❌ Chauffeur ou véhicule non trouvé');
        } else {
          showToast(
            language === 'fr' ? `Erreur: ${error.response.data?.message || 'Inconnue'}` :
              language === 'mg' ? `Hadisoana: ${error.response.data?.message || 'Tsy fantatra'}` :
                `Error: ${error.response.data?.message || 'Unknown'}`,
            true
          );
        }
      } else if (error.request) {
        console.error('❌ Pas de réponse du serveur');
        showToast(
          language === 'fr' ? 'Impossible de contacter le serveur' :
            language === 'mg' ? 'Tsy afaka mifandray amin\'ny serveur' :
              'Cannot reach server',
          true
        );
      }
    }
  };

  const validateClientForm = () => {
    const newErrors = {};
    const currentCountry = getCurrentCountry();

    if (!client.Nom_client || !client.Nom_client.trim()) {
      newErrors.Nom_client = t.validation?.nameRequired ||
        (language === 'mg' ? 'Anarana ilaina' : 'Le nom est requis');
    } else if (client.Nom_client.trim().length < 2) {
      newErrors.Nom_client = t.validation?.nameMinLength ||
        (language === 'mg' ? 'Anarana tokony ho 2 farany' : 'Le nom doit contenir au moins 2 caractères');
    }

    if (!client.Telephone_client || !client.Telephone_client.trim()) {
      newErrors.Telephone_client = t.validation?.phoneRequired ||
        (language === 'mg' ? 'Finday ilaina' : 'Le téléphone est requis');
    } else {
      const phoneRegex = getPhoneRegex(currentCountry.code);
      if (!phoneRegex.test(client.Telephone_client)) {
        newErrors.Telephone_client = t.phoneErrors?.[currentCountry.code] || t.phoneErrors?.default ||
          (language === 'mg' ? 'Finday tsy mety' : 'Numéro de téléphone invalide');
      }
    }

    setClientErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();

    if (!validateClientForm()) {
      showToast(
        language === 'fr' ? 'Veuillez corriger les erreurs' :
          language === 'mg' ? 'Hanitsy ny fahadisoana' :
            'Please correct the errors',
        true
      );
      return;
    }

    setLoading(true);

    try {
      if (selectedClientId) {
        setClientStepCompleted(true);
        setActiveTab('course');
        setLoading(false);
        return;
      }

      const clientData = {
        Nom_client: client.Nom_client.trim(),
        Telephone_client: getFullPhoneNumber()
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/ajouterClient`, clientData);

      setNewCourse(prev => ({
        ...prev,
        client_ID: response.data.client_ID.toString()
      }));

      setSelectedClientId(response.data.client_ID);
      setClientStepCompleted(true);
      setActiveTab('course');
      showToast(
        language === 'fr' ? 'Client créé avec succès' :
          language === 'mg' ? 'Mpanjifa noforonina soa aman-tsara' :
            'Client created successfully'
      );

    } catch (error) {
      console.error('❌ Erreur ajout client:', error);
      let errorMessage =
        language === 'fr' ? 'Erreur lors de l\'ajout du client' :
          language === 'mg' ? 'Hadisoana rehefa manampy mpanjifa' :
            'Error adding client';

      if (error.response?.status === 409) {
        errorMessage =
          language === 'fr' ? 'Un client avec ce numéro existe déjà' :
            language === 'mg' ? 'Efa misy mpanjifa manana io laharana io' :
              'A client with this number already exists';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      showToast(errorMessage, true);
    } finally {
      setLoading(false);
    }
  };

  // ==================== FONCTIONS COURSE ====================
  const loadFormData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/apiCourse/course-form-data`);

      // Transformer les données clients pour utiliser les bons champs
      const formattedData = {
        ...response.data,
        clients: (response.data.clients || []).map(client => ({
          ...client,
          client_ID: client.client_ID,
          Nom_client: client.Nom_client || client.Nom || client.nom || 'Client sans nom'
        }))
      };

      setFormData(formattedData);
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      showToast(
        language === 'fr' ? 'Erreur lors du chargement des données' :
          language === 'mg' ? 'Hadisoana rehefa mampiditra angona' :
            'Error loading data',
        true
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCourseInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'Tarif_final_accepter') {
      processedValue = value === '' ? null : parseFloat(value);

      if (processedValue !== null && newCourse.Tarif_proposer_client && processedValue > parseFloat(newCourse.Tarif_proposer_client)) {
        setCourseErrors(prev => ({
          ...prev,
          Tarif_final_accepter:
            language === 'fr' ? 'Le tarif final ne peut pas être supérieur au tarif proposé' :
              language === 'mg' ? 'Ny vidiny farany tsy afaka mihoatra noho ny vidiny nolalorana' :
                'Final rate cannot be higher than proposed rate'
        }));
      } else if (courseErrors.Tarif_final_accepter) {
        setCourseErrors(prev => ({ ...prev, Tarif_final_accepter: '' }));
      }

    } else if (name === 'Tarif_proposer_client') {
      processedValue = value === '' ? '' : value;

      if (courseErrors.Tarif_proposer_client) {
        setCourseErrors(prev => ({ ...prev, Tarif_proposer_client: '' }));
      }

      if (newCourse.Tarif_final_accepter && value !== '' && newCourse.Tarif_final_accepter > parseFloat(value)) {
        setCourseErrors(prev => ({
          ...prev,
          Tarif_final_accepter:
            language === 'fr' ? 'Le tarif final ne peut pas être supérieur au tarif proposé' :
              language === 'mg' ? 'Ny vidiny farany tsy afaka mihoatra noho ny vidiny nolalorana' :
                'Final rate cannot be higher than proposed rate'
        }));
      } else if (courseErrors.Tarif_final_accepter) {
        setCourseErrors(prev => ({ ...prev, Tarif_final_accepter: '' }));
      }

    } else if (name === 'Evenement_special') {
      processedValue = value === 'Aucun' ? null : value;
    } else if (name === 'Temps_attente_avant_acceptation') {
      processedValue = value === '' ? 0 : parseInt(value);
    }

    setNewCourse(prev => ({
      ...prev,
      [name]: processedValue
    }));

    if (courseErrors[name] && !['Tarif_final_accepter', 'Tarif_proposer_client'].includes(name)) {
      setCourseErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateCourseForm = () => {
    const newErrors = {};

    if (!newCourse.client_ID) newErrors.client_ID =
      language === 'fr' ? 'Client requis' :
        language === 'mg' ? 'Mpanjifa ilaina' :
          'Client required';

    if (!newCourse.chauffeur_ID) newErrors.chauffeur_ID =
      language === 'fr' ? 'Chauffeur requis' :
        language === 'mg' ? 'Mpamily ilaina' :
          'Driver required';

    if (!newCourse.voiture_ID) newErrors.voiture_ID =
      language === 'fr' ? 'Voiture requise' :
        language === 'mg' ? 'Fiara ilaina' :
          'Car required';

    if (!departurePosition) {
      newErrors.departure =
        language === 'fr' ? 'Veuillez sélectionner un point de départ sur la carte' :
          language === 'mg' ? 'Mba safidio toerana fiaingana eo amin\'ny sarintany' :
            'Please select a departure point on the map';
    }

    if (!arrivalPosition) {
      newErrors.arrival =
        language === 'fr' ? 'Veuillez sélectionner un point d\'arrivée sur la carte' :
          language === 'mg' ? 'Mba safidio toerana fahatongavana eo amin\'ny sarintany' :
            'Please select an arrival point on the map';
    }

    if (!newCourse.Tarif_proposer_client || newCourse.Tarif_proposer_client === '') {
      newErrors.Tarif_proposer_client =
        language === 'fr' ? 'Le tarif proposé est requis' :
          language === 'mg' ? 'Ny vidiny nolalorana dia ilaina' :
            'Proposed rate is required';
    } else if (parseFloat(newCourse.Tarif_proposer_client) < 7000) {
      newErrors.Tarif_proposer_client =
        language === 'fr' ? 'Le tarif minimum est de 7000 Ar' :
          language === 'mg' ? 'Ny vidiny farafahakeliny dia 7000 Ar' :
            'Minimum rate is 7000 Ar';
    }

    setCourseErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();

    if (!validateCourseForm()) {
      showToast(
        language === 'fr' ? 'Veuillez corriger les erreurs' :
          language === 'mg' ? 'Hanitsy ny fahadisoana' :
            'Please correct the errors',
        true
      );
      return;
    }

    setSaving(true);
    try {
      // ÉTAPE 1: Vérifier le quota AVANT de faire quoi que ce soit d'autre
      const canProceed = await checkQuotaBeforeSubmit();
      if (!canProceed) {
        setSaving(false);
        return;
      }

      // ÉTAPE 2: Vérifier et créer les zones si nécessaire
      let zoneDepartId = newCourse.zone_depart_ID;
      let zoneArriverId = newCourse.zone_arriver_ID;

      // Si le départ n'a pas d'ID mais a une position, créer la zone
      if (!zoneDepartId && departurePosition && zoneDepartName) {
        console.log('🔄 Création auto zone départ...');
        const zoneId = await createZoneIfNotExists(departurePosition, zoneDepartName);
        if (zoneId) {
          zoneDepartId = zoneId.toString();
          console.log('✅ Zone départ créée avec ID:', zoneId);
        }
      }

      // Si l'arrivée n'a pas d'ID mais a une position, créer la zone
      if (!zoneArriverId && arrivalPosition && zoneArriverName) {
        console.log('🔄 Création auto zone arrivée...');
        const zoneId = await createZoneIfNotExists(arrivalPosition, zoneArriverName);
        if (zoneId) {
          zoneArriverId = zoneId.toString();
          console.log('✅ Zone arrivée créée avec ID:', zoneId);
        }
      }

      // ÉTAPE 3: Préparer les données de la course
      const courseData = {
        ...newCourse,
        client_ID: parseInt(newCourse.client_ID),
        chauffeur_ID: parseInt(newCourse.chauffeur_ID),
        voiture_ID: parseInt(newCourse.voiture_ID),
        zone_depart_ID: zoneDepartId ? parseInt(zoneDepartId) : null,
        zone_arriver_ID: zoneArriverId ? parseInt(zoneArriverId) : null,
        Tarif_proposer_client: parseFloat(newCourse.Tarif_proposer_client),
        Tarif_final_accepter: newCourse.Tarif_final_accepter ? parseFloat(newCourse.Tarif_final_accepter) : null,
        Temps_attente_avant_acceptation: parseInt(newCourse.Temps_attente_avant_acceptation) || 0
      };

      console.log('📤 Envoi création course:', courseData);

      // ÉTAPE 4: Envoyer la requête
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/apiCourse/ajouterCourse`, courseData);

      showToast(
        language === 'fr' ? 'Course créée avec succès!' :
          language === 'mg' ? 'Course noforonina soa aman-tsara!' :
            'Course created successfully!'
      );

      setTimeout(() => {
        navigate('/course/affichage-courses');
      }, 1500);

    } catch (error) {
      console.error('❌ Erreur création course:', error);

      // Gestion spécifique des erreurs
      if (error.response?.status === 401) {
        showToast(
          language === 'fr' ? 'Session expirée. Veuillez vous reconnecter.' :
            language === 'mg' ? 'Lasa ny session. Mba midira indray.' :
              'Session expired. Please login again.',
          true
        );

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const errorMessage = error.response?.data?.error || error.message ||
          (language === 'fr' ? 'Erreur lors de la création de la course' :
            language === 'mg' ? 'Hadisoana rehefa mamorona course' :
              'Error creating course');
        showToast(errorMessage, true);
      }
    } finally {
      setSaving(false);
    }
  };

  // ==================== FONCTIONS UTILITAIRES ====================
  const showToast = (message, isError = false) => {
    setSuccessMessage(isError ? `❌ ${message}` : `✅ ${message}`);
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000);
  };

  const getCurrentCountry = () => {
    return countries.find(country => country.code === selectedCountry) || countries[0];
  };

  const getPhoneRegex = (countryCode) => {
    const regexMap = {
      'MG': /^[3][2-8]\d{7}$/,
      'FR': /^[1-9]\d{8}$/,
      'US': /^\d{10}$/,
    };
    return regexMap[countryCode] || /^\d{6,15}$/;
  };

  const getFullPhoneNumber = () => {
    const currentCountry = getCurrentCountry();
    return currentCountry.dialCode + client.Telephone_client;
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getPhonePlaceholder = () => {
    const currentCountry = getCurrentCountry();
    const placeholders = {
      'MG': '321234567',
      'FR': '612345678',
      'US': '5551234567',
    };
    return placeholders[currentCountry.code] ||
      (language === 'mg' ? 'Ohatra: 321234567' : 'Ex: 321234567');
  };

  const getHeatmapColor = (demand) => {
    if (demand >= 80) return '#ff4444';
    if (demand >= 60) return '#ffaa00';
    if (demand >= 40) return '#ffff00';
    return '#aaff00';
  };

  const getHeatmapRadius = (demand) => {
    return Math.sqrt(demand) * 80;
  };

  // ==================== RENDU ====================
  const renderRouteDetails = () => {
    if (!routeDetails || !showRouteDetails) return null;

    return (
      <div className="route-details-panel">
        <div className="route-details-header">
          <h4>
            <FaDirections className="details-icon" />
            {language === 'fr' ? 'Détails de l\'itinéraire' :
              language === 'mg' ? 'Detailin\'ny lalana' :
                'Route details'}
          </h4>
          <button
            className="close-details"
            onClick={() => setShowRouteDetails(false)}
          >
            ×
          </button>
        </div>

        <div className="route-summary">
          <div className="summary-item">
            <FaRoad className="summary-icon" />
            <div className="summary-content">
              <div className="summary-label">
                {language === 'fr' ? 'Distance totale' :
                  language === 'mg' ? 'Halaviana totaly' :
                    'Total distance'}
              </div>
              <div className="summary-value">{routeDetails.distance} km</div>
            </div>
          </div>

          <div className="summary-item">
            <FaClock className="summary-icon" />
            <div className="summary-content">
              <div className="summary-label">
                {language === 'fr' ? 'Durée estimée' :
                  language === 'mg' ? 'Fotoana vinavinaina' :
                    'Estimated duration'}
              </div>
              <div className="summary-value">{routeDetails.duration} min</div>
            </div>
          </div>

          {routeDetails.routeSteps && routeDetails.routeSteps.length > 0 && (
            <div className="route-instructions">
              <h5>
                {language === 'fr' ? 'Instructions de conduite' :
                  language === 'mg' ? 'Torolalana fitondrana' :
                    'Driving instructions'}
              </h5>
              <div className="instructions-list">
                {routeDetails.routeSteps.slice(0, 5).map((step, index) => (
                  <div key={index} className="instruction-item">
                    <div className="instruction-number">{index + 1}</div>
                    <div className="instruction-text">
                      <div className="instruction-main">{step.instruction}</div>
                      <div className="instruction-sub">
                        {step.distance} km • {step.duration} min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMapSection = () => (
    <div className="heatmap-section">
      <div className="map-instructions">
        <FaMapMarkerAlt className="instruction-icon" />
        <span>
          {selectedZoneType === 'departure'
            ? (language === 'fr' ? 'Cliquez sur la carte ou sélectionnez une zone pour le départ' :
              language === 'mg' ? 'Tsindrio eo amin\'ny sarintany na safidio faritra ho an\'ny fiaingana' :
                'Click on the map or select a zone for departure')
            : (language === 'fr' ? 'Cliquez sur la carte ou sélectionnez une zone pour l\'arrivée' :
              language === 'mg' ? 'Tsindrio eo amin\'ny sarintany na safidio faritra ho an\'ny fahatongavana' :
                'Click on the map or select a zone for arrival')
          }
        </span>
      </div>

      <div className="map-controls">
        <button
          className={`zone-select-btn ${selectedZoneType === 'departure' ? 'active' : ''}`}
          onClick={() => setSelectedZoneType('departure')}
        >
          <FaLocationArrow />
          {language === 'fr' ? 'Départ' :
            language === 'mg' ? 'Fiaingana' :
              'Departure'}
          {departurePosition && <FaCheck className="selection-indicator" />}
        </button>
        <button
          className={`zone-select-btn ${selectedZoneType === 'arrival' ? 'active' : ''}`}
          onClick={() => setSelectedZoneType('arrival')}
        >
          <FaMapMarkerAlt />
          {language === 'fr' ? 'Arrivée' :
            language === 'mg' ? 'Fahatongavana' :
              'Arrival'}
          {arrivalPosition && <FaCheck className="selection-indicator" />}
        </button>

        {departurePosition && arrivalPosition && (
          <button
            className="recalculate-route-btn"
            onClick={recalculateRoute}
            disabled={routeCalculating}
          >
            <FaSyncAlt className={`${routeCalculating ? 'spinning' : ''}`} />
            {language === 'fr' ? 'Recalculer' :
              language === 'mg' ? 'Mamerina mikajy' :
                'Recalculate'}
          </button>
        )}
      </div>

      {courseErrors.departure && <div className="error-message map-error">{courseErrors.departure}</div>}
      {courseErrors.arrival && <div className="error-message map-error">{courseErrors.arrival}</div>}

      {mapLoading ? (
        <div className="map-loading">
          <FaSpinner className="spinner" />
          <span>{language === 'fr' ? 'Chargement de la carte...' :
            language === 'mg' ? 'Mampiditra sarintany...' :
              'Loading map...'}</span>
        </div>
      ) : (
        <div className="map-container-wrapper">
          {zoneCreating && (
            <div className="zone-creating-overlay">
              <FaSpinner className="spinner" />
              <span>
                {language === 'fr' ? 'Création de la zone en cours...' :
                  language === 'mg' ? 'Mamorona faritra...' :
                    'Creating zone...'}
              </span>
            </div>
          )}
          <MapContainer
            center={[-18.8792, 47.5079]}
            zoom={14}
            style={{ height: '400px', width: '100%', borderRadius: '8px' }}
            className="course-map"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <MapEventHandler onMapClick={handleMapClick} />

            {/* Heatmap des zones */}
            {heatmapData.map((zone, index) => (
              <Circle
                key={index}
                center={[zone.latitude, zone.longitude]}
                radius={getHeatmapRadius(zone.demand)}
                pathOptions={{
                  fillColor: getHeatmapColor(zone.demand),
                  color: '#333',
                  weight: 1,
                  opacity: 0.5,
                  fillOpacity: 0.3
                }}
                eventHandlers={{
                  click: () => handleZoneSelect(zone, selectedZoneType)
                }}
              >
                <Popup>
                  <div className="heatmap-popup">
                    <h4>{zone.zone}</h4>
                    <div className="popup-info">
                      <div className="popup-stat">
                        <strong>{language === 'fr' ? 'Demande:' :
                          language === 'mg' ? 'Fangatahana:' :
                            'Demand:'}</strong> {zone.demand}%
                      </div>
                    </div>
                    <button
                      className="btn-use-zone"
                      onClick={() => handleZoneSelect(zone, selectedZoneType)}
                    >
                      {language === 'fr' ? 'Sélectionner' :
                        language === 'mg' ? 'Safidio' :
                          'Select'} {selectedZoneType === 'departure' ?
                            (language === 'fr' ? 'pour départ' : language === 'mg' ? 'ho an\'ny fiaingana' : 'for departure') :
                            (language === 'fr' ? 'pour arrivée' : language === 'mg' ? 'ho an\'ny fahatongavana' : 'for arrival')}
                    </button>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Marqueur de départ */}
            {departurePosition && (
              <Marker position={departurePosition} icon={departureIcon}>
                <Popup>
                  <div className="position-popup">
                    <h4>📍 {language === 'fr' ? 'Départ' : language === 'mg' ? 'Fiaingana' : 'Departure'}</h4>
                    <div className="coordinates">
                      <div>Lat: {departurePosition.lat.toFixed(6)}</div>
                      <div>Lng: {departurePosition.lng.toFixed(6)}</div>
                    </div>
                    {zoneDepartName && <div className="zone-name">{zoneDepartName}</div>}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Marqueur d'arrivée */}
            {arrivalPosition && (
              <Marker position={arrivalPosition} icon={arrivalIcon}>
                <Popup>
                  <div className="position-popup">
                    <h4>🎯 {language === 'fr' ? 'Arrivée' : language === 'mg' ? 'Fahatongavana' : 'Arrival'}</h4>
                    <div className="coordinates">
                      <div>Lat: {arrivalPosition.lat.toFixed(6)}</div>
                      <div>Lng: {arrivalPosition.lng.toFixed(6)}</div>
                    </div>
                    {zoneArriverName && <div className="zone-name">{zoneArriverName}</div>}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Ligne de trajet réel */}
            {routePath.length > 0 && (
              <>
                <Polyline
                  pathOptions={{
                    color: '#007bff',
                    weight: 5,
                    opacity: 0.8,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
                  positions={routePath}
                />
              </>
            )}
          </MapContainer>

          {renderRouteDetails()}
        </div>
      )}

      {/* Calculatrice de distance */}
      {distanceInfo && (
        <div className="distance-calculator">
          <div className="distance-header">
            <FaRoute className="calculator-icon" />
            <h4>{language === 'fr' ? 'Détails du trajet réel' :
              language === 'mg' ? 'Detailin\'ny lalana tena' :
                'Real trip details'}</h4>

            {routeCalculating && (
              <div className="route-calculating">
                <FaSpinner className="spinner" />
                <span>
                  {language === 'fr' ? 'Calcul en cours...' :
                    language === 'mg' ? 'Mikajy...' :
                      'Calculating...'}
                </span>
              </div>
            )}
          </div>

          <div className="distance-stats">
            {distanceInfo.distance && (
              <div className="distance-stat">
                <div className="stat-label">
                  <FaRoad /> {language === 'fr' ? 'Distance réelle' : language === 'mg' ? 'Halaviana tena' : 'Real distance'}
                </div>
                <div className="stat-value">{distanceInfo.distance} km</div>
              </div>
            )}
            {distanceInfo.duration && (
              <div className="distance-stat">
                <div className="stat-label">
                  <FaClock /> {language === 'fr' ? 'Durée estimée' : language === 'mg' ? 'Fotoana vinavinaina' : 'Estimated duration'}
                </div>
                <div className="stat-value">{distanceInfo.duration} min</div>
              </div>
            )}
            <div className="distance-stat">
              <div className="stat-label">
                <FaCar /> {language === 'fr' ? 'Prix suggéré' : language === 'mg' ? 'Vidiny soso-kevitra' : 'Suggested price'}
              </div>
              <div className="stat-value price">{distanceInfo.estimatedPrice.toLocaleString()} Ar</div>
            </div>
          </div>

          {/* Gamme de prix */}
          <div className="price-range-info">
            <div className="price-range-item">
              <div className="range-label">
                {language === 'fr' ? 'Prix minimum:' :
                  language === 'mg' ? 'Vidiny farafahakeliny:' :
                    'Minimum price:'}
              </div>
              <div className="range-value min-price">{distanceInfo.minPrice.toLocaleString()} Ar</div>
            </div>
            <div className="price-range-item">
              <div className="range-label">
                {language === 'fr' ? 'Prix recommandé:' :
                  language === 'mg' ? 'Vidiny soso-kevitra:' :
                    'Recommended price:'}
              </div>
              <div className="range-value recommended-price">{distanceInfo.estimatedPrice.toLocaleString()} Ar</div>
            </div>
            <div className="price-range-item">
              <div className="range-label">
                {language === 'fr' ? 'Prix maximum:' :
                  language === 'mg' ? 'Vidiny farafahakeliny:' :
                    'Maximum price:'}
              </div>
              <div className="range-value max-price">{distanceInfo.maxPrice.toLocaleString()} Ar</div>
            </div>
          </div>

          <div className="distance-actions">
            <button
              className="btn-show-details"
              onClick={() => setShowRouteDetails(!showRouteDetails)}
            >
              <FaDirections />
              {language === 'fr' ? 'Voir détails itinéraire' :
                language === 'mg' ? 'Hijery ny detailin\'ny lalana' :
                  'View route details'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="app-container-combined">
      <MenuApp onToggle={(isOpen) => setIsMenuOpen(isOpen)} />

      {showSuccessPopup && (
        <div className={`success-popup ${successMessage.includes('❌') ? 'error' : 'success'}`}>
          <div className="success-content-nouvel-course">
            <span className="success-icon-nouvel-course" style={{ marginTop: '-20px', width: '10px', height: '40px', fontSize: '40px' }}>
              {successMessage.includes('❌') ? <FaExclamationTriangle /> : <FaCheck />}
            </span>
            <span style={{ marginTop: '0px', marginLeft: '40px' }}>{successMessage.replace('❌ ', '').replace('✅ ', '')}</span>
            <button
              className="close-success-nouvel-course"
              style={{ marginTop: '-70px' }}
              onClick={() => setShowSuccessPopup(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className={`content-container ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}>
        <div className="combined-content">

          {/* En-tête avec onglets */}
          <div className="tabs-header">
            <div className="tabs-container">
              <button
                className={`tab-button ${activeTab === 'client' ? 'active' : ''}`}
                onClick={() => setActiveTab('client')}
              >
                <FaUser className="tab-icon" />
                {language === 'fr' ? 'INFORMATIONS CLIENT' :
                  language === 'mg' ? 'FAMPAHALALANA MOMBA NY MPANJIFA' :
                    'CLIENT INFORMATION'}
                {clientStepCompleted && <FaCheck className="tab-complete-icon" />}
              </button>

              <button
                className={`tab-button ${activeTab === 'course' ? 'active' : ''} ${!clientStepCompleted ? 'disabled' : ''}`}
                onClick={() => clientStepCompleted && setActiveTab('course')}
                disabled={!clientStepCompleted}
              >
                <FaCar className="tab-icon" />
                {language === 'fr' ? 'DÉTAILS DE LA COURSE' :
                  language === 'mg' ? 'DETAILIN\'NY COURSE' :
                    'COURSE DETAILS'}
                {clientStepCompleted && <span className="tab-arrow">→</span>}
              </button>
            </div>

            <button
              className="btn-back"
              onClick={() => navigate('/course/affichage-courses')}
              disabled={loading || saving}
            >
              <FaTimes className="btn-icon" />
              <span>{language === 'fr' ? 'Retour' :
                language === 'mg' ? 'Hiverina' :
                  'Back'}</span>
            </button>
          </div>

          {/* Contenu Client */}
          {activeTab === 'client' && (
            <div className="tab-content client-tab">
              <div className="form-section">
                <div className="form-card">
                  <div className="card-header">
                    <h2>{language === 'fr' ? 'Informations du Client' :
                      language === 'mg' ? 'Fampahalalana momba ny Mpanjifa' :
                        'Client Information'}</h2>
                    <p>{language === 'fr' ? 'Remplissez les informations nécessaires pour ajouter un nouveau client' :
                      language === 'mg' ? 'Fenoy ny fampahalalana ilaina mba hanampiana mpanjifa vaovao' :
                        'Fill in the required information to add a new client'}</p>
                  </div>

                  <form onSubmit={handleClientSubmit} className="client-form">
                    {/* Champ Téléphone - CORRIGÉ */}
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="telephone_client">
                          {language === 'fr' ? 'Téléphone' :
                            language === 'mg' ? 'Finday' :
                              'Phone'} *
                        </label>
                        <div className="phone-input-wrapper" ref={clientSearchRef}>
                          <div className={`country-selector ${showCountryDropdown ? 'open' : ''}`}>
                            <button
                              type="button"
                              className="country-selector-btn"
                              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                              disabled={loading}
                            >
                              <span className="country-flag">{getCurrentCountry().flag}</span>
                              <span className="country-dial-code">{getCurrentCountry().dialCode}</span>
                              <FaChevronDown className={`dropdown-arrow ${showCountryDropdown ? 'rotated' : ''}`} />
                            </button>

                            {showCountryDropdown && (
                              <div className="country-dropdown">
                                <div className="country-search">
                                  <FaSearch className="search-icon" />
                                  <input
                                    type="text"
                                    placeholder={language === 'fr' ? 'Rechercher un pays...' :
                                      language === 'mg' ? 'Mitady firenena...' :
                                        'Search country...'}
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    className="search-input"
                                    autoFocus
                                  />
                                </div>
                                <div className="country-list">
                                  {filteredCountries.map(country => (
                                    <button
                                      key={country.code}
                                      type="button"
                                      className={`country-option ${selectedCountry === country.code ? 'selected' : ''}`}
                                      onClick={() => handleCountrySelect(country.code)}
                                    >
                                      <span className="country-flag">{country.flag}</span>
                                      <span className="country-name">{country.name}</span>
                                      <span className="country-dial-code">{country.dialCode}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="phone-input-container">
                            <input
                              id="telephone_client"
                              type="tel"
                              name="Telephone_client"
                              value={client.Telephone_client}
                              onChange={handleClientInputChange}
                              required
                              placeholder={language === 'mg' ? `Ohatra: ${getPhonePlaceholder()}` : `Ex: ${getPhonePlaceholder()}`}
                              disabled={loading}
                              className={`phone-input ${clientErrors.Telephone_client ? 'error-input' : ''}`}
                              maxLength="15"
                            />
                          </div>
                        </div>

                        {isSearching && (
                          <div className="search-loading">
                            <FaSpinner className="spinner" />
                            <span>
                              {language === 'fr' ? 'Recherche en cours...' :
                                language === 'mg' ? 'Mitady...' :
                                  'Searching...'}
                            </span>
                          </div>
                        )}

                        {clientErrors.Telephone_client && (
                          <span className="error-message">{clientErrors.Telephone_client}</span>
                        )}
                      </div>
                    </div>

                    {/* Champ Nom - CORRIGÉ */}
                    <div className="form-row">
                      <div className="form-group" ref={nameInputRef}>
                        <label htmlFor="nom_client">
                          {language === 'fr' ? 'Nom complet' :
                            language === 'mg' ? 'Anarana feno' :
                              'Full name'} *
                          {selectedClientId && <span className="client-status">
                            {language === 'fr' ? ' (Client existant)' :
                              language === 'mg' ? ' (Mpanjifa efa misy)' :
                                ' (Existing client)'}
                          </span>}
                        </label>
                        <div className="name-input-container">
                          <input
                            id="nom_client"
                            type="text"
                            name="Nom_client"
                            value={client.Nom_client}
                            onChange={handleClientInputChange}
                            onFocus={() => nameSuggestions.length > 0 && setShowNameDropdown(true)}
                            required
                            placeholder={language === 'mg' ? 'Ohatra: Jean Dupont' : 'Ex: Jean Dupont'}
                            disabled={loading || selectedClientId}
                            className={`${clientErrors.Nom_client ? 'error-input' : ''} ${selectedClientId ? 'readonly-input' : ''}`}
                            maxLength="100"
                          />

                          {showNameDropdown && nameSuggestions.length > 0 && (
                            <div className="name-suggestions">
                              <div className="suggestions-header">
                                <FaSearch className="search-icon" />
                                <span>
                                  {nameSuggestions.length}
                                  {language === 'fr' ? ' suggestion(s)' :
                                    language === 'mg' ? ' soso-kevitra' :
                                      ' suggestion(s)'}
                                </span>
                              </div>
                              {nameSuggestions.map(suggestion => (
                                <div
                                  key={suggestion.id}
                                  className="name-suggestion"
                                  onClick={() => handleNameSelect(suggestion)}
                                >
                                  <div className="name-info">
                                    <strong>{suggestion.nom}</strong>
                                    <span className="name-phone">{suggestion.telephone}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {clientErrors.Nom_client && (
                          <span className="error-message">{clientErrors.Nom_client}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn-submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <FaSpinner className="spinner" />
                            <span>{language === 'fr' ? 'Sauvegarde...' :
                              language === 'mg' ? 'Mitehiriza...' :
                                'Saving...'}</span>
                          </>
                        ) : (
                          <>
                            <FaArrowRight className="btn-icon" />
                            <span>
                              {selectedClientId
                                ? (language === 'fr' ? 'Continuer vers la course' :
                                  language === 'mg' ? 'Hanohy mankany amin\'ny course' :
                                    'Continue to course')
                                : (language === 'fr' ? 'Créer le client et continuer' :
                                  language === 'mg' ? 'Hamorona mpanjifa sy hanohy' :
                                    'Create client and continue')
                              }
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Contenu Course */}
          {activeTab === 'course' && (
            <div className="tab-content course-tab">
              <div className="course-form-container">
                <div className="course-header">
                  <h3>
                    {language === 'fr' ? 'Création d\'une nouvelle course' :
                      language === 'mg' ? 'Famoronana course vaovao' :
                        'Creating a new course'}
                  </h3>
                  <p>
                    {language === 'fr' ? 'Client: ' :
                      language === 'mg' ? 'Mpanjifa: ' :
                        'Client: '}
                    <strong>{client.Nom_client}</strong> ({getFullPhoneNumber()})
                  </p>
                </div>

                {renderMapSection()}

                <form onSubmit={handleCourseSubmit} className="course-form">

                  {/* Date et heure */}
                  <div className="form-row compact">
                    <div className="form-group">
                      <label>
                        {language === 'fr' ? 'Date et Heure *' :
                          language === 'mg' ? 'Daty sy Ora *' :
                            'Date and Time *'}
                      </label>
                      <input
                        type="datetime-local"
                        name="Heure_depart"
                        value={newCourse.Heure_depart}
                        onChange={handleCourseInputChange}
                        min={getMinDateTime()}
                        className={courseErrors.Heure_depart ? 'error-input' : ''}
                        disabled={saving}
                      />
                      {courseErrors.Heure_depart && (
                        <span className="error-message">{courseErrors.Heure_depart}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>
                        {language === 'fr' ? 'Temps d\'attente (min)' :
                          language === 'mg' ? 'Fotoana fiandrasana (min)' :
                            'Waiting time (min)'}
                      </label>
                      <input
                        type="number"
                        name="Temps_attente_avant_acceptation"
                        value={newCourse.Temps_attente_avant_acceptation}
                        onChange={handleCourseInputChange}
                        min="0"
                        placeholder="0"
                        disabled={saving}
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        {language === 'fr' ? 'Statut Course' :
                          language === 'mg' ? 'Sata course' :
                            'Course Status'}
                      </label>
                      <select
                        name="Status_course"
                        value={newCourse.Status_course}
                        onChange={handleCourseInputChange}
                        disabled={saving}
                        style={{ paddingTop: '10px' }}
                      >
                        <option value="terminée">
                          {language === 'fr' ? 'Terminée' :
                            language === 'mg' ? 'Vita' :
                              'Completed'}
                        </option>
                        <option value="en cours">
                          {language === 'fr' ? 'En cours' :
                            language === 'mg' ? 'Mandroso' :
                              'In progress'}
                        </option>
                        <option value="annulée">
                          {language === 'fr' ? 'Annulée' :
                            language === 'mg' ? 'Nofoanana' :
                              'Cancelled'}
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Section Tarifs */}
                  <div className="form-section-title">
                    <FaDollarSign className="section-icon" />
                    <span>{language === 'fr' ? 'Définition du tarif' :
                      language === 'mg' ? 'Famaritana ny vidiny' :
                        'Price definition'}</span>

                    {/* Indicateur tarif minimum */}
                    <div className="min-tarif-badge">
                      <FaExclamationTriangle className="min-tarif-icon" />
                      <span className='min-tarif7000'>
                        {language === 'fr' ? 'Tarif minimum: 7 000 Ar' :
                          language === 'mg' ? 'Vidiny farafahakeliny: 7 000 Ar' :
                            'Minimum rate: 7 000 Ar'}
                      </span>
                    </div>
                  </div>

                  <div className="form-row compact">
                    {/* Tarif proposé */}
                    <div className="form-group">
                      <label>
                        {language === 'fr' ? 'Tarif proposé (Ar) *' :
                          language === 'mg' ? 'Vidiny nolalorana (Ar) *' :
                            'Proposed rate (Ar) *'}
                      </label>
                      <div className="input-with-suggestion">
                        <input
                          type="number"
                          name="Tarif_proposer_client"
                          value={newCourse.Tarif_proposer_client}
                          onChange={handleCourseInputChange}
                          min="7000"
                          step="100"
                          placeholder={language === 'mg' ? 'Ohatra: 15000' : 'Ex: 15000'}
                          className={`price-input ${courseErrors.Tarif_proposer_client ? 'error-input' : ''}`}
                          disabled={saving}
                          required
                        />

                        {/* Suggestions basées sur l'historique OU la distance */}
                        {distanceInfo && (
                          <div className="price-suggestions-container">
                            {/* Suggestion basée sur l'historique */}
                            {distanceInfo.historicalData?.hasHistory ? (
                              <div className="price-suggestion historical">
                                <div className="suggestion-header">
                                  <FaHistory className="suggestion-icon historical-icon" />
                                  <span className="suggestion-label">
                                    {language === 'fr' ? `Basé sur ${distanceInfo.historicalData.count} course(s) historique(s):` :
                                      language === 'mg' ? `Mifototra amin'ny ${distanceInfo.historicalData.count} course fahiny:` :
                                        `Based on ${distanceInfo.historicalData.count} historical course(s):`}
                                  </span>
                                </div>
                                <div className="suggestion-details">
                                  <div className="suggestion-main-price">
                                    <span className="main-price-label">{language === 'fr' ? 'Moyenne ajustée:' : language === 'mg' ? 'Salan\'isa nohitsahina:' : 'Adjusted average:'}</span>
                                    <span className="main-price-value">{distanceInfo.estimatedPrice.toLocaleString()} Ar</span>
                                    <button
                                      type="button"
                                      className="btn-apply-suggestion"
                                      onClick={() => {
                                        setNewCourse(prev => ({
                                          ...prev,
                                          Tarif_proposer_client: distanceInfo.estimatedPrice.toString()
                                        }));
                                        showToast(
                                          language === 'fr' ? `Tarif historique appliqué (${distanceInfo.historicalData.count} courses)` :
                                            language === 'mg' ? `Vidiny fahiny napetraka (${distanceInfo.historicalData.count} course)` :
                                              `Historical rate applied (${distanceInfo.historicalData.count} courses)`
                                        );
                                      }}
                                      title={language === 'fr' ? 'Appliquer le tarif historique' :
                                        language === 'mg' ? 'Ampiasao ny vidiny fahiny' :
                                          'Apply historical rate'}
                                    >
                                      <FaArrowRight />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : distanceInfo.historicalData && !distanceInfo.historicalData.hasHistory ? (
                              /* Message si pas d'historique */
                              <div className="price-suggestion no-history">
                                <div className="suggestion-header">
                                  <FaInfoCircle className="suggestion-icon info-icon" />
                                  <span className="suggestion-label">
                                    {language === 'fr' ? distanceInfo.historicalData.message :
                                      language === 'mg' ? 'Tsy misy course fahiny hita eo anelanelan\'ireo faritra ireo' :
                                        'No historical courses found between these zones'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              /* Suggestion basée uniquement sur la distance */
                              <div className="price-suggestion distance-based">
                                <div className="suggestion-header">
                                  <FaRoute className="suggestion-icon distance-icon" />
                                  <span className="suggestion-label">
                                    {language === 'fr' ? 'Basé sur la distance:' :
                                      language === 'mg' ? 'Mifototra amin\'ny halaviana:' :
                                        'Based on distance:'}
                                  </span>
                                </div>
                                <div className="suggestion-details">
                                  <div className="suggestion-main-price">
                                    <span className="main-price-label">{language === 'fr' ? 'Recommandé:' : language === 'mg' ? 'Soso-kevitra:' : 'Recommended:'}</span>
                                    <span className="main-price-value">{distanceInfo.estimatedPrice.toLocaleString()} Ar</span>
                                    <button
                                      type="button"
                                      className="btn-apply-suggestion"
                                      onClick={() => {
                                        setNewCourse(prev => ({
                                          ...prev,
                                          Tarif_proposer_client: distanceInfo.estimatedPrice.toString()
                                        }));
                                        showToast(
                                          language === 'fr' ? 'Tarif recommandé appliqué' :
                                            language === 'mg' ? 'Vidiny soso-kevitra napetraka' :
                                              'Recommended rate applied'
                                        );
                                      }}
                                      title={language === 'fr' ? 'Appliquer le tarif recommandé' :
                                        language === 'mg' ? 'Ampiasao ny vidiny soso-kevitra' :
                                          'Apply recommended rate'}
                                    >
                                      <FaArrowRight />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {courseErrors.Tarif_proposer_client && (
                        <span className="error-message">{courseErrors.Tarif_proposer_client}</span>
                      )}

                      {/* Avertissement tarif minimum */}
                      {newCourse.Tarif_proposer_client && parseFloat(newCourse.Tarif_proposer_client) < 7000 && (
                        <div className="min-price-warning">
                          <FaExclamationTriangle className="warning-icon" />
                          <span>
                            {language === 'fr' ? 'Le tarif minimum est de 7 000 Ar' :
                              language === 'mg' ? 'Ny vidiny farafahakeliny dia 7 000 Ar' :
                                'Minimum rate is 7 000 Ar'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tarif final accepté */}
                    <div className="form-group">
                      <label>
                        {language === 'fr' ? 'Tarif final accepté (Ar)' :
                          language === 'mg' ? 'Vidiny farany azo zaraina (Ar)' :
                            'Final accepted rate (Ar)'}
                      </label>
                      <div className="input-with-suggestion">
                        <input
                          type="number"
                          name="Tarif_final_accepter"
                          value={newCourse.Tarif_final_accepter || ''}
                          onChange={handleCourseInputChange}
                          min="7000"
                          step="100"
                          placeholder={language === 'fr' ? 'Tarif négocié (optionnel)' :
                            language === 'mg' ? 'Vidiny nifampiraharahana (tsy voatery)' :
                              'Negotiated rate (optional)'}
                          className={courseErrors.Tarif_final_accepter ? 'error-input' : ''}
                          disabled={saving}
                        />

                        {/* Suggestions pour le tarif final */}
                        {distanceInfo && newCourse.Tarif_proposer_client && (
                          <div className="final-price-suggestions">
                            <div className="suggestion-options">
                              <button
                                type="button"
                                className="suggestion-option"
                                onClick={() => {
                                  const proposedPrice = parseFloat(newCourse.Tarif_proposer_client);
                                  setNewCourse(prev => ({
                                    ...prev,
                                    Tarif_final_accepter: proposedPrice,
                                    Status_tarif: 'accepté'
                                  }));
                                  showToast(
                                    language === 'fr' ? 'Tarif proposé accepté' :
                                      language === 'mg' ? 'Vidiny nolalorana nekena' :
                                        'Proposed rate accepted'
                                  );
                                }}
                                title={language === 'fr' ? 'Accepter le tarif proposé' :
                                  language === 'mg' ? 'Manaiky ny vidiny nolalorana' :
                                    'Accept proposed rate'}
                              >
                                <FaCheck /> {language === 'fr' ? 'Accepter le tarif proposé' :
                                  language === 'mg' ? 'Manaiky vidiny nolalorana' :
                                    'Accept proposed rate'}
                              </button>

                              {distanceInfo.historicalData?.hasHistory && (
                                <button
                                  type="button"
                                  className="suggestion-option historical"
                                  onClick={() => {
                                    setNewCourse(prev => ({
                                      ...prev,
                                      Tarif_final_accepter: distanceInfo.estimatedPrice,
                                      Status_tarif: 'négocié'
                                    }));
                                    showToast(
                                      language === 'fr' ? 'Tarif historique appliqué' :
                                        language === 'mg' ? 'Vidiny fahiny napetraka' :
                                          'Historical rate applied'
                                    );
                                  }}
                                  title={language === 'fr' ? 'Utiliser le tarif historique' :
                                    language === 'mg' ? 'Mampiasa vidiny fahiny' :
                                      'Use historical rate'}
                                >
                                  <FaHistory /> {language === 'fr' ? 'Utiliser historique' :
                                    language === 'mg' ? 'Mampiasa fahiny' :
                                      'Use historical'}
                                </button>
                              )}

                              <button
                                type="button"
                                className="suggestion-option negotiated"
                                onClick={() => {
                                  const proposedPrice = parseFloat(newCourse.Tarif_proposer_client);
                                  const negotiatedPrice = Math.round(proposedPrice * 0.9);
                                  setNewCourse(prev => ({
                                    ...prev,
                                    Tarif_final_accepter: Math.max(negotiatedPrice, 7000),
                                    Status_tarif: 'négocié'
                                  }));
                                  showToast(
                                    language === 'fr' ? 'Tarif négocié appliqué (-10%)' :
                                      language === 'mg' ? 'Vidiny nifampiraharahana napetraka (-10%)' :
                                        'Negotiated rate applied (-10%)'
                                  );
                                }}
                                title={language === 'fr' ? 'Négocier -10%' :
                                  language === 'mg' ? 'Hifampiraharaha -10%' :
                                    'Negotiate -10%'}
                              >
                                <FaHandshake /> {language === 'fr' ? 'Négocier (-10%)' :
                                  language === 'mg' ? 'Hifampiraharaha (-10%)' :
                                    'Negotiate (-10%)'}
                              </button>
                            </div>

                            <div className="current-proposed">
                              <span className="proposed-label">
                                {language === 'fr' ? 'Tarif proposé actuel:' :
                                  language === 'mg' ? 'Vidiny nolalorana ankehitriny:' :
                                    'Current proposed rate:'}
                              </span>
                              <span className="proposed-value">{parseFloat(newCourse.Tarif_proposer_client).toLocaleString()} Ar</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {courseErrors.Tarif_final_accepter && (
                        <span className="error-message">{courseErrors.Tarif_final_accepter}</span>
                      )}

                      {/* Validation tarif final */}
                      {newCourse.Tarif_final_accepter && newCourse.Tarif_proposer_client &&
                        newCourse.Tarif_final_accepter > parseFloat(newCourse.Tarif_proposer_client) && (
                          <div className="price-validation-error">
                            <FaExclamationTriangle className="error-icon" />
                            <span>
                              {language === 'fr' ? 'Le tarif final ne peut pas dépasser le tarif proposé' :
                                language === 'mg' ? 'Ny vidiny farany tsy afaka mihoatra ny vidiny nolalorana' :
                                  'Final rate cannot exceed proposed rate'}
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Statut Tarif */}
                    <div className="form-group">
                      <label>
                        {language === 'fr' ? 'Statut Tarif' :
                          language === 'mg' ? 'Sata vidiny' :
                            'Rate Status'}
                      </label>
                      <select
                        name="Status_tarif"
                        value={newCourse.Status_tarif}
                        onChange={handleCourseInputChange}
                        disabled={saving}
                        className="status-select"
                        style={{ paddingTop: '10px' }}
                      >
                        <option value="proposé">
                          {language === 'fr' ? 'Proposé' :
                            language === 'mg' ? 'Nolalorana' :
                              'Proposed'}
                        </option>
                        <option value="accepté">
                          {language === 'fr' ? 'Accepté' :
                            language === 'mg' ? 'Nekena' :
                              'Accepted'}
                        </option>
                        <option value="refusé">
                          {language === 'fr' ? 'Refusé' :
                            language === 'mg' ? 'Nolavina' :
                              'Refused'}
                        </option>
                        <option value="négocié">
                          {language === 'fr' ? 'Négocié' :
                            language === 'mg' ? 'Nifampiraharahana' :
                              'Negotiated'}
                        </option>
                      </select>

                      {/* Indicateur automatique basé sur les valeurs */}
                      {newCourse.Tarif_final_accepter && (
                        <div className="status-indicator">
                          {newCourse.Tarif_final_accepter === parseFloat(newCourse.Tarif_proposer_client) ? (
                            <span className="status-accepted">
                              <FaCheck /> {language === 'fr' ? 'Tarif accepté sans modification' :
                                language === 'mg' ? 'Vidiny nekena tsy misy fanovana' :
                                  'Rate accepted without changes'}
                            </span>
                          ) : newCourse.Tarif_final_accepter < parseFloat(newCourse.Tarif_proposer_client) ? (
                            <span className="status-negotiated">
                              <FaHandshake /> {language === 'fr' ? 'Tarif négocié' :
                                language === 'mg' ? 'Vidiny nifampiraharahana' :
                                  'Rate negotiated'}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                  {subscriptionInfo && subscriptionInfo.limit !== 'Illimité' && (
                    <div className="rides-quota-container">
                      <div className="quota-header">
                        <FaCar className="quota-icon" />
                        <h4>
                          {language === 'fr' ? 'Votre forfait' :
                            language === 'mg' ? 'Fonosanao' :
                              'Your plan'}
                        </h4>
                      </div>

                      <div className="quota-progress">
                        <div className="quota-stats">
                          <span className="quota-label">
                            {language === 'fr' ? 'Le nombre des courses à votre disposition pour ce mois' :
                              language === 'mg' ? 'Course nampiasaina ity volana ity' :
                                'Rides used this month'}
                          </span>
                          <span className="quota-values">
                            {subscriptionInfo.used} / {subscriptionInfo.limit}
                          </span>
                        </div>

                        <div className="progress-bar-container">
                          <div
                            className={`progress-bar ${ridesRemaining <= 2 ? 'progress-danger' : ridesRemaining <= 5 ? 'progress-warning' : 'progress-safe'}`}
                            style={{ width: `${(subscriptionInfo.used / subscriptionInfo.limit) * 100}%` }}
                          ></div>
                        </div>

                        <div className="quota-footer">
                          <div className="rides-remaining">
                            <span className="remaining-label">
                              {language === 'fr' ? 'Courses restantes' :
                                language === 'mg' ? 'Course sisa' :
                                  'Rides remaining'}
                            </span>
                            <span className={`remaining-value ${ridesRemaining <= 2 ? 'text-danger' : ridesRemaining <= 5 ? 'text-warning' : 'text-safe'}`}>
                              {ridesRemaining}
                            </span>
                          </div>

                          {ridesRemaining <= 3 && ridesRemaining > 0 && (
                            <div className="quota-warning">
                              <FaExclamationTriangle className="warning-icon-small" />
                              <span>
                                {language === 'fr' ? `Plus que ${ridesRemaining} course(s) !` :
                                  language === 'mg' ? `Sisa ${ridesRemaining} course!` :
                                    `Only ${ridesRemaining} ride(s) left!`}
                              </span>
                            </div>
                          )}

                          {ridesRemaining === 0 && (
                            <div className="quota-danger">
                              <FaExclamationTriangle className="danger-icon" />
                              <span>
                                {language === 'fr' ? 'Limite atteinte. Passez à un forfait supérieur.' :
                                  language === 'mg' ? 'Tonga fetra. Mividy fonosana ambony.' :
                                    'Limit reached. Upgrade your plan.'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setActiveTab('client')}
                      disabled={saving}
                    >
                      <FaArrowRight className="btn-icon rotated" />
                      <span>
                        {language === 'fr' ? 'Retour au client' :
                          language === 'mg' ? 'Hiverina amin\'ny mpanjifa' :
                            'Back to client'}
                      </span>
                    </button>
                    <button
                      type="submit"
                      className="btn-submit"
                      disabled={saving || !departurePosition || !arrivalPosition}
                    >
                      {saving ? (
                        <>
                          <FaSpinner className="spinner" />
                          <span>{language === 'fr' ? 'Création en cours...' :
                            language === 'mg' ? 'Mamorona...' :
                              'Creating...'}</span>
                        </>
                      ) : (
                        <>
                          <FaSave className="btn-icon" />
                          <span>{language === 'fr' ? 'Créer la Course' :
                            language === 'mg' ? 'Hamorona Course' :
                              'Create Course'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NouvelleCourse;