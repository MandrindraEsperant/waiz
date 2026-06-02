import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaLock, FaEye, FaEyeSlash, FaTimes, FaArrowLeft, FaCheck } from 'react-icons/fa';
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

function NouveauMotDePasse() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    nouveauMotDePasse: '',
    confirmerMotDePasse: ''
  });
  const [showPassword, setShowPassword] = useState({
    nouveau: false,
    confirmer: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  // Récupérer les données depuis la navigation
  const { email, token, code } = location.state || {};

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

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Effacer les erreurs quand l'utilisateur tape
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError(null);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nouveauMotDePasse) {
      newErrors.nouveauMotDePasse = t('validation.newPasswordRequired');
    } else if (formData.nouveauMotDePasse.length < 4) {
      newErrors.nouveauMotDePasse = t('validation.passwordMinLength');
    }

    if (!formData.confirmerMotDePasse) {
      newErrors.confirmerMotDePasse = t('validation.confirmPasswordRequired');
    } else if (formData.nouveauMotDePasse !== formData.confirmerMotDePasse) {
      newErrors.confirmerMotDePasse = t('validation.passwordsNotMatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Vérifier que nous avons toutes les données nécessaires
    if (!email || !token || !code) {
      setError(t('errors.missingData'));
      showToast(t('errors.missingData'), true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authToken = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (authToken) {
        const { updateUserProfile } = await import('../../services/waizApi');
        const { encryptPassword } = await import('../../utils/encryption');
        await updateUserProfile({ password: encryptPassword(formData.nouveauMotDePasse) });
        showToast(t('success.passwordReset'));
        localStorage.removeItem('resetToken');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Réinitialisation par email non disponible. Connectez-vous ou contactez le support.');
        showToast('Fonctionnalité non disponible sans connexion.', true);
      }
    } catch (err) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', err);
      
      if (err.response) {
        if (err.response.status === 400) {
          setError(t('errors.invalidData'));
        } else if (err.response.status === 404) {
          setError(t('errors.emailNotFound'));
        } else if (err.response.status === 410) {
          setError(t('errors.codeExpired'));
        } else {
          setError(t('errors.resetError'));
        }
      } else if (err.request) {
        setError(t('errors.networkError'));
      } else {
        setError(t('errors.configError') + ': ' + err.message);
      }
      
      showToast(t('errors.resetError'), true);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: '' };
    if (password.length < 4) return { strength: 1, text: t('passwordStrength.weak') };
    if (password.length < 8) return { strength: 2, text: t('passwordStrength.medium') };
    return { strength: 3, text: t('passwordStrength.strong') };
  };

  const strength = passwordStrength(formData.nouveauMotDePasse);

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
              <FaLock className="header-icon" />
              <h1>{t('newPassword.title')}</h1>
            </div>
            <button 
              className="btn-cancel"
              onClick={() => navigate('/validation')}
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
                    <strong>{t('newPassword.security')}</strong>
                    <span>{t('newPassword.securityDesc')}</span>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">⚡</div>
                  <div className="feature-text">
                    <strong>{t('newPassword.requirements')}</strong>
                    <span>{t('newPassword.requirementsDesc')}</span>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✅</div>
                  <div className="feature-text">
                    <strong>{t('newPassword.confirmation')}</strong>
                    <span>{t('newPassword.confirmationDesc')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Formulaire */}
            <div className="form-section-inscription">
              <div className="form-card">
                <div className="card-header">
                  <h2>{t('newPassword.createNew')}</h2>
                  <p className="card-subtitle">
                    {t('newPassword.instructions')}
                  </p>
                </div>

                {error && (
                  <div className="error-banner">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="client-form" noValidate>
                  <div className="form-row">
                    <div className="form-group password-group">
                      <label htmlFor="nouveauMotDePasse">
                        {t('newPassword.newPassword')}
                      </label>
                      <div className="password-input-container">
                        <input
                          id="nouveauMotDePasse"
                          type={showPassword.nouveau ? "text" : "password"}
                          name="nouveauMotDePasse"
                          value={formData.nouveauMotDePasse}
                          onChange={handleInputChange}
                          required
                          placeholder={t('newPassword.newPasswordPlaceholder')}
                          disabled={loading}
                          className={errors.nouveauMotDePasse ? 'error' : ''}
                          style={{width: '400px', paddingRight: '40px'}}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => togglePasswordVisibility('nouveau')}
                          disabled={loading}
                        >
                          {showPassword.nouveau ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {errors.nouveauMotDePasse && (
                        <span className="error-message">{errors.nouveauMotDePasse}</span>
                      )}
                      
                      {/* Indicateur de force du mot de passe */}
                      {formData.nouveauMotDePasse && (
                        <div className="password-strength">
                          <div className="strength-bar">
                            <div 
                              className={`strength-fill strength-${strength.strength}`}
                            ></div>
                          </div>
                          <span className="strength-text">{strength.text}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group password-group">
                      <label htmlFor="confirmerMotDePasse">
                        {t('newPassword.confirmPassword')}
                      </label>
                      <div className="password-input-container">
                        <input
                          id="confirmerMotDePasse"
                          type={showPassword.confirmer ? "text" : "password"}
                          name="confirmerMotDePasse"
                          value={formData.confirmerMotDePasse}
                          onChange={handleInputChange}
                          required
                          placeholder={t('newPassword.confirmPasswordPlaceholder')}
                          disabled={loading}
                          className={errors.confirmerMotDePasse ? 'error' : ''}
                          style={{width: '400px', paddingRight: '40px'}}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => togglePasswordVisibility('confirmer')}
                          disabled={loading}
                        >
                          {showPassword.confirmer ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {errors.confirmerMotDePasse && (
                        <span className="error-message">{errors.confirmerMotDePasse}</span>
                      )}
                      
                      {/* Indicateur de correspondance */}
                      {formData.confirmerMotDePasse && (
                        <div className="password-match">
                          {formData.nouveauMotDePasse === formData.confirmerMotDePasse ? (
                            <span className="match-success">✅ {t('newPassword.passwordsMatch')}</span>
                          ) : (
                            <span className="match-error">❌ {t('newPassword.passwordsNotMatch')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-actions" style={{ marginTop: '30px' }}>
                    <button 
                      type="button" 
                      className="btn-cancel"
                      onClick={() => navigate('/validation')}
                      disabled={loading}
                    >
                      <FaArrowLeft className="btn-icon" />
                      <span>{t('back')}</span>
                    </button>
                    
                    <button 
                      type="submit" 
                      className="btn-submit"
                      disabled={loading || !formData.nouveauMotDePasse || !formData.confirmerMotDePasse}
                    >
                      {loading ? (
                        <>
                          <div className="loading-spinner"></div>
                          <span>{t('newPassword.resetting')}</span>
                        </>
                      ) : (
                        <>
                          <FaCheck className="btn-icon" />
                          <span>{t('newPassword.reset')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="password-requirements">
                  <h4>{t('newPassword.requirementsTitle')}</h4>
                  <ul>
                    <li className={formData.nouveauMotDePasse.length >= 4 ? 'requirement-met' : ''}>
                      {t('newPassword.minLength')}
                    </li>
                    <li className={formData.nouveauMotDePasse === formData.confirmerMotDePasse && formData.confirmerMotDePasse !== '' ? 'requirement-met' : ''}>
                      {t('newPassword.mustMatch')}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NouveauMotDePasse;