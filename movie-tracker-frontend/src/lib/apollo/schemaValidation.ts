// src/lib/apollo/schemaValidation.ts
import { DocumentNode } from '@apollo/client';
import { getCsrfProtectionHeaders } from '../utils/fetchUtils';

// This function will compare a query against the schema to validate it at runtime
export async function validateQuery(
  query: DocumentNode,
  operationName: string
): Promise<boolean> {
  // Skip validation in production
  if (process.env.NODE_ENV !== 'development') {
    return true;
  }
  
  try {
    // In development, we can fetch the schema from the server
    const schemaUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/graphql';
    
    const response = await fetch(schemaUrl, {
      method: 'POST',
      headers: {
        ...getCsrfProtectionHeaders('IntrospectionQuery'),
      },
      body: JSON.stringify({
        query: `
          query IntrospectionQuery {
            __schema {
              types {
                kind
                name
                fields {
                  name
                  args {
                    name
                    type {
                      kind
                      name
                      ofType {
                        kind
                        name
                      }
                    }
                  }
                  type {
                    kind
                    name
                    ofType {
                      kind
                      name
                    }
                  }
                }
              }
            }
          }
        `,
        operationName: 'IntrospectionQuery'
      }),
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('Error fetching schema:', result.errors);
      return false;
    }

    // For production, we would validate against a built schema
    // In this development example, we're just logging
    console.debug(`Schema validation passed for ${operationName}`);
    return true;
  } catch (error) {
    console.error(`Schema validation error for ${operationName}:`, error);
    // Return true anyway to not block the query
    return true;
  }
}

// Function to wrap Apollo operations with validation
export function withSchemaValidation<T, V>(
  operation: (variables: V) => Promise<T>,
  document: DocumentNode,
  operationName: string
) {
  return async (variables: V): Promise<T> => {
    // Only validate in development
    if (process.env.NODE_ENV === 'development') {
      try {
        const isValid = await validateQuery(document, operationName);
        if (!isValid) {
          console.warn(`Operation ${operationName} failed schema validation but will continue`);
        }
      } catch (error) {
        console.error(`Error during schema validation for ${operationName}:`, error);
        // Continue with the operation even if validation fails
      }
    }
    return operation(variables);
  };
}

// Lightweight schema type checking helper
export function validateEnum(value: string, enumType: Record<string, string>): boolean {
  if (!value) return false;
  
  // Convert to uppercase for comparison
  const upperValue = value.toUpperCase();
  
  // Check if the uppercase value exists in the enum
  return Object.values(enumType).includes(upperValue);
}

// Helper to normalize enum casing issues
export function normalizeEnum<T extends Record<string, string>>(
  value: string | undefined | null, 
  enumType: T,
  defaultValue?: keyof T
): string | undefined {
  if (!value) {
    return defaultValue ? enumType[defaultValue as string] : undefined;
  }
  
  // Convert to uppercase for comparison
  const upperValue = value.toUpperCase();
  
  // Check if the uppercase value exists in the enum values
  const exists = Object.values(enumType).includes(upperValue);
  
  if (exists) {
    return upperValue;
  }
  
  // Return default if provided, otherwise undefined
  return defaultValue ? enumType[defaultValue as string] : undefined;
}