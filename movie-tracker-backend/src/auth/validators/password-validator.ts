// src/auth/validators/password.validator.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number or special character',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          
          // Password requirements:
          // - At least 8 characters
          // - At least one uppercase letter
          // - At least one lowercase letter
          // - At least one number or special character
          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumbers = /\d/.test(value);
          const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(value);
          
          return value.length >= 8 && 
                 hasUpperCase && 
                 hasLowerCase && 
                 (hasNumbers || hasSpecialChars);
        },
      },
    });
  };
}
