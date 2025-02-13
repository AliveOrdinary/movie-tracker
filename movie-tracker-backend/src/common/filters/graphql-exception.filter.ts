//src/common/filters/graphql-exception.filter.ts
import { Catch, ArgumentsHost } from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const context = gqlHost.getContext();

    // Log the error (you might want to use a proper logging service)
    console.error(`[GraphQL Error] ${exception.message}`, {
      path: context.req?.body?.query,
      variables: context.req?.body?.variables,
      error: exception,
    });

    if (exception instanceof GraphQLError) {
      return exception;
    }

    return new GraphQLError(exception.message, {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        exception: {
          name: exception.name,
          message: exception.message,
          ...(process.env.NODE_ENV === 'development' && { stack: exception.stack }),
        },
      },
    });
  }
}