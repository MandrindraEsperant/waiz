/**
 * Zones : non exposées en GraphQL backend.
 * Persistance locale + dérivation depuis les trajets (noms/lat-lng).
 */
const STORAGE_KEY = 'waiz_zones';

const readStoredZones = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeStoredZones = (zones) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
};

const toLegacyZone = (z) => ({
  id: z.id,
  zone_ID: z.id,
  Nom: z.name || z.Nom,
  name: z.name || z.Nom,
  latitude: z.latitude,
  longitude: z.longitude,
});

const deriveZonesFromRides = (rides) => {
  const seen = new Map();
  rides.forEach((ride) => {
    [
      { name: ride.departureName, pos: ride.departure },
      { name: ride.arrivalName, pos: ride.arrival },
    ].forEach(({ name, pos }) => {
      if (!name) return;
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.set(key, {
        id: `derived-${key.replace(/\s+/g, '-')}`,
        name,
        latitude: pos?.latitude ?? 0,
        longitude: pos?.longitude ?? 0,
      });
    });
  });
  return [...seen.values()];
};

export const fetchZones = async (rides = []) => {
  const stored = readStoredZones();
  const derived = deriveZonesFromRides(
    rides.map((r) => r._graphql || r)
  );
  const merged = new Map();
  [...derived, ...stored].forEach((z) => merged.set(z.id, z));
  return [...merged.values()].map(toLegacyZone);
};

export const addZone = async (zoneData) => {
  const zones = readStoredZones();
  const zone = {
    id: zoneData.id || `zone-${Date.now()}`,
    name: zoneData.Nom || zoneData.name,
    latitude: Number(zoneData.latitude),
    longitude: Number(zoneData.longitude),
  };
  zones.push(zone);
  writeStoredZones(zones);
  return { success: true, data: toLegacyZone(zone) };
};

export const updateZone = async (id, zoneData) => {
  const zones = readStoredZones();
  const idx = zones.findIndex((z) => z.id === id);
  const updated = {
    id,
    name: zoneData.Nom || zoneData.name,
    latitude: Number(zoneData.latitude),
    longitude: Number(zoneData.longitude),
  };
  if (idx >= 0) zones[idx] = updated;
  else zones.push(updated);
  writeStoredZones(zones);
  return { success: true, data: toLegacyZone(updated) };
};

export const deleteZone = async (id) => {
  const zones = readStoredZones().filter((z) => z.id !== id);
  writeStoredZones(zones);
  return { success: true };
};
