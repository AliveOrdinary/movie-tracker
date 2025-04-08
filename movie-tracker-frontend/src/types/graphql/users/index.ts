// src/types/graphql/users/index.ts
import { gql } from '@apollo/client';

export const USER_FRAGMENT = gql`
  fragment UserDetails on User {
    id
    username
    email
    emailVerified
    avatarUrl
    bio
    roles
    createdAt
    updatedAt
    lastLoginAt
    lastActivityAt
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      ...UserDetails
    }
  }
  ${USER_FRAGMENT}
`;

export const SEARCH_USERS = gql`
  query SearchUsers($query: String!, $page: Int, $limit: Int) {
    searchUsers(q: $query, page: $page, per_page: $limit) {
      users {
        id
        username
        email
        avatarUrl
        roles
      }
      page
      total
      totalPages
    }
  }
`;

export const GET_USER_BY_USERNAME = gql`
  query GetUserByUsername($username: String!) {
    userByUsername(username: $username) {
      ...UserDetails
    }
  }
  ${USER_FRAGMENT}
`;

export const FOLLOW_USER = gql`
  mutation FollowUser($input: FollowUserInput!) {
    followUser(input: $input) {
      id
      following {
        id
        username
      }
      follower {
        id
        username
      }
    }
  }
`;

export const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: String!) {
    unfollowUser(userId: $userId)
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      ...UserDetails
    }
  }
  ${USER_FRAGMENT}
`;

export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  avatarUrl?: string;
  bio?: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastActivityAt?: string;
}

export interface PaginatedUsers {
  users: User[];
  page: number;
  total: number;
  totalPages: number;
}