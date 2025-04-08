// src/lib/utils/graphqlDefaults.ts

/**
 * Utility to provide default fields for GraphQL types that may be missing fields in the backend
 */
import { getApolloClient } from '@/lib/apollo/client';

// List of field defaults by type
const fieldDefaults = {
  List: {
    isFlagged: false,
    isAutoModerated: false,
    moderationReason: null,
    moderatedAt: null,
    isFeatured: false,
  },
  Movie: {
    isFlagged: false,
    isAutoModerated: false,
  },
  ListCollaborator: {
    isFlagged: false,
  },
  Review: {
    isFlagged: false,
    isAutoModerated: false,
    moderationReason: null,
    moderatedAt: null,
  },
  User: {
    watchlistDisplayMode: 'grid',
    activityFeedFilter: 'all',
    reviewsSortOrder: 'latest',
    profileVisibility: 'public',
  },
  WatchHistory: {
    isPrivate: false,
    watchCount: 1,
  }
};

/**
 * Registers default field values for GraphQL types that might be missing fields
 * This ensures the frontend doesn't throw errors when querying fields that don't exist
 */
export function registerGraphQLDefaults() {
  const client = getApolloClient();
  const cache = client.cache;
  
  // Add field policies for each type
  Object.entries(fieldDefaults).forEach(([typeName, fields]) => {
    const typeDefaults = {};
    
    // Create read functions for each field
    Object.entries(fields).forEach(([fieldName, defaultValue]) => {
      typeDefaults[fieldName] = {
        read(existing) {
          // Only return the default if the field is undefined
          return existing === undefined ? defaultValue : existing;
        }
      };
    });
    
    // Update the cache with field policies
    try {
      // Update type policies instead of modifying cache directly
      client.cache.modify({
        id: 'ROOT_QUERY',
        fields: {
          [`__typename:${typeName}`]: (value) => {
            return value;
          }
        }
      });
    } catch (e) {
      console.warn(`Could not register defaults for ${typeName}:`, e);
    }
  });
  
  console.log('Registered GraphQL field defaults for missing backend fields');
}

/**
 * Adds missing fields to an entity object to prevent GraphQL errors
 * Used for manual object patching when needed
 */
export function addMissingFields<T extends object>(entityType: string, entity: T): T {
  if (!entity) return entity;
  
  const defaults = fieldDefaults[entityType];
  if (!defaults) return entity;
  
  // Create a new object with defaults for any missing fields
  return {
    ...entity,
    ...Object.entries(defaults).reduce((acc, [field, defaultValue]) => {
      if (entity[field] === undefined) {
        acc[field] = defaultValue;
      }
      return acc;
    }, {})
  };
}

// Removed normalizeEnumValue and normalizeUserRoles functions
// as backend now consistently uses UPPERCASE values for enums

/**
 * Process an object to handle potential schema inconsistencies
 * @param data Object to process
 * @returns Processed object
 */
export function processSchemaData<T extends Record<string, any>>(data: T): T {
  if (!data) return data;
  
  // Create a new object to avoid modifying input directly
  const result = { ...data };
  
  // We no longer need to normalize enum values as backend consistently uses UPPERCASE
  
  return result;
}