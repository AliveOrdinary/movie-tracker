//src/common/interceptors/auth-error.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        if (error.code?.startsWith('auth/')) {
          return throwError(() => new UnauthorizedException('Authentication failed'));
        }
        return throwError(() => error);
      }),
    );
  }
}