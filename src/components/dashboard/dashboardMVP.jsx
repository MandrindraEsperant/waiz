import React, { useState, useEffect } from 'react';
import { 
    FaCar, FaMoneyBillWave, FaChartLine, FaCalendarAlt, 
    FaMapMarkerAlt, FaChartBar, FaClock, FaFilter
} from 'react-icons/fa';
import axios from 'axios';
import MenuApp from '../Menu';

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:8000';
import './dashboard.css';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// COMPOSANT: Filtres de heatmap (ESSENTIEL)
const HeatmapFilters = ({ filters, onFilterChange }) => {
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const tranches = [
        'Matin (06h-10h)',
        'Avant-midi (10h-12h)', 
        'Midi (12h-14h)',
        'Après-midi (14h-17h)',
        'Soirée (17h-20h)',
        'Soir (20h-00h)'
    ];

    return (
        <div className="heatmap-filters">
            <div className="filter-group">
                <label>Jour de la semaine:</label>
                <select 
                    value={filters.jour} 
                    onChange={(e) => onFilterChange('jour', e.target.value)}
                    className="filter-select"
                >
                    <option value="">Tous les jours</option>
                    {jours.map(jour => (
                        <option key={jour} value={jour}>
                            {jour.charAt(0).toUpperCase() + jour.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="filter-group">
                <label>Tranche horaire:</label>
                <select 
                    value={filters.tranche} 
                    onChange={(e) => onFilterChange('tranche', e.target.value)}
                    className="filter-select"
                >
                    <option value="">Toutes les tranches</option>
                    {tranches.map(tranche => (
                        <option key={tranche} value={tranche}>
                            {tranche}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

// COMPOSANT: Suggestions de positionnement (ESSENTIEL)
const PositioningSuggestions = ({ suggestions, loading }) => {
    if (loading) return <div className="loading-suggestions">Analyse en cours...</div>;
    
    const hasSuggestions = suggestions?.suggestions?.length > 0;
    
    if (!hasSuggestions) {
        return (
            <div className="positioning-suggestions no-data">
                <p>En attente de données de courses...</p>
            </div>
        );
    }

    return (
        <div className="positioning-suggestions">
            <h3>🎯 Zones recommandées</h3>
            <div className="suggestions-list">
                {suggestions.suggestions.slice(0, 3).map((suggestion, index) => (
                    <div key={index} className="suggestion-item">
                        <div className="suggestion-rank">#{index + 1}</div>
                        <div className="suggestion-content">
                            <div className="zone-name">{suggestion.zone}</div>
                            <div className="suggestion-metric">
                                Score: {suggestion.demand_score}
                            </div>
                            <div className="suggestion-recommendation">
                                {suggestion.recommendation}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// COMPOSANT: Carte de chaleur ESSENTIELLE
const BasicHeatmap = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="heatmap-loading">
                <div className="loading-spinner"></div>
                <p>Chargement de la carte...</p>
            </div>
        );
    }

    const validData = (data || []).filter(zone => 
        zone && typeof zone.latitude === 'number' && typeof zone.longitude === 'number'
    );

    const center = [-18.9000, 47.5200];

    const getHeatmapColor = (demand) => {
        if (demand >= 80) return '#ff4444';
        if (demand >= 60) return '#ffaa00';
        if (demand >= 40) return '#ffff00';
        return '#aaff00';
    };

    const getRadius = (demand) => {
        return Math.sqrt(demand) * 2.5;
    };

    return (
        <div className="basic-heatmap">
            <div className="map-legend">
                <div className="legend-title">📊 Zones d'activité</div>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-color high"></div>
                        <span>Forte activité</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color medium"></div>
                        <span>Activité moyenne</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color low"></div>
                        <span>Faible activité</span>
                    </div>
                </div>
            </div>
            
            <MapContainer 
                center={center} 
                zoom={13} 
                style={{ height: '400px', width: '100%', borderRadius: '8px' }}
                className="heatmap-map"
            >
                <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                {validData.map((zone, index) => (
                    <CircleMarker
                        key={index}
                        center={[zone.latitude, zone.longitude]}
                        radius={getRadius(zone.demand)}
                        fillColor={getHeatmapColor(zone.demand)}
                        color="#333"
                        weight={1}
                        opacity={0.8}
                        fillOpacity={0.7}
                    >
                        <Popup>
                            <div className="popup-content">
                                <h4>📍 {zone.zone}</h4>
                                <div className="popup-stats">
                                    <div className="popup-stat">
                                        <strong>Activité:</strong> {zone.demand}%
                                    </div>
                                    <div className="popup-stat">
                                        <strong>Courses/heure:</strong> {zone.courses_heure || 0}
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
};

// COMPOSANT: Graphique des heures de pointe (ESSENTIEL)
const PeakHoursChart = ({ data, loading }) => {
    if (loading) return <div className="loading-data">Chargement...</div>;
    if (!data?.length) return <div className="no-data">Aucune donnée</div>;

    const maxCourses = Math.max(...data.map(h => h.courses), 1);

    return (
        <div className="peak-hours-chart">
            <h4>📈 Heures de pointe</h4>
            <div className="chart-bars vertical">
                {data.map((hour, index) => (
                    <div key={index} className="chart-bar-container">
                        <div className="bar-label">{hour.hour}</div>
                        <div className="chart-bar">
                            <div 
                                className="bar-fill"
                                style={{ height: `${(hour.courses / maxCourses) * 100}%` }}
                            >
                                {hour.courses > 0 && (
                                    <span className="bar-value">{hour.courses}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// COMPOSANT: Métriques de performance (ESSENTIEL)
const PerformanceMetrics = ({ data, loading }) => {
    if (loading) return <div className="loading-data">Chargement...</div>;

    return (
        <div className="performance-metrics">
            <h4>📊 Mes performances</h4>
            <div className="metrics-grid">
                <div className="metric-item">
                    <div className="metric-label">CA aujourd'hui</div>
                    <div className="metric-value">
                        {new Intl.NumberFormat('fr-FR').format(data.revenuToday || 0)} Ar
                    </div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">Courses aujourd'hui</div>
                    <div className="metric-value">
                        {data.coursesToday || 0}
                    </div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">Tarif moyen</div>
                    <div className="metric-value">
                        {new Intl.NumberFormat('fr-FR').format(data.tarif_moyen || 0)} Ar
                    </div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">Taux d'acceptation</div>
                    <div className="metric-value">
                        {data.taux_acceptation_tarif || 0}%
                    </div>
                </div>
            </div>
        </div>
    );
};

// COMPOSANT PRINCIPAL: Dashboard MVP
const DashboardMVP = () => {
    const [dashboardData, setDashboardData] = useState({
        general: {
            coursesToday: 0,
            revenuToday: 0,
            tarif_moyen: 0,
            taux_acceptation_tarif: 0
        },
        heatmapData: [],
        peakHoursData: [],
        positioningSuggestions: { suggestions: [] }
    });
    
    const [loading, setLoading] = useState(true);
    const [periode, setPeriode] = useState('today');
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [heatmapFilters, setHeatmapFilters] = useState({
        jour: '',
        tranche: ''
    });

    // Générer des suggestions basiques
    const generatePositioningSuggestions = (heatmapData) => {
        if (!heatmapData || heatmapData.length === 0) {
            return {
                suggestions: [
                    {
                        zone: "Analakely",
                        demand_score: 85,
                        recommendation: "Zone commerciale active"
                    },
                    {
                        zone: "Ivandry",
                        demand_score: 70,
                        recommendation: "Zone mixte recommandée"
                    },
                    {
                        zone: "Ankazomanga", 
                        demand_score: 65,
                        recommendation: "Bon transit"
                    }
                ]
            };
        }

        const suggestions = heatmapData
            .filter(zone => zone.demand > 0)
            .sort((a, b) => b.demand - a.demand)
            .slice(0, 3)
            .map((zone, index) => ({
                zone: zone.zone,
                demand_score: zone.demand,
                recommendation: zone.demand >= 60 ? 
                    "Zone prioritaire" :
                    "Zone conseillée"
            }));

        return { suggestions };
    };

    // Charger les données ESSENTIELLES
    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/dashboard/stats?periode=${periode}`);
            
            if (response.data.success) {
                const data = response.data.data;
                const positioningSuggestions = generatePositioningSuggestions(data.heatmapData);
                
                setDashboardData({
                    general: {
                        coursesToday: data.general?.coursesToday || 0,
                        revenuToday: data.general?.revenuToday || 0,
                        tarif_moyen: data.performance?.tarif_moyen || 0,
                        taux_acceptation_tarif: data.performance?.taux_acceptation_tarif || 0
                    },
                    heatmapData: data.heatmapData || [],
                    peakHoursData: data.coursesByTimeSlot || [],
                    positioningSuggestions
                });
            }
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
            // Données par défaut pour le MVP
            const defaultHeatmapData = [
                {
                    zone: "Analakely",
                    latitude: -18.9100,
                    longitude: 47.5250,
                    demand: 85,
                    courses_heure: 12
                },
                {
                    zone: "Ivandry", 
                    latitude: -18.8800,
                    longitude: 47.5300,
                    demand: 65,
                    courses_heure: 8
                }
            ];

            setDashboardData({
                general: {
                    coursesToday: 8,
                    revenuToday: 120000,
                    tarif_moyen: 15000,
                    taux_acceptation_tarif: 85
                },
                heatmapData: defaultHeatmapData,
                peakHoursData: [
                    { hour: '07h', courses: 8 },
                    { hour: '08h', courses: 12 },
                    { hour: '09h', courses: 10 },
                    { hour: '17h', courses: 11 },
                    { hour: '18h', courses: 14 }
                ],
                positioningSuggestions: generatePositioningSuggestions(defaultHeatmapData)
            });
        } finally {
            setLoading(false);
        }
    };

    const loadFilteredHeatmap = async (jour, tranche) => {
        try {
            const params = new URLSearchParams();
            if (jour) params.append('jour', jour);
            if (tranche) params.append('tranche', tranche);
            
            const response = await axios.get(`${API_BASE_URL}/api/dashboard/heatmap/filtered?${params}`);
            if (response.data.success) {
                const positioningSuggestions = generatePositioningSuggestions(response.data.data);
                
                setDashboardData(prev => ({
                    ...prev,
                    heatmapData: response.data.data,
                    positioningSuggestions
                }));
            }
        } catch (error) {
            console.error('Erreur chargement heatmap:', error);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [periode]);

    const handleMenuToggle = (isOpen) => {
        setIsMenuOpen(isOpen);
    };

    const handleFilterChange = (filterType, value) => {
        const newFilters = { 
            ...heatmapFilters, 
            [filterType]: value 
        };
        setHeatmapFilters(newFilters);
        loadFilteredHeatmap(newFilters.jour, newFilters.tranche);
    };

    // Composant Carte de Statistiques SIMPLIFIÉ
    const StatCard = ({ title, value, icon, color, suffix }) => (
        <div className={`stat-card stat-card-${color}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-content">
                <h3>{title}</h3>
                <div className="stat-value">
                    {loading ? (
                        <div className="stat-skeleton"></div>
                    ) : (
                        <>
                            {value}
                            {suffix && <span className="stat-suffix">{suffix}</span>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="app-container">
            <MenuApp onToggle={handleMenuToggle} />
            
            <div className={`content-container ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}>
                <div className="dashboard-container">
                    {/* En-tête SIMPLIFIÉ */}
                    <div className="dashboard-header">
                        <div className="header-left">
                            <h1>
                                <FaChartLine className="header-icon" />
                                Dashboard Chauffeur
                            </h1>
                            <p>Optimisez vos revenus</p>
                        </div>
                        <div className="header-right">
                            <select 
                                value={periode} 
                                onChange={(e) => setPeriode(e.target.value)}
                                className="period-select"
                            >
                                <option value="today">Aujourd'hui</option>
                                <option value="week">Cette semaine</option>
                            </select>
                        </div>
                    </div>

                    {/* Cartes de Statistiques ESSENTIELLES */}
                    <div className="stats-grid">
                        <StatCard
                            title="Courses aujourd'hui"
                            value={dashboardData.general.coursesToday}
                            icon={<FaCar />}
                            color="primary"
                        />
                        <StatCard
                            title="CA aujourd'hui"
                            value={new Intl.NumberFormat('fr-FR').format(dashboardData.general.revenuToday)}
                            icon={<FaMoneyBillWave />}
                            color="success"
                            suffix=" Ar"
                        />
                        <StatCard
                            title="Tarif moyen"
                            value={new Intl.NumberFormat('fr-FR').format(dashboardData.general.tarif_moyen)}
                            icon={<FaChartBar />}
                            color="warning"
                            suffix=" Ar"
                        />
                    </div>

                    {/* CONTENU PRINCIPAL MVP */}
                    <div className="main-content">
                        
                        {/* SECTION 1: Heatmap et Filtres */}
                        <div className="content-section">
                            <div className="section-header">
                                <FaMapMarkerAlt className="section-icon" />
                                <h2>Carte des zones d'activité</h2>
                            </div>
                            
                            <div className="heatmap-controls">
                                <HeatmapFilters 
                                    filters={heatmapFilters}
                                    onFilterChange={handleFilterChange}
                                />
                            </div>
                            
                            <div className="heatmap-container">
                                <BasicHeatmap 
                                    data={dashboardData.heatmapData}
                                    loading={loading}
                                />
                            </div>
                        </div>

                        {/* SECTION 2: Recommandations et Performances */}
                        <div className="content-row">
                            <div className="content-column">
                                <div className="section-header">
                                    <FaChartLine className="section-icon" />
                                    <h3>Où se positionner ?</h3>
                                </div>
                                <PositioningSuggestions 
                                    suggestions={dashboardData.positioningSuggestions}
                                    loading={loading}
                                />
                            </div>
                            
                            <div className="content-column">
                                <PerformanceMetrics 
                                    data={dashboardData.general} 
                                    loading={loading} 
                                />
                            </div>
                        </div>

                        {/* SECTION 3: Heures de pointe */}
                        <div className="content-section">
                            <PeakHoursChart 
                                data={dashboardData.peakHoursData}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardMVP;