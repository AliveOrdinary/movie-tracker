import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import rateLimit from 'express-rate-limit';
import * as session from 'express-session';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Enable Helmet security headers with updated CSP
    app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`, 'cdn.jsdelivr.net', 'unpkg.com'],
          styleSrc: [`'self'`, `'unsafe-inline'`, 'cdn.jsdelivr.net', 'unpkg.com'],
          imgSrc: [`'self'`, 'data:', 'https:'],
          connectSrc: [`'self'`, 'https://api.themoviedb.org'],
          fontSrc: [`'self'`, 'https:', 'data:'],
          objectSrc: [`'none'`],
          mediaSrc: [`'self'`],
          frameSrc: [`'self'`],
        },
      },
    }));

    // Enable compression
    app.use(compression());

    // Cookie parser
    app.use(cookieParser());

    // Configure CORS
    app.enableCors({
      origin: configService.get('FRONTEND_URL', 'http://localhost:3000'),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
      ],
      credentials: true,
      maxAge: 3600,
    });

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));

    app.use('/graphql', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }));
    
    // Configure file upload for GraphQL
    app.use(graphqlUploadExpress({
      maxFileSize: 10000000, // 10MB
      maxFiles: 5,
    }));

    // Configure session
    app.use(
      session({
        secret: configService.get('SESSION_SECRET') || 'your-fallback-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24 // 24 hours
        }
      })
    );

    // Get port from environment variable or use 3001 as default
    const port = configService.get('PORT', 3001);
    
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`GraphQL Playground: http://localhost:${port}/graphql`);
  } catch (error) {
    logger.error(`Error starting server: ${error.message}`, error.stack);
    process.exit(1);
  }
}
bootstrap();