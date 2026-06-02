import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaHome, FaTags, FaCalendarCheck, FaUser, 
    FaBell, FaCar, FaSearch, FaFire, FaBolt,
    FaMapMarkerAlt, FaCircle, FaUsers, FaTimes,
    FaArrowRight, FaStar, FaClock, FaPlus, FaMinus,
    FaCalendarAlt, FaClock as FaClockRegular, FaCheckCircle,
    FaShieldAlt, FaKey, FaHeadset, FaMapMarkedAlt,
    FaUserPlus, FaExchangeAlt, FaShoppingCart, FaRoad, FaAndroid,
    FaQuoteRight, FaGlobe, FaFileAlt, FaQuestionCircle,
    FaChevronRight, FaFacebook, FaTwitter, FaInstagram, FaApple,
    FaLinkedin, FaYoutube, FaEnvelope, FaPhone, FaTimesCircle,
    FaMoneyBillWave, FaSmile, FaClock as FaTime, FaHeart, FaSpinner
} from 'react-icons/fa';
import { fetchRides, createRide } from '../../../services/waizApi';
import { getLocalZones } from '../../../utils/localZones';
import './acceuil.css';

const DEFAULT_ZONES_ACCEUIL = [
  { id: 'zone-1', nom: 'Antananarivo - Centre', latitude: -18.8792, longitude: 47.5079 },
  { id: 'zone-2', nom: 'Toamasina', latitude: -18.1492, longitude: 49.4023 },
];

function Acceuil() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [offres, setOffres] = useState([]);
    const [filteredOffres, setFilteredOffres] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedOffre, setSelectedOffre] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showAllerRetour, setShowAllerRetour] = useState(false);
    const [zones, setZones] = useState([]);
    const [apiError, setApiError] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    
    const [reservationData, setReservationData] = useState({
        id: null,
        date_reservation: '',
        date_depart: '',
        date_retour: '',
        nbr_passager: 1,
        client_id: null,
        zone_depart_id: null,
        zone_arrivee_id: null,
        aller_retour: false,
        offre_id: null,
        chauffeur_id: null,
        prix_total: 0
    });
    
    const [searchData, setSearchData] = useState({
        depart: '',
        arrivee: '',
        date_depart: '',
        date_retour: '',
        passagers: 1,
        aller_retour: false
    });

    const [suggestions, setSuggestions] = useState({
        depart: [],
        arrivee: []
    });

    const [showSuggestions, setShowSuggestions] = useState({
        depart: false,
        arrivee: false
    });

    // Témoignages clients
    const testimonials = [
        {
            id: 1,
            name: "Sophie M.",
            date: "15/03/2024",
            text: "J'ai économisé plus de 200€ sur mon trajet Paris-Lyon. Conducteur très sympathique et voiture propre. Je recommande vivement !",
            rating: 5
        },
        {
            id: 2,
            name: "Thomas L.",
            date: "08/03/2024",
            text: "Première expérience en tant que conducteur, j'ai partagé mes frais et rencontré des personnes intéressantes. Application intuitive et facile à utiliser.",
            rating: 5
        },
        {
            id: 3,
            name: "Marie K.",
            date: "22/02/2024",
            text: "Service fiable et économique. Les passagers étaient ponctuels et respectueux. Je recommande à tous mes amis !",
            rating: 5
        },
        {
            id: 4,
            name: "Pierre D.",
            date: "10/02/2024",
            text: "Grâce à cette plateforme, je fais Toulouse-Bordeaux chaque semaine pour seulement 15€. C'est devenu mon moyen de transport principal.",
            rating: 5
        },
        {
            id: 5,
            name: "Julie R.",
            date: "28/01/2024",
            text: "Application très bien conçue, paiement sécurisé et équipe réactive. J'ai déjà effectué plus de 30 trajets en toute sérénité.",
            rating: 5
        },
        {
            id: 6,
            name: "Antoine B.",
            date: "15/01/2024",
            text: "Je cherchais une alternative économique au train. Le covoiturage est parfait : prix abordables et flexibilité des horaires.",
            rating: 5
        },
        {
            id: 7,
            name: "Claire V.",
            date: "05/01/2024",
            text: "En tant que mère de famille, je suis rassurée par le système d'évaluation des conducteurs. Mes enfants voyagent en toute sécurité.",
            rating: 5
        },
        {
            id: 8,
            name: "Lucas P.",
            date: "20/12/2023",
            text: "Le meilleur rapport qualité-prix pour mes déplacements. 5 étoiles pour l'équipe et la communauté !",
            rating: 5
        }
    ];

    // Avantages du covoiturage
    const avantages = [
        {
            id: 1,
            icon: <FaMoneyBillWave />,
            title: "Économies garanties",
            description: "Partagez les frais de route et économisez jusqu'à 70% par rapport aux transports traditionnels. Idéal pour votre budget !"
        },
        {
            id: 2,
            icon: <FaUsers />,
            title: "Communauté de confiance",
            description: "Rejoignez une communauté bienveillante avec des profils vérifiés et des systèmes d'évaluation transparents."
        },
        {
            id: 3,
            icon: <FaShieldAlt />,
            title: "Voyages sécurisés",
            description: "Chaque trajet est sécurisé avec notre garantie, assistance 24h/24 et paiement 100% sécurisé."
        },
        {
            id: 4,
            icon: <FaHeart />,
            title: "Éco-responsable",
            description: "En covoiturant, vous réduisez votre empreinte carbone. Ensemble, préservons notre planète !"
        },
        {
            id: 5,
            icon: <FaSmile />,
            title: "Rencontres enrichissantes",
            description: "Faites de nouvelles rencontres et partagez des moments conviviaux pendant vos trajets."
        },
        {
            id: 6,
            icon: <FaMapMarkedAlt />,
            title: "Flexibilité totale",
            description: "Choisissez vos horaires, vos arrêts et votre conducteur. Vous êtes maître de votre voyage."
        },
        {
            id: 7,
            icon: <FaTime />,
            title: "Gain de temps",
            description: "Profitez des voies réservées au covoiturage et évitez les embouteillages sur les grands axes."
        },
        {
            id: 8,
            icon: <FaCar />,
            title: "Large choix de véhicules",
            description: "Du citadine au SUV, choisissez le véhicule qui correspond à vos besoins et votre confort."
        }
    ];

    // Étapes pour covoiturer
    const etapesReservation = [
        {
            id: 1,
            title: "Je recherche",
            subtitle: "mon trajet idéal (destination, date, horaire)."
        },
        {
            id: 2,
            title: "Je sélectionne",
            subtitle: "le conducteur qui me correspond (avis, véhicule)."
        },
        {
            id: 3,
            title: "Je réserve",
            subtitle: "ma place en quelques clics, paiement sécurisé."
        },
        {
            id: 4,
            title: "Je voyage",
            subtitle: "sereinement et je profite de l'aventure !"
        }
    ];

    // Articles du blog
    const magArticles = [
        {
            id: 1,
            title: "Les 5 plus belles routes de France à faire en covoiturage",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
            link: "#"
        },
        {
            id: 2,
            title: "Comment voyager éco-responsable ? Nos conseils",
            image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d",
            link: "#"
        },
        {
            id: 3,
            title: "Rencontres insolites : nos meilleures histoires de covoiturage",
            image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800",
            link: "#"
        }
    ];

    // Charger l'utilisateur connecté et les données initiales
    useEffect(() => {
        const initializeData = async () => {
            try {
                setInitialLoading(true);
                setApiError(null);
                
                // Charger l'utilisateur
                loadCurrentUser();
                
                // Charger les zones
                await loadZones();
                
                // Charger les offres disponibles
                await loadOffres();
                
            } catch (error) {
                console.error('Erreur lors de l\'initialisation:', error);
                setApiError('Erreur lors du chargement des données. Veuillez rafraîchir la page.');
            } finally {
                setInitialLoading(false);
            }
        };

        initializeData();
        
        // Définir les dates par défaut
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        setSearchData(prev => ({ 
            ...prev, 
            date_depart: tomorrow.toISOString().split('T')[0],
            date_retour: nextWeek.toISOString().split('T')[0]
        }));
    }, []);

    // Charger l'utilisateur connecté
    const loadCurrentUser = () => {
        try {
            const possibleKeys = ['user', 'authUser', 'currentUser', 'client', 'chauffeur'];
            let userData = null;
            
            for (const key of possibleKeys) {
                const data = localStorage.getItem(key) || sessionStorage.getItem(key);
                if (data) {
                    userData = JSON.parse(data);
                    break;
                }
            }
            
            if (userData) {
                // Normaliser l'utilisateur
                if (!userData.id) {
                    if (userData.client_ID) userData.id = userData.client_ID;
                    else if (userData.chauffeur_ID) userData.id = userData.chauffeur_ID;
                    else if (userData.id_utilisateur) userData.id = userData.id_utilisateur;
                }
                
                if (!userData.role) {
                    if (userData.chauffeur_ID || userData.type === 'chauffeur') userData.role = 'chauffeur';
                    else if (userData.client_ID || userData.type === 'client') userData.role = 'client';
                    else userData.role = 'client';
                }
                
                if (!userData.Nom) {
                    if (userData.nom && userData.prenom) {
                        userData.Nom = `${userData.prenom} ${userData.nom}`;
                    } else if (userData.nom) {
                        userData.Nom = userData.nom;
                    } else if (userData.username) {
                        userData.Nom = userData.username;
                    } else {
                        userData.Nom = 'Utilisateur';
                    }
                }
                
                setCurrentUser(userData);
                setReservationData(prev => ({
                    ...prev,
                    client_id: userData.id || userData.client_ID
                }));
                
                return userData;
            }
        } catch (error) {
            console.error('Erreur chargement utilisateur:', error);
        }
        return null;
    };

    // Charger les zones
    const loadZones = async () => {
        try {
            setZones(getLocalZones().length ? getLocalZones() : DEFAULT_ZONES_ACCEUIL);
        } catch (error) {
            setZones(DEFAULT_ZONES_ACCEUIL);
        }
    };

    const loadOffres = async () => {
        try {
            setLoading(true);
            setApiError(null);
            const rides = await fetchRides({ status: 'PENDING' });
            const formattedOffres = rides.map((item) => ({
                id: item.id,
                zone_depart_nom: item.zone_depart_nom || 'Départ',
                zone_arrivee_nom: item.zone_arrivee_nom || 'Arrivée',
                chauffeur_nom: item.chauffeur?.nom || 'Chauffeur',
                prix_par_personne: item.prix_par_personne || item.Tarif_proposer_client || 25000,
                date_voyage: item.date_voyage,
                nbr_passager: item.nbr_passager || 4,
            }));
            setOffres(formattedOffres);
            setFilteredOffres(formattedOffres);
        } catch (error) {
            setApiError('Impossible de charger les offres');
            setOffres([]);
            setFilteredOffres([]);
        } finally {
            setLoading(false);
        }
    };

    // Gérer la recherche de villes avec les zones
    const handleCitySearch = async (field, value) => {
        setSearchData(prev => ({ ...prev, [field]: value }));
        
        if (value.length > 2) {
            // Filtrer les zones locales
            const filteredZones = zones.filter(zone => 
                zone.nom.toLowerCase().includes(value.toLowerCase()) ||
                (zone.region && zone.region.toLowerCase().includes(value.toLowerCase()))
            );
            
            setSuggestions(prev => ({ ...prev, [field]: filteredZones }));
            setShowSuggestions(prev => ({ ...prev, [field]: true }));
        } else {
            setSuggestions(prev => ({ ...prev, [field]: [] }));
            setShowSuggestions(prev => ({ ...prev, [field]: false }));
        }
    };

    // Sélectionner une suggestion
    const selectSuggestion = (field, suggestion) => {
        setSearchData(prev => ({ ...prev, [field]: suggestion.nom }));
        setShowSuggestions(prev => ({ ...prev, [field]: false }));
    };

    // Gérer la recherche de trajets
    const handleSearch = async (e) => {
        e.preventDefault();
        
        try {
            setIsSearching(true);
            setLoading(true);
            
            // Filtrer les offres localement
            const filtered = offres.filter(offre => {
                const matchDepart = !searchData.depart || 
                    offre.depart.ville.toLowerCase().includes(searchData.depart.toLowerCase());
                
                const matchArrivee = !searchData.arrivee || 
                    offre.arrivee.ville.toLowerCase().includes(searchData.arrivee.toLowerCase());
                
                const offreDate = new Date(offre.date_depart).toISOString().split('T')[0];
                const matchDate = !searchData.date_depart || 
                    offreDate === searchData.date_depart;
                
                const matchPlaces = offre.places_dispo >= searchData.passagers;
                
                return matchDepart && matchArrivee && matchDate && matchPlaces;
            });
            
            setFilteredOffres(filtered);
            
            // Scroll vers la section des offres
            document.getElementById('offres-section').scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Erreur recherche:', error);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    // Gérer l'incrémentation des passagers
    const incrementPassagers = () => {
        if (searchData.passagers < 8) {
            setSearchData(prev => ({ ...prev, passagers: prev.passagers + 1 }));
        }
    };

    const decrementPassagers = () => {
        if (searchData.passagers > 1) {
            setSearchData(prev => ({ ...prev, passagers: prev.passagers - 1 }));
        }
    };

    // Toggle aller-retour
    const toggleAllerRetour = () => {
        setSearchData(prev => ({ ...prev, aller_retour: !prev.aller_retour }));
        setShowAllerRetour(!showAllerRetour);
    };

    // Ouvrir le modal de réservation
    const openReservationModal = (offre) => {
        if (!currentUser) {
            alert('Veuillez vous connecter pour réserver');
            navigate('/login');
            return;
        }
        
        if (currentUser.role === 'chauffeur') {
            alert('Les chauffeurs ne peuvent pas réserver de trajets. Connectez-vous en tant que client.');
            return;
        }
        
        const maintenant = new Date();
        const dateReservation = maintenant.toISOString().split('T')[0];
        
        setSelectedOffre(offre);
        setReservationData({
            id: null,
            date_reservation: dateReservation,
            date_depart: offre.date_depart,
            date_retour: searchData.date_retour,
            nbr_passager: searchData.passagers,
            client_id: currentUser.id,
            zone_depart_id: offre.depart.zone_id,
            zone_arrivee_id: offre.arrivee.zone_id,
            offre_id: offre.id,
            chauffeur_id: offre.chauffeur.id,
            prix_total: offre.prix_par_personne * searchData.passagers,
            aller_retour: searchData.aller_retour
        });
        
        setShowModal(true);
    };

    // Fermer le modal
    const closeModal = () => {
        setShowModal(false);
        setSelectedOffre(null);
    };

    // Confirmer la réservation
    const confirmReservation = async () => {
        try {
            setLoading(true);
            
            await createRide({
                departure: { latitude: -18.8792, longitude: 47.5079 },
                arrival: { latitude: -18.1492, longitude: 49.4023 },
                departureName: selectedOffre?.zone_depart_nom || 'Départ',
                arrivalName: selectedOffre?.zone_arrivee_nom || 'Arrivée',
                price: selectedOffre?.prix_par_personne || 25000,
                distance: 5,
                isReservation: true,
                scheduledAt: new Date(reservationData.date_depart).toISOString(),
            });
            alert('Réservation créée avec succès !');
            setShowModal(false);
            await loadOffres();
            setShowSuccessModal(false);
        } catch (error) {
            console.error('Erreur réservation:', error);
            alert(`Erreur lors de la réservation: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Proposer un trajet
    const handleProposeTrajet = () => {
        if (!currentUser) {
            alert('Veuillez vous connecter pour proposer un trajet');
            navigate('/reserver');
            return;
        }
        
        navigate('/reserver');
    };

    // Rafraîchir les offres
    const handleRefresh = () => {
        loadOffres();
    };

    // Formater la date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
        });
    };

    return (
        <div className="acceuil-container">
            {/* Header Moderne */}
            <header className="acceuil-header">
                <div className="header-main">
                    <div className="container-full">
                        <div className="header-main-content">
                            <div className="logo" onClick={() => navigate('/')}>
                                <div className="logo-text">
                                    <span className="logo-main">WAIZ</span>
                                </div>
                            </div>
                            
                            <nav className="main-nav">
                                <ul>
                                    <li><a href="/">Accueil</a></li>
                                    <li><a href="#comment-ca-marche">Comment ça marche ?</a></li>
                                    <li><a href="#offres">Trajets</a></li>
                                    <li><a href="#footer">Contact</a></li>
                                </ul>
                            </nav>
                            
                            <div className="header-actions">
                                {!currentUser ? (
                                    <>
                                        <button className="btn-login" onClick={() => navigate('/login')}>
                                            <FaUser /> Connexion
                                        </button>
                                        <button className="btn-signup" onClick={() => navigate('/inscription')}>
                                            S'inscrire
                                        </button>
                                    </>
                                ) : (
                                    <button className="btn-login" onClick={() => navigate('/dashboard')}>
                                        <FaUser /> {currentUser.Nom || 'Mon compte'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section avec Description et Image */}
            <section id="hero" className="hero-section">
                <div className="container-full">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h1 className="hero-title">
                                Voyagez malin, <span className="highlight">économisez plus</span>
                            </h1>
                            <p className="hero-subtitle">
                                Rejoignez la communauté WAIZ et découvrez le covoiturage qui change vos trajets en aventures pleine d'assurances et aussi avec une faciliter d'utilisation.
                            </p>
                            {/* <div className="hero-stats">
                                {/* <div className="stat">
                                    <h3>50K+</h3>
                                    <p>Utilisateurs</p>
                                </div>
                                <div className="stat">
                                    <h3>200K+</h3>
                                    <p>Trajets complétés</p>
                                </div>
                                <div className="stat">
                                    <h3>€15M+</h3>
                                    <p>Économisé</p>
                                </div> */}
                            {/* </div> */}
                            <div className="hero-buttons">
                                <button className="btn-cta-primary" onClick={() => navigate('/inscription')}>
                                    Rejoindre maintenant
                                </button>
                                {/* <button className="btn-cta-secondary" onClick={() => navigate('#comment-ca-marche')}>
                                    <FaArrowRight /> Comment ça marche
                                </button> */}
                            </div>
                        </div>
                        
                        <div className="hero-image">
                            <img 
                                src="/cov1.jpg" 
                                alt="Équipe WAIZ" 
                                className="company-image"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Section Comment ça marche */}
            <section id="comment-ca-marche" className="how-it-works">
                <div className="container">
                    <h2 className="section-title">Comment ça marche ?</h2>
                    <p className="explanation-intro">
                        Simple, économique et convivial !
                    </p>
                    
                    <div className="steps-grid">
                        {etapesReservation.map(etape => (
                            <div key={etape.id} className="step-card">
                                <div className="step-number">
                                    {etape.id}
                                </div>
                                <h3>{etape.title}</h3>
                                <p>{etape.subtitle}</p>
                            </div>
                        ))}
                    </div>
                    
                    <div className="how-it-works-description">
                        <p>
                            Le covoiturage, c'est la solution idéale pour vos déplacements. Que vous soyez conducteur 
                            ou passager, vous faites des économies tout en rencontrant de nouvelles personnes.
                        </p>
                        <p>
                            <strong>Conducteur :</strong> remplissez vos places libres et partagez vos frais de route.<br />
                            <strong>Passager :</strong> voyagez à petit prix et sans les contraintes des transports en commun.
                        </p>
                    </div>
                </div>
            </section>

            {/* Avantages pour les CHAUFFEURS */}
            <section className="benefits-section benefits-drivers">
                <div className="container">
                    <div className="benefits-header">
                        <h2>Gagnez en conduisant</h2>
                        <p className="benefits-subtitle">Convertissez vos trajets en revenus supplémentaires</p>
                    </div>
                    
                    <div className="benefits-grid">
                        <div className="benefit-card">
                            <FaMoneyBillWave className="benefit-icon" />
                            <h3>Revenus garantis</h3>
                            <p>Partagez vos frais et gagnez entre 100€ à 500€ par mois</p>
                        </div>
                        <div className="benefit-card">
                            <FaShieldAlt className="benefit-icon" />
                            <h3>Paiement sécurisé</h3>
                            <p>Recevez vos gains directement sur votre compte bancaire</p>
                        </div>
                        <div className="benefit-card">
                            <FaUsers className="benefit-icon" />
                            <h3>Clients vérifiés</h3>
                            <p>Accueil de passagers fiables et respectueux</p>
                        </div>
                        <div className="benefit-card">
                            <FaClock className="benefit-icon" />
                            <h3>Flexibilité totale</h3>
                            <p>Partagez vos trajets quand vous le souhaitez</p>
                        </div>
                        <div className="benefit-card">
                            <FaHeart className="benefit-icon" />
                            <h3>Communauté chaleureuse</h3>
                            <p>Rencontrez des personnes sympathiques et intéressantes</p>
                        </div>
                        <div className="benefit-card">
                            <FaGlobe className="benefit-icon" />
                            <h3>Couverture étendue</h3>
                            <p>Proposez des trajets dans toute la France</p>
                        </div>
                    </div>
                    
                    <button className="btn-primary" onClick={() => navigate('/reserver')}>
                        Proposer votre premier trajet
                    </button>
                </div>
            </section>

            {/* Avantages pour les CLIENTS */}
            <section className="benefits-section benefits-passengers">
                <div className="container">
                    <div className="benefits-header">
                        <h2>Voyagez à moindre coût</h2>
                        <p className="benefits-subtitle">Découvrez le confort et l'économie du covoiturage</p>
                    </div>
                    
                    <div className="benefits-grid">
                        <div className="benefit-card">
                            <FaMoneyBillWave className="benefit-icon" />
                            <h3>Économies garanties</h3>
                            <p>Économisez jusqu'à 70% sur vos trajets habituels</p>
                        </div>
                        <div className="benefit-card">
                            <FaSmile className="benefit-icon" />
                            <h3>Rencontres enrichissantes</h3>
                            <p>Partagez vos trajets avec des personnes intéressantes</p>
                        </div>
                        <div className="benefit-card">
                            <FaShieldAlt className="benefit-icon" />
                            <h3>Voyages sécurisés</h3>
                            <p>Profils vérifiés et assistance 24h/24</p>
                        </div>
                        <div className="benefit-card">
                            <FaClock className="benefit-icon" />
                            <h3>Gain de temps</h3>
                            <p>Utilisez voies réservées et gagnez du temps en voiture</p>
                        </div>
                        <div className="benefit-card">
                            <FaMapMarkedAlt className="benefit-icon" />
                            <h3>Flexibilité maximale</h3>
                            <p>Larges choix d'horaires et d'itinéraires disponibles</p>
                        </div>
                        <div className="benefit-card">
                            <FaGlobe className="benefit-icon" />
                            <h3>Responsabilité sociale</h3>
                            <p>Réduisez votre empreinte carbone en covoiturant</p>
                        </div>
                    </div>
                    
                    <button className="btn-primary" onClick={() => navigate('/inscription')}>
                        Commencer à économiser
                    </button>
                </div>
            </section>

            <section id="offres" className="offres-section">
            <div className="container">
                <h2 className="section-title">Trajets disponibles en ce moment</h2>
                
                {initialLoading ? (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement des trajets...</p>
                </div>
                ) : filteredOffres.length > 0 ? (
                <>
                    <div className="offres-grid">
                    {filteredOffres.slice(0, 9).map(offre => (
                        <div key={offre.id} className="offre-card">
                        <div className="offre-image">
                            <img src={offre.voiture.image} alt={offre.voiture.modele} />
                            {offre.places_dispo <= 2 && (
                            <span className="places-badge">
                                Plus que {offre.places_dispo} place{offre.places_dispo > 1 ? 's' : ''} !
                            </span>
                            )}
                        </div>
                        
                        <div className="offre-header">
                            <div className="chauffeur-info">
                            <div>
                                <h4> Chauffeur : {offre.chauffeur.nom}</h4>
                            </div>
                            </div>
                        </div>
                        
                        <div className="trajet-info">
                            <div className="trajet-point">
                            <FaCircle className="depart-point" />
                            <div>
                                <p className="heure">{offre.depart.heure}</p>
                                <p className="adresse">{offre.depart.ville}</p>
                                <p className="zone">{offre.depart.lieu}</p>
                            </div>
                            </div>
                            
                            <div className="trajet-ligne">
                            </div>
                            
                            <div className="trajet-point">
                            <FaMapMarkerAlt className="arrivee-point" />
                            <div>
                                <p className="heure">{offre.arrivee.heure}</p>
                                <p className="adresse">{offre.arrivee.ville}</p>
                                <p className="zone">{offre.arrivee.lieu}</p>
                            </div>
                            </div>
                            
                            <div className="trajet-date">
                            <FaCalendarAlt />
                            <span>Départ {formatDate(offre.date_depart)}</span>
                            </div>
                        </div>
                        
                        <div className="offre-footer">
                            <div className="places-dispo">
                            <FaUsers />
                            <span>{offre.places_dispo} place{offre.places_dispo > 1 ? 's' : ''}</span>
                            </div>
                            <div className="prix">
                            <span className="montant">{offre.prix_par_personne}AR</span>
                            <span className="par-personne">/pers.</span>
                            </div>
                        </div>
                        
                        <button 
                            className="btn-reserver"
                            onClick={() => openReservationModal(offre)}
                            disabled={!currentUser || currentUser.role === 'chauffeur'}
                        >
                            {!currentUser ? 'Connectez-vous pour réserver' : 
                            currentUser.role === 'chauffeur' ? 'Les chauffeurs ne peuvent pas réserver' : 
                            'Réserver'}
                        </button>
                        </div>
                    ))}
                    </div>
                    
                    {/* Bouton "Voir tous les trajets" (vers /reserver) pour 7 à 9 offres */}
                    {filteredOffres.length > 6 && filteredOffres.length <= 9 && (
                    <div className="voir-plus-container">
                        <button className="btn-voir-plus" onClick={() => navigate('/reserver')}>
                        <FaArrowRight /> Voir tous les trajets
                        </button>
                    </div>
                    )}
                    
                    {/* Bouton "Voir plus" (vers Login) si plus de 9 offres */}
                    {filteredOffres.length > 9 && (
                    <div className="voir-plus-container">
                        <button className="btn-voir-plus" onClick={() => navigate('/login')}>
                        <FaArrowRight /> Voir plus
                        </button>
                    </div>
                    )}
                </>
                ) : (
                <div className="no-results">
                    <FaSearch className="no-results-icon" />
                    <h3>Aucun trajet trouvé</h3>
                    <p>Essayez de modifier vos critères de recherche</p>
                    <div className="no-results-actions">
                    <button className="btn-primary" onClick={() => {
                        setSearchData({
                        depart: '',
                        arrivee: '',
                        date_depart: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                        date_retour: new Date(Date.now() + 7*86400000).toISOString().split('T')[0],
                        passagers: 1,
                        aller_retour: false
                        });
                        setFilteredOffres(offres);
                    }}>
                        Réinitialiser la recherche
                    </button>
                    <button className="btn-secondary" onClick={handleProposeTrajet}>
                        Proposer un trajet
                    </button>
                    </div>
                </div>
                )}
            </div>
            </section>

            {/* Section Features */}
            <section className="features-highlight" id="securite">
                <div className="container">
                    <div className="features-grid">
                        <div className="feature-item">
                            <FaShieldAlt className="feature-icon" />
                            <h4>Paiement 100% sécurisé</h4>
                        </div>
                        <div className="feature-item">
                            <FaHeadset className="feature-icon" />
                            <h4>Assistance 7j/7</h4>
                        </div>
                        <div className="feature-item">
                            <FaStar className="feature-icon" />
                            <h4>Profils vérifiés</h4>
                        </div>
                        <div className="feature-item">
                            <FaHeart className="feature-icon" />
                            <h4>Garantie satisfait</h4>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section App mobile */}
            <section className="quick-reservation">
                <div className="container">
                    <div className="quick-reservation-card">
                        <div className="qr-content">
                            <h3>Téléchargez l'application</h3>
                            <p>Réservez vos trajets partout, tout le temps !</p>
                            <div className="app-buttons">
                                <button 
                                    className="btn-app"
                                    onClick={() => window.open('https://apps.apple.com/fr/app/waiz', '_blank')}
                                >
                                    <FaApple /> App Store
                                </button>
                                <button 
                                    className="btn-app"
                                    onClick={() => window.open('https://play.google.com/store/apps/details?id=com.waiz.app', '_blank')}
                                >
                                    <FaAndroid /> Google Play
                                </button>
                            </div>
                        </div>
                        <div className="qr-image">
                            <img 
                                src="https://img.freepik.com/free-vector/mobile-application-concept-illustration_114360-207.jpg" 
                                alt="Application mobile"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-section">
                            <h4 id='footer'>Service Client</h4>
                            <ul>
                                <li><FaPhone /> <a href="tel:+33123456789">034 44 544 40</a></li>
                                <li><FaEnvelope /> <a href="mailto:contact@waiz.fr">eprest.solutions@gmail.com</a></li>
                                <li><FaQuestionCircle /> <a href="#faq">FAQ - Questions fréquentes</a></li>
                                <li><FaHeadset /> <a href="#aide">Centre d'aide</a></li>
                            </ul>
                        </div>
                        
                        <div className="footer-section">
                            <h4>Découvrir</h4>
                            <ul>
                                <li><FaCar /> <a href="#comment-ca-marche">Comment ça marche</a></li>
                                <li><FaShieldAlt /> <a href="#securite">Sécurité</a></li>
                                <li><FaUsers /> <a href="#avis">La communauté</a></li>
                                <li><FaHeart /> <a href="#blog">Blog</a></li>
                            </ul>
                        </div>
                        
                        <div className="footer-section">
                            <h4>Informations légales</h4>
                            <ul>
                                <li><FaFileAlt /> <a href="#cgu">Conditions générales</a></li>
                                <li><FaFileAlt /> <a href="#privacy">Politique de confidentialité</a></li>
                                <li><FaFileAlt /> <a href="#cookies">Gestion des cookies</a></li>
                                <li><FaShieldAlt /> <a href="#mentions">Mentions légales</a></li>
                            </ul>
                        </div>
                        
                        <div className="footer-section">
                            <h4>Suivez-nous</h4>
                            <div className="social-links">
                               <a href="https://www.facebook.com/entreprisePage" target="_blank" rel="noopener noreferrer">
                                    <FaFacebook />
                                </a>
                                <a href="https://twitter.com/entrepriseCompte" target="_blank" rel="noopener noreferrer">
                                    <FaTwitter />
                                </a>
                                <a href="https://www.instagram.com/entrepriseCompte" target="_blank" rel="noopener noreferrer">
                                    <FaInstagram />
                                </a>
                                <a href="https://www.linkedin.com/company/entrepriseSociete" target="_blank" rel="noopener noreferrer">
                                    <FaLinkedin />
                                </a>
                                <a href="https://www.youtube.com/c/entrepriseChaine" target="_blank" rel="noopener noreferrer">
                                    <FaYoutube />
                                </a>
                            </div>
                            <div className="footer-note">
                                <p>© WAIZ 2026 - Tous droits réservés</p>
                                <p className="eco-note">
                                    Covoiturer, c'est réduire son empreinte carbone
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Modal de réservation */}
            {showModal && selectedOffre && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Confirmer votre réservation</h3>
                            <button className="close-modal" onClick={closeModal}>
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="modal-offre-details">
                                <div className="modal-chauffeur">
                                    <img 
                                        src={selectedOffre.chauffeur.photo}
                                        alt={selectedOffre.chauffeur.nom}
                                        onError={(e) => {
                                            e.target.src = `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/1.jpg`;
                                        }}
                                    />
                                    <div>
                                        <h4>{selectedOffre.chauffeur.nom}</h4>
                                        <div className="note">
                                            <FaStar className="star-icon" />
                                            <span>{selectedOffre.chauffeur.note} • {selectedOffre.chauffeur.trajets} trajets</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="modal-trajet">
                                    <div className="modal-point">
                                        <FaCircle className="depart-point" />
                                        <div>
                                            <p className="heure">{selectedOffre.depart.heure}</p>
                                            <p className="adresse">{selectedOffre.depart.ville} - {selectedOffre.depart.lieu}</p>
                                        </div>
                                    </div>
                                    <div className="modal-point">
                                        <FaMapMarkerAlt className="arrivee-point" />
                                        <div>
                                            <p className="heure">{selectedOffre.arrivee.heure}</p>
                                            <p className="adresse">{selectedOffre.arrivee.ville} - {selectedOffre.arrivee.lieu}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="modal-dates">
                                    <div className="date-item">
                                        <FaClockRegular />
                                        <span>Réservation le: {new Date(reservationData.date_reservation).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                    <div className="date-item">
                                        <FaCalendarAlt />
                                        <span>Départ le: {formatDate(reservationData.date_depart)}</span>
                                    </div>
                                    {reservationData.aller_retour && (
                                        <div className="date-item">
                                            <FaCalendarAlt />
                                            <span>Retour le: {new Date(reservationData.date_retour).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="modal-prix">
                                    <div className="prix-detail">
                                        <span>Prix par personne</span>
                                        <span>{selectedOffre.prix_par_personne}€</span>
                                    </div>
                                    <div className="prix-detail">
                                        <span>Nombre de passagers</span>
                                        <span>{reservationData.nbr_passager}</span>
                                    </div>
                                    <div className="prix-total">
                                        <span>Total</span>
                                        <span>{selectedOffre.prix_par_personne * reservationData.nbr_passager}€</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeModal}>
                                Annuler
                            </button>
                            <button 
                                className="btn-primary" 
                                onClick={confirmReservation}
                                disabled={loading}
                            >
                                {loading ? 'Réservation...' : 'Confirmer la réservation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de succès */}
            {showSuccessModal && (
                <div className="modal success-modal-acceuil">
                    <div className="modal-content success-content-acceuil">
                        <FaCheckCircle className="success-icon-acceuil" />
                        <h2>Réservation confirmée !</h2>
                        <p>Votre place a été réservée avec succès.</p>
                        <div className="success-details-acceuil">
                            <p><strong>Trajet :</strong> {selectedOffre?.depart.ville} → {selectedOffre?.arrivee.ville}</p>
                            <p><strong>Date :</strong> {formatDate(reservationData.date_depart)}</p>
                            <p><strong>Passagers :</strong> {reservationData.nbr_passager}</p>
                            <p><strong>Prix total :</strong> {reservationData.prix_total}€</p>
                        </div>
                        <p className="redirect-message">Redirection vers vos réservations...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Acceuil;