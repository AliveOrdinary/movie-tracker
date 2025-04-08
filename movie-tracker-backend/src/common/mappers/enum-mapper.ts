// src/common/mappers/enum-mapper.ts
import { registerEnumType } from '@nestjs/graphql';
import { ListType, ListPrivacy, CollaboratorPermission } from '../enums';

// Register enums with GraphQL schema
// This ensures GraphQL schema uses the same values as the database
export function registerGraphQLEnums() {
  registerEnumType(ListType, {
    name: 'ListType',
    description: 'Type of list (standard or custom)',
    valuesMap: {
      STANDARD: { description: 'Standard list with unlimited entries' },
      CUSTOM: { description: 'Custom list with optional entry limit' },
    },
  });

  registerEnumType(ListPrivacy, {
    name: 'ListPrivacy',
    description: 'Privacy level of a list',
    valuesMap: {
      PUBLIC: { description: 'Visible to all users' },
      PRIVATE: { description: 'Only visible to owner and collaborators' },
      FOLLOWING: { description: 'Visible to followers only' },
    },
  });

  registerEnumType(CollaboratorPermission, {
    name: 'CollaboratorPermission',
    description: 'Permission level for list collaborators',
    valuesMap: {
      VIEW: { description: 'Can view the list only' },
      ADD_ITEMS: { description: 'Can add items to the list' },
      REMOVE_ITEMS: { description: 'Can remove items from the list' },
      EDIT_DETAILS: { description: 'Can edit list details' },
      INVITE_OTHERS: { description: 'Can invite others to collaborate' },
    },
  });
}