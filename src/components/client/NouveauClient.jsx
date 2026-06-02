import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuApp from '../Menu';
import { FaSave, FaTimes, FaUserPlus, FaChevronDown, FaSearch } from 'react-icons/fa';
import { useLanguage } from '../../contexts/LanguageContext';
import fr from '../../locales/client/fr.json';
import en from '../../locales/client/en.json';
import mg from '../../locales/client/mg.json';
import './NouveauClient.css';

function NouveauClient() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  // Chargement des traductions
  const translations = { fr, en, mg };
  const t = translations[language];

  const [client, setClient] = useState({
    Nom: '',
    Telephone: ''
  });
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [errors, setErrors] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('MG');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const countrySelectorRef = useRef(null);

  // Liste complète des pays du monde avec noms traduits
  const countries = useMemo(() => [
    { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬' },
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'US', name: language === 'fr' ? 'États-Unis' : language === 'mg' ? 'Etazonia' : 'United States', dialCode: '+1', flag: '🇺🇸' },
    { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
    { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭' },
    { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
    { code: 'GB', name: language === 'fr' ? 'Royaume-Uni' : language === 'mg' ? 'Fanjakana Mitambatra' : 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
    { code: 'DE', name: language === 'fr' ? 'Allemagne' : language === 'mg' ? 'Alemaina' : 'Germany', dialCode: '+49', flag: '🇩🇪' },
    { code: 'IT', name: language === 'fr' ? 'Italie' : language === 'mg' ? 'Italia' : 'Italy', dialCode: '+39', flag: '🇮🇹' },
    { code: 'ES', name: language === 'fr' ? 'Espagne' : language === 'mg' ? 'Espaina' : 'Spain', dialCode: '+34', flag: '🇪🇸' },
    { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
    { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮' },
    { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲' },
    { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦' },
    { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳' },
    { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿' },
    { code: 'BR', name: language === 'fr' ? 'Brésil' : language === 'mg' ? 'Brezila' : 'Brazil', dialCode: '+55', flag: '🇧🇷' },
    { code: 'CN', name: language === 'fr' ? 'Chine' : language === 'mg' ? 'Sina' : 'China', dialCode: '+86', flag: '🇨🇳' },
    { code: 'IN', name: language === 'fr' ? 'Inde' : language === 'mg' ? 'Indy' : 'India', dialCode: '+91', flag: '🇮🇳' },
    { code: 'JP', name: language === 'fr' ? 'Japon' : language === 'mg' ? 'Japana' : 'Japan', dialCode: '+81', flag: '🇯🇵' },
    { code: 'KR', name: language === 'fr' ? 'Corée du Sud' : language === 'mg' ? 'Korea Atsimo' : 'South Korea', dialCode: '+82', flag: '🇰🇷' },
    { code: 'AU', name: language === 'fr' ? 'Australie' : language === 'mg' ? 'Aostralia' : 'Australia', dialCode: '+61', flag: '🇦🇺' },
    { code: 'NZ', name: language === 'fr' ? 'Nouvelle-Zélande' : language === 'mg' ? 'Nouvelle-Zélande' : 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
    { code: 'ZA', name: language === 'fr' ? 'Afrique du Sud' : language === 'mg' ? 'Afrika Atsimo' : 'South Africa', dialCode: '+27', flag: '🇿🇦' },
    { code: 'NG', name: language === 'fr' ? 'Nigéria' : language === 'mg' ? 'Nizeria' : 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
    { code: 'EG', name: language === 'fr' ? 'Égypte' : language === 'mg' ? 'Ejipta' : 'Egypt', dialCode: '+20', flag: '🇪🇬' },
    { code: 'RU', name: language === 'fr' ? 'Russie' : language === 'mg' ? 'Rosia' : 'Russia', dialCode: '+7', flag: '🇷🇺' },
    { code: 'TR', name: language === 'fr' ? 'Turquie' : language === 'mg' ? 'Torkia' : 'Turkey', dialCode: '+90', flag: '🇹🇷' },
    { code: 'SA', name: language === 'fr' ? 'Arabie Saoudite' : language === 'mg' ? 'Arabia Saodita' : 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
    { code: 'AE', name: language === 'fr' ? 'Émirats Arabes Unis' : language === 'mg' ? 'Emirata Arabo Mitambatra' : 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  ], [language]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return countries;
    return countries.filter(country => 
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.dialCode.includes(countrySearch) ||
      country.code.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countries, countrySearch]);

  const getCurrentCountry = () => {
    return countries.find(country => country.code === selectedCountry) || countries[0];
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countrySelectorRef.current && !countrySelectorRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    if (name === 'Telephone') {
      formattedValue = value.replace(/\D/g, '');
    }
    
    setClient(prevState => ({
      ...prevState,
      [name]: formattedValue
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCountrySelect = (countryCode) => {
    setSelectedCountry(countryCode);
    setShowCountryDropdown(false);
    setCountrySearch('');
    
    if (errors.Telephone) {
      setErrors(prev => ({ ...prev, Telephone: '' }));
    }
  };

  const toggleCountryDropdown = () => {
    setShowCountryDropdown(!showCountryDropdown);
    setCountrySearch('');
  };

  const validateForm = () => {
    const newErrors = {};
    const currentCountry = getCurrentCountry();
    
    if (!client.Nom.trim()) {
      newErrors.Nom = t.validation.nameRequired;
    } else if (client.Nom.trim().length < 2) {
      newErrors.Nom = t.validation.nameMinLength;
    }
    
    if (!client.Telephone.trim()) {
      newErrors.Telephone = t.validation.phoneRequired;
    } else {
      const phoneRegex = getPhoneRegex(currentCountry.code);
      if (!phoneRegex.test(client.Telephone)) {
        newErrors.Telephone = t.phoneErrors[currentCountry.code] || t.phoneErrors.default;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPhoneRegex = (countryCode) => {
    const regexMap = {
      'MG': /^[3][2-8]\d{7}$/,
      'FR': /^[1-9]\d{8}$/,
      'US': /^\d{10}$/,
      'GB': /^\d{10,11}$/,
      'DE': /^\d{10,11}$/,
      'CA': /^\d{10}$/,
      'AU': /^\d{9}$/,
      'BR': /^\d{10,11}$/,
      'CN': /^\d{11}$/,
      'IN': /^\d{10}$/,
      'JP': /^\d{10,11}$/,
    };
    return regexMap[countryCode] || /^\d{6,15}$/;
  };

  const getFullPhoneNumber = () => {
    const currentCountry = getCurrentCountry();
    return currentCountry.dialCode + ' ' + client.Telephone;
  };

  const getPhonePlaceholder = () => {
    const currentCountry = getCurrentCountry();
    const placeholders = {
      'MG': '321234567',
      'FR': '612345678',
      'US': '5551234567',
      'GB': '7912345678',
      'DE': '15123456789',
      'CA': '5551234567',
      'AU': '412345678',
      'BR': '11987654321',
      'CN': '13123456789',
      'IN': '9876543210',
      'JP': '9012345678'
    };
    return placeholders[currentCountry.code] || t.form.phone;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      setSuccessMessage('❌ Les clients s\'inscrivent via la page Inscription (rôle CUSTOMER).');
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuToggle = (isOpen) => {
    setIsMenuOpen(isOpen);
  };

  const getPhoneFormatHint = () => {
    const currentCountry = getCurrentCountry();
    if (currentCountry.code === 'MG') {
      return '32-38 XXXXXXX';
    }
    return language === 'fr' ? 'numéro local' : language === 'mg' ? 'laharana eo an-toerana' : 'local number';
  };

  const getExampleText = () => {
    return language === 'fr' ? 'Ex' : language === 'mg' ? 'Ohatra' : 'Ex';
  };

  return (
    <div className="app-container-Client">
      <MenuApp onToggle={handleMenuToggle} />
      
      <div className={`content-container ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}>
        <div className="nouveau-client-content">
          
          {showSuccessPopup && (
            <div className="success-popup">
              <div className="success-content">
                <span className="success-icon" style={{marginTop:'-44px', width:'10px', height:'30px', fontSize:'40px'}}>
                  {successMessage.includes('❌') ? '❌' : '✅'}
                </span>
                <span style={{marginTop:'-70px', marginLeft:'20px'}}>{successMessage.replace('❌ ', '')}</span>
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

          <div className="page-header">
            <div className="header-title">
              <FaUserPlus className="header-icon" />
              <h1>{t.header.title}</h1>
            </div>
            <button 
              className="btn-back"
              onClick={() => navigate('/Affichage')}
              disabled={loading}
            >
              <FaTimes className="btn-icon" />
              <span>{t.header.back}</span>
            </button>
          </div>

          <div className="form-section">
            <div className="form-card">
              <div className="card-header">
                <h2>{t.form.clientInfo}</h2>
                <p>{t.form.formDescription}</p>
              </div>

              <form onSubmit={handleSubmit} className="client-form" noValidate>
                {/* Champ Nom */}
                <div className="form-row">
                  <div className="form-group" style={{marginTop:'-20px'}}>
                    <label htmlFor="nom">{t.form.name} {t.form.required}</label>
                    <input
                      id="nom"
                      type="text"
                      name="Nom"
                      value={client.Nom}
                      onChange={handleInputChange}
                      required
                      placeholder={t.form.namePlaceholder}
                      disabled={loading}
                      className={errors.Nom ? 'error-input' : ''}
                      maxLength="100"
                    />
                    {errors.Nom && (
                      <span className="error-message">{errors.Nom}</span>
                    )}
                    <div className="input-info">
                      <span className="char-count">{client.Nom.length}/100 {t.form.charCount}</span>
                    </div>
                  </div>
                </div>

                {/* Champ Téléphone avec sélecteur de pays */}
                <div className="form-row">
                  <div className="form-group" style={{marginTop:'-40px'}}>
                    <label htmlFor="telephone">{t.form.phone} {t.form.required}</label>
                    <div className="phone-input-wrapper" ref={countrySelectorRef}>
                      <div className={`country-selector ${showCountryDropdown ? 'open' : ''}`}>
                        <button
                          type="button"
                          className="country-selector-btn"
                          onClick={toggleCountryDropdown}
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
                                placeholder={t.form.searchCountry}
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
                              {filteredCountries.length === 0 && (
                                <div className="no-results">
                                  {t.form.noResults}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="phone-input-container">
                        <input
                          id="telephone"
                          type="tel"
                          name="Telephone"
                          value={client.Telephone}
                          onChange={handleInputChange}
                          required
                          placeholder={`${getExampleText()}: ${getPhonePlaceholder()}`}
                          disabled={loading}
                          className={`phone-input ${errors.Telephone ? 'error-input' : ''}`}
                          maxLength="15"
                        />
                      </div>
                    </div>
                    
                    {errors.Telephone && (
                      <span className="error-message">{errors.Telephone}</span>
                    )}
                    
                    <div className="input-info">
                      <small className="input-hint">
                        {t.form.format}: {getCurrentCountry().dialCode} {getPhoneFormatHint()}
                      </small>
                      <div className="phone-preview">
                        <small>{t.form.fullNumber}: <strong>{getFullPhoneNumber()}</strong></small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions" style={{marginTop:'-40px'}}>
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => navigate('/Affichage')}
                    disabled={loading}
                  >
                    <FaTimes className="btn-icon" />
                    <span>{t.header.cancel}</span>
                  </button>
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner"></div>
                        <span>{t.header.saving}</span>
                      </>
                    ) : (
                      <>
                        <FaSave className="btn-icon" />
                        <span>{t.header.save}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="help-section-client">
            <div className="help-card-client">
              <h3>{t.help.title}</h3>
              <ul>
                {t.help.points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NouveauClient;