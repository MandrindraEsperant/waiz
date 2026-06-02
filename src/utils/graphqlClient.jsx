import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:8000';

/**
 * Sends a GraphQL query or mutation request to the Spring Boot backend.
 * Automatically injects the Authorization header if a token is present in localStorage.
 */
export const graphqlRequest = async (query, variables = {}) => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await axios.post(`${apiBaseUrl}/graphql`, {
      query,
      variables
    }, {
      headers,
      timeout: 20000
    });
    
    if (response.data.errors) {
      const errorMsg = response.data.errors[0]?.message || 'Erreur GraphQL';
      console.error('GraphQL Error:', response.data.errors);
      
      // Auto-logout if token is expired/invalid
      if (
        errorMsg.includes('INVALID_TOKEN') || 
        errorMsg.includes('UNAUTHORIZED') || 
        errorMsg.includes('JWT') ||
        errorMsg.includes('INVALID_CREDENTIALS')
      ) {
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('user_type');
          window.location.href = '/login';
        }
      }
      
      throw new Error(errorMsg);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('API GraphQL Connection Error:', error);
    throw error;
  }
};

export const mapRoleToType = (role) => {
  if (!role) return null;
  const normalized = String(role).toUpperCase();
  if (normalized === 'DRIVER') return 'chauffeur';
  if (normalized === 'CUSTOMER' || normalized === 'CLIENT') return 'passager';
  if (normalized === 'ADMIN') return 'admin';
  return normalized.toLowerCase();
};

/**
 * Maps a GraphQL User to the format expected by AuthContext and components.
 */
export function mapGraphQLUserToLocal(user) {
  if (!user) return null;
  const type = mapRoleToType(user.role);
  return {
    id: user.id,
    nom: user.name,
    name: user.name,
    firstName: user.firstName,
    email: user.email,
    telephone: user.phone,
    phone: user.phone,
    role: user.role,
    type,
    driverAvailability: user.driverAvailability,
    isMembershipActive: user.isMembershipActive,
    lastPosition: user.lastPosition,
  };
}

/**
 * Maps a GraphQL Ride object to the format expected by the frontend components.
 */
export function mapGraphQLRideToLocalCourse(ride) {
  if (!ride) return null;
  
  const statusMapping = {
    'PENDING': 'EN_ATTENTE',
    'ACCEPTED': 'CONFIRMEE',
    'ARRIVED': 'CONFIRMEE',
    'IN_PROGRESS': 'CONFIRMEE',
    'COMPLETED': 'TERMINEE',
    'CANCELED': 'ANNULEE'
  };
  
  const mappedStatus = statusMapping[ride.status] || ride.status;
  
  return {
    cours_ID: ride.id,
    reserv_ID: ride.id,
    id: ride.id,
    ref: ride.ref,
    date_depart: ride.scheduledAt || ride.createdAt,
    date_voyage: ride.scheduledAt || ride.createdAt,
    heure_depart: ride.scheduledAt ? new Date(ride.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
    Status_course: mappedStatus,
    status_reservation: mappedStatus,
    status: mappedStatus,
    Tarif_proposer_client: ride.price,
    Tarif_final_accepter: ride.price,
    prix_par_personne: ride.price,
    nbr_passager: 1,
    client: ride.customer ? {
      id: ride.customer.id,
      client_ID: ride.customer.id,
      Nom_client: `${ride.customer.firstName} ${ride.customer.name}`,
      nom: `${ride.customer.firstName} ${ride.customer.name}`,
      telephone: ride.customer.phone,
      email: ride.customer.email
    } : null,
    chauffeur: ride.driver ? {
      id: ride.driver.id,
      chauffeur_ID: ride.driver.id,
      Nom: `${ride.driver.firstName} ${ride.driver.name}`,
      nom: `${ride.driver.firstName} ${ride.driver.name}`,
      telephone: ride.driver.phone,
      email: ride.driver.email
    } : null,
    zones: {
      depart: { Nom: ride.departureName, nom: ride.departureName },
      arrivee: { Nom: ride.arrivalName, nom: ride.arrivalName }
    },
    zone_depart: { Nom: ride.departureName, nom: ride.departureName },
    zone_arrivee: { Nom: ride.arrivalName, nom: ride.arrivalName },
    zone_depart_nom: ride.departureName,
    zone_arrivee_nom: ride.arrivalName,
    departure: ride.departure,
    arrival: ride.arrival,
    isReservation: ride.isReservation,
    scheduledAt: ride.scheduledAt
  };
}

