import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaCar, 
  FaStar, 
  FaMapMarkerAlt, 
  FaClock, 
  FaEuroSign,
  FaUsers,
  FaSearch,
  FaFilter,
  FaTimes,
  FaRoute,
  FaCalendarAlt,
  FaSave,
  FaTimesCircle,
  FaCheckCircle,
  FaSpinner,
  FaUser,
  FaCheck,
  FaBan,
  FaEnvelope,
  FaPhone,
  FaArrowRight,
  FaClipboardList,
  FaHistory
} from "react-icons/fa";
import { useLanguage } from '../../contexts/LanguageContext';
import MenuApp from '../../components/Menu';
import './reservation.css';
import { getLocalZones } from '../../utils/localZones';
import { fetchRides, updateRideStatus, proposePrice } from '../../services/waizApi';

// Import des traductions
import fr from '../../locales/reservation/fr.json';
import mg from '../../locales/reservation/mg.json';
import en from '../../locales/reservation/en.json';

const locales = { fr, mg, en };

// Fonction pour obtenir le token d'authentification
const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('authToken') || '';
};

// Fonction pour les requêtes authentifiées
const apiRequest = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  return response;
};

function Reservation() {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [showPublicationModal, setShowPublicationModal] = useState(false);
  const [publications, setPublications] = useState([]);
  const [filteredPublications, setFilteredPublications] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [filteredDemandes, setFilteredDemandes] = useState([]);
  const [reservationsConfirmees, setReservationsConfirmees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [zones, setZones] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [activeTab, setActiveTab] = useState('mes-courses');
  const [authChecking, setAuthChecking] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [filters, setFilters] = useState({
    prixMin: '',
    prixMax: '',
    date: '',
    zone: '',
    status: ''
  });

  const [formData, setFormData] = useState({
    zone_depart: '',
    zone_arrivee: '',
    date_depart: '',
    heure_depart: '',
    nbr_passager: 1,
    prix_par_personne: '',  
    description: '',       
    bagages_autorises: true,
    animaux_autorises: false,
    fumeur_autorise: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSuccess, setFormSuccess] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const { language: currentLanguage } = useLanguage();

  const t = (key, variables = {}) => {
    const keys = key.split('.');
    let translation = locales[currentLanguage];
    for (const k of keys) {
      translation = translation?.[k];
      if (!translation) break;
    }
    return translation || key.split('.').pop();
  };

  // Charger l'utilisateur connecté (chauffeur) avec token
  useEffect(() => {
    const loadCurrentUser = async () => {
      setAuthChecking(true);
      try {
        console.log('🔍 Recherche du chauffeur dans localStorage...');
        // Essayer de récupérer depuis 'chauffeur' d'abord
        let chauffeurStr = localStorage.getItem('chauffeur');
        if (!chauffeurStr) {
          // Essayer depuis 'user'
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.chauffeur_ID || user.role === 'chauffeur' || user.type === 'chauffeur') {
              chauffeurStr = userStr;
            }
          }
        }
        if (!chauffeurStr) {
          // Essayer depuis 'currentUser'
          const currentUserStr = localStorage.getItem('currentUser');
          if (currentUserStr) {
            const user = JSON.parse(currentUserStr);
            if (user.chauffeur_ID || user.role === 'chauffeur' || user.type === 'chauffeur') {
              chauffeurStr = currentUserStr;
            }
          }
        }

        if (chauffeurStr) {
          const chauffeur = JSON.parse(chauffeurStr);
          console.log('✅ Chauffeur trouvé:', chauffeur);
          const normalizedUser = {
            id: chauffeur.chauffeur_ID || chauffeur.id || chauffeur.userId,
            nom: chauffeur.Nom || chauffeur.nom || chauffeur.name || 'Chauffeur',
            email: chauffeur.Email || chauffeur.email || '',
            telephone: chauffeur.Telephone || chauffeur.telephone || '',
            role: 'chauffeur'
          };
          console.log('✅ Chauffeur normalisé:', normalizedUser);
          setCurrentUser(normalizedUser);
        } else {
          console.log('❌ Aucun chauffeur trouvé');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    };
    loadCurrentUser();
    window.addEventListener('storage', loadCurrentUser);
    return () => window.removeEventListener('storage', loadCurrentUser);
  }, []);

  // Charger les zones
  useEffect(() => {
    fetchZones();
  }, []);

  // Charger toutes les données du chauffeur
  useEffect(() => {
    if (currentUser?.id) {
      fetchAllChauffeurData();
    } else {
      setPublications([]);
      setFilteredPublications([]);
      setDemandes([]);
      setFilteredDemandes([]);
      setReservationsConfirmees([]);
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (showPublicationModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showPublicationModal]);

  const fetchZones = async () => {
    setZonesLoading(true);
    try {
      setZones(getLocalZones());
    } catch (error) {
      setZones([]);
    } finally {
      setZonesLoading(false);
    }
  };

  const fetchAllChauffeurData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const allRides = await fetchRides({});
      const coursesPubliees = allRides.filter((r) => r.status === 'EN_ATTENTE' && !r.client);
      const demandesEnAttente = allRides.filter((r) => r.status === 'EN_ATTENTE' && r.client);
      const confirmées = allRides.filter((r) => r.status === 'CONFIRMEE' || r.status === 'ACCEPTED');

      setPublications(coursesPubliees);
      setFilteredPublications(coursesPubliees);
      setDemandes(demandesEnAttente);
      setFilteredDemandes(demandesEnAttente);
      setReservationsConfirmees(confirmées);
    } catch (error) {
      setApiError('Impossible de charger vos données.');
      setPublications([]);
      setFilteredPublications([]);
      setDemandes([]);
      setFilteredDemandes([]);
      setReservationsConfirmees([]);
    } finally {
      setLoading(false);
    }
  };

  const accepterDemande = async (reservId, price) => {
    if (!window.confirm('✅ Accepter cette demande de réservation ?')) return;
    try {
      if (price) {
        await proposePrice(reservId, price);
      }
      await updateRideStatus(reservId, 'ACCEPTED');
      alert('✅ Réservation acceptée');
      fetchAllChauffeurData();
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  // Refuser une demande
  const refuserDemande = async (reservId) => {
    if (!window.confirm('❌ Refuser cette demande de réservation ?')) return;
    try {
      await updateRideStatus(reservId, 'CANCELED');
      alert('❌ Réservation refusée');
      fetchAllChauffeurData();
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  // Gestionnaire du formulaire de publication
  const handleFormInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    setFormSuccess(false);

    try {
      setFormErrors({
        submit: 'La publication de courses par le chauffeur n\'est pas supportée. Les passagers créent des courses via createRide ; vous les acceptez depuis cet écran.',
      });
    } catch (error) {
      setFormErrors({ submit: error.message });
    } finally {
      setFormLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.zone_depart) newErrors.zone_depart = 'Champ requis';
    if (!formData.zone_arrivee) newErrors.zone_arrivee = 'Champ requis';
    if (formData.zone_depart === formData.zone_arrivee) newErrors.zone_arrivee = 'Zones différentes requises';
    if (!formData.date_depart) newErrors.date_depart = 'Champ requis';
    if (!formData.heure_depart) newErrors.heure_depart = 'Champ requis';
    if (formData.nbr_passager < 1 || formData.nbr_passager > 8) newErrors.nbr_passager = '1 à 8 passagers';
    if (!formData.prix_par_personne || formData.prix_par_personne <= 0) newErrors.prix_par_personne = 'Prix valide requis';
    
    const dateTimeDepart = new Date(`${formData.date_depart}T${formData.heure_depart}`);
    if (dateTimeDepart < new Date()) newErrors.date_depart = 'Date passée';
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      zone_depart: '', zone_arrivee: '', date_depart: '', heure_depart: '',
      nbr_passager: 1, prix_par_personne: '', description: '',
      bagages_autorises: true, animaux_autorises: false, fumeur_autorise: false
    });
    setFormErrors({});
    setFormSuccess(false);
  };

  const clearFilters = () => {
    setFilters({ prixMin: '', prixMax: '', date: '', zone: '', status: '' });
    setSearchTerm('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleLogout = () => {
  // Supprimer uniquement les données du chauffeur
  localStorage.removeItem('chauffeur');
  localStorage.removeItem('currentUser'); // si cette clé est utilisée pour le chauffeur
  localStorage.removeItem('userType');   // si stocké
  // Ne pas supprimer 'client'
  setCurrentUser(null);
  setShowUserMenu(false);
  window.location.href = '/login';
};

  const getStatusClass = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'status-en-attente';
      case 'CONFIRMEE': return 'status-confirmee';
      case 'TERMINEE': return 'status-terminee';
      case 'ANNULEE': return 'status-annulee';
      default: return 'status-default';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'En attente';
      case 'CONFIRMEE': return 'Confirmée';
      case 'TERMINEE': return 'Terminée';
      case 'ANNULEE': return 'Annulée';
      default: return status || 'Inconnu';
    }
  };

  const handleMenuToggle = (isOpen) => setIsMenuOpen(isOpen);
  const closeModal = () => {
    if (window.confirm('Annuler la publication ?')) {
      setShowPublicationModal(false);
      resetForm();
    }
  };

  // Filtrage des publications et demandes
  useEffect(() => {
    let filtered = publications;
    if (searchTerm) {
      filtered = filtered.filter(pub => 
        pub.zone_depart?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.zone_arrivee?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredPublications(filtered);
  }, [searchTerm, publications]);

  useEffect(() => {
    let filtered = demandes;
    if (searchTerm) {
      filtered = filtered.filter(demande => 
        demande.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demande.zone_depart?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demande.zone_arrivee?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredDemandes(filtered);
  }, [searchTerm, demandes]);

  // Affichage pendant la vérification de l'authentification
  if (authChecking) {
    return (
      <div className="app-container">
        <MenuApp onToggle={handleMenuToggle} />
        <div className={`content-container ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}>
          <div className="reservation-page">
            <div className="loading-spinner"><FaSpinner className="spinner" /> Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="app-container">
        <MenuApp onToggle={handleMenuToggle} />
        <div className={`content-container ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}>
          <div className="reservation-page">
            <div className="no-access">
              <FaCar size={64} />
              <h2>Connexion chauffeur requise</h2>
              <p>Veuillez vous connecter avec un compte chauffeur pour accéder à cet espace.</p>
              <button onClick={() => window.location.href = '/login'}>Se connecter</button>
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
        <div className="reservation-page">
          <div className="page-header">
            <div>
              <h1>Espace Chauffeur</h1>
              <p className="welcome-message">Bonjour {currentUser.nom}</p>
            </div>
            <button className="btn-publier-header" onClick={() => setShowPublicationModal(true)}>
              <FaPlus /> Publier une nouvelle course
            </button>
          </div>

          {apiError && (
            <div className="api-error-message">
              <FaTimesCircle /> {apiError}
            </div>
          )}

          <div className="tabs-container">
            <button className={`tab-button ${activeTab === 'mes-courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('mes-courses')}>
              <FaCar /> Mes courses ({publications.length})
            </button>
            <button className={`tab-button ${activeTab === 'demandes' ? 'active' : ''}`}
              onClick={() => setActiveTab('demandes')}>
              <FaClipboardList /> Demandes ({demandes.length})
              {demandes.length > 0 && <span className="badge">{demandes.length}</span>}
            </button>
            <button className={`tab-button ${activeTab === 'confirmees' ? 'active' : ''}`}
              onClick={() => setActiveTab('confirmees')}>
              <FaCheckCircle /> Confirmées ({reservationsConfirmees.length})
            </button>
          </div>

          <div className="search-filter-bar">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder={activeTab === 'demandes' ? "Rechercher un client, une destination..." : "Rechercher une destination..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className={`btn-filter ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}>
              <FaFilter /> Filtres
            </button>
            {(searchTerm || filters.prixMin || filters.prixMax || filters.date) && (
              <button className="btn-clear-filters" onClick={clearFilters}>
                <FaTimes /> Effacer
              </button>
            )}
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>Prix min (Ar)</label>
                <input type="number" value={filters.prixMin} onChange={e => setFilters({...filters, prixMin: e.target.value})} />
              </div>
              <div className="filter-group">
                <label>Prix max (Ar)</label>
                <input type="number" value={filters.prixMax} onChange={e => setFilters({...filters, prixMax: e.target.value})} />
              </div>
              <div className="filter-group">
                <label>Date</label>
                <input type="date" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} />
              </div>
            </div>
          )}

          {/* Onglet Mes courses */}
          {activeTab === 'mes-courses' && (
            <div className="publications-list">
              {loading ? (
                <div className="loading-spinner"><FaSpinner className="spinner" /> Chargement...</div>
              ) : filteredPublications.length === 0 ? (
                <div className="no-results">
                  <FaCar size={48} />
                  <h3>Aucune course publiée</h3>
                  <button onClick={() => setShowPublicationModal(true)}>Publier une course</button>
                </div>
              ) : (
                filteredPublications.map(pub => (
                  <div key={pub.cours_ID} className="publication-card">
                    <div className="card-header">
                      <div className="chauffeur-info">
                        <div className="chauffeur-avatar"><FaCar /></div>
                        <div className="chauffeur-details">
                          <h3>Ma course</h3>
                          <div className="rating"><FaStar /> 4.8</div>
                        </div>
                      </div>
                      <div className={`status-badge ${getStatusClass(pub.status)}`}>
                        {getStatusText(pub.status)}
                      </div>
                    </div>
                    <div className="trajet-details">
                      <div><FaMapMarkerAlt /> {pub.zone_depart?.nom}</div>
                      <FaArrowRight />
                      <div><FaMapMarkerAlt /> {pub.zone_arrivee?.nom}</div>
                    </div>
                    <div className="trajet-infos">
                      <div><FaClock /> {formatDate(pub.date_depart)}</div>
                      <div><FaUsers /> {pub.nbr_passager} places</div>
                      <div className="prix"><FaEuroSign /> {pub.prix_par_personne} Ar/pers</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Onglet Demandes */}
          {activeTab === 'demandes' && (
            <div className="demandes-list">
              {loading ? (
                <div className="loading-spinner"><FaSpinner className="spinner" /> Chargement...</div>
              ) : filteredDemandes.length === 0 ? (
                <div className="no-results">
                  <FaClipboardList size={48} />
                  <h3>Aucune demande</h3>
                  <p>Les passagers pourront réserver vos courses.</p>
                </div>
              ) : (
                filteredDemandes.map(demande => (
                  <div key={demande.reserv_ID} className="demande-card">
                    <div className="demande-header">
                      <span>Demande #{demande.reserv_ID}</span>
                      <div className={`status-badge ${getStatusClass(demande.status)}`}>
                        {getStatusText(demande.status)}
                      </div>
                    </div>
                    <div className="client-infos">
                      <FaUser />
                      <div>
                        <strong>{demande.client?.nom}</strong>
                        {demande.client?.telephone && <div><FaPhone /> {demande.client.telephone}</div>}
                      </div>
                    </div>
                    <div className="trajet-details">
                      <div><FaMapMarkerAlt /> {demande.zone_depart?.nom}</div>
                      <FaArrowRight />
                      <div><FaMapMarkerAlt /> {demande.zone_arrivee?.nom}</div>
                    </div>
                    <div className="trajet-infos">
                      <div><FaClock /> {formatDate(demande.date_depart)}</div>
                      <div><FaUsers /> {demande.nbr_passager} passager(s)</div>
                      <div className="prix"><FaEuroSign /> {demande.prix_par_personne} Ar</div>
                    </div>
                    <div className="demande-actions">
                      <button className="btn-accepter" onClick={() => accepterDemande(demande.cours_ID)}>
                        <FaCheck /> Accepter
                      </button>
                      <button className="btn-refuser" onClick={() => refuserDemande(demande.cours_ID)}>
                        <FaBan /> Refuser
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Onglet Confirmées */}
          {activeTab === 'confirmees' && (
            <div className="confirmees-list">
              {reservationsConfirmees.length === 0 ? (
                <div className="no-results">
                  <FaCheckCircle size={48} />
                  <h3>Aucune réservation confirmée</h3>
                </div>
              ) : (
                reservationsConfirmees.map(res => (
                  <div key={res.cours_ID} className="confirmee-card">
                    <div className="confirmee-header">
                      <span>Réservation #{res.cours_ID}</span>
                      <div className="status-badge status-confirmee">Confirmée</div>
                    </div>
                    <div className="client-info"><FaUser /> {res.client?.nom}</div>
                    <div className="trajet-details-mini">
                      <div><FaMapMarkerAlt /> {res.zone_depart?.nom}</div>
                      <FaArrowRight />
                      <div><FaMapMarkerAlt /> {res.zone_arrivee?.nom}</div>
                    </div>
                    <div className="trajet-infos-mini">
                      <div><FaClock /> {formatDate(res.date_depart)}</div>
                      <div><FaUsers /> {res.nbr_passager} passagers</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Modal de publication */}
          {showPublicationModal && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2><FaCar /> Publier une course</h2>
                  <button className="modal-close" onClick={closeModal}><FaTimes /></button>
                </div>
                <div className="modal-body">
                  {formSuccess && <div className="success-message"><FaCheckCircle /> Course publiée !</div>}
                  {formErrors.submit && <div className="error-message"><FaTimesCircle /> {formErrors.submit}</div>}
                  <form onSubmit={handlePublishSubmit} className="publication-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Zone de départ *</label>
                        <select name="zone_depart" value={formData.zone_depart} onChange={handleFormInputChange}>
                          <option value="">Sélectionner</option>
                          {zones.map(zone => <option key={zone.zone_ID} value={zone.zone_ID}>{zone.Nom}</option>)}
                        </select>
                        {formErrors.zone_depart && <span className="error-text">{formErrors.zone_depart}</span>}
                      </div>
                      <div className="form-group">
                        <label>Zone d'arrivée *</label>
                        <select name="zone_arrivee" value={formData.zone_arrivee} onChange={handleFormInputChange}>
                          <option value="">Sélectionner</option>
                          {zones.map(zone => <option key={zone.zone_ID} value={zone.zone_ID}>{zone.Nom}</option>)}
                        </select>
                        {formErrors.zone_arrivee && <span className="error-text">{formErrors.zone_arrivee}</span>}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Date de départ *</label>
                        <input type="date" name="date_depart" value={formData.date_depart} onChange={handleFormInputChange} />
                        {formErrors.date_depart && <span className="error-text">{formErrors.date_depart}</span>}
                      </div>
                      <div className="form-group">
                        <label>Heure de départ *</label>
                        <input type="time" name="heure_depart" value={formData.heure_depart} onChange={handleFormInputChange} />
                        {formErrors.heure_depart && <span className="error-text">{formErrors.heure_depart}</span>}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nombre de places *</label>
                        <input type="number" name="nbr_passager" min="1" max="8" value={formData.nbr_passager} onChange={handleFormInputChange} />
                        {formErrors.nbr_passager && <span className="error-text">{formErrors.nbr_passager}</span>}
                      </div>
                      <div className="form-group">
                        <label>Prix par personne (Ar) *</label>
                        <input type="number" name="prix_par_personne" min="0" step="500" value={formData.prix_par_personne} onChange={handleFormInputChange} />
                        {formErrors.prix_par_personne && <span className="error-text">{formErrors.prix_par_personne}</span>}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Description (optionnelle)</label>
                      <textarea name="description" rows="3" value={formData.description} onChange={handleFormInputChange} />
                    </div>
                    <div className="options-group">
                      <h3>Options</h3>
                      <div className="options-row">
                        <label><input type="checkbox" name="bagages_autorises" checked={formData.bagages_autorises} onChange={handleFormInputChange} /> Bagages</label>
                        <label><input type="checkbox" name="animaux_autorises" checked={formData.animaux_autorises} onChange={handleFormInputChange} /> Animaux</label>
                        <label><input type="checkbox" name="fumeur_autorise" checked={formData.fumeur_autorise} onChange={handleFormInputChange} /> Fumeur</label>
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="button" onClick={closeModal}>Annuler</button>
                      <button type="submit" disabled={formLoading}>
                        {formLoading ? <FaSpinner className="spinner" /> : <FaSave />} Publier
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reservation;