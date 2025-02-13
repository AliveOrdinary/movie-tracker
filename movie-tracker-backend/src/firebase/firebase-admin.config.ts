// src/firebase/firebase-admin.config.ts
import * as admin from 'firebase-admin';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseAdminService {
  constructor(private configService: ConfigService) {
    const serviceAccount = {
      projectId: configService.get('FIREBASE_PROJECT_ID'),
      privateKey: configService.get('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
      clientEmail: configService.get('FIREBASE_CLIENT_EMAIL'),
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }

  getAuth() {
    return admin.auth();
  }
}