// src/auth/helpers/guard.helper.ts
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request, Response } from 'express';

export interface ThrottlerRequest extends Request {
  _rateLimit?: {
    current: number;
    limit: number;
    ttl: number;
    timeToExpire: number;
  };
}

export const getRequestResponse = (context: ExecutionContext): { 
  req: ThrottlerRequest; 
  res: Response; 
} => {
  const gqlCtx = GqlExecutionContext.create(context);
  const ctx = gqlCtx.getContext();
  return { 
    req: ctx.req, 
    res: ctx.res 
  };
};