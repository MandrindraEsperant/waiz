import React, { useState, useEffect } from 'react';
import { 
    FaUser, 
    FaMoon, 
    FaSun, 
    FaBell, 
    FaSignOutAlt, 
    FaChevronDown,
    FaCar,
    FaCalendarAlt,
    FaTimes,
    FaSave,
    FaCheck,
    FaExclamationTriangle,
    FaInfoCircle,
    FaGlobe,
    FaLanguage
} from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { verifyToken, updateUserProfile } from '../services/waizApi';
import './Header.css';

// Dictionnaire de traduction
const translations = {
  fr: {
    // Header
    appTitle: "Augmentez aux maximum vos",
    profits: "profits",
    subtitle: "Gérez vos courses et vos activités",
    darkMode: "Mode sombre",
    lightMode: "Mode clair",
    
    // Notifications
    upcomingEvents: "Événements à venir",
    eventsCount: "événement(s)",
    unreadCount: "non lu(s)",
    markAllRead: "Tout marquer comme lu",
    noEvents: "Aucun événement à venir",
    next7Days: "Les événements des 7 prochains jours apparaîtront ici",
    openCalendar: "Ouvrir le calendrier",
    urgent: "URGENT",
    important: "IMPORTANT",
    today: "Aujourd'hui",
    tomorrow: "Demain",
    days: "jour(s)",
    daysPast: "jour(s) passé",
    
    // User menu
    profile: "Mon profil",
    vehicle: "Mon véhicule",
    settings: "Paramètres",
    logout: "Déconnexion",
    driver: "Chauffeur",
    
    // Popups
    editProfile: "Modifier le Profil",
    manageVehicle: "Gérer mon véhicule",
    fullName: "Nom complet",
    email: "Email",
    phone: "Téléphone",
    cancel: "Annuler",
    save: "Sauvegarder",
    brand: "Marque du véhicule *",
    licensePlate: "Plaque d'immatriculation *",
    brandPlaceholder: "ex: Toyota, Renault, etc.",
    platePlaceholder: "ex: ABC-123",
    requiredFields: "Les champs marqués d'un * sont obligatoires",
    editVehicle: "Modifier le véhicule",
    addVehicle: "Ajouter le véhicule",
    vehicleExistsMessage: "Vous avez déjà une voiture ({{marque}} - {{plaque}}). Cliquez sur \"Modifier le véhicule\" pour la mettre à jour.",
    
    // Toasts
    profileUpdated: "Profil mis à jour avec succès!",
    vehicleAdded: "Voiture ajoutée avec succès!",
    darkModeActivated: "Mode sombre activé",
    lightModeActivated: "Mode clair activé",
    notificationMarked: "Notification marquée comme lue",
    allNotificationsRead: "Toutes les notifications ont été marquées comme lues",
    languageChanged: "Langue changée avec succès",
    
    // Languages
    languages: "Langues",
    french: "Français",
    malagasy: "Malagasy",
    english: "English",
    
    // Loading
    loading: "Chargement des données...",
    
    // Errors
    authError: "Erreur: Utilisateur non authentifié",
    requiredFieldsError: "Veuillez remplir tous les champs obligatoires",
    plateFormatError: "Format de plaque d'immatriculation invalide. Utilisez uniquement des lettres majuscules, chiffres et tirets. Exemple: ABC-123",
    networkError: "Erreur réseau",
    vehicleCheckError: "Erreur lors de la vérification du véhicule"
  },
  mg: {
    // Header
    appTitle: "Ampitomboy hatrany ny",
    profits: "tombony",
    subtitle: "Tantano ny fandehanana sy ny asa",
    darkMode: "Mode maizina",
    lightMode: "Mode mazava",
    
    // Notifications
    upcomingEvents: "Zava-misy ho avy",
    eventsCount: "zava-misy",
    unreadCount: "tsy vakina",
    markAllRead: "Hamaky ny rehetra",
    noEvents: "Tsy misy zava-misy ho avy",
    next7Days: "Hiseho eto ny zava-misy amin'ny 7 andro ho avy",
    openCalendar: "Sokafy ny kalandrie",
    urgent: "MAIKA",
    important: "ZAVA-DEHIBE",
    today: "Androany",
    tomorrow: "Rahampitso",
    days: "andro",
    daysPast: "andro lasa",
    
    // User menu
    profile: "Ny mombamomba ahy",
    vehicle: "Ny fiarako",
    settings: "Fanovana",
    logout: "Fialana",
    driver: "Mpamily",
    
    // Popups
    editProfile: "Hanova ny Momba",
    manageVehicle: "Hitantana ny fiara",
    fullName: "Anarana feno",
    email: "Mailaka",
    phone: "Finday",
    cancel: "Afoana",
    save: "Tehirizina",
    brand: "Marika ny fiara *",
    licensePlate: "Plaque d'immatriculation *",
    brandPlaceholder: "oh: Toyota, Renault, sns.",
    platePlaceholder: "oh: ABC-123",
    requiredFields: "Ilaina ny bokotra misy *",
    editVehicle: "Hanova ny fiara",
    addVehicle: "Hanampy fiara",
    vehicleExistsMessage: "Efa manana fiara ianao ({{marque}} - {{plaque}}). Tsindrio ny \"Hanova ny fiara\" raha te-havaozina.",
    
    // Toasts
    profileUpdated: "Nohavaozina soa aman-tsara ny momba!",
    vehicleAdded: "Nampiana soa aman-tsara ny fiara!",
    darkModeActivated: "Nahavitrika ny mode maizina",
    lightModeActivated: "Nahavitrika ny mode mazava",
    notificationMarked: "Notamafisina ho vakina ny fampandrenesana",
    allNotificationsRead: "Nofafana ny fampandrenesana rehetra",
    languageChanged: "Niova soa aman-tsara ny fiteny",
    
    // Languages
    languages: "Fiteny",
    french: "Frantsay",
    malagasy: "Malagasy",
    english: "Anglisy",
    
    // Loading
    loading: "Fanodinana ny angona...",
    
    // Errors
    authError: "Hadisoana: Tsy nahazo alalana ny mpampiasa",
    requiredFieldsError: "Fenoy ny bokotra rehetra ilaina",
    plateFormatError: "Tsy mety ny endriky ny plaque. Ampiasao ny litera lehibe, isa ary tiret fotsiny. Ohatra: ABC-123",
    networkError: "Hadisoana tambajotra",
    vehicleCheckError: "Hadisoana rehefa jerena ny fiara"
  },
  en: {
    // Header
    appTitle: "Maximize your",
    profits: "profits",
    subtitle: "Manage your rides and activities",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    
    // Notifications
    upcomingEvents: "Upcoming Events",
    eventsCount: "event(s)",
    unreadCount: "unread",
    markAllRead: "Mark all as read",
    noEvents: "No upcoming events",
    next7Days: "Events for the next 7 days will appear here",
    openCalendar: "Open calendar",
    urgent: "URGENT",
    important: "IMPORTANT",
    today: "Today",
    tomorrow: "Tomorrow",
    days: "day(s)",
    daysPast: "day(s) past",
    
    // User menu
    profile: "My Profile",
    vehicle: "My Vehicle",
    settings: "Settings",
    logout: "Logout",
    driver: "Driver",
    
    // Popups
    editProfile: "Edit Profile",
    manageVehicle: "Manage my vehicle",
    fullName: "Full name",
    email: "Email",
    phone: "Phone",
    cancel: "Cancel",
    save: "Save",
    brand: "Vehicle brand *",
    licensePlate: "License plate *",
    brandPlaceholder: "ex: Toyota, Renault, etc.",
    platePlaceholder: "ex: ABC-123",
    requiredFields: "Fields marked with * are required",
    editVehicle: "Edit vehicle",
    addVehicle: "Add vehicle",
    vehicleExistsMessage: "You already have a vehicle ({{marque}} - {{plaque}}). Click on \"Edit vehicle\" to update it.",
    
    // Toasts
    profileUpdated: "Profile updated successfully!",
    vehicleAdded: "Vehicle added successfully!",
    darkModeActivated: "Dark mode activated",
    lightModeActivated: "Light mode activated",
    notificationMarked: "Notification marked as read",
    allNotificationsRead: "All notifications have been marked as read",
    languageChanged: "Language changed successfully",
    
    // Languages
    languages: "Languages",
    french: "French",
    malagasy: "Malagasy",
    english: "English",
    
    // Loading
    loading: "Loading data...",
    
    // Errors
    authError: "Error: User not authenticated",
    requiredFieldsError: "Please fill all required fields",
    plateFormatError: "Invalid license plate format. Use only uppercase letters, numbers and hyphens. Example: ABC-123",
    networkError: "Network error",
    vehicleCheckError: "Error checking vehicle"
  }
};

// Composant Toast
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <FaCheck className="toast-icon" />;
            case 'error':
                return <FaExclamationTriangle className="toast-icon" />;
            case 'warning':
                return <FaExclamationTriangle className="toast-icon" />;
            default:
                return <FaInfoCircle className="toast-icon" />;
        }
    };

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-content">
                {getIcon()}
                <span className="toast-message">{message}</span>
            </div>
            <button className="toast-close" onClick={onClose}>
                <FaTimes />
            </button>
        </div>
    );
};

const Header = ({ onToggleSidebar, sidebarOpen }) => {
    const [darkMode, setDarkMode] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calendarEvents, setCalendarEvents] = useState([]);
    
    // États pour les popups
    const [showEditProfilePopup, setShowEditProfilePopup] = useState(false);
    const [showAddCarPopup, setShowAddCarPopup] = useState(false);
    
    // États pour les toasts
    const [toasts, setToasts] = useState([]);
    
    // États pour les formulaires
    const [driverProfile, setDriverProfile] = useState({
        nom: '',
        email: '',
        telephone: '',
        adresse: ''
    });
    
    const [carData, setCarData] = useState({
        marque: '',
        modele: '',
        plaqueImmatriculation: '',
        couleur: '',
        annee: ''
    });

    // UTILISATION CORRECTE DU CONTEXTE
    const { language: currentLanguage, changeLanguage } = useLanguage();
    const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

    // Fonction pour formater les messages avec variables
    const formatMessage = (message, variables = {}) => {
        return message.replace(/{{(\w+)}}/g, (match, key) => variables[key] || match);
    };

    // Fonction utilitaire pour obtenir les traductions
    const t = (key, variables = {}) => {
        const translation = translations[currentLanguage]?.[key] || translations.fr[key] || key;
        return formatMessage(translation, variables);
    };

    // Fonction pour ajouter un toast
    const showToast = (message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    // Fonction pour supprimer un toast
    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // Fonction de déconnexion
    const handleLogout = () => {
        console.log('🚪 Déconnexion manuelle');
        localStorage.removeItem('chauffeur_token');
        localStorage.removeItem('chauffeur_id');
        localStorage.removeItem('chauffeur_nom');
        localStorage.removeItem('chauffeur_email');
        localStorage.removeItem('chauffeur_telephone');
        localStorage.removeItem('user');
        localStorage.removeItem('vehicle');
        localStorage.removeItem('darkMode');
        window.location.href = '/login';
    };

    // Fonctions pour ouvrir les popups
    const handleEditProfileClick = () => {
        setShowEditProfilePopup(true);
        setUserMenuOpen(false);
        // Pré-remplir le formulaire avec les données actuelles
        if (user) {
            setDriverProfile({
                nom: user.Nom || '',
                email: user.Email || '',
                telephone: user.Telephone || '',
                adresse: ''
            });
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        try {
            const nameParts = (driverProfile.nom || '').trim().split(' ');
            const firstName = nameParts.shift() || '';
            const name = nameParts.join(' ') || firstName;

            await updateUserProfile({
                name,
                firstName,
                email: driverProfile.email,
                phone: driverProfile.telephone,
            });

            setUser({
                ...user,
                Nom: driverProfile.nom,
                Email: driverProfile.email,
                Telephone: driverProfile.telephone,
            });
            setShowEditProfilePopup(false);
            showToast(t('profileUpdated'), 'success');
        } catch (error) {
            showToast(error.message || t('networkError'), 'error');
        }
    };

    const handleCarSave = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('chauffeur_token');
            const chauffeurId = localStorage.getItem('chauffeur_id') || user?.chauffeur_ID;

            if (!token || !chauffeurId) {
                showToast(t('authError'), 'error');
                return;
            }

            // Validation des champs
            if (!carData.marque.trim() || !carData.plaqueImmatriculation.trim()) {
                showToast(t('requiredFieldsError'), 'warning');
                return;
            }

            // Validation du format de la plaque d'immatriculation
            const plaqueRegex = /^[A-Z0-9-]{1,15}$/;
            if (!plaqueRegex.test(carData.plaqueImmatriculation.toUpperCase())) {
                showToast(t('plateFormatError'), 'warning');
                return;
            }

            const newVehicle = {
                marque: carData.marque.trim(),
                plaque_immatriculation: carData.plaqueImmatriculation.toUpperCase().trim()
            };

            setVehicle(newVehicle);
            localStorage.setItem('vehicle', JSON.stringify(newVehicle));

            setCarData({
                marque: '',
                modele: '',
                plaqueImmatriculation: '',
                couleur: '',
                annee: ''
            });

            setShowAddCarPopup(false);
            showToast(t('vehicleAdded'), 'success');
        } catch (error) {
            console.error('Erreur sauvegarde véhicule:', error);
            showToast(t('networkError'), 'error');
        }
    };

    // Fonction pour vérifier si le chauffeur a déjà une voiture
    const checkExistingVehicle = async () => {
        try {
            const savedVehicle = localStorage.getItem('vehicle');
            if (savedVehicle) {
                const parsed = JSON.parse(savedVehicle);
                return {
                    Marque: parsed.marque,
                    Plaque_immatriculation: parsed.plaque_immatriculation,
                };
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du véhicule:', error);
        }
        return null;
    };

    // Modifiez la fonction handleAddCarClick pour vérifier s'il y a déjà une voiture
    const handleAddCarClick = async () => {
        const existingVehicle = await checkExistingVehicle();
        
        if (existingVehicle) {
            // Utiliser la traduction avec variables
            showToast(
                t('vehicleExistsMessage', {
                    marque: existingVehicle.Marque,
                    plaque: existingVehicle.Plaque_immatriculation
                }),
                'info'
            );
            
            // Pré-remplir le formulaire avec les données existantes
            setCarData({
                marque: existingVehicle.Marque || '',
                modele: '',
                plaqueImmatriculation: existingVehicle.Plaque_immatriculation || '',
                couleur: '',
                annee: ''
            });
        }
        
        setShowAddCarPopup(true);
        setUserMenuOpen(false);
    };

    const handleInputChange = (setter, field, value) => {
        setter(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Fonction pour formater le texte de temps
    const getTimeText = (daysDiff) => {
        if (daysDiff === 0) return t('today');
        if (daysDiff === 1) return t('tomorrow');
        if (daysDiff > 0) return `${t('days')} ${daysDiff}`;
        return `${Math.abs(daysDiff)} ${t('daysPast')}`;
    };

    // Charger les événements du calendrier depuis le générateur de données
    useEffect(() => {
        const loadCalendarEvents = () => {
            try {
                const savedNotes = localStorage.getItem('generateur_donnees_notes');
                if (savedNotes) {
                    const notes = JSON.parse(savedNotes);
                    
                    // Convertir les notes en événements pour les notifications
                    const events = notes.map(note => {
                        const eventDate = new Date(note.date);
                        const today = new Date();
                        const timeDiff = eventDate.getTime() - today.getTime();
                        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                        
                        let urgency = 'normal';
                        
                        if (daysDiff === 0) {
                            urgency = 'urgent';
                        } else if (daysDiff === 1) {
                            urgency = 'important';
                        } else if (daysDiff > 0 && daysDiff <= 7) {
                            urgency = 'upcoming';
                        } else if (daysDiff < 0) {
                            urgency = 'past';
                        }
                        
                        return {
                            id: note.id,
                            text: note.text,
                            date: note.date,
                            daysDiff: daysDiff,
                            urgency: urgency,
                            timeText: getTimeText(daysDiff),
                            type: 'evenement',
                            read: false,
                            createdAt: note.createdAt
                        };
                    }).filter(event => event.daysDiff >= 0);
                    
                    setCalendarEvents(events);
                } else {
                    setCalendarEvents([]);
                }
            } catch (error) {
                console.error('❌ Erreur lors du chargement des événements:', error);
                setCalendarEvents([]);
            }
        };

        loadCalendarEvents();

        const handleStorageChange = (e) => {
            if (e.key === 'generateur_donnees_notes') {
                loadCalendarEvents();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        const interval = setInterval(loadCalendarEvents, 30000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [currentLanguage]); // currentLanguage comme dépendance

    // Chargement des données utilisateur et véhicule
    useEffect(() => {
        const getDefaultVehicle = () => {
            return {
                marque: 'Non spécifié',
                modele: 'Non spécifié',
                plaque_immatriculation: 'N/A',
                couleur: 'Non spécifié',
                annee: 'N/A'
            };
        };

        const loadFallbackData = () => {
            const savedUser = {
                Nom: localStorage.getItem('chauffeur_nom'),
                Email: localStorage.getItem('chauffeur_email'),
                Telephone: localStorage.getItem('chauffeur_telephone'),
                chauffeur_ID: localStorage.getItem('chauffeur_id')
            };
            if (savedUser.Nom) {
                setUser(savedUser);
            }
            setVehicle(getDefaultVehicle());
        };

        const fetchVehicleData = async () => {
            try {
                const savedVehicle = localStorage.getItem('vehicle');
                if (savedVehicle) {
                    setVehicle(JSON.parse(savedVehicle));
                } else {
                    setVehicle(getDefaultVehicle());
                }
            } catch (error) {
                setVehicle(getDefaultVehicle());
            }
        };

        const fetchChauffeurData = async () => {
            try {
                const token = localStorage.getItem('chauffeur_token') || localStorage.getItem('token');

                if (!token) {
                    window.location.href = '/login';
                    return;
                }

                setLoading(true);

                const userData = await verifyToken();
                const chauffeurId = userData?.id || localStorage.getItem('chauffeur_id');

                const formattedUser = {
                    Nom: userData?.nom || localStorage.getItem('chauffeur_nom'),
                    Email: userData?.email || localStorage.getItem('chauffeur_email'),
                    Telephone: userData?.telephone || localStorage.getItem('chauffeur_telephone'),
                    chauffeur_ID: chauffeurId
                };

                setUser(formattedUser);
                localStorage.setItem('user', JSON.stringify(formattedUser));

                const savedVehicle = localStorage.getItem('vehicle');
                if (savedVehicle) {
                    setVehicle(JSON.parse(savedVehicle));
                } else {
                    setVehicle(getDefaultVehicle());
                }
            } catch (error) {
                console.error('Erreur réseau:', error);
                loadFallbackData();
            } finally {
                setLoading(false);
            }
        };

        // Charger les données depuis localStorage au démarrage
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        const savedUser = localStorage.getItem('user');
        const savedVehicle = localStorage.getItem('vehicle');
        
        setDarkMode(savedDarkMode);
        
        const chauffeurNom = localStorage.getItem('chauffeur_nom');
        if (chauffeurNom) {
            const userFromLogin = {
                Nom: chauffeurNom,
                Email: localStorage.getItem('chauffeur_email'),
                Telephone: localStorage.getItem('chauffeur_telephone'),
                chauffeur_ID: localStorage.getItem('chauffeur_id')
            };
            setUser(userFromLogin);
        } else if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        
        if (savedVehicle) {
            setVehicle(JSON.parse(savedVehicle));
        }

        if (savedDarkMode) {
            document.body.classList.add('dark-mode');
        }

        const token = localStorage.getItem('chauffeur_token');
        if (token) {
            fetchChauffeurData();
        } else {
            setLoading(false);
        }
    }, []);

    // Basculer le mode sombre
    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode.toString());
        
        if (newDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        showToast(newDarkMode ? t('darkModeActivated') : t('lightModeActivated'), 'success');
    };
    
    // Marquer une notification comme lue
    const markNotificationAsRead = (notificationId) => {
        setCalendarEvents(prev => 
            prev.map(event => 
                event.id === notificationId ? { ...event, read: true } : event
            )
        );
        showToast(t('notificationMarked'), 'info');
    };

    // Marquer toutes les notifications comme lues
    const markAllAsRead = () => {
        setCalendarEvents(prev => 
            prev.map(event => ({ ...event, read: true }))
        );
        showToast(t('allNotificationsRead'), 'success');
    };

    // Trier les notifications par urgence et date
    const sortedNotifications = calendarEvents
        .filter(event => event.daysDiff <= 7)
        .sort((a, b) => {
            if (!a.read && b.read) return -1;
            if (a.read && !b.read) return 1;
            
            if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
            if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;
            
            if (a.urgency === 'important' && b.urgency !== 'important') return -1;
            if (b.urgency === 'important' && a.urgency !== 'important') return 1;
            
            return a.daysDiff - b.daysDiff;
        });

    const unreadNotifications = calendarEvents.filter(event => !event.read && event.daysDiff <= 7).length;
    const upcomingEventsCount = calendarEvents.filter(event => event.daysDiff <= 7).length;

    if (loading) {
        return (
            <header className="header">
                <div className="header-loading">
                    {t('loading')}
                </div>
            </header>
        );
    }

    return (
        <>
            <header className={`header ${sidebarOpen ? 'menu-open' : ''}`}>
                {/* Partie gauche - Logo et titre */}
                <div className="header-left">
                    <div className="header-brand">
                        <span className="logo-text"></span>
                        <span className="logo-subtitle"></span>
                    </div>
                    
                    <div className="app-title-container-header compact">
                        <h1 className="app-title-heder" style={{fontSize:'25px'}}>
                            {t('appTitle')} 
                            <span className="profit-text">
                                {t('profits')}
                            </span>
                        </h1>
                        <p className="app-subtitle-header" style={{marginLeft:'200px'}}>{t('subtitle')}</p>
                    </div>
                </div>

                {/* Partie droite - Actions utilisateur */}
                <div className="header-right">
                    {/* Bouton Mode Sombre/Clair */}
                    <button 
                        className="header-btn theme-toggle"
                        onClick={toggleDarkMode}
                        title={darkMode ? t('lightMode') : t('darkMode')}
                    >
                        {darkMode ? <FaSun /> : <FaMoon />}
                    </button>

                    {/* Informations véhicule */}
                    {vehicle && (
                        <div className="vehicle-info">
                            <FaCar className="vehicle-icon" style={{color:'#007bff'}}/>
                            <div className="vehicle-details">
                                <span className="vehicle-model">
                                    {vehicle.marque}
                                </span>
                                <span className="vehicle-plate">
                                    {vehicle.plaque_immatriculation}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Notifications */}
                    <div className="notification-wrapper">
                        <button 
                            className="header-btn notification-btn"
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                        >
                            <FaBell className="notification-icon" style={{color:'black'}}/>
                            {unreadNotifications > 0 && (
                                <span className="notification-badge">
                                    {unreadNotifications}
                                </span>
                            )}
                        </button>

                        {notificationsOpen && (
                            <div className="notification-dropdown">
                                <div className="notification-header">
                                    <h4>{t('upcomingEvents')}</h4>
                                    <div className="notification-header-actions">
                                        <span className="notification-count">
                                            {upcomingEventsCount} {t('eventsCount')}
                                            {unreadNotifications > 0 && ` • ${unreadNotifications} ${t('unreadCount')}`}
                                        </span>
                                        {unreadNotifications > 0 && (
                                            <button 
                                                className="mark-all-read-btn"
                                                onClick={markAllAsRead}
                                                title={t('markAllRead')}
                                            >
                                                {t('markAllRead')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="notification-list">
                                    {sortedNotifications.length === 0 ? (
                                        <div className="no-notifications">
                                            <FaCalendarAlt className="no-events-icon" />
                                            <p>{t('noEvents')}</p>
                                            <small>{t('next7Days')}</small>
                                        </div>
                                    ) : (
                                        sortedNotifications.map(notification => (
                                            <div 
                                                key={notification.id} 
                                                className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.urgency}`}
                                                onClick={() => markNotificationAsRead(notification.id)}
                                            >
                                                <div className="notification-icon">
                                                    <FaCalendarAlt className="calendar-icon" style={{color:'#007bff'}}/>
                                                </div>
                                                <div className="notification-content">
                                                    <div className="notification-text">
                                                        {notification.text}
                                                        <span className="event-date">
                                                            {new Date(notification.date).toLocaleDateString(currentLanguage, { 
                                                                weekday: 'short',
                                                                day: 'numeric',
                                                                month: 'short'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="notification-meta">
                                                        <span className={`notification-time ${notification.urgency}`}>
                                                            {notification.timeText}
                                                        </span>
                                                        {notification.urgency === 'urgent' && (
                                                            <span className="urgency-badge urgent">{t('urgent')}</span>
                                                        )}
                                                        {notification.urgency === 'important' && (
                                                            <span className="urgency-badge important">{t('important')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {!notification.read && (
                                                    <div className="unread-dot"></div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="notification-footer">
                                    <button 
                                        className="view-all-btn"
                                        onClick={() => {
                                            window.location.href = '/generateur-donnees/generateur-donnees';
                                        }}
                                    >
                                        <FaCalendarAlt />
                                        {t('openCalendar')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Menu Utilisateur */}
                    <div className="user-menu-wrapper">
                        <button 
                            className="user-menu-btn"
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                        >
                            <div className="user-avatar">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.Nom} />
                                ) : (
                                    <FaUser />
                                )}
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user?.Nom || t('driver')}</span>
                                <span className="user-role">{t('driver')}</span>
                            </div>
                            <FaChevronDown className={`chevron ${userMenuOpen ? 'open' : ''}`} />
                        </button>

                        {userMenuOpen && (
                            <div className="user-dropdown">
                                <div className="user-profile">
                                    <div className="user-avatar large">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.Nom} />
                                        ) : (
                                            <FaUser />
                                        )}
                                    </div>
                                    <div className="user-details">
                                        <div className="user-name">{user?.Nom || t('driver')}</div>
                                        <div className="user-email">{user?.Email || ''}</div>
                                    </div>
                                </div>
                                <div className="dropdown-divider"></div>
                                
                                {/* Boutons simplifiés - ouvrent directement les popups */}
                                <button 
                                    className="dropdown-item"
                                    onClick={handleEditProfileClick}
                                >
                                    <FaUser className="dropdown-icon" style={{color:'#3498db'}}/>
                                    {t('profile')}
                                </button>

                                <button 
                                    className="dropdown-item"
                                    onClick={handleAddCarClick}
                                >
                                    <FaCar className="dropdown-icon" style={{color:'#3498db'}}/>
                                    {t('vehicle')}
                                </button>

                                <button 
                                    className="dropdown-item"
                                    onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                                >
                                    <FaGlobe className="dropdown-icon" style={{color:'#3498db'}}/>
                                    {t('languages')}
                                    <FaChevronDown className={`chevron ${languageMenuOpen ? 'open' : ''}`} />
                                </button>

                                {/* Sous-menu des langues - CORRIGÉ */}
                                {languageMenuOpen && (
                                    <div className="language-submenu">
                                        <button 
                                            className={`dropdown-item language-option ${currentLanguage === 'fr' ? 'active' : ''}`}
                                            onClick={() => changeLanguage('fr')}
                                        >
                                            <FaLanguage className="dropdown-icon" style={{color:'#3498db'}}/>
                                            {t('french')}
                                            {currentLanguage === 'fr' && <FaCheck className="check-icon" />}
                                        </button>
                                        <button 
                                            className={`dropdown-item language-option ${currentLanguage === 'mg' ? 'active' : ''}`}
                                            onClick={() => changeLanguage('mg')}
                                        >
                                            <FaLanguage className="dropdown-icon" style={{color:'#3498db'}}/>
                                            {t('malagasy')}
                                            {currentLanguage === 'mg' && <FaCheck className="check-icon" />}
                                        </button>
                                        <button 
                                            className={`dropdown-item language-option ${currentLanguage === 'en' ? 'active' : ''}`}
                                            onClick={() => changeLanguage('en')}
                                        >
                                            <FaLanguage className="dropdown-icon" style={{color:'#3498db'}}/>
                                            {t('english')}
                                            {currentLanguage === 'en' && <FaCheck className="check-icon" />}
                                        </button>
                                    </div>
                                )}
                                
                                <div className="dropdown-divider"></div>
                                
                                <button 
                                    className="dropdown-item logout"
                                    onClick={handleLogout}
                                >
                                    <FaSignOutAlt className="dropdown-icon" />
                                    {t('logout')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Popup de modification du profil */}
                {showEditProfilePopup && (
                    <div className="popup-overlay" onClick={() => setShowEditProfilePopup(false)}>
                        <div className="edit-popup" onClick={(e) => e.stopPropagation()} >
                            <div className="popup-header-vehicule-profile">
                                <h3>{t('editProfile')}</h3>
                                <button 
                                    className="popup-close"
                                    onClick={() => setShowEditProfilePopup(false)}
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="popup-content-header">
                                <form onSubmit={handleProfileSave} className="profile-form">
                                    <div className="form-group" style={{marginTop:'-10px'}}>
                                        <label>{t('fullName')}</label>
                                        <input
                                            type="text"
                                            value={driverProfile.nom}
                                            onChange={(e) => handleInputChange(setDriverProfile, 'nom', e.target.value)}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{marginTop:'-30px'}}>
                                        <label>{t('email')}</label>
                                        <input
                                            type="email"
                                            value={driverProfile.email}
                                            onChange={(e) => handleInputChange(setDriverProfile, 'email', e.target.value)}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{marginTop:'-30px'}}>
                                        <label>{t('phone')}</label>
                                        <input
                                            type="tel"
                                            value={driverProfile.telephone}
                                            onChange={(e) => handleInputChange(setDriverProfile, 'telephone', e.target.value)}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="popup-actions" style={{marginTop:'-15px'}}>
                                        <button 
                                            type="button" 
                                            className="btn-cancel"
                                            onClick={() => setShowEditProfilePopup(false)}
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button type="submit" className="btn-save">
                                            <FaSave className="btn-icon" />
                                            {t('save')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Popup d'ajout de voiture */}
                {showAddCarPopup && (
                    <div className="popup-overlay" onClick={() => setShowAddCarPopup(false)}>
                        <div className="edit-popup" onClick={(e) => e.stopPropagation()}>
                            <div className="popup-header-vehicule-profile">
                                <h3 style={{color:'white'}}>{t('manageVehicle')}</h3>
                                <button 
                                    className="popup-close"
                                    onClick={() => setShowAddCarPopup(false)}
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="popup-content-header">
                                <form onSubmit={handleCarSave} className="car-form">
                                    <div className="form-group" style={{marginTop:'-10px'}}>
                                        <label>{t('brand')}</label>
                                        <input
                                            type="text"
                                            value={carData.marque}
                                            onChange={(e) => handleInputChange(setCarData, 'marque', e.target.value)}
                                            className="form-input"
                                            placeholder={t('brandPlaceholder')}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{marginTop:'-30px'}}>
                                        <label>{t('licensePlate')}</label>
                                        <input
                                            type="text"
                                            value={carData.plaqueImmatriculation}
                                            onChange={(e) => handleInputChange(setCarData, 'plaqueImmatriculation', e.target.value.toUpperCase())}
                                            className="form-input"
                                            placeholder={t('platePlaceholder')}
                                            required
                                            style={{textTransform: 'uppercase'}}
                                        />
                                        <small className="form-help">
                                            {currentLanguage === 'fr' ? 'Format: lettres et chiffres uniquement (max 10 caractères)' : 
                                             currentLanguage === 'mg' ? 'Endrika: litera sy isa fotsiny (farany 10 soratra)' : 
                                             'Format: letters and numbers only (max 10 characters)'}
                                        </small>
                                    </div>
                                    
                                    <div className="form-notice" style={{marginTop:'-30px'}}>
                                        <FaCar style={{marginRight: '8px'}} />
                                        {t('requiredFields')}
                                    </div>
                                    
                                    <div className="popup-actions" style={{marginTop:'-15px'}}>
                                        <button 
                                            type="button" 
                                            className="btn-cancel"
                                            onClick={() => setShowAddCarPopup(false)}
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button type="submit" className="btn-save">
                                            <FaSave className="btn-icon" />
                                            {vehicle ? t('editVehicle') : t('addVehicle')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Container pour les toasts */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </>
    );
};

export default Header;