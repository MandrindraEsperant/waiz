import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaHistory,
  FaCheckCircle,
  FaClock,
  FaCalendarAlt,
  FaCalendar,
  FaMoneyBillWave,
  FaCreditCard,
  FaSync,
  FaUser,
  FaChartLine,
  FaShieldAlt,
  FaCrown,
  FaInfoCircle,
  FaSpinner,
  FaExclamationTriangle,
  FaCalendarCheck
} from 'react-icons/fa';
import MenuApp from '../Menu';
import './parametre.css';
import { useLanguage } from '../../contexts/LanguageContext';
import fr from '../../locales/parametre/fr.json';
import en from '../../locales/parametre/en.json';
import mg from '../../locales/parametre/mg.json';
import { verifyToken, fetchCurrentMembership } from '../../services/waizApi';

// Création d'un objet de traductions
const translations = {
  fr: fr,
  en: en,
  mg: mg
};

function Parametre() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  // États
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chauffeurInfo, setChauffeurInfo] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [renewing, setRenewing] = useState(false);

  // États pour les toasts
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fonction utilitaire pour obtenir les traductions
  const getTranslation = (key, defaultValue = '') => {
    try {
      const keys = key.split('.');
      let translation = translations[language];

      // Naviguer à travers les clés imbriquées
      for (const k of keys) {
        if (translation && typeof translation === 'object' && k in translation) {
          translation = translation[k];
        } else {
          // Fallback au français si non trouvé
          if (language !== 'fr') {
            let frenchTranslation = translations.fr;
            for (const frenchKey of keys) {
              if (frenchTranslation && typeof frenchTranslation === 'object' && frenchKey in frenchTranslation) {
                frenchTranslation = frenchTranslation[frenchKey];
              } else {
                frenchTranslation = null;
                break;
              }
            }
            if (frenchTranslation) return frenchTranslation;
          }
          return defaultValue || key.split('.').pop();
        }
      }
      return translation || defaultValue || key.split('.').pop();
    } catch (error) {
      console.warn(`Erreur de traduction pour la clé: ${key}`, error);
      return defaultValue || key.split('.').pop();
    }
  };

  // Fonction pour afficher les toasts
  const showToast = (message, isError = false) => {
    setSuccessMessage(isError ? `❌ ${message}` : `✅ ${message}`);
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000);
  };

  // Fonction pour gérer le toggle du menu
  const handleMenuToggle = (isOpen) => {
    setIsMenuOpen(isOpen);
  };

  // Fonction pour décoder le token JWT
  const decodeJWT = (token) => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Erreur décodage token:', error);
      return null;
    }
  };

  // Fonction pour récupérer les informations du chauffeur
  const fetchChauffeurInfo = async () => {
    try {
      const user = await verifyToken();
      if (user) {
        return {
          id: user.id,
          nom: `${user.firstName || ''} ${user.nom || ''}`.trim(),
          email: user.email,
          telephone: user.telephone,
          type_chauffeur: 'particulier',
          type_display: getDriverTypeDisplay('particulier'),
        };
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération infos chauffeur:', error.message);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        const decoded = decodeJWT(token);
        if (decoded) {
          return {
            id: decoded.sub || decoded.chauffeurId,
            nom: decoded.nom || getTranslation('driver.defaultName', 'Chauffeur'),
            email: decoded.email || decoded.sub || '',
            telephone: decoded.telephone || '',
            type_chauffeur: 'particulier',
            type_display: getDriverTypeDisplay('particulier'),
          };
        }
      }
      return null;
    }
  };

  // Fonction pour obtenir l'affichage du type de chauffeur
  const getDriverTypeDisplay = (type) => {
    if (!type) return getTranslation('driver.type.particulier', 'Particulier');

    const typeMap = {
      'societe': getTranslation('driver.type.societe', 'Société'),
      'professionnel': getTranslation('driver.type.professionnel', 'Professionnel'),
      'particulier': getTranslation('driver.type.particulier', 'Particulier'),
      'entreprise': getTranslation('driver.type.societe', 'Société'),
      'professionnal': getTranslation('driver.type.professionnel', 'Professionnel'),
      'individual': getTranslation('driver.type.particulier', 'Particulier')
    };

    return typeMap[type] || type;
  };

  // Fonction pour récupérer l'abonnement actif
  const fetchActiveSubscription = async () => {
    try {
      const membership = await fetchCurrentMembership();
      if (!membership) return null;

      const startDate = membership.startDate ? new Date(membership.startDate) : new Date();
      const durationDays = membership.memberShipType?.duration || 30;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);
      const today = new Date();
      const totalDuration = endDate - startDate;
      const elapsed = today - startDate;
      const progress = totalDuration > 0 ? Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100) : 0;
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

      return {
        id: membership.id,
        plan: membership.memberShipType?.name?.toLowerCase() || 'basic',
        status: membership.status,
        date_debut: startDate.toISOString(),
        date_fin: endDate.toISOString(),
        montant: membership.memberShipType?.price,
        validationCode: membership.validationCode,
        progress,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isExpired: membership.status === 'EXPIRED' || daysRemaining <= 0,
        isTrial: false,
      };
    } catch (error) {
      console.error('Erreur récupération abonnement actif:', error.message);
      return null;
    }
  };

  const fetchSubscriptionHistory = async () => {
    try {
      const membership = await fetchCurrentMembership();
      if (!membership) return [];

      const startDate = membership.startDate ? new Date(membership.startDate) : new Date();
      const durationDays = membership.memberShipType?.duration || 30;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);
      const today = new Date();

      return [{
        id: membership.id,
        plan: membership.memberShipType?.name || 'Basic',
        date_debut: startDate.toISOString(),
        date_fin: endDate.toISOString(),
        status: endDate > today
          ? getTranslation('activeSubscription.status.active', 'Actif')
          : getTranslation('activeSubscription.status.expired', 'Expiré'),
        statusClass: endDate > today ? 'active' : 'expired',
        duration: durationDays,
        formattedStartDate: formatDateForDisplay(startDate),
        formattedEndDate: formatDateForDisplay(endDate),
        isTrial: false,
      }];
    } catch (error) {
      console.error('Erreur récupération historique:', error.message);
      return [];
    }
  };

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        // Vérifier si l'utilisateur est connecté
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
          setError(getTranslation('errors.notConnected', 'Vous devez être connecté pour voir vos abonnements'));
          showToast(getTranslation('errors.notConnected', 'Vous devez être connecté pour voir vos abonnements'), true);
          setLoading(false);
          return;
        }

        // Décoder le token pour débogage
        const decoded = decodeJWT(token);
        console.log('=== CHARGEMENT DONNEES ===');
        console.log('Token décodé:', decoded);
        console.log('Chauffeur ID dans token:', decoded?.chauffeurId);

        // Charger d'abord les infos du chauffeur
        const chauffeurData = await fetchChauffeurInfo();
        setChauffeurInfo(chauffeurData);

        // Puis charger les données d'abonnement
        const [activeSub, history] = await Promise.all([
          fetchActiveSubscription(),
          fetchSubscriptionHistory()
        ]);

        console.log('📊 Données chargées:', {
          chauffeur: chauffeurData?.nom || 'N/A',
          abonnement: activeSub ? getTranslation('general.yes', 'Oui') : getTranslation('general.no', 'Non'),
          historique: history.length
        });

        setActiveSubscription(activeSub);
        setSubscriptionHistory(history);

      } catch (error) {
        console.error('❌ Erreur chargement données:', error);

        // Message d'erreur spécifique
        if (error.response?.status === 401) {
          const errorMsg = getTranslation('errors.sessionExpired', 'Session expirée. Veuillez vous reconnecter.');
          setError(errorMsg);
          showToast(errorMsg, true);
        } else if (error.response?.status === 404) {
          const errorMsg = getTranslation('errors.endpointNotFound', 'Endpoint non trouvé. Vérifiez vos routes backend.');
          setError(errorMsg);
          showToast(errorMsg, true);
        } else if (error.message === 'Network Error') {
          const errorMsg = getTranslation('errors.serverUnreachable', 'Serveur inaccessible. Assurez-vous que le backend fonctionne.');
          setError(errorMsg);
          showToast(errorMsg, true);
        } else {
          const errorMsg = getTranslation('errors.loadingError', 'Erreur lors du chargement de vos données. Veuillez réessayer.');
          setError(errorMsg);
          showToast(errorMsg, true);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [language]); // Recharger les données quand la langue change

  // Fonction pour renouveler l'abonnement
  const handleRenew = async () => {
    if (!activeSubscription || renewing) return;

    setRenewing(true);
    try {
      navigate('/abonnement');
    } catch (error) {
      console.error('Erreur renouvellement:', error);
      showToast(getTranslation('errors.renewError', 'Erreur lors du renouvellement. Veuillez réessayer.'), true);
    } finally {
      setRenewing(false);
    }
  };

  // Fonction pour formater le prix
  const formatPrice = (price) => {
    if (!price) return '0';

    const localeMap = {
      'fr': 'fr-FR',
      'en': 'en-US',
      'mg': 'mg-MG'
    };

    return new Intl.NumberFormat(localeMap[language] || 'fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Fonction pour obtenir le nom du plan
  const getPlanName = (plan) => {
    const planMap = {
      'essai_gratuit': getTranslation('plans.essai_gratuit', 'Essai gratuit'),
      'basique': getTranslation('plans.basique', 'Basique'),
      'basic': getTranslation('plans.basic', 'Basique'),
      'pro': getTranslation('plans.pro', 'Pro'),
      'premium': getTranslation('plans.premium', 'Premium'),
      'entreprise_basic': getTranslation('plans.entreprise_basic', 'Entreprise Basic'),
      'entreprise_pro': getTranslation('plans.entreprise_pro', 'Entreprise Pro')
    };

    return planMap[plan] || plan;
  };

  // Fonction pour obtenir l'icône du plan
  const getPlanIcon = (plan) => {
    const planIcons = {
      'essai_gratuit': <FaClock />,
      'basique': <FaCheckCircle />,
      'basic': <FaCheckCircle />,
      'pro': <FaCrown />,
      'premium': <FaChartLine />,
      'entreprise_basic': <FaUser />,
      'entreprise_pro': <FaShieldAlt />
    };
    return planIcons[plan] || <FaInfoCircle />;
  };

  // Fonction pour obtenir la couleur du plan
  const getPlanColor = (plan) => {
    const planColors = {
      'essai_gratuit': '#6c757d',
      'basique': '#28a745',
      'basic': '#28a745',
      'pro': '#007bff',
      'premium': '#6610f2',
      'entreprise_basic': '#fd7e14',
      'entreprise_pro': '#dc3545'
    };
    return planColors[plan] || '#6c757d';
  };

  // Fonction pour formater la date d'affichage
  const formatDateForDisplay = (date) => {
    if (!date) return '';

    const localeMap = {
      'fr': 'fr-FR',
      'en': 'en-US',
      'mg': 'mg-MG'
    };

    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    return new Date(date).toLocaleDateString(localeMap[language] || 'fr-FR', options);
  };

  // Fonction pour obtenir le nom de la méthode de paiement
  const getPaymentMethodName = (method) => {
    const methodMap = {
      'mobile_money': getTranslation('activeSubscription.paymentMethods.mobile_money', 'Mobile Money'),
      'carte_bancaire': getTranslation('activeSubscription.paymentMethods.carte_bancaire', 'Carte bancaire'),
      'essai': getTranslation('activeSubscription.paymentMethods.essai', 'Essai gratuit')
    };

    return methodMap[method] || method;
  };

  // Affichage du chargement
  if (loading) {
    return (
      <div className="app-container">
        <MenuApp onToggle={handleMenuToggle} />
        <div className={`content-container ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}>
          <div className="parametres-container loading">
            <div className="loading-content">
              <FaSpinner className="spinner" />
              <p>{getTranslation('loading.text', 'Chargement de vos abonnements...')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <MenuApp onToggle={handleMenuToggle} />

      <div className={`content-container ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}>
        <div className="parametres-container">

          {/* TOAST DE SUCCÈS/ERREUR */}
          {showSuccessPopup && (
            <div className="success-popup-parametre">
              <div className="success-content-parametre">
                <span className="success-icon-parametre" style={{marginTop:'-44px', width:'10px', height:'30px', fontSize:'40px'}}>
                  {successMessage.includes('❌') ? '❌' : '✅'}
                </span>
                <span style={{marginTop:'-70px', marginLeft:'20px'}}>{successMessage.replace('❌ ', '').replace('✅ ', '')}</span>
                <button
                  className="close-success-parametre"
                  style={{marginTop:'-70px'}}
                  onClick={() => setShowSuccessPopup(false)}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="parametres-header">
            <div className="header-title-section">
              <h1><FaCalendarAlt /> {getTranslation('header.title', 'Mes Abonnements')}</h1>
              <p className="subtitle">{getTranslation('header.subtitle', 'Gérez vos abonnements et consultez votre historique')}</p>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="error-message">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="subscription-tabs">
            <button
              className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              <FaCheckCircle /> {getTranslation('tabs.active', 'Abonnement actif')}
              {activeSubscription && !activeSubscription.isExpired && (
                <span className="tab-badge active">●</span>
              )}
            </button>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FaHistory /> {getTranslation('tabs.history', 'Historique')}
              {subscriptionHistory.length > 0 && (
                <span className="tab-badge count">{subscriptionHistory.length}</span>
              )}
            </button>
          </div>

          {/* Contenu des tabs */}
          <div className="tab-content">
            {activeTab === 'active' ? (
              <div className="active-subscription-tab">
                {activeSubscription && !activeSubscription.isExpired ? (
                  <div className="active-subscription-card">
                    <div className="subscription-header">
                      <div className="plan-badge" style={{ backgroundColor: getPlanColor(activeSubscription.plan) }}>
                        <span className="plan-icon">{getPlanIcon(activeSubscription.plan)}</span>
                        <span className="plan-name">{getPlanName(activeSubscription.plan)}</span>
                        {activeSubscription.isTrial && (
                          <span className="trial-badge">{getTranslation('activeSubscription.status.trial', 'ESSAI')}</span>
                        )}
                      </div>

                      <div className="subscription-status">
                        <span className={`status-badge ${activeSubscription.isExpired ? 'expired' : 'active'}`}>
                          {activeSubscription.isExpired
                            ? getTranslation('activeSubscription.status.expired', 'Expiré')
                            : getTranslation('activeSubscription.status.active', 'Actif')}
                        </span>
                      </div>
                    </div>

                    <div className="subscription-info">
                      <div className="info-row">
                        <div className="info-item">
                          <FaCalendar className="info-icon" />
                          <div className="info-content">
                            <span className="info-label" style={{marginLeft:'150px'}}>{getTranslation('activeSubscription.period', 'Période')}</span>
                            <span className="info-value">
                              {formatDateForDisplay(activeSubscription.date_debut)} - {formatDateForDisplay(activeSubscription.date_fin)}
                            </span>
                          </div>
                        </div>

                        <div className="info-item">
                          <FaMoneyBillWave className="info-icon" />
                          <div className="info-content">
                            <span className="info-label">{getTranslation('activeSubscription.amount', 'Montant')}</span>
                            <span className="info-value">Ar {formatPrice(activeSubscription.montant)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="info-row">
                        <div className="info-item">
                          <FaClock className="info-icon" />
                          <div className="info-content">
                            <span className="info-label">{getTranslation('activeSubscription.timeRemaining', 'Temps restant')}</span>
                            <span className="info-value">
                              {activeSubscription.daysRemaining} {getTranslation('general.days', 'jour(s)')}
                            </span>
                          </div>
                        </div>

                        <div className="info-item">
                          <FaCreditCard className="info-icon" />
                          <div className="info-content">
                            <span className="info-label">{getTranslation('activeSubscription.paymentMethod', 'Méthode de paiement')}</span>
                            <span className="info-value">
                              {getPaymentMethodName(activeSubscription.methode_paiement)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="progress-section">
                      <div className="progress-header">
                        <h4>{getTranslation('activeSubscription.progress', 'Progression de votre abonnement')}</h4>
                        <span className="progress-percentage">{Math.round(activeSubscription.progress)}%</span>
                      </div>

                      <div className="progress-bar-container">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${activeSubscription.progress}%`,
                            backgroundColor: getPlanColor(activeSubscription.plan)
                          }}
                        ></div>
                      </div>

                      <div className="progress-dates">
                        <span className="start-date">
                          {formatDateForDisplay(activeSubscription.date_debut)}
                        </span>
                        <span className="current-date">
                          {getTranslation('activeSubscription.today', "Aujourd'hui")} ({Math.round(activeSubscription.progress)}%)
                        </span>
                        <span className="end-date">
                          {formatDateForDisplay(activeSubscription.date_fin)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="subscription-actions">
                      <button
                        className="btn-renew"
                        onClick={handleRenew}
                        disabled={renewing}
                      >
                        {renewing ? (
                          <>
                            <FaSpinner className="spinner" />
                            {getTranslation('activeSubscription.processing', 'Traitement...')}
                          </>
                        ) : (
                          <>
                            <FaSync />
                            {getTranslation('activeSubscription.renewButton', 'Renouveler l\'abonnement')}
                          </>
                        )}
                      </button>

                      <button
                        className="btn-upgrade"
                        onClick={() => navigate('/abonnement')}
                      >
                        <FaChartLine />
                        {getTranslation('activeSubscription.viewOffers', 'Voir les offres')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-subscription-card">
                    <div className="no-subscription-icon">
                      <FaCalendarCheck />
                    </div>
                    <h3>{getTranslation('activeSubscription.noSubscription', 'Aucun abonnement actif')}</h3>
                    <p>{getTranslation('activeSubscription.noSubscriptionDesc', 'Vous n\'avez pas d\'abonnement actif pour le moment.')}</p>
                    <button
                      className="btn-subscribe"
                      onClick={() => navigate('/abonnement')}
                    >
                      <FaCreditCard />
                      {getTranslation('activeSubscription.subscribeButton', 'Souscrire à un plan')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="history-tab">
                {subscriptionHistory.length > 0 ? (
                  <div className="history-container">
                    <div className="history-header">
                      <h3>{getTranslation('history.title', 'Historique des abonnements')}</h3>
                      <p className="history-count">
                        {subscriptionHistory.length} {getTranslation('history.totalSubscriptions', 'abonnement(s) au total')}
                      </p>
                    </div>

                    <div className="history-list">
                      {subscriptionHistory.map((subscription, index) => (
                        <div key={index} className="history-card">
                          <div className="history-card-header">
                            <div className="history-plan-info">
                              <div
                                className="history-plan-icon"
                                style={{ color: getPlanColor(subscription.plan) }}
                              >
                                {getPlanIcon(subscription.plan)}
                              </div>
                              <div>
                                <h4 className="history-plan-name">{getPlanName(subscription.plan)}</h4>
                                <div className="history-plan-details">
                                  <span className="history-amount">Ar {formatPrice(subscription.montant)}</span>
                                  <span className="history-period">• {subscription.periode}</span>
                                  {subscription.isTrial && (
                                    <span className="history-trial-badge">{getTranslation('history.trial', 'Essai gratuit')}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className={`history-status ${subscription.statusClass}`}>
                              {subscription.status}
                            </span>
                          </div>

                          <div className="history-card-body">
                            <div className="history-dates">
                              <div className="history-date-item">
                                <FaCalendarAlt className="history-date-icon" />
                                <div>
                                  <span className="history-date-label">{getTranslation('history.start', 'Début')}</span>
                                  <span className="history-date-value">{subscription.formattedStartDate}</span>
                                </div>
                              </div>

                              <div className="history-date-item">
                                <FaCalendar className="history-date-icon" />
                                <div>
                                  <span className="history-date-label">{getTranslation('history.end', 'Fin')}</span>
                                  <span className="history-date-value">{subscription.formattedEndDate}</span>
                                </div>
                              </div>

                              <div className="history-date-item">
                                <FaClock className="history-date-icon" />
                                <div>
                                  <span className="history-date-label">{getTranslation('history.duration', 'Durée')}</span>
                                  <span className="history-date-value">{subscription.duration} {getTranslation('history.days', 'jours')}</span>
                                </div>
                              </div>
                            </div>

                            {subscription.status === getTranslation('activeSubscription.status.expired', 'Expiré') && (
                              <div className="history-actions">
                                <button
                                  className="btn-history-renew"
                                  onClick={() => navigate('/abonnement')}
                                >
                                  <FaSync />
                                  {getTranslation('history.renewPlan', 'Renouveler ce plan')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="no-history-card">
                    <div className="no-history-icon">
                      <FaHistory />
                    </div>
                    <h3>{getTranslation('history.noHistory', 'Aucun historique d\'abonnement')}</h3>
                    <p>{getTranslation('history.noHistoryDesc', 'Vous n\'avez pas encore souscrit à un plan.')}</p>
                    <button
                      className="btn-subscribe"
                      onClick={() => navigate('/abonnement')}
                    >
                      <FaCreditCard />
                      {getTranslation('history.subscribeFirst', 'Souscrire à votre premier plan')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Parametre;