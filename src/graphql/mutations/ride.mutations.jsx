import { RIDE_FIELDS, PROPOSAL_PRICE_FIELDS } from '../fragments';

export const CREATE_RIDE_MUTATION = `
  mutation CreateRide($input: CreateRideInput!) {
    createRide(input: $input) { ${RIDE_FIELDS} }
  }
`;

export const UPDATE_RIDE_MUTATION = `
  mutation UpdateRide($input: UpdateRideInput!) {
    updateRide(input: $input) { ${RIDE_FIELDS} }
  }
`;

export const REJECT_RIDE_MUTATION = `
  mutation RejectRide($input: RejectRideInput!) {
    rejectRide(input: $input)
  }
`;

export const PROPOSE_PRICE_MUTATION = `
  mutation ProposePrice($input: DriverProposalPriceInput!) {
    proposePrice(input: $input) { ${PROPOSAL_PRICE_FIELDS} }
  }
`;

export const ACCEPT_PROPOSAL_PRICE_MUTATION = `
  mutation AcceptProposalPrice($idDriverProposalPrice: ID!) {
    acceptProposalPrice(idDriverProposalPrice: $idDriverProposalPrice) { ${RIDE_FIELDS} }
  }
`;
