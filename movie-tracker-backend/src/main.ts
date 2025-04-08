// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import rateLimit from 'express-rate-limit';
import * as session from 'express-session';

// Add debug middleware for development
const isDevelopment = process.env.NODE_ENV !== 'production';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // --- Security and Basic Middleware ---

    // Enable Helmet security headers (adjust CSP as needed)
    app.use(helmet({
      crossOriginEmbedderPolicy: false, // Consider setting this to true if needed and compatible
      contentSecurityPolicy: {
        directives: {
          // Review and tighten these directives for production
          defaultSrc: [`'self'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`, 'cdn.jsdelivr.net', 'unpkg.com'], // 'unsafe-inline'/'unsafe-eval' might be needed for dev tools/libs, restrict in prod
          styleSrc: [`'self'`, `'unsafe-inline'`, 'cdn.jsdelivr.net', 'unpkg.com'], // 'unsafe-inline' should ideally be removed
          imgSrc: [`'self'`, 'data:', 'https:'], // Allow data URIs and https images
          connectSrc: [`'self'`, 'https://api.themoviedb.org'], // Allow connections to self and TMDB
          fontSrc: [`'self'`, 'https:', 'data:'],
          objectSrc: [`'none'`],
          mediaSrc: [`'self'`],
          frameSrc: [`'self'`], // Adjust if you need to embed external frames
        },
      },
    }));

    // Enable compression
    app.use(compression());

    // Cookie parser
    app.use(cookieParser());

    // --- Body Parsers ---
    // Standard JSON and Text body parsers. Place them early.
    app.use(express.json({ limit: '50mb' })); // Parses JSON request bodies
    app.use(express.text({ limit: '50mb' })); // Parses text request bodies

    // --- CORS Configuration ---
    // Let NestJS handle OPTIONS preflight requests automatically via enableCors
    app.enableCors({
      origin: configService.get('FRONTEND_URL', 'http://localhost:3000'),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Ensure OPTIONS is included
      allowedHeaders: [
        // Standard headers
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        // Apollo Client CSRF prevention header
        'apollo-require-preflight',
        // Helpful for debugging/logging
        'x-apollo-operation-name',
        // Add any other custom headers your frontend sends
        'x-content-type-options',
      ],
      exposedHeaders: [ // Headers the browser is allowed to access
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Credentials'
      ],
      credentials: true, // Allow cookies/auth headers
      maxAge: 3600, // Cache preflight response for 1 hour
    });

    // --- Global Pipes ---
    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      transform: true, // Automatically transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if extra properties are sent
      transformOptions: {
        enableImplicitConversion: true, // Allow automatic type conversion (e.g., string to number for query params)
      },
    }));

    // --- Development Logging ---
    // Optional: Add debug logging for GraphQL requests only in development
    if (isDevelopment) {
      app.use('/graphql', (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const { method, originalUrl, headers, body } = req;
        const operationName = headers['x-apollo-operation-name'] || body?.operationName || 'unknown';
        logger.log(`GraphQL Request: ${method} ${originalUrl} (Operation: ${operationName})`);
        logger.log(`Headers: ${JSON.stringify({
          'content-type': headers['content-type'],
          'authorization': headers['authorization'] ? 'Bearer [REDACTED]' : undefined,
          'apollo-require-preflight': headers['apollo-require-preflight'],
          'x-apollo-operation-name': headers['x-apollo-operation-name'],
        }, null, 2)}`);
        // Avoid logging potentially large bodies unless necessary
        // if (method === 'POST' && body) {
        //   logger.debug(`Body: ${JSON.stringify(body)}`);
        // }
        next();
      });
    }

    // --- GraphQL Specific Middleware ---

    // Rate Limiting for the GraphQL endpoint
    app.use('/graphql', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: configService.get<number>('GRAPHQL_RATE_LIMIT_MAX', 100), // Limit each IP to 100 requests per windowMs (configurable)
      message: 'Too many requests from this IP, please try again after 15 minutes',
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    }));

    // Configure file upload for GraphQL (Ensure this is before the main GraphQL handler is setup by NestJS)
    // This needs `graphql-upload-minimal` and matching Apollo Client setup.
    app.use(graphqlUploadExpress({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }));

    // --- Session Configuration ---
    // Place session middleware after cookies but before routes that use it
    app.use(
      session({
        secret: configService.getOrThrow('SESSION_SECRET'), // Use OrThrow for critical secrets
        resave: false, // Don't save session if unmodified
        saveUninitialized: false, // Don't create session until something stored
        cookie: {
          secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
          httpOnly: true, // Prevent client-side JS from accessing cookie
          maxAge: 1000 * 60 * 60 * 24 // 24 hours
        }
        // Consider using a persistent session store (like connect-redis) for production
      })
    );

    // --- Start Server ---
    const port = configService.get('PORT', 3001);
    await app.listen(port);

    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    if (isDevelopment) {
      logger.log(`🔬 GraphQL Playground: http://localhost:${port}/graphql`);
    }

  } catch (error) {
    logger.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

bootstrap();