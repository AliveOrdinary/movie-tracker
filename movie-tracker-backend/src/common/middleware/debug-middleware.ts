// src/common/middleware/debug-middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

/**
 * Middleware to debug HTTP requests to the GraphQL endpoint
 * This helps diagnose issues with Apollo Server's HTTP handling
 */
@Injectable()
export class GraphQLDebugMiddleware implements NestMiddleware {
  private readonly logger = new Logger('GraphQLDebug');

  use(req: Request, res: Response, next: NextFunction) {
    // Only debug GraphQL requests
    if (req.path.includes('/graphql')) {
      this.logger.debug(`GraphQL Request: ${req.method} ${req.path}`);
      this.logger.debug(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
      
      // Debug body for POST requests
      if (req.method === 'POST' && req.body) {
        try {
          const operationName = req.body.operationName || 'unknown';
          this.logger.debug(`Operation: ${operationName}`);
        } catch (e) {
          this.logger.debug('Could not parse body');
        }
      }
    }
    
    next();
  }
}