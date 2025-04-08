// src/modules/lists/lists.resolver.ts
import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { ListsService } from './lists.service';
import { List } from './entities/list.entity';
import { ListItem } from './entities/list-item.entity';
import { ListCollaborator } from './entities/list-collaborator.entity';
import { CreateListInput } from './dto/create-list.input';
import { CreateListStringInput } from './dto/create-list-string.input';
import { UpdateListInput } from './dto/update-list.input';
import { AddListItemInput } from './dto/add-list-item.input';
import { AddCollaboratorInput } from './dto/add-collaborator.input';
import { ListResponse } from './dto/list-response';
import { ListFiltersInput } from './dto/list-filters.input';
import { ListMovieStats } from './dto/list-stats.type';
import { BulkMovieAddInput, BulkMovieRemoveInput, BulkListItemReorderInput } from './dto/bulk-list-operations.input';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { Public } from '../../auth/decorators/auth.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ListType, ListPrivacy, CollaboratorPermission } from 'src/common/enums';

@Resolver(() => List)
@UseGuards(AuthGuard)
export class ListsResolver {
  private readonly logger = new Logger(ListsResolver.name);

  constructor(private readonly listsService: ListsService) {}

  @Mutation(() => List)
  async createList(
    @CurrentUser() user: User,
    @Args('input') input: CreateListInput,
  ): Promise<List> {
    this.logger.log(`Creating list for user: ${user.id}`);
    this.logger.log(`List input: ${JSON.stringify(input)}`);

    // Create a copy of the input to avoid modifying the original
    const transformedInput = {...input};
    
    // If uppercase values are provided, convert them to lowercase for database compatibility
    if (transformedInput.type && typeof transformedInput.type === 'string') {
      // Store the original value for debugging
      const originalType = transformedInput.type;
      
      // Convert to lowercase for database if it's uppercase (e.g., "CUSTOM" -> "custom")
      if (originalType === ListType.CUSTOM || originalType === ListType.STANDARD) {
        transformedInput.type = originalType;
        this.logger.log(`Transformed type from ${originalType} to ${transformedInput.type}`);
      }
    }
    
    if (transformedInput.privacy && typeof transformedInput.privacy === 'string') {
      // Store the original value for debugging
      const originalPrivacy = transformedInput.privacy;
      
      // Convert to lowercase for database if it's uppercase (e.g., "PRIVATE" -> "private")
      if (originalPrivacy === ListPrivacy.PRIVATE || originalPrivacy === ListPrivacy.PUBLIC || originalPrivacy === ListPrivacy.FOLLOWING) {
        transformedInput.privacy = originalPrivacy;
        this.logger.log(`Transformed privacy from ${originalPrivacy} to ${transformedInput.privacy}`);
      }
    }

    try {
      this.logger.log(`After transformation: ${JSON.stringify(transformedInput)}`);
      const list = await this.listsService.createList(transformedInput, user);
      this.logger.log(`List created successfully: ${list.id}`);
      return list;
    } catch (error) {
      this.logger.error(`List creation error: ${error.message}`);
      this.logger.error(`Full error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
  
  @Mutation(() => List)
  async createListDirect(
    @CurrentUser() user: User,
    @Args('name') name: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('type', { nullable: true }) type?: string,
    @Args('privacy', { nullable: true }) privacy?: string,
    @Args('category', { nullable: true }) category?: string,
    @Args('maxEntries', { nullable: true }) maxEntries?: number,
  ): Promise<List> {
    this.logger.log(`Creating list directly for user: ${user.id}`);
    
    // Convert string type and privacy to proper enum values
    const input: CreateListInput = {
      name,
      description,
      type: type ? type.toUpperCase() as any : ListType.CUSTOM,
      privacy: privacy ? privacy.toUpperCase() as any : ListPrivacy.PRIVATE,
      category,
      maxEntries,
    };
    
    this.logger.log(`List input after conversion: ${JSON.stringify(input)}`);

    try {
      const list = await this.listsService.createList(input, user);
      this.logger.log(`List created successfully: ${list.id}`);
      return list;
    } catch (error) {
      this.logger.error(`List creation error: ${error.message}`);
      this.logger.error(`Full error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  @Mutation(() => List)
  async updateList(
    @CurrentUser() user: User,
    @Args('input') input: UpdateListInput,
  ): Promise<List> {
    return this.listsService.updateList(input, user);
  }

  @Mutation(() => Boolean)
  async deleteList(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.listsService.deleteList(id, user);
  }

  @Mutation(() => ListItem)
  async addListItem(
    @CurrentUser() user: User,
    @Args('input') input: AddListItemInput,
  ): Promise<ListItem> {
    return this.listsService.addListItem(input, user);
  }

  @Mutation(() => [ListItem])
  async bulkAddMovies(
    @CurrentUser() user: User,
    @Args('input') input: BulkMovieAddInput,
  ): Promise<ListItem[]> {
    return this.listsService.bulkAddMovies(input, user);
  }

  @Mutation(() => Boolean)
  async bulkRemoveMovies(
    @CurrentUser() user: User,
    @Args('input') input: BulkMovieRemoveInput,
  ): Promise<boolean> {
    return this.listsService.bulkRemoveMovies(input, user);
  }

  @Mutation(() => Boolean)
  async reorderListItems(
    @CurrentUser() user: User,
    @Args('input') input: BulkListItemReorderInput,
  ): Promise<boolean> {
    return this.listsService.reorderListItems(input, user);
  }

  @Mutation(() => Boolean)
  async removeListItem(
    @CurrentUser() user: User,
    @Args('listId') listId: string,
    @Args('itemId') itemId: string,
  ): Promise<boolean> {
    return this.listsService.removeListItem(listId, itemId, user);
  }

  @Mutation(() => ListCollaborator)
  async addCollaborator(
    @CurrentUser() user: User,
    @Args('input') input: AddCollaboratorInput,
  ): Promise<ListCollaborator> {
    return this.listsService.addCollaborator(input, user);
  }

  @Mutation(() => ListCollaborator)
  async updateCollaborator(
    @CurrentUser() user: User,
    @Args('listId') listId: string,
    @Args('collaboratorId') collaboratorId: string,
    @Args('permissions', { type: () => [CollaboratorPermission] }) permissions: CollaboratorPermission[],
  ): Promise<ListCollaborator> {
    return this.listsService.updateCollaborator(listId, collaboratorId, permissions, user);
  }

  @Mutation(() => Boolean)
  async removeCollaborator(
    @CurrentUser() user: User,
    @Args('listId') listId: string,
    @Args('collaboratorId') collaboratorId: string,
  ): Promise<boolean> {
    return this.listsService.removeCollaborator(listId, collaboratorId, user);
  }

  @Mutation(() => Boolean)
  async favoriteList(
    @CurrentUser() user: User,
    @Args('listId') listId: string,
  ): Promise<boolean> {
    return this.listsService.favoriteList(listId, user);
  }

  @Mutation(() => List)
  async cloneList(
    @CurrentUser() user: User,
    @Args('listId') listId: string,
    @Args('newName') newName: string,
  ): Promise<List> {
    return this.listsService.cloneList(listId, newName, user);
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

  @Query(() => [ListItem])
  @Public()
  async listItems(
    @CurrentUser() user: User,
    @Args('listId') listId: string,
  ): Promise<ListItem[]> {
    // For public lists, user can be null
    const userId = user?.id || null;
    return this.listsService.getListItems(listId, userId);
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

  @Query(() => ListResponse)
  async searchLists(
    @CurrentUser() user: User,
    @Args('filters') filters: ListFiltersInput,
  ): Promise<ListResponse> {
    const [items, total] = await this.listsService.searchLists(filters, user.id);
    return {
      items,
      total,
      page: filters.page || 1,
      totalPages: Math.ceil(total / (filters.limit || 10))
    };
  }

  @Query(() => ListResponse)
  @Public()
  async listsByCategory(
    @Args('category') category: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number
  ): Promise<ListResponse> {
    const [items, total] = await this.listsService.getListsByCategory(category, page, limit);
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  @Query(() => ListMovieStats)
  async listStats(
    @CurrentUser() user: User,
    @Args('listId') listId: string,
  ): Promise<ListMovieStats> {
    return this.listsService.getListStats(listId, user.id);
  }

  @Query(() => List, { name: 'getList' })
  @Public()
  async getList(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<List> {
    // For public lists, user can be null
    const userId = user?.id || null;
    return this.listsService.getListWithPermissions(id, userId);
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
    @CurrentUser() user: User,
    @Parent() list: List,
  ): Promise<boolean> {
    // If there's no authenticated user, it's not favorited
    if (!user) {
      return false;
    }
    return this.listsService.isListFavoritedByUser(list.id, user.id);
  }

  @ResolveField('isCollaborator', () => Boolean)
  async getIsCollaborator(
    @CurrentUser() user: User,
    @Parent() list: List,
  ): Promise<boolean> {
    // If there's no authenticated user, they can't be a collaborator
    if (!user) {
      return false;
    }
    
    if (list.owner_id === user.id) {
      return false; // Owner is not a collaborator
    }
    return this.listsService.isUserCollaborator(list.id, user.id);
  }

  @ResolveField('userPermissions', () => [CollaboratorPermission], { nullable: true })
  async getUserPermissions(
    @CurrentUser() user: User,
    @Parent() list: List,
  ): Promise<CollaboratorPermission[] | null> {
    // If there's no authenticated user, return null
    if (!user) {
      return null;
    }
    
    if (list.owner_id === user.id) {
      // Owner has all permissions
      return Object.values(CollaboratorPermission);
    }
    return this.listsService.getCollaboratorPermissions(list.id, user.id);
  }

  @ResolveField('collaborators', () => [ListCollaborator], { nullable: false })
  async getCollaborators(@Parent() list: List): Promise<ListCollaborator[]> {
    // Always return an array, never null
    if (!list.collaborators) {
      return [];
    }
    return list.collaborators;
  }

  @ResolveField('items', () => [ListItem], { nullable: false })
  async getItems(@Parent() list: List): Promise<ListItem[]> {
    // Always return an array, never null
    if (!list.items) {
      return [];
    }
    return list.items;
  }

  // Additional fields to expose moderation status
  @ResolveField('isFlagged', () => Boolean, { nullable: true })
  async getIsFlagged(@Parent() list: List): Promise<boolean> {
    return list.isFlagged || false;
  }

  @ResolveField('isRejected', () => Boolean, { nullable: true })
  async getIsRejected(@Parent() list: List): Promise<boolean> {
    return list.isRejected || false;
  }

  @ResolveField('isAutoModerated', () => Boolean, { nullable: true })
  async getIsAutoModerated(@Parent() list: List): Promise<boolean> {
    return list.isAutoModerated || false;
  }

  @ResolveField('moderationReason', () => String, { nullable: true })
  async getModerationReason(@Parent() list: List): Promise<string | null> {
    return list.moderationReason || null;
  }

  @ResolveField('moderatedAt', () => Date, { nullable: true })
  async getModeratedAt(@Parent() list: List): Promise<Date | null> {
    return list.moderatedAt || null;
  }

  @ResolveField('createdAt', () => Date)
  async getCreatedAt(@Parent() list: List): Promise<Date> {
    return list.createdAt || new Date();
  }

  @ResolveField('updatedAt', () => Date)
  async getUpdatedAt(@Parent() list: List): Promise<Date> {
    return list.updatedAt || new Date();
  }
}