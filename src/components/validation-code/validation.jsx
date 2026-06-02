import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaKey, FaTimes, FaArrowLeft, FaCheck, FaRedo } from 'react-icons/fa';
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

function VerificationCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [resending, setResending] = useState(false);

  // Récupérer l'email depuis la navigation
  const email = location.state?.email || '';

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

  const handleCodeChange = (index, value) => {
    // Accepter seulement les chiffres
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus sur le champ suivant
    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Effacer les erreurs quand l'utilisateur tape
    if (errors.code) {
      setErrors(prev => ({ ...prev, code: '' }));
    }
    if (error) setError(null);
  };

  const handleKeyDown = (index, e) => {
    // Navigation avec les flèches et suppression
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const numbers = pasteData.replace(/\D/g, '').split('').slice(0, 6);
    
    const newCode = [...code];
    numbers.forEach((num, index) => {
      if (index < 6) newCode[index] = num;
    });
    
    setCode(newCode);
    
    // Focus sur le dernier champ rempli
    const lastFilledIndex = numbers.length - 1;
    if (lastFilledIndex < 5) {
      const nextInput = document.getElementById(`code-${lastFilledIndex + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const codeString = code.join('');
    
    if (codeString.length !== 6) {
      newErrors.code = t('validation.codeRequired');
    } else if (!/^\d{6}$/.test(codeString)) {
      newErrors.code = t('validation.codeInvalid');
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
      setError('La réinitialisation de mot de passe n\'est pas disponible via l\'API GraphQL Waiz.');
      showToast('Fonctionnalité non disponible. Contactez le support.', true);
    } catch (err) {
      console.error('Erreur lors de la vérification du code:', err);
      
      if (err.response) {
        if (err.response.status === 400) {
          setError(t('errors.invalidCode'));
        } else if (err.response.status === 404) {
          setError(t('errors.emailNotFound'));
        } else if (err.response.status === 410) {
          setError(t('errors.codeExpired'));
        } else {
          setError(t('errors.verificationError'));
        }
      } else if (err.request) {
        setError(t('errors.networkError'));
      } else {
        setError(t('errors.configError') + ': ' + err.message);
      }
      
      showToast(t('errors.verificationError'), true);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError(null);

    try {
      setError('Fonctionnalité non disponible via GraphQL.');
      showToast('Réinitialisation par email non disponible.', true);
    } catch (err) {
      console.error('Erreur lors du renvoi du code:', err);
      setError(t('errors.resendError'));
      showToast(t('errors.resendError'), true);
    } finally {
      setResending(false);
    }
  };

  const isCodeComplete = code.join('').length === 6;

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
              <FaKey className="header-icon" />
              <h1>{t('verification.title')}</h1>
            </div>
            <button 
              className="btn-cancel"
              onClick={() => navigate('/verification')}
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
                  <div className="feature-icon">📧</div>
                  <div className="feature-text">
                    <strong>{t('verification.sentTo')}</strong>
                    <span>{email}</span>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">⏱️</div>
                  <div className="feature-text">
                    <strong>{t('verification.expiresIn')}</strong>
                    <span>{t('verification.fifteenMinutes')}</span>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🔢</div>
                  <div className="feature-text">
                    <strong>{t('verification.sixDigits')}</strong>
                    <span>{t('verification.enterCode')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Formulaire */}
            <div className="form-section-inscription">
              <div className="form-card">
                <div className="card-header">
                  <h2>{t('verification.enterCode')}</h2>
                  <p className="card-subtitle">
                    {t('verification.instructions')}
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
                    <div className="form-group">
                      <label htmlFor="code-0" className="code-label">
                        {t('verification.code')}
                      </label>
                      <div className="code-inputs-container">
                        {code.map((digit, index) => (
                          <input
                            key={index}
                            id={`code-${index}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleCodeChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            disabled={loading}
                            className={`code-input ${errors.code ? 'error' : ''}`}
                            autoFocus={index === 0}
                          />
                        ))}
                      </div>
                      {errors.code && (
                        <span className="error-message" style={{ textAlign: 'center', display: 'block', marginTop: '10px' }}>
                          {errors.code}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-actions" style={{ marginTop: '30px' }}>
                    <button 
                      type="button" 
                      className="btn-cancel"
                      onClick={() => navigate('/verification')}
                      disabled={loading || resending}
                    >
                      <FaArrowLeft className="btn-icon" />
                      <span>{t('back')}</span>
                    </button>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        type="button" 
                        className="btn-resend"
                        onClick={handleResendCode}
                        disabled={resending || loading}
                      >
                        {resending ? (
                          <>
                            <div className="loading-spinner small"></div>
                            <span>{t('verification.resending')}</span>
                          </>
                        ) : (
                          <>
                            <FaRedo className="btn-icon" />
                            <span>{t('verification.resend')}</span>
                          </>
                        )}
                      </button>
                      
                      <button 
                        type="submit" 
                        className="btn-submit"
                        disabled={!isCodeComplete || loading || resending}
                      >
                        {loading ? (
                          <>
                            <div className="loading-spinner"></div>
                            <span>{t('verification.verifying')}</span>
                          </>
                        ) : (
                          <>
                            <FaCheck className="btn-icon" />
                            <span>{t('verification.verify')}</span>
                          </>
                        )}
                      </button>
                    </div>
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

export default VerificationCode;