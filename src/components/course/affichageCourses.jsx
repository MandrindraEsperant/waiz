import { useState, useEffect } from 'react';
import * as rideService from '../../services/rideService';
import * as membershipService from '../../services/membershipService';
import { fetchClientsFromRides } from '../../services/userProfileService';
import { fetchZones } from '../../services/zoneService';
import { mapLegacyStatusToGraphql } from '../../mappers/rideMapper';
import { FaEdit, FaTrash, FaCar, FaUser, FaMapMarkerAlt, FaTimes, FaSave, FaClock, FaCalendarAlt, FaFileExport, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './affichageCourses.css';
import MenuApp from '../Menu';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../AuthContext';
import { fetchRides, updateRideStatus, checkSubscriptionEligibility, extractUniqueClientsFromRides, localStatusToGraphQL } from '../../services/waizApi';
import fr from '../../locales/course/fr.json';
import en from '../../locales/course/en.json';
import mg from '../../locales/course/mg.json';

function AffichageCourses() {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const { isAuthenticated, logout } = useAuth(); 
    
    const translations = { fr, en, mg };
    
    const t = (key, fallback = '') => {
        const keys = key.split('.');
        let translation = translations[language];
        for (const k of keys) {
            translation = translation?.[k];
            if (!translation) break;
        }
        return translation || fallback || key;
    };

    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        Heure_depart: '',
        Status_course: 'en attente',
        Evenement_special: '',
        Tarif_proposer_client: '',
        Tarif_final_accepter: '',
        Status_tarif: 'proposé',
        Temps_attente_avant_acceptation: 0,
        client_ID: '',
        chauffeur_ID: '',
        voiture_ID: '',
        zone_depart_ID: '',
        zone_arriver_ID: ''
    });

    const [formOptions, setFormOptions] = useState({
        clients: [],
        chauffeurs: [],
        voitures: [],
        zones: []
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [showSearchInput, setShowSearchInput] = useState(false);
    const [chauffeurInfo, setChauffeurInfo] = useState({ id: null, subscription: 'basic', loading: true });

    // ============= ABONNEMENT =============
    const getChauffeurId = () => localStorage.getItem('chauffeur_id');

    const canExport = () => {
        const subscription = chauffeurInfo.subscription?.toLowerCase() || 'basic';
        const allowedSubscriptions = ['pro', 'premium', 'vip', 'entreprise'];
        return allowedSubscriptions.includes(subscription);
    };

    const fetchSubscriptionFromAPI = async () => {
        try {
            const status = await checkSubscriptionEligibility();
            return status.currentPlan || (status.hasActiveSubscription ? 'pro' : 'basic');
        } catch {
            return 'basic';
        }
    };

    // ============= CHARGEMENT INITIAL =============
    useEffect(() => {
        const initializeComponent = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const chauffeurId = localStorage.getItem('chauffeur_id');
                if (!token || !chauffeurId) {
                    navigate('/login');
                    return;
                }
                await Promise.all([loadCourses(), loadFormOptions()]);
                const subscription = await fetchSubscriptionFromAPI();
                setChauffeurInfo({ 
                    id: parseInt(chauffeurId), 
                    subscription: subscription,
                    loading: false
                });
                // update localStorage
                const userData = localStorage.getItem('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    user.plan = subscription;
                    localStorage.setItem('user', JSON.stringify(user));
                }
                localStorage.setItem('plan', subscription);
            } catch (error) {
                setError('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };
        initializeComponent();
    }, [navigate]);

    useEffect(() => {
        if (!isAuthenticated) navigate('/login');
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredCourses(courses);
        } else {
            const filtered = courses.filter(course => {
                const searchLower = searchTerm.toLowerCase();
                // Utiliser les nouvelles structures
                const clientName = getRelationName(course.client).toLowerCase();
                const departureZone = getRelationName(course.zones?.depart).toLowerCase();
                const arrivalZone = getRelationName(course.zones?.arrivee).toLowerCase();
                const status = normalizeStatus(course.Status_course || course.status_course).toLowerCase();
                const proposedPrice = course.Tarif_proposer_client?.toString() || '';
                const finalPrice = course.Tarif_final_accepter?.toString() || '';
                const date = formatDateDisplay(course.Heure_depart || course.heure_depart).toLowerCase();
                return (
                    clientName.includes(searchLower) ||
                    departureZone.includes(searchLower) ||
                    arrivalZone.includes(searchLower) ||
                    status.includes(searchLower) ||
                    proposedPrice.includes(searchTerm) ||
                    finalPrice.includes(searchTerm) ||
                    date.includes(searchLower)
                );
            });
            setFilteredCourses(filtered);
        }
    }, [searchTerm, courses]);

    const showToast = (message, isError = false) => {
        setSuccessMessage(isError ? `❌ ${message}` : `✅ ${message}`);
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
    };

    const loadCourses = async () => {
        try {
            const chauffeurId = getChauffeurId();
            if (!chauffeurId) throw new Error('Chauffeur non identifié');
            const rides = await fetchRides({});
            setCourses(rides);
            setFilteredCourses(rides);
        } catch (err) {
            if (err.message?.includes('UNAUTHORIZED') || err.message?.includes('INVALID_TOKEN')) {
                logout();
                navigate('/login');
            } else {
                showToast(t('messages.error'), true);
                setError(t('messages.error'));
            }
        }
    };

    const loadFormOptions = async () => {
        try {
            const rides = await fetchRides({});
            const clients = extractUniqueClientsFromRides(rides);
            setFormOptions({
                clients,
                chauffeurs: [],
                voitures: [],
                zones: rides.reduce((acc, ride) => {
                    if (ride.zone_depart_nom) {
                        acc.push({ zone_ID: ride.zone_depart_nom, Nom: ride.zone_depart_nom });
                    }
                    if (ride.zone_arrivee_nom) {
                        acc.push({ zone_ID: ride.zone_arrivee_nom, Nom: ride.zone_arrivee_nom });
                    }
                    return acc;
                }, [])
            });
        } catch (err) {
            console.error('Erreur chargement options:', err);
        }
    };

    const handleMenuToggle = (isOpen) => setIsMenuOpen(isOpen);

    // Recherche
    const toggleSearchInput = () => {
        setShowSearchInput(!showSearchInput);
        if (!showSearchInput) {
            setTimeout(() => {
                const searchInput = document.querySelector('.search-input-field-course');
                if (searchInput) searchInput.focus();
            }, 100);
        } else {
            setSearchTerm('');
        }
    };

    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const clearSearch = () => {
        setSearchTerm('');
        setShowSearchInput(false);
    };

    // ============= FONCTION POUR RÉCUPÉRER LE NOM =============
    const getRelationName = (relation, fallback = 'N/A') => {
        if (!relation) return fallback;
        if (typeof relation === 'string') return relation;
        
        // Pour les clients (formaté)
        if (relation.nom) return relation.nom;
        if (relation.Nom_client) return relation.Nom_client;
        if (relation.nom_client) return relation.nom_client;
        
        // Pour les chauffeurs
        if (relation.Nom) return relation.Nom;
        if (relation.nom) return relation.nom;
        
        // Pour les voitures
        if (relation.Marque) return relation.Marque;
        if (relation.marque) return relation.marque;
        if (relation.Plaque_immatriculation) return relation.Plaque_immatriculation;
        
        // Pour les zones (formaté)
        if (relation.nom) return relation.nom;
        
        return fallback;
    };

    // ============= ÉDITION =============
    const handleEditClick = async (course) => {
        try {
            const courseData = course;
            setEditingCourse(courseData);
            setFormData({
                Heure_depart: courseData.date_depart || courseData.Heure_depart || '',
                Status_course: courseData.Status_course || courseData.status || 'EN_ATTENTE',
                Evenement_special: '',
                Tarif_proposer_client: courseData.Tarif_proposer_client || courseData.price || '',
                Tarif_final_accepter: courseData.Tarif_final_accepter || courseData.price || '',
                Status_tarif: 'proposé',
                Temps_attente_avant_acceptation: 0,
                client_ID: courseData.client?.id || '',
                chauffeur_ID: courseData.chauffeur?.id || '',
                voiture_ID: '',
                zone_depart_ID: courseData.zone_depart_nom || '',
                zone_arriver_ID: courseData.zone_arrivee_nom || ''
            });
            setShowEditPopup(true);
        } catch (err) {
            showToast(t('messages.editError'), true);
        }
    };

    const handleEditSave = async () => {
        if (!editingCourse) return;
        setSaving(true);
        try {
            const courseId = editingCourse.cours_ID || editingCourse.id;
            const graphqlStatus = localStatusToGraphQL(formData.Status_course);
            await updateRideStatus(courseId, graphqlStatus);
            setShowEditPopup(false);
            setEditingCourse(null);
            await loadCourses();
            showToast(t('messages.editSuccess'));
        } catch (err) {
            showToast(err.message || t('messages.editError'), true);
        } finally {
            setSaving(false);
        }
    };

    const handleEditCancel = () => {
        setShowEditPopup(false);
        setEditingCourse(null);
        setFormData({
            Heure_depart: '',
            Status_course: 'en attente',
            Evenement_special: '',
            Tarif_proposer_client: '',
            Tarif_final_accepter: '',
            Status_tarif: 'proposé',
            Temps_attente_avant_acceptation: 0,
            client_ID: '',
            chauffeur_ID: '',
            voiture_ID: '',
            zone_depart_ID: '',
            zone_arriver_ID: ''
        });
    };

    const handleFormChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    // ============= SUPPRESSION =============
    const handleDeleteClick = (course) => {
        setCourseToDelete(course);
        setShowDeletePopup(true);
    };

    const handleDeleteConfirm = async () => {
        if (!courseToDelete) return;
        setDeleting(true);
        try {
            const courseId = courseToDelete.cours_ID || courseToDelete.id;
            await updateRideStatus(courseId, 'CANCELED');
            setShowDeletePopup(false);
            setCourseToDelete(null);
            await loadCourses();
            showToast(t('messages.deleteSuccess'));
        } catch (err) {
            showToast(err.message || t('messages.deleteError'), true);
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeletePopup(false);
        setCourseToDelete(null);
    };

    const handleExport = () => navigate('/exporte');

    // ============= FORMATAGE =============
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16);
        } catch { return ''; }
    };

    const formatDateDisplay = (dateString) => {
        if (!dateString) return t('messages.invalidDate');
        try {
            const date = new Date(dateString);
            return date.toLocaleString(language === 'fr' ? 'fr-FR' : language === 'mg' ? 'mg-MG' : 'en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch { return t('messages.invalidDate'); }
    };

    const formatTarif = (tarif) => {
        if (!tarif || tarif === 0) return '-';
        return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : language === 'mg' ? 'mg-MG' : 'en-US').format(tarif) + ' Ar';
    };

    const normalizeStatus = (status) => {
        if (!status) return t('status.pending');
        const statusMap = {
            'en attente': t('status.pending'),
            'en cours': t('status.inProgress'),
            'terminée': t('status.completed'),
            'annulée': t('status.cancelled'),
            'pending': t('status.pending'),
            'in progress': t('status.inProgress'),
            'completed': t('status.completed'),
            'cancelled': t('status.cancelled'),
            'miandry': t('status.pending'),
            'mandeha': t('status.inProgress'),
            'vita': t('status.completed'),
            'nofoanana': t('status.cancelled')
        };
        return statusMap[status.toLowerCase()] || status;
    };

    const getStatusOptions = () => [
        { value: 'en attente', label: t('status.pending') },
        { value: 'en cours', label: t('status.inProgress') },
        { value: 'terminée', label: t('status.completed') },
        { value: 'annulée', label: t('status.cancelled') }
    ];

    const getPriceStatusOptions = () => [
        { value: 'proposé', label: t('status.proposed') },
        { value: 'accepté', label: t('status.accepted') },
        { value: 'refusé', label: t('status.refused') },
        { value: 'négocié', label: t('status.negotiated') }
    ];

    const getEventOptions = () => [
        { value: '', label: t('events.none') },
        { value: 'Urgence médicale', label: t('events.medicalEmergency') },
        { value: 'Course VIP', label: t('events.vipRide') },
        { value: 'Événement météo', label: t('events.weatherEvent') },
        { value: 'Trafic exceptionnel', label: t('events.exceptionalTraffic') }
    ];

    // ============= RENDU =============
    if (!isAuthenticated) {
        return (
            <div className="app-container">
                <MenuApp onToggle={handleMenuToggle} />
                <div className="content-container">
                    <div className="loading-indicator"><span>Redirection vers la page de connexion...</span></div>
                </div>
            </div>
        );
    }

    if (loading || chauffeurInfo.loading) {
        return (
            <div className="app-container">
                <MenuApp onToggle={handleMenuToggle} />
                <div className="content-container">
                    <div className="loading-indicator"><div className="spinner"></div><span>{t('messages.loadingCourses')}</span></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-container">
                <MenuApp onToggle={handleMenuToggle} />
                <div className="content-container">
                    <div className="error-message">
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()}>
                            {language === 'fr' ? 'Réessayer' : language === 'mg' ? 'Andramo indray' : 'Try again'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <MenuApp onToggle={handleMenuToggle} />
            <div className={`content-container ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}>
                <div className="affichage-content">
                    {/* TOAST */}
                    {showSuccessPopup && (
                        <div className="success-popup-course">
                            <div className="success-content-course">
                                <span className="success-icon-course" style={{marginTop:'-27px', width:'10px', height:'40px', fontSize:'40px'}}>
                                    {successMessage.includes('❌') ? '❌' : '✅'}
                                </span>
                                <span style={{marginTop:'0px', marginLeft:'40px'}}>{successMessage.replace('❌ ', '').replace('✅ ', '')}</span>
                                <button className="close-success-course" style={{marginTop:'-70px'}} onClick={() => setShowSuccessPopup(false)}>×</button>
                            </div>
                        </div>
                    )}

                    {/* HEADER */}
                    <div className="content-header" style={{marginLeft:'-5px', marginTop:'8px', position:'fixed', width:'1070px', zIndex:'999'}}>
                        <div className="header-title-section">
                            <h1 className="page-title"><FaCar className="title-icon" />{t('header.listTitle')}</h1>
                        </div>
                        <div className="header-buttons">
                            <div className="search-container-course">
                                <button className="search-icon-btn-course" onClick={toggleSearchInput} title={t('common.search')}><FaSearch /></button>
                                {showSearchInput && (
                                    <div className="search-input-wrapper-course">
                                        <input type="text" placeholder={t('common.searchPlaceholder')} value={searchTerm} onChange={handleSearchChange} className="search-input-field-course" autoFocus />
                                        {searchTerm && <button className="clear-search-btn-course" onClick={clearSearch} title={t('common.clear')}><FaTimes /></button>}
                                    </div>
                                )}
                            </div>
                            <button className={`btn-export ${!canExport() ? 'btn-disabled' : ''}`} onClick={canExport() ? handleExport : () => showToast(t('messages.exportNotAllowed'), true)} disabled={courses.length === 0 || !canExport()} title={!canExport() ? t('messages.exportNotAllowed') : t('common.export')}>
                                <FaFileExport className="btn-icon" />{t('common.export')}{!canExport() && <span className="premium-badge">🔒</span>}
                            </button>
                            <button className="btn-primary-green" onClick={() => navigate('/course/nouvelle-course')}><FaCar className="btn-icon" />{t('header.newCourse')}</button>
                        </div>
                    </div>

                    {/* TABLEAU */}
                    <div className="table-container" style={{marginTop:'110px'}}>
                        {filteredCourses.length === 0 ? (
                            <div className="no-data">
                                {searchTerm ? (
                                    <><p>{t('messages.noSearchResults')}</p><button className="btn-primary-green" onClick={clearSearch}>{t('common.showAll')}</button></>
                                ) : (
                                    <><p>{t('messages.noData')}</p><button className="btn-primary-green" onClick={() => navigate('/course/nouvelle-course')}>{t('messages.createFirst')}</button></>
                                )}
                            </div>
                        ) : (
                            <table className="compact-table1">
                                <thead>
                                    <tr>
                                        <th>{t('table.dateTime')}</th>
                                        <th style={{marginLeft:'10px', position:'absolute'}}>{t('table.client')}</th>
                                        <th style={{marginLeft:'140px', position:'absolute'}}>{t('table.route')}</th>
                                        <th style={{marginLeft:'300px', position:'absolute'}}>{t('table.proposedPrice')}</th>
                                        <th style={{marginLeft:'460px', position:'absolute'}}>{t('table.finalPrice')}</th>
                                        <th style={{marginLeft:'670px', position:'absolute'}}>{t('table.status')}</th>
                                        <th style={{marginLeft:'770px', position:'absolute'}}>{t('table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCourses.map((course) => {
                                        const normalizedStatus = normalizeStatus(course.Status_course || course.status_course);
                                        const statusClass = (course.Status_course || course.status_course || 'en attente').toLowerCase().replace(/[éè]/g, 'e');
                                        return (
                                            <tr key={course.cours_ID || course.id}>
                                                <td>{formatDateDisplay(course.Heure_depart || course.heure_depart)}</td>
                                                <td>
                                                    <div className="client-info">
                                                        <FaUser className="info-icon" />
                                                        <span>{getRelationName(course.client)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="zones-info">
                                                        <div className="zone-depart">
                                                            <FaMapMarkerAlt className="depart-icon" />
                                                            <span>{getRelationName(course.zones?.depart)}</span>
                                                        </div>
                                                        <div className="zone-arrow">→</div>
                                                        <div className="zone-arrivee">
                                                            <FaMapMarkerAlt className="arrivee-icon" />
                                                            <span>{getRelationName(course.zones?.arrivee)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="tarif-cell">{formatTarif(course.Tarif_proposer_client || course.tarif_propose)}</td>
                                                <td className="tarif-cell">{formatTarif(course.Tarif_final_accepter || course.tarif_final)}</td>
                                                <td><span className={`status-badge status-${statusClass}`}>{normalizedStatus}</span></td>
                                                <td className="actions-cell">
                                                    <div className="actions-buttons-course"> 
                                                        <button className="btn-edit-course" onClick={() => handleEditClick(course)} title={t('actions.edit')}><FaEdit size={12} /></button>
                                                        <button className="btn-delete-course" onClick={() => handleDeleteClick(course)} title={t('actions.delete')}><FaTrash size={12} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {filteredCourses.length > 0 && (
                        <div className="table-footer">
                            <p>
                                {t('table.showing')} {filteredCourses.length} {t('table.of')} {courses.length} {t('table.course' + (courses.length !== 1 ? 'sPlural' : 'Singular'))}
                                {searchTerm && ` (${t('common.filtered')})`}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* POPUP SUPPRESSION */}
            {showDeletePopup && courseToDelete && (
                <div className="popup-overlay-client">
                    <div className="delete-popup-client">
                        <div className="popup-header-client">
                            <h3>{t('modals.deleteTitle')}</h3>
                            <button className="popup-close-client" onClick={handleDeleteCancel} disabled={deleting}><FaTimes /></button>
                        </div>
                        <div className="popup-content-client">
                            <p>{t('modals.deleteConfirm')}</p>
                            <div className="course-info" style={{textAlign: 'center', margin: '20px 0'}}>
                                <div className="course-details" style={{fontSize: '16px', fontWeight: 'bold'}}>
                                    <div style={{marginBottom: '10px'}}>
                                        <span style={{color: '#2d3748'}}>{getRelationName(courseToDelete.client)}</span>
                                    </div>
                                    <div style={{marginBottom: '10px'}}>
                                        <span style={{color: '#4a5568', fontSize: '14px'}}>(ID: {courseToDelete.cours_ID || courseToDelete.id})</span>
                                    </div>
                                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', color: '#718096', marginTop: '15px'}}>
                                        <FaMapMarkerAlt style={{color: '#ff6b6b'}} />
                                        <span>{getRelationName(courseToDelete.zones?.depart)}</span>
                                        <span style={{color: '#a0aec0'}}>→</span>
                                        <FaMapMarkerAlt style={{color: '#51cf66'}} />
                                        <span>{getRelationName(courseToDelete.zones?.arrivee)}</span>
                                    </div>
                                    <div style={{fontSize: '13px', color: '#718096', marginTop: '8px'}}>
                                        {formatDateDisplay(courseToDelete.Heure_depart || courseToDelete.heure_depart)}
                                    </div>
                                </div>
                            </div>
                            <p className="warning-text-client" style={{borderTop: '2px solid #e53e3e', paddingTop: '15px', marginTop: '20px', fontWeight: 'bold', fontSize: '14px'}}>
                                {t('modals.deleteWarning')}
                            </p>
                        </div>
                        <div className="popup-actions-client">
                            <button type="button" className="btn-cancel-client" onClick={handleDeleteCancel} disabled={deleting}>{t('common.cancel')}</button>
                            <button type="button" className="btn-confirm-delete-client" onClick={handleDeleteConfirm} disabled={deleting}>{deleting ? t('common.deleting') : t('actions.confirmDelete')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* POPUP MODIFICATION */}
            {showEditPopup && (
                <div className="popup-overlay-course-edit">
                    <div className="course-edit-popup">
                        <div className="course-edit-popup-header">
                            <h3>{t('modals.editTitle')}</h3>
                            <button className="course-edit-popup-close" onClick={handleEditCancel}><FaTimes /></button>
                        </div>
                        <div className="course-edit-popup-content">
                            <div className="course-edit-form-sections">
                                <div className="course-edit-form-section">
                                    <h4 className="course-edit-section-title"><FaCalendarAlt className="course-edit-section-icon" />{t('modals.sections.basicInfo')}</h4>
                                    <div className="course-edit-form-grid">
                                        <div className="course-edit-form-group">
                                            <label>{t('form.dateTime')}</label>
                                            <input type="datetime-local" value={formatDateForInput(formData.Heure_depart)} onChange={(e) => handleFormChange('Heure_depart', e.target.value)} className="course-edit-form-input" />
                                        </div>
                                        <div className="course-edit-form-group">
                                            <label>{t('form.courseStatus')}</label>
                                            <select value={formData.Status_course} onChange={(e) => handleFormChange('Status_course', e.target.value)} className="course-edit-form-input">
                                                {getStatusOptions().map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="course-edit-form-group course-edit-full-width">
                                            <label>{t('form.specialEvent')}</label>
                                            <select value={formData.Evenement_special} onChange={(e) => handleFormChange('Evenement_special', e.target.value)} className="course-edit-form-input">
                                                {getEventOptions().map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="course-edit-form-section">
                                    <h4 className="course-edit-section-title"><FaClock className="course-edit-section-icon" />{t('modals.sections.pricingInfo')}</h4>
                                    <div className="course-edit-form-grid">
                                        <div className="course-edit-form-group">
                                            <label>{t('form.proposedPrice')}</label>
                                            <input type="number" value={formData.Tarif_proposer_client} onChange={(e) => handleFormChange('Tarif_proposer_client', e.target.value)} className="course-edit-form-input" min="0" step="100" />
                                        </div>
                                        <div className="course-edit-form-group">
                                            <label>{t('form.finalPrice')}</label>
                                            <input type="number" value={formData.Tarif_final_accepter} onChange={(e) => handleFormChange('Tarif_final_accepter', e.target.value)} className="course-edit-form-input" min="0" step="100" />
                                        </div>
                                        <div className="course-edit-form-group">
                                            <label>{t('form.priceStatus')}</label>
                                            <select value={formData.Status_tarif} onChange={(e) => handleFormChange('Status_tarif', e.target.value)} className="course-edit-form-input">
                                                {getPriceStatusOptions().map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="course-edit-form-group">
                                            <label>{t('form.waitingTime')}</label>
                                            <input type="number" value={formData.Temps_attente_avant_acceptation} onChange={(e) => handleFormChange('Temps_attente_avant_acceptation', e.target.value)} className="course-edit-form-input" min="0" step="1" />
                                        </div>
                                    </div>
                                </div>
                                <div className="course-edit-form-section">
                                    <h4 className="course-edit-section-title"><FaUser className="course-edit-section-icon" />{t('modals.sections.relations')}</h4>
                                    <div className="course-edit-form-grid">
                                        <div className="course-edit-form-group">
                                            <label>{t('form.client')}</label>
                                            <select value={formData.client_ID} onChange={(e) => handleFormChange('client_ID', e.target.value)} className="course-edit-form-input">
                                                <option value="">{t('form.selectClient')}</option>
                                                {formOptions.clients.map(client => <option key={client.client_ID} value={client.client_ID}>{client.Nom_client}</option>)}
                                            </select>
                                        </div>
                                        <div className="course-edit-form-group">
                                            <label>{t('form.driver')}</label>
                                            <select value={formData.chauffeur_ID} onChange={(e) => handleFormChange('chauffeur_ID', e.target.value)} className="course-edit-form-input">
                                                <option value="">{t('form.selectDriver')}</option>
                                                {formOptions.chauffeurs.map(chauffeur => <option key={chauffeur.chauffeur_ID} value={chauffeur.chauffeur_ID}>{chauffeur.Nom}</option>)}
                                            </select>
                                        </div>
                                        <div className="course-edit-form-group">
                                            <label>{t('form.vehicle')}</label>
                                            <select value={formData.voiture_ID} onChange={(e) => handleFormChange('voiture_ID', e.target.value)} className="course-edit-form-input">
                                                <option value="">{t('form.selectVehicle')}</option>
                                                {formOptions.voitures.map(voiture => <option key={voiture.voiture_ID} value={voiture.voiture_ID}>{voiture.Marque} {voiture.Modele ? `(${voiture.Modele})` : ''}</option>)}
                                            </select>
                                        </div>
                                        <div className="course-edit-form-group">
                                            <label>{t('form.departureZone')}</label>
                                            <select value={formData.zone_depart_ID} onChange={(e) => handleFormChange('zone_depart_ID', e.target.value)} className="course-edit-form-input">
                                                <option value="">{t('form.selectDepartureZone')}</option>
                                                {formOptions.zones.map(zone => <option key={zone.zone_ID} value={zone.zone_ID}>{zone.Nom}</option>)}
                                            </select>
                                        </div>
                                        <div className="course-edit-form-group">
                                            <label>{t('form.arrivalZone')}</label>
                                            <select value={formData.zone_arriver_ID} onChange={(e) => handleFormChange('zone_arriver_ID', e.target.value)} className="course-edit-form-input">
                                                <option value="">{t('form.selectArrivalZone')}</option>
                                                {formOptions.zones.map(zone => <option key={zone.zone_ID} value={zone.zone_ID}>{zone.Nom}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="course-edit-popup-actions">
                            <button className="btn-cancel-course" onClick={handleEditCancel} disabled={saving}><FaTimes className="btn-icon" />{t('common.cancel')}</button>
                            <button className="btn-save-course" style={{backgroundColor:'#4299e1'}} onClick={handleEditSave} disabled={saving}><FaSave className="btn-icon" />{saving ? t('common.saving') : t('common.save')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AffichageCourses;