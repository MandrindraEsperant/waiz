import React, { useState, useEffect } from 'react';
import { 
    FaSearch, FaMapMarkerAlt, FaCalendarCheck, FaCheckCircle,
    FaUser, FaCar, FaClock, FaArrowRight, FaArrowLeft,
    FaCheck, FaStar, FaPhone, FaEnvelope, FaFacebook,
    FaTwitter, FaInstagram, FaLinkedin, FaYoutube, FaArrowDown,
    FaArrowUp, FaInfoCircle, FaBars, FaTimes
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './etape.css';

function Etape() {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(1);
    const [autoPlay, setAutoPlay] = useState(true);
    const [animationDirection, setAnimationDirection] = useState('down');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Données de démonstration pour l'animation
    const chauffeursDemo = [
        {
            id: 1,
            nom: "Thomas Dubois",
            note: 4.8,
            trajets: 156,
            voiture: "Renault Megane",
            photo: "https://randomuser.me/api/portraits/men/32.jpg",
            prix: "25€",
            depart: "Paris",
            arrivee: "Lyon",
            heure: "08:00"
        },
        {
            id: 2,
            nom: "Marie Lambert",
            note: 4.9,
            trajets: 203,
            voiture: "Peugeot 308",
            photo: "https://randomuser.me/api/portraits/women/44.jpg",
            prix: "22€",
            depart: "Paris",
            arrivee: "Lyon",
            heure: "09:30"
        },
        {
            id: 3,
            nom: "Sophie Martin",
            note: 4.7,
            trajets: 89,
            voiture: "Citroën C4",
            photo: "https://randomuser.me/api/portraits/women/68.jpg",
            prix: "20€",
            depart: "Paris",
            arrivee: "Lyon",
            heure: "10:15"
        }
    ];

    const etapes = [
        {
            id: 1,
            titre: "Choisissez votre chauffeur",
            description: "Parcourez les profils des conducteurs disponibles, leurs notes, avis et préférences de voyage.",
            icon: <FaUser />,
            couleur: "#4361ee",
            sousTitre: "Sélectionnez le conducteur idéal"
        },
        {
            id: 2,
            titre: "Sélectionnez vos lieux",
            description: "Indiquez vos points de départ et d'arrivée précis pour un trajet sur mesure.",
            icon: <FaMapMarkerAlt />,
            couleur: "#f72585",
            sousTitre: "Départ et arrivée"
        },
        {
            id: 3,
            titre: "Choisissez vos dates",
            description: "Sélectionnez la date et l'heure qui vous conviennent le mieux pour votre voyage.",
            icon: <FaCalendarCheck />,
            couleur: "#4cc9f0",
            sousTitre: "Date et heure"
        },
        {
            id: 4,
            titre: "Confirmez votre réservation",
            description: "Vérifiez tous les détails et confirmez votre réservation en toute simplicité.",
            icon: <FaCheckCircle />,
            couleur: "#4CAF50",
            sousTitre: "Vérification finale"
        }
    ];

    // Animation verticale : descend jusqu'à l'étape 4 puis remonte à l'étape 1
    useEffect(() => {
        let interval;
        if (autoPlay) {
            interval = setInterval(() => {
                setActiveStep((prev) => {
                    if (animationDirection === 'down') {
                        if (prev >= 4) {
                            setAnimationDirection('up');
                            return 3;
                        }
                        return prev + 1;
                    } else {
                        if (prev <= 1) {
                            setAnimationDirection('down');
                            return 2;
                        }
                        return prev - 1;
                    }
                });
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [autoPlay, animationDirection]);

    const handleStepClick = (step) => {
        setActiveStep(step);
        setAutoPlay(false);
        if (step > activeStep) {
            setAnimationDirection('down');
        } else if (step < activeStep) {
            setAnimationDirection('up');
        }
        setMobileMenuOpen(false);
    };

    const handleNext = () => {
        if (activeStep < 4) {
            setActiveStep(activeStep + 1);
            setAnimationDirection('down');
        }
        setAutoPlay(false);
    };

    const handlePrev = () => {
        if (activeStep > 1) {
            setActiveStep(activeStep - 1);
            setAnimationDirection('up');
        }
        setAutoPlay(false);
    };

    const handleReplay = () => {
        setActiveStep(1);
        setAnimationDirection('down');
        setAutoPlay(true);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <div className="etape-container">
            {/* Header avec les liens */}
            <header className="etape-header">
                <div className="container">
                    <div className="header-content">
                        <div className="logo" onClick={() => navigate('/')}>
                            <FaCar className="logo-icon" />
                            <div className="logo-text">
                                <span className="logo-main">COVOIT'</span>
                                <span className="logo-sub">Roulez Malin</span>
                            </div>
                        </div>
                        
                        <nav className="main-nav">
                            <ul>
                                <li><a href="/">Accueil</a></li>
                                <li><a href="/etape" className="active">Comment ça marche</a></li>
                                <li><a href="/reserver">Reserver un trajet</a></li>
                                <li><a href="/aide">Aide</a></li>
                            </ul>
                        </nav>
                        
                        <div className="header-actions">
                            <button className="btn-login" onClick={() => navigate('/login')}>
                                Se connecter
                            </button>
                            <button className="btn-signup" onClick={() => navigate('/inscription')}>
                                S'inscrire
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Header mobile */}
            <header className="etape-header-mobile">
                <div className="etape-header-content">
                    <div className="etape-logo" onClick={() => navigate('/')}>
                        <FaCar className="etape-logo-icon" />
                        <span className="etape-logo-text">COVOIT'</span>
                    </div>
                    <button className="etape-mobile-menu-btn" onClick={toggleMobileMenu}>
                        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
            </header>

            {/* Overlay pour mobile */}
            {mobileMenuOpen && (
                <div className="etape-mobile-overlay" onClick={toggleMobileMenu}></div>
            )}

            {/* Sidebar gauche avec les étapes */}
            <aside className={`etape-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="etape-sidebar-header">
                    <div className="etape-sidebar-logo" onClick={() => navigate('/')}>
                        <FaCar className="etape-sidebar-logo-icon" />
                        <div className="etape-sidebar-logo-text">
                            <span className="etape-sidebar-logo-main">COVOIT'</span>
                            <span className="etape-sidebar-logo-sub">Roulez Malin</span>
                        </div>
                    </div>
                </div>

                <div className="etape-sidebar-progress">
                    <div className="etape-progress-vertical">
                        {etapes.map((etape, index) => (
                            <div 
                                key={etape.id}
                                className={`etape-progress-item ${activeStep === etape.id ? 'active' : ''} ${activeStep > etape.id ? 'completed' : ''}`}
                                onClick={() => handleStepClick(etape.id)}
                            >
                                <div className="etape-progress-marker">
                                    <div 
                                        className="etape-marker-icon"
                                        style={{ 
                                            backgroundColor: activeStep >= etape.id ? etape.couleur : '#e0e0e0',
                                            color: 'white'
                                        }}
                                    >
                                        {activeStep > etape.id ? <FaCheck /> : etape.icon}
                                    </div>
                                    {index < etapes.length - 1 && (
                                        <div className={`etape-marker-line ${activeStep > etape.id ? 'active' : ''}`}></div>
                                    )}
                                </div>
                                <div className="etape-progress-content">
                                    <span className="etape-progress-title">{etape.titre}</span>
                                    <span className="etape-progress-subtitle">{etape.sousTitre}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="etape-sidebar-footer">
                    <div className="etape-direction-info">
                        <div className={`etape-direction-badge ${animationDirection === 'down' ? 'active' : ''}`}>
                            <FaArrowDown /> Descente
                        </div>
                        <div className={`etape-direction-badge ${animationDirection === 'up' ? 'active' : ''}`}>
                            <FaArrowUp /> Montée
                        </div>
                    </div>
                </div>
            </aside>

            {/* Contenu principal */}
            <main className="etape-main-content">

                {/* Animation Section */}
                <section className="etape-animation-section">
                    <div className="etape-animation-container">

                        {/* Étape 1 - Choix du chauffeur */}
                        <div className={`etape-animation-content ${activeStep === 1 ? 'active' : ''}`}>
                            <h2 className="etape-step-title" style={{ color: etapes[0].couleur }}>
                                <span className="etape-step-number">1</span>
                                {etapes[0].titre}
                            </h2>
                            <p className="etape-step-description">{etapes[0].description}</p>
                            
                            <div className="etape-chauffeurs-demo">
                                {chauffeursDemo.map((chauffeur, index) => (
                                    <div 
                                        key={chauffeur.id}
                                        className={`etape-chauffeur-card ${index === 0 ? 'selected' : ''}`}
                                        style={{ animationDelay: `${index * 0.2}s` }}
                                    >
                                        <div className="etape-chauffeur-header">
                                            <img src={chauffeur.photo} alt={chauffeur.nom} />
                                            <div className="etape-chauffeur-info">
                                                <h4>{chauffeur.nom}</h4>
                                                <div className="etape-rating">
                                                    <FaStar className="etape-star" />
                                                    <span>{chauffeur.note} • {chauffeur.trajets} trajets</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="etape-chauffeur-details">
                                            <p><FaCar /> {chauffeur.voiture}</p>
                                            <p><FaClock /> {chauffeur.heure}</p>
                                            <p><FaMapMarkerAlt /> {chauffeur.depart} → {chauffeur.arrivee}</p>
                                        </div>
                                        <div className="etape-chauffeur-price">
                                            <span className="etape-price">{chauffeur.prix}</span>
                                            <span className="etape-per-person">/pers.</span>
                                        </div>
                                        <button className="etape-select-btn">
                                            Choisir
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="etape-demo-note">
                                <FaSearch className="etape-note-icon" />
                                <p>Parcourez les profils et choisissez le chauffeur qui vous correspond le mieux</p>
                            </div>
                        </div>

                        {/* Étape 2 - Choix des lieux */}
                        <div className={`etape-animation-content ${activeStep === 2 ? 'active' : ''}`}>
                            <h2 className="etape-step-title" style={{ color: etapes[1].couleur }}>
                                <span className="etape-step-number">2</span>
                                {etapes[1].titre}
                            </h2>
                            <p className="etape-step-description">{etapes[1].description}</p>
                            
                            <div className="etape-lieux-demo">
                                <div className="etape-map-container">
                                    <div className="etape-map-placeholder">
                                        <div className="etape-map-point depart-point">
                                            <FaMapMarkerAlt />
                                            <span>Départ</span>
                                        </div>
                                        <div className="etape-route-line"></div>
                                        <div className="etape-map-point arrivee-point">
                                            <FaMapMarkerAlt />
                                            <span>Arrivée</span>
                                        </div>
                                        
                                        <div className="etape-pulse-point point-1"></div>
                                        <div className="etape-pulse-point point-2"></div>
                                        <div className="etape-pulse-point point-3"></div>
                                    </div>
                                </div>
                                
                                <div className="etape-lieux-form">
                                    <div className="etape-form-group depart-group">
                                        <label><FaMapMarkerAlt style={{ color: '#4CAF50' }} /> Point de départ</label>
                                        <div className="etape-input-suggestion">
                                            <input 
                                                type="text" 
                                                placeholder="Ex: Gare de Lyon, Paris" 
                                                value="Gare de Lyon, Paris"
                                                readOnly
                                            />
                                            <span className="etape-suggestion-badge">Centre</span>
                                        </div>
                                    </div>
                                    
                                    <div className="etape-form-group arrivee-group">
                                        <label><FaMapMarkerAlt style={{ color: '#f72585' }} /> Point d'arrivée</label>
                                        <div className="etape-input-suggestion">
                                            <input 
                                                type="text" 
                                                placeholder="Ex: Part-Dieu, Lyon" 
                                                value="Part-Dieu, Lyon"
                                                readOnly
                                            />
                                            <span className="etape-suggestion-badge">Centre</span>
                                        </div>
                                    </div>
                                    
                                    <div className="etape-map-preview">
                                        <div className="etape-trajet-summary">
                                            <span className="etape-ville">Paris</span>
                                            <FaArrowRight className="etape-arrow" />
                                            <span className="etape-ville">Lyon</span>
                                            <span className="etape-distance">~465 km</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="etape-demo-note">
                                <FaMapMarkerAlt className="etape-note-icon" />
                                <p>Précisez vos lieux de rendez-vous pour un trajet sans stress</p>
                            </div>
                        </div>

                        {/* Étape 3 - Choix des dates */}
                        <div className={`etape-animation-content ${activeStep === 3 ? 'active' : ''}`}>
                            <h2 className="etape-step-title" style={{ color: etapes[2].couleur }}>
                                <span className="etape-step-number">3</span>
                                {etapes[2].titre}
                            </h2>
                            <p className="etape-step-description">{etapes[2].description}</p>
                            
                            <div className="etape-dates-demo">
                                <div className="etape-calendar-preview">
                                    <div className="etape-calendar-header">
                                        <button className="etape-month-nav"><FaArrowLeft /></button>
                                        <h3>Mars 2024</h3>
                                        <button className="etape-month-nav"><FaArrowRight /></button>
                                    </div>
                                    
                                    <div className="etape-calendar-weekdays">
                                        <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                                    </div>
                                    
                                    <div className="etape-calendar-days">
                                        {[...Array(31)].map((_, i) => {
                                            const day = i + 1;
                                            let className = '';
                                            if (day === 15) className = 'selected';
                                            if (day === 22) className = 'selected retour';
                                            if (day < 15) className = 'past';
                                            return (
                                                <div key={i} className={`etape-calendar-day ${className}`}>
                                                    {day}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="etape-calendar-legend">
                                        <div className="etape-legend-item">
                                            <span className="etape-dot aller"></span>
                                            <span>Aller (15 mars)</span>
                                        </div>
                                        <div className="etape-legend-item">
                                            <span className="etape-dot retour"></span>
                                            <span>Retour (22 mars)</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="etape-time-selection">
                                    <h4>Horaires disponibles</h4>
                                    <div className="etape-time-slots">
                                        <button className="etape-time-slot active">08:00</button>
                                        <button className="etape-time-slot">09:30</button>
                                        <button className="etape-time-slot">11:00</button>
                                        <button className="etape-time-slot">14:30</button>
                                        <button className="etape-time-slot">16:00</button>
                                        <button className="etape-time-slot">18:30</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="etape-demo-note">
                                <FaCalendarCheck className="etape-note-icon" />
                                <p>Choisissez la date et l'heure qui s'adaptent à votre emploi du temps</p>
                            </div>
                        </div>

                        {/* Étape 4 - Confirmation */}
                        <div className={`etape-animation-content ${activeStep === 4 ? 'active' : ''}`}>
                            <h2 className="etape-step-title" style={{ color: etapes[3].couleur }}>
                                <span className="etape-step-number">4</span>
                                {etapes[3].titre}
                            </h2>
                            <p className="etape-step-description">{etapes[3].description}</p>
                            
                            <div className="etape-confirmation-demo">
                                <div className="etape-recap-card">
                                    <div className="etape-recap-header">
                                        <FaCheckCircle className="etape-success-icon" />
                                        <h3>Récapitulatif de votre réservation</h3>
                                    </div>
                                    
                                    <div className="etape-recap-content">
                                        <div className="etape-recap-section">
                                            <h4>Chauffeur</h4>
                                            <div className="etape-recap-chauffeur">
                                                <img src={chauffeursDemo[0].photo} alt="Chauffeur" />
                                                <div>
                                                    <strong>{chauffeursDemo[0].nom}</strong>
                                                    <div className="etape-rating">
                                                        <FaStar className="etape-star" />
                                                        <span>{chauffeursDemo[0].note}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="etape-recap-section">
                                            <h4>Trajet</h4>
                                            <div className="etape-recap-trajet">
                                                <div className="etape-trajet-point">
                                                    <div className="etape-point-dot depart"></div>
                                                    <div>
                                                        <span className="etape-point-label">Départ</span>
                                                        <span className="etape-point-value">Gare de Lyon, Paris</span>
                                                        <span className="etape-point-time">15 mars 2024 • 08:00</span>
                                                    </div>
                                                </div>
                                                <div className="etape-trajet-point">
                                                    <div className="etape-point-dot arrivee"></div>
                                                    <div>
                                                        <span className="etape-point-label">Arrivée</span>
                                                        <span className="etape-point-value">Part-Dieu, Lyon</span>
                                                        <span className="etape-point-time">15 mars 2024 • 12:30</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="etape-recap-section">
                                            <h4>Détails</h4>
                                            <div className="etape-recap-details">
                                                <div className="etape-detail-row">
                                                    <span>Passagers</span>
                                                    <strong>2 personnes</strong>
                                                </div>
                                                <div className="etape-detail-row">
                                                    <span>Bagages</span>
                                                    <strong>2 sacs</strong>
                                                </div>
                                                <div className="etape-detail-row total">
                                                    <span>Total</span>
                                                    <strong className="etape-total-price">50€</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button className="etape-confirm-btn">
                                        <FaCheckCircle /> Confirmer la réservation
                                    </button>
                                </div>
                                
                                <div className="etape-success-animation">
                                    <div className="etape-checkmark-circle">
                                        <div className="etape-checkmark"></div>
                                    </div>
                                    <p className="etape-success-message">Réservation effectuée avec succès !</p>
                                </div>
                            </div>
                            
                            <div className="etape-demo-note">
                                <FaCheckCircle className="etape-note-icon" />
                                <p>Vérifiez tous les détails et confirmez en un clic</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="etape-navigation-controls">
                        <button 
                            className="etape-control-btn prev"
                            onClick={handlePrev}
                        >
                            <FaArrowLeft /> Précédent
                        </button>
                        
                        <div className="etape-step-indicators">
                            {[1, 2, 3, 4].map(step => (
                                <button
                                    key={step}
                                    className={`etape-step-dot ${activeStep === step ? 'active' : ''}`}
                                    onClick={() => handleStepClick(step)}
                                />
                            ))}
                        </div>
                        
                        <button 
                            className="etape-control-btn next"
                            onClick={handleNext}
                        >
                            Suivant <FaArrowRight />
                        </button>
                    </div>
                    
                    {/* Indicateur d'auto-play */}
                    <div className="etape-auto-play-indicator">
                        <span className={`etape-auto-play-dot ${autoPlay ? 'active' : ''}`}></span>
                        <span>Animation verticale : descente (1→4) puis remontée (4→1)</span>
                        <button 
                            className="etape-replay-btn"
                            onClick={handleReplay}
                        >
                            <FaArrowUp /> <FaArrowDown /> Reprendre
                        </button>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="cmc-cta">
                    <div className="container">
                        <div className="cta-card">
                            <h2>Prêt à réserver votre premier trajet ?</h2>
                            <p>Rejoignez des milliers de voyageurs satisfaits</p>
                            <div className="cta-buttons">
                                <button className="btn-primary" onClick={() => navigate('/recherche')}>
                                    Rechercher un trajet
                                </button>
                                <button className="btn-secondary" onClick={() => navigate('/inscription')}>
                                    Créer un compte
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="footer">
                    <div className="container">
                        <div className="footer-grid">
                            <div className="footer-section">
                                <h4>À propos</h4>
                                <ul>
                                    <li><a href="/qui-sommes-nous">Qui sommes-nous ?</a></li>
                                    <li><a href="/emploi">Emploi</a></li>
                                    <li><a href="/presse">Presse</a></li>
                                    <li><a href="/blog">Blog</a></li>
                                </ul>
                            </div>
                            
                            <div className="footer-section">
                                <h4>Service client</h4>
                                <ul>
                                    <li><FaPhone /> <a href="tel:+33123456789">01 23 45 67 89</a></li>
                                    <li><FaEnvelope /> <a href="mailto:contact@covoit.fr">contact@covoit.fr</a></li>
                                    <li><a href="/faq">FAQ</a></li>
                                    <li><a href="/aide">Centre d'aide</a></li>
                                </ul>
                            </div>
                            
                            <div className="footer-section">
                                <h4>Légal</h4>
                                <ul>
                                    <li><a href="/cgu">CGU</a></li>
                                    <li><a href="/confidentialite">Confidentialité</a></li>
                                    <li><a href="/cookies">Cookies</a></li>
                                    <li><a href="/mentions-legales">Mentions légales</a></li>
                                </ul>
                            </div>
                            
                            <div className="footer-section">
                                <h4>Suivez-nous</h4>
                                <div className="social-links">
                                    <a href="#"><FaFacebook /></a>
                                    <a href="#"><FaTwitter /></a>
                                    <a href="#"><FaInstagram /></a>
                                    <a href="#"><FaLinkedin /></a>
                                    <a href="#"><FaYoutube /></a>
                                </div>
                                <div className="app-buttons">
                                    <button className="app-btn">App Store</button>
                                    <button className="app-btn">Google Play</button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="footer-bottom">
                            <p>© 2026 Covoit' - Tous droits réservés</p>
                            <p className="eco-note">🌱 Covoiturer, c'est réduire son empreinte carbone</p>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}

export default Etape;