// src/auth/guards/gql-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from './auth.guard';

/**
 * GraphQL-specific implementation of the AuthGuard
 * Handles the context extraction for GraphQL requests
 */
@Injectable()
export class GqlAuthGuard extends AuthGuard {
  /**
   * Get the request from the GraphQL context
   * @param context The execution context
   * @returns The request object
   */
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}