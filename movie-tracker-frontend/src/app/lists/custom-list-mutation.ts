import { gql } from '@apollo/client';
import { ListType, ListPrivacy } from '@/types/graphql/lists';

// Custom mutation that now uses proper enum types
export const CREATE_LIST_DIRECT = gql`
  mutation CreateListDirect($name: String!, $description: String, $type: ListType!, $privacy: ListPrivacy!, $category: String, $maxEntries: Float) {
    createList(input: {
      name: $name,
      description: $description,
      type: $type,
      privacy: $privacy,
      category: $category,
      maxEntries: $maxEntries
    }) {
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
