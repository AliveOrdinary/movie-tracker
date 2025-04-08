// src/auth/interceptors/public-endpoint.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_PUBLIC_KEY } from '../guards/auth.guard';

/**
 * Interceptor to ensure public endpoints are respected
 * This helps bypass additional guards like RolesGuard for endpoints marked with @Public()
 */
@Injectable()
export class PublicEndpointInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Set a flag in the request to indicate this is a public endpoint
      // This can be checked by other guards
      const ctx = GqlExecutionContext.create(context);
      const req = ctx.getContext().req;
      req.isPublicEndpoint = true;
    }

    return next.handle();
  }
}
