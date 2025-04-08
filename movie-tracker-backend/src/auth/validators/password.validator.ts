// src/auth/validators/password.validator.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Interface for password validation results
 */
interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Options for password validation
 */
export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  maxLength?: number;
  disallowCommonPasswords?: boolean;
}

/**
 * Default password validation options
 */
const DEFAULT_OPTIONS: PasswordValidationOptions = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 100,
  disallowCommonPasswords: true,
};

/**
 * List of common passwords to disallow
 */
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', 'qwerty', 'admin', 'welcome',
  'login', 'abc123', 'letmein', '123456789', '12345678', 'qwerty123',
];

/**
 * Validates a password against the provided options
 * @param password The password to validate
 * @param options Validation options
 * @returns Validation result with errors if any
 */
export function validatePassword(
  password: string,
  options: PasswordValidationOptions = DEFAULT_OPTIONS,
): PasswordValidationResult {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];

  // Check if password is provided
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  // Check minimum length
  if (mergedOptions.minLength && password.length < mergedOptions.minLength) {
    errors.push(`Password must be at least ${mergedOptions.minLength} characters long`);
  }

  // Check maximum length
  if (mergedOptions.maxLength && password.length > mergedOptions.maxLength) {
    errors.push(`Password cannot exceed ${mergedOptions.maxLength} characters`);
  }

  // Check for uppercase letters
  if (mergedOptions.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (mergedOptions.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (mergedOptions.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters
  if (mergedOptions.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords
  if (mergedOptions.disallowCommonPasswords && COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common and easily guessed');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Class validator decorator for password validation
 * @param validationOptions Options for validation
 * @param passwordOptions Password-specific options
 */
export function IsStrongPassword(
  passwordOptions?: PasswordValidationOptions,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [passwordOptions],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [options] = args.constraints;
          const result = validatePassword(value, options);
          return result.isValid;
        },
        defaultMessage(args: ValidationArguments) {
          const [options] = args.constraints;
          const result = validatePassword(args.value, options);
          return result.errors.join(', ');
        },
      },
    });
  };
}