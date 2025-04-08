// src/auth/services/token.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TokenService } from './token.service';
import { CacheModule } from '../../modules/cache/cache.module';

@Module({
  imports: [
    ConfigModule,
    CacheModule,
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}