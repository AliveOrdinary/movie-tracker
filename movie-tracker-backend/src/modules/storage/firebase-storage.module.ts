// src/modules/storage/firebase-storage.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseStorageService } from './firebase-storage.service';
import { FirebaseModule } from '../../firebase/firebase.module';

@Module({
  imports: [
    ConfigModule,
    FirebaseModule,  // Add this import
  ],
  providers: [FirebaseStorageService],
  exports: [FirebaseStorageService],
})
export class FirebaseStorageModule {}