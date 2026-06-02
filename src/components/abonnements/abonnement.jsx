import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCreditCard, FaCheck, FaLock, FaShieldAlt, FaClock, FaChartLine, FaHeadset,
  FaExclamationTriangle, FaCrown, FaGem, FaCheckCircle, FaCalendar, FaCalendarAlt,
  FaMoneyBillWave, FaInfoCircle, FaSync, FaCalendarTimes, FaExclamationCircle,
  FaUser, FaBuilding, FaUserTie, FaSpinner, FaTimes
} from 'react-icons/fa';
import './abonnement.css';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  checkSubscriptionEligibility,
  verifyToken,
  upgradeAccount,
  fetchCurrentMembership,
  fetchMembershipTypes,
} from '../../services/waizApi';
import fr from '../../locales/abonnement/fr.json';
import en from '../../locales/abonnement/en.json';
import mg from '../../locales/abonnement/mg.json';

const translations = { fr, en, mg };

function Abonnement() {
  const navigate = useNavigate();
  const { language: currentLanguage = 'fr' } = useLanguage();
  
  // États
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [duration, setDuration] = useState(1);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [mobileMoneyDetails, setMobileMoneyDetails] = useState({ operator: '', phoneNumber: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [chauffeurInfo, setChauffeurInfo] = useState({ id: '', nom: '', email: '', telephone: '', type_chauffeur: 'particulier' });
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [expiryInfo, setExpiryInfo] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const pollingRef = useRef(null);
  const redirectTimeoutRef = useRef(null);

  const redirectToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  // ---------- Traductions ----------
  const getTranslation = (key, defaultValue = '') => {
    try {
      const keys = key.split('.');
      const langCode = String(currentLanguage || 'fr').split('-')[0].toLowerCase();
      let translation = translations[langCode] || translations.fr;
      for (const k of keys) {
        if (translation && typeof translation === 'object' && k in translation) {
          translation = translation[k];
        } else {
          if (langCode !== 'fr') {
            let french = translations.fr;
            for (const fk of keys) {
              if (french && typeof french === 'object' && fk in french) french = french[fk];
              else { french = null; break; }
            }
            if (typeof french === 'string') return french;
          }
          return defaultValue || key;
        }
      }
      return typeof translation === 'string' ? translation : defaultValue || key;
    } catch { return defaultValue || key; }
  };

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const localeMap = { fr: 'fr-FR', en: 'en-US', mg: 'mg-MG' };
    return new Date(date).toLocaleDateString(localeMap[currentLanguage] || 'fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  // ---------- Calcul des dates (mis à jour dynamiquement) ----------
  const dates = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);
    if (selectedPlan === 'premium') {
      endDate.setFullYear(endDate.getFullYear() + duration);
    } else {
      endDate.setMonth(endDate.getMonth() + duration);
    }
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      formattedStartDate: formatDateForDisplay(startDate),
      formattedEndDate: formatDateForDisplay(endDate)
    };
  }, [selectedPlan, duration, currentLanguage]);

  // ---------- Prix ----------
  const getPlanPrice = (basePrice, multiplier) => basePrice * multiplier;

  const formatDurationLabel = (value, isAnnual) => {
    if (isAnnual) {
      return `${value} ${value > 1 ? getTranslation('subscription.years', 'ans') : getTranslation('subscription.year', 'an')}`;
    }
    return `${value} ${value > 1 ? getTranslation('subscription.months', 'mois') : getTranslation('subscription.month', 'mois')}`;
  };

  // Features (identique à votre code)
  const getPlanFeatures = (planId) => {
    if (currentLanguage === 'en') {
      switch(planId) {
        case 'basic': return ['10 rides per day max', 'Basic rides', 'Standard support', 'Mobile app'];
        case 'pro': return ['Unlimited rides', 'Priority support 24/7', 'Real-time map', 'Detailed stats', 'Verified profile', 'Advanced notifications'];
        case 'premium': return ['Unlimited rides', 'All Pro features', '30% less commission', 'Premium badge', 'Ride priority', 'Free training', 'Insurance', 'Dedicated support'];
        default: return [];
      }
    } else if (currentLanguage === 'mg') {
      switch(planId) {
        case 'basic': return ['10 fandeha isan\'andro', 'Fandeha fototra', 'Fanohanana mahazatra', 'App finday'];
        case 'pro': return ['Fandeha tsy voafetra', 'Fanohanana 24/7', 'Sarin-tany', 'Statistika', 'Profil voamarina', 'Fampandrenesana'];
        case 'premium': return ['Fandeha tsy voafetra', 'Ny Pro rehetra', 'Kaomisy mihena 30%', 'Badge Premium', 'Laharam-pahamehana', 'Fiofanana maimaim-poana', 'Fiantohana', 'Fanohanana manokana'];
        default: return [];
      }
    } else { // français
      switch(planId) {
        case 'basic': return ['10 courses max/jour', 'Courses de base', 'Support standard', 'App mobile'];
        case 'pro': return ['Courses illimitées', 'Support prioritaire 24/7', 'Carte temps réel', 'Statistiques détaillées', 'Profil vérifié', 'Notifications avancées'];
        case 'premium': return ['Courses illimitées', 'Toutes les fonctionnalités Pro', 'Commission -30%', 'Badge Premium', 'Priorité sur les courses', 'Formation gratuite', 'Assurance incluse', 'Support dédié 24/7'];
        default: return [];
      }
    }
  };

  // Plans disponibles
  const getAdaptedPlans = () => {
    const basePrices = { basic: 10000, pro: 25000, premium: 250000 };
    return [
      { id: 'basic', name: getTranslation('plans.basic.name', 'Basique'), basePrice: basePrices.basic, period: '/mois', features: getPlanFeatures('basic'), color: '#6c757d', icon: <FaCheckCircle />, popular: false, isAnnual: false },
      { id: 'pro', name: getTranslation('plans.pro.name', 'Pro'), basePrice: basePrices.pro, period: '/mois', features: getPlanFeatures('pro'), color: '#007bff', icon: <FaCrown />, popular: true, savings: '20%', isAnnual: false },
      { id: 'premium', name: getTranslation('plans.premium.name', 'Premium'), basePrice: basePrices.premium, period: '/an', features: getPlanFeatures('premium'), color: '#28a745', icon: <FaGem />, popular: false, savings: '30%', isAnnual: true }
    ];
  };

  const mapMembershipTypesToPlans = (types) => {
    if (!Array.isArray(types) || types.length === 0) return getAdaptedPlans();

    return types.map((type) => {
      const rawName = String(type.name || '').toLowerCase();
      const id = rawName.includes('premium') ? 'premium' : rawName.includes('pro') ? 'pro' : 'basic';
      const basePrice = Number(type.price) || (id === 'premium' ? 250000 : id === 'pro' ? 25000 : 10000);
      const isAnnual = id === 'premium';
      const period = isAnnual ? '/an' : '/mois';
      const color = id === 'premium' ? '#28a745' : id === 'pro' ? '#007bff' : '#6c757d';
      const icon = id === 'premium' ? <FaGem /> : id === 'pro' ? <FaCrown /> : <FaCheckCircle />;
      const savings = id === 'premium' ? '30%' : id === 'pro' ? '20%' : null;

      return {
        id,
        name: getTranslation(`plans.${id}.name`, id === 'premium' ? 'Premium' : id === 'pro' ? 'Pro' : 'Basique'),
        basePrice,
        period,
        features: getPlanFeatures(id),
        color,
        icon,
        popular: id === 'pro',
        savings,
        isAnnual,
        rawName: type.name,
        duration: Number(type.duration) || (isAnnual ? 12 : 1),
      };
    });
  };

  useEffect(() => {
    const loadPlans = async () => {
      setPlansLoading(true);
      try {
        const fetched = await fetchMembershipTypes();
        const mapped = mapMembershipTypesToPlans(fetched);
        setPlans(mapped);
        if (!mapped.some(p => p.id === selectedPlan)) {
          setSelectedPlan(mapped[0]?.id || 'basic');
        }
      } catch (error) {
        console.warn('Erreur chargement plans. Utilisation des plans locaux.', error);
        const fallback = getAdaptedPlans();
        setPlans(fallback);
        if (!fallback.some(p => p.id === selectedPlan)) {
          setSelectedPlan(fallback[0]?.id || 'basic');
        }
      } finally {
        setPlansLoading(false);
      }
    };
    loadPlans();
  }, [currentLanguage]);

  // Options de durée (mémorisées)
  const durations = useMemo(() => {
    if (selectedPlan === 'premium') {
      return [
        { value: 1, label: getTranslation('subscription.duration.1year', '1 an') },
        { value: 2, label: getTranslation('subscription.duration.2years', '2 ans') }
      ];
    } else {
      return [
        { value: 1, label: getTranslation('subscription.duration.1month', '1 mois') },
        { value: 3, label: getTranslation('subscription.duration.3months', '3 mois') },
        { value: 6, label: getTranslation('subscription.duration.6months', '6 mois') },
        { value: 12, label: getTranslation('subscription.duration.12months', '12 mois') }
      ];
    }
  }, [selectedPlan, currentLanguage]);

  // Réinitialisation de la durée si invalide (ex: plan premium avec 3 mois)
  useEffect(() => {
    if (durations.length > 0) {
      const isValid = durations.some(d => d.value === duration);
      if (!isValid) setDuration(durations[0].value);
    }
  }, [selectedPlan, durations]);

  // Données du plan sélectionné
  const selectedPlanData = useMemo(() => plans.find(p => p.id === selectedPlan), [plans, selectedPlan]);

  // Prix total et prix par période (calculés dynamiquement)
  const totalAmount = useMemo(() => {
    if (!selectedPlanData) return 0;
    return selectedPlanData.basePrice * duration;
  }, [selectedPlanData, duration]);

  const pricePerPeriod = useMemo(() => {
    if (!selectedPlanData) return 0;
    return selectedPlanData.basePrice;
  }, [selectedPlanData]);

  // Formatage monétaire
  const formatPrice = (price) => new Intl.NumberFormat('fr-MG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

  // Gestionnaires
  const handleDurationChange = (e) => setDuration(parseInt(e.target.value));
  const handleCardInput = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'number') formatted = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
    else if (name === 'expiry') formatted = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/').slice(0, 5);
    else if (name === 'cvc') formatted = value.replace(/\D/g, '').slice(0, 3);
    setCardDetails(prev => ({ ...prev, [name]: formatted }));
  };
  const handleMobileMoneyInput = (e) => {
    const { name, value } = e.target;
    setMobileMoneyDetails(prev => ({ ...prev, [name]: value }));
  };

  // Validation du formulaire
  const validateForm = () => {
    if (!acceptedTerms) return getTranslation('validation.termsRequired', 'Vous devez accepter les conditions.');
    if (paymentMethod === 'card') {
      if (!cardDetails.number || cardDetails.number.replace(/\s/g, '').length !== 16) return getTranslation('validation.cardNumberInvalid');
      if (!cardDetails.expiry || cardDetails.expiry.length !== 5) return getTranslation('validation.cardExpiryInvalid');
      if (!cardDetails.cvc || cardDetails.cvc.length !== 3) return getTranslation('validation.cardCVCInvalid');
      if (!cardDetails.name || cardDetails.name.length < 3) return getTranslation('validation.cardNameInvalid');
    } else if (paymentMethod === 'mobile') {
      if (!mobileMoneyDetails.operator) return getTranslation('validation.operatorRequired');
      if (!mobileMoneyDetails.phoneNumber || mobileMoneyDetails.phoneNumber.length < 10) return getTranslation('validation.phoneInvalid');
    }
    return null;
  };

  // ---------- Récupération infos chauffeur (identique) ----------
  const decodeJWT = (token) => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
    } catch { return null; }
  };

  const getChauffeurId = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded?.chauffeurId) return decoded.chauffeurId;
    }
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.id) return userData.id;
      } catch {}
    }
    return null;
  };

  const fetchCompleteDriverInfo = async () => {
    const chauffeurId = getChauffeurId();
    if (!chauffeurId) return null;
    try {
      const user = await verifyToken();
      if (user) return { id: user.id, nom: `${user.firstName || ''} ${user.nom || ''}`.trim(), email: user.email, telephone: user.telephone, type_chauffeur: 'particulier' };
    } catch (error) { console.error('Erreur récupération profil:', error); }
    const storedUser = localStorage.getItem('user') || localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        return { id: userData.id || chauffeurId, nom: userData.nom || userData.name || getTranslation('driver.defaultName', 'Chauffeur'), email: userData.email || '', telephone: userData.telephone || userData.phone || '', type_chauffeur: 'particulier' };
      } catch {}
    }
    return null;
  };

  const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');

  useEffect(() => {
    const loadDriverInfo = async () => {
      const token = getAuthToken();
      if (!token) {
        navigate('/login', { state: { from: '/abonnement' }, replace: true });
        return;
      }

      const driverData = await fetchCompleteDriverInfo();
      if (driverData) {
        setChauffeurInfo({ id: driverData.id, nom: driverData.nom, email: driverData.email, telephone: driverData.telephone, type_chauffeur: driverData.type_chauffeur || 'particulier' });
        localStorage.setItem('currentUser', JSON.stringify(driverData));
        try {
          const status = await checkSubscriptionEligibility();
          if (status.hasActiveSubscription && status.membership) {
            setHasActiveSub(true);
            setExpiryInfo({ daysRemaining: 30, expiryDate: status.membership.startDate, plan: status.currentPlan });
          }
        } catch {}
      } else {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          try {
            const userData = JSON.parse(stored);
            setChauffeurInfo({ id: userData.id || '', nom: userData.nom || userData.name || getTranslation('driver.defaultName', 'Chauffeur'), email: userData.email || '', telephone: userData.telephone || userData.phone || '', type_chauffeur: userData.type_chauffeur || 'particulier' });
          } catch {}
        }
      }
      setLoadingUserInfo(false);
    };
    loadDriverInfo();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  const finalizePayment = (membership, paymentReference) => {
    localStorage.setItem('userSubscription', JSON.stringify({
      ...membership,
      plan: selectedPlan,
      active: true,
      pending: false,
      validationCode: paymentReference,
      totalAmount,
    }));
    setIsPending(false);
    setShowSuccess(true);
    redirectTimeoutRef.current = setTimeout(redirectToDashboard, 800);
  };

  const handlePayment = async () => {
    const validationError = validateForm();
    if (validationError) { setErrorMessage(validationError); setShowError(true); return; }
    if (!chauffeurInfo.id) { setErrorMessage(getTranslation('errors.driverInfoMissing')); setShowError(true); return; }
    setIsProcessing(true);
    setShowError(false);
    try {
      const token = getAuthToken();
      if (!token) throw new Error(getTranslation('errors.authTokenMissing'));
      const planName = selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);
      const paymentReference = await upgradeAccount(planName);

      const membership = await fetchCurrentMembership();
      if (membership?.status === 'ACTIVE') {
        finalizePayment(membership, paymentReference);
        return;
      }

      setIsPending(true);
      setPendingMessage(getTranslation('pending.waitingForActivation', 'Votre demande est bien reçue. Code de validation: ') + paymentReference);
      localStorage.setItem('userSubscription', JSON.stringify({ plan: selectedPlan, active: false, pending: true, validationCode: paymentReference, totalAmount }));

      let attempts = 0;
      const maxAttempts = 12;
      pollingRef.current = setInterval(async () => {
        attempts += 1;
        try {
          const polled = await fetchCurrentMembership();
          if (polled?.status === 'ACTIVE') {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            finalizePayment(polled, paymentReference);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            redirectToDashboard();
          }
        } catch (pollError) {
          console.warn('Polling error:', pollError?.message);
        }
      }, 2000);
    } catch (error) {
      console.error('Erreur abonnement:', error);
      let message = getTranslation('errors.paymentError');
      if (error.response?.data?.message) message = error.response.data.message;
      else if (error.message) message = error.message;
      setErrorMessage(message);
      setShowError(true);
    } finally { setIsProcessing(false); }
  };

  if (loadingUserInfo || plansLoading) {
    return (
      <div className="abonnement-container loading">
        <div className="loading-spinner-large"><FaSpinner className="spinner-icon" />
          <p>{plansLoading ? getTranslation('loading.plans', 'Chargement des offres...') : getTranslation('loading.driverInfo')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="abonnement-container">

      <div className="abonnement-header">
        <h1>{getTranslation('subscription.pageTitle', 'Abonnement')}</h1>
        <p className="subtitle">{getTranslation('subscription.subtitle','Choisissez Votre Abonnement')}</p>
        {hasActiveSub && (
          <div className="active-sub-banner">
            <FaCheckCircle />
            <span>{getTranslation('subscription.currentPlan')}: <strong>{expiryInfo?.plan || selectedPlan}</strong></span>
            <button type="button" className="btn-back-dashboard" onClick={redirectToDashboard}>
              {getTranslation('payment.backToDashboard')}
            </button>
          </div>
        )}
      </div>

      {chauffeurInfo.nom && (
        <div className="driver-info-card">
          <div className="driver-info-content">
            <div className="driver-avatar"><FaUser /></div>
            <div className="driver-details">
              <h4>{chauffeurInfo.nom}</h4>
              {chauffeurInfo.email && <p>{chauffeurInfo.email}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="abonnement-content">
        {/* Section des plans (identique) */}
        <div className="plans-section">
          <h2>{getTranslation('subscription.title')}</h2>
          <div className="plans-grid">
            {plans.map(plan => (
              <div key={plan.id} className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`} onClick={() => setSelectedPlan(plan.id)}>
                {plan.popular && <div className="popular-badge" style={{ backgroundColor: plan.color }}>{getTranslation('subscription.popular')}</div>}
                <div className="plan-header" style={{ borderBottomColor: plan.color }}>
                  <div className="plan-icon" style={{ color: plan.color }}>{plan.icon}</div>
                  <h3>{plan.name}</h3>
                  <div className="plan-period">{plan.isAnnual ? getTranslation('payment.annual') : getTranslation('payment.monthly')}</div>
                </div>
                <div className="plan-price">
                  <div className="price-main"><span className="currency">Ar</span><span className="amount">{formatPrice(plan.basePrice)}</span><span className="period">/{plan.isAnnual ? getTranslation('subscription.year', 'an') : getTranslation('subscription.month', 'mois')}</span></div>
                  {plan.savings && <div className="price-savings" style={{ color: plan.color }}>{plan.savings} {getTranslation('subscription.save')}</div>}
                </div>
                <ul className="plan-features">{plan.features.map((f, i) => <li key={i}><FaCheck className="feature-check" style={{ color: plan.color }} />{f}</li>)}</ul>
                <button className={`btn-select ${selectedPlan === plan.id ? 'selected' : ''}`} style={{ backgroundColor: selectedPlan === plan.id ? plan.color : 'transparent', borderColor: plan.color, color: selectedPlan === plan.id ? '#fff' : plan.color }} onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan.id); }}>{selectedPlan === plan.id ? getTranslation('subscription.currentPlan') : getTranslation('subscription.choosePlan')}</button>
              </div>
            ))}
          </div>
        </div>

        {/* Section configuration */}
        <div className="configuration-section">
          <div className="configuration-header"><FaCalendarAlt className="config-icon" /><h3>{getTranslation('configuration.title')}</h3></div>
          <div className="config-grid">
            <div className="config-item">
              <label htmlFor="duration"><FaCalendar className="icon" /> {getTranslation('configuration.duration')}</label>
              <select id="duration" value={duration} onChange={handleDurationChange} disabled={isProcessing} className="config-select">
                {durations.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <div className="config-hint">{selectedPlan === 'premium' ? getTranslation('configuration.selectYears') : getTranslation('configuration.selectMonths')}</div>
            </div>
            <div className="config-item">
              <label><FaCalendarAlt className="icon" /> {getTranslation('configuration.period')}</label>
              <div className="date-display">
                <div className="date-item"><span className="date-label">{getTranslation('configuration.start')} :</span><span className="date-value">{dates.formattedStartDate}</span></div>
                <div className="date-item"><span className="date-label">{getTranslation('configuration.end')} :</span><span className="date-value">{dates.formattedEndDate}</span></div>
              </div>
              <div className="config-hint">{selectedPlan === 'premium' ? getTranslation('configuration.selectYears') : getTranslation('configuration.selectMonths')} ({formatDurationLabel(duration, selectedPlan === 'premium')})</div>
            </div>
            <div className="config-item">
              <label><FaMoneyBillWave className="icon" /> {getTranslation('configuration.paymentDetails')}</label>
              <div className="price-details">
                <div className="price-item"><span>{getTranslation('configuration.price')} {selectedPlan === 'premium' ? getTranslation('configuration.annual') : getTranslation('configuration.monthly')} :</span><span>Ar {formatPrice(pricePerPeriod)}</span></div>
                <div className="price-item"><span>{getTranslation('configuration.durationLabel')} :</span><span>{formatDurationLabel(duration, selectedPlan === 'premium')}</span></div>
                <div className="price-total"><span>{getTranslation('configuration.total')} :</span><strong>Ar {formatPrice(totalAmount)}</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Section paiement */}
        <div className="payment-section">
          <div className="payment-header"><FaCreditCard className="payment-icon" /><h2>{getTranslation('payment.title')}</h2></div>
          <div className="payment-methods">
            <div className="method-tabs">
              <button className={`method-tab ${paymentMethod === 'card' ? 'active' : ''}`} onClick={() => setPaymentMethod('card')} disabled={isProcessing}>💳 {getTranslation('payment.methods.card')}</button>
              <button className={`method-tab ${paymentMethod === 'mobile' ? 'active' : ''}`} onClick={() => setPaymentMethod('mobile')} disabled={isProcessing}>📱 {getTranslation('payment.methods.mobile')}</button>
            </div>
            {paymentMethod === 'card' ? (
              <div className="card-form">
                <div className="form-group"><label htmlFor="cardName">{getTranslation('payment.cardholderName')} *</label><input id="cardName" type="text" name="name" value={cardDetails.name} onChange={handleCardInput} placeholder={getTranslation('payment.cardholderPlaceholder')} disabled={isProcessing} required /></div>
                <div className="form-group"><label htmlFor="cardNumber">{getTranslation('payment.cardNumber')} *</label><div className="card-input-wrapper"><input id="cardNumber" type="text" name="number" value={cardDetails.number} onChange={handleCardInput} placeholder="1234 5678 9012 3456" disabled={isProcessing} maxLength="19" required /><FaLock className="secure-icon" /></div></div>
                <div className="card-details-row">
                  <div className="form-group"><label htmlFor="cardExpiry">{getTranslation('payment.cardExpiry')} *</label><input id="cardExpiry" type="text" name="expiry" value={cardDetails.expiry} onChange={handleCardInput} placeholder="MM/AA" disabled={isProcessing} maxLength="5" required /></div>
                  <div className="form-group"><label htmlFor="cardCVC">{getTranslation('payment.cardCVC')} *</label><div className="cvc-input-wrapper"><input id="cardCVC" type="text" name="cvc" value={cardDetails.cvc} onChange={handleCardInput} placeholder="123" disabled={isProcessing} maxLength="3" required /><FaShieldAlt className="secure-icon" /></div></div>
                </div>
              </div>
            ) : (
              <div className="mobile-money-form">
                <div className="form-group"><label htmlFor="operator">{getTranslation('payment.operator')} *</label><select id="operator" name="operator" value={mobileMoneyDetails.operator} onChange={handleMobileMoneyInput} disabled={isProcessing} required><option value="">{getTranslation('payment.selectOperator')}</option><option value="orange">Orange Money</option><option value="airtel">Airtel Money</option><option value="mvola">Mvola</option><option value="telma">Telma</option></select></div>
                <div className="form-group"><label htmlFor="phoneNumber">{getTranslation('payment.phoneNumber')} *</label><input id="phoneNumber" type="tel" name="phoneNumber" value={mobileMoneyDetails.phoneNumber} onChange={handleMobileMoneyInput} placeholder={getTranslation('payment.phonePlaceholder')} disabled={isProcessing} required /><div className="input-hint"><FaInfoCircle /> {getTranslation('payment.phoneHint')}</div></div>
              </div>
            )}
            <div className="payment-security"><FaLock className="security-icon" /><span>{getTranslation('payment.securePayment')}</span></div>
            <div className="terms-agreement"><input type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} disabled={isProcessing} /><label htmlFor="terms">{getTranslation('payment.terms')} <a href="/conditions" target="_blank">{getTranslation('payment.conditions')}</a> {getTranslation('payment.and')} <a href="/privacy" target="_blank">{getTranslation('payment.privacy')}</a></label></div>
            <div className="payment-summary">
              <div className="summary-item"><span>{getTranslation('payment.selectedPlan')} :</span><strong>{selectedPlanData?.name}</strong></div>
              <div className="summary-item"><span>{getTranslation('payment.duration')} :</span><strong>{formatDurationLabel(duration, selectedPlan === 'premium')}</strong></div>
              <div className="summary-item"><span>{getTranslation('payment.period')} :</span><strong>{dates.formattedStartDate} {getTranslation('payment.to')} {dates.formattedEndDate}</strong></div>
              <div className="summary-total"><span>{getTranslation('payment.totalAmount')} :</span><strong>Ar {formatPrice(totalAmount)}</strong></div>
            </div>
            <button className={`btn-pay ${isProcessing || isPending ? 'processing' : ''}`} onClick={handlePayment} disabled={isProcessing || isPending}>
              {(isProcessing || isPending) ? <><div className="spinner"></div>{getTranslation('payment.processing')}</> : <><FaCreditCard />{getTranslation('payment.payNow')} - Ar {formatPrice(totalAmount)}</>}
            </button>
            {isPending && (
              <div className="pending-notice">
                <FaSync className="pending-spinner" />
                <p>{pendingMessage || getTranslation('pending.redirecting')}</p>
              </div>
            )}
            <div className="payment-notice"><FaInfoCircle /><p>{isPending ? getTranslation('pending.redirecting') : getTranslation('payment.confirmation')}</p></div>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-icon"><FaCheck /></div>
            <h3>{getTranslation('success.title')}</h3>
            <p>{getTranslation('success.message')}</p>
            <button type="button" className="btn-success" onClick={redirectToDashboard}>
              {getTranslation('success.goToDashboard')}
            </button>
          </div>
        </div>
      )}

      {showError && (
        <div className="error-modal-overlay" onClick={() => setShowError(false)}>
          <div className="error-modal" onClick={(e) => e.stopPropagation()}>
            <FaExclamationCircle className="error-icon" />
            <h3>{getTranslation('errors.title')}</h3>
            <p>{errorMessage}</p>
            <button type="button" className="btn-error" onClick={() => setShowError(false)}>
              {getTranslation('errors.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Abonnement;