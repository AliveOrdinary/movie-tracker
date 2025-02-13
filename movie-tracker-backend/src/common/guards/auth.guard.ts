//src/common/guards/auth.guard.ts
import { 
  CanActivate, 
  ExecutionContext, 
  Injectable, 
  Logger 
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FirebaseService } from '../../firebase/firebase.service';
import { 
  TokenMissingException, 
  InvalidTokenException 
} from '../exceptions/auth.exceptions';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      this.logger.warn('No authorization header found');
      throw new TokenMissingException();
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      this.logger.warn('Invalid token format in authorization header');
      throw new TokenMissingException('Invalid token format');
    }

    try {
      const decodedToken = await this.firebaseService.verifyIdToken(token);
      
      // Add decoded token to request for use in resolvers
      req.user = decodedToken;
      
      // Log successful authentication
      this.logger.debug(`User ${decodedToken.uid} authenticated successfully`);
      
      return true;
    } catch (error) {
      this.logger.error('Token verification failed', error);
      throw new InvalidTokenException();
    }
  }
}