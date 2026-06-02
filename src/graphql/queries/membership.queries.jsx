import { MEMBERSHIP_FIELDS, MEMBERSHIP_TYPE_FIELDS } from '../fragments';

export const GET_CURRENT_MEMBERSHIP_QUERY = `
  query GetCurrentMemberShip {
    getCurrentMemberShip { ${MEMBERSHIP_FIELDS} }
  }
`;

export const GET_MEMBERSHIP_TYPES_QUERY = `
  query GetMemberShipTypes {
    getMemberShipTypes { ${MEMBERSHIP_TYPE_FIELDS} }
  }
`;

export const GET_MEMBERSHIPS_QUERY = `
  query GetMemberShips($input: MemberShipsInput) {
    getMemberShips(input: $input) { ${MEMBERSHIP_FIELDS} }
  }
`;
