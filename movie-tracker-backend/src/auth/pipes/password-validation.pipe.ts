// src/auth/pipes/password-validation.pipe.ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class PasswordValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') return value;

    if (value.newPassword) {
      if (value.currentPassword && value.newPassword === value.currentPassword) {
        throw new BadRequestException('New password must be different from current password');
      }

      if (value.newPassword.length < 8) {
        throw new BadRequestException('Password must be at least 8 characters long');
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9!@#$%^&*])/.test(value.newPassword)) {
        throw new BadRequestException(
          'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character'
        );
      }
    }

    return value;
  }
}
