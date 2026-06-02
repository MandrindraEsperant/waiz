import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:8000';
const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || `${apiBaseUrl}/graphql`;

const httpLink = createHttpLink({ uri: GRAPHQL_URL });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  return { headers: { ...headers, authorization: token ? `Bearer ${token}` : '' } };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});