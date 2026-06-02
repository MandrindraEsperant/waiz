import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FaEdit, FaTrash, FaUser, FaTimes, FaSearch, FaChevronDown, FaPhone } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './affichage.css';
import MenuApp from '../Menu';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchRides, extractUniqueClientsFromRides } from '../../services/waizApi';
import fr from '../../locales/client/fr.json';
import en from '../../locales/client/en.json';
import mg from '../../locales/client/mg.json';

// ─────────────────────────────────────────────
// Sous-composant : Toast
// ─────────────────────────────────────────────
const Toast = ({ message, isError, onClose }) => (
    <div className="success-popup-client">
        <div className="success-content-client">
            <span className="success-icon-client" style={{ fontSize: '20px' }}>
                {isError ? '❌' : '✅'}
            </span>
            <span style={{ marginLeft: '10px' }}>{message}</span>
            <button className="close-success-client" onClick={onClose}>×</button>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// Sous-composant : Modal d'appel (desktop)
// ─────────────────────────────────────────────
const CallOptionsModal = ({ phoneNumber, onCall, onCopy, onClose, t }) => (
    <div className="call-options-overlay">
        <div className="call-options-popup">
            <div className="call-options-header">
                <h3>{t.messages?.chooseApp || 'Choisir une application'}</h3>
                <button className="call-options-close" onClick={onClose}>
                    <FaTimes />
                </button>
            </div>
            <div className="call-options-content">
                <p className="phone-number-display">
                    <FaPhone className="phone-icon" />
                    {phoneNumber}
                </p>
                <div className="call-options-grid">
                    {[
                        { key: 'default', label: t.messages?.default || 'Appel par défaut', icon: <FaPhone /> },
                        { key: 'whatsapp', label: 'WhatsApp', icon: '📱' },
                        { key: 'teams', label: 'Microsoft Teams', icon: '💼' },
                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            className={`call-option-btn ${key}`}
                            onClick={() => onCall(key)}
                        >
                            <span className="option-icon">{icon}</span>
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
                <div className="call-options-footer">
                    <button className="copy-number-btn" onClick={() => onCopy(phoneNumber)}>
                        📋 {t.messages?.copyNumber || 'Copier le numéro'}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// Sous-composant : Modal suppression
// ─────────────────────────────────────────────
const DeleteModal = ({ client, loading, onConfirm, onCancel, t }) => (
    <div className="popup-overlay-client">
        <div className="delete-popup-client">
            <div className="popup-header-client">
                <h3>{t.modals?.deleteTitle || 'Confirmer la suppression'}</h3>
                <button className="popup-close-client" onClick={onCancel} disabled={loading}>
                    <FaTimes />
                </button>
            </div>
            <div className="popup-content-client">
                <p>{t.modals?.deleteConfirm || 'Êtes-vous sûr de vouloir supprimer ce client ?'}</p>
                <p className="client-info"><strong>{client?.Nom_client}</strong></p>
                <p className="warning-text-client">{t.modals?.deleteWarning || 'Cette action est irréversible.'}</p>
            </div>
            <div className="popup-actions-client">
                <button className="btn-cancel-client" onClick={onCancel} disabled={loading}>
                    {t.header?.cancel || 'Annuler'}
                </button>
                <button className="btn-confirm-delete-client" onClick={onConfirm} disabled={loading}>
                    {loading
                        ? (t.messages?.deleting || 'Suppression...')
                        : (t.modals?.confirmDelete || 'Supprimer')}
                </button>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// Constantes : pays
// ─────────────────────────────────────────────
const PHONE_REGEXES = {
    MG: /^[3][2-8]\d{7}$/,
    FR: /^[1-9]\d{8}$/,
    US: /^\d{10}$/,
    GB: /^\d{10,11}$/,
    DE: /^\d{10,11}$/,
    CA: /^\d{10}$/,
    AU: /^\d{9}$/,
    BR: /^\d{10,11}$/,
    CN: /^\d{11}$/,
    IN: /^\d{10}$/,
    JP: /^\d{10,11}$/,
};

const PHONE_PLACEHOLDERS = {
    MG: '321234567', FR: '612345678', US: '5551234567',
    GB: '7912345678', DE: '15123456789', CA: '5551234567',
    AU: '412345678', BR: '11987654321', CN: '13123456789',
    IN: '9876543210', JP: '9012345678',
};

const buildCountries = (language) => [
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
    { code: 'CI', name: "Côte d'Ivoire", dialCode: '+225', flag: '🇨🇮' },
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
    { code: 'NZ', name: language === 'fr' ? 'Nouvelle-Zélande' : 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
    { code: 'ZA', name: language === 'fr' ? 'Afrique du Sud' : language === 'mg' ? 'Afrika Atsimo' : 'South Africa', dialCode: '+27', flag: '🇿🇦' },
    { code: 'NG', name: language === 'fr' ? 'Nigéria' : language === 'mg' ? 'Nizeria' : 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
    { code: 'EG', name: language === 'fr' ? 'Égypte' : language === 'mg' ? 'Ejipta' : 'Egypt', dialCode: '+20', flag: '🇪🇬' },
    { code: 'RU', name: language === 'fr' ? 'Russie' : language === 'mg' ? 'Rosia' : 'Russia', dialCode: '+7', flag: '🇷🇺' },
    { code: 'TR', name: language === 'fr' ? 'Turquie' : language === 'mg' ? 'Torkia' : 'Turkey', dialCode: '+90', flag: '🇹🇷' },
    { code: 'SA', name: language === 'fr' ? 'Arabie Saoudite' : language === 'mg' ? 'Arabia Saodita' : 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
    { code: 'AE', name: language === 'fr' ? 'Émirats Arabes Unis' : language === 'mg' ? 'Emirata Arabo Mitambatra' : 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
];

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────
function Affichage() {
    const navigate = useNavigate();
    const { language } = useLanguage();

    const translations = { fr, en, mg };
    const t = translations[language] || translations.fr;

    const countries = useMemo(() => buildCountries(language), [language]);

    // ── State ──
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [editClient, setEditClient] = useState({ Nom_client: '', Telephone_client: '' });
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null); // { message, isError }

    // Sélecteur de pays
    const [selectedCountry, setSelectedCountry] = useState('MG');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const countrySelectorRef = useRef(null);

    // Options d'appel
    const [showCallOptions, setShowCallOptions] = useState(false);
    const [currentPhoneNumber, setCurrentPhoneNumber] = useState('');

    // Évite les race conditions si plusieurs chargements se chevauchent
    const loadingRef = useRef(false);

    // ── Helpers ──
    const getCurrentCountry = useCallback(
        () => countries.find((c) => c.code === selectedCountry) || countries[0],
        [countries, selectedCountry]
    );

    const filteredCountries = useMemo(() => {
        if (!countrySearch) return countries;
        const q = countrySearch.toLowerCase();
        return countries.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.dialCode.includes(q) ||
                c.code.toLowerCase().includes(q)
        );
    }, [countries, countrySearch]);

    // Clients filtrés (mémoïsé)
    const displayClients = useMemo(() => {
        if (!searchTerm.trim()) return clients;
        const q = searchTerm.toLowerCase().trim();
        return clients.filter(
            (c) =>
                (c.Nom_client && c.Nom_client.toLowerCase().includes(q)) ||
                (c.Telephone_client && c.Telephone_client.includes(searchTerm)) ||
                (c.client_ID && c.client_ID.toString().includes(searchTerm))
        );
    }, [clients, searchTerm]);

    // ── Toast ──
    const showToast = useCallback((message, isError = false) => {
        setToast({ message, isError });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // ── Chargement des clients ──
    const getClients = useCallback(async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const rides = await fetchRides({});
            setClients(extractUniqueClientsFromRides(rides));
        } catch (error) {
            console.error('Erreur lors de la récupération des clients:', error);
            showToast(t.messages?.error || 'Erreur lors du chargement', true);
            setClients([]);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [showToast, t.messages?.error]);

    useEffect(() => { getClients(); }, [getClients]);

    // Fermer le dropdown pays au clic extérieur
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (countrySelectorRef.current && !countrySelectorRef.current.contains(e.target)) {
                setShowCountryDropdown(false);
                setCountrySearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Téléphone ──
    const extractPhoneInfo = useCallback(
        (fullNumber) => {
            if (!fullNumber) return { localNumber: '', countryCode: 'MG' };
            const country = countries.find((c) => fullNumber.startsWith(c.dialCode));
            return country
                ? { localNumber: fullNumber.replace(country.dialCode, '').trim(), countryCode: country.code }
                : { localNumber: fullNumber, countryCode: 'MG' };
        },
        [countries]
    );

    const handlePhoneCall = useCallback(
        (phoneNumber) => {
            if (!phoneNumber) {
                showToast(t.messages?.noNumber || 'Numéro non disponible', true);
                return;
            }
            const clean = phoneNumber.replace(/[\s\-()]/g, '');
            if (!/^\+?[\d]{5,15}$/.test(clean)) {
                showToast(t.messages?.invalidNumber || 'Numéro invalide', true);
                return;
            }
            setCurrentPhoneNumber(clean);
            const isMobile = /iPhone|iPad|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
                window.location.href = `tel:${clean}`;
                showToast(`${t.messages?.calling || 'Appel en cours'} ${phoneNumber}`);
            } else {
                setShowCallOptions(true);
            }
        },
        [showToast, t.messages]
    );

    const copyToClipboard = useCallback(
        async (text) => {
            try {
                await navigator.clipboard.writeText(text);
            } catch {
                // Fallback
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            showToast(t.messages?.numberCopied || 'Numéro copié');
            setShowCallOptions(false);
        },
        [showToast, t.messages?.numberCopied]
    );

    const callWithApp = useCallback(
        (app) => {
            let url = '';
            if (app === 'whatsapp') {
                window.open(`https://wa.me/${currentPhoneNumber.replace('+', '')}`, '_blank');
                setShowCallOptions(false);
                return;
            }
            if (app === 'teams') url = `msteams:/l/call?to=tel:${currentPhoneNumber}`;
            else url = `tel:${currentPhoneNumber}`;

            try {
                window.location.href = url;
                showToast(`${t.messages?.calling || 'Appel en cours'} ${currentPhoneNumber}`);
            } catch {
                copyToClipboard(currentPhoneNumber);
            }
            setShowCallOptions(false);
        },
        [currentPhoneNumber, showToast, copyToClipboard, t.messages?.calling]
    );

    // ── Validation ──
    const validateForm = (data) => {
        const errs = {};
        if (!data.Nom_client?.trim()) {
            errs.Nom_client = t.validation?.nameRequired || 'Le nom est requis';
        } else if (data.Nom_client.trim().length < 2) {
            errs.Nom_client = t.validation?.nameMinLength || 'Le nom doit contenir au moins 2 caractères';
        }
        if (!data.Telephone_client?.trim()) {
            errs.Telephone_client = t.validation?.phoneRequired || 'Le téléphone est requis';
        } else {
            const regex = PHONE_REGEXES[selectedCountry] || /^\d{6,15}$/;
            if (!regex.test(data.Telephone_client)) {
                errs.Telephone_client =
                    t.phoneErrors?.[selectedCountry] || t.phoneErrors?.default || 'Format de téléphone invalide';
            }
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Handlers modal édition ──
    const handleEditClick = useCallback(
        (client) => {
            const { localNumber, countryCode } = extractPhoneInfo(client.Telephone_client);
            setSelectedClient(client);
            setEditClient({ Nom_client: client.Nom_client || '', Telephone_client: localNumber });
            setSelectedCountry(countryCode);
            setErrors({});
            setShowEditModal(true);
        },
        [extractPhoneInfo]
    );

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm(editClient)) return;
        // NOTE : la modification via l'API GraphQL Waiz n'est pas supportée.
        // Implémenter ici votre logique de mise à jour si une autre API est disponible.
        showToast(
            t.messages?.editNotAvailable ||
            'Modification non disponible via l\'API GraphQL Waiz.',
            true
        );
        setShowEditModal(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const formatted = name === 'Telephone_client' ? value.replace(/\D/g, '') : value;
        setEditClient((prev) => ({ ...prev, [name]: formatted }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    // ── Handlers modal suppression ──
    const handleDeleteClick = useCallback((client) => {
        setSelectedClient(client);
        setShowDeleteModal(true);
    }, []);

    const handleDeleteConfirm = async () => {
        // NOTE : la suppression via l'API GraphQL Waiz n'est pas supportée.
        showToast(
            t.messages?.deleteNotAvailable ||
            'Suppression non disponible via l\'API GraphQL Waiz.',
            true
        );
        setShowDeleteModal(false);
        setSelectedClient(null);
    };

    const handleDeleteCancel = useCallback(() => {
        setShowDeleteModal(false);
        setSelectedClient(null);
    }, []);

    // ── Helpers d'affichage ──
    const getFullPhoneNumber = () => {
        const c = getCurrentCountry();
        return `${c.dialCode} ${editClient.Telephone_client}`;
    };

    const getPhonePlaceholder = () =>
        PHONE_PLACEHOLDERS[getCurrentCountry().code] || t.form?.phone || 'Numéro de téléphone';

    const getPhoneFormatHint = () => {
        if (getCurrentCountry().code === 'MG') return '32-38 XXXXXXX';
        return language === 'fr' ? 'numéro local' : language === 'mg' ? 'laharana eo an-toerana' : 'local number';
    };

    const getSearchResultsText = (count) => {
        if (language === 'fr') return `${count} client${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`;
        if (language === 'mg') return `${count} mpanjifa hita`;
        return `${count} client${count > 1 ? 's' : ''} found`;
    };

    const forLabel = language === 'fr' ? ' pour ' : language === 'mg' ? ' ho an ny ' : ' for ';
    const exLabel = language === 'mg' ? 'Ohatra' : 'Ex';

    // ── Rendu ──
    return (
        <div className="app-layout-fixed">
            <div className="app-body-with-header">
                <MenuApp onToggle={setIsMenuOpen} isOpen={isMenuOpen} />

                {/* Toast */}
                {toast && (
                    <Toast
                        message={toast.message}
                        isError={toast.isError}
                        onClose={() => setToast(null)}
                    />
                )}

                <div className={`main-content-with-hea7er ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}>
                    <div className="page-content">
                        {/* En-tête */}
                        <div className="content-header-client">
                            <h1 className="page-title-client">
                                <FaUser className="title-icon" />
                                {t.header?.listTitle || 'Liste des clients'}
                            </h1>
                            <div className="header-actions-client">
                                <div className="search-container-client">
                                    <FaSearch className="search-icon-client" />
                                    <input
                                        type="text"
                                        placeholder={t.header?.searchPlaceholder || 'Rechercher...'}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input-client"
                                    />
                                    {searchTerm && (
                                        <button
                                            className="clear-search-btn-client"
                                            onClick={() => setSearchTerm('')}
                                            title={t.table?.showAll || 'Afficher tout'}
                                        >
                                            <FaTimes size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Spinner */}
                        {loading && (
                            <div className="loading-indicator-client">
                                <div className="spinner-client"></div>
                                <span>{language === 'mg' ? 'Fanodinana...' : language === 'en' ? 'Loading...' : 'Chargement...'}</span>
                            </div>
                        )}

                        <div className="content-wrapper-client">
                            {/* Info résultats de recherche */}
                            {searchTerm && (
                                <div className="search-results-info-client">
                                    <p>
                                        {displayClients.length === 0 ? (
                                            <span>
                                                {t.table?.noSearchResults || 'Aucun résultat pour'}{' '}
                                                "<strong>{searchTerm}</strong>"
                                            </span>
                                        ) : (
                                            <span>
                                                {getSearchResultsText(displayClients.length)}
                                                {forLabel}"<strong>{searchTerm}</strong>"
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}

                            <div className="table-container-client">
                                {displayClients.length === 0 && !loading ? (
                                    <div className="no-data-client">
                                        <p>
                                            {searchTerm
                                                ? t.table?.noSearchResults || 'Aucun résultat'
                                                : t.table?.noData || 'Aucun client'}
                                        </p>
                                        {!searchTerm && (
                                            <button
                                                className="btn-primary-green"
                                                onClick={() => navigate('/NouveauClient')}
                                            >
                                                {t.table?.createFirst || 'Ajouter un client'}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="table-body-container">
                                        <table className="clients-table">
                                            <thead>
                                                <tr>
                                                    <th>{t.table?.id || 'ID'}</th>
                                                    <th>{t.table?.name || 'Nom'}</th>
                                                    <th>{t.table?.phone || 'Téléphone'}</th>
                                                    <th>{t.table?.actions || 'Actions'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {displayClients.map((client) => (
                                                    <tr key={client.client_ID}>
                                                        <td className="id-cell-client">{client.client_ID}</td>
                                                        <td>
                                                            <div className="client-info">
                                                                <FaUser className="info-icon-client" />
                                                                <span>{client.Nom_client || '-'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="telephone-cell-client">
                                                            <button
                                                                className="phone-call-button"
                                                                onClick={() => handlePhoneCall(client.Telephone_client)}
                                                                title={`${t.messages?.calling || 'Appeler'} ${client.Telephone_client || ''}`}
                                                            >
                                                                <FaPhone className="info-icon-phone call-icon" style={{ color: '#667eea' }} />
                                                                <span className="phone-number">{client.Telephone_client || '-'}</span>
                                                            </button>
                                                        </td>
                                                        <td className="actions-cell-client">
                                                            <div className="actions-buttons-client">
                                                                <button
                                                                    className="btn-edit-client"
                                                                    onClick={() => handleEditClick(client)}
                                                                    disabled={loading}
                                                                    title={t.table?.edit || 'Modifier'}
                                                                >
                                                                    <FaEdit size={12} />
                                                                </button>
                                                                <button
                                                                    className="btn-delete-client"
                                                                    onClick={() => handleDeleteClick(client)}
                                                                    disabled={loading}
                                                                    title={t.table?.delete || 'Supprimer'}
                                                                >
                                                                    <FaTrash size={12} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Pied de tableau */}
                            {displayClients.length > 0 && !searchTerm && (
                                <div className="table-footer-client">
                                    <p>
                                        {t.table?.total || 'Total'}: {displayClients.length}{' '}
                                        {t.table?.clients || 'clients'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modal édition ── */}
            {showEditModal && (
                <div className="client-edit-popup-overlay">
                    <div className="client-edit-popup">
                        <div className="client-edit-popup-header">
                            <h3>{t.modals?.editTitle || 'Modifier le client'}</h3>
                            <button
                                className="client-edit-popup-close"
                                onClick={() => setShowEditModal(false)}
                                disabled={loading}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="client-edit-popup-content">
                            <form onSubmit={handleEditSubmit} className="client-edit-form">
                                {/* Nom */}
                                <div className="client-edit-form-group">
                                    <label>
                                        {t.form?.name || 'Nom'} <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="Nom_client"
                                        value={editClient.Nom_client}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                        className={errors.Nom_client ? 'client-edit-error' : 'client-edit-input'}
                                        placeholder={t.form?.namePlaceholder || 'Nom du client'}
                                    />
                                    {errors.Nom_client && (
                                        <span className="client-edit-error-message">{errors.Nom_client}</span>
                                    )}
                                </div>

                                {/* Téléphone */}
                                <div className="client-edit-form-group">
                                    <label>
                                        {t.form?.phone || 'Téléphone'} <span className="required">*</span>
                                    </label>
                                    <div className="phone-input-wrapper" ref={countrySelectorRef}>
                                        {/* Sélecteur de pays */}
                                        <div className={`country-selector ${showCountryDropdown ? 'open' : ''}`}>
                                            <button
                                                type="button"
                                                className="country-selector-btn"
                                                onClick={() => {
                                                    setShowCountryDropdown((v) => !v);
                                                    setCountrySearch('');
                                                }}
                                                disabled={loading}
                                            >
                                                <span className="country-flag">{getCurrentCountry().flag}</span>
                                                <span className="country-dial-code">{getCurrentCountry().dialCode}</span>
                                                <FaChevronDown className={`dropdown-arrow ${showCountryDropdown ? 'rotated' : ''}`} />
                                            </button>

                                            {showCountryDropdown && (
                                                <>
                                                    <div className="country-dropdown">
                                                        <div className="country-search">
                                                            <FaSearch className="search-icon" />
                                                            <input
                                                                type="text"
                                                                placeholder={t.form?.searchCountry || 'Rechercher un pays...'}
                                                                value={countrySearch}
                                                                onChange={(e) => setCountrySearch(e.target.value)}
                                                                className="search-input"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="country-list">
                                                            {filteredCountries.map((country) => (
                                                                <button
                                                                    key={country.code}
                                                                    type="button"
                                                                    className={`country-option ${selectedCountry === country.code ? 'selected' : ''}`}
                                                                    onClick={() => {
                                                                        setSelectedCountry(country.code);
                                                                        setShowCountryDropdown(false);
                                                                        setCountrySearch('');
                                                                        if (errors.Telephone_client) {
                                                                            setErrors((prev) => ({ ...prev, Telephone_client: '' }));
                                                                        }
                                                                    }}
                                                                >
                                                                    <span className="country-flag">{country.flag}</span>
                                                                    <span className="country-name">{country.name}</span>
                                                                    <span className="country-dial-code">{country.dialCode}</span>
                                                                </button>
                                                            ))}
                                                            {filteredCountries.length === 0 && (
                                                                <div className="no-results">
                                                                    {t.form?.noResults || 'Aucun pays trouvé'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="dropdown-overlay"></div>
                                                </>
                                            )}
                                        </div>

                                        {/* Champ numéro */}
                                        <div className="phone-input-container">
                                            <input
                                                type="tel"
                                                name="Telephone_client"
                                                value={editClient.Telephone_client}
                                                onChange={handleInputChange}
                                                required
                                                placeholder={`${exLabel}: ${getPhonePlaceholder()}`}
                                                disabled={loading}
                                                className={`phone-input ${errors.Telephone_client ? 'error-input' : ''}`}
                                                maxLength="15"
                                            />
                                        </div>
                                    </div>

                                    {errors.Telephone_client && (
                                        <span className="error-message">{errors.Telephone_client}</span>
                                    )}
                                    <div className="input-info">
                                        <small className="input-hint">
                                            {t.form?.format || 'Format'}: {getCurrentCountry().dialCode}{' '}
                                            {getPhoneFormatHint()}
                                        </small>
                                        <div className="phone-preview">
                                            <small>
                                                {t.form?.fullNumber || 'Numéro complet'}:{' '}
                                                <strong>{getFullPhoneNumber()}</strong>
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="client-edit-popup-actions">
                                    <button
                                        type="button"
                                        className="client-edit-btn-cancel"
                                        onClick={() => setShowEditModal(false)}
                                        disabled={loading}
                                    >
                                        {t.header?.cancel || 'Annuler'}
                                    </button>
                                    <button type="submit" className="client-edit-btn-confirm" disabled={loading}>
                                        {loading
                                            ? (language === 'mg' ? 'Fanovana...' : language === 'en' ? 'Modifying...' : 'Modification...')
                                            : (t.table?.edit || 'Modifier')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal suppression ── */}
            {showDeleteModal && (
                <DeleteModal
                    client={selectedClient}
                    loading={loading}
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    t={t}
                />
            )}

            {/* ── Modal options d'appel (desktop) ── */}
            {showCallOptions && (
                <CallOptionsModal
                    phoneNumber={currentPhoneNumber}
                    onCall={callWithApp}
                    onCopy={copyToClipboard}
                    onClose={() => setShowCallOptions(false)}
                    t={t}
                />
            )}
        </div>
    );
}

export default Affichage;