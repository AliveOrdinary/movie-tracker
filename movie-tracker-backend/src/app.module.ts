import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './modules/cache/cache.module';
import { UsersModule } from './modules/users/users.module';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { TokenModule } from './auth/services/token.module';
import { MoviesModule } from './modules/movies/movies.module';
import { StorageModule } from './modules/storage/storage.module';
import { join } from 'path';
import { ModerationModule } from './modules/moderation/moderation.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { WatchHistoryModule } from './modules/watch-history/watch-history.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { getCacheConfig } from './common/config/cache.config';
import { AuthGuard } from './auth/guards/auth.guard';
import { GqlAuthGuard } from './auth/guards/gql-auth.guard';
import { PublicAwareRolesGuard } from './auth/guards/public-aware-roles.guard';
import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';
import { ListsModule } from './modules/lists/lists.module';
import { AdminModule } from './modules/admin/admin.module';
import { SocialModule } from './modules/social/social.module';
import { PublicEndpointInterceptor } from './auth/interceptors/public-endpoint.interceptor';
import { TimestampScalar } from './common/scalar/timestamp.scalar';
import { DateScalar } from './common/scalar/date.scalar';

// Import GraphQL enum registrations
import './common/enums/graphql-enums';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: [],
      autoSchemaFile: true,
      playground: true,
      introspection: true,
      // Enhanced context to help with debugging
      context: ({ req, res }) => { 
        // Log original method for debugging
        if (req.method !== 'POST' && req.method !== 'GET') {
          console.warn(`Non-standard HTTP method in GraphQL request: ${req.method}`);
          // Force to POST method - belt and suspenders approach
          req.method = 'POST';
        }
        return { req, res };
      },
      // Completely disable CSRF prevention in both dev and production temporarily
      // csrfPrevention: false,
      // Properly handle HTTP methods
      allowBatchedHttpRequests: true,
      cache: 'bounded',
      // Dates already handled by our DateScalar
      formatError: (error) => {
        console.error('GraphQL Error:', error);
        return error;
      },
      buildSchemaOptions: {
        // Explicitly defining scalar types
        dateScalarMode: 'isoDate',
        numberScalarMode: 'float',
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        throttlers: [{
          ttl: config.get('auth.security.rateLimitWindowMs', 900000),
          limit: config.get('auth.security.rateLimitMax', 100),
        }],
      }),
    }),
    // Core Modules
    UsersModule,
    FirebaseModule,
    AuthModule,
    TokenModule,
    MoviesModule,
    
    // Feature Modules
    ReviewsModule,
    WatchHistoryModule,
    ListsModule,
    SocialModule,
    NotificationsModule,
    
    // Administrative Modules
    ModerationModule,
    AdminModule,
    
    // Infrastructure Modules
    CacheModule,
    StorageModule,
  ],
  providers: [
    TimestampScalar,
    DateScalar,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PublicEndpointInterceptor,
    }
    // Removed the PublicAwareRolesGuard since we fixed the original RolesGuard
  ],
})
export class AppModule {}
