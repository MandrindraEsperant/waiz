import graphqlClient from '../graphql/client';
import {
  GET_CURRENT_MEMBERSHIP_QUERY,
  GET_MEMBERSHIP_TYPES_QUERY,
} from '../graphql/queries/membership.queries';
import {
  UPGRADE_ACCOUNT_MUTATION,
  UPDATE_MEMBERSHIP_MUTATION,
} from '../graphql/mutations/membership.mutations';
import {
  mapMembershipToSubscription,
  mapMembershipTypesToPlans,
  mapQuotaFromMembership,
} from '../mappers/membershipMapper';
import { fetchRides } from './rideService';

export const getCurrentMembership = async () => {
  const data = await graphqlClient(GET_CURRENT_MEMBERSHIP_QUERY);
  return data?.getCurrentMemberShip ?? null;
};

export const getMembershipTypes = async () => {
  const data = await graphqlClient(GET_MEMBERSHIP_TYPES_QUERY);
  return mapMembershipTypesToPlans(data?.getMemberShipTypes || []);
};

export const getMySubscription = async () => {
  const membership = await getCurrentMembership();
  return {
    success: true,
    data: mapMembershipToSubscription(membership),
  };
};

export const getQuota = async () => {
  const membership = await getCurrentMembership();
  let ridesCount = 0;
  try {
    const rides = await fetchRides({ isReservation: false });
    ridesCount = rides.filter((r) => r.status === 'COMPLETED').length;
  } catch {
    /* ignore */
  }
  return {
    success: true,
    data: mapQuotaFromMembership(membership, ridesCount).data,
  };
};

export const checkEligibility = async () => {
  const membership = await getCurrentMembership();
  const sub = mapMembershipToSubscription(membership);
  return {
    success: true,
    data: {
      hasActiveSubscription: sub.plan !== 'basic' && sub.status === 'ACTIVE',
      currentPlan: { name: sub.plan },
      eligible: sub.status === 'ACTIVE' || !membership,
    },
  };
};

export const getDriverInfo = async () => {
  const membership = await getCurrentMembership();
  const sub = mapMembershipToSubscription(membership);
  return {
    success: true,
    data: {
      subscription: sub,
      plan: sub.plan,
      status: sub.status,
    },
  };
};

export const getActiveSubscription = getMySubscription;
export const getSubscriptionHistory = async () => {
  const m = await getCurrentMembership();
  return { success: true, data: m ? [m] : [] };
};

export const subscribe = async (memberShipType) => {
  const validationCode = await graphqlClient(UPGRADE_ACCOUNT_MUTATION, {
    input: { memberShipType },
  });
  return {
    success: true,
    data: { validationCode, pending: true },
  };
};

export const getSubscriptionStatus = async () => {
  const m = await getCurrentMembership();
  return {
    success: true,
    data: { status: m?.status, validationCode: m?.validationCode },
  };
};

export const updateMembership = async (input) => {
  const data = await graphqlClient(UPDATE_MEMBERSHIP_MUTATION, { input });
  return data?.updateMemberShip;
};
