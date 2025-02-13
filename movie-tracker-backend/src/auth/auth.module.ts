// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { TokenService } from './services/token.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { UsersModule } from '../modules/users/users.module';
import { GqlThrottlerGuard } from './guards/rate-limit.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    FirebaseModule,
    UsersModule,
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<ThrottlerModuleOptions> => ({
        throttlers: [{
          ttl: config.get('auth.security.rateLimitWindowMs', 900000),
          limit: config.get('auth.security.rateLimitMax', 100),
        }],
      }),
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    TokenService,
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}