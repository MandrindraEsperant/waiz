const ZONES_STORAGE_KEY = 'waiz_local_zones';

const DEFAULT_ZONES = [
  { id: 'zone-1', nom: 'Antananarivo - Centre', Nom: 'Antananarivo - Centre', latitude: -18.8792, longitude: 47.5079 },
  { id: 'zone-2', nom: 'Antananarivo - Aéroport', Nom: 'Antananarivo - Aéroport', latitude: -18.7969, longitude: 47.4788 },
  { id: 'zone-3', nom: 'Toamasina', Nom: 'Toamasina', latitude: -18.1492, longitude: 49.4023 },
];

export function getLocalZones() {
  try {
    const stored = localStorage.getItem(ZONES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_ZONES;
}

export function saveLocalZones(zones) {
  localStorage.setItem(ZONES_STORAGE_KEY, JSON.stringify(zones));
}

export function addLocalZone(zone) {
  const zones = getLocalZones();
  const newZone = {
    id: zone.id || `zone-${Date.now()}`,
    nom: zone.nom || zone.Nom,
    Nom: zone.Nom || zone.nom,
    latitude: zone.latitude,
    longitude: zone.longitude,
  };
  zones.push(newZone);
  saveLocalZones(zones);
  return newZone;
}

export function updateLocalZone(id, updates) {
  const zones = getLocalZones().map((z) => (z.id === id ? { ...z, ...updates } : z));
  saveLocalZones(zones);
  return zones;
}

export function deleteLocalZone(id) {
  const zones = getLocalZones().filter((z) => z.id !== id);
  saveLocalZones(zones);
  return zones;
}
