import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaTimes, FaUserPlus, FaEye, FaEyeSlash, FaChevronDown, FaSearch, FaUser, FaTaxi, FaClock, FaMoneyBillWave, FaShieldAlt } from 'react-icons/fa';
import './inscription.css';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../AuthContext';
import { encryptPassword } from '../../utils/encryption';
import { signup, signin } from '../../services/waizApi';
import { mapGraphQLUserToLocal } from '../../utils/graphqlClient';

import fr from '../../locales/chauffeur/fr.json';
import mg from '../../locales/chauffeur/mg.json';
import en from '../../locales/chauffeur/en.json';

const locales = { fr, mg, en };

function Inscription() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { language: currentLanguage } = useLanguage();

  const [userType, setUserType] = useState('chauffeur');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sélecteur de pays
  const [selectedCountry, setSelectedCountry] = useState('MG');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countrySelectorRef = useRef(null);

  const t = (key, variables = {}) => {
    const keys = key.split('.');
    const resolve = (locale) => {
      let value = locale;
      for (const k of keys) value = value?.[k];
      return value;
    };
    let translation = resolve(locales[currentLanguage]) || resolve(locales.fr);
    if (!translation) return key;
    return String(translation).replace(/\{\{(\w+)\}\}/g, (_, v) => variables[v] ?? _);
  };

  const countries = useMemo(() => [
    { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬' },
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  ], []);

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return countries;
    return countries.filter(c =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch)
    );
  }, [countries, countrySearch]);

  const getCurrentCountry = () => countries.find(c => c.code === selectedCountry) || countries[0];
  const getFullPhoneNumber = () => getCurrentCountry().dialCode + formData.phone.replace(/\D/g, '');

  const getPhonePlaceholder = () => {
    const placeholders = { 'MG': '321234567', 'FR': '612345678', 'US': '5551234567' };
    return placeholders[selectedCountry] || '123456789';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'phone') newValue = value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = t('validation.firstNameRequired');
    if (!formData.lastName.trim()) newErrors.lastName = t('validation.lastNameRequired');
    if (!formData.email.trim()) newErrors.email = t('validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('validation.emailInvalid');
    if (!formData.password) newErrors.password = t('validation.passwordRequired');
    else if (formData.password.length < 4) newErrors.password = t('validation.passwordMinLength');
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t('validation.passwordsDontMatch');
    if (!formData.phone) newErrors.phone = t('validation.phoneRequired');
    else if (formData.phone.length < 8) newErrors.phone = t('validation.phoneMinLength');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showToast = (message, isError = false) => {
    setSuccessMessage(isError ? `❌ ${message}` : `✅ ${message}`);
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    const role = userType === 'chauffeur' ? 'DRIVER' : 'CUSTOMER';
    const fullPhone = getFullPhoneNumber();

    try {
      const encryptedPassword = encryptPassword(formData.password);
      const encryptedConfirm = encryptPassword(formData.confirmPassword);

      await signup({
        name: formData.lastName,
        firstName: formData.firstName,
        phone: fullPhone,
        email: formData.email,
        password: encryptedPassword,
        passwordConfirmation: encryptedConfirm,
        role,
      });

      const signinData = await signin(formData.email, encryptedPassword);
      if (!signinData?.token) throw new Error(t('errors.loginAfterSignup'));

      const userData = mapGraphQLUserToLocal(signinData.user);
      showToast(userType === 'chauffeur' ? t('success.driverRegistered') : t('success.clientRegistered'));
      login(signinData.token, userData, {
        redirectPath: userType === 'chauffeur' ? '/Abonnement' : '/Reserver',
      });
    } catch (err) {
      console.error(err);
      const graphqlError = err.message?.includes('Network Error')
        ? t('errors.networkError')
        : (err.message || t('errors.registrationError'));
      showToast(graphqlError, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container-Client">
      {showSuccessPopup && (
        <div className="success-popup">
          <div className="success-content">
            <span className="success-icon">{successMessage.includes('❌') ? '❌' : '✅'}</span>
            <span>{successMessage.replace('❌ ', '').replace('✅ ', '')}</span>
            <button className="close-success" onClick={() => setShowSuccessPopup(false)}>×</button>
          </div>
        </div>
      )}

      <div className="content-container-chauffeur">
        <div className="nouveau-client-content">
          <div className="page-header">
            <div className="header-title">
              <FaUserPlus className="header-icon" />
              <h1>{userType === 'chauffeur' ? t('pageTitle') : t('pageTitleClient')}</h1>
            </div>
            <button className="btn-cancel" onClick={() => navigate('/Login')} disabled={loading}>
              <FaTimes className="btn-icon" /> <span>{t('back')}</span>
            </button>
          </div>

          {/* Sélecteur client/chauffeur */}
          <div className="user-type-selector">
            <div className="selector-container">
              <button type="button" className={`type-btn ${userType === 'client' ? 'active' : ''}`}
                onClick={() => setUserType('client')} disabled={loading}>
                <FaUser className="type-icon" />
                <span className="type-label">{t('clientLabel')}</span>
                <span className="type-desc">{t('clientDesc')}</span>
              </button>
              <button type="button" className={`type-btn ${userType === 'chauffeur' ? 'active' : ''}`}
                onClick={() => setUserType('chauffeur')} disabled={loading}>
                <FaTaxi className="type-icon" />
                <span className="type-label">{t('chauffeurLabel')}</span>
                <span className="type-desc">{t('driverDesc')}</span>
              </button>
            </div>
          </div>

          <div className="inscription-container">
            <div className="image-section">
              <div className="image-wrapper">
                <div className="image-placeholder">
                  {userType === 'chauffeur' ? (
                    <FaTaxi className="placeholder-icon" />
                  ) : (
                    <FaUser className="placeholder-icon" />
                  )}
                  <h3>
                    {userType === 'chauffeur'
                      ? t('features.joinTeam')
                      : t('features.joinPassengers')}
                  </h3>
                  <p>
                    {userType === 'chauffeur'
                      ? t('features.becomePartner')
                      : t('features.passengerDesc')}
                  </p>
                </div>
              </div>

              <div className="image-features">
                <div className="feature-item">
                  <div className="feature-icon"><FaClock /></div>
                  <div className="feature-text">
                    <strong>{t('features.flexibility')}</strong>
                    <span>{t('features.flexibilityDesc')}</span>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon"><FaMoneyBillWave /></div>
                  <div className="feature-text">
                    <strong>{t('features.income')}</strong>
                    <span>{t('features.incomeDesc')}</span>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon"><FaShieldAlt /></div>
                  <div className="feature-text">
                    <strong>{t('features.security')}</strong>
                    <span>{t('features.securityDesc')}</span>
                  </div>
                </div>
              </div>

              <div className="help-section">
                <div className="help-card">
                  <h3>{t('help.title')}</h3>
                  <ul>
                    <li>{t('help.requiredFields')}</li>
                    <li>{t('help.nameRequirement')}</li>
                    <li>{t('help.passwordRequirement')}</li>
                    <li>{t('help.emailRequirement')}</li>
                    <li>{t('help.phoneRequirement')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Formulaire */}
            <div className="form-section-inscription">
              <div className="form-card">
                <div className="card-header">
                  <h2>{userType === 'client' ? t('clientInfo') : t('driverInfo')}</h2>
                </div>
                <form onSubmit={handleSubmit} className="client-form" noValidate>
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('firstName')}</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} disabled={loading}
                        placeholder={t('firstNamePlaceholder')}
                        className={errors.firstName ? 'error' : ''} />
                      {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                    </div>
                    <div className="form-group">
                      <label>{t('lastName')}</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} disabled={loading}
                        placeholder={t('lastNamePlaceholder')}
                        className={errors.lastName ? 'error' : ''} />
                      {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('email')}</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={loading}
                        placeholder={t('emailPlaceholder')}
                        className={errors.email ? 'error' : ''} />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group password-group">
                      <label>{t('password')}</label>
                      <div className="password-input-container">
                        <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                          placeholder={t('passwordPlaceholder')}
                          onChange={handleInputChange} disabled={loading} className={errors.password ? 'error' : ''} />
                        <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group password-group">
                      <label>{t('confirmPassword')}</label>
                      <div className="password-input-container">
                        <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword}
                          placeholder={t('confirmPasswordPlaceholder')}
                          onChange={handleInputChange} disabled={loading} className={errors.confirmPassword ? 'error' : ''} />
                        <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('phone')}</label>
                      <div className="phone-input-wrapper" ref={countrySelectorRef}>
                        <div className={`country-selector ${showCountryDropdown ? 'open' : ''}`}>
                          <button type="button" className="country-selector-btn" onClick={() => setShowCountryDropdown(!showCountryDropdown)}>
                            <span className="country-flag">{getCurrentCountry().flag}</span>
                            <span className="country-dial-code">{getCurrentCountry().dialCode}</span>
                            <FaChevronDown className={`dropdown-arrow ${showCountryDropdown ? 'rotated' : ''}`} />
                          </button>
                          {showCountryDropdown && (
                            <div className="country-dropdown">
                              <div className="country-search">
                                <FaSearch className="search-icon" />
                                <input type="text" placeholder={t('form.searchCountry')} value={countrySearch}
                                  onChange={(e) => setCountrySearch(e.target.value)} />
                              </div>
                              <div className="country-list">
                                {filteredCountries.map(country => (
                                  <button key={country.code} type="button"
                                    className={`country-option ${selectedCountry === country.code ? 'selected' : ''}`}
                                    onClick={() => {
                                      setSelectedCountry(country.code);
                                      setShowCountryDropdown(false);
                                      setCountrySearch('');
                                    }}>
                                    <span className="country-flag">{country.flag}</span>
                                    <span className="country-name">{country.name}</span>
                                    <span className="country-dial-code">{country.dialCode}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                          disabled={loading} className={`phone-input ${errors.phone ? 'error-input' : ''}`}
                          placeholder={getPhonePlaceholder()} />
                      </div>
                      {errors.phone && <span className="error-message">{errors.phone}</span>}
                      <small className="input-hint">{t('form.fullNumber')} : {getFullPhoneNumber()}</small>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => navigate('/Login')} disabled={loading}>
                      <FaTimes className="btn-icon" /> <span>{t('cancel')}</span>
                    </button>
                    <button type="submit" className="btn-submit" disabled={loading}>
                      {loading ? <div className="loading-spinner" /> : <><FaSave className="btn-icon" /> <span>{t('register')}</span></>}
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

export default Inscription;