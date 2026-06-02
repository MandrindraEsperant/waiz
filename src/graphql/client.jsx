import http, { GRAPHQL_URL } from '../services/http';

const parseGraphqlError = (error) => {
  if (!error) return 'Erreur inconnue';
  const gqlErrors = error.response?.data?.errors;
  if (gqlErrors?.length) {
    return gqlErrors.map((e) => e.message).join(' | ');
  }
  if (error.message) return error.message;
  return 'Erreur GraphQL';
};

/**
 * Client GraphQL unique — point d'entrée pour toutes les requêtes API.
 */
export const graphqlClient = async (query, variables = {}) => {
  try {
    const response = await http.post(GRAPHQL_URL, { query, variables });
    if (response.data?.errors?.length) {
      throw new Error(parseGraphqlError({ response }));
    }
    return response.data?.data ?? null;
  } catch (error) {
    throw new Error(parseGraphqlError(error));
  }
};

export default graphqlClient;
