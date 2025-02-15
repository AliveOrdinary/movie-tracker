// src/modules/lists/lists.resolver.ts
import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ListsService } from './lists.service';
import { List, ListType, ListPrivacy } from './entities/list.entity';
import { ListItem } from './entities/list-item.entity';
import { ListCollaborator, CollaboratorPermission } from './entities/list-collaborator.entity';
import { CreateListInput } from './dto/create-list.input';
import { UpdateListInput } from './dto/update-list.input';
import { AddListItemInput } from './dto/add-list-item.input';
import { AddCollaboratorInput } from './dto/add-collaborator.input';
import { ListResponse } from './dto/list-response';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => List)
@UseGuards(FirebaseAuthGuard)
export class ListsResolver {
  constructor(private readonly listsService: ListsService) {}

  @Mutation(() => List)
  async createList(
    @Args('input') input: CreateListInput,
    @CurrentUser() user: User
  ): Promise<List> {
    return this.listsService.createList(input, user);
  }

  @Mutation(() => List)
  async updateList(
    @Args('input') input: UpdateListInput,
    @CurrentUser() user: User
  ): Promise<List> {
    return this.listsService.updateList(input, user);
  }

  @Mutation(() => Boolean)
  async deleteList(
    @Args('id') id: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    return this.listsService.deleteList(id, user);
  }

  @Mutation(() => ListItem)
  async addListItem(
    @Args('input') input: AddListItemInput,
    @CurrentUser() user: User
  ): Promise<ListItem> {
    return this.listsService.addListItem(input, user);
  }

  @Mutation(() => Boolean)
  async removeListItem(
    @Args('listId') listId: string,
    @Args('itemId') itemId: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    return this.listsService.removeListItem(listId, itemId, user);
  }

  @Mutation(() => ListCollaborator)
  async addCollaborator(
    @Args('input') input: AddCollaboratorInput,
    @CurrentUser() user: User
  ): Promise<ListCollaborator> {
    return this.listsService.addCollaborator(input, user);
  }

  @Mutation(() => ListCollaborator)
  async updateCollaborator(
    @Args('listId') listId: string,
    @Args('collaboratorId') collaboratorId: string,
    @Args('permissions', { type: () => [CollaboratorPermission] }) permissions: CollaboratorPermission[],
    @CurrentUser() user: User
  ): Promise<ListCollaborator> {
    return this.listsService.updateCollaborator(listId, collaboratorId, permissions, user);
  }

  @Mutation(() => Boolean)
  async removeCollaborator(
    @Args('listId') listId: string,
    @Args('collaboratorId') collaboratorId: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    return this.listsService.removeCollaborator(listId, collaboratorId, user);
  }

  @Mutation(() => Boolean)
  async favoriteList(
    @Args('listId') listId: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    return this.listsService.favoriteList(listId, user);
  }

  @Query(() => [List])
  async myLists(
    @CurrentUser() user: User,
    @Args('type', { type: () => ListType, nullable: true }) type?: ListType
  ): Promise<List[]> {
    return this.listsService.getUserLists(user.id, type);
  }

  @Query(() => [List])
  async collaborativeLists(
    @CurrentUser() user: User
  ): Promise<List[]> {
    return this.listsService.getCollaborativeLists(user.id);
  }

  @Query(() => ListResponse)
  async favoritedLists(
    @CurrentUser() user: User,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number
  ): Promise<ListResponse> {
    const [items, total] = await this.listsService.getFavoritedLists(user.id, page, limit);
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  @Query(() => ListResponse)
  async trendingLists(
    @Args('timeframe', { defaultValue: 'week' }) timeframe: 'day' | 'week' | 'month',
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number
  ): Promise<ListResponse> {
    const [items, total] = await this.listsService.getTrendingLists(timeframe, page, limit);
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Resolve fields
  @ResolveField('itemCount', () => Int)
  async getItemCount(
    @Parent() list: List
  ): Promise<number> {
    return this.listsService.getItemCount(list.id);
  }

  @ResolveField('isFavorited', () => Boolean)
  async getIsFavorited(
    @Parent() list: List,
    @CurrentUser() user: User
  ): Promise<boolean> {
    return this.listsService.isListFavoritedByUser(list.id, user.id);
  }

  @ResolveField('isCollaborator', () => Boolean)
  async getIsCollaborator(
    @Parent() list: List,
    @CurrentUser() user: User
  ): Promise<boolean> {
    if (list.ownerId === user.id) {
      return false; // Owner is not a collaborator
    }
    return this.listsService.isUserCollaborator(list.id, user.id);
  }

  @ResolveField('userPermissions', () => [CollaboratorPermission], { nullable: true })
  async getUserPermissions(
    @Parent() list: List,
    @CurrentUser() user: User
  ): Promise<CollaboratorPermission[] | null> {
    if (list.ownerId === user.id) {
      // Owner has all permissions
      return Object.values(CollaboratorPermission);
    }
    return this.listsService.getCollaboratorPermissions(list.id, user.id);
  }
}