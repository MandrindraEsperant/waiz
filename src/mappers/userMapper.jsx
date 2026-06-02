export const mapBackendUserToUi = (user) => {
  if (!user) return null;
  const role = user.role || '';
  return {
    id: user.id,
    nom: user.name || '',
    prenom: user.firstName || '',
    name: user.name,
    firstName: user.firstName,
    telephone: user.phone || '',
    phone: user.phone,
    email: user.email || '',
    role,
    driverAvailability: user.driverAvailability,
    isMembershipActive: user.isMembershipActive,
    lastPosition: user.lastPosition,
    type: role === 'DRIVER' ? 'chauffeur' : role === 'CUSTOMER' ? 'passager' : 'chauffeur',
  };
};

export const mapUiUserToSignupInput = ({ name, firstName, phone, email, password, role, passwordConfirmation }) => ({
  name: name?.trim(),
  firstName: firstName?.trim() || name?.trim(),
  phone,
  email: email?.trim(),
  password,
  role: role === 'chauffeur' || role === 'DRIVER' ? 'DRIVER' : 'CUSTOMER',
  passwordConfirmation: passwordConfirmation || password,
});

export const mapUiClientToLegacy = (user) => ({
  client_ID: user.id,
  id: user.id,
  Nom_client: `${user.firstName || ''} ${user.name || ''}`.trim() || user.email,
  Nom: user.name,
  Prenom: user.firstName,
  Email: user.email,
  Telephone: user.phone,
});
