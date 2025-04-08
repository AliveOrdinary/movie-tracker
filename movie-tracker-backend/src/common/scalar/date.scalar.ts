import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('DateTime')
export class DateScalar implements CustomScalar<string | null, Date | null> {
  description = 'Date custom scalar type';

  parseValue(value: string | null): Date | null {
    // Convert incoming string to Date
    if (!value) return null;
    const date = new Date(value);
    
    // Validate date
    if (isNaN(date.getTime())) {
      console.error(`Invalid date value: ${value}`);
      return null;
    }
    
    return date;
  }

  serialize(value: Date | string | null): string | null {
    // Convert Date to ISO string for client
    if (!value) return null;
    
    if (typeof value === 'string') {
      // Try to convert string to date first to validate
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        console.error(`Invalid date string value: ${value}`);
        return null;
      }
      return date.toISOString();
    }
    
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        console.error(`Invalid Date object: ${value}`);
        return null;
      }
      return value.toISOString();
    }
    
    console.error(`Unexpected date value type: ${typeof value}, value: ${value}`);
    return null;
  }

  parseLiteral(ast: ValueNode): Date | null {
    if (ast.kind === Kind.STRING) {
      return this.parseValue(ast.value);
    }
    return null;
  }
}