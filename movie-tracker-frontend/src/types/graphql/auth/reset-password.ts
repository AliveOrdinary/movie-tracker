import { gql } from '@apollo/client';

export const VERIFY_PASSWORD_RESET_CODE = gql`
  mutation VerifyPasswordResetCode($code: String!) {
    verifyPasswordResetCode(code: $code) {
      isValid
      email
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`;
