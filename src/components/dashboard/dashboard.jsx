import React, { useState, useEffect } from 'react';
import { 
    FaCar, FaMoneyBillWave, FaChartLine, FaCalendarAlt, 
    FaMapMarkerAlt, FaChartBar, FaBrain, FaEye, 
    FaClock, FaFilter, FaSearch, FaBell, FaRoute, FaLightbulb,
    FaExclamationTriangle, FaMapPin, FaPlus, FaCrosshairs
} from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MenuApp from '../../components/Menu';
import '../dashboard/dashboard.css';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../hooks/useCurrency';
import { fetchDriverDashboardStat, fetchRides } from '../../services/waizApi';
import fr from '../../locales/dashboard/fr.json';
import en from '../../locales/dashboard/en.json';
import mg from '../../locales/dashboard/mg.json';

const driverIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const zoneIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Composant pour les événements de la carte
const MapEventHandler = ({ onMapClick, onMapLeave }) => {
    useMapEvents({
        click: (e) => {
            onMapClick && onMapClick(e.latlng, e);
        },
        mouseout: () => {
            onMapLeave && onMapLeave();
        }
    });
    return null;
};

// Fonction pour obtenir le jour courant
const getCurrentDay = () => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const today = new Date().getDay();
    return days[today];
};

// COMPOSANT: Filtres de heatmap avec traduction
const HeatmapFilters = ({ filters, onFilterChange, t }) => {
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const tranches = [
        { value: 'matin', label: 'Matin (06h-10h)' },
        { value: 'avant-midi', label: 'Avant-midi (10h-12h)' },
        { value: 'midi', label: 'Midi (12h-14h)' },
        { value: 'après-midi', label: 'Après-midi (14h-17h)' },
        { value: 'soirée', label: 'Soirée (17h-20h)' },
        { value: 'soir', label: 'Soir (20h-06h)' }
    ];

    return (
        <div className="heatmap-filters">
            <div className="filter-group">
                <label>{t('filters.dayLabel')}:</label>
                <select 
                    value={filters.jour} 
                    onChange={(e) => onFilterChange('jour', e.target.value)}
                    className="filter-select"
                >
                    <option value="">{t('filters.allDays')}</option>
                    {jours.map(jour => (
                        <option key={jour} value={jour}>
                            {t(`days.${jour}`)}
                            {jour === getCurrentDay() && ` (${t('common.today')})`}
                        </option>
                    ))}
                </select>
            </div>

            <div className="filter-group">
                <label>{t('filters.timeSlotLabel')}:</label>
                <select 
                    value={filters.tranche} 
                    onChange={(e) => onFilterChange('tranche', e.target.value)}
                    className="filter-select"
                >
                    <option value="">{t('filters.allTimeSlots')}</option>
                    {tranches.map(tranche => (
                        <option key={tranche.value} value={tranche.value}>
                            {t(`timeSlots.${tranche.value}`)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="filter-info">
                <p>📊 {t('filters.realTimeData')}</p>
                <p className="current-day-info">
                    📅 {t('common.today')}: <strong>{t(`days.${getCurrentDay()}`)}</strong>
                </p>
                {filters.tranche && (
                    <p className="active-filter">
                        🔍 {t('filters.activeFilter')}: <strong>{t(`timeSlots.${filters.tranche}`)}</strong>
                    </p>
                )}
            </div>
        </div>
    );
};

// COMPOSANT: Suggestions de positionnement
const PositioningSuggestions = ({ suggestions, loading, onZoneHover, onZoneLeave, t }) => {
    if (loading) return <div className="loading-suggestions">{t('common.analyzing')}</div>;
    
    const hasSuggestions = suggestions?.suggestions?.length > 0;
    
    if (!hasSuggestions) {
        return (
            <div className="positioning-suggestions no-data">
                <div className="suggestion-header">
                    <div className="current-context">
                        <strong>
                            {suggestions?.filter_day && suggestions.filter_tranche 
                                ? t('suggestions.noSuggestionsWithFilters', { 
                                    day: t(`days.${suggestions.filter_day}`), 
                                    timeSlot: t(`timeSlots.${suggestions.filter_tranche}`) 
                                  })
                                : t('suggestions.waitingForData')
                            }
                        </strong>
                    </div>
                </div>
                <div className="no-suggestions-message">
                    <p>
                        {suggestions?.algorithm_factors?.[0] || t('suggestions.dataWillLoad')}
                    </p>
                    {suggestions?.algorithm_factors && suggestions.algorithm_factors.length > 1 && (
                        <div className="algorithm-factors">
                            <strong>{t('common.information')}:</strong>
                            <div className="factors-list">
                                {suggestions.algorithm_factors.slice(1).map((factor, idx) => (
                                    <span key={idx} className="factor-tag">{factor}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="positioning-suggestions">
            <div className="suggestion-header">
                <div className="current-context">
                    <strong>{t('suggestions.currentRecommendations')}</strong>
                    <span className="current-day-badge">
                        📅 {t(`days.${getCurrentDay()}`)}
                    </span>
                </div>
            </div>

            <div className="filter-context">
                <small>
                    📊 {t('common.filters')}: <strong>{t(`days.${suggestions.filter_day}`)}</strong>, <strong>{t(`timeSlots.${suggestions.filter_tranche}`)}</strong>
                    {suggestions.total_zones_analyzed && (
                        <span> • {suggestions.total_zones_analyzed} {t('suggestions.zonesAnalyzed')}</span>
                    )}
                </small>
            </div>

            <div className="suggestions-list">
                {suggestions.suggestions.slice(0, 3).map((suggestion, index) => (
                    <div 
                        key={index} 
                        className="suggestion-item interactive-zone"
                        onMouseEnter={(e) => onZoneHover && onZoneHover(suggestion, e)}
                        onMouseLeave={onZoneLeave}
                    >
                        <div className="suggestion-rank">#{index + 1}</div>
                        <div className="suggestion-content">
                            <div className="zone-name interactive">{suggestion.zone}</div>
                            <div className="suggestion-metric">
                                {t('common.score')}: {suggestion.demand_score}%
                            </div>
                            <div className="suggestion-recommendation">
                                {suggestion.recommendation}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {suggestions.algorithm_factors && (
                <div className="algorithm-factors">
                    <strong>{t('suggestions.analyzedFactors')}:</strong>
                    <div className="factors-list">
                        {suggestions.algorithm_factors.map((factor, idx) => (
                            <span key={idx} className="factor-tag">{factor}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// COMPOSANT: Alertes zones chaudes 
const HotZoneAlerts = ({ data, onZoneClick, onAddZone, onZoneHover, onZoneLeave, t }) => {
    const { formatCurrency, getCurrencySymbol } = useCurrency();
    const hasValidAlerts = data?.alerts?.length > 0 && data.alerts.some(alert => 
        alert && (alert.message || alert.zone)
    );

    if (!hasValidAlerts) {
        return (
            <div className="hot-zone-alerts no-alerts">
                <div className="no-alerts-icon">✅</div>
                <h4>{t('alerts.noActiveAlerts')}</h4>
                <p>{t('alerts.allZonesNormal')}</p>
            </div>
        );
    }

    // Fonction pour formater les alertes avec noms de zones
    const formatAlert = (alert) => {
        const zoneName = alert.Nom || alert.nom || alert.zone || alert.zone_name || 
                        alert.zone_data?.Nom || alert.zone_data?.nom || alert.zone_data?.zone || 
                        `Zone ${alert.zone_id || alert.zone_ID || alert.zone_data?.zone_ID || alert.zone_data?.id || 'Inconnue'}`;
        
        const increase = alert.increase || alert.increase_value || '0.0';
        
        return {
            ...alert,
            zone: zoneName,
            increase: increase,
            originalData: alert
        };
    };

    const validAlerts = data.alerts
        .filter(alert => alert && (alert.message || alert.zone || alert.zone_data))
        .map(formatAlert);

    return (
        <div className="hot-zone-alerts">
            <div className="alerts-header">
                <FaExclamationTriangle className="alert-icon" />
                <span className="alerts-count">{validAlerts.length} {t('alerts.alertsDetected')}</span>
            </div>

            <div className="alerts-list">
                {validAlerts.map((alert, index) => {
                    const increase = alert.increase || '0.0';
                    let alertMessage = '';
                    
                    if (alert.severity === 'high') {
                        alertMessage = `Activité élevée: ${alert.zone} (+${increase} courses) - Dépassement de ${alert.threshold || '0.0'}`;
                    } else if (alert.severity === 'medium') {
                        alertMessage = `Activité élevée: ${alert.zone} (+${increase} courses)`;
                    } else {
                        alertMessage = `Activité élevée: ${alert.zone} (+${increase} courses)`;
                    }
                    
                    return (
                        <div 
                            key={index} 
                            className={`alert-item severity-${alert.severity || 'medium'} interactive-zone`}
                            onMouseEnter={(e) => onZoneHover && onZoneHover(alert, e)}
                            onMouseLeave={onZoneLeave}
                        >
                            <div className="alert-message">
                                {alertMessage}
                            </div>
                            <div className="alert-details">
                                {alert.demand && <span>{t('alerts.demand')}: {alert.demand} {t('common.rides')}</span>}
                                {alert.increase && <span>{t('alerts.increase')}: +{alert.increase} {t('common.rides')}</span>}
                                {alert.average_demand && <span>{t('alerts.average')}: {alert.average_demand}</span>}
                                {alert.departures && <span>{t('alerts.departures')}: {alert.departures}</span>}
                                {alert.arrivals && <span>{t('alerts.arrivals')}: {alert.arrivals}</span>}
                                {alert.revenue_opportunity && (
                                    <span>{t('common.revenue')}:  {formatCurrency(alert.revenue_opportunity)}</span>
                                )}
                            </div>
                            <div className="alert-actions">
                                <button 
                                    className="btn-view-zone"
                                    onClick={() => onZoneClick(alert.zone)}
                                >
                                    <FaMapPin /> {t('actions.analyzeZone')}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Fonction pour générer des alertes 
const generateHotZoneAlerts = (heatmapData, generalStats, t) => {
    if (!heatmapData || heatmapData.length === 0) {
        return { alerts: [] };
    }

    const alerts = [];
    const averageCoursesPerZone = generalStats.coursesToday / Math.max(heatmapData.length, 1);

    heatmapData.forEach(zone => {
        const zoneCourses = zone.courses_heure || zone.demand || 0;
        const threshold = averageCoursesPerZone + 10;

        const zoneName = zone.Nom || zone.nom || zone.zone || zone.zone_name || 
                        zone.ZoneDepart?.Nom || zone.ZoneArriver?.Nom || 
                        `Zone ${zone.zone_ID || zone.id || 'Inconnue'}`;

        const increase = Math.max(zoneCourses - averageCoursesPerZone, 0);
        const formattedIncrease = increase.toFixed(1);

        if (zoneCourses > threshold) {
            alerts.push({
                zone: zoneName,
                severity: 'high',
                message: `Activité élevée: ${zoneName} (+${formattedIncrease} courses) - Dépassement de ${threshold.toFixed(1)}`,
                demand: zoneCourses,
                average_demand: averageCoursesPerZone.toFixed(1),
                increase: formattedIncrease,
                threshold: threshold.toFixed(1),
                departures: zone.total_departs || zone.departures || 0,
                arrivals: zone.total_arrivees || zone.arrivals || 0,
                revenue_opportunity: (zone.revenu_moyen || 0) * zoneCourses,
                zone_id: zone.zone_ID || zone.id,
                zone_data: zone
            });
        }
        else if (zoneCourses > averageCoursesPerZone * 1.5) {
            alerts.push({
                zone: zoneName,
                severity: 'medium',
                message: `Activité élevée: ${zoneName} (+${formattedIncrease} courses)`,
                demand: zoneCourses,
                average_demand: averageCoursesPerZone.toFixed(1),
                increase: formattedIncrease,
                zone_id: zone.zone_ID || zone.id,
                zone_data: zone
            });
        }
    });

    if (alerts.length === 0 && heatmapData.length > 0) {
        const topZones = [...heatmapData]
            .sort((a, b) => (b.courses_heure || b.demand || 0) - (a.courses_heure || a.demand || 0))
            .slice(0, 2);

        topZones.forEach(zone => {
            if ((zone.courses_heure || zone.demand || 0) > 0) {
                const zoneName = zone.Nom || zone.nom || zone.zone || zone.zone_name || 
                               zone.ZoneDepart?.Nom || zone.ZoneArriver?.Nom || 
                               `Zone ${zone.zone_ID || zone.id || 'Inconnue'}`;
                
                const increase = Math.max((zone.courses_heure || zone.demand || 0) - averageCoursesPerZone, 0);
                const formattedIncrease = increase.toFixed(1);
                
                alerts.push({
                    zone: zoneName,
                    severity: 'low',
                    message: `Activité élevée: ${zoneName} (+${formattedIncrease} courses)`,
                    demand: zone.courses_heure || zone.demand,
                    increase: formattedIncrease,
                    recommendation: t('alerts.watchZone'),
                    zone_id: zone.zone_ID || zone.id,
                    zone_data: zone
                });
            }
        });
    }

    return { alerts };
};

// COMPOSANT: Graphique des heures de pointe
const PeakHoursChart = ({ data, loading, t }) => {
    if (loading) return <div className="loading-data">{t('common.analyzingPeakHours')}</div>;
    if (!data?.length) return <div className="no-data">{t('common.loadingHourlyData')}</div>;

    const maxCourses = Math.max(...data.map(h => h.courses), 1);

    return (
        <div className="peak-hours-chart">
            <div className="chart-bars vertical">
                {data.map((hour, index) => (
                    <div key={index} className={`chart-bar-container ${hour.isPeak ? 'peak' : ''}`}>
                        <div className="bar-label">{hour.hour}</div>
                        <div className="chart-bar">
                            <div 
                                className={`bar-fill ${hour.isPeak ? 'peak' : ''}`}
                                style={{ height: `${(hour.courses / maxCourses) * 100}%` }}
                                title={t('common.coursesAtHour', { 
                                    courses: hour.courses, 
                                    hour: hour.hour 
                                })}
                            >
                                {hour.courses > 0 && (
                                    <span className="bar-value">{hour.courses}</span>
                                )}
                            </div>
                        </div>
                        {hour.isPeak && <div className="peak-indicator">📈</div>}
                    </div>
                ))}
            </div>
            <div className="peak-summary">
                <div className="peak-count">
                    {data.filter(h => h.isPeak).length} {t('peakHours.hoursDetected')}
                </div>
                <div className="current-day-note">
                    📅 {t('common.dataFor')} {t(`days.${getCurrentDay()}`)}
                </div>
            </div>
        </div>
    );
};

// COMPOSANT: Graphique des courses par jour
const CoursesByDayChart = ({ data, loading, onDateChange, selectedDate, t }) => {
    const [localSelectedDate, setLocalSelectedDate] = useState(
        selectedDate || { month: new Date().getMonth() + 1, year: new Date().getFullYear() }
    );
    
    const generateYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = 0; i < 5; i++) {
            const year = currentYear - i;
            years.push(year);
        }
        return years;
    };

    const generateMonthOptions = () => {
        return [
            { value: 1, label: t('months.january') }, 
            { value: 2, label: t('months.february') }, 
            { value: 3, label: t('months.march') },
            { value: 4, label: t('months.april') }, 
            { value: 5, label: t('months.may') }, 
            { value: 6, label: t('months.june') },
            { value: 7, label: t('months.july') }, 
            { value: 8, label: t('months.august') }, 
            { value: 9, label: t('months.september') },
            { value: 10, label: t('months.october') }, 
            { value: 11, label: t('months.november') }, 
            { value: 12, label: t('months.december') }
        ];
    };

    const yearOptions = generateYearOptions();
    const monthOptions = generateMonthOptions();

    const handleMonthChange = (e) => {
        const newDate = { ...localSelectedDate, month: parseInt(e.target.value) };
        setLocalSelectedDate(newDate);
        onDateChange && onDateChange(newDate);
    };

    const handleYearChange = (e) => {
        const newDate = { ...localSelectedDate, year: parseInt(e.target.value) };
        setLocalSelectedDate(newDate);
        onDateChange && onDateChange(newDate);
    };

    const getFormattedDate = () => {
        const monthName = monthOptions.find(m => m.value === localSelectedDate.month)?.label || '';
        return `${monthName} ${localSelectedDate.year}`;
    };

    if (loading) return <div className="loading-data">{t('common.loading')}...</div>;
    
    const hasDataForSelectedMonth = data && data.length > 0 && data.some(item => item.courses > 0);

    if (!data || data.length === 0 || !hasDataForSelectedMonth) {
        return (
            <div className="courses-by-day-chart">
                <div className="chart-header-with-selector">
                    <div className="date-selector">
                        <div className="selector-group">
                            <label>{t('common.month')}:</label>
                            <select value={localSelectedDate.month} onChange={handleMonthChange} className="month-select">
                                {monthOptions.map(month => (
                                    <option key={month.value} value={month.value}>{month.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="selector-group">
                            <label>{t('common.year')}:</label>
                            <select value={localSelectedDate.year} onChange={handleYearChange} className="year-select">
                                {yearOptions.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="no-data">
                    <div className="no-data-icon">📊</div>
                    <p>{t('messages.noDataForMonth', { month: getFormattedDate() })}</p>
                    <small>{t('messages.graphWillShowData')}</small>
                </div>
            </div>
        );
    }

    const maxCourses = Math.max(...data.map(item => item.courses), 1);
    const chartHeight = 120;
    const totalCourses = data.reduce((sum, item) => sum + item.courses, 0);
    const averageCourses = (totalCourses / data.length).toFixed(1);

    return (
        <div className="courses-by-day-chart">
            <div className="chart-header-with-selector">
                <div className="date-selector">
                    <div className="selector-group">
                        <label>{t('common.month')}:</label>
                        <select value={localSelectedDate.month} onChange={handleMonthChange} className="month-select">
                            {monthOptions.map(month => (
                                <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="selector-group">
                        <label>{t('common.year')}:</label>
                        <select value={localSelectedDate.year} onChange={handleYearChange} className="year-select">
                            {yearOptions.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <br />
            <div className="chart-bars horizontal">
                {data.map((item, index) => {
                    const barHeight = maxCourses > 0 ? (item.courses / maxCourses) * chartHeight : 0;
                    const isToday = new Date().getDate() === parseInt(item.date) && 
                                   new Date().getMonth() + 1 === localSelectedDate.month &&
                                   new Date().getFullYear() === localSelectedDate.year;
                    
                    return (
                        <div key={index} className={`chart-bar-container day ${isToday ? 'today' : ''}`}>
                            <div className="bar-label">
                                {item.date}
                                {isToday && <span className="today-indicator">📍</span>}
                            </div>
                            <div className="chart-bar">
                                <div 
                                    className={`bar-fill day ${isToday ? 'today' : ''}`}
                                    style={{ height: `${barHeight}px` }}
                                    title={t('common.coursesOnDate', { 
                                        courses: item.courses, 
                                        date: `${item.date}/${localSelectedDate.month.toString().padStart(2, '0')}`
                                    })}
                                >
                                    {item.courses > 0 && <span className="bar-value">{item.courses}</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="chart-summary">
                <div className="summary-grid">
                    <div className="summary-item">
                        <div className="summary-label">{t('metrics.monthlyTotal')}</div>
                        <div className="summary-value">{totalCourses} {t('common.rides')}</div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">{t('metrics.dailyAverage')}</div>
                        <div className="summary-value">{averageCourses} {t('common.ridesPerDay')}</div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">{t('metrics.mostActiveDay')}</div>
                        <div className="summary-value">{Math.max(...data.map(item => item.courses))} {t('common.rides')}</div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">{t('metrics.activityRate')}</div>
                        <div className="summary-value">
                            {((data.filter(item => item.courses > 0).length / data.length) * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// COMPOSANT: Métriques de performance
const PerformanceMetrics = ({ data, loading, t }) => {
    if (loading) return <div className="loading-data">{t('common.loading')}...</div>;

    const metrics = data || {};

    return (
        <div className="performance-metrics">
            <div className="metric-item">
                <div className="metric-label">{t('metrics.averageRate')}</div>
                <div className="metric-value">
                    {new Intl.NumberFormat('fr-FR').format(metrics.tarif_moyen || 0)} Ar
                </div>
            </div>
            <div className="metric-item">
                <div className="metric-label">{t('metrics.averageWaitTime')}</div>
                <div className="metric-value">{metrics.temps_attente_moyen || 0} {t('common.min')}</div>
            </div>
            <div className="metric-item">
                <div className="metric-label">{t('metrics.ridesPerDay')}</div>
                <div className="metric-value">{metrics.courses_par_jour || 0}</div>
            </div>
            <div className="metric-item">
                <div className="metric-label">{t('metrics.activeClients')}</div>
                <div className="metric-value">{metrics.clientsActifs || 0}</div>
            </div>
        </div>
    );
};

// COMPOSANT: Insights prédictifs
const PredictiveInsights = ({ data, loading, onZoneHover, onZoneLeave, t }) => {
    if (loading) return <div className="loading-data">{t('insights.generatingInsights')}...</div>;

    const predictiveData = data.predictiveHeatmapData || [];
    const alerts = data.hotZoneAlerts?.alerts || [];
    const suggestions = data.positioningSuggestions?.suggestions || [];

    return (
        <div className="predictive-insights-enhanced">
            <div className="insights-grid">
                <div className="insight-card positioning">
                    <div className="insight-icon">🎯</div>
                    <div className="insight-content">
                        <h4>{t('insights.positioningRecommendations')}</h4>
                        {suggestions.length > 0 ? (
                            <>
                                <p>{t('insights.recommendedZones')}:</p>
                                <div className="recommended-zones">
                                    {suggestions.slice(0, 3).map((suggestion, idx) => (
                                        <div 
                                            key={idx} 
                                            className="recommended-zone interactive-zone"
                                            onMouseEnter={(e) => onZoneHover && onZoneHover(suggestion, e)}
                                            onMouseLeave={onZoneLeave}
                                        >
                                            <span className="zone-rank">#{idx + 1}</span>
                                            <span className="zone-name interactive">{suggestion.zone}</span>
                                            <span className="zone-score">{t('common.score')}: {suggestion.demand_score}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p>{t('insights.waitingForData')}</p>
                        )}
                    </div>
                </div>

                <div className="insight-card alerts">
                    <div className="insight-icon">🚨</div>
                    <div className="insight-content">
                        <h4>{t('insights.activeAlerts')}</h4>
                        {alerts.length > 0 ? (
                            <>
                                <p>{t('insights.zonesNeedAttention', { count: alerts.length })}</p>
                                <div className="active-alerts">
                                    {alerts.map((alert, idx) => (
                                        <div 
                                            key={idx} 
                                            className="alert-item interactive-zone"
                                            onMouseEnter={(e) => onZoneHover && onZoneHover(alert, e)}
                                            onMouseLeave={onZoneLeave}
                                        >
                                            <span className="alert-zone interactive">{alert.zone}</span>
                                            <span className="alert-demand">{alert.demand} {t('common.ridesPerHour')}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p>{t('insights.noActiveAlerts')}</p>
                        )}
                    </div>
                </div>

                <div className="insight-card analysis">
                    <div className="insight-icon">📈</div>
                    <div className="insight-content">
                        <h4>{t('insights.predictiveTrends')}</h4>
                        {predictiveData.length > 0 ? (
                            <>
                                <p>{t('insights.zonesWithGrowth')}:</p>
                                <div className="growth-zones">
                                    {predictiveData
                                        .filter(zone => zone.demand >= 60)
                                        .slice(0, 3)
                                        .map((zone, idx) => (
                                            <div 
                                                key={idx} 
                                                className="growth-zone interactive-zone"
                                                onMouseEnter={(e) => onZoneHover && onZoneHover(zone, e)}
                                                onMouseLeave={onZoneLeave}
                                            >
                                                <span className="zone-name interactive">{zone.zone}</span>
                                                <span className="zone-demand">{zone.demand}% {t('insights.ofDemand')}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </>
                        ) : (
                            <p>{t('insights.analyzingTrends')}...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Fonction pour générer des suggestions
const generatePositioningSuggestions = (heatmapData, filters = {}, t) => {
    if (!heatmapData || heatmapData.length === 0) {
        return {
            suggestions: [],
            algorithm_factors: [
                t('suggestions.noDataWithFilters'),
                t('suggestions.tryChangingCriteria')
            ],
            filter_day: filters.jour || t('filters.allDays'),
            filter_tranche: filters.tranche || t('filters.allTimeSlots')
        };
    }

    const zonesWithActivity = heatmapData.filter(zone => {
        const hasDemand = zone.demand > 0;
        const hasCourses = zone.courses_heure > 0;
        return hasDemand || hasCourses;
    });
    
    if (zonesWithActivity.length === 0) {
        return {
            suggestions: [],
            algorithm_factors: [
                `${t('common.filters')}: ${filters.jour || t('filters.allDays')}, ${filters.tranche || t('filters.allTimeSlots')}`,
                t('suggestions.noActivityWithCriteria'),
                t('suggestions.checkPredictive')
            ],
            filter_day: filters.jour || t('filters.allDays'),
            filter_tranche: filters.tranche || t('filters.allTimeSlots')
        };
    }

    const suggestions = zonesWithActivity
        .sort((a, b) => {
            const scoreA = (a.demand || 0) + (a.courses_heure || 0) / 10;
            const scoreB = (b.demand || 0) + (b.courses_heure || 0) / 10;
            return scoreB - scoreA;
        })
        .slice(0, 5)
        .map((zone, index) => {
            const demandScore = zone.demand || Math.min((zone.courses_heure || 0) * 10, 100);
            
            return {
                zone: zone.zone,
                demand_score: demandScore,
                courses_count: zone.courses_heure || 0,
                revenue_potential: zone.revenu_moyen || 0,
                recommendation: getZoneRecommendation(demandScore, t),
                latitude: zone.latitude,
                longitude: zone.longitude
            };
        });

    return {
        suggestions,
        algorithm_factors: [
            `${t('common.appliedFilters')}: ${filters.jour || t('filters.allDays')}, ${filters.tranche || t('filters.allTimeSlots')}`,
            t('suggestions.zonesAnalyzed', { count: zonesWithActivity.length }),
            `${t('suggestions.averageDemand')}: ${Math.round(zonesWithActivity.reduce((sum, z) => sum + (z.demand || 0), 0) / Math.max(zonesWithActivity.length, 1))}%`,
            t('suggestions.optimizationBased')
        ],
        filter_day: filters.jour || t('filters.allDays'),
        filter_tranche: filters.tranche || t('filters.allTimeSlots'),
        total_zones_analyzed: zonesWithActivity.length
    };
};

// Fonction utilitaire pour les recommandations
const getZoneRecommendation = (demand, t) => {
    if (demand >= 80) return t('recommendations.maxPriority');
    if (demand >= 60) return t('recommendations.highPriority');
    if (demand >= 40) return t('recommendations.goodAlternative');
    if (demand >= 20) return t('recommendations.opportunity');
    return t('recommendations.emergentZone');
};

// Fonction pour obtenir la couleur de l'itinéraire
const getRouteColor = (zoneScore) => {
    if (zoneScore >= 80) return '#ff4444';
    if (zoneScore >= 60) return '#ffaa00';
    if (zoneScore >= 40) return '#44ff44';
    return '#4444ff';
};

// COMPOSANT: Carte de chaleur prédictive
const PredictiveGeographicHeatmap = ({ 
    data, 
    onZoneClick, 
    onAddZone, 
    onZoneHover, 
    onZoneLeave, 
    onMapClick, 
    onMapLeave, 
    onCreateZone,
    driverData,
    showDriverRoutes,
    setShowDriverRoutes,
    t
}) => {
    const generateRecommendations = (heatmapData) => {
        if (!heatmapData || heatmapData.length === 0) {
            return [
                {
                    zone: "Analakely", 
                    latitude: -18.9100, 
                    longitude: 47.5250, 
                    demand: 85,
                    prediction: t('predictions.highDemand'),
                    courses_heure: 12, 
                    revenu_moyen: 15000,
                    recommendation: t('recommendations.priorityZone')
                },
                {
                    zone: "Ivandry", 
                    latitude: -18.8800, 
                    longitude: 47.5300, 
                    demand: 65,
                    prediction: t('predictions.stableDemand'),
                    courses_heure: 8, 
                    revenu_moyen: 12000,
                    recommendation: t('recommendations.goodPotential')
                }
            ];
        }

        return heatmapData.map(zone => {
            let prediction = "";
            let recommendation = "";
            let demandScore = zone.demand || 50;

            if (zone.demand >= 80) {
                prediction = t('predictions.strongGrowth');
                recommendation = t('recommendations.positionForMaxRevenue');
                demandScore = 90 + Math.floor(Math.random() * 10);
            } else if (zone.demand >= 60) {
                prediction = t('predictions.moderateGrowth');
                recommendation = t('recommendations.recommendedZone');
                demandScore = 70 + Math.floor(Math.random() * 15);
            } else if (zone.demand >= 40) {
                prediction = t('predictions.stability');
                recommendation = t('recommendations.reliableZone');
                demandScore = 50 + Math.floor(Math.random() * 15);
            } else {
                prediction = t('predictions.lowActivity');
                recommendation = t('recommendations.emergentZone');
                demandScore = 30 + Math.floor(Math.random() * 15);
            }

            return {
                ...zone,
                demand: demandScore,
                prediction,
                recommendation,
                courses_heure: zone.courses_heure || Math.floor(demandScore / 10) + 5,
                revenu_moyen: zone.revenu_moyen || (10000 + (demandScore * 100))
            };
        });
    };

    const recommendations = generateRecommendations(data);
    const validData = recommendations.filter(zone => 
        zone && typeof zone.latitude === 'number' && typeof zone.longitude === 'number'
    );

    const center = driverData?.position ? 
        [driverData.position.lat, driverData.position.lng] : 
        [-18.9000, 47.5200];

    const getHeatmapColor = (demand) => {
        if (demand >= 80) return '#ff4444';
        if (demand >= 60) return '#ffaa00';
        if (demand >= 40) return '#ffff00';
        return '#aaff00';
    };

    const getRadius = (demand) => Math.sqrt(demand) * 2.5;

    return (
        <div className="predictive-heatmap-container">
            <div className="map-legend">
                <div className="legend-title" style={{marginLeft:'20px'}}>🔮 {t('map.recommendations')}</div>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-color high"></div>
                        <span>{t('map.maxPriority')}</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color medium"></div>
                        <span>{t('map.highPriority')}</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color low"></div>
                        <span>{t('map.mediumPriority')}</span>
                    </div>
                </div>
            </div>
            
            <MapContainer 
                center={center} 
                zoom={14} 
                style={{ height: '500px', width: '100%', borderRadius: '8px' }}
                className="heatmap-map predictive interactive-map"
            >
                <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapEventHandler onMapClick={onMapClick} onMapLeave={onMapLeave} />

                {/* Itinéraires recommandés */}
                {showDriverRoutes && driverData && driverData.itineraires && driverData.itineraires.map((itineraire, index) => {
                    const zone = driverData.zonesRecommandees?.find(z => z.id === itineraire.zoneId);
                    if (!zone) return null;

                    const routeColor = getRouteColor(zone.score || zone.demande);
                    
                    return (
                        <div key={itineraire.zoneId}>
                            <Polyline
                                positions={itineraire.points}
                                color={routeColor}
                                weight={itineraire.realistic ? 6 : 4}
                                opacity={0.7}
                                dashArray={itineraire.realistic ? null : "5, 5"}
                            />
                            <Marker
                                position={[zone.position.lat, zone.position.lng]}
                                icon={zoneIcon}
                            >
                                <Popup>
                                    <div className="popup-content zone-recommended">
                                        <h4>🎯 {itineraire.zoneNom}</h4>
                                        <div className="popup-stats">
                                            <div className="popup-stat">
                                                <strong>{t('common.distance')}:</strong> {itineraire.distance} km
                                            </div>
                                            <div className="popup-stat">
                                                <strong>{t('common.estimatedTime')}:</strong> {itineraire.tempsEstime} min
                                            </div>
                                            <div className="popup-stat">
                                                <strong>{t('common.order')}:</strong> #{itineraire.ordre}
                                            </div>
                                            <div className="popup-stat">
                                                <strong>{t('common.type')}:</strong> 
                                                <span className={`route-type ${itineraire.realistic ? 'realistic' : 'straight'}`}>
                                                    {itineraire.realistic ? t('map.realRoute') : t('map.directLine')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        </div>
                    );
                })}

                {/* Cercles de heatmap */}
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
                        eventHandlers={{
                            click: (e) => {
                                onCreateZone && onCreateZone({
                                    latlng: { lat: zone.latitude, lng: zone.longitude },
                                    zoneName: zone.zone,
                                    position: { x: e.originalEvent.clientX, y: e.originalEvent.clientY }
                                });
                            },
                            mouseover: (e) => {
                                e.target.openPopup();
                                onZoneHover && onZoneHover(zone, e);
                            },
                            mouseout: () => onZoneLeave && onZoneLeave()
                        }}
                    >
                        <Popup>
                            <div className="popup-content predictive">
                                <h4>🎯 {zone.zone}</h4>
                                <div className="popup-stats">
                                    <div className="popup-stat">
                                        <strong>{t('common.prediction')}:</strong>
                                        <div className="prediction-text">{zone.prediction}</div>
                                    </div>
                                    <div className="popup-stat">
                                        <strong>{t('common.recommendationLevel')}:</strong>
                                        <span>{zone.demand}%</span>
                                    </div>
                                    <div className="popup-stat">
                                        <strong>{t('common.averageRevenue')}:</strong>
                                        {new Intl.NumberFormat('fr-FR').format(zone.revenu_moyen || 0)} Ar
                                    </div>
                                    <div className="popup-stat">
                                        <strong>{t('common.recommendation')}:</strong>
                                        <div className="recommendation-text">{zone.recommendation}</div>
                                    </div>
                                </div>
                                <div className="popup-actions">
                                    <button 
                                        className="btn-analyze-zone" 
                                        onClick={() => onZoneClick && onZoneClick(zone.zone)}
                                    >
                                        <FaSearch /> {t('actions.analyzeZone')}
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
};

// COMPOSANT: Vue des itinéraires
const RoutesView = ({ 
    driverData, 
    loading, 
    onZoneHover, 
    onZoneLeave, 
    onRefreshRoutes,
    onUpdateDriverPosition,
    t 
}) => {
    // Fonction pour obtenir des données par défaut sécurisées
    const getDefaultRoutesData = () => {
        const defaultPosition = { lat: -18.8792, lng: 47.5079 };
        
        const defaultZones = [
            {
                id: 1,
                nom: "Analakely",
                position: { lat: -18.9086, lng: 47.5258 },
                demande: 15,
                tarifMoyen: 12000,
                score: 85
            },
            {
                id: 2,
                nom: "Ivandry", 
                position: { lat: -18.8780, lng: 47.5210 },
                demande: 12,
                tarifMoyen: 15000,
                score: 75
            },
            {
                id: 3,
                nom: "Antanimena",
                position: { lat: -18.8900, lng: 47.5150 },
                demande: 10,
                tarifMoyen: 11000,
                score: 65
            }
        ];

        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        };

        const defaultItineraires = defaultZones.map((zone, index) => {
            const distance = calculateDistance(
                defaultPosition.lat, defaultPosition.lng,
                zone.position.lat, zone.position.lng
            );
            
            return {
                zoneId: zone.id,
                zoneNom: zone.nom,
                distance: distance.toFixed(1),
                tempsEstime: Math.round(distance * 4),
                points: [
                    [defaultPosition.lat, defaultPosition.lng],
                    [zone.position.lat, zone.position.lng]
                ],
                ordre: index + 1,
                realistic: false
            };
        });

        return {
            chauffeur: {
                id: 1,
                nom: "Vous",
                position: defaultPosition,
                statut: "en service"
            },
            position: defaultPosition,
            zonesRecommandees: defaultZones,
            itineraires: defaultItineraires,
            lastUpdated: new Date().toISOString(),
            default_data: true,
            note: "Données de démonstration"
        };
    };

    // Utiliser les données fournies ou les données par défaut
    const displayData = driverData || getDefaultRoutesData();
    const isDefaultData = displayData.default_data === true;
    
    // S'assurer que position est définie
    const position = displayData.position || displayData.chauffeur?.position || { lat: -18.8792, lng: 47.5079 };
    
    if (loading) {
        return (
            <div className="routes-view loading">
                <div className="loading-spinner"></div>
                <p>{t('routes.calculatingRoutes')}</p>
            </div>
        );
    }

    return (
        <div className="routes-view">
            {/* Avertissement si données par défaut */}
            {isDefaultData && (
                <div className="default-data-warning">
                    <FaExclamationTriangle className="warning-icon" />
                    <span>
                        📍 Utilisation de données de démonstration. 
                        <button 
                            className="btn-refresh-inline" 
                            onClick={onRefreshRoutes}
                        >
                            Cliquez pour actualiser
                        </button>
                    </span>
                </div>
            )}
            
            {/* Carte des itinéraires */}
            <div className="routes-map-container">
                <MapContainer 
                    center={[position.lat, position.lng]}
                    zoom={14} 
                    style={{ height: '400px', width: '100%', borderRadius: '8px' }}
                    className="routes-map"
                >
                    <TileLayer 
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* Marqueur du chauffeur */}
                    <Marker
                        position={[position.lat, position.lng]}
                        icon={driverIcon}
                    >
                        <Popup>
                            <div className="popup-content driver">
                                <h4>🚗 {t('routes.yourPosition')}</h4>
                                {isDefaultData && (
                                    <p className="default-data-note">
                                        <small>📍 Position de démonstration</small>
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>

                    {/* Itinéraires */}
                    {displayData.itineraires && displayData.itineraires.map((itineraire, index) => {
                        const zone = displayData.zonesRecommandees?.find(z => z.id === itineraire.zoneId);
                        if (!zone || !itineraire.points || itineraire.points.length < 2) {
                            return null;
                        }

                        const routeColor = getRouteColor(zone.score || zone.demande);
                        
                        return (
                            <div key={itineraire.zoneId || index}>
                                <Polyline
                                    positions={itineraire.points}
                                    color={routeColor}
                                    weight={itineraire.realistic ? 6 : 4}
                                    opacity={0.8}
                                    dashArray={itineraire.realistic ? null : "5, 5"}
                                />
                                
                                <Marker
                                    position={[zone.position.lat, zone.position.lng]}
                                    icon={zoneIcon}
                                >
                                    <Popup>
                                        <div className="popup-content zone-route">
                                            <h4>🎯 {zone.nom}</h4>
                                            {isDefaultData && (
                                                <div className="default-data-badge">
                                                    <small>📍 Données de démonstration</small>
                                                </div>
                                            )}
                                            <div className="route-info">
                                                <div className="route-stat">
                                                    <strong>{t('routes.recommendationScore')}:</strong> 
                                                    <span className={`score-badge score-${Math.floor((zone.score || zone.demande) / 20)}`}>
                                                        {zone.score || zone.demande}%
                                                    </span>
                                                </div>
                                                <div className="route-stat">
                                                    <strong>{t('common.distance')}:</strong> {itineraire.distance} km
                                                </div>
                                                <div className="route-stat">
                                                    <strong>{t('common.estimatedTime')}:</strong> {itineraire.tempsEstime} min
                                                </div>
                                                <div className="route-stat">
                                                    <strong>{t('common.priority')}:</strong> #{index + 1}
                                                </div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            </div>
                        );
                    })}
                </MapContainer>
            </div>
            
            {/* INDICATEUR DE POSITION */}
            <div className="position-indicator">
                {position.source === 'last_course' && (
                    <div className="position-source last-course">
                        📍 Position: Dernière course terminée ({position.zone || 'Inconnue'})
                    </div>
                )}
                {position.source === 'last_arrival' && (
                    <div className="position-source last-arrival">
                        📍 Position: Dernière zone d'arrivée ({position.zone || 'Inconnue'})
                    </div>
                )}
                {position.source === 'default' || isDefaultData ? (
                    <div className="position-source fallback">
                        ⚠️ Position: Par défaut (Analakely) - {isDefaultData ? 'Données de démonstration' : 'Aucune course trouvée'}
                    </div>
                ) : null}
            </div>

            {/* Liste des itinéraires */}
            <div className="routes-list">
                <h4>📋 {t('routes.optimizedRoutes')}</h4>
                {isDefaultData && (
                    <div className="routes-note">
                        <small>Ces itinéraires sont basés sur des données de démonstration.</small>
                    </div>
                )}
                <div className="routes-grid">
                    {displayData.itineraires && displayData.itineraires.map((itineraire, index) => {
                        const zone = displayData.zonesRecommandees?.find(z => z.id === itineraire.zoneId);
                        if (!zone) return null;

                        const priorityClass = `priority-${Math.floor((zone.score || zone.demande) / 20)}`;
                        
                        return (
                            <div key={itineraire.zoneId || index} className={`route-card ${priorityClass}`}>
                                <div className="route-header">
                                    <div className="route-order">#{index + 1}</div>
                                    <div className="route-zone">{zone.nom}</div>
                                    <div className="route-score">
                                        <span className={`score-badge score-${Math.floor((zone.score || zone.demande) / 20)}`}>
                                            {zone.score || zone.demande}%
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="route-details">
                                    <div className="route-distance">
                                        <FaMapMarkerAlt /> {itineraire.distance} km
                                    </div>
                                    <div className="route-time">
                                        <FaClock /> {itineraire.tempsEstime} min
                                    </div>
                                    <div className="route-recommendation">
                                        <FaChartLine /> 
                                        {zone.score >= 80 ? t('routes.maxPriority') : 
                                         zone.score >= 60 ? t('routes.highPriority') : 
                                         zone.score >= 40 ? t('routes.mediumPriority') : t('routes.lowPriority')}
                                    </div>
                                </div>
                                {isDefaultData && (
                                    <div className="default-data-tag">
                                        <small>Données de démonstration</small>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bouton d'actualisation */}
            <div className="routes-actions">
                <button 
                    className="btn-refresh-routes" 
                    onClick={onRefreshRoutes}
                >
                    <FaCrosshairs /> {t('common.refreshRoutes')}
                </button>
            </div>
        </div>
    );
};

// COMPOSANT: Carte de chaleur actuelle
const GeographicHeatmap = ({ data, onZoneClick, onAddZone, selectedZone, onZoneHover, onZoneLeave, onMapClick, onMapLeave, onCreateZone, t }) => {
    const generateCurrentRecommendations = (heatmapData) => {
        if (!heatmapData || heatmapData.length === 0) {
            return [
                {
                    zone: "Analakely", latitude: -18.9100, longitude: 47.5250, demand: 85,
                    courses_heure: 12, revenu_moyen: 15000,
                    recommendation: t('recommendations.veryActiveZone')
                },
                {
                    zone: "Ivandry", latitude: -18.8800, longitude: 47.5300, demand: 65,
                    courses_heure: 8, revenu_moyen: 12000,
                    recommendation: t('recommendations.goodActivity')
                }
            ];
        }

        return heatmapData.map(zone => ({
            ...zone,
            recommendation: zone.demand >= 60 ? t('recommendations.recommendedZoneHigh') :
                           zone.demand >= 40 ? t('recommendations.recommendedZoneMedium') :
                           t('recommendations.secondaryZone')
        }));
    };

    const recommendations = generateCurrentRecommendations(data);
    const validData = recommendations.filter(zone => 
        zone && typeof zone.latitude === 'number' && typeof zone.longitude === 'number'
    );

    const hasActiveData = validData.some(zone => zone.demand > 0);
    const center = [-18.9000, 47.5200];

    const getHeatmapColor = (demand) => {
        if (demand >= 80) return '#ff4444';
        if (demand >= 60) return '#ffaa00';
        if (demand >= 40) return '#ffff00';
        if (demand > 0) return '#aaff00';
        return '#e0e0e0';
    };

    const getRadius = (demand) => demand === 0 ? 3 : Math.sqrt(demand) * 2.5;
    const getOpacity = (demand) => demand === 0 ? 0.4 : 0.7;

    return (
        <div className="geographic-heatmap-container">
            <div className="map-legend">
                <div className="legend-title">📊 {t('map.currentActivity')}</div>
                <div className="legend-items">
                    <div className="legend-item"><div className="legend-color high"></div><span>{t('map.recommended')}</span></div>
                    <div className="legend-item"><div className="legend-color medium"></div><span>{t('map.advised')}</span></div>
                    <div className="legend-item"><div className="legend-color low"></div><span>{t('map.secondary')}</span></div>
                    <div className="legend-item"><div className="legend-color very-low"></div><span>{t('map.low')}</span></div>
                    <div className="legend-item"><div className="legend-color inactive"></div><span>{t('map.inactive')}</span></div>
                </div>
            </div>

            {!hasActiveData && (
                <div className="no-activity-warning">
                    <FaExclamationTriangle className="warning-icon" />
                    <span>{t('messages.noActivityWithFilters')}</span>
                </div>
            )}
            
            <MapContainer center={center} zoom={13} style={{ height: '500px', width: '100%', borderRadius: '8px' }} className="heatmap-map interactive-map">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                <MapEventHandler onMapClick={onMapClick} onMapLeave={onMapLeave} />
                {validData.map((zone, index) => (
                    <CircleMarker
                        key={index}
                        center={[zone.latitude, zone.longitude]}
                        radius={getRadius(zone.demand)}
                        fillColor={getHeatmapColor(zone.demand)}
                        color="#333"
                        weight={zone.demand > 0 ? 1 : 0.5}
                        opacity={0.8}
                        fillOpacity={getOpacity(zone.demand)}
                        eventHandlers={{
                            click: (e) => {
                                onCreateZone && onCreateZone({
                                    latlng: { lat: zone.latitude, lng: zone.longitude },
                                    zoneName: zone.zone,
                                    position: { x: e.originalEvent.clientX, y: e.originalEvent.clientY }
                                });
                            },
                            mouseover: (e) => {
                                e.target.openPopup();
                                onZoneHover && onZoneHover(zone, e);
                            },
                            mouseout: () => onZoneLeave && onZoneLeave()
                        }}
                    >
                        <Popup>
                            <div className="popup-content">
                                <h4>📊 {zone.zone}</h4>
                                <div className="popup-stats">
                                    {zone.demand > 0 ? (
                                        <>
                                            <div className="popup-stat"><strong>{t('common.activity')}:</strong> {zone.demand}%</div>
                                            <div className="popup-stat"><strong>{t('common.ridesPerHour')}:</strong> {zone.courses_heure || 0}</div>
                                            <div className="popup-stat"><strong>{t('common.averageRevenue')}:</strong> {new Intl.NumberFormat('fr-FR').format(zone.revenu_moyen || 0)} Ar</div>
                                            <div className="popup-stat"><strong>{t('common.recommendation')}:</strong><div className="recommendation-text">{zone.recommendation}</div></div>
                                        </>
                                    ) : (
                                        <div className="popup-stat no-activity">
                                            <strong>📭 {t('common.noActivity')}</strong>
                                            <p>{t('messages.usePredictiveRecommendations')}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="popup-actions">
                                    <button className="btn-analyze-zone" onClick={() => onZoneClick && onZoneClick(zone.zone)}>
                                        <FaSearch /> {t('actions.analyzeZone')}
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
};

// COMPOSANT: Carte des réservations par zone - VERSION CORRIGÉE
const ReservationsZoneMap = ({ data, onZoneClick, onZoneHover, onZoneLeave, t }) => {
    // Fonctions de sécurisation
    const safeNumber = (value) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'object') return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    };
    
    const safeString = (value) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return '';
        return String(value);
    };

    // Vérification des données
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="reservations-map-container">
                <div className="map-legend">
                    <div className="legend-title">📊 {t?.('reservations.byZone', 'Réservations par zone')}</div>
                </div>
                <div className="no-data-message" style={{ textAlign: 'center', padding: '50px' }}>
                    <div className="no-data-icon" style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
                    <p>{t?.('reservations.noData', 'Aucune donnée de réservation disponible')}</p>
                </div>
            </div>
        );
    }

    // Filtrer les zones valides
    const validData = data.filter(zone => {
        const lat = zone?.latitude;
        const lng = zone?.longitude;
        return lat !== undefined && 
               lng !== undefined && 
               typeof lat !== 'object' && 
               typeof lng !== 'object' &&
               !isNaN(safeNumber(lat)) && 
               !isNaN(safeNumber(lng));
    });

    if (validData.length === 0) {
        return (
            <div className="reservations-map-container">
                <div className="map-legend">
                    <div className="legend-title">📊 {t?.('reservations.byZone', 'Réservations par zone')}</div>
                </div>
                <div className="no-data-message" style={{ textAlign: 'center', padding: '50px' }}>
                    <div className="no-data-icon" style={{ fontSize: '48px', marginBottom: '15px' }}>📍</div>
                    <p>{t?.('reservations.noValidZones', 'Aucune zone valide avec réservations')}</p>
                </div>
            </div>
        );
    }

    // Calculer le centre de la carte
    const center = [
        validData.reduce((sum, zone) => sum + safeNumber(zone.latitude), 0) / validData.length,
        validData.reduce((sum, zone) => sum + safeNumber(zone.longitude), 0) / validData.length
    ];

    const getReservationColor = (total) => {
        const totalNum = safeNumber(total);
        if (totalNum >= 10) return '#ff4444';
        if (totalNum >= 5) return '#ffaa00';
        if (totalNum >= 2) return '#44ff44';
        return '#4444ff';
    };

    const getRadius = (total) => Math.sqrt(Math.max(1, safeNumber(total))) * 8 + 8;

    return (
        <div className="reservations-map-container">
            <div className="map-legend">
                <div className="legend-title">📊 {t?.('reservations.byZone', 'Réservations par zone')}</div>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-color" style={{backgroundColor: '#ff4444'}}></div>
                        <span>{t?.('reservations.veryActive', 'Très actif')} (10+)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{backgroundColor: '#ffaa00'}}></div>
                        <span>{t?.('reservations.active', 'Actif')} (5-9)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{backgroundColor: '#44ff44'}}></div>
                        <span>{t?.('reservations.moderate', 'Modéré')} (2-4)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{backgroundColor: '#4444ff'}}></div>
                        <span>{t?.('reservations.low', 'Faible')} (1)</span>
                    </div>
                </div>
            </div>
            
            <MapContainer 
                center={center} 
                zoom={13} 
                style={{ height: '500px', width: '100%', borderRadius: '8px' }}
                className="reservations-map"
            >
                <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {validData.map((zone, index) => {
                    // CRITIQUE: Extraire toutes les valeurs AVANT de les utiliser
                    const rawZoneId = zone?.zone_id ?? zone?.id ?? (index + 1);
                    const zoneId = typeof rawZoneId === 'object' ? index + 1 : String(rawZoneId);
                    
                    const rawZoneName = zone?.nom ?? zone?.zone_name ?? `Zone ${zoneId}`;
                    const zoneName = typeof rawZoneName === 'object' ? `Zone ${zoneId}` : String(rawZoneName);
                    
                    const rawTotalReservations = zone?.total_reservations ?? 0;
                    const rawTotalDeparts = zone?.total_departs ?? 0;
                    const rawTotalArrivees = zone?.total_arrivees ?? 0;
                    
                    const totalReservations = safeNumber(rawTotalReservations) || 
                                              safeNumber(rawTotalDeparts) + safeNumber(rawTotalArrivees);
                    const departures = safeNumber(rawTotalDeparts);
                    const arrivals = safeNumber(rawTotalArrivees);
                    
                    const rawActivityScore = zone?.activity_score ?? Math.min(100, Math.round(totalReservations * 5));
                    const activityScore = safeNumber(rawActivityScore);
                    
                    const latitude = safeNumber(zone.latitude);
                    const longitude = safeNumber(zone.longitude);

                    return (
                        <CircleMarker
                            key={`zone_${zoneId}_${index}`}
                            center={[latitude, longitude]}
                            radius={getRadius(totalReservations)}
                            fillColor={getReservationColor(totalReservations)}
                            color="#333"
                            weight={1}
                            opacity={0.8}
                            fillOpacity={0.6}
                            eventHandlers={{
                                click: () => onZoneClick && onZoneClick(zone),
                                mouseover: (e) => {
                                    e.target.openPopup();
                                    onZoneHover && onZoneHover(zone, e);
                                },
                                mouseout: () => onZoneLeave && onZoneLeave()
                            }}
                        >
                            <Popup>
                                <div className="popup-content reservations">
                                    <h4>📍 {zoneName}</h4>
                                    <div className="popup-stats">
                                        <div className="popup-stat">
                                            <strong>{t?.('common.zone', 'Zone')} ID:</strong> {zoneId}
                                        </div>
                                        <div className="popup-stat">
                                            <strong>{t?.('reservations.total', 'Total')}:</strong> {totalReservations}
                                        </div>
                                        <div className="popup-stat">
                                            <strong>{t?.('reservations.departures', 'Départs')}:</strong> {departures}
                                        </div>
                                        <div className="popup-stat">
                                            <strong>{t?.('reservations.arrivals', 'Arrivées')}:</strong> {arrivals}
                                        </div>
                                        <div className="popup-stat">
                                            <strong>{t?.('reservations.activityScore', 'Score d\'activité')}:</strong> 
                                            <span className={`score-badge score-${Math.floor(activityScore / 20)}`}>
                                                {activityScore}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

// COMPOSANT: Liste des réservations par zone 
const ReservationsZoneList = ({ data, onZoneSelect, onZoneDelete, t }) => {
    // Vérification des données
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="reservations-zone-list">
                <div className="list-header">
                    <h4>{t?.('reservations.zonesWithReservations', 'Zones avec réservations')} (0)</h4>
                </div>
                <div className="no-reservations">
                    <div className="no-data-icon">📭</div>
                    <p>{t?.('reservations.noData', 'Aucune donnée de réservation disponible')}</p>
                </div>
            </div>
        );
    }

    // Fonctions de sécurisation
    const safeNumber = (value) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'object') return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    };
    
    const safeString = (value) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return '';
        return String(value);
    };

    // Fonction de confirmation de suppression
    const handleDelete = (zone, event) => {
        event.stopPropagation(); // Empêche le déclenchement du onClick parent
        
        const zoneName = zone?.nom || zone?.zone_name || `Zone ${zone?.zone_id || 'inconnue'}`;
        
        if (window.confirm(`🗑️ Êtes-vous sûr de vouloir supprimer "${zoneName}" de cette vue ?\n\nCette action est locale et n'affecte pas la base de données.`)) {
            onZoneDelete && onZoneDelete(zone);
        }
    };

    return (
        <div className="reservations-zone-list">
            <div className="list-header">
                <h4>{t?.('reservations.zonesWithReservations', 'Zones avec réservations')} ({data.length})</h4>
                {data.length > 0 && (
                    <button 
                        className="btn-clear-all"
                        onClick={() => {
                            if (window.confirm(`🗑️ Supprimer toutes les zones de cette vue (${data.length} zones) ?`)) {
                                onZoneDelete && onZoneDelete('all');
                            }
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#dc3545',
                            fontSize: '14px',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#ffe6e6';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }}
                    >
                        🗑️ {t?.('actions.clearAll', 'Tout supprimer')}
                    </button>
                )}
            </div>
            <div className="zones-grid">
                {data.map((zone, index) => {
                    const rawZoneId = zone?.zone_id ?? zone?.id ?? (index + 1);
                    const zoneId = typeof rawZoneId === 'object' ? String(index + 1) : safeString(rawZoneId);
                    
                    const rawZoneName = zone?.nom ?? zone?.zone_name ?? `Zone ${zoneId}`;
                    const zoneName = typeof rawZoneName === 'object' ? `Zone ${zoneId}` : safeString(rawZoneName);
                    
                    const rawTotalReservations = zone?.total_reservations ?? 0;
                    const rawTotalDeparts = zone?.total_departs ?? 0;
                    const rawTotalArrivees = zone?.total_arrivees ?? 0;
                    
                    const totalReservations = safeNumber(rawTotalReservations) || 
                                              safeNumber(rawTotalDeparts) + safeNumber(rawTotalArrivees);
                    const departures = safeNumber(rawTotalDeparts);
                    const arrivals = safeNumber(rawTotalArrivees);
                    
                    const rawActivityScore = zone?.activity_score ?? Math.min(100, Math.round(totalReservations * 5));
                    const activityScore = safeNumber(rawActivityScore);
                    
                    // Déterminer la classe de priorité
                    let priorityClass = '';
                    if (activityScore >= 80) priorityClass = 'priority-high';
                    else if (activityScore >= 60) priorityClass = 'priority-medium';
                    else if (activityScore >= 40) priorityClass = 'priority-low';
                    else priorityClass = 'priority-very-low';
                    
                    return (
                        <div 
                            key={`zone_${zoneId}_${index}`} 
                            className={`zone-card ${priorityClass}`}
                            style={{ position: 'relative' }}
                        >
                            {/* Bouton de suppression */}
                            <button
                                className="zone-delete-btn"
                                onClick={(e) => handleDelete(zone, e)}
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    background: 'rgba(220, 53, 69, 0.1)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '28px',
                                    height: '28px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    color: '#dc3545',
                                    transition: 'all 0.2s',
                                    zIndex: 10
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#dc3545';
                                    e.target.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(220, 53, 69, 0.1)';
                                    e.target.style.color = '#dc3545';
                                }}
                                title={t?.('actions.deleteZone', 'Supprimer cette zone de la vue')}
                            >
                                ✕
                            </button>
                            
                            {/* Zone cliquable pour voir les détails */}
                            <div 
                                className="zone-card-content"
                                onClick={() => onZoneSelect && onZoneSelect(zone)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="zone-card-header">
                                    <span className="zone-rank">#{index + 1}</span>
                                    <span className="zone-name">{zoneName}</span>
                                    <span className="zone-id">{t?.('common.zone', 'Zone')} ID: {zoneId}</span>
                                </div>
                                <div className="zone-stats">
                                    <div className="stat">
                                        <span className="stat-label">📊 {t?.('reservations.total', 'Total')}:</span>
                                        <span className="stat-value">{totalReservations}</span>
                                    </div>
                                    <div className="stat" style={{marginLeft: '-15px'}}>
                                        <span className="stat-label">📤 {t?.('reservations.departures', 'Départs')}:</span>
                                        <span className="stat-value">{departures}</span>
                                    </div>
                                    <div className="stat" style={{marginLeft: '-15px'}}>
                                        <span className="stat-label">📥 {t?.('reservations.arrivals', 'Arrivées')}:</span>
                                        <span className="stat-value">{arrivals}</span>
                                    </div>
                                </div>
                                <div className="zone-activity">
                                    <div className="activity-bar">
                                        <div 
                                            className="activity-fill" 
                                            style={{ width: `${Math.min(100, Math.max(0, activityScore))}%` }}
                                        ></div>
                                    </div>
                                    <span className="activity-score">
                                        {activityScore}% {t?.('common.activity', 'activité')}
                                        {activityScore >= 80 && ' 🔥'}
                                        {activityScore >= 60 && activityScore < 80 && ' 📈'}
                                        {activityScore >= 40 && activityScore < 60 && ' ✅'}
                                        {activityScore >= 20 && activityScore < 40 && ' 💡'}
                                        {activityScore < 20 && ' 💤'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Vue avancée de la heatmap
const AdvancedHeatmapView = ({ 
    view, 
    data, 
    loading, 
    onZoneClick, 
    onAddZone, 
    selectedZone, 
    onZoneHover, 
    onZoneLeave, 
    onMapClick, 
    onMapLeave, 
    onCreateZone,
    driverData,
    showDriverRoutes,
    setShowDriverRoutes,
    driverLoading,
    loadDriverData,
    handleUpdateDriverPosition,
    reservationsByZone: initialReservations,
    loadingReservations,
    showToast,
    t
}) => {
    // État local pour les réservations
    const [localReservations, setLocalReservations] = useState(initialReservations);
    
    // Mettre à jour l'état local quand les props changent
    useEffect(() => {
        setLocalReservations(initialReservations);
    }, [initialReservations]);
    
    // Fonction pour supprimer une zone
    const handleDeleteZone = (zoneToDelete) => {
        console.log('🗑️ Suppression demandée:', zoneToDelete);
        
        if (zoneToDelete === 'all') {
            // Supprimer toutes les zones
            console.log('🗑️ Suppression de toutes les zones');
            setLocalReservations([]);
            if (showToast) {
                showToast('🗑️ Toutes les zones ont été supprimées de la vue', false);
            }
        } else {
            // Supprimer une zone spécifique
            console.log('🗑️ Zone à supprimer:', zoneToDelete);
            
            // Vérifier l'ID de la zone
            const zoneId = zoneToDelete.zone_id || zoneToDelete.id;
            console.log('ID de la zone:', zoneId);
            
            // Filtrer les zones
            const updatedZones = localReservations.filter(zone => {
                const currentZoneId = zone.zone_id || zone.id;
                return currentZoneId !== zoneId;
            });
            
            console.log('Zones avant suppression:', localReservations.length);
            console.log('Zones après suppression:', updatedZones.length);
            
            // Mettre à jour l'état
            setLocalReservations(updatedZones);
            if (showToast) {
                showToast(`🗑️ Zone "${zoneToDelete.nom || zoneToDelete.zone_name}" supprimée de la vue`, false);
            }
        }
    };
    
    if (loading) {
        return (
            <div className="heatmap-loading">
                <div className="loading-spinner"></div>
                <p>{t('common.loadingMapData')}</p>
            </div>
        );
    }

    switch(view) {
        case 'predictive':
            return (
                <PredictiveGeographicHeatmap 
                    data={data.heatmapData} 
                    onZoneClick={onZoneClick} 
                    onAddZone={onAddZone} 
                    onZoneHover={onZoneHover} 
                    onZoneLeave={onZoneLeave} 
                    onMapClick={onMapClick} 
                    onMapLeave={onMapLeave} 
                    onCreateZone={onCreateZone}
                    driverData={driverData}
                    showDriverRoutes={showDriverRoutes}
                    setShowDriverRoutes={setShowDriverRoutes}
                    t={t}
                />
            );
        case 'current':
            return (
                <GeographicHeatmap 
                    data={data.heatmapData} 
                    onZoneClick={onZoneClick} 
                    onAddZone={onAddZone} 
                    selectedZone={selectedZone} 
                    onZoneHover={onZoneHover} 
                    onZoneLeave={onZoneLeave} 
                    onMapClick={onMapClick} 
                    onMapLeave={onMapLeave} 
                    onCreateZone={onCreateZone}
                    t={t}
                />
            );
        case 'routes':
            return (
                <RoutesView 
                    driverData={driverData}
                    loading={driverLoading}
                    onZoneHover={onZoneHover}
                    onZoneLeave={onZoneLeave}
                    onRefreshRoutes={loadDriverData}
                    onUpdateDriverPosition={handleUpdateDriverPosition}
                    t={t}
                />
            );
        case 'reservations':
            if (loadingReservations) {
                return (
                    <div className="heatmap-loading">
                        <div className="loading-spinner"></div>
                        <p>Chargement des réservations...</p>
                    </div>
                );
            }
            
            if (!localReservations || localReservations.length === 0) {
                return (
                    <div className="heatmap-loading">
                        <p>Aucune réservation trouvée</p>
                    </div>
                );
            }
            
            return (
                <div className="reservations-view" key={localReservations.length}>
                    <ReservationsZoneMap 
                        data={localReservations}
                        onZoneClick={onZoneClick}
                        onZoneHover={onZoneHover}
                        onZoneLeave={onZoneLeave}
                        t={t}
                    />
                    <ReservationsZoneList 
                        data={localReservations}
                        onZoneSelect={onZoneClick}
                        onZoneDelete={handleDeleteZone}
                        t={t}
                    />
                </div>
            );
        case 'alerts':
            return (
                <HotZoneAlerts 
                    data={data.hotZoneAlerts} 
                    onZoneClick={onZoneClick} 
                    onAddZone={onAddZone} 
                    onZoneHover={onZoneHover} 
                    onZoneLeave={onZoneLeave} 
                    t={t}
                />
            );
        default:
            return (
                <PredictiveGeographicHeatmap 
                    data={data.heatmapData} 
                    onZoneClick={onZoneClick} 
                    onAddZone={onAddZone} 
                    onZoneHover={onZoneHover} 
                    onZoneLeave={onZoneLeave} 
                    onMapClick={onMapClick} 
                    onMapLeave={onMapLeave} 
                    onCreateZone={onCreateZone}
                    driverData={driverData}
                    showDriverRoutes={showDriverRoutes}
                    setShowDriverRoutes={setShowDriverRoutes}
                    t={t}
                />
            );
    }
};

const getDefaultRoutesDataGlobal = () => {
    const defaultPosition = { lat: -18.8792, lng: 47.5079 };
    
    const defaultZones = [
        {
            id: 1,
            nom: "Analakely",
            position: { lat: -18.9086, lng: 47.5258 },
            demande: 15,
            tarifMoyen: 12000,
            score: 85
        },
        {
            id: 2,
            nom: "Ivandry", 
            position: { lat: -18.8780, lng: 47.5210 },
            demande: 12,
            tarifMoyen: 15000,
            score: 75
        },
        {
            id: 3,
            nom: "Antanimena",
            position: { lat: -18.8900, lng: 47.5150 },
            demande: 10,
            tarifMoyen: 11000,
            score: 65
        }
    ];

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const defaultItineraires = defaultZones.map((zone, index) => {
        const distance = calculateDistance(
            defaultPosition.lat, defaultPosition.lng,
            zone.position.lat, zone.position.lng
        );
        
        return {
            zoneId: zone.id,
            zoneNom: zone.nom,
            distance: distance.toFixed(1),
            tempsEstime: Math.round(distance * 4),
            points: [
                [defaultPosition.lat, defaultPosition.lng],
                [zone.position.lat, zone.position.lng]
            ],
            ordre: index + 1,
            realistic: false
        };
    });

    return {
        chauffeur: {
            id: 1,
            nom: "Vous",
            position: defaultPosition,
            statut: "en service"
        },
        zonesRecommandees: defaultZones,
        itineraires: defaultItineraires,
        lastUpdated: new Date().toISOString(),
        default_data: true,
        note: "Données de démonstration"
    };
};

// COMPOSANT: Analyse de zone
const ZoneAnalysis = ({ analysis, loading, t }) => {
    if (loading) {
        return (
            <div className="zone-analysis loading">
                <div className="loading-spinner"></div>
                <p>{t('common.analyzingZone')}</p>
            </div>
        );
    }
    
    if (!analysis) {
        return (
            <div className="zone-analysis no-selection">
                <div className="no-selection-icon">📍</div>
                <h4>{t('zoneAnalysis.noZoneSelected')}</h4>
                <p>{t('zoneAnalysis.clickOnMap')}</p>
                <div className="default-recommendation">
                    <h5>💡 {t('zoneAnalysis.generalRecommendation')}:</h5>
                    <p>{t('zoneAnalysis.positionInRedZones')}</p>
                </div>
            </div>
        );
    }

    const generateZoneRecommendation = (zoneData) => {
        const demand = zoneData.demand || zoneData.total_departs || 0;
        
        if (demand >= 80) {
            return { level: "high", text: t('zoneAnalysis.priorityZone'), details: t('zoneAnalysis.highDemandDetected') };
        } else if (demand >= 60) {
            return { level: "medium", text: t('zoneAnalysis.recommendedZone'), details: t('zoneAnalysis.stableDemand') };
        } else if (demand >= 40) {
            return { level: "low", text: t('zoneAnalysis.secondaryZone'), details: t('zoneAnalysis.moderateActivity') };
        } else {
            return { level: "very-low", text: t('zoneAnalysis.lowActivityZone'), details: t('zoneAnalysis.lowDemand') };
        }
    };

    const recommendation = generateZoneRecommendation(analysis);

    return (
        <div className="zone-analysis">
            <div className="zone-header">
                <h4>{analysis.zone}</h4>
                <div className="zone-stats-overview">
                    <div className="stat"><label>{t('common.departures')}</label><span>{analysis.total_departs || 0}</span></div>
                    <div className="stat"><label>{t('common.arrivals')}</label><span>{analysis.total_arrivees || 0}</span></div>
                </div>
            </div>

            <div className={`recommendation-banner ${recommendation.level}`}>
                <div className="recommendation-icon">
                    {recommendation.level === 'high' ? '🎯' : recommendation.level === 'medium' ? '✅' : recommendation.level === 'low' ? '💡' : '💤'}
                </div>
                <div className="recommendation-content">
                    <strong>{recommendation.text}</strong>
                    <p>{recommendation.details}</p>
                </div>
            </div>

            <div className="analysis-sections">
                <div className="analysis-section">
                    <h5>📊 {t('common.statistics')}</h5>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span>{t('metrics.averageDepartureRevenue')}</span>
                            <strong>{new Intl.NumberFormat('fr-FR').format(analysis.revenu_moyen_depart || 0)} Ar</strong>
                        </div>
                        <div className="stat-item">
                            <span>{t('metrics.averageArrivalRevenue')}</span>
                            <strong>{new Intl.NumberFormat('fr-FR').format(analysis.revenu_moyen_arrivee || 0)} Ar</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Composant Carte de Statistiques
const StatCard = ({ title, value, icon, color, suffix, onClick, t }) => (
    <div className={`stat-card stat-card-${color} compact`} onClick={onClick}>
        <div className="stat-icon">{icon}</div>
        <div className="stat-content">
            <h3>{title}</h3>
            <div className="stat-value">
                {value}
                {suffix && <span className="stat-suffix">{suffix}</span>}
            </div>
        </div>
    </div>
);

// COMPOSANT PRINCIPAL: Dashboard
const Dashboard = () => {
    const { language } = useLanguage();
    const navigate = useNavigate();
    const { formatCurrency, getCurrencySymbol } = useCurrency();
    
    // Chargement des traductions avec fallback
    const translations = { fr, en, mg };
    
    // Fonction de traduction sécurisée
    const t = (key, fallback = '') => {
        const keys = key.split('.');
        let translation = translations[language];
        
        for (const k of keys) {
            translation = translation?.[k];
            if (!translation) break;
        }
        
        return translation || fallback || key;
    };

    // États
    const [dashboardData, setDashboardData] = useState({
        general: { totalCourses: 0, coursesToday: 0, revenuTotal: 0, revenuMensuel: 0, clientsActifs: 0, chauffeursActifs: 0, coursesHeureActuelle: 0 },
        heatmapData: [],
        predictiveHeatmapData: [],
        topZones: [],
        performance: { tarif_moyen: 0, temps_attente_moyen: 0, courses_par_jour: 0, taux_acceptation_tarif: 0 },
        coursesByDay: [],
        coursesByTimeSlot: [],
        positioningSuggestions: { suggestions: [] },
        hotZoneAlerts: { alerts: [] }
    });
    
    const [loading, setLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [periode, setPeriode] = useState('month');
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [activeHeatmapView, setActiveHeatmapView] = useState('predictive');
    const [selectedZone, setSelectedZone] = useState(null);
    const [zoneAnalysis, setZoneAnalysis] = useState(null);
    const [heatmapFilters, setHeatmapFilters] = useState({ jour: getCurrentDay(), tranche: '' });
    const [peakHoursData, setPeakHoursData] = useState([]);
    const [hoveredZone, setHoveredZone] = useState(null);
    const [showZonePopup, setShowZonePopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const [popupZoneData, setPopupZoneData] = useState(null);
    const [mapHoverPopup, setMapHoverPopup] = useState(null);
    const [clickedLocation, setClickedLocation] = useState(null);
    const [locationName, setLocationName] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [driverData, setDriverData] = useState(null);
    const [driverLoading, setDriverLoading] = useState(false);
    const [showDriverRoutes, setShowDriverRoutes] = useState(false);
    const [createZonePopup, setCreateZonePopup] = useState(null);
    const [realTimeUpdates, setRealTimeUpdates] = useState(false);
    const [updateInterval, setUpdateInterval] = useState(null);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [selectedDate, setSelectedDate] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [driverAllCourses, setDriverAllCourses] = useState({
        totalCourses: 0,
        totalRevenue: 0,
        averageRevenue: 0,
        coursesToday: 0,
        courses: []
    });
    const [reservationsByZone, setReservationsByZone] = useState([]);
    const [loadingReservations, setLoadingReservations] = useState(false);
    const API_ZONES_URL = `${import.meta.env.VITE_API_URL}/apiZone/zones`;
    const [userQuota, setUserQuota] = useState({
        plan: 'basic',
        coursesLimit: 0,
        coursesUsed: 0,
        coursesRemaining: 0,
        features: [],
        loading: true
    });

    // Fonction pour récupérer les quotas depuis la base de données
    const fetchUserQuota = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('chauffeur') || localStorage.getItem('user');
            let currentChauffeurId = null;
            
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    currentChauffeurId = user.chauffeur_ID || user.id;
                } catch (e) {}
            }
            
            if (!token || !currentChauffeurId) {
                console.warn('⚠️ Token ou ID manquant');
                return {
                    plan: 'basic',
                    coursesLimit: 0,
                    coursesUsed: 0,
                    coursesRemaining: 0,
                    features: []
                };
            }

            console.log('📡 Récupération des quotas pour le chauffeur:', currentChauffeurId);

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/abonnements/quota`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.success) {
                const quotaData = response.data.data;
                
                console.log('✅ Quotas récupérés:', quotaData);
                
                localStorage.setItem('plan', quotaData.plan?.toLowerCase() || 'basic');
                localStorage.setItem('coursesRemaining', quotaData.coursesRemaining || 0);
                localStorage.setItem('coursesLimit', quotaData.coursesLimit || 0);
                
                return {
                    plan: quotaData.plan?.toLowerCase() || 'basic',
                    coursesLimit: quotaData.coursesLimit || 0,
                    coursesUsed: quotaData.coursesUsed || 0,
                    coursesRemaining: quotaData.coursesRemaining || 0,
                    features: quotaData.features || []
                };
            } else {
                throw new Error('Données de quota invalides');
            }
            
        } catch (error) {
            console.error('❌ Erreur récupération quotas:', error);
            if (isCorsOrNetworkError(error)) {
                console.warn('⚠️ Problème réseau/CORS détecté lors de la récupération des quotas.');
                showToast(t('errors.corsError', 'Erreur réseau ou CORS lors de la récupération des quotas'), true);
            }
            
            try {
                const token = localStorage.getItem('token');
                const subResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/abonnements/my-subscription`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (subResponse.data && subResponse.data.success) {
                    const subData = subResponse.data.data;
                    const plan = subData.plan?.toLowerCase() || 'basic';
                    
                    return {
                        plan: plan,
                        coursesLimit: subData.limits?.courses || (plan === 'basic' ? 10 : plan === 'pro' ? 50 : 100),
                        coursesUsed: subData.usage?.courses || 0,
                        coursesRemaining: subData.remaining?.courses || 0,
                        features: subData.features || []
                    };
                }
            } catch (subError) {
                console.error('❌ Fallback également en erreur:', subError);
            }
            
            return {
                plan: 'basic',
                coursesLimit: 10,
                coursesUsed: 0,
                coursesRemaining: 10,
                features: []
            };
        }
    };

    // Fonction pour vérifier si l'utilisateur peut accéder aux fonctionnalités avancées
    const canAccessAdvancedFeatures = () => {
        return userQuota.plan !== 'basic';
    };

    // Fonction pour afficher les toasts
    const showToast = (message, isError = false) => {
        setSuccessMessage(isError ? `❌ ${message}` : `✅ ${message}`);
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
    };

    const isCorsOrNetworkError = (error) => {
        return (!error?.response && error?.request) ||
               error?.message === 'Network Error' ||
               error?.code === 'ERR_NETWORK';
    };

    // Fonctions utilitaires pour les itinéraires
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const calculateEstimatedTime = (distance) => {
        const vitesseMoyenne = 30;
        return (distance / vitesseMoyenne) * 60;
    };

    // Fonction pour charger les données en temps réel
    const loadRealTimeDriverData = async () => {
        try {
            const chauffeurId = localStorage.getItem('chauffeurId') || '1';
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/dashboard/driver-realtime?chauffeurId=${chauffeurId}`
            );
            
            if (response.data.success) {
                setDriverData(response.data.data);
                setLastUpdateTime(new Date());
            }
        } catch (error) {
            console.error('❌', t('errors.realTimeUpdate'), error);
        }
    };

    // Démarrer/arrêter les mises à jour en temps réel
    const toggleRealTimeUpdates = (enabled) => {
        setRealTimeUpdates(enabled);
        
        if (enabled) {
            const interval = setInterval(() => {
                const userData = localStorage.getItem('chauffeur') || localStorage.getItem('user');
                let currentChauffeurId = null;
                
                if (userData) {
                    try {
                        const user = JSON.parse(userData);
                        currentChauffeurId = user.chauffeur_ID || user.id;
                    } catch (e) {}
                }
                
                if (currentChauffeurId) {
                    loadDriverData();
                }
            }, 30000);
            
            setUpdateInterval(interval);
            
            const userData = localStorage.getItem('chauffeur') || localStorage.getItem('user');
            if (userData) {
                loadDriverData();
            }
        } else if (updateInterval) {
            clearInterval(updateInterval);
            setUpdateInterval(null);
        }
    };

    const generateRoutePoints = (start, end, distance) => {
        const points = [[start.lat, start.lng]];
        
        if (distance > 1) {
            const steps = Math.min(Math.floor(distance * 2), 5);
            for (let i = 1; i <= steps; i++) {
                const ratio = i / (steps + 1);
                points.push([
                    start.lat + (end.lat - start.lat) * ratio,
                    start.lng + (end.lng - start.lng) * ratio
                ]);
            }
        }
        
        points.push([end.lat, end.lng]);
        return points;
    };
    
    const getDefaultRoutesDataForChauffeur = (chauffeurId, userData) => {
        let chauffeurNom = 'Chauffeur';
        let position = { lat: -18.8792, lng: 47.5079, zone: 'Analakely' };
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                chauffeurNom = user.nom || user.Nom || 'Chauffeur';
                
                if (parseInt(chauffeurId) === 2) {
                    position = { lat: -18.902211, lng: 47.525826, zone: 'Behoririka' };
                } else if (parseInt(chauffeurId) === 1) {
                    position = { lat: -18.919977, lng: 47.489262, zone: 'Ambaniala' };
                }
            } catch (e) {}
        }
        
        const defaultZones = [
            {
                id: 1,
                nom: "Analakely",
                position: { lat: -18.9086, lng: 47.5258 },
                demande: 15,
                tarifMoyen: 12000,
                score: 85,
                probabilite_course: 85,
                temps_attente_moyen: 3
            },
            {
                id: 2,
                nom: "Ivandry", 
                position: { lat: -18.8780, lng: 47.5210 },
                demande: 12,
                tarifMoyen: 15000,
                score: 75,
                probabilite_course: 75,
                temps_attente_moyen: 4
            },
            {
                id: 3,
                nom: "Antanimena",
                position: { lat: -18.8900, lng: 47.5150 },
                demande: 10,
                tarifMoyen: 11000,
                score: 65,
                probabilite_course: 65,
                temps_attente_moyen: 5
            }
        ];

        const defaultItineraires = defaultZones.map((zone, index) => {
            const distance = calculateDistance(
                position.lat, position.lng,
                zone.position.lat, zone.position.lng
            );
            
            return {
                zoneId: zone.id,
                zoneNom: zone.nom,
                distance: distance.toFixed(1),
                tempsEstime: Math.round(distance * 4),
                points: [
                    [position.lat, position.lng],
                    [zone.position.lat, zone.position.lng]
                ],
                ordre: index + 1,
                realistic: false,
                trafic: 'normal',
                conseil: 'Itinéraire direct'
            };
        });

        return {
            chauffeur: {
                id: parseInt(chauffeurId) || 1,
                nom: chauffeurNom,
                position: position,
                statut: "en service",
                vehicule: {
                    Immatriculation: "TAB-123",
                    Modele: "Toyota Corolla"
                }
            },
            position: position,
            zonesRecommandees: defaultZones,
            itineraires: defaultItineraires,
            statistiques: {
                courses_aujourd_hui: 5,
                revenu_aujourd_hui: 75000,
                temps_moyen_attente: 4,
                taux_occupation: 65
            },
            lastUpdated: new Date().toISOString(),
            default_data: true,
            note: "Données de démonstration"
        };
    };

    const loadAllDriverCourses = async () => {
        try {
            const userData = localStorage.getItem('chauffeur') || localStorage.getItem('user');
            let currentChauffeurId = null;
            
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    currentChauffeurId = user.chauffeur_ID || user.id;
                } catch (e) {}
            }
            
            if (!currentChauffeurId) {
                console.warn('⚠️ Aucun chauffeur connecté');
                return;
            }
            
            console.log('📋 CHARGEMENT TOUTES LES COURSES DU CHAUFFEUR:', {
                chauffeurId: currentChauffeurId
            });
            
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/dashboard/all-driver-courses?chauffeurId=${currentChauffeurId}`
            );
            
            if (response.data.success) {
                const coursesData = response.data.data;
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const coursesToday = (coursesData.courses || []).filter(course => {
                    const courseDate = new Date(course.Heure_depart);
                    courseDate.setHours(0, 0, 0, 0);
                    return courseDate.getTime() === today.getTime();
                }).length;
                
                let averageRevenue = 0;
                if (coursesData.totalCourses > 0 && coursesData.totalRevenue > 0) {
                    averageRevenue = coursesData.totalRevenue / coursesData.totalCourses;
                }
                
                setDriverAllCourses({
                    totalCourses: coursesData.totalCourses || 0,
                    totalRevenue: coursesData.totalRevenue || 0,
                    averageRevenue: averageRevenue,
                    courses: coursesData.courses || [],
                    coursesToday: coursesToday
                });
                
                console.log('✅ STATS CHAUFFEUR CHARGÉES:', {
                    totalCourses: coursesData.totalCourses,
                    coursesToday: coursesToday,
                    totalRevenue: coursesData.totalRevenue,
                    averageRevenue: averageRevenue,
                    chauffeur: currentChauffeurId
                });
            }
        } catch (error) {
            console.error('❌ Erreur chargement toutes courses:', error);
        }
    };

const loadReservationsByZone = async () => {
    try {
        setLoadingReservations(true);
        
        console.log('📡 Chargement des réservations par zone...');
        
        // Récupérer les réservations
        const reservationsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/reservations`);
        console.log('Réponse API réservations:', reservationsResponse.data);
        
        if (!reservationsResponse.data || !reservationsResponse.data.success) {
            throw new Error('Impossible de récupérer les réservations');
        }
        
        const reservations = reservationsResponse.data.data || [];
        console.log(`✅ ${reservations.length} réservations récupérées`);
        
        if (reservations.length === 0) {
            console.log('⚠️ Aucune réservation trouvée');
            setReservationsByZone([]);
            setLoadingReservations(false);
            return;
        }
        
        // Récupérer les zones - ADAPTATION IMPORTANTE
        const zonesResponse = await axios.get(`${API_ZONES_URL}`);
        console.log('Réponse API zones:', zonesResponse.data);
        
        // Le backend retourne directement un tableau de zones
        let zones = [];
        if (Array.isArray(zonesResponse.data)) {
            zones = zonesResponse.data;
        } else if (zonesResponse.data && zonesResponse.data.data && Array.isArray(zonesResponse.data.data)) {
            zones = zonesResponse.data.data;
        } else {
            console.warn('Format de réponse des zones inattendu:', zonesResponse.data);
            zones = [];
        }
        
        console.log(`✅ ${zones.length} zones récupérées`);
        
        // Créer un map des zones avec leurs coordonnées
        const zonesMap = new Map();
        zones.forEach(zone => {
            // Adapter selon la structure retournée par le backend
            const zoneId = zone.zone_ID || zone.id;
            const zoneNom = zone.Nom || zone.nom;
            const zoneLat = zone.Latitude || zone.latitude;
            const zoneLng = zone.Longitude || zone.longitude;
            
            if (zoneId) {
                zonesMap.set(parseInt(zoneId), {
                    id: parseInt(zoneId),
                    nom: zoneNom,
                    latitude: parseFloat(zoneLat) || -18.9000,
                    longitude: parseFloat(zoneLng) || 47.5200
                });
            }
        });
        
        console.log('Map des zones créée, IDs disponibles:', Array.from(zonesMap.keys()));
        
        // Grouper les réservations par zone
        const resultMap = new Map();
        
        reservations.forEach(res => {
            const zoneDepartId = parseInt(res.zone_id);
            const zoneArriveeId = parseInt(res.zone_id_arrive_de);
            
            console.log(`Réservation ${res.reserv_ID}: départ=${zoneDepartId}, arrivée=${zoneArriveeId}`);
            
            // Traiter la zone de départ
            if (zoneDepartId && zonesMap.has(zoneDepartId)) {
                const zone = zonesMap.get(zoneDepartId);
                if (!resultMap.has(zoneDepartId)) {
                    resultMap.set(zoneDepartId, {
                        zone_id: zoneDepartId,
                        nom: zone.nom,
                        latitude: zone.latitude,
                        longitude: zone.longitude,
                        total_departs: 0,
                        total_arrivees: 0,
                        total_reservations: 0,
                        reservations: []
                    });
                }
                const zoneData = resultMap.get(zoneDepartId);
                zoneData.total_departs++;
                zoneData.total_reservations++;
                zoneData.reservations.push({
                    id: res.reserv_ID,
                    type: 'depart',
                    date: res.date_voyage,
                    nbr_passager: res.nbr_passager,
                    status: res.status_reservation
                });
            } else if (zoneDepartId) {
                console.warn(`⚠️ Zone départ ${zoneDepartId} non trouvée dans la map`);
            }
            
            // Traiter la zone d'arrivée
            if (zoneArriveeId && zoneArriveeId !== zoneDepartId && zonesMap.has(zoneArriveeId)) {
                const zone = zonesMap.get(zoneArriveeId);
                if (!resultMap.has(zoneArriveeId)) {
                    resultMap.set(zoneArriveeId, {
                        zone_id: zoneArriveeId,
                        nom: zone.nom,
                        latitude: zone.latitude,
                        longitude: zone.longitude,
                        total_departs: 0,
                        total_arrivees: 0,
                        total_reservations: 0,
                        reservations: []
                    });
                }
                const zoneData = resultMap.get(zoneArriveeId);
                zoneData.total_arrivees++;
                zoneData.total_reservations++;
                zoneData.reservations.push({
                    id: res.reserv_ID,
                    type: 'arrivee',
                    date: res.date_voyage,
                    nbr_passager: res.nbr_passager,
                    status: res.status_reservation
                });
            } else if (zoneArriveeId) {
                console.warn(`⚠️ Zone arrivée ${zoneArriveeId} non trouvée dans la map`);
            }
        });
        
        // Convertir en tableau et ajouter les statistiques
        const zonesArray = Array.from(resultMap.values()).map(zone => ({
            ...zone,
            total_reservations: zone.total_reservations || 0,
            total_departs: zone.total_departs || 0,
            total_arrivees: zone.total_arrivees || 0,
            activity_score: Math.min(100, Math.round(((zone.total_departs || 0) + (zone.total_arrivees || 0)) * 5))
        }));
        
        // Trier par total_reservations décroissant
        zonesArray.sort((a, b) => (b.total_reservations || 0) - (a.total_reservations || 0));
        
        console.log('✅ Données de réservation par zone préparées:', zonesArray);
        console.log(`📊 ${zonesArray.length} zones avec activité`);
        
        zonesArray.forEach(zone => {
            console.log(`   - ${zone.nom}: ${zone.total_reservations} réservations (${zone.total_departs} départs, ${zone.total_arrivees} arrivées)`);
        });
        
        setReservationsByZone(zonesArray);
        setLoadingReservations(false);
        
    } catch (error) {
        console.error('❌ Erreur chargement réservations:', error);
        
        // Données de secours
        const mockZones = [
            { zone_id: 5, nom: "Ambodivona", latitude: -18.89295392223461, longitude: 47.5294303894043, total_departs: 1, total_arrivees: 1, total_reservations: 2, activity_score: 10 },
            { zone_id: 6, nom: "Andranomena", latitude: -18.85184312519605, longitude: 47.47913360595704, total_departs: 0, total_arrivees: 3, total_reservations: 3, activity_score: 15 },
            { zone_id: 9, nom: "Alarobia", latitude: -18.87149878572648, longitude: 47.52067565917969, total_departs: 1, total_arrivees: 1, total_reservations: 2, activity_score: 10 },
            { zone_id: 11, nom: "Andraisoro", latitude: -18.90544404268188, longitude: 47.55552291870117, total_departs: 0, total_arrivees: 1, total_reservations: 1, activity_score: 5 },
            { zone_id: 18, nom: "Ambodimita", latitude: -18.86825007514568, longitude: 47.48788833618165, total_departs: 3, total_arrivees: 1, total_reservations: 4, activity_score: 20 },
            { zone_id: 27, nom: "Ambohimanarina", latitude: -18.87498981038766, longitude: 47.50144958496094, total_departs: 0, total_arrivees: 2, total_reservations: 2, activity_score: 10 },
            { zone_id: 33, nom: "Ambaniala", latitude: -18.91997703479698, longitude: 47.48926162719727, total_departs: 2, total_arrivees: 1, total_reservations: 3, activity_score: 15 },
            { zone_id: 35, nom: "Ambodivoanjo", latitude: -18.87487687034272, longitude: 47.52986060480733, total_departs: 0, total_arrivees: 1, total_reservations: 1, activity_score: 5 },
            { zone_id: 40, nom: "Ambodihady", latitude: -18.87675179213093, longitude: 47.48853206634521, total_departs: 1, total_arrivees: 0, total_reservations: 1, activity_score: 5 },
            { zone_id: 43, nom: "Ambohibao", latitude: -18.85200430894772, longitude: 47.47904777526856, total_departs: 3, total_arrivees: 1, total_reservations: 4, activity_score: 20 }
        ];
        
        setReservationsByZone(mockZones);
        setLoadingReservations(false);
        
        showToast('⚠️ Utilisation des données de démonstration pour les réservations');
    }
};

    // Fonction complète loadDriverData avec gestion des quotas
    const loadDriverData = async (forceUpdate = false) => {
        try {
            setDriverLoading(true);
            
            const userData = localStorage.getItem('chauffeur') || localStorage.getItem('user');
            let currentChauffeurId = null;
            let userNom = 'Chauffeur';
            
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    currentChauffeurId = user.chauffeur_ID || user.id;
                    userNom = user.nom || user.Nom || 'Chauffeur';
                } catch (e) {
                    console.error('❌ Erreur parsing user data:', e);
                }
            }
            
            const quota = await fetchUserQuota();
            setUserQuota(prev => ({ ...prev, ...quota, loading: false }));

            if (quota.plan === 'basic') {
                const defaultData = getDefaultRoutesDataForChauffeur(currentChauffeurId, userData);
                defaultData.quota = {
                    plan: quota.plan,
                    coursesRemaining: quota.coursesRemaining,
                    coursesLimit: quota.coursesLimit,
                    coursesUsed: quota.coursesUsed
                };
                defaultData.message = "Version BASIC - Passez à Premium pour plus de fonctionnalités";
                setDriverData(defaultData);
                setDriverLoading(false);
                return;
            }
            
            if (!currentChauffeurId) {
                console.warn('⚠️ Aucun chauffeur connecté');
                setDriverData(getDefaultRoutesDataGlobal());
                setDriverLoading(false);
                return;
            }

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/dashboard/driver-realtime?chauffeurId=${currentChauffeurId}`
                );

                if (response.data && response.data.success) {
                    const driverDataResponse = response.data.data;
                    
                    const chauffeurIdFromData = driverDataResponse.chauffeur_id || driverDataResponse.chauffeur?.id;
                    
                    if (chauffeurIdFromData && parseInt(chauffeurIdFromData) !== parseInt(currentChauffeurId)) {
                        console.warn('⚠️ Données pour un autre chauffeur reçues:', {
                            attendu: currentChauffeurId,
                            reçu: chauffeurIdFromData
                        });
                        
                        const defaultData = getDefaultRoutesDataForChauffeur(currentChauffeurId, userData);
                        defaultData.quota = quota;
                        defaultData.error = "Données non disponibles pour ce chauffeur";
                        setDriverData(defaultData);
                        setDriverLoading(false);
                        return;
                    }
                    
                    const formattedData = {
                        chauffeur_id: parseInt(currentChauffeurId),
                        chauffeur: {
                            id: parseInt(currentChauffeurId),
                            nom: userNom,
                            plan: quota.plan,
                            coursesRemaining: quota.coursesRemaining,
                            position: {
                                lat: parseFloat(driverDataResponse.chauffeur?.position?.lat || driverDataResponse.position?.lat || -18.8792),
                                lng: parseFloat(driverDataResponse.chauffeur?.position?.lng || driverDataResponse.position?.lng || 47.5079),
                                zone: driverDataResponse.chauffeur?.position?.zone || driverDataResponse.position?.zone || 'Position dynamique',
                                source: driverDataResponse.chauffeur?.position?.source || driverDataResponse.position?.source || 'dynamic'
                            },
                            statut: driverDataResponse.chauffeur?.statut || driverDataResponse.statut || 'en service',
                            vehicule: driverDataResponse.chauffeur?.vehicule || driverDataResponse.vehicule || {
                                Immatriculation: "Non disponible",
                                Modele: "Non disponible"
                            }
                        },
                        position: {
                            lat: parseFloat(driverDataResponse.chauffeur?.position?.lat || driverDataResponse.position?.lat || -18.8792),
                            lng: parseFloat(driverDataResponse.chauffeur?.position?.lng || driverDataResponse.position?.lng || 47.5079),
                            zone: driverDataResponse.chauffeur?.position?.zone || driverDataResponse.position?.zone || 'Position dynamique',
                            source: driverDataResponse.chauffeur?.position?.source || driverDataResponse.position?.source || 'dynamic',
                            course_id: driverDataResponse.position_info?.course_id,
                            horodatage: driverDataResponse.position_info?.timestamp || new Date().toISOString()
                        },
                        zonesRecommandees: (driverDataResponse.zonesRecommandees || driverDataResponse.zones_recommandees || []).map(zone => ({
                            id: parseInt(zone.id) || 0,
                            nom: zone.nom || zone.zone_name || 'Zone inconnue',
                            position: {
                                lat: parseFloat(zone.position?.lat || zone.latitude || -18.9086),
                                lng: parseFloat(zone.position?.lng || zone.longitude || 47.5258)
                            },
                            distance: parseFloat(zone.distance) || 0,
                            demande: parseInt(zone.demande || zone.demand || 0),
                            tarifMoyen: parseInt(zone.tarifMoyen || zone.revenu_moyen || 0),
                            score: parseInt(zone.score || zone.demand_score || 0),
                            temps_attente_moyen: zone.temps_attente_moyen || 5,
                            probabilite_course: zone.probabilite_course || 75,
                            revenu_potentiel: zone.revenu_potentiel || 0,
                            courses_heure: zone.courses_heure || 0,
                        })),
                        itineraires: (driverDataResponse.itineraires || driverDataResponse.routes || []).map(itineraire => ({
                            zoneId: itineraire.zoneId || itineraire.zone_id,
                            zoneNom: itineraire.zoneNom || itineraire.zone_name || 'Inconnu',
                            distance: parseFloat(itineraire.distance).toString() || "0",
                            tempsEstime: parseInt(itineraire.tempsEstime || itineraire.estimated_time || 0),
                            points: Array.isArray(itineraire.points) ? itineraire.points : [],
                            ordre: parseInt(itineraire.ordre || itineraire.order || 0),
                            realistic: Boolean(itineraire.realistic || itineraire.is_realistic),
                            type: itineraire.type || 'optimized',
                            trafic: itineraire.traffic || 'normal',
                            conseil: itineraire.conseil || 'Itinéraire optimisé'
                        })),
                        statistiques: {
                            courses_aujourd_hui: driverDataResponse.stats?.courses_today || 0,
                            revenu_aujourd_hui: driverDataResponse.stats?.revenue_today || 0,
                            temps_moyen_attente: driverDataResponse.stats?.avg_wait_time || 0,
                            taux_occupation: driverDataResponse.stats?.occupation_rate || 0,
                            zones_plus_rentables: driverDataResponse.stats?.top_zones || []
                        },
                        quota: {
                            plan: quota.plan,
                            coursesRemaining: quota.coursesRemaining,
                            coursesLimit: quota.coursesLimit,
                            coursesUsed: quota.coursesUsed
                        },
                        lastUpdated: driverDataResponse.lastUpdated || new Date().toISOString(),
                        position_info: driverDataResponse.position_info || {},
                        algorithm_version: driverDataResponse.algorithm_version || "premium_v2",
                        for_current_driver: true,
                        premium_features: true
                    };
                    
                    setDriverData(formattedData);
                    
                } else {
                    throw new Error('Impossible de récupérer les données');
                }
                
            } catch (apiError) {
                console.error('❌ Erreur API loadDriverData:', apiError);
                
                const defaultData = getDefaultRoutesDataForChauffeur(currentChauffeurId, userData);
                defaultData.quota = quota;
                defaultData.error = "Erreur de connexion - Données de démonstration";
                defaultData.premium_features = quota.plan !== 'basic';
                
                setDriverData(defaultData);
                showToast('⚠️ Données de démonstration - Vérifiez la connexion serveur');
            }
            
        } catch (error) {
            console.error('❌ Erreur globale loadDriverData:', error);
            
            const userData = localStorage.getItem('chauffeur') || localStorage.getItem('user');
            let currentChauffeurId = null;
            
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    currentChauffeurId = user.chauffeur_ID || user.id;
                } catch (e) {}
            }
            
            const defaultData = getDefaultRoutesDataForChauffeur(currentChauffeurId, userData);
            defaultData.quota = {
                plan: 'basic',
                coursesRemaining: 10,
                coursesLimit: 10,
                coursesUsed: 0
            };
            defaultData.error = "Erreur de chargement - Mode dégradé";
            
            setDriverData(defaultData);
            showToast('⚠️ Mode dégradé - Erreur de chargement', true);
            
        } finally {
            setDriverLoading(false);
        }
    };

    const handleUpdateDriverPosition = async () => {
        try {
            setDriverLoading(true);
            
            if (!driverData || !driverData.position) {
                return;
            }
            
            await loadDriverData();
            
        } catch (error) {
            console.error('❌', t('errors.updatingPosition'), error);
            showToast(t('errors.updatingPosition'), true);
        } finally {
            setDriverLoading(false);
        }
    };

    // Fonction pour créer une zone depuis un marqueur
    const handleCreateZoneFromMarker = (zoneData) => {
        setCreateZonePopup(zoneData);
        setLocationName(zoneData.zoneName || '');
    };

    const handleCloseCreateZonePopup = () => {
        setCreateZonePopup(null);
        setLocationName('');
    };

    const handleCreateZoneFromPopup = async () => {
        if (!createZonePopup || !locationName.trim()) return;
        
        try {
            const zoneExists = await checkIfZoneExists(locationName);
            if (zoneExists) {
                showToast(t('errors.zoneAlreadyExists', { zone: locationName }), true);
                return;
            }

            navigate(`/carte-service?nom=${encodeURIComponent(locationName)}&lat=${createZonePopup.latlng.lat}&lng=${createZonePopup.latlng.lng}`);
        } catch (error) {
            console.error(t('errors.creatingZone'), error);
            showToast(t('errors.creatingZone'), true);
        }
    };

    const handleDateChange = async (date) => {
        setSelectedDate(date);
        try {
            setLoading(true);
            const formattedDate = `${date.year}-${date.month.toString().padStart(2, '0')}`;
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/courses-by-day?month=${formattedDate}`);
            if (response.data.success) {
                setDashboardData(prev => ({ ...prev, coursesByDay: response.data.data }));
            }
        } catch (error) {
            console.error('❌', t('errors.loadingDateData'), error);
            const defaultData = generateDefaultDataForMonth(date.month, date.year);
            setDashboardData(prev => ({ ...prev, coursesByDay: defaultData }));
        } finally {
            setLoading(false);
        }
    };

    const generateDefaultDataForMonth = (month, year) => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const data = [];
        for (let day = 1; day <= daysInMonth; day++) {
            data.push({ date: day.toString().padStart(2, '0'), courses: 0, fullDate: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}` });
        }
        return data;
    };

    const checkIfZoneExists = async (zoneName) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/apiZone/zones`);
            const zones = response.data;
            return zones.some(zone => zone.nom.toLowerCase() === zoneName.toLowerCase());
        } catch (error) {
            console.error(t('errors.checkingZone'), error);
            return false;
        }
    };

    const geocodeLocation = async (lat, lng) => {
        try {
            setIsGeocoding(true);
            const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            if (response.data) {
                const address = response.data.address;
                let locationName = '';
                if (address.road && address.city) locationName = `${address.road}, ${address.city}`;
                else if (address.quarter && address.city) locationName = `${address.quarter}, ${address.city}`;
                else if (address.suburb && address.city) locationName = `${address.suburb}, ${address.city}`;
                else if (address.city) locationName = address.city;
                else if (address.town) locationName = address.town;
                else if (address.village) locationName = address.village;
                else if (address.municipality) locationName = address.municipality;
                else if (address.county) locationName = address.county;
                else locationName = `${t('common.zone')}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
                
                setLocationName(locationName);
                return locationName;
            }
        } catch (error) {
            console.error(t('errors.geocoding'), error);
            const defaultName = `${t('common.zone')}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
            setLocationName(defaultName);
            return defaultName;
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleAddZoneFromDashboard = async (zoneData) => {
        try {
            const zoneExists = await checkIfZoneExists(zoneData.zone);
            if (zoneExists) {
                showToast(t('errors.zoneAlreadyExists', { zone: zoneData.zone }), true);
                return;
            }
            navigate(`/carte-service?nom=${encodeURIComponent(zoneData.zone)}&lat=${zoneData.latitude}&lng=${zoneData.longitude}`);
        } catch (error) {
            console.error(t('errors.addingZone'), error);
            showToast(t('errors.addingZone'), true);
        }
    };

    const handleAddZoneFromMap = async (latlng, customName = null) => {
        try {
            let zoneName = customName;
            if (!zoneName) zoneName = await geocodeLocation(latlng.lat, latlng.lng);
            navigate(`/carte-service?nom=${encodeURIComponent(zoneName)}&lat=${latlng.lat}&lng=${latlng.lng}`);
        } catch (error) {
            console.error(t('errors.addingZoneFromMap'), error);
            showToast(t('errors.addingZoneFromMap'), true);
        }
    };

    const handleMapClick = (latlng, event) => {
        setClickedLocation(latlng);
        geocodeLocation(latlng.lat, latlng.lng);
        setMapHoverPopup({ latlng: latlng, position: { x: event.originalEvent.clientX, y: event.originalEvent.clientY }, type: 'click' });
    };

    const handleMapHover = (latlng, event) => {};

    const handleMapLeave = () => {
        if (!clickedLocation) setMapHoverPopup(null);
    };

    const handleCloseCreatePopup = () => {
        setMapHoverPopup(null);
        setClickedLocation(null);
        setLocationName('');
    };

    const handleZoneNameHover = (zone, event) => {
        setHoveredZone(zone);
        setPopupZoneData(zone);
        setPopupPosition({ x: event.clientX, y: event.clientY });
        setShowZonePopup(true);
    };

    const handleZoneNameLeave = () => {
        setShowZonePopup(false);
        setHoveredZone(null);
    };

    const handleShowRoutesToggle = (checked) => {
        setShowDriverRoutes(checked);
    };

    // Charger les données principales
    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setDataLoaded(false);
            const periodMap = { jour: 'week', semaine: 'week', mois: 'month', annee: 'year' };
            const graphqlPeriod = periodMap[periode] || 'week';
            const stat = await fetchDriverDashboardStat(graphqlPeriod);

            const data = {
                general: {
                    totalCourses: stat?.nbRide || 0,
                    coursesToday: stat?.nbRide || 0,
                    revenuTotal: stat?.revenue || 0,
                    revenuMensuel: stat?.revenue || 0,
                    totalDistance: stat?.totalDistance || 0,
                    clientsActifs: 0,
                    chauffeursActifs: 1,
                    coursesHeureActuelle: 0,
                },
                chartData: stat?.chartData || [],
                heatmapData: [],
            };
            const positioningSuggestions = generatePositioningSuggestions(data.heatmapData, {}, t);
            const hotZoneAlerts = generateHotZoneAlerts(data.heatmapData, data.general, t);

            setDashboardData({ ...data, positioningSuggestions, hotZoneAlerts });
            await loadFilteredHeatmap(getCurrentDay(), '');
            setDataLoaded(true);
        } catch (error) {
            console.error('❌', t('errors.loadingDashboard'), error);
            const defaultHeatmapData = [
                { zone: "Analakely", latitude: -18.9100, longitude: 47.5250, demand: 85, courses_heure: 12, revenu_moyen: 15000, total_departs: 15, total_arrivees: 10 },
                { zone: "Ivandry", latitude: -18.8800, longitude: 47.5300, demand: 65, courses_heure: 8, revenu_moyen: 12000, total_departs: 8, total_arrivees: 6 }
            ];
            const defaultGeneral = { totalCourses: 17, coursesToday: 8, revenuTotal: 283002, revenuMensuel: 183002, clientsActifs: 4, chauffeursActifs: 1, coursesHeureActuelle: 2 };
            setDashboardData({
                general: defaultGeneral,
                heatmapData: defaultHeatmapData,
                predictiveHeatmapData: defaultHeatmapData,
                topZones: [],
                performance: { tarif_moyen: 12500, temps_attente_moyen: 7, courses_par_jour: 12, taux_acceptation_tarif: 85 },
                coursesByDay: [
                    { date: 'Lun', courses: 5 }, { date: 'Mar', courses: 8 }, { date: 'Mer', courses: 6 },
                    { date: 'Jeu', courses: 12 }, { date: 'Ven', courses: 15 }, { date: 'Sam', courses: 20 }, { date: 'Dim', courses: 18 }
                ],
                positioningSuggestions: generatePositioningSuggestions(defaultHeatmapData, {}, t),
                hotZoneAlerts: generateHotZoneAlerts(defaultHeatmapData, defaultGeneral, t)
            });
            setDataLoaded(true);
        } finally {
            setLoading(false);
        }
    };

    const loadHotZoneAlerts = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/hot-zone-alerts`);
            if (response.data.success) {
                setDashboardData(prev => ({ ...prev, hotZoneAlerts: response.data.data }));
            }
        } catch (error) {
            console.error('❌', t('errors.loadingAlerts'), error);
        }
    };

    const loadFilteredHeatmap = async (jour, tranche) => {
        try {
            const params = new URLSearchParams();
            if (jour && jour !== '') params.append('jour', jour);
            if (tranche && tranche !== '') params.append('tranche', tranche);
            
            const [heatmapResponse, suggestionsResponse] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/heatmap/filtered?${params}`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/positioning-suggestions?${params}`)
            ]);

            if (heatmapResponse.data.success && suggestionsResponse.data.success) {
                const filteredHeatmapData = heatmapResponse.data.data;
                const positioningSuggestions = suggestionsResponse.data.data;
                const hotZoneAlerts = generateHotZoneAlerts(filteredHeatmapData, dashboardData.general, t);
                
                setDashboardData(prev => ({
                    ...prev,
                    heatmapData: filteredHeatmapData,
                    positioningSuggestions,
                    hotZoneAlerts
                }));
            }
        } catch (error) {
            console.error('❌', t('errors.loadingFilteredData'), error);
            if (isCorsOrNetworkError(error)) {
                console.warn('⚠️ Problème réseau/CORS détecté lors du chargement des données filtrées.');
                showToast(t('errors.corsError', 'Erreur réseau ou CORS lors du chargement des données filtrées'), true);
            }
            const positioningSuggestions = generatePositioningSuggestions(dashboardData.heatmapData, { jour, tranche }, t);
            setDashboardData(prev => ({ ...prev, positioningSuggestions }));
        }
    };

    // GESTION DES CHANGEMENTS DE FILTRES 
    const handleFilterChange = (filterType, value) => {
        const newFilters = { ...heatmapFilters, [filterType]: value };
        setHeatmapFilters(newFilters);
        loadFilteredHeatmap(newFilters.jour, newFilters.tranche);
    };

    const loadPeakHours = async (jour = null) => {
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/dashboard/peak-hours${jour ? `?jour=${jour}` : ''}`;
            const response = await axios.get(url);
            if (response.data.success) setPeakHoursData(response.data.data);
        } catch (error) {
            console.error('❌', t('errors.loadingPeakHours'), error);
            if (isCorsOrNetworkError(error)) {
                console.warn('⚠️ Problème réseau/CORS détecté lors du chargement des heures de pointe.');
                showToast(t('errors.corsError', 'Erreur réseau ou CORS lors du chargement des heures de pointe'), true);
            }
            setPeakHoursData([
                { hour: '07h', courses: 8, isPeak: true }, { hour: '08h', courses: 12, isPeak: true }, { hour: '09h', courses: 10, isPeak: true },
                { hour: '10h', courses: 6, isPeak: false }, { hour: '11h', courses: 5, isPeak: false }, { hour: '12h', courses: 9, isPeak: false },
                { hour: '13h', courses: 7, isPeak: false }, { hour: '14h', courses: 6, isPeak: false }, { hour: '15h', courses: 5, isPeak: false },
                { hour: '16h', courses: 8, isPeak: false }, { hour: '17h', courses: 11, isPeak: true }, { hour: '18h', courses: 14, isPeak: true }
            ]);
        }
    };

    const loadZoneAnalysis = async (zoneParam) => {
        try {
            setLoading(true);
            
            let zoneNom = '';
            
            if (typeof zoneParam === 'object' && zoneParam !== null) {
                zoneNom = zoneParam.nom || zoneParam.zone_name || zoneParam.zone || 
                        zoneParam.Nom || zoneParam.name || 
                        (zoneParam.zone_data?.nom) || 
                        (zoneParam.zone_data?.Nom) ||
                        `Zone ${zoneParam.zone_id || zoneParam.id || 'inconnue'}`;
                console.log('🔍 Zone extraite depuis objet:', { zoneNom, zoneParam });
            } 
            else if (typeof zoneParam === 'string') {
                zoneNom = zoneParam;
            } 
            else {
                console.error('❌ Type de zoneParam invalide:', zoneParam);
                setZoneAnalysis(null);
                setSelectedZone(null);
                setLoading(false);
                return;
            }
            
            if (!zoneNom || zoneNom === '') {
                console.error('❌ Nom de zone vide après extraction');
                setZoneAnalysis(null);
                setSelectedZone(null);
                setLoading(false);
                return;
            }
            
            console.log('🔍 ANALYSE ZONE DEMANDÉE:', { zoneNom, typeParam: typeof zoneParam });
            
            // Appeler l'API avec le nom de la zone
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/zone-analysis?zone=${encodeURIComponent(zoneNom)}`);
                
                if (response.data && response.data.success) {
                    setZoneAnalysis(response.data.data);
                    setSelectedZone(zoneNom);
                    console.log('✅ Analyse zone récupérée avec succès');
                } else {
                    throw new Error('Données d\'analyse non disponibles');
                }
            } catch (apiError) {
                console.warn('⚠️ API zone-analysis non disponible, utilisation des données locales');
                
                // Fallback: chercher des données locales
                let zoneData = null;
                
                // Chercher dans heatmapData
                if (dashboardData.heatmapData && Array.isArray(dashboardData.heatmapData)) {
                    zoneData = dashboardData.heatmapData.find(zone => 
                        zone.zone === zoneNom || zone.nom === zoneNom || zone.Nom === zoneNom
                    );
                }
                
                // Si non trouvé, chercher dans reservationsByZone
                if (!zoneData && reservationsByZone && Array.isArray(reservationsByZone)) {
                    zoneData = reservationsByZone.find(zone => 
                        zone.nom === zoneNom || zone.zone_name === zoneNom
                    );
                }
                
                if (zoneData) {
                    const analysis = {
                        zone: zoneNom,
                        total_departs: zoneData.total_departs || zoneData.departures || 0,
                        total_arrivees: zoneData.total_arrivees || zoneData.arrivals || 0,
                        revenu_moyen_depart: zoneData.revenu_moyen_depart || zoneData.revenu_moyen || 12000,
                        revenu_moyen_arrivee: zoneData.revenu_moyen_arrivee || zoneData.revenu_moyen || 10000,
                        demand: zoneData.demand || zoneData.demande || 50,
                        courses_heure: zoneData.courses_heure || 0,
                        activity_score: zoneData.activity_score || 0
                    };
                    setZoneAnalysis(analysis);
                    setSelectedZone(zoneNom);
                    showToast(`📊 Données locales pour ${zoneNom}`, false);
                } else {
                    // Données par défaut
                    const defaultAnalysis = {
                        zone: zoneNom,
                        total_departs: 0,
                        total_arrivees: 0,
                        revenu_moyen_depart: 0,
                        revenu_moyen_arrivee: 0,
                        demand: 0,
                        courses_heure: 0
                    };
                    setZoneAnalysis(defaultAnalysis);
                    setSelectedZone(zoneNom);
                    showToast(`⚠️ Données non disponibles pour ${zoneNom}`, true);
                }
            }
            
        } catch (error) {
            console.error('❌ Erreur analyse zone:', error);
            
            // Extraire le nom de la zone en cas d'erreur
            let zoneNom = 'Zone inconnue';
            if (zoneParam && typeof zoneParam === 'object') {
                zoneNom = zoneParam.nom || zoneParam.zone_name || zoneParam.zone || 
                        zoneParam.Nom || `Zone ${zoneParam.zone_id || 'inconnue'}`;
            } else if (typeof zoneParam === 'string') {
                zoneNom = zoneParam;
            }
            
            setZoneAnalysis({
                zone: zoneNom,
                total_departs: 0,
                total_arrivees: 0,
                revenu_moyen_depart: 0,
                revenu_moyen_arrivee: 0,
                demand: 0,
                courses_heure: 0
            });
            setSelectedZone(zoneNom);
            showToast(`⚠️ Erreur d'analyse pour ${zoneNom}`, true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initializeDashboard = async () => {
            const quota = await fetchUserQuota();
            setUserQuota(prev => ({ ...prev, ...quota, loading: false }));
            
            if (quota.plan === 'basic' && (activeHeatmapView === 'predictive' || activeHeatmapView === 'routes' || activeHeatmapView === 'alerts')) {
                setActiveHeatmapView('current');
            }
        }
        loadDashboardData();
        loadPeakHours(getCurrentDay());
        loadDriverData();
        loadAllDriverCourses();
        loadReservationsByZone(); 
        toggleRealTimeUpdates(true);
        initializeDashboard();
        return () => {
            if (updateInterval) {
                clearInterval(updateInterval);
            }
        };
    }, [periode]);
    
    const handleMenuToggle = (isOpen) => setIsMenuOpen(isOpen);

    // Options de période
    const periodOptions = [
        { value: 'today', label: t('periods.today') },
        { value: 'week', label: t('periods.thisWeek') },
        { value: 'month', label: t('periods.thisMonth') },
        { value: 'year', label: t('periods.thisYear') }
    ];

    // Définition des viewOptions
    const viewOptions = [
        { 
            value: 'predictive', 
            icon: <FaBrain />, 
            label: t('views.predictions'),
            requiresPremium: true,
            feature: 'predictions'
        },
        { 
            value: 'current', 
            icon: <FaEye />, 
            label: t('views.currentActivity'),
            requiresPremium: false
        },
        { 
            value: 'routes', 
            icon: <FaRoute />, 
            label: t('views.routes'),
            requiresPremium: true,
            feature: 'routes'
        },
        { 
            value: 'reservations',
            icon: <FaCalendarAlt />, 
            label: t('views.reservations'),
            requiresPremium: false
        },
        { 
            value: 'alerts', 
            icon: <FaBell />, 
            label: t('views.alerts'),
            requiresPremium: true,
            feature: 'alerts'
        }
    ];

    return (
        <div className="app-container">
            <MenuApp onToggle={handleMenuToggle} />
            
            <div className={`content-container ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}>
                <div className="dashboard-container compact">
                    {/* Toast de succès */}
                    {showSuccessPopup && (
                        <div className="success-popup">
                            <div className="success-content">
                                <span className="success-icon" style={{marginTop:'0px', width:'30px', height:'30px'}}>
                                    {successMessage.includes('❌') ? '❌' : '✅'}
                                </span>
                                <span style={{marginTop:'-20px'}}>{successMessage.replace('❌ ', '').replace('✅ ', '')}</span>
                                <button 
                                    className="close-success" 
                                    style={{marginTop:'-20px'}}
                                    onClick={() => setShowSuccessPopup(false)}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}

                    {/* En-tête du Dashboard */}
                    <div className="dashboard-header compact" style={{marginTop:'-5px'}}>
                        <div className="header-left">
                            <h1 className='vtc'><FaChartLine className="header-icon" />{t('header.title')}</h1>
                            <p>🎯 {t('header.subtitle')}</p>
                        </div>
                        <div className="header-right">
                            <div className="period-selector">
                                <select value={periode} onChange={(e) => setPeriode(e.target.value)} className="period-select compact">
                                    {periodOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Alertes Zones Chaudes */}
                    {dashboardData.hotZoneAlerts?.alerts?.length > 0 && (
                        <div className="alert-banner">
                            <FaExclamationTriangle className="alert-icon" />
                            <span className="alert-count">{dashboardData.hotZoneAlerts.alerts.length} {t('alerts.hotZoneAlerts')}</span>
                        </div>
                    )}

                    {/* Instructions pour la carte */}
                    <div className="map-instructions">
                        <FaCrosshairs className="instruction-icon" />
                        <span>🎯 {t('messages.useRecommendationMaps')}</span>
                    </div>

                    {/* POPUP: Création de zone depuis les marqueurs */}
                    {createZonePopup && (
                        <div className="modal-overlay">
                            <div className="modal-content create-zone-modal">
                                <div className="modal-header">
                                    <h3>📍 {t('modals.createServiceZone')}</h3>
                                    <button className="modal-close" onClick={handleCloseCreateZonePopup}>×</button>
                                </div>
                                <div className="modal-body">
                                    <div className="location-info">
                                        <div className="location-coordinates">
                                            <div className="coordinate"><strong>{t('common.latitude')}:</strong> {createZonePopup.latlng.lat.toFixed(6)}</div>
                                            <div className="coordinate"><strong>{t('common.longitude')}:</strong> {createZonePopup.latlng.lng.toFixed(6)}</div>
                                        </div>
                                        <div className="location-name-input">
                                            <label htmlFor="zoneNameModal">{t('form.zoneName')}:</label>
                                            <input 
                                                id="zoneNameModal" 
                                                type="text" 
                                                value={locationName} 
                                                onChange={(e) => setLocationName(e.target.value)} 
                                                placeholder={t('form.enterZoneName')} 
                                                className="zone-name-input" 
                                                autoFocus 
                                            />
                                            <small className="input-hint">{t('form.zoneNameHint')}</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn-cancel-popup" onClick={handleCloseCreateZonePopup}>{t('common.cancel')}</button>
                                    <button className="btn-create-zone" onClick={handleCreateZoneFromPopup} disabled={!locationName.trim()}>
                                        <FaPlus /> {t('actions.createZone')} "{locationName || t('common.newZone')}"
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Popup pour créer une zone au clic sur la carte */}
                    {mapHoverPopup && mapHoverPopup.type === 'click' && (
                        <div className="zone-popup-overlay map-create-popup" style={{ position: 'fixed', top: mapHoverPopup.position.y + 10, left: mapHoverPopup.position.x + 10, zIndex: 1000 }}>
                            <div className="zone-popup create-zone-popup">
                                <div className="popup-header">
                                    <h4>📍 {t('modals.createNewZone')}</h4>
                                    <button className="popup-close" onClick={handleCloseCreatePopup}>×</button>
                                </div>
                                <div className="popup-content" style={{marginLeft:'30px'}}>
                                    <div className="location-info">
                                        <div className="location-coordinates">
                                            <div className="coordinate"><strong>{t('common.latitude')}:</strong> {mapHoverPopup.latlng.lat.toFixed(6)}</div>
                                            <div className="coordinate"><strong>{t('common.longitude')}:</strong> {mapHoverPopup.latlng.lng.toFixed(6)}</div>
                                        </div>
                                        <div className="location-name-input">
                                            <label htmlFor="zoneName">{t('form.zoneName')}:</label>
                                            {isGeocoding ? (
                                                <div className="geocoding-loading">
                                                    <div className="loading-spinner small"></div>
                                                    <span>{t('common.searchingLocation')}</span>
                                                </div>
                                            ) : (
                                                <input id="zoneName" type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder={t('form.enterZoneName')} className="zone-name-input" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="popup-actions">
                                    <button className="btn-create-zone" onClick={() => handleAddZoneFromMap(mapHoverPopup.latlng, locationName)} disabled={isGeocoding || !locationName.trim()}>
                                        <FaPlus /> {t('actions.createZone')} "{locationName || t('common.newZone')}"
                                    </button>
                                    <button className="btn-cancel-popup" onClick={handleCloseCreatePopup}>{t('common.cancel')}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cartes de Statistiques */}
                    <div className="stats-grid compact">
                        <StatCard 
                            title={t('metrics.totalRides')} 
                            value={driverAllCourses.totalCourses || 0} 
                            icon={<FaCar style={{color:'#007bff'}}/>} 
                            color="primary" 
                            t={t}
                        />
                        <StatCard 
                            title={t('metrics.todayRides')} 
                            value={driverAllCourses.coursesToday || 0} 
                            icon={<FaCalendarAlt style={{color:'#007bff'}}/>} 
                            color="success" 
                            t={t}
                        />
                        <StatCard 
                            title={t('metrics.totalRevenue')} 
                            value={formatCurrency(driverAllCourses.totalRevenue || 0)} 
                            icon={<FaMoneyBillWave style={{color:'#007bff'}}/>} 
                            color="warning" 
                            t={t}
                        />
                        <StatCard 
                            title={t('metrics.averageRate')} 
                            value={formatCurrency(driverAllCourses.averageRevenue || 0)} 
                            icon={<FaMoneyBillWave style={{color:'#007bff'}}/>} 
                            color="info" 
                            t={t}
                        />
                    </div>

                    {/* Filtres de Carte de Chaleur */}
                    <div className="content-row">
                        <div className="chart-container compact">
                            <div className="chart-header">
                                <h3><FaFilter className="header-icon" />{t('filters.heatmapFilters')}</h3>
                            </div>
                            <div className="chart-content">
                                <HeatmapFilters filters={heatmapFilters} onFilterChange={handleFilterChange} t={t} />
                            </div>
                        </div>

                        <div className="chart-container compact">
                            <div className="chart-header">
                                <h3><FaRoute className="header-icon" />🎯 {t('suggestions.whereToGoNow')}</h3>
                            </div>
                            <div className="chart-content">
                                <PositioningSuggestions 
                                    suggestions={dashboardData.positioningSuggestions} 
                                    loading={loading && !dataLoaded} 
                                    onZoneHover={handleZoneNameHover} 
                                    onZoneLeave={handleZoneNameLeave} 
                                    t={t} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Carte de Chaleur avec vues multiples */}
                    <div className="content-row">
                        <div className="chart-container full-width">
                            <div className="chart-header">
                                <h3><FaMapMarkerAlt className="header-icon" />{t('map.heatmapTitle')}</h3>
                                <div className="view-selector">
                                    <div className="view-selector">
                                        <div className="view-selector">
                                            {viewOptions.map(view => {
                                                const requiresPremium = view.requiresPremium || false;
                                                const canAccess = !requiresPremium || canAccessAdvancedFeatures();
                                                
                                                return (
                                                    <button 
                                                        key={view.value}
                                                        className={`view-btn ${activeHeatmapView === view.value ? 'active' : ''} ${requiresPremium && !canAccess ? 'premium-locked' : ''}`}
                                                        onClick={() => {
                                                            if (requiresPremium && !canAccess) {
                                                                showToast('📢 Fonctionnalité réservée aux abonnés Premium, VIP et Entreprise', true);
                                                                return;
                                                            }
                                                            setActiveHeatmapView(view.value);
                                                        }}
                                                        disabled={requiresPremium && !canAccess}
                                                        title={requiresPremium && !canAccess ? t('subscription.required') : view.label}
                                                    >
                                                        {view.icon} {view.label}
                                                        {requiresPremium && !canAccess && (
                                                            <span className="premium-badge-lock">🔒</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div> 
                                </div>
                            </div>
                            <div className="chart-content">
                                <AdvancedHeatmapView 
                                    view={activeHeatmapView}
                                    data={dashboardData}
                                    loading={loading && !dataLoaded}
                                    onZoneClick={loadZoneAnalysis}
                                    onAddZone={handleAddZoneFromDashboard}
                                    selectedZone={selectedZone}
                                    onZoneHover={handleZoneNameHover}
                                    onZoneLeave={handleZoneNameLeave}
                                    onMapClick={handleMapClick}
                                    onMapLeave={handleMapLeave}
                                    onCreateZone={handleCreateZoneFromMarker}
                                    driverData={driverData}
                                    showDriverRoutes={showDriverRoutes}
                                    setShowDriverRoutes={setShowDriverRoutes}
                                    driverLoading={driverLoading}
                                    loadDriverData={loadDriverData}
                                    handleUpdateDriverPosition={handleUpdateDriverPosition}
                                    loadingReservations={loadingReservations}
                                    reservationsByZone={reservationsByZone} 
                                    t={t}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Analyse par Zone et Heures de Pointe */}
                    <div className="content-row">
                        <div className="chart-container compact">
                            <div className="chart-header">
                                <h3><FaSearch className="header-icon" />{selectedZone ? `🎯 ${t('zoneAnalysis.analysis')}: ${selectedZone}` : t('zoneAnalysis.selectZone')}</h3>
                            </div>
                            <div className="chart-content">
                                <ZoneAnalysis analysis={zoneAnalysis} loading={loading && !dataLoaded} t={t} />
                            </div>
                        </div>

                        <div className="chart-container compact">
                            <div className="chart-header">
                                <h3><FaClock className="header-icon" />{t('peakHours.title')} - {heatmapFilters.jour ? t(`days.${heatmapFilters.jour}`) : t(`days.${getCurrentDay()}`)}</h3>
                            </div>
                            <div className="chart-content">
                                <PeakHoursChart data={peakHoursData} loading={loading && !dataLoaded} t={t} />
                            </div>
                        </div>
                    </div>

                    {/* Graphiques standards */}
                    <div className="content-row">
                        <div className="chart-container compact">
                            <div className="chart-header">
                                <h3><FaCalendarAlt className="header-icon" />{t('charts.ridesByDay')}</h3>
                            </div>
                            <div className="chart-content">
                                <CoursesByDayChart 
                                    data={dashboardData.coursesByDay} 
                                    loading={loading && !dataLoaded} 
                                    onDateChange={handleDateChange} 
                                    selectedDate={selectedDate} 
                                    t={t} 
                                />
                            </div>
                        </div>

                        <div className="chart-container compact">
                            <div className="chart-header">
                                <h3><FaChartBar className="header-icon" />{t('metrics.performance')}</h3>
                            </div>
                            <div className="chart-content">
                                <PerformanceMetrics data={dashboardData.performance} loading={loading && !dataLoaded} t={t} />
                            </div>
                        </div>
                    </div>

                    {/* Insights Prédictifs */}
                    <div className="content-row">
                        <div className="chart-container full-width">
                            <div className="chart-header">
                                <h3><FaLightbulb className="header-icon" />{t('insights.smartRecommendations')}</h3>
                            </div>
                            <div className="chart-content">
                                <PredictiveInsights 
                                    data={dashboardData} 
                                    loading={loading && !dataLoaded} 
                                    onZoneHover={handleZoneNameHover} 
                                    onZoneLeave={handleZoneNameLeave} 
                                    t={t} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;