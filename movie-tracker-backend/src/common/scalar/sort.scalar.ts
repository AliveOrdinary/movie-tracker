// src/common/scalar/sort.scalar.ts
import { GraphQLScalarType, Kind } from 'graphql';

/**
 * Custom GraphQL scalar for sort field values
 */
export const SortFieldScalar = new GraphQLScalarType({
  name: 'SortField',
  description: 'A scalar representing a sort field',
  
  // Convert outgoing values
  serialize(value) {
    return value;
  },
  
  // Parse incoming values from variables
  parseValue(value) {
    return value;
  },
  
  // Parse incoming values from query literals
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return ast.value;
    }
    return null;
  },
});

/**
 * Custom GraphQL scalar for sort direction values
 */
export const SortDirectionScalar = new GraphQLScalarType({
  name: 'SortDirection',
  description: 'A scalar representing sort direction (ASC or DESC)',
  
  // Convert outgoing values
  serialize(value) {
    // Ensure it's always one of the valid directions
    if (value === 'ASC' || value === 'asc') return 'ASC';
    return 'DESC'; // Default to DESC for anything else
  },
  
  // Parse incoming values from variables
  parseValue(value) {
    if (value === 'ASC' || value === 'asc') return 'ASC';
    return 'DESC';
  },
  
  // Parse incoming values from query literals
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      const value = ast.value.toUpperCase();
      if (value === 'ASC') return 'ASC';
      return 'DESC';
    }
    return 'DESC';
  },
});
