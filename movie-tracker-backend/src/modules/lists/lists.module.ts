// src/modules/lists/lists.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListsService } from './lists.service';
import { ListsResolver } from './lists.resolver';
import { ListWorkaroundController } from './list-workaround.controller';
import { List } from './entities/list.entity';
import { ListItem } from './entities/list-item.entity';
import { ListCollaborator } from './entities/list-collaborator.entity';
import { ListFavorite } from './entities/list-favorite.entity';
import { FirebaseModule } from '../../firebase/firebase.module';
import { UsersModule } from '../users/users.module';
import { TokenModule } from '../../auth/services/token.module';
import { CacheModule } from '../cache/cache.module';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      List,
      ListItem,
      ListCollaborator,
      ListFavorite
    ]),
    FirebaseModule,
    UsersModule,
    TokenModule,
    CacheModule,
    MoviesModule, // Import MoviesModule to access MoviesService
  ],
  controllers: [ListWorkaroundController],
  providers: [ListsService, ListsResolver],
  exports: [ListsService]
})
export class ListsModule {}