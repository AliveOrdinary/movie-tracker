// src/modules/social/social.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialService } from './social.service';
import { FollowsResolver, ActivityResolver, UserSocialFieldsResolver } from './social.resolver';
import { FriendRequestResolver } from './resolvers/friend-request.resolver';
import { UserBlockResolver } from './resolvers/user-block.resolver';
import { SocialGroupResolver } from './resolvers/social-group.resolver';
import { ActivityInteractionResolver } from './resolvers/activity-interaction.resolver';
import { ActivityInteractionService } from './services/activity-interaction.service';
import { FriendRequestService } from './services/friend-request.service';
import { UserBlockService } from './services/user-block.service';
import { SocialGroupService } from './services/social-group.service';
import { UserFollow } from './entities/user-follow.entity';
import { Activity } from './entities/activity.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { UserBlock } from './entities/user-block.entity';
import { SocialGroup } from './entities/social-group.entity';
import { SocialGroupMember } from './entities/social-group-member.entity';
import { ActivityComment } from './entities/activity-comment.entity';
import { ActivityReaction } from './entities/activity-reaction.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { FirebaseModule } from '../../firebase/firebase.module';
import { AuthModule } from '../../auth/auth.module';
import { TokenModule } from '../../auth/services/token.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CacheModule } from '../cache/cache.module';
import { CacheService } from '../../common/services/cache.service';
import { CacheKeyFactory } from '../../common/factories/cache-key.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserFollow, 
      Activity, 
      User, 
      FriendRequest,
      UserBlock,
      SocialGroup,
      SocialGroupMember,
      ActivityComment,
      ActivityReaction
    ]),
    UsersModule,
    FirebaseModule,
    AuthModule,
    TokenModule,
    NotificationsModule,
    CacheModule
  ],
  providers: [
    // Services
    SocialService,
    ActivityInteractionService,
    FriendRequestService,
    UserBlockService,
    SocialGroupService,
    
    // Resolvers
    FollowsResolver,
    ActivityResolver,
    UserSocialFieldsResolver,
    FriendRequestResolver,
    UserBlockResolver,
    SocialGroupResolver,
    ActivityInteractionResolver
  ],
  exports: [SocialService, ActivityInteractionService, FriendRequestService, UserBlockService, SocialGroupService],
})
export class SocialModule {}