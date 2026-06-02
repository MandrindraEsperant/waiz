import { USER_FIELDS } from '../fragments';

export const SIGNUP_MUTATION = `
  mutation Signup($input: SignupInput!) {
    signup(input: $input) { ${USER_FIELDS} }
  }
`;
