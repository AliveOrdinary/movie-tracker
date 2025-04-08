// src/modules/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationDeliveryService } from './services/notification-delivery.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { User } from '../users/entities/user.entity';
import { Review } from '../reviews/entities/review.entity';
import { List } from '../lists/entities/list.entity';
import { Movie } from '../movies/entities/movie.entity';
import { FirebaseModule } from '../../firebase/firebase.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TokenModule } from '../../auth/services/token.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification, 
      NotificationPreference, 
      User, 
      Review, 
      List, 
      Movie
    ]),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ConfigModule,
    FirebaseModule,
    AuthModule,
    UsersModule,
    TokenModule,
  ],
  providers: [
    NotificationsService, 
    NotificationsResolver,
    NotificationDeliveryService,
    NotificationQueueService
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}