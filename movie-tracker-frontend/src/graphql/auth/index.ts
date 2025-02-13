import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      username
      roles
      emailVerified
      createdAt
      updatedAt
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        username
        roles
        emailVerified
        createdAt
        updatedAt
      }
    }
  }
`;

export const SEND_EMAIL_VERIFICATION = gql`
  mutation SendEmailVerification {
    sendEmailVerification
  }
`;

export const CONFIRM_EMAIL_VERIFICATION = gql`
  mutation ConfirmEmailVerification($code: String!) {
    confirmEmailVerification(code: $code)
  }
`;

export const INITIATE_PASSWORD_RESET = gql`
  mutation InitiatePasswordReset($email: String!) {
    initiatePasswordReset(email: $email)
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;