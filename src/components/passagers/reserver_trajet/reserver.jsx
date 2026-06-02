import React, { useState, useEffect } from 'react';
import { 
  FaCar, 
  FaStar, 
  FaMapMarkerAlt, 
  FaClock, 
  FaEuroSign,
  FaUsers,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaArrowRight,
  FaUser,
  FaTimes,
  FaSuitcase,
  FaDog,
  FaSmoking,
  FaPlus,
  FaHistory,
  FaSearch,
  FaFilter,
  FaRoute,
  FaUserTie,
  FaPhone,
  FaEnvelope,
  FaCreditCard,
  FaUserCircle,
  FaSignOutAlt 
} from "react-icons/fa";
import './reserver.css';
import { useAuth } from '../../AuthContext';
import { fetchRides, createRide, fetchRidesRaw } from '../../../services/waizApi';

const DEFAULT_ZONES = [
  { zone_ID: 'antananarivo-centre', Nom: 'Antananarivo - Centre', latitude: -18.8792, longitude: 47.5079 },
  { zone_ID: 'antananarivo-aeroport', Nom: 'Antananarivo - Aéroport', latitude: -18.7969, longitude: 47.4788 },
  { zone_ID: 'toamasina', Nom: 'Toamasina', latitude: -18.1492, longitude: 49.4023 },
  { zone_ID: 'antsirabe', Nom: 'Antsirabe', latitude: -19.8659, longitude: 47.0333 },
  { zone_ID: 'mahajanga', Nom: 'Mahajanga', latitude: -15.7167, longitude: 46.3167 },
];

function Reserver() {
  // Récupération des données depuis le contexte
  const { currentUser, isAuthenticated, userType, logout: authLogout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [publications, setPublications] = useState([]);
  const [filteredPublications, setFilteredPublications] = useState([]);
  const [mesReservations, setMesReservations] = useState([]);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [zones, setZones] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [chauffeursLoading, setChauffeursLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [activeTab, setActiveTab] = useState('disponibles');
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    prixMin: '',
    prixMax: '',
    date: '',
    zone: ''
  });

  // État pour le formulaire de nouvelle réservation
  const [newReservationForm, setNewReservationForm] = useState({
    zone_id: '',
    zone_id_arrive_de: '',
    chauffeur_id: '',
    date_voyage: '',
    nbr_passager: 1,
    commentaire: ''
  });

  // État pour le formulaire de réservation (pour les courses existantes)
  const [formData, setFormData] = useState({
    nbr_passager: 1,
    date_voyage: '',
    commentaire: ''
  });

  // Rediriger les chauffeurs vers leur dashboard
  useEffect(() => {
    if (currentUser && userType === 'chauffeur') {
      window.location.href = '/dashboard';
    }
  }, [currentUser, userType]);

  // Fermer le menu utilisateur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  // Charger les zones
  useEffect(() => {
    fetchZones();
  }, []);

  // Charger les chauffeurs
  useEffect(() => {
    fetchChauffeurs();
  }, []);

  // Charger les publications disponibles
  useEffect(() => {
    fetchPublications();
  }, []);

  // Charger les réservations du client SEULEMENT si l'utilisateur est passager
  useEffect(() => {
    if (currentUser?.id && userType === 'passager') {
      console.log('📥 Chargement des réservations pour client ID:', currentUser.id);
      fetchMesReservations();
    } else {
      console.log('⏸️ Pas de chargement des réservations - utilisateur non connecté ou pas passager');
      setMesReservations([]);
    }
  }, [currentUser, userType]);

  const fetchZones = async () => {
    setZonesLoading(true);
    setApiError(null);
    try {
      setZones(DEFAULT_ZONES);
    } catch (error) {
      setApiError('Impossible de charger les zones');
      setZones([]);
    } finally {
      setZonesLoading(false);
    }
  };

  const fetchChauffeurs = async () => {
    setChauffeursLoading(true);
    setApiError(null);
    try {
      const pendingRides = await fetchRidesRaw({ status: 'PENDING' });
      const drivers = pendingRides
        .filter((r) => r.driver)
        .map((r) => ({
          id: r.driver.id,
          Nom: `${r.driver.firstName || ''} ${r.driver.name || ''}`.trim(),
          telephone: r.driver.phone,
        }));
      setChauffeurs(drivers);
    } catch (error) {
      setChauffeurs([]);
    } finally {
      setChauffeursLoading(false);
    }
  };

  const fetchPublications = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const rides = await fetchRides({ status: 'PENDING' });
      const formattedData = rides.map((item) => ({
        reserv_ID: item.id,
        zone_id: item.zone_depart_nom,
        zone_id_arrive_de: item.zone_arrivee_nom,
        zone_depart_nom: item.zone_depart_nom || 'Départ',
        zone_arrivee_nom: item.zone_arrivee_nom || 'Arrivée',
        chauffeur_id: item.chauffeur?.id,
        chauffeur: item.chauffeur,
        chauffeur_nom: item.chauffeur?.nom || 'Chauffeur',
        nbr_passager: item.nbr_passager || 4,
        prix_par_personne: item.prix_par_personne || item.Tarif_proposer_client || 0,
        date_voyage: item.date_voyage || item.date_depart,
        status: item.status || item.Status_course,
      }));
      setPublications(formattedData);
      setFilteredPublications(formattedData);
    } catch (error) {
      setApiError('Impossible de charger les courses');
      setPublications([]);
      setFilteredPublications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMesReservations = async () => {
    try {
      if (!currentUser?.id || userType !== 'passager') return;
      const rides = await fetchRides({});
      setMesReservations(rides);
    } catch (error) {
      setMesReservations([]);
    }
  };

const handleLogout = () => {
  authLogout(); 
  setShowUserMenu(false);
  window.location.href = '/';
};

  const getStatusClass = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'status-en-attente';
      case 'CONFIRMEE': return 'status-confirmee';
      case 'TERMINEE': return 'status-terminee';
      case 'ANNULEE': return 'status-annulee';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'En attente';
      case 'CONFIRMEE': return 'Confirmée';
      case 'TERMINEE': return 'Terminée';
      case 'ANNULEE': return 'Annulée';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrer les publications
  useEffect(() => {
    let filtered = publications;

    if (searchTerm) {
      filtered = filtered.filter(pub => 
        pub.chauffeur_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.zone_depart_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.zone_arrivee_nom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.prixMin) {
      filtered = filtered.filter(pub => pub.prix_par_personne >= parseFloat(filters.prixMin));
    }
    if (filters.prixMax) {
      filtered = filtered.filter(pub => pub.prix_par_personne <= parseFloat(filters.prixMax));
    }
    if (filters.date) {
      filtered = filtered.filter(pub => 
        new Date(pub.date_voyage).toDateString() === new Date(filters.date).toDateString()
      );
    }
    if (filters.zone) {
      filtered = filtered.filter(pub => 
        pub.zone_id === parseInt(filters.zone) || 
        pub.zone_id_arrive_de === parseInt(filters.zone)
      );
    }

    setFilteredPublications(filtered);
  }, [searchTerm, filters, publications]);

  const clearFilters = () => {
    setFilters({
      prixMin: '',
      prixMax: '',
      date: '',
      zone: ''
    });
    setSearchTerm('');
  };

  const openReservationModal = (course) => {
    if (!currentUser) {
      alert('Veuillez vous connecter pour effectuer une réservation');
      return;
    }
    setSelectedCourse(course);
    const date = new Date(course.date_voyage);
    setFormData({
      nbr_passager: 1,
      date_voyage: date.toISOString().split('T')[0],
      commentaire: ''
    });
    setShowReservationModal(true);
    document.body.style.overflow = 'hidden';
  };

  const openNewReservationModal = () => {
    if (!currentUser) {
      alert('Veuillez vous connecter pour effectuer une réservation');
      return;
    }

    setNewReservationForm({
      zone_id: '',
      zone_id_arrive_de: '',
      chauffeur_id: '',
      date_voyage: new Date().toISOString().split('T')[0],
      nbr_passager: 1,
      commentaire: ''
    });

    setFormErrors({});
    setFormSuccess(false);
    setShowNewReservationModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (formLoading) return;
    setShowReservationModal(false);
    setShowNewReservationModal(false);
    setSelectedCourse(null);
    setFormErrors({});
    setFormSuccess(false);
    document.body.style.overflow = 'unset';
  };

  const handleNewReservationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewReservationForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFormInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateNewReservationForm = () => {
    const newErrors = {};

    if (!newReservationForm.zone_id) {
      newErrors.zone_id = 'Veuillez sélectionner une zone de départ';
    }
    if (!newReservationForm.zone_id_arrive_de) {
      newErrors.zone_id_arrive_de = 'Veuillez sélectionner une zone d\'arrivée';
    }
    if (newReservationForm.zone_id === newReservationForm.zone_id_arrive_de) {
      newErrors.zone_id_arrive_de = 'Les zones de départ et d\'arrivée doivent être différentes';
    }
    if (!newReservationForm.chauffeur_id) {
      // Chauffeur optionnel avec l'API GraphQL Waiz
    }
    if (!newReservationForm.date_voyage) {
      newErrors.date_voyage = 'Veuillez sélectionner une date';
    }
    if (newReservationForm.nbr_passager < 1 || newReservationForm.nbr_passager > 8) {
      newErrors.nbr_passager = 'Le nombre de passagers doit être entre 1 et 8';
    }

    const dateTimeDepart = new Date(newReservationForm.date_voyage);
    if (dateTimeDepart < new Date()) {
      newErrors.date_voyage = 'La date ne peut pas être dans le passé';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date_voyage) {
      newErrors.date_voyage = 'Veuillez sélectionner une date';
    }
    if (formData.nbr_passager < 1 || formData.nbr_passager > (selectedCourse?.nbr_passager || 8)) {
      newErrors.nbr_passager = `Maximum ${selectedCourse?.nbr_passager} place(s)`;
    }

    const dateTimeDepart = new Date(formData.date_voyage);
    if (dateTimeDepart < new Date()) {
      newErrors.date_voyage = 'La date ne peut pas être dans le passé';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNewReservationSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateNewReservationForm()) {
      return;
    }

    if (!currentUser?.id) {
      setFormErrors({ submit: 'Utilisateur non connecté' });
      return;
    }

    setFormLoading(true);
    setFormSuccess(false);

    try {
      const dateTimeDepart = new Date(newReservationForm.date_voyage);
      const zoneDepart = DEFAULT_ZONES.find((z) => z.zone_ID === newReservationForm.zone_id) || DEFAULT_ZONES[0];
      const zoneArrivee = DEFAULT_ZONES.find((z) => z.zone_ID === newReservationForm.zone_id_arrive_de) || DEFAULT_ZONES[1];

      await createRide({
        departure: { latitude: zoneDepart.latitude, longitude: zoneDepart.longitude },
        arrival: { latitude: zoneArrivee.latitude, longitude: zoneArrivee.longitude },
        departureName: zoneDepart.Nom,
        arrivalName: zoneArrivee.Nom,
        price: 25000,
        distance: 5,
        isReservation: true,
        scheduledAt: dateTimeDepart.toISOString(),
      });

      setFormSuccess(true);
      await fetchMesReservations();
      closeModal();
      setActiveTab('mes-reservations');
    } catch (error) {
      setFormErrors({ submit: error.message || 'Erreur lors de la réservation' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!currentUser?.id) {
      setFormErrors({ submit: 'Utilisateur non connecté' });
      return;
    }

    setFormLoading(true);
    setFormSuccess(false);

    try {
      const dateTimeDepart = new Date(formData.date_voyage);
      const zoneDepart = DEFAULT_ZONES.find((z) => z.zone_ID === selectedCourse.zone_id || z.Nom === selectedCourse.zone_depart_nom) || DEFAULT_ZONES[0];
      const zoneArrivee = DEFAULT_ZONES.find((z) => z.zone_ID === selectedCourse.zone_id_arrive_de || z.Nom === selectedCourse.zone_arrivee_nom) || DEFAULT_ZONES[1];

      await createRide({
        departure: { latitude: zoneDepart.latitude, longitude: zoneDepart.longitude },
        arrival: { latitude: zoneArrivee.latitude, longitude: zoneArrivee.longitude },
        departureName: selectedCourse.zone_depart_nom || zoneDepart.Nom,
        arrivalName: selectedCourse.zone_arrivee_nom || zoneArrivee.Nom,
        price: selectedCourse.prix_par_personne || 25000,
        distance: 5,
        isReservation: false,
        scheduledAt: dateTimeDepart.toISOString(),
      });

      setFormSuccess(true);
      await fetchMesReservations();
      closeModal();
      setActiveTab('mes-reservations');
      alert('✅ Votre demande de course a été créée !');
    } catch (error) {
      setFormErrors({ submit: 'Erreur lors de la réservation: ' + error.message });
    } finally {
      setFormLoading(false);
    }
  };

  const calculateEstimatedPrice = () => {
    if (!newReservationForm.chauffeur_id) return 0;
    const chauffeur = chauffeurs.find(c => c.id === parseInt(newReservationForm.chauffeur_id));
    return (chauffeur?.prix_km || 2000) * 10 * newReservationForm.nbr_passager;
  };

  // Fonction utilitaire pour générer une clé unique
  const getUniqueKey = (prefix, id, index) => {
    if (id && id !== undefined && id !== null) {
      return `${prefix}-${id}`;
    }
    return `${prefix}-${index}-${Date.now()}`;
  };

  return (
    <div className="reserver-container">
      <div className="reserver-header">
        <div className="header-left" style={{marginLeft:'-200px'}}>
          <h1>
            <FaCar className="header-icon" />
            Réservation de courses
          </h1>
        </div>
        
        <div className="header-right">
          {currentUser ? (
            <div className="user-menu-container">
              <button 
                className="user-menu-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <FaUserCircle className="user-icon" />
                <span className="user-name">{currentUser.nom}</span>
              </button>
              
              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <div className="user-menu-header">
                    <FaUserCircle className="dropdown-user-icon" />
                    <div className="user-info">
                      <strong>{currentUser.nom}</strong>
                      <span className="user-type">
                        {userType === 'passager' ? '👤 Passager' : '🚖 Chauffeur'}
                        {currentUser.type_chauffeur && ` (${currentUser.type_chauffeur})`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="user-menu-details">
                    {currentUser.email && (
                      <div className="detail-item">
                        <FaEnvelope className="detail-icon" />
                        <span>{currentUser.email}</span>
                      </div>
                    )}
                    {currentUser.telephone && (
                      <div className="detail-item" style={{marginTop:'10px'}}>
                        <FaPhone className="detail-icon" />
                        <span>{currentUser.telephone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="user-menu-footer">
                    <button 
                      className="logout-button"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="btn-login"
              onClick={() => window.location.href = '/login'}
            >
              Se connecter
            </button>
          )}
        </div>
      </div>

      {!currentUser && (
        <div className="warning-message">
          <FaTimesCircle />
          Veuillez vous connecter pour effectuer une réservation
        </div>
      )}
      
      {apiError && (
        <div className="api-error-message">
          <FaTimesCircle />
          {apiError}
        </div>
      )}

      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'disponibles' ? 'active' : ''}`}
          onClick={() => setActiveTab('disponibles')}
        >
          <FaCar />
          Courses disponibles
        </button>
        <button 
          className={`tab-button ${activeTab === 'mes-reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('mes-reservations')}
          disabled={!currentUser}
        >
          <FaHistory />
          Mes réservations
        </button>
      </div>

      {activeTab === 'disponibles' && (
        <>
          <div className="search-filter-bar">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher une destination, un chauffeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button 
              className={`btn-filter ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter />
              Filtres
            </button>

            {(searchTerm || filters.prixMin || filters.prixMax || filters.date || filters.zone) && (
              <button className="btn-clear-filters" onClick={clearFilters}>
                <FaTimes />
                Effacer les filtres
              </button>
            )}
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>Prix minimum (Ar)</label>
                <input
                  type="number"
                  value={filters.prixMin}
                  onChange={(e) => setFilters({...filters, prixMin: e.target.value})}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="filter-group">
                <label>Prix maximum (Ar)</label>
                <input
                  type="number"
                  value={filters.prixMax}
                  onChange={(e) => setFilters({...filters, prixMax: e.target.value})}
                  placeholder="50000"
                  min="0"
                />
              </div>

              <div className="filter-group">
                <label>Date</label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="filter-group">
                <label>Zone</label>
                <select
                  value={filters.zone}
                  onChange={(e) => setFilters({...filters, zone: e.target.value})}
                  disabled={zonesLoading}
                >
                  <option value="">Toutes les zones</option>
                  {zones.map((zone, index) => (
                    <option key={getUniqueKey('filter-zone', zone.zone_ID, index)} value={zone.zone_ID}>
                      {zone.Nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="new-reservation-section">
            <button 
              className="btn-new-reservation"
              onClick={openNewReservationModal}
              disabled={!currentUser}
            >
              <FaPlus /> Nouvelle réservation
            </button>
          </div>

          <div className="publications-list">
            {loading ? (
              <div className="loading-spinner">
                <FaSpinner className="spinner" />
                Chargement des courses...
              </div>
            ) : filteredPublications.length === 0 ? (
              <div className="no-results">
                <FaCar className="empty-icon" />
                <p>Aucune course disponible pour le moment</p>
                <button 
                  className="btn-reserver-empty"
                  onClick={openNewReservationModal}
                  disabled={!currentUser}
                >
                  <FaPlus /> Créer une réservation
                </button>
              </div>
            ) : (
              filteredPublications.map((pub, index) => (
                <div key={getUniqueKey('pub', pub.reserv_ID, index)} className="publication-card">
                  <div className="card-header">
                    <div className="chauffeur-info">
                      <div className="chauffeur-avatar">
                        <FaUser />
                      </div>
                      <div className="chauffeur-details">
                        <h3>{pub.chauffeur_nom}</h3>
                        <small className="voiture">Véhicule</small>
                      </div>
                    </div>
                    
                    <div className={`status-badge ${getStatusClass(pub.status)}`}>
                      {getStatusText(pub.status)}
                    </div>
                  </div>

                  <div className="trajet-details">
                    <div className="depart">
                      <div className="time">
                        {pub.date_voyage ? new Date(pub.date_voyage).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                      </div>
                      <div className="location">
                        <FaMapMarkerAlt className="location-icon depart-icon" />
                        <div>
                          <div className="ville">Départ</div>
                          <div className="lieu">{pub.zone_depart_nom || 'Non spécifié'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="trajet-duree">
                      <div className="duree-line">
                        <span className="duree">≈ 30 min</span>
                      </div>
                    </div>

                    <div className="arrivee">
                      <div className="time">
                        {pub.date_voyage ? new Date(new Date(pub.date_voyage).getTime() + 30*60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                      </div>
                      <div className="location">
                        <FaMapMarkerAlt className="location-icon arrivee-icon" />
                        <div>
                          <div className="ville">Arrivée</div>
                          <div className="lieu">{pub.zone_arrivee_nom || 'Non spécifié'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="trajet-infos">
                    <div className="info-item">
                      <FaClock />
                      <span>{pub.date_voyage ? formatDate(pub.date_voyage) : 'Date non définie'}</span>
                    </div>
                    <div className="info-item">
                      <FaUsers />
                      <span><strong>{pub.nbr_passager}</strong> place{pub.nbr_passager > 1 ? 's' : ''}</span>
                    </div>
                    <div className="info-item prix">
                      <FaEuroSign />
                      <span><strong>{pub.prix_par_personne?.toLocaleString() || '0'} Ar</strong> / pers</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button 
                      className="btn-reserver"
                      onClick={() => openReservationModal(pub)}
                      disabled={!currentUser}
                    >
                      Réserver maintenant
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'mes-reservations' && (
        <div className="mes-reservations">
          {mesReservations.length === 0 ? (
            <div className="empty-state">
              <FaHistory className="empty-icon" />
              <p>Vous n'avez pas encore de réservation</p>
              <button 
                className="btn-reserver-empty"
                onClick={openNewReservationModal}
                disabled={!currentUser}
              >
                <FaPlus /> Réserver maintenant
              </button>
            </div>
          ) : (
            <>
              <div className="new-reservation-section">
                <button 
                  className="btn-new-reservation"
                  onClick={openNewReservationModal}
                  disabled={!currentUser}
                >
                  <FaPlus /> Nouvelle réservation
                </button>
              </div>
              {mesReservations.map((res, index) => (
                <div key={getUniqueKey('res', res.reserv_ID, index)} className="reservation-card">
                  <div className="reservation-header">
                    <span className="reservation-id">Réservation #{res.reserv_ID}</span>
                    <span className={`status-badge ${getStatusClass(res.status_reservation)}`}>
                      {getStatusText(res.status_reservation)}
                    </span>
                  </div>

                  <div className="reservation-trajet">
                    <div className="zone">
                      <FaMapMarkerAlt className="depart-icon" />
                      <div>
                        <small>Départ</small>
                        <strong>{res.ZoneDepart?.Nom || res.zone_depart_nom}</strong>
                      </div>
                    </div>
                    <FaArrowRight className="fleche" />
                    <div className="zone">
                      <FaMapMarkerAlt className="arrivee-icon" />
                      <div>
                        <small>Arrivée</small>
                        <strong>{res.ZoneArriver?.Nom || res.zone_arrivee_nom}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="reservation-details">
                    <div className="detail">
                      <FaUser />
                      <span>{res.Chauffeur?.Nom || res.chauffeur_nom}</span>
                    </div>
                    <div className="detail">
                      <FaClock />
                      <span>{formatDate(res.date_voyage)}</span>
                    </div>
                    <div className="detail">
                      <FaUsers />
                      <span>{res.nbr_passager} passager(s)</span>
                    </div>
                    <div className="detail prix">
                      <FaEuroSign />
                      <span>25000 Ar</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Modal de nouvelle réservation */}
      {showNewReservationModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FaCar />
                Nouvelle réservation
              </h2>
              <button className="modal-close" onClick={closeModal} disabled={formLoading}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {formSuccess && (
                <div className="success-message">
                  <FaCheckCircle />
                  Réservation effectuée avec succès !
                </div>
              )}

              {formErrors.submit && (
                <div className="error-message">
                  <FaTimesCircle />
                  {formErrors.submit}
                </div>
              )}

              <form onSubmit={handleNewReservationSubmit} className="reservation-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <FaMapMarkerAlt />
                      Zone de départ *
                    </label>
                    <select
                      name="zone_id"
                      style={{color:'black'}}
                      value={newReservationForm.zone_id}
                      onChange={handleNewReservationChange}
                      className={formErrors.zone_id ? 'error' : ''}
                      disabled={formLoading || zonesLoading}
                    >
                      <option value="">Sélectionner une zone</option>
                      {zones.map((zone, index) => (
                        <option key={getUniqueKey('depart-zone', zone.zone_ID, index)} value={zone.zone_ID}>
                          {zone.Nom}
                        </option>
                      ))}
                    </select>
                    {formErrors.zone_id && (
                      <span className="error-text">{formErrors.zone_id}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      <FaMapMarkerAlt />
                      Zone d'arrivée *
                    </label>
                    <select
                      name="zone_id_arrive_de"
                      value={newReservationForm.zone_id_arrive_de}
                      onChange={handleNewReservationChange}
                      className={formErrors.zone_id_arrive_de ? 'error' : ''}
                      disabled={formLoading || zonesLoading}
                    >
                      <option value="">Sélectionner une zone</option>
                      {zones.map((zone, index) => (
                        <option key={getUniqueKey('arrivee-zone', zone.zone_ID, index)} value={zone.zone_ID}>
                          {zone.Nom}
                        </option>
                      ))}
                    </select>
                    {formErrors.zone_id_arrive_de && (
                      <span className="error-text">{formErrors.zone_id_arrive_de}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <FaUserTie />
                    Choisir un chauffeur *
                  </label>
                  <select
                    name="chauffeur_id"
                    value={newReservationForm.chauffeur_id}
                    onChange={handleNewReservationChange}
                    className={formErrors.chauffeur_id ? 'error' : ''}
                    disabled={formLoading || chauffeursLoading}
                  >
                    <option value="">Sélectionner un chauffeur</option>
                    {chauffeurs.map((chauffeur, index) => (
                      <option key={getUniqueKey('chauffeur', chauffeur.id, index)} value={chauffeur.id}>
                        {chauffeur.nom} - {chauffeur.voiture} - ⭐ {chauffeur.note} - {chauffeur.prix_km} Ar/km
                      </option>
                    ))}
                  </select>
                  {formErrors.chauffeur_id && (
                    <span className="error-text">{formErrors.chauffeur_id}</span>
                  )}
                </div>

                {newReservationForm.chauffeur_id && (
                  <div className="chauffeur-details-card">
                    <h4>Détails du chauffeur</h4>
                    {chauffeurs
                      .filter(c => c.id === parseInt(newReservationForm.chauffeur_id))
                      .map((chauffeur, index) => (
                        <div key={getUniqueKey('chauffeur-details', chauffeur.id, index)} className="chauffeur-info-detailed">
                          <p><strong>Nom:</strong> {chauffeur.nom}</p>
                          <p><strong>Véhicule:</strong> {chauffeur.voiture}</p>
                          <p><strong>Note:</strong> ⭐ {chauffeur.note} ({chauffeur.nb_trajets} trajets)</p>
                          <p><strong>Téléphone:</strong> {chauffeur.telephone}</p>
                          <p><strong>Prix:</strong> {chauffeur.prix_km} Ar/km</p>
                        </div>
                      ))}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <FaCalendarAlt />
                      Date de départ *
                    </label>
                    <input
                      type="date"
                      name="date_voyage"
                      value={newReservationForm.date_voyage}
                      onChange={handleNewReservationChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={formErrors.date_voyage ? 'error' : ''}
                      disabled={formLoading}
                    />
                    {formErrors.date_voyage && (
                      <span className="error-text">{formErrors.date_voyage}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      <FaUsers />
                      Nombre de passagers *
                    </label>
                    <input
                      type="number"
                      name="nbr_passager"
                      value={newReservationForm.nbr_passager}
                      onChange={handleNewReservationChange}
                      min="1"
                      max="8"
                      className={formErrors.nbr_passager ? 'error' : ''}
                      disabled={formLoading}
                    />
                    {formErrors.nbr_passager && (
                      <span className="error-text">{formErrors.nbr_passager}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <FaRoute />
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    name="commentaire"
                    value={newReservationForm.commentaire}
                    onChange={handleNewReservationChange}
                    placeholder="Informations complémentaires..."
                    rows="2"
                    disabled={formLoading}
                  />
                </div>

                {newReservationForm.chauffeur_id && newReservationForm.zone_id && newReservationForm.zone_id_arrive_de && (
                  <div className="prix-estime">
                    <h4>Estimation du prix</h4>
                    <div className="prix-details">
                      <span>Prix total estimé:</span>
                      <strong>
                        {calculateEstimatedPrice().toLocaleString()} Ar
                      </strong>
                    </div>
                    <small>* Le prix final peut varier selon la distance réelle</small>
                  </div>
                )}

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-annuler"
                    onClick={closeModal}
                    disabled={formLoading}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn-confirmer"
                    disabled={formLoading || zonesLoading || chauffeursLoading || !currentUser}
                  >
                    {formLoading ? (
                      <>
                        <FaSpinner className="spinner" />
                        Réservation en cours...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        Confirmer la réservation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de réservation pour course existante */}
      {showReservationModal && selectedCourse && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FaCar />
                Réserver votre course
              </h2>
              <button className="modal-close" onClick={closeModal} disabled={formLoading}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {formSuccess && (
                <div className="success-message">
                  <FaCheckCircle />
                  Réservation effectuée avec succès !
                </div>
              )}

              {formErrors.submit && (
                <div className="error-message">
                  <FaTimesCircle />
                  {formErrors.submit}
                </div>
              )}

              <div className="recap-course">
                <div className="recap-title">Récapitulatif de la course</div>
                
                <div className="recap-zones">
                  <div className="recap-zone depart">
                    <div className="recap-zone-icon">
                      <FaMapMarkerAlt />
                    </div>
                    <div className="recap-zone-info">
                      <small>Départ</small>
                      <strong>{selectedCourse.zone_depart_nom}</strong>
                    </div>
                  </div>
                  
                  <FaArrowRight className="recap-fleche" />
                  
                  <div className="recap-zone arrivee">
                    <div className="recap-zone-icon">
                      <FaMapMarkerAlt />
                    </div>
                    <div className="recap-zone-info">
                      <small>Arrivée</small>
                      <strong>{selectedCourse.zone_arrivee_nom}</strong>
                    </div>
                  </div>
                </div>

                <div className="recap-details">
                  <div className="recap-detail-item">
                    <FaUser />
                    <span>Chauffeur: <strong>{selectedCourse.chauffeur_nom}</strong></span>
                  </div>
                  <div className="recap-detail-item">
                    <FaEuroSign />
                    <span>Prix/pers: <strong>{selectedCourse.prix_par_personne?.toLocaleString()} Ar</strong></span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleReservationSubmit} className="reservation-form">
                <div className="form-group">
                  <label>
                    <FaCalendarAlt />
                    Date de départ *
                  </label>
                  <input
                    type="date"
                    name="date_voyage"
                    value={formData.date_voyage}
                    onChange={handleFormInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={formErrors.date_voyage ? 'error' : ''}
                    disabled={formLoading}
                  />
                  {formErrors.date_voyage && (
                    <span className="error-text">{formErrors.date_voyage}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <FaUsers />
                    Nombre de passagers *
                  </label>
                  <input
                    type="number"
                    name="nbr_passager"
                    value={formData.nbr_passager}
                    onChange={handleFormInputChange}
                    min="1"
                    max={selectedCourse.nbr_passager}
                    className={formErrors.nbr_passager ? 'error' : ''}
                    disabled={formLoading}
                  />
                  {formErrors.nbr_passager && (
                    <span className="error-text">{formErrors.nbr_passager}</span>
                  )}
                  <small>Maximum {selectedCourse.nbr_passager} place(s)</small>
                </div>

                <div className="form-group">
                  <label>
                    <FaRoute />
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    name="commentaire"
                    value={formData.commentaire}
                    onChange={handleFormInputChange}
                    placeholder="Informations complémentaires..."
                    rows="2"
                    disabled={formLoading}
                  />
                </div>

                <div className="prix-total">
                  <span>Prix total:</span>
                  <strong>{(selectedCourse.prix_par_personne * formData.nbr_passager).toLocaleString()} Ar</strong>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-annuler"
                    onClick={closeModal}
                    disabled={formLoading}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn-confirmer"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <>
                        <FaSpinner className="spinner" />
                        Réservation en cours...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        Confirmer la réservation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reserver;