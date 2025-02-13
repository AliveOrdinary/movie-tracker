//src/auth/guards/firebase-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { FirebaseService } from '../../firebase/firebase.service';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class FirebaseAuthGuard extends AuthGuard('firebase-jwt') {
  constructor(
    private firebaseService: FirebaseService,
    private usersService: UsersService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = await this.firebaseService.verifyIdToken(token);
      
      if (!decodedToken.email) {
        throw new UnauthorizedException('Email is required');
      }

      // Get or create user in our database
      let user = await this.usersService.findByFirebaseUid(decodedToken.uid);
      if (!user) {
        user = await this.usersService.createFirebaseUser({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          displayName: decodedToken.name || `user_${decodedToken.uid}`,
        });
      }

      // Attach user to request
      req.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}