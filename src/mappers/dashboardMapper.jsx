/** Stats GraphQL → format attendu par dashboard legacy */
export const mapDashboardStatToLegacy = (stat, periode = 'week') => {
  if (!stat) {
    return {
      revenus: 0,
      courses: 0,
      distance: 0,
      periode,
      chartLabels: [],
      chartValues: [],
    };
  }
  return {
    revenus: stat.revenue ?? 0,
    revenue: stat.revenue ?? 0,
    courses: stat.nbRide ?? 0,
    nbRide: stat.nbRide ?? 0,
    distance: stat.totalDistance ?? 0,
    totalDistance: stat.totalDistance ?? 0,
    periode,
    chartLabels: (stat.chartData || []).map((p) => p.label),
    chartValues: (stat.chartData || []).map((p) => p.value),
    chartData: stat.chartData || [],
  };
};

/** Agrège les positions des courses pour heatmap côté client */
export const buildHeatmapFromRides = (rides = []) => {
  const points = [];
  rides.forEach((ride) => {
    const g = ride._graphql || ride;
    if (g.departure?.latitude != null) {
      points.push({
        lat: g.departure.latitude,
        lng: g.departure.longitude,
        weight: 1,
        zone: g.departureName,
      });
    }
    if (g.arrival?.latitude != null) {
      points.push({
        lat: g.arrival.latitude,
        lng: g.arrival.longitude,
        weight: 0.5,
        zone: g.arrivalName,
      });
    }
  });
  return { points, total: points.length };
};

export const buildPeakHoursFromRides = (rides = []) => {
  const byHour = Array(24).fill(0);
  rides.forEach((ride) => {
    const dateStr = ride.Heure_depart || ride.createdAt || ride._graphql?.createdAt;
    if (!dateStr) return;
    const h = new Date(dateStr).getHours();
    if (!Number.isNaN(h)) byHour[h] += 1;
  });
  return byHour.map((count, hour) => ({ hour, count, label: `${hour}h` }));
};

export const buildCoursesByDay = (rides = [], month) => {
  const byDay = {};
  rides.forEach((ride) => {
    const d = new Date(ride.Heure_depart || ride._graphql?.createdAt);
    if (Number.isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 10);
    if (month && !key.startsWith(month.slice(0, 7))) return;
    byDay[key] = (byDay[key] || 0) + 1;
  });
  return Object.entries(byDay).map(([date, count]) => ({ date, count }));
};
