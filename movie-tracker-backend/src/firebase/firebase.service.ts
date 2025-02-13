// src/firebase/firebase.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { App } from 'firebase-admin/app';
import { Auth } from 'firebase-admin/auth';
import { Storage } from 'firebase-admin/storage';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: App;
  private firebaseAuth: Auth;
  private firebaseStorage: Storage;
  
  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
      const storageBucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET');

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Firebase configuration is missing');
      }

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: storageBucket
      });

      this.firebaseAuth = admin.auth(this.firebaseApp);
      this.firebaseStorage = admin.storage(this.firebaseApp);
      
      this.logger.log('Firebase initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', error);
      throw error;
    }
  }

  get app(): App {
    return this.firebaseApp;
  }

  get auth(): Auth {
    return this.firebaseAuth;
  }

  get storage(): Storage {
    return this.firebaseStorage;
  }

  async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.auth.verifyIdToken(token);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async generatePasswordResetLink(email: string, actionCodeSettings?: admin.auth.ActionCodeSettings): Promise<string> {
    try {
      return await this.auth.generatePasswordResetLink(email, actionCodeSettings);
    } catch (error) {
      throw new Error('Failed to generate password reset link');
    }
  }

  async generateEmailVerificationLink(email: string, actionCodeSettings?: admin.auth.ActionCodeSettings): Promise<string> {
    try {
      return await this.auth.generateEmailVerificationLink(email, actionCodeSettings);
    } catch (error) {
      throw new Error('Failed to generate email verification link');
    }
  }

  async revokeRefreshTokens(uid: string): Promise<void> {
    try {
      await this.auth.revokeRefreshTokens(uid);
    } catch (error) {
      throw new Error('Failed to revoke refresh tokens');
    }
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.getUser(uid);
    } catch (error) {
      throw new Error('User not found');
    }
  }

  async updateUser(uid: string, properties: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.updateUser(uid, properties);
    } catch (error) {
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await this.auth.deleteUser(uid);
    } catch (error) {
      throw new Error('Failed to delete user');
    }
  }
}