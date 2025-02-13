// src/auth/decorators/throttle.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const THROTTLE_LIMIT = 'THROTTLE_LIMIT';
export const THROTTLE_TTL = 'THROTTLE_TTL';
export const THROTTLE_SKIP = 'THROTTLE_SKIP';

export const Throttle = (limit: number, ttl: number) => 
  SetMetadata(THROTTLE_LIMIT, { limit, ttl });

export const SkipThrottle = () => 
  SetMetadata(THROTTLE_SKIP, true);

export const getThrottleSettings = (reflector: Reflector, context: any) => {
  const throttleLimit = reflector.get(THROTTLE_LIMIT, context);
  const throttleSkip = reflector.get(THROTTLE_SKIP, context);
  
  return {
    throttleLimit,
    throttleSkip,
  };
};