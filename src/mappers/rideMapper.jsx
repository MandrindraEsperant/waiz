const toLegacyStatus = (status) => {
  const map = {
    PENDING: 'en attente',
    ACCEPTED: 'acceptée',
    ARRIVED: 'arrivé',
    IN_PROGRESS: 'en cours',
    COMPLETED: 'terminée',
    CANCELED: 'annulée',
  };
  return map[status] || status?.toLowerCase() || 'en attente';
};

const fromLegacyStatus = (status) => {
  if (!status) return 'PENDING';
  const s = String(status).toUpperCase().replace(/\s+/g, '_');
  const map = {
    'EN_ATTENTE': 'PENDING',
    'EN ATTENTE': 'PENDING',
    'ACCEPTEE': 'ACCEPTED',
    'ACCEPTÉE': 'ACCEPTED',
    'EN_COURS': 'IN_PROGRESS',
    'TERMINEE': 'COMPLETED',
    'TERMINÉE': 'COMPLETED',
    'ANNULEE': 'CANCELED',
    'ANNULÉE': 'CANCELED',
  };
  return map[s] || map[status] || s;
};

/** Ride GraphQL → forme legacy attendue par les écrans existants */
export const mapRideToLegacyCourse = (ride) => {
  if (!ride) return null;
  const customer = ride.customer;
  return {
    id: ride.id,
    cours_ID: ride.id,
    ref: ride.ref,
    Heure_depart: ride.scheduledAt || ride.createdAt,
    heure_depart: ride.scheduledAt || ride.createdAt,
    Status_course: toLegacyStatus(ride.status),
    status_course: ride.status,
    status: ride.status,
    Tarif_proposer_client: ride.price,
    Tarif_final_accepter: ride.price,
    distance: ride.distance,
    isReservation: ride.isReservation,
    client: customer ? {
      client_ID: customer.id,
      Nom_client: `${customer.firstName || ''} ${customer.name || ''}`.trim(),
      ...customer,
    } : null,
    client_ID: customer?.id,
    chauffeur_ID: ride.driver?.id,
    chauffeur: ride.driver,
    zones: {
      depart: { Nom: ride.departureName, latitude: ride.departure?.latitude, longitude: ride.departure?.longitude },
      arrivee: { Nom: ride.arrivalName, latitude: ride.arrival?.latitude, longitude: ride.arrival?.longitude },
    },
    departureName: ride.departureName,
    arrivalName: ride.arrivalName,
    departure: ride.departure,
    arrival: ride.arrival,
    _graphql: ride,
  };
};

/** Réservation passager (publication chauffeur) */
export const mapRideToReservation = (ride) => ({
  reserv_ID: ride.id,
  id: ride.id,
  ref: ride.ref,
  zone_id: ride.departureName,
  zone_id_arrive_de: ride.arrivalName,
  zone_depart_nom: ride.departureName,
  zone_arrivee_nom: ride.arrivalName,
  status_reservation: ride.status === 'PENDING' ? 'EN_ATTENTE' : ride.status,
  prix: ride.price,
  distance: ride.distance,
  date_voyage: ride.scheduledAt || ride.createdAt,
  chauffeur_id: ride.driver?.id,
  client_id: ride.customer?.id,
  Chauffeur: ride.driver ? {
    chauffeur_ID: ride.driver.id,
    Nom: ride.driver.name,
    Prenom: ride.driver.firstName,
    note: 4.5,
    trajets: 0,
  } : null,
  isReservation: ride.isReservation,
  _graphql: ride,
});

export const mapLegacyCourseToCreateRideInput = ({
  departure,
  arrival,
  price,
  distance,
  departureName,
  arrivalName,
  isReservation = false,
  scheduledAt = null,
}) => ({
  departure: {
    latitude: departure?.latitude ?? departure?.lat,
    longitude: departure?.longitude ?? departure?.lng,
  },
  arrival: {
    latitude: arrival?.latitude ?? arrival?.lat,
    longitude: arrival?.longitude ?? arrival?.lng,
  },
  price: Number(price) || 0,
  distance: Number(distance) || 0,
  departureName: departureName || 'Départ',
  arrivalName: arrivalName || 'Arrivée',
  isReservation: Boolean(isReservation),
  scheduledAt: scheduledAt || null,
});

export const mapLegacyStatusToGraphql = fromLegacyStatus;

export { toLegacyStatus, fromLegacyStatus };
