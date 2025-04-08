// src/modules/storage/storage.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseStorageService } from './firebase-storage.service';
import { StorageResolver } from './storage.resolver';
import { StorageController } from './storage.controller';
import { FirebaseModule } from '../../firebase/firebase.module';
import { CacheModule } from '../cache/cache.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TokenModule } from '../../auth/services/token.module';

@Module({
  imports: [
    ConfigModule,
    FirebaseModule,
    CacheModule,
    UsersModule,
    TokenModule,
    AuthModule,
  ],
  providers: [FirebaseStorageService, StorageResolver],
  controllers: [StorageController],
  exports: [FirebaseStorageService],
})
export class StorageModule {} // Renamed from FirebaseStorageModule to StorageModule