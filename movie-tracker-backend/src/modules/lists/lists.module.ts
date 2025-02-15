// src/modules/lists/lists.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListsService } from './lists.service';
import { ListsResolver } from './lists.resolver';
import { List } from './entities/list.entity';
import { ListItem } from './entities/list-item.entity';
import { ListCollaborator } from './entities/list-collaborator.entity';
import { ListFavorite } from './entities/list-favorite.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      List,
      ListItem,
      ListCollaborator,
      ListFavorite
    ])
  ],
  providers: [ListsService, ListsResolver],
  exports: [ListsService]
})
export class ListsModule {}