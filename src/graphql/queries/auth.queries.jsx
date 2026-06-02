import { USER_FIELDS } from '../fragments';

export const SIGNIN_QUERY = `
  query Signin($input: SigninInput!) {
    signin(input: $input) {
      token
      user { ${USER_FIELDS} }
    }
  }
`;

export const VERIFY_BEARER_TOKEN_QUERY = `
  query VerifyBearerToken {
    verifyBearerToken { ${USER_FIELDS} }
  }
`;
