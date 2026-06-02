import { graphqlRequest, mapGraphQLRideToLocalCourse, mapGraphQLUserToLocal } from '../utils/graphqlClient';
import {
  SIGNIN,
  SIGNUP,
  VERIFY_BEARER_TOKEN,
  GET_CURRENT_MEMBERSHIP,
  GET_MEMBERSHIP_TYPES,
  UPGRADE_ACCOUNT,
  GET_RIDES,
  CREATE_RIDE,
  UPDATE_RIDE,
  REJECT_RIDE,
  PROPOSE_PRICE,
  ACCEPT_PROPOSAL_PRICE,
  GET_PROPOSAL_PRICES,
  GET_RIDES_HISTORY,
  GET_DRIVER_DASHBOARD_STAT,
  UPDATE_USER,
  GET_NOTIFICATIONS,
  READ_NOTIFICATION,
} from '../utils/graphqlOperations';

export const mapRoleToType = (role) => {
  if (!role) return null;
  const normalized = String(role).toUpperCase();
  if (normalized === 'DRIVER') return 'chauffeur';
  if (normalized === 'CUSTOMER' || normalized === 'CLIENT') return 'passager';
  if (normalized === 'ADMIN') return 'admin';
  return normalized.toLowerCase();
};

export const localStatusToGraphQL = (status) => {
  const map = {
    EN_ATTENTE: 'PENDING',
    'en attente': 'PENDING',
    CONFIRMEE: 'ACCEPTED',
    confirmée: 'ACCEPTED',
    TERMINEE: 'COMPLETED',
    terminée: 'COMPLETED',
    ANNULEE: 'CANCELED',
    annulée: 'CANCELED',
    ARRIVED: 'ARRIVED',
    IN_PROGRESS: 'IN_PROGRESS',
  };
  return map[status] || status?.toUpperCase?.() || status;
};

export async function signin(email, encryptedPassword) {
  const data = await graphqlRequest(SIGNIN, {
    input: { email, password: encryptedPassword },
  });
  return data.signin;
}

export async function signup(input) {
  const data = await graphqlRequest(SIGNUP, { input });
  return data.signup;
}

export async function verifyToken() {
  const data = await graphqlRequest(VERIFY_BEARER_TOKEN);
  return mapGraphQLUserToLocal(data.verifyBearerToken);
}

export async function fetchCurrentMembership() {
  const data = await graphqlRequest(GET_CURRENT_MEMBERSHIP);
  return data.getCurrentMemberShip;
}

export async function fetchMembershipTypes() {
  const data = await graphqlRequest(GET_MEMBERSHIP_TYPES);
  return data.getMemberShipTypes || [];
}

export async function upgradeAccount(memberShipTypeName) {
  const data = await graphqlRequest(UPGRADE_ACCOUNT, {
    input: { memberShipType: memberShipTypeName },
  });
  return data.upgradeAccount;
}

export async function checkSubscriptionEligibility() {
  try {
    const user = await verifyToken();
    const membership = await fetchCurrentMembership();
    const isActive =
      user?.isMembershipActive === true ||
      membership?.status === 'ACTIVE';

    return {
      hasActiveSubscription: isActive,
      isExpired: membership?.status === 'EXPIRED',
      isExpiringSoon: false,
      hasUsedTrial: false,
      currentPlan: membership?.memberShipType?.name?.toLowerCase() || null,
      expiryDate: membership?.startDate || null,
      membership,
      user,
    };
  } catch {
    return {
      hasActiveSubscription: false,
      isExpired: false,
      isExpiringSoon: false,
      hasUsedTrial: false,
      currentPlan: null,
      expiryDate: null,
      membership: null,
      user: null,
    };
  }
}

export async function fetchRides(input = {}) {
  const data = await graphqlRequest(GET_RIDES, { input });
  return (data.getRides || []).map(mapGraphQLRideToLocalCourse);
}

export async function fetchRidesRaw(input = {}) {
  const data = await graphqlRequest(GET_RIDES, { input });
  return data.getRides || [];
}

export async function createRide(input) {
  const data = await graphqlRequest(CREATE_RIDE, { input });
  return mapGraphQLRideToLocalCourse(data.createRide);
}

export async function updateRideStatus(idRide, status) {
  const data = await graphqlRequest(UPDATE_RIDE, {
    input: { idRide, status: localStatusToGraphQL(status) },
  });
  return mapGraphQLRideToLocalCourse(data.updateRide);
}

export async function rejectRide(idRide) {
  const data = await graphqlRequest(REJECT_RIDE, {
    input: { idRide },
  });
  return data.rejectRide;
}

export async function proposePrice(idRide, price) {
  const data = await graphqlRequest(PROPOSE_PRICE, {
    input: { idRide, price: parseFloat(price) },
  });
  return data.proposePrice;
}

export async function acceptProposalPrice(idDriverProposalPrice) {
  const data = await graphqlRequest(ACCEPT_PROPOSAL_PRICE, {
    idDriverProposalPrice,
  });
  return mapGraphQLRideToLocalCourse(data.acceptProposalPrice);
}

export async function fetchProposalPrices(rideId) {
  const data = await graphqlRequest(GET_PROPOSAL_PRICES, { input: rideId });
  return data.getProposalPrices || [];
}

export async function fetchRideHistory(idRide) {
  const data = await graphqlRequest(GET_RIDES_HISTORY, { idRide });
  return data.getRidesHistory || [];
}

export async function fetchDriverDashboardStat(period = 'week') {
  const data = await graphqlRequest(GET_DRIVER_DASHBOARD_STAT, {
    input: { period },
  });
  return data.getDriverDashBoardPeriodicStat;
}

export async function updateUserProfile(input) {
  const data = await graphqlRequest(UPDATE_USER, { input });
  return mapGraphQLUserToLocal(data.updateUser);
}

export async function fetchNotifications(status = 'UNREAD') {
  const data = await graphqlRequest(GET_NOTIFICATIONS, { status });
  return data.getNotifications || [];
}

export async function markNotificationsRead() {
  const data = await graphqlRequest(READ_NOTIFICATION);
  return mapGraphQLUserToLocal(data.readNotification);
}

export function extractUniqueClientsFromRides(rides) {
  const clientsMap = new Map();
  rides.forEach((ride) => {
    const customer = ride.customer || ride.client;
    if (customer?.id && !clientsMap.has(customer.id)) {
      clientsMap.set(customer.id, {
        client_ID: customer.id,
        id: customer.id,
        Nom_client: customer.Nom_client || customer.nom || `${customer.firstName || ''} ${customer.name || ''}`.trim(),
        Nom: customer.name,
        Prenom: customer.firstName,
        Email: customer.email,
        Telephone: customer.phone || customer.telephone,
        email: customer.email,
        telephone: customer.phone || customer.telephone,
      });
    }
  });
  return Array.from(clientsMap.values());
}
