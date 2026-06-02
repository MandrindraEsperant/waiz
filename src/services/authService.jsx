import graphqlClient from '../graphql/client';
import { SIGNIN_QUERY, VERIFY_BEARER_TOKEN_QUERY } from '../graphql/queries/auth.queries';
import { SIGNUP_MUTATION } from '../graphql/mutations/auth.mutations';
import { mapBackendUserToUi, mapUiUserToSignupInput } from '../mappers/userMapper';

export const signin = async ({ email, password }) => {
  const data = await graphqlClient(SIGNIN_QUERY, {
    input: { email, password }, 
  });
  const payload = data?.signin;
  if (!payload?.token || !payload?.user) {
    throw new Error('Échec de la connexion');
  }
  return {
    token: payload.token,
    user: mapBackendUserToUi(payload.user),
  };
};

export const verifyToken = async () => {
  const data = await graphqlClient(VERIFY_BEARER_TOKEN_QUERY);
  return mapBackendUserToUi(data?.verifyBearerToken);
};

export const signup = async (input) => {
  const gqlInput = typeof input.role === 'string' && ['DRIVER', 'CUSTOMER'].includes(input.role)
    ? input
    : mapUiUserToSignupInput(input);
  const data = await graphqlClient(SIGNUP_MUTATION, { input: gqlInput });
  return mapBackendUserToUi(data?.signup);
};

/** Réinitialisation mot de passe : non exposée en GraphQL backend */
export const requestPasswordReset = async () => {
  throw new Error('PASSWORD_RESET_NOT_AVAILABLE');
};

export const verifyResetCode = async () => {
  throw new Error('PASSWORD_RESET_NOT_AVAILABLE');
};

export const resetPassword = async () => {
  throw new Error('PASSWORD_RESET_NOT_AVAILABLE');
};
