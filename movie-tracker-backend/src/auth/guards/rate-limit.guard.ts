// src/auth/guards/rate-limit.guard.ts
import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { getOptionsToken, getStorageToken } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject(getOptionsToken()) protected readonly options: any,
    @Inject(getStorageToken()) protected readonly storageService: any,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }

  protected throwThrottlingException(context: ExecutionContext, throttlerLimitDetail: any): Promise<void> {
    throw new ThrottlerException('Too Many Requests');
    return Promise.resolve();
  }
}