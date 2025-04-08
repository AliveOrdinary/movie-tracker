//src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { UserStatsResolver } from './resolvers/user-stats.resolver';
import { UserStatsService } from './service/user-stats.service';
import { User } from './entities/user.entity';
import { WatchHistory } from '../watch-history/entities/watch-history.entity';
import { Review } from '../reviews/entities/review.entity';
import { List } from '../lists/entities/list.entity';
import { UserFollow } from '../social/entities/user-follow.entity';
import { FirebaseModule } from '../../firebase/firebase.module';
import { FirebaseStorageModule } from '../storage/firebase-storage.module';
import { TokenModule } from '../../auth/services/token.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, WatchHistory, Review, List, UserFollow]),
    FirebaseModule,
    FirebaseStorageModule,
    TokenModule,
    CacheModule,
  ],
  providers: [
    UsersResolver, 
    UsersService,
    UserStatsResolver,
    UserStatsService
  ],
  exports: [UsersService, UserStatsService],
})
export class UsersModule {}