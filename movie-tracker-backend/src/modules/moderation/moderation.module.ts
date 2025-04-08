// src/modules/moderation/moderation.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationService } from './moderation.service';
import { ModerationQueueService } from './services/moderation-queue.service';
import { UserReputationService } from './services/user-reputation.service';
import { AutoModerationService } from './services/auto-moderation.service';
import { ModerationQueueResolver } from './resolvers/moderation-queue.resolver';
import { UserReputationResolver } from './resolvers/user-reputation.resolver';
import { AutoModerationResolver } from './resolvers/auto-moderation.resolver';
import { ModerationEventListeners } from './listeners/moderation.listeners';
import { ModerationController } from './moderation.controller';
// Import resolvers from separate file
import { ReportResolver } from './moderation.resolver';
import { Report } from './entities/report.entity';
import { ModerationLog } from './entities/moderation-log.entity';
import { ModerationQueue } from './entities/moderation-queue.entity';
import { UserReputation } from './entities/user-reputation.entity';
import { AutoModerationRule } from './entities/auto-moderation-rule.entity';
import { Review } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';
import { List } from '../lists/entities/list.entity';
import { UsersModule } from '../users/users.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from '../notifications/notifications.module';
import { FirebaseModule } from '../../firebase/firebase.module';
import { AuthModule } from '../../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { TokenModule } from '../../auth/services/token.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      ModerationLog,
      ModerationQueue,
      UserReputation,
      AutoModerationRule,
      Review,
      User,
      List
    ]),
    UsersModule,
    forwardRef(() => ReviewsModule),
    NotificationsModule,
    FirebaseModule,
    AuthModule,
    TokenModule,
    EventEmitterModule.forRoot(),
    CacheModule,
  ],
  providers: [
    // Main services
    ModerationService,
    ModerationQueueService,
    UserReputationService,
    AutoModerationService,
    
    // GraphQL resolvers
    ModerationQueueResolver,
    UserReputationResolver,
    AutoModerationResolver,
    ReportResolver,
    
    // Event listeners
    ModerationEventListeners
  ],
  controllers: [ModerationController],
  exports: [
    ModerationService, 
    ModerationQueueService, 
    UserReputationService, 
    AutoModerationService
  ],
})
export class ModerationModule {}