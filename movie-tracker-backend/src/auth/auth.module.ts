// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { FirebaseModule } from '../firebase/firebase.module';
import { UsersModule } from '../modules/users/users.module';
import { GqlThrottlerGuard } from './guards/rate-limit.guard';
import { TokenModule } from './services/token.module';
import { Reflector } from '@nestjs/core';
import { PublicEndpointInterceptor } from './interceptors/public-endpoint.interceptor';
import { PublicAwareRolesGuard } from './guards/public-aware-roles.guard';

@Module({
  imports: [
    FirebaseModule,
    UsersModule,
    ConfigModule,
    TokenModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        throttlers: [{
          ttl: config.get('auth.security.rateLimitWindowMs', 900000),
          limit: config.get('auth.security.rateLimitMax', 100),
        }]
      }),
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    GqlThrottlerGuard,
    PublicEndpointInterceptor,
    PublicAwareRolesGuard,
  ],
  exports: [AuthService, PublicAwareRolesGuard, PublicEndpointInterceptor],
})
export class AuthModule {}