import { RIDE_FIELDS, PROPOSAL_PRICE_FIELDS } from '../fragments';

export const GET_RIDES_QUERY = `
  query GetRides($input: GetRidesInput) {
    getRides(input: $input) { ${RIDE_FIELDS} }
  }
`;

export const GET_PROPOSAL_PRICES_QUERY = `
  query GetProposalPrices($idRide: String!) {
    getProposalPrices(input: $idRide) { ${PROPOSAL_PRICE_FIELDS} }
  }
`;

export const GET_RIDES_HISTORY_QUERY = `
  query GetRidesHistory($idRide: ID!) {
    getRidesHistory(idRide: $idRide) {
      date
      code
    }
  }
`;
