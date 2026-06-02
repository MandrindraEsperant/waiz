/**
 * Point d'entrée rétrocompatible — délègue aux services modulaires.
 */
import graphqlClient from '../graphql/client';
import { signup, verifyToken as verifyBearerToken } from './authService';
import { getCurrentMembership as getCurrentMemberShip } from './membershipService';

export { graphqlClient as graphqlRequest };
export default graphqlClient;
export { signup, verifyBearerToken, getCurrentMemberShip };
