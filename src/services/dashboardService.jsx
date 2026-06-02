import graphqlClient from '../graphql/client';
import { GET_DRIVER_DASHBOARD_STAT_QUERY } from '../graphql/queries/dashboard.queries';
import {
  mapDashboardStatToLegacy,
  buildHeatmapFromRides,
  buildPeakHoursFromRides,
  buildCoursesByDay,
} from '../mappers/dashboardMapper';
import { fetchRidesAsCourses } from './rideService';
import { mapRideToLegacyCourse } from '../mappers/rideMapper';

const normalizePeriod = (periode) => {
  const p = String(periode || 'week').toLowerCase();
  if (['week', 'month', 'year'].includes(p)) return p;
  if (p.includes('semaine') || p === '7j') return 'week';
  if (p.includes('mois') || p === '30j') return 'month';
  if (p.includes('année') || p.includes('annee')) return 'year';
  return 'week';
};

export const fetchDashboardStats = async (periode = 'week') => {
  const period = normalizePeriod(periode);
  const data = await graphqlClient(GET_DRIVER_DASHBOARD_STAT_QUERY, {
    input: { period },
  });
  return mapDashboardStatToLegacy(data?.getDriverDashBoardPeriodicStat, period);
};

export const fetchDriverRealtime = async () => {
  const courses = await fetchRidesAsCourses({
    status: null,
    isReservation: false,
  });
  const active = courses.filter((c) =>
    ['PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(c.status || c.status_course)
  );
  return {
    courses: active,
    activeCount: active.length,
    totalToday: courses.length,
  };
};

export const fetchAllDriverCourses = async () => fetchRidesAsCourses({});

export const fetchCoursesByDay = async (month) => {
  const courses = await fetchAllDriverCourses();
  return buildCoursesByDay(courses, month);
};

export const fetchHeatmap = async (filters = {}) => {
  let courses = await fetchAllDriverCourses();
  if (filters.status) {
    courses = courses.filter((c) => c.status === filters.status);
  }
  return buildHeatmapFromRides(courses);
};

export const fetchHeatmapFiltered = fetchHeatmap;

export const fetchPeakHours = async () => {
  const courses = await fetchAllDriverCourses();
  return buildPeakHoursFromRides(courses);
};

export const fetchHotZoneAlerts = async () => {
  const heatmap = await fetchHeatmap();
  const zoneCounts = {};
  heatmap.points.forEach((p) => {
    const z = p.zone || 'Inconnu';
    zoneCounts[z] = (zoneCounts[z] || 0) + 1;
  });
  return Object.entries(zoneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([zone, count]) => ({ zone, count, level: count > 3 ? 'high' : 'medium' }));
};

export const fetchPositioningSuggestions = async () => {
  const alerts = await fetchHotZoneAlerts();
  return alerts.map((a) => ({
    zone: a.zone,
    suggestion: `Position recommandée près de ${a.zone}`,
    score: a.count,
  }));
};

export const fetchZoneAnalysis = async (zoneNom) => {
  const courses = await fetchAllDriverCourses();
  const filtered = courses.filter(
    (c) =>
      c.departureName?.includes(zoneNom) ||
      c.zones?.depart?.Nom?.includes(zoneNom) ||
      c.arrivalName?.includes(zoneNom)
  );
  return {
    zone: zoneNom,
    totalCourses: filtered.length,
    revenue: filtered.reduce((s, c) => s + (Number(c.Tarif_final_accepter) || 0), 0),
  };
};

export const fetchReservationsForDashboard = async () => {
  const { GET_RIDES_QUERY } = await import('../graphql/queries/ride.queries');
  const data = await graphqlClient(GET_RIDES_QUERY, { input: { isReservation: true } });
  return (data?.getRides || []).map(mapRideToLegacyCourse);
};

const heatmapPointsToLegacy = (heatmap) =>
  (heatmap.points || []).map((p, i) => ({
    zone: p.zone || `Zone ${i + 1}`,
    nom: p.zone,
    Nom: p.zone,
    latitude: p.lat,
    longitude: p.lng,
    demand: Math.round((p.weight || 1) * 20),
    courses_heure: p.weight || 1,
    revenu_moyen: 10000,
    total_departs: p.weight || 1,
    total_arrivees: 0,
  }));

/** Payload complet pour loadDashboardData */
export const fetchFullDashboardData = async (periode = 'week') => {
  const stats = await fetchDashboardStats(periode);
  const courses = await fetchAllDriverCourses();
  const heatmap = await fetchHeatmap();
  const heatmapData = heatmapPointsToLegacy(heatmap);
  const alerts = await fetchHotZoneAlerts();
  const positioningSuggestions = await fetchPositioningSuggestions();

  return {
    success: true,
    data: {
      general: {
        totalCourses: stats.courses ?? stats.nbRide ?? 0,
        coursesToday: courses.filter((c) => {
          const d = new Date(c.Heure_depart);
          const t = new Date();
          return d.toDateString() === t.toDateString();
        }).length,
        revenuTotal: stats.revenus ?? stats.revenue ?? 0,
        revenuMensuel: stats.revenus ?? 0,
        clientsActifs: new Set(courses.map((c) => c.client_ID).filter(Boolean)).size,
        chauffeursActifs: 1,
        coursesHeureActuelle: Math.max(1, Math.round((stats.courses || 0) / 24)),
      },
      heatmapData,
      predictiveHeatmapData: heatmapData,
      topZones: alerts.map((a) => ({ zone: a.zone, score: a.count })),
      performance: {
        tarif_moyen: stats.courses ? (stats.revenus || 0) / stats.courses : 0,
        temps_attente_moyen: 7,
        courses_par_jour: stats.courses || 0,
        taux_acceptation_tarif: 85,
      },
      coursesByDay: buildCoursesByDay(courses).map((d) => ({
        date: d.date.slice(-2),
        courses: d.count,
        fullDate: d.date,
      })),
      chartData: stats.chartData,
      stats,
    },
    alerts,
    positioningSuggestions,
  };
};

export const fetchAllDriverCoursesPayload = async () => {
  const courses = await fetchAllDriverCourses();
  const totalRevenue = courses.reduce(
    (s, c) => s + (Number(c.Tarif_final_accepter) || Number(c.Tarif_proposer_client) || 0),
    0
  );
  return {
    success: true,
    data: {
      totalCourses: courses.length,
      totalRevenue,
      courses,
    },
  };
};

export const fetchDriverRealtimePayload = async () => {
  const rt = await fetchDriverRealtime();
  const heatmap = heatmapPointsToLegacy(await fetchHeatmap());
  const suggestions = await fetchPositioningSuggestions();
  return {
    success: true,
    data: {
      courses: rt.courses,
      activeCount: rt.activeCount,
      lastUpdated: new Date().toISOString(),
      zonesRecommandees: heatmap.map((z, i) => ({
        id: i + 1,
        nom: z.zone,
        position: { lat: z.latitude, lng: z.longitude },
        demande: z.demand,
        tarifMoyen: z.revenu_moyen,
        score: z.demand,
      })),
      zones_recommandees: heatmap,
      itineraires: suggestions.map((s, i) => ({
        zoneId: i + 1,
        zoneNom: s.zone,
        distance: '0',
        tempsEstime: 5,
        points: [],
        ordre: i + 1,
        conseil: s.suggestion,
      })),
      stats: {
        courses_today: rt.totalToday,
        revenue_today: 0,
      },
    },
  };
};

export const fetchPeakHoursPayload = async () => {
  const hours = await fetchPeakHours();
  const max = Math.max(...hours.map((h) => h.count), 1);
  return {
    success: true,
    data: hours.map((h) => ({
      hour: h.label,
      courses: h.count,
      isPeak: h.count >= max * 0.7,
    })),
  };
};

export const fetchZoneAnalysisPayload = async (zoneNom) => {
  const analysis = await fetchZoneAnalysis(zoneNom);
  return { success: true, data: analysis };
};

export const fetchCoursesByDayPayload = async (month) => {
  const data = buildCoursesByDay(await fetchAllDriverCourses(), month);
  return { success: true, data };
};
