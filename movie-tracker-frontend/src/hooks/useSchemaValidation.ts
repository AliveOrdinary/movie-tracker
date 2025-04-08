import { useEffect, useRef } from 'react';
import { 
  DocumentNode, 
  OperationVariables, 
  QueryResult, 
  MutationResult,
  useQuery as apolloUseQuery,
  useMutation as apolloUseMutation
} from '@apollo/client';
import { validateQuery } from '@/lib/apollo/schemaValidation';

// Hook for validating queries
export function useValidatedQuery<TData = any, TVariables = OperationVariables>(
  query: DocumentNode,
  options?: Parameters<typeof apolloUseQuery<TData, TVariables>>[1]
): QueryResult<TData, TVariables> {
  const operationName = query.definitions[0]?.kind === 'OperationDefinition' 
    ? query.definitions[0]?.name?.value || 'UnknownQuery'
    : 'UnknownQuery';
  
  const validationRef = useRef(false);
  
  const result = apolloUseQuery<TData, TVariables>(query, options);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !validationRef.current) {
      validationRef.current = true;
      validateQuery(query, operationName).then(isValid => {
        if (!isValid) {
          console.warn(`Query ${operationName} failed schema validation`);
        }
      });
    }
  }, [query, operationName]);
  
  return result;
}

// Hook for validating mutations
export function useValidatedMutation<TData = any, TVariables = OperationVariables>(
  mutation: DocumentNode,
  options?: Parameters<typeof apolloUseMutation<TData, TVariables>>[1]
): ReturnType<typeof apolloUseMutation<TData, TVariables>> {
  const operationName = mutation.definitions[0]?.kind === 'OperationDefinition'
    ? mutation.definitions[0]?.name?.value || 'UnknownMutation'
    : 'UnknownMutation';
  
  const validationRef = useRef(false);
  
  const result = apolloUseMutation<TData, TVariables>(mutation, options);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !validationRef.current) {
      validationRef.current = true;
      validateQuery(mutation, operationName).then(isValid => {
        if (!isValid) {
          console.warn(`Mutation ${operationName} failed schema validation`);
        }
      });
    }
  }, [mutation, operationName]);
  
  return result;
}
