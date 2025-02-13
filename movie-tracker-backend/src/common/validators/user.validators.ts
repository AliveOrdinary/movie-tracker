//src/common/validators/user.validators.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

// Username validation
export function IsValidUsername(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidUsername',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'Username must be 3-30 characters long, can contain letters, numbers, and single hyphens or underscores between characters',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          // Username rules:
          // - 3-30 characters
          // - Can contain letters, numbers
          // - Can have single hyphens or underscores between characters
          // - Cannot start or end with hyphen or underscore
          return /^[a-zA-Z0-9][a-zA-Z0-9-_]{1,28}[a-zA-Z0-9]$/.test(value);
        },
      },
    });
  };
}

// Profile URL validation
export function IsValidUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'URL must be a valid HTTPS URL',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (!value) return true; // Allow empty for optional fields
          try {
            const url = new URL(value);
            return url.protocol === 'https:';
          } catch {
            return false;
          }
        },
      },
    });
  };
}
