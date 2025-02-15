// src/modules/reviews/validators/review-content.validator.ts
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'reviewContent', async: false })
export class ReviewContentValidator implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    // Check minimum length
    if (text.length < 10) return false;
    
    // Check maximum length
    if (text.length > 300) return false;
    
    // Check for empty or whitespace-only content
    if (text.trim().length === 0) return false;
    
    // Check for repetitive characters
    const repetitivePattern = /(.)\1{4,}/;
    if (repetitivePattern.test(text)) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Review content must be between 10 and 300 characters and contain valid content';
  }
}