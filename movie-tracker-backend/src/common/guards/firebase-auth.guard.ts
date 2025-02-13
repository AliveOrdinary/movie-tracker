// src/common/guards/firebase-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FirebaseAdminService } from '../../firebase/firebase-admin.config';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private firebaseAdminService: FirebaseAdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return false;
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await this.firebaseAdminService
        .getAuth()
        .verifyIdToken(token);
      req.user = decodedToken;
      return true;
    } catch (error) {
      return false;
    }
  }
}
