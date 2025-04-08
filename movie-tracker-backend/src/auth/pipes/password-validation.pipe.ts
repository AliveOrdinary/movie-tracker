// src/auth/pipes/password-validation.pipe.ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class PasswordValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Only process request body data
    if (metadata.type !== 'body') return value;

    // Skip if no new password in the request
    if (!value.newPassword) return value;

    // If changing password, check that new password is different from current
    if (value.currentPassword && value.newPassword === value.currentPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Password regex validation should be handled by class-validator in the DTO
    // This pipe is mainly for custom validations like comparing old vs new password

    return value;
  }
}