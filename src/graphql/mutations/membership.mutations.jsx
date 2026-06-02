import { MEMBERSHIP_FIELDS, MEMBERSHIP_TYPE_FIELDS } from '../fragments';

export const UPGRADE_ACCOUNT_MUTATION = `
  mutation UpgradeAccount($input: UpgradeAccountInput!) {
    upgradeAccount(input: $input)
  }
`;

export const UPDATE_MEMBERSHIP_MUTATION = `
  mutation UpdateMemberShip($input: UpdateMemberShipInput!) {
    updateMemberShip(input: $input) { ${MEMBERSHIP_FIELDS} }
  }
`;

export const CREATE_MEMBERSHIP_TYPE_MUTATION = `
  mutation CreateMemberShipType($input: CreateMemberShipTypeInput!) {
    createMemberShipType(input: $input) { ${MEMBERSHIP_TYPE_FIELDS} }
  }
`;
