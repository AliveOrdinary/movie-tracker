// src/modules/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';

// Resolvers
import { AdminStatsResolver } from './resolvers/admin-stats.resolver';
import { ContentManagementResolver } from './resolvers/content-management.resolver';
import { UserManagementResolver } from './resolvers/user-management.resolver';
import { SystemMonitoringResolver } from './resolvers/system-monitoring.resolver';
import { AuditLogResolver } from './resolvers/audit-log.resolver';
import { ContentAnalyticsResolver } from './resolvers/content-analytics.resolver';
import { AdminDashboardResolver } from './resolvers/dashboard.resolver';
import { SystemConfigResolver } from './resolvers/system-config.resolver';

// Services
import { AuditService } from './services/audit.service';
import { SystemConfigService } from './services/system-config.service';
import { ContentAnalyticsService } from './services/content-analytics.service';
import { ContentManagementService } from './services/content-management.service';
import { UserManagementService } from './services/user-management.service';

// Controller
import { AdminController } from './admin.controller';

// Entities
import { ModerationLog } from '../moderation/entities/moderation-log.entity';
import { Report } from '../moderation/entities/report.entity';
import { User } from '../users/entities/user.entity';
import { Review } from '../reviews/entities/review.entity';
import { Movie } from '../movies/entities/movie.entity';
import { List } from '../lists/entities/list.entity';
import { WatchHistory } from '../watch-history/entities/watch-history.entity';
import { Activity } from '../social/entities/activity.entity';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { SystemConfig } from './entities/system-config.entity';

// External modules
import { UsersModule } from '../users/users.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { MoviesModule } from '../movies/movies.module';
import { ListsModule } from '../lists/lists.module';
import { ModerationModule } from '../moderation/moderation.module';
import { AuthModule } from '../../auth/auth.module';
import { TokenModule } from '../../auth/services/token.module';
import { FirebaseModule } from '../../firebase/firebase.module';
import { CacheModule } from '../cache/cache.module';
import { WatchHistoryModule } from '../watch-history/watch-history.module';
import { SocialModule } from '../social/social.module';
import { UserReputationService } from '../moderation/services/user-reputation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModerationLog, 
      Report, 
      User, 
      Review, 
      Movie,
      List,
      WatchHistory,
      Activity,
      AdminAuditLog,
      SystemConfig
    ]),
    UsersModule,
    ReviewsModule,
    MoviesModule,
    ListsModule,
    ModerationModule,
    AuthModule,
    TokenModule,
    FirebaseModule,
    CacheModule,
    WatchHistoryModule,
    SocialModule
  ],
  providers: [
    // Services
    AdminService,
    AuditService,
    SystemConfigService,
    ContentAnalyticsService,
    ContentManagementService,
    UserManagementService,
    
    // Resolvers
    AdminStatsResolver,
    ContentManagementResolver,
    UserManagementResolver,
    SystemMonitoringResolver,
    AuditLogResolver,
    SystemConfigResolver,
    ContentAnalyticsResolver,
    AdminDashboardResolver,
  ],
  controllers: [AdminController],
  exports: [
    AdminService, 
    AuditService, 
    SystemConfigService, 
    ContentAnalyticsService,
    ContentManagementService
  ],
})
export class AdminModule {}