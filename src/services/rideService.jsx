import graphqlClient from '../graphql/client';
import { GET_RIDES_QUERY, GET_PROPOSAL_PRICES_QUERY, GET_RIDES_HISTORY_QUERY } from '../graphql/queries/ride.queries';
import {
  CREATE_RIDE_MUTATION,
  UPDATE_RIDE_MUTATION,
  REJECT_RIDE_MUTATION,
  PROPOSE_PRICE_MUTATION,
  ACCEPT_PROPOSAL_PRICE_MUTATION,
} from '../graphql/mutations/ride.mutations';
import {
  mapRideToLegacyCourse,
  mapRideToReservation,
  mapLegacyCourseToCreateRideInput,
  mapLegacyStatusToGraphql,
} from '../mappers/rideMapper';

const mapRides = (rides) => (rides || []).map(mapRideToLegacyCourse).filter(Boolean);
const mapReservations = (rides) => (rides || []).map(mapRideToReservation).filter(Boolean);

export const fetchRides = async (input = {}) => {
  const data = await graphqlClient(GET_RIDES_QUERY, { input: input || null });
  return data?.getRides || [];
};

export const fetchRidesAsCourses = async (input = {}) => {
  const rides = await fetchRides(input);
  return mapRides(rides);
};

export const fetchRidesAsReservations = async (input = {}) => {
  const rides = await fetchRides(input);
  return mapReservations(rides);
};

export const fetchDriverCourses = async () => fetchRidesAsCourses({});

export const fetchPendingRidesForDriver = async () =>
  fetchRidesAsCourses({ status: 'PENDING', isReservation: false });

export const fetchReservations = async (isReservation = true) =>
  fetchRidesAsReservations({ isReservation });

export const fetchCustomerReservations = async () =>
  fetchRidesAsReservations({ isReservation: true });

export const fetchAvailablePublications = async () => {
  const rides = await fetchRides({ status: 'PENDING', isReservation: true });
  return mapReservations(rides);
};

export const createRide = async (input) => {
  const gqlInput = input.departure ? input : mapLegacyCourseToCreateRideInput(input);
  const data = await graphqlClient(CREATE_RIDE_MUTATION, { input: gqlInput });
  return mapRideToLegacyCourse(data?.createRide);
};

export const updateRideStatus = async (idRide, status) => {
  const gqlStatus = mapLegacyStatusToGraphql(status);
  const data = await graphqlClient(UPDATE_RIDE_MUTATION, {
    input: { idRide, status: gqlStatus },
  });
  return mapRideToLegacyCourse(data?.updateRide);
};

export const rejectRide = async (idRide) => {
  await graphqlClient(REJECT_RIDE_MUTATION, { input: { idRide } });
};

export const proposePrice = async (idRide, price) => {
  const data = await graphqlClient(PROPOSE_PRICE_MUTATION, {
    input: { idRide, price: Number(price) },
  });
  return data?.proposePrice;
};

export const acceptProposalPrice = async (idDriverProposalPrice) => {
  const data = await graphqlClient(ACCEPT_PROPOSAL_PRICE_MUTATION, {
    idDriverProposalPrice,
  });
  return mapRideToLegacyCourse(data?.acceptProposalPrice);
};

export const fetchProposalPrices = async (idRide) => {
  const data = await graphqlClient(GET_PROPOSAL_PRICES_QUERY, { idRide });
  return data?.getProposalPrices || [];
};

export const fetchRideHistory = async (idRide) => {
  const data = await graphqlClient(GET_RIDES_HISTORY_QUERY, { idRide });
  return data?.getRidesHistory || [];
};

/** Alias legacy Insertreservations */
export const insertReservation = createRide;
