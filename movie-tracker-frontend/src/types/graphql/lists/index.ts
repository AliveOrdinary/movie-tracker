// src/types/graphql/lists/index.ts
import { gql } from '@apollo/client';

export enum ListType {
  STANDARD = 'STANDARD',
  CUSTOM = 'CUSTOM'
}
  
  export enum ListPrivacy {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  FOLLOWING = 'FOLLOWING'
}
  
export enum CollaboratorPermission {
  VIEW = 'VIEW',
  ADD_ITEMS = 'ADD_ITEMS',
  REMOVE_ITEMS = 'REMOVE_ITEMS',
  EDIT_DETAILS = 'EDIT_DETAILS',
  INVITE_OTHERS = 'INVITE_OTHERS'
}

  
  export const LIST_FRAGMENT = gql`
    fragment ListDetails on List {
      id
      name
      description
      thumbnail
      type
      privacy
      category
      maxEntries
      favoriteCount
      itemCount
      isFavorited
      isCollaborator
      userPermissions
      createdAt
      updatedAt
      owner {
        id
        username
        avatarUrl
      }
      collaborators {
        id
        user {
          id
          username
          avatarUrl
        }
        permissions
        createdAt
      }
    }
  `;
  
  export const CREATE_LIST = gql`
    mutation CreateList($input: CreateListInput!) {
      createList(input: $input) {
        id
        name
        description
        type
        privacy
        category
        maxEntries
        favoriteCount
        owner {
          id
          username
        }
        createdAt
        updatedAt
      }
    }
  `;
  
  export const UPDATE_LIST = gql`
    mutation UpdateList($input: UpdateListInput!) {
      updateList(input: $input) {
        ...ListDetails
      }
    }
    ${LIST_FRAGMENT}
  `;
  
  export const DELETE_LIST = gql`
    mutation DeleteList($id: String!) {
      deleteList(id: $id)
    }
  `;
  
  export const ADD_LIST_ITEM = gql`
    mutation AddListItem($input: AddListItemInput!) {
      addListItem(input: $input) {
        id
        tmdbId
        order
        createdAt
        addedBy {
          id
          username
        }
      }
    }
  `;
  
  export const REMOVE_LIST_ITEM = gql`
    mutation RemoveListItem($listId: String!, $itemId: String!) {
      removeListItem(listId: $listId, itemId: $itemId)
    }
  `;
  
  export const FAVORITE_LIST = gql`
    mutation FavoriteList($listId: String!) {
      favoriteList(listId: $listId)
    }
  `;

  export const BULK_ADD_MOVIES = gql`
    mutation BulkAddMovies($input: BulkMovieAddInput!) {
      bulkAddMovies(input: $input) {
        id
        tmdbId
        order
        addedBy {
          id
          username
        }
        list {
          id
          name
        }
      }
    }
  `;
  
  export const BULK_REMOVE_MOVIES = gql`
    mutation BulkRemoveMovies($input: BulkMovieRemoveInput!) {
      bulkRemoveMovies(input: $input)
    }
  `;
  
  export const GET_MY_LISTS = gql`
    query GetMyLists($type: ListType) {
      myLists(type: $type) {
        ...ListDetails
      }
    }
    ${LIST_FRAGMENT}
  `;
  
  export const GET_COLLABORATIVE_LISTS = gql`
    query GetCollaborativeLists {
      collaborativeLists {
        ...ListDetails
      }
    }
    ${LIST_FRAGMENT}
  `;
  
  export const GET_FAVORITED_LISTS = gql`
    query GetFavoritedLists($page: Int!, $limit: Int!) {
      favoritedLists(page: $page, limit: $limit) {
        items {
          ...ListDetails
        }
        total
        page
        totalPages
      }
    }
    ${LIST_FRAGMENT}
  `;
  
  export const GET_TRENDING_LISTS = gql`
    query GetTrendingLists($timeframe: String!, $page: Int!, $limit: Int!) {
      trendingLists(timeframe: $timeframe, page: $page, limit: $limit) {
        items {
          ...ListDetails
        }
        total
        page
        totalPages
      }
    }
    ${LIST_FRAGMENT}
  `;
  
  export const GET_LIST_ITEMS = gql`
    query GetListItems($listId: String!) {
      listItems(listId: $listId) {
        id
        list {
          id
          name
        }
        order
        createdAt
        addedBy {
          id
          username
          avatarUrl
        }
        movie {
          id
          tmdbId
          title
          posterPath
          posterUrl
        }
      }
    }
  `;

  export const BULK_REORDER_LIST_ITEMS = gql`
    mutation ReorderListItems($input: BulkListItemReorderInput!) {
      reorderListItems(input: $input)
    }
  `;

  export const ADD_COLLABORATOR = gql`
    mutation AddCollaborator($input: AddCollaboratorInput!) {
      addCollaborator(input: $input) {
        id
        permissions
        user {
          id
          username
          avatarUrl
        }
        createdAt
      }
    }
  `;

  export const REMOVE_COLLABORATOR = gql`
    mutation RemoveCollaborator($listId: String!, $collaboratorId: String!) {
      removeCollaborator(listId: $listId, collaboratorId: $collaboratorId)
    }
  `;

  export const UPDATE_COLLABORATOR = gql`
    mutation UpdateCollaborator($listId: String!, $collaboratorId: String!, $permissions: [CollaboratorPermission!]!) {
      updateCollaborator(listId: $listId, collaboratorId: $collaboratorId, permissions: $permissions) {
        id
        permissions
        user {
          id
          username
        }
      }
    }
  `;

  export const GET_LIST_BY_ID = gql`
    query GetListById($id: String!) {
      getList(id: $id) {
        ...ListDetails
      }
    }
    ${LIST_FRAGMENT}
  `;
  
  // Types
  export interface ListCollaborator {
    id: string;
    user: {
      id: string;
      username: string;
      avatarUrl?: string;
    };
    permissions: CollaboratorPermission[];
    createdAt: string;
  }
  
  export interface List {
    id: string;
    name: string;
    description?: string;
    thumbnail?: string;
    type: ListType;
    privacy: ListPrivacy;
    category?: string;
    maxEntries?: number;
    favoriteCount: number;
    itemCount: number;
    isFavorited: boolean;
    isCollaborator: boolean;
    userPermissions?: CollaboratorPermission[];
    createdAt: string;
    updatedAt: string;
    owner: {
      id: string;
      username: string;
      avatarUrl?: string;
    };
    collaborators: ListCollaborator[];
  }
  
  export interface ListResponse {
    items: List[];
    total: number;
    page: number;
    totalPages: number;
  }

  export interface CreateListInput {
    name: string;
    description?: string;
    type?: ListType;
    privacy?: ListPrivacy;
    category?: string;
    maxEntries?: number;
  }

  export interface UpdateListInput {
    id: string;
    name?: string;
    description?: string;
    privacy?: ListPrivacy;
    category?: string;
    thumbnail?: string;
  }

  export interface AddListItemInput {
    listId: string;
    tmdbId: number;
    order?: number;
  }

  export interface ListItem {
    id: string;
    list: {
      id: string;
      name: string;
    };
    order: number;
    createdAt: string;
    addedBy: {
      id: string;
      username: string;
      avatarUrl?: string;
    };
    movie: {
      id: string; // The internal UUID used for database relations
      tmdbId: number; // The TMDB ID (number) used for lookups and display
      title: string;
      posterPath?: string;
      posterUrl?: string;
    };
  }

  export interface BulkListItemReorderInput {
    listId: string;
    itemIds: string[];
  }

  export interface BulkMovieAddInput {
    listId: string;
    tmdbIds: number[];
  }

  export interface BulkMovieRemoveInput {
    listId: string;
    tmdbIds: number[];
  }
  
  export interface AddCollaboratorInput {
    listId: string;
    userId: string;
    permissions: CollaboratorPermission[];
  }