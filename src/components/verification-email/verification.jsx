import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaTimes, FaArrowLeft, FaCheck } from 'react-icons/fa';
import '../chauffeur/inscription.css';
import { useLanguage } from '../../contexts/LanguageContext';

// Import des traductions
import fr from '../../locales/verification/fr.json';
import mg from '../../locales/verification/mg.json';
import en from '../../locales/verification/en.json';

const locales = {
  fr: fr,
  mg: mg,
  en: en
};

function Verification() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  // Utilisation du contexte de langue
  const { language: currentLanguage } = useLanguage();

  // Fonction utilitaire pour obtenir les traductions
  const t = (key, variables = {}) => {
    const keys = key.split('.');
    let translation = locales[currentLanguage];
    
    for (const k of keys) {
      translation = translation?.[k];
      if (!translation) break;
    }
    
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    return translation.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return variables[variable] || match;
    });
  };

  const showToast = (message, isError = false) => {
    setSuccessMessage(isError ? `❌ ${message}` : `✅ ${message}`);
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!isValidEmail(email)) {
      newErrors.email = t('validation.emailInvalid');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setError('La réinitialisation de mot de passe n\'est pas encore disponible via l\'API GraphQL. Contactez le support.');
      showToast('Fonctionnalité non disponible. Utilisez updateUser depuis les paramètres si vous êtes connecté.', true);
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'email:', err);
      
      if (err.response) {
        if (err.response.status === 404) {
          setError(t('errors.emailNotFound'));
        } else if (err.response.status === 500) {
          setError(t('errors.serverError'));
        } else {
          setError(t('errors.resetEmailError'));
        }
      } else if (err.request) {
        setError(t('errors.networkError'));
      } else {
        setError(t('errors.configError') + ': ' + err.message);
      }
      
      showToast(t('errors.resetEmailError'), true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container-Client">
      {/* ✅ TOAST DE SUCCÈS */}
      {showSuccessPopup && (
        <div className="success-popup">
          <div className="success-content">
            <span className="success-icon" style={{marginTop:'-44px', width:'10px', height:'30px', fontSize:'40px'}}>
              {successMessage.includes('❌') ? '❌' : '✅'}
            </span>
            <span style={{marginTop:'-70px', marginLeft:'20px'}}>{successMessage.replace('❌ ', '').replace('✅ ', '')}</span>
            <button 
              className="close-success" 
              style={{marginTop:'-70px'}}
              onClick={() => setShowSuccessPopup(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className='content-container-chauffeur'>
        <div className="nouveau-client-content">
          <div className="page-header">
            <div className="header-title">
              <FaEnvelope className="header-icon" />
              <h1>{t('forgotPassword.title')}</h1>
            </div>
            <button 
              className="btn-cancel"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              <FaTimes className="btn-icon" />
              <span>{t('back')}</span>
            </button>
          </div>

          <div className="inscription-container">
            {/* Section Informations */}
            <div className="image-section">
              <div className="image-features">
                <div className="feature-item">
                  <div className="feature-icon">🔒</div>
                  <div className="feature-text">
                    <strong>{t('forgotPassword.security')}</strong>
                    <span>{t('forgotPassword.securityDesc')}</span>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">⚡</div>
                  <div className="feature-text">
                    <strong>{t('forgotPassword.fast')}</strong>
                    <span>{t('forgotPassword.fastDesc')}</span>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📧</div>
                  <div className="feature-text">
                    <strong>{t('forgotPassword.email')}</strong>
                    <span>{t('forgotPassword.emailDesc')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Formulaire */}
            <div className="form-section-inscription">
              <div className="form-card">
                <div className="card-header">
                  <h2>{t('forgotPassword.enterEmail')}</h2>
                  <p className="card-subtitle">{t('forgotPassword.instructions')}</p>
                </div>

                {error && (
                  <div className="error-banner">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="client-form" noValidate>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">{t('email')}</label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) {
                            setErrors(prev => ({ ...prev, email: '' }));
                          }
                          if (error) setError(null);
                        }}
                        required
                        placeholder={t('emailPlaceholder')}
                        disabled={loading}
                        className={errors.email ? 'error' : ''}
                        style={{width: '400px'}}
                        autoFocus
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                  </div>

                  <div className="form-actions" style={{marginTop: '20px'}}>
                    <button 
                      type="button" 
                      className="btn-cancel"
                      onClick={() => navigate('/login')}
                      disabled={loading}
                    >
                      <FaArrowLeft className="btn-icon" />
                      <span>{t('backToLogin')}</span>
                    </button>
                    <button 
                      type="submit" 
                      className="btn-submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="loading-spinner"></div>
                          <span>{t('sending')}</span>
                        </>
                      ) : (
                        <>
                          <FaCheck className="btn-icon" />
                          <span>{t('forgotPassword.sendResetLink')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Verification;