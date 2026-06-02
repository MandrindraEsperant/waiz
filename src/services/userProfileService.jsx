import graphqlClient from '../graphql/client';
import { UPDATE_USER_MUTATION } from '../graphql/mutations/user.mutations';
import { DELETE_USER_MUTATION } from '../graphql/mutations/user.mutations';
import { VERIFY_BEARER_TOKEN_QUERY } from '../graphql/queries/auth.queries';
import { mapBackendUserToUi, mapUiClientToLegacy } from '../mappers/userMapper';
import { signup } from './authService';
import { fetchRides } from './rideService';

const CAR_STORAGE_PREFIX = 'waiz_driver_car_';

export const getProfile = async () => {
  const data = await graphqlClient(VERIFY_BEARER_TOKEN_QUERY);
  const user = mapBackendUserToUi(data?.verifyBearerToken);
  const car = getStoredVehicle(user?.id);
  return { success: true, data: { ...user, vehicule: car } };
};

export const updateProfile = async (input) => {
  const data = await graphqlClient(UPDATE_USER_MUTATION, { input });
  return mapBackendUserToUi(data?.updateUser);
};

export const updateDriverPosition = async (latitude, longitude) =>
  updateProfile({
    lastPosition: { latitude, longitude },
  });

export const updateDriverAvailability = async (driverAvailability) =>
  updateProfile({ driverAvailability });

/** Véhicule : stockage local (entité Car absente du schéma GraphQL) */
export const getStoredVehicle = (driverId) => {
  if (!driverId) return null;
  try {
    const raw = localStorage.getItem(`${CAR_STORAGE_PREFIX}${driverId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveVehicle = async (driverId, vehicle) => {
  localStorage.setItem(`${CAR_STORAGE_PREFIX}${driverId}`, JSON.stringify(vehicle));
  return { success: true, data: vehicle };
};

export const fetchVehicle = async (driverId) => ({
  success: true,
  data: getStoredVehicle(driverId),
});

/** Clients dérivés des courses du chauffeur */
export const fetchClientsFromRides = async () => {
  const rides = await fetchRides({});
  const clientsMap = new Map();
  rides.forEach((ride) => {
    if (ride.customer?.id) {
      clientsMap.set(ride.customer.id, mapUiClientToLegacy(ride.customer));
    }
  });
  return [...clientsMap.values()];
};

export const addClient = async (clientData) => {
  const created = await signup({
    name: clientData.Nom || clientData.nom,
    firstName: clientData.Prenom || clientData.prenom || clientData.Nom,
    phone: clientData.Telephone || clientData.telephone,
    email: clientData.Email || clientData.email,
    password: clientData.mot_de_passe || 'WaizTemp1!',
    role: 'CUSTOMER',
    passwordConfirmation: clientData.mot_de_passe || 'WaizTemp1!',
  });
  return mapUiClientToLegacy(created);
};

export const updateClient = async (id, clientData) => {
  await graphqlClient(UPDATE_USER_MUTATION, {
    input: {
      name: clientData.Nom,
      firstName: clientData.Prenom,
      phone: clientData.Telephone,
      email: clientData.Email,
    },
  });
  return { client_ID: id, ...clientData };
};

export const deleteClient = async (id) => {
  await graphqlClient(DELETE_USER_MUTATION, { id });
};

export const searchClientsByPhone = async (phone, clients) => {
  const list = clients || (await fetchClientsFromRides());
  return list.filter((c) => String(c.Telephone || '').includes(String(phone)));
};
