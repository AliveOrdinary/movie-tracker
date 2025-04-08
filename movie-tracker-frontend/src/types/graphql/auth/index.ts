// src/graphql/auth/index.ts
import { gql } from '@apollo/client';
import { User, LoginResponse } from '@/types/auth';

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
      lastLoginAt
      lastActivityAt
      avatarUrl
      isBanned
      bannedAt
      suspendedUntil
      warningCount
      lastWarningAt
      profileVisibility
      showOnlineStatus
      showActivity
      allowFriendRequests
      showWatchlist
      watchlistDisplayMode
      activityFeedFilter
      reviewsSortOrder
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
        lastLoginAt
        lastActivityAt
        avatarUrl
        isBanned
        bannedAt
        suspendedUntil
        warningCount
        lastWarningAt
        profileVisibility
        showOnlineStatus
        showActivity
        allowFriendRequests
        showWatchlist
        watchlistDisplayMode
        activityFeedFilter
        reviewsSortOrder
      }
      token
    }
  }
`;

export const SEND_EMAIL_VERIFICATION = gql`
  mutation SendEmailVerification {
    sendEmailVerification
  }
`;

export const VERIFY_EMAIL = gql`
  mutation VerifyEmail {
    verifyEmail
  }
`;

export const INITIATE_PASSWORD_RESET = gql`
  mutation InitiatePasswordReset($input: InitiatePasswordResetInput!) {
    initiatePasswordReset(input: $input)
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

// Type definitions for GraphQL operations
export type MeQuery = {
  me: User;
};

export type LoginMutation = {
  login: LoginResponse;
};

export type ChangePasswordMutation = {
  changePassword: boolean;
};

export type SendEmailVerificationMutation = {
  sendEmailVerification: boolean;
};

export type VerifyEmailMutation = {
  verifyEmail: boolean;
};

export type InitiatePasswordResetMutation = {
  initiatePasswordReset: boolean;
};

export type LogoutMutation = {
  logout: boolean;
};