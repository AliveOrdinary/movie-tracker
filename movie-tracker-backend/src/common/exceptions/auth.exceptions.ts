//src/common/exceptions/auth.exceptions.ts
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

export class InvalidTokenException extends UnauthorizedException {
  constructor(message = 'Invalid or expired token') {
    super(message);
  }
}

export class TokenMissingException extends UnauthorizedException {
  constructor(message = 'Authentication token is missing') {
    super(message);
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor(message = 'Invalid credentials') {
    super(message);
  }
}

export class UserNotVerifiedException extends ForbiddenException {
  constructor(message = 'Email not verified') {
    super(message);
  }
}

export class InsufficientPermissionsException extends ForbiddenException {
  constructor(message = 'Insufficient permissions') {
    super(message);
  }
}
