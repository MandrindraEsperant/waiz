import React, { useState, useRef, useEffect } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { graphqlRequest } from '../utils/graphqlClient';
import { encryptPassword } from '../utils/encryption';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCar, FaUser } from 'react-icons/fa';

// Import des traductions
import fr from '../locales/login/fr.json';
import en from '../locales/login/en.json';
import mg from '../locales/login/mg.json';

function Login() {
    const emailRef = useRef(null);
    const [email, setEmail] = useState('');
    const [mot_de_passe, setMot_de_passe] = useState('');
    const [userType, setUserType] = useState('chauffeur');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const { language } = useLanguage();
    const translations = { fr, en, mg };
    const t = translations[language];

    useEffect(() => {
        if (emailRef.current) emailRef.current.focus();
    }, []);

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !mot_de_passe) {
            setError(t.validation?.requiredFields || 'Veuillez remplir tous les champs.');
            setLoading(false);
            return;
        }

        if (!isValidEmail(email)) {
            setError(t.validation?.invalidEmail || 'Veuillez entrer une adresse email valide.');
            setLoading(false);
            return;
        }

        try {
            const query = `
                query Signin($input: SigninInput!) {
                    signin(input: $input) {
                        user {
                            id
                            name
                            firstName
                            email
                            phone
                            role
                        }
                        token
                    }
                }
            `;

            const variables = {
                input: {
                    email,
                    password: encryptPassword(mot_de_passe)
                }
            };

            const data = await graphqlRequest(query, variables);
            const signinData = data?.signin;

            if (!signinData?.token || !signinData?.user) {
                throw new Error(t.errors?.loginFailed || 'Échec de la connexion');
            }

            const returnedUser = signinData.user;
            const actualType = returnedUser.role === 'DRIVER' ? 'chauffeur' : 'passager';
            const userData = {
                id: returnedUser.id,
                nom: returnedUser.name,
                firstName: returnedUser.firstName,
                email: returnedUser.email,
                telephone: returnedUser.phone,
                role: returnedUser.role,
                type: actualType
            };

            login(signinData.token, userData);
            navigate(actualType === 'chauffeur' ? '/dashboard' : '/reserver');
        } catch (err) {
            console.error('Erreur de connexion:', err);
            
            if (err.code === 'ECONNABORTED') {
                setError(t.errors?.timeout || 'La connexion a expiré.');
            } else if (err.response) {
                setError(err.response.data.message || t.errors?.serverError || 'Erreur du serveur');
            } else if (err.request) {
                setError(t.errors?.networkError || 'Impossible de se connecter au serveur.');
            } else {
                setError(err.message || t.errors?.unexpectedError || 'Une erreur inattendue est survenue.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-bg-decorations">
                <div className="login-blob blob-1"></div>
                <div className="login-blob blob-2"></div>
                <div className="login-blob blob-3"></div>
            </div>

            <div className="login-main-layout">
                <section className="login-brand-panel">
                    <div className="brand-logo-container">
                        <div className="brand-logo-glow"></div>
                        <span className="brand-logo-text">WAIZ</span>
                    </div>

                    <div className="brand-pitch">
                        <h1 className="pitch-title">{t.header?.title || 'Pilotez votre service de covoiturage'}</h1>
                        <p className="pitch-subtitle">{t.header?.subtitle || 'Accédez à toutes les fonctionnalités backend depuis une interface moderne, claire et responsive.'}</p>
                    </div>

                    <div className="brand-stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">🚀</div>
                            <div className="stat-info">
                                <span className="stat-value">Interface premium</span>
                                <span className="stat-label">Rapide, fluide et intuitive</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🔐</div>
                            <div className="stat-info">
                                <span className="stat-value">Authentification sécurisée</span>
                                <span className="stat-label">Connexion chauffeur ou passager</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📱</div>
                            <div className="stat-info">
                                <span className="stat-value">Responsive</span>
                                <span className="stat-label">Optimisé pour mobile et tablette</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="login-form-panel">
                    <div className="login-card-wrapper">
                        <div className="login-form-header">
                            <h2>{t.header?.title || 'Connexion'}</h2>
                            <p>{t.header?.subtitle || 'Entrez vos identifiants pour continuer.'}</p>
                        </div>

                        <div className="login-user-type-selector">
                            <button
                                type="button"
                                className={`user-type-option ${userType === 'chauffeur' ? 'active' : ''}`}
                                onClick={() => setUserType('chauffeur')}
                            >
                                <FaCar className="user-type-icon" />
                                <span className="user-type-label">{t.userType?.chauffeur || 'Chauffeur'}</span>
                            </button>
                            <button
                                type="button"
                                className={`user-type-option ${userType === 'passager' ? 'active' : ''}`}
                                onClick={() => setUserType('passager')}
                            >
                                <FaUser className="user-type-icon" />
                                <span className="user-type-label">{t.userType?.passager || 'Passager'}</span>
                            </button>
                        </div>

                        <form className="login-page-form" onSubmit={handleSubmit}>
                            <div className="login-form-group">
                                <label className="login-form-label" htmlFor="login-email">{t.form?.emailLabel || 'Email'}</label>
                                <div className="login-input-wrapper">
                                    <FaEnvelope className="input-icon-left" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        className="login-form-input"
                                        placeholder={t.form?.emailPlaceholder || 'Entrez votre email'}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        required
                                        ref={emailRef}
                                    />
                                </div>
                            </div>

                            <div className="login-form-group">
                                <label className="login-form-label" htmlFor="login-password">{t.form?.passwordLabel || 'Mot de passe'}</label>
                                <div className="login-input-wrapper">
                                    <FaLock className="input-icon-left" />
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="login-form-input"
                                        placeholder={t.form?.passwordPlaceholder || 'Entrez votre mot de passe'}
                                        value={mot_de_passe}
                                        onChange={(e) => setMot_de_passe(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            {error && <div className="login-error-message">{error}</div>}

                            <div className="login-form-actions">
                                <button type="submit" className="login-page-button" disabled={loading}>
                                    {loading ? 'Connexion...' : (userType === 'chauffeur' ? (t.buttons?.loginChauffeur || 'Se connecter') : (t.buttons?.loginPassager || 'Se connecter'))}
                                </button>
                            </div>

                            <div className="login-page-links">
                                <Link to="/verification" className="login-forgot-password-link">
                                    {t.links?.forgotPassword || 'Mot de passe oublié ?'}
                                </Link>
                                <Link to="/inscription" className="login-register-link">
                                    {t.links?.register || 'S\'inscrire'}
                                </Link>
                            </div>
                        </form>
                    </div>
                </section>
            </div>

            <div className="login-page-footer">
                <p>WAIZ — Interface chauffeur & passager connectée au backend</p>
            </div>
        </div>
    );
}

export default Login;