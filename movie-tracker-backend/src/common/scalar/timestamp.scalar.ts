import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Timestamp', () => Date)
export class TimestampScalar implements CustomScalar<number | null, Date | null> {
  description = 'Date custom scalar type';

  parseValue(value: number | null): Date | null {
    if (value === null || value === undefined) {
      return null;
    }
    return new Date(value); // value from the client
  }

  serialize(value: Date | string | null): number | null {
    // Make sure we have a valid date before trying to serialize
    if (value === null || value === undefined) {
      return null;
    }
    
    if (!(value instanceof Date) && typeof value === 'string') {
      // Try to convert string to date if needed
      value = new Date(value);
    }
    
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      console.error(`Invalid date value: ${value}`);
      return null;
    }
    
    return value.getTime(); // value sent to the client
  }

  parseLiteral(ast: ValueNode): Date | null {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    return null;
  }
}