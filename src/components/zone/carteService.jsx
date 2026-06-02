import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash, FaMapMarkerAlt, FaTimes, FaSave, FaSync, FaEdit, FaList, FaSearch, FaCrosshairs, FaLocationArrow } from 'react-icons/fa';
import './carteService.css';
import MenuApp from '../Menu';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalZones, addLocalZone, updateLocalZone, deleteLocalZone, saveLocalZones } from '../../utils/localZones';

// Import des traductions
import fr from '../../locales/zone/fr.json';
import mg from '../../locales/zone/mg.json';
import en from '../../locales/zone/en.json';

const locales = {
  fr: fr,
  mg: mg,
  en: en
};

// Icône personnalisée pour les marqueurs
const customIcon = new Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Icône pour la recherche automatique
const searchIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Composant pour gérer les clics sur la carte
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    }
  });
  return null;
}

const CarteService = () => {
  const [zones, setZones] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [zoneName, setZoneName] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [autoSearchResult, setAutoSearchResult] = useState(null);
  const [showAutoSearchPopup, setShowAutoSearchPopup] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [suggestedNames, setSuggestedNames] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Utilisation du contexte de langue
  const { language: currentLanguage } = useLanguage();

  // Fonction utilitaire pour obtenir les traductions
  const t = (key, variables = {}) => {
    const translation = locales[currentLanguage]?.[key] || locales.fr[key] || key;
    
    // Remplacer les variables
    return translation.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return variables[variable] || match;
    });
  };

  // Fonction pour extraire les paramètres d'URL
  const getUrlParams = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      nom: searchParams.get('nom'),
      lat: searchParams.get('lat'),
      lng: searchParams.get('lng'),
      search: searchParams.get('search'),
      searchLat: searchParams.get('searchLat'),
      searchLng: searchParams.get('searchLng'),
      searchType: searchParams.get('searchType')
    };
  };

  // Fonction de géocodage inversé améliorée
  const reverseGeocode = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      console.log('📍 Géocodage inversé pour:', { lat, lng });
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=${currentLanguage}`
      );
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Réponse géocodage:', data);
      
      if (data && data.address) {
        const address = data.address;
        const suggestions = [];
        
        // Générer plusieurs suggestions de noms
        if (address.road && address.city) {
          suggestions.push(`${address.road}, ${address.city}`);
        }
        if (address.quarter && address.city) {
          suggestions.push(`${address.quarter}, ${address.city}`);
        }
        if (address.suburb && address.city) {
          suggestions.push(`${address.suburb}, ${address.city}`);
        }
        if (address.neighbourhood && address.city) {
          suggestions.push(`${address.neighbourhood}, ${address.city}`);
        }
        if (address.city) {
          suggestions.push(address.city);
          if (address.road) {
            suggestions.push(`${address.road} - ${address.city}`);
          }
        }
        if (address.town) {
          suggestions.push(address.town);
        }
        if (address.village) {
          suggestions.push(address.village);
        }
        if (address.municipality) {
          suggestions.push(address.municipality);
        }
        if (address.county) {
          suggestions.push(address.county);
        }
        
        // Ajouter une suggestion basée sur les coordonnées
        suggestions.push(`Zone_${lat.toFixed(4)}_${lng.toFixed(4)}`);
        
        // Filtrer les doublons et prendre les 3 premières suggestions
        const uniqueSuggestions = [...new Set(suggestions)].slice(0, 3);
        
        console.log('💡 Suggestions générées:', uniqueSuggestions);
        
        setSuggestedNames(uniqueSuggestions);
        setShowSuggestions(true);
        
        // Pré-remplir avec la meilleure suggestion
        if (uniqueSuggestions.length > 0) {
          setZoneName(uniqueSuggestions[0]);
        }
        
        return uniqueSuggestions[0];
      } else {
        const fallbackName = `Zone_${lat.toFixed(4)}_${lng.toFixed(4)}`;
        setSuggestedNames([fallbackName]);
        setZoneName(fallbackName);
        setShowSuggestions(true);
        return fallbackName;
      }
    } catch (error) {
      console.error('❌ Erreur géocodage:', error);
      const fallbackName = `Zone_${lat.toFixed(4)}_${lng.toFixed(4)}`;
      setSuggestedNames([fallbackName]);
      setZoneName(fallbackName);
      setShowSuggestions(true);
      return fallbackName;
    } finally {
      setIsGeocoding(false);
    }
  };

  // Charger les zones existantes
  const loadZones = async () => {
    setLoading(true);
    try {
      setZones(getLocalZones());
    } catch (error) {
      alert(t('errorLoadingZones'));
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer la recherche automatique depuis le dashboard
  const handleAutoSearchFromDashboard = (params) => {
    console.log('🔍 Recherche automatique depuis dashboard:', params);
    
    if (params.search && params.searchLat && params.searchLng) {
      const lat = parseFloat(params.searchLat);
      const lng = parseFloat(params.searchLng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        setAutoSearchResult({
          name: params.search,
          lat: lat,
          lng: lng,
          type: params.searchType || 'zone_recommendation'
        });
        
        setSelectedPosition([lat, lng]);
        setZoneName(params.search);
        setShowAutoSearchPopup(true);
        setSearchTerm(params.search);
        setIsSearching(true);
        
        console.log('✅ Recherche automatique activée:', {
          name: params.search,
          position: [lat, lng]
        });
      }
    }
  };

  // Fonction pour créer une zone depuis la recherche automatique
  const handleCreateZoneFromAutoSearch = () => {
    if (!autoSearchResult) return;
    
    setZoneName(autoSearchResult.name);
    setSelectedPosition([autoSearchResult.lat, autoSearchResult.lng]);
    setShowPopup(true);
    setShowAutoSearchPopup(false);
    setIsEditing(false);
    setEditingZone(null);
    setShowSuggestions(false); 
    
    console.log('📍 Création zone depuis recherche auto:', autoSearchResult);
  };

  // Fonction pour ignorer la recherche automatique
  const handleIgnoreAutoSearch = () => {
    setShowAutoSearchPopup(false);
    setAutoSearchResult(null);
    navigate('/carte-service', { replace: true });
  };

  useEffect(() => {
    loadZones();
    
    const params = getUrlParams();
    
    // Gérer les paramètres de création de zone normale
    if (params.nom && params.lat && params.lng) {
      const lat = parseFloat(params.lat);
      const lng = parseFloat(params.lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        setZoneName(params.nom);
        setSelectedPosition([lat, lng]);
        setShowPopup(true);
        setShowSuggestions(false); // Pas de suggestions pour les zones du dashboard
        
        setSuccessMessage(t('zoneReady', { nom: params.nom }));
        setShowSuccessPopup(true);
        
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 5000);
      }
    }
    
    // Gérer les paramètres de recherche automatique depuis le dashboard
    if (params.search && params.searchLat && params.searchLng) {
      handleAutoSearchFromDashboard(params);
    }
  }, [location, currentLanguage]);

  // Filtrer les zones basées sur la recherche
  const filteredZones = zones.filter(zone =>
    zone.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.id.toString().includes(searchTerm)
  );

  const handleMapClick = async (latlng) => {
    console.log('🗺️ Clic sur la carte:', latlng);
    
    setSelectedPosition([latlng.lat, latlng.lng]);
    setSuggestedNames([]);
    setShowSuggestions(true); // Afficher les suggestions
    
    // Lancer le géocodage inversé pour obtenir des suggestions de noms
    const suggestedName = await reverseGeocode(latlng.lat, latlng.lng);
    
    setZoneName(suggestedName);
    setShowPopup(true);
    setIsEditing(false);
    setEditingZone(null);
    
    // Fermer la popup de recherche auto si on clique ailleurs
    if (showAutoSearchPopup) {
      setShowAutoSearchPopup(false);
      setAutoSearchResult(null);
    }
  };

  // Fonction pour sélectionner une suggestion de nom
  const handleSuggestionClick = (suggestion) => {
    setZoneName(suggestion);
    setShowSuggestions(false); // Cacher les suggestions après sélection
  };

  // Fonction pour gérer les changements manuels du nom de zone
  const handleZoneNameChange = (e) => {
    setZoneName(e.target.value);
    // Cacher les suggestions si l'utilisateur tape manuellement
    if (e.target.value !== zoneName) {
      setShowSuggestions(false);
    }
  };

  const handleAddZone = async () => {
    if (!zoneName.trim() || !selectedPosition) {
      alert(t('validationNameRequired'));
      return;
    }

    setLoading(true);
    try {
      const zoneData = {
        nom: zoneName.trim(),
        latitude: selectedPosition[0],
        longitude: selectedPosition[1]
      };

      const zoneDataAlt = {
        Nom: zoneName.trim(),
        Latitude: selectedPosition[0],
        Longitude: selectedPosition[1]
      };

      if (isEditing && editingZone) {
        updateLocalZone(editingZone.id, {
          nom: zoneName.trim(),
          Nom: zoneName.trim(),
          latitude: selectedPosition[0],
          longitude: selectedPosition[1],
        });
        setSuccessMessage(t('zoneUpdated', { nom: zoneName.trim() }));
      } else {
        addLocalZone({
          nom: zoneName.trim(),
          Nom: zoneName.trim(),
          latitude: selectedPosition[0],
          longitude: selectedPosition[1],
        });
        setSuccessMessage(t('zoneCreated', { nom: zoneName.trim() }));
        navigate('/carte-service', { replace: true });
      }

      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
      
      setShowPopup(false);
      setZoneName('');
      setSelectedPosition(null);
      setIsEditing(false);
      setEditingZone(null);
      setSuggestedNames([]);
      setShowSuggestions(false);
      setAutoSearchResult(null);
      setShowAutoSearchPopup(false);
      
      loadZones();
    } catch (error) {
      alert(t('errorSavingZone'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditZone = (zone) => {
    setZoneName(zone.nom);
    setSelectedPosition([zone.latitude, zone.longitude]);
    setShowPopup(true);
    setIsEditing(true);
    setEditingZone(zone);
    setSuggestedNames([]);
    setShowSuggestions(false); // Pas de suggestions en mode édition
    
    // Fermer la popup de recherche auto si on édite une zone
    if (showAutoSearchPopup) {
      setShowAutoSearchPopup(false);
      setAutoSearchResult(null);
    }
  };

  const handleDeleteClick = (zone) => {
    setZoneToDelete(zone);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      deleteLocalZone(zoneToDelete.id);
      
      setShowDeleteModal(false);
      setZoneToDelete(null);
      setSuccessMessage(t('zoneDeleted'));
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
      loadZones();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      let errorMessage = t('errorDeletingZone');
      
      if (error.response) {
        errorMessage = `Erreur ${error.response.status}: ${error.response.data?.error || error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Impossible de se connecter au serveur';
      } else {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuToggle = (isOpen) => {
    setIsMenuOpen(isOpen);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  };

  // Fonction pour formater le texte des résultats de recherche
  const getSearchResultsText = () => {
    if (filteredZones.length === 0) {
      return t('noResults', { term: searchTerm });
    } else {
      const plural = filteredZones.length > 1 ? 's' : '';
      return t('searchResults', { 
        count: filteredZones.length, 
        s: plural,
        term: searchTerm 
      });
    }
  };

  // Fonction pour obtenir le type de recherche formaté
  const getSearchTypeText = (type) => {
    const types = {
      'zone_recommendation': 'Recommandation de Zone',
      'hot_zone': 'Zone Chaude',
      'positioning_suggestion': 'Suggestion de Positionnement',
      'predictive_analysis': 'Analyse Prédictive'
    };
    return types[type] || 'Recherche Dashboard';
  };

  const center = [-18.8792, 47.5079]; 

  return (
    <div className="app-container">
      <MenuApp onToggle={handleMenuToggle} />
      
      <div className={`content-container ${isMenuOpen ? 'menu-open' : 'menu-closed'} ${isSearching ? 'searching' : ''}`}>
        <div className="carte-service-container">
          {/* Header avec actions */}
          <div className="content-header" style={{marginLeft:'-5px', marginTop:'8px'}}>
            <h1 className="page-title">
              <FaList className="title-icon" />
              {t('pageTitle')}
            </h1>
            
            {/* Indicateur de recherche automatique */}
            {autoSearchResult && (
              <div className="auto-search-indicator">
                <FaCrosshairs className="indicator-icon" />
                <span>Recherche automatique active</span>
              </div>
            )}
          </div>

          {/* Popup de succès */}
          {showSuccessPopup && (
            <div className="success-popup-zone">
              <div className="success-content-zone">
                <span className="success-icon-zone" style={{marginTop:'-27px', width:'10px', height:'40px', fontSize:'40px'}}>✅</span>
                <span style={{marginTop:'-0px', marginLeft:'40px'}}>{successMessage}</span>
                <button 
                  className="close-success-zone" 
                  style={{marginTop:'-70px'}}
                  onClick={() => setShowSuccessPopup(false)}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Popup de recherche automatique depuis le dashboard */}
          {showAutoSearchPopup && autoSearchResult && (
            <div className="auto-search-popup-overlay">
              <div className="auto-search-popup">
                <div className="popup-header">
                  <h3>
                    <FaSearch className="popup-icon" />
                    Recherche Automatique depuis le Dashboard
                  </h3>
                  <button className="popup-close" onClick={handleIgnoreAutoSearch}>
                    ×
                  </button>
                </div>
                
                <div className="popup-content">
                  <div className="search-info">
                    <div className="search-type-badge">
                      {getSearchTypeText(autoSearchResult.type)}
                    </div>
                    
                    <div className="search-details">
                      <h4>🎯 {autoSearchResult.name}</h4>
                      <div className="coordinates">
                        <div className="coord">
                          <strong>Latitude:</strong> {autoSearchResult.lat.toFixed(6)}
                        </div>
                        <div className="coord">
                          <strong>Longitude:</strong> {autoSearchResult.lng.toFixed(6)}
                        </div>
                      </div>
                    </div>

                    <div className="search-suggestion">
                      <p>
                        <strong>💡 Suggestion:</strong> Cette zone a été recommandée par notre système d'analyse prédictive.
                        Voulez-vous l'ajouter à vos zones de service ?
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="popup-actions">
                  <button 
                    className="btn-ignore-search"
                    onClick={handleIgnoreAutoSearch}
                  >
                    <FaTimes /> Ignorer
                  </button>
                  <button 
                    className="btn-create-from-search"
                    onClick={handleCreateZoneFromAutoSearch}
                  >
                    <FaPlus /> Créer la Zone "{autoSearchResult.name}"
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Indication des paramètres reçus */}
          {getUrlParams().nom && !autoSearchResult && (
            <div className="url-params-info">
              <div className="params-card">
                <h3>{t('zoneFromDashboard')}</h3>
                <div className="params-details">
                  <p><strong>{t('zoneName')}:</strong> {getUrlParams().nom}</p>
                  <p><strong>{t('latitude')}:</strong> {getUrlParams().lat}</p>
                  <p><strong>{t('longitude')}:</strong> {getUrlParams().lng}</p>
                </div>
                <p className="params-instruction">
                  {t('instruction')}
                </p>
              </div>
            </div>
          )}

          {/* Barre de recherche */}
          <div className="search-section">
            <div className="search-container-zone">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input-zone"
              />
              {autoSearchResult && (
                <div className="auto-search-tag">
                  <FaCrosshairs /> Auto-recherche: {autoSearchResult.name}
                </div>
              )}
            </div>

            {searchTerm && (
              <div className="search-results-info">
                <p>
                  {getSearchResultsText()}
                </p>
                {searchTerm && (
                  <button 
                    className="btn-clear-search"
                    onClick={() => {
                      setSearchTerm('');
                      setIsSearching(false);
                      setAutoSearchResult(null);
                      setShowAutoSearchPopup(false);
                      navigate('/carte-service', { replace: true });
                    }}
                  >
                    <FaTimes size={12} />
                    {t('clearSearch')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Carte */}
          <div className="map-container" style={{border:'2px solid #8f8e8eff'}}>
            <MapContainer 
              center={autoSearchResult ? [autoSearchResult.lat, autoSearchResult.lng] : center} 
              zoom={autoSearchResult ? 15 : 13} 
              style={{ height: '500px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              <MapClickHandler onMapClick={handleMapClick} />
              
              {/* Marqueur de recherche automatique */}
              {autoSearchResult && (
                <Marker
                  position={[autoSearchResult.lat, autoSearchResult.lng]}
                  icon={searchIcon}
                >
                  <Popup>
                    <div className="auto-search-marker-popup">
                      <h4>🔍 {autoSearchResult.name}</h4>
                      <p><strong>Type:</strong> {getSearchTypeText(autoSearchResult.type)}</p>
                      <p><strong>Latitude:</strong> {autoSearchResult.lat.toFixed(6)}</p>
                      <p><strong>Longitude:</strong> {autoSearchResult.lng.toFixed(6)}</p>
                      <div className="popup-actions">
                        <button 
                          className="btn-create-small"
                          onClick={handleCreateZoneFromAutoSearch}
                        >
                          <FaPlus /> Créer cette zone
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Afficher les zones existantes */}
              {zones.map(zone => (
                <Marker
                  key={zone.id}
                  position={[zone.latitude, zone.longitude]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => handleEditZone(zone)
                  }}
                >
                </Marker>
              ))}
              
              {/* Afficher la position sélectionnée */}
              {selectedPosition && !autoSearchResult && (
                <Marker position={selectedPosition} icon={customIcon}>
                  <Popup>
                    <div className="selected-position-popup">
                      <h4>{t('newPosition')}</h4>
                      <p>{t('latitude')}: {selectedPosition[0].toFixed(6)}</p>
                      <p>{t('longitude')}: {selectedPosition[1].toFixed(6)}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Popup pour ajouter/modifier une zone */}
          {showPopup && (
            <div className="zone-form-popup">
              <div className="popup-content-zones" style={{width:'500px'}}>
                <div className="popup-header">
                  <h3>
                    {autoSearchResult ? '🎯 Créer une Zone Recommandée' : 
                     isEditing ? t('editZone') : t('addZone')}
                  </h3>
                  <button 
                    className="close-popup" 
                    onClick={() => {
                      setShowPopup(false);
                      setZoneName('');
                      setSelectedPosition(null);
                      setIsEditing(false);
                      setEditingZone(null);
                      setAutoSearchResult(null);
                      setSuggestedNames([]);
                      setShowSuggestions(false);
                    }}
                  >
                    ×
                  </button>
                </div>
                
                {autoSearchResult && (
                  <div className="auto-search-context">
                    <div className="context-badge">
                      <FaCrosshairs /> Recommandation du Dashboard
                    </div>
                    <p className="context-info">
                      Cette zone a été suggérée par notre système d'analyse intelligente
                    </p>
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="zoneName">
                    {t('zoneName')}:
                    {isGeocoding && (
                      <span className="geocoding-indicator">
                        <FaSync className="spinning" /> Recherche du nom...
                      </span>
                    )}
                  </label>
                  <div className="input-with-suggestions">
                    <input
                      id="zoneName"
                      type="text"
                      value={zoneName}
                      onChange={handleZoneNameChange}
                      placeholder={t('zoneNamePlaceholder')}
                      className="zone-input"
                      onFocus={() => {
                        // Réafficher les suggestions seulement si on est en mode création et pas en édition
                        if (!isEditing && suggestedNames.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                    />
                    
                    {/* Suggestions de noms */}
                    {showSuggestions && suggestedNames.length > 0 && !isEditing && (
                      <div className="name-suggestions-dropdown">
                        <div className="suggestions-header">
                          <FaLocationArrow /> Suggestions de noms:
                        </div>
                        <div className="suggestions-list">
                          {suggestedNames.map((suggestion, index) => (
                            <div
                              key={index}
                              className={`suggestion-item ${zoneName === suggestion ? 'suggestion-active' : ''}`}
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              <span className="suggestion-text">{suggestion}</span>
                              {zoneName === suggestion && (
                                <span className="suggestion-check">✓</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="suggestions-footer">
                          <small>Cliquez sur une suggestion pour la sélectionner</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedPosition && (
                  <div className="position-info">
                    <p><strong>{t('selectedPosition')}:</strong></p>
                    <p>{t('latitude')}: {selectedPosition[0].toFixed(6)}</p>
                    <p>{t('longitude')}: {selectedPosition[1].toFixed(6)}</p>
                  </div>
                )}

                <div className="popup-actions">
                  <button 
                    className="btn-cancel"
                    onClick={() => {
                      setShowPopup(false);
                      setZoneName('');
                      setSelectedPosition(null);
                      setIsEditing(false);
                      setEditingZone(null);
                      setAutoSearchResult(null);
                      setSuggestedNames([]);
                      setShowSuggestions(false);
                    }}
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    className="btn-confirm"
                    onClick={handleAddZone}
                    disabled={!zoneName.trim() || !selectedPosition || loading}
                  >
                    <FaSave /> {loading ? t('saving') : 
                      (autoSearchResult ? 'Créer Zone Recommandée' : 
                       isEditing ? t('editZone') : t('addZone'))}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Liste des zones existantes */}
          <div className="zones-list">
            <div className="zones-header">
              <h3>{t('availableZones')} ({zones.length})</h3>
              <div className="zones-stats">
                <span className="stat-item">
                  <strong>{t('totalZones')}:</strong> {zones.length} {t('zones')}
                </span>
                {searchTerm && (
                  <span className="stat-item">
                    <strong>{t('filteredZones')}:</strong> {filteredZones.length} {t('zones')}
                  </span>
                )}
                {autoSearchResult && (
                  <span className="stat-item auto-search">
                    <FaCrosshairs /> <strong>Recherche auto:</strong> {autoSearchResult.name}
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <div className="loading-container">
                <FaSync className="spinning" />
                <p>{t('loadingZones')}</p>
              </div>
            ) : filteredZones.length === 0 ? (
              <div className="no-zones">
                <FaMapMarkerAlt className="no-zones-icon" />
                <p>{searchTerm ? t('noSearchResults') : t('noZones')}</p>
                {searchTerm && (
                  <button 
                    className="btn-clear-search"
                    onClick={() => {
                      setSearchTerm('');
                      setAutoSearchResult(null);
                      setShowAutoSearchPopup(false);
                      navigate('/carte-service', { replace: true });
                    }}
                  >
                    {t('clearSearchBtn')}
                  </button>
                )}
              </div>
            ) : (
              <div className="zones-grid">
                {filteredZones.map(zone => (
                  <div key={zone.id} className="zone-card">
                    <div className="zone-card-header">
                      <div className="zone-title">
                        <h4>{zone.nom}</h4>
                        <span className="zone-id">ID: {zone.id}</span>
                      </div>
                      <div className="zone-actions">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEditZone(zone)}
                          title={t('editZone')}
                          disabled={loading}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteClick(zone)}
                          title={t('deleteZone')}
                          disabled={loading}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="zone-card-body">
                      <div className="zone-coordinates">
                        <div className="coord-item">
                          <strong>{t('latitude')}:</strong>
                          <span className="coords-value">{zone.latitude}</span>
                        </div>
                        <div className="coord-item">
                          <strong>{t('longitude')}:</strong>
                          <span className="coords-value">{zone.longitude}</span>
                        </div>
                      </div>
                      <div className="zone-status">
                        <span className="status-active">● {t('active')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Suppression */}
          {showDeleteModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>{t('deleteZone')} {zoneToDelete?.nom}</h3>
                  <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                    <FaTimes />
                  </button>
                </div>
                <div className="delete-confirmation">
                  <p>{t('deleteConfirmation')}</p>
                  <p><strong>{t('deleteWarning')}</strong></p>
                  <p className="warning-text">
                    {t('heatmapWarning')}
                  </p>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                    {t('cancel')}
                  </button>
                  <button className="btn-danger" onClick={handleDeleteConfirm} disabled={loading}>
                    <FaTrash /> {loading ? t('deleting') : t('delete')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarteService;