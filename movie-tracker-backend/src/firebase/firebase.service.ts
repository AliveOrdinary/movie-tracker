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

      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
          storageBucket
        });

        this.firebaseAuth = admin.auth(this.firebaseApp);
        this.firebaseStorage = admin.storage(this.firebaseApp);
        
        this.logger.log('Firebase initialized successfully');
      } else {
        this.firebaseApp = admin.app();
        this.firebaseAuth = admin.auth(this.firebaseApp);
        this.firebaseStorage = admin.storage(this.firebaseApp);
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', error);
      throw error;
    }
  }

  // Auth Methods
  async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.firebaseAuth.verifyIdToken(token);
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      throw new Error('Invalid token');
    }
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseAuth.getUser(uid);
    } catch (error) {
      this.logger.error(`Failed to get user: ${uid}`, error);
      throw new Error('User not found');
    }
  }

  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseAuth.getUserByEmail(email);
    } catch (error) {
      this.logger.error(`Failed to get user by email: ${email}`, error);
      throw new Error('User not found');
    }
  }

  async createUser(userData: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseAuth.createUser(userData);
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateUser(uid: string, data: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseAuth.updateUser(uid, data);
    } catch (error) {
      this.logger.error(`Failed to update user: ${uid}`, error);
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await this.firebaseAuth.deleteUser(uid);
    } catch (error) {
      this.logger.error(`Failed to delete user: ${uid}`, error);
      throw new Error('Failed to delete user');
    }
  }

  // Token Management
  async revokeRefreshTokens(uid: string): Promise<void> {
    try {
      await this.firebaseAuth.revokeRefreshTokens(uid);
    } catch (error) {
      this.logger.error(`Failed to revoke refresh tokens for user: ${uid}`, error);
      throw new Error('Failed to revoke refresh tokens');
    }
  }

  // Email Actions
  async generatePasswordResetLink(email: string, actionCodeSettings?: admin.auth.ActionCodeSettings): Promise<string> {
    try {
      return await this.firebaseAuth.generatePasswordResetLink(email, actionCodeSettings);
    } catch (error) {
      this.logger.error(`Failed to generate password reset link for: ${email}`, error);
      throw new Error('Failed to generate password reset link');
    }
  }

  async generateEmailVerificationLink(email: string, actionCodeSettings?: admin.auth.ActionCodeSettings): Promise<string> {
    try {
      return await this.firebaseAuth.generateEmailVerificationLink(email, actionCodeSettings);
    } catch (error) {
      this.logger.error(`Failed to generate email verification link for: ${email}`, error);
      throw new Error('Failed to generate email verification link');
    }
  }

  // Storage Methods
  // Storage Methods
async uploadFile(
  filePath: string, 
  file: Buffer, 
  metadata?: { contentType?: string; [key: string]: any }
): Promise<string> {
  try {
    const bucket = this.firebaseStorage.bucket();
    const fileRef = bucket.file(filePath);
    
    await fileRef.save(file, {
      metadata: metadata || {
        contentType: 'application/octet-stream',
      },
    });

    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return url;
  } catch (error) {
    this.logger.error(`Failed to upload file: ${filePath}`, error);
    throw new Error('Failed to upload file');
  }
}

  async deleteFile(filePath: string): Promise<void> {
    try {
      const bucket = this.firebaseStorage.bucket();
      const file = bucket.file(filePath);
      await file.delete();
    } catch (error) {
      this.logger.error(`Failed to delete file: ${filePath}`, error);
      throw new Error('Failed to delete file');
    }
  }

  // Helper Methods
  async getStorageDownloadUrl(filePath: string): Promise<string> {
    try {
      const bucket = this.firebaseStorage.bucket();
      const file = bucket.file(filePath);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      });
      return url;
    } catch (error) {
      this.logger.error(`Failed to get download URL for: ${filePath}`, error);
      throw new Error('Failed to get download URL');
    }
  }

  // Getters for Firebase instances
  get app(): App {
    return this.firebaseApp;
  }

  get auth(): Auth {
    return this.firebaseAuth;
  }

  get storage(): Storage {
    return this.firebaseStorage;
  }
}