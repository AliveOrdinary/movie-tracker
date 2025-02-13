// src/auth/pipes/firebase-token.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FirebaseTokenPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      throw new BadRequestException('Firebase token is required');
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('Firebase token must be a string');
    }

    // Basic JWT format validation
    const parts = value.split('.');
    if (parts.length !== 3) {
      throw new BadRequestException('Invalid token format');
    }

    return value;
  }
}