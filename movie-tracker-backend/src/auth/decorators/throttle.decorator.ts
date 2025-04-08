// src/auth/decorators/throttle.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const THROTTLE_LIMIT_KEY = 'throttler:limit';
export const THROTTLE_TTL_KEY = 'throttler:ttl';
export const THROTTLE_SKIP_KEY = 'throttler:skip';

/**
 * Custom decorator to set throttling limits for a specific route
 * @param limit The maximum number of requests within the time window
 * @param ttl The time window in milliseconds
 */
export const Throttle = (limit: number, ttl: number) => 
  SetMetadata(THROTTLE_LIMIT_KEY, { limit, ttl });

/**
 * Decorator to skip throttling for a specific route
 */
export const SkipThrottle = () => 
  SetMetadata(THROTTLE_SKIP_KEY, true);
