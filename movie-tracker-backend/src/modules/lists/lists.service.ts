// src/modules/lists/lists.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, Not, FindOptionsWhere } from 'typeorm';
import { List } from './entities/list.entity';
import { ListItem } from './entities/list-item.entity';
import { ListCollaborator } from './entities/list-collaborator.entity';
import { ListFavorite } from './entities/list-favorite.entity';
import { CreateListInput } from './dto/create-list.input';
import { UpdateListInput } from './dto/update-list.input';
import { AddListItemInput } from './dto/add-list-item.input';
import { AddCollaboratorInput } from './dto/add-collaborator.input';
import { User } from '../users/entities/user.entity';
import { Movie } from '../movies/entities/movie.entity';
import { ListType, ListPrivacy, CollaboratorPermission } from '../../common/enums';
import { BaseService } from '../../common/services/base.service';
import { CacheService } from '../../common/services/cache.service';
import { CacheKeyFactory } from '../../common/factories/cache-key.factory';
import { ListFiltersInput } from './dto/list-filters.input';
import { ListMovieStats, ListGenreStats, ListYearStats } from './dto/list-stats.type';
import { BulkMovieAddInput, BulkMovieRemoveInput, BulkListItemReorderInput } from './dto/bulk-list-operations.input';
import { CacheTTL, EntityCacheTTL } from '../../common/constants/cache-ttl.constants';
import { MoviesService } from '../movies/movies.service';

@Injectable()
export class ListsService extends BaseService<List> {
  protected readonly logger = new Logger(ListsService.name);
  
  constructor(
    @InjectRepository(List)
    protected readonly listsRepository: Repository<List>,
    @InjectRepository(ListItem)
    private listItemsRepository: Repository<ListItem>,
    @InjectRepository(ListCollaborator)
    private collaboratorsRepository: Repository<ListCollaborator>,
    @InjectRepository(ListFavorite)
    private favoritesRepository: Repository<ListFavorite>,
    protected readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
    private readonly moviesService: MoviesService,
  ) {
    super(listsRepository, cacheService, 'list', cacheKeyFactory);
  }

  async createList(input: CreateListInput, user: User): Promise<List> {
    this.logger.log(`Creating list for user: ${user.id}`);
    
    // Validate input
    if (!user || !user.id) {
      this.logger.error('User or user ID is null/undefined');
      throw new Error('Authentication failed: User not found');
    }
  
    // For custom lists, enforce max entries limit
    if (input.type === ListType.CUSTOM && !input.maxEntries) {
      input.maxEntries = 10; // Default limit for custom lists
    }
  
    try {
      // Explicitly create the list with the owner
      const list = this.listsRepository.create({
        ...input,
        owner_id: user.id,
        owner: user,
        collaborators: [], // Ensure collaborators is initialized as empty array
        items: []          // Ensure items is initialized as empty array
      });
  
      const saved = await this.listsRepository.save(list);
      
      this.logger.log(`List saved successfully: ${saved.id}`);
      
      // Invalidate related caches
      await Promise.all([
        this.clearEntityCache(saved.id),
        this.invalidateUserListsCache(user.id),
        this.invalidateTrendingListsCache()
      ]);
      
      return saved;
    } catch (error) {
      this.logger.error(`List creation error: ${error.message}`);
      this.logger.error(`Error details: ${JSON.stringify(error)}`);
      throw error;
    }
  }   

  /**
   * Override base service method to clear all list-related caches
   */
  protected async clearEntityCache(id: string): Promise<void> {
    try {
      await super.clearEntityCache(id);
      
      // Clear specific list pattern caches
      await Promise.all([
        this.cacheService.invalidate(this.cacheKeyFactory.list.details(id)),
        this.cacheService.invalidate(this.cacheKeyFactory.list.items(id)),
        this.cacheService.invalidatePattern(`list:${id}:*`)
      ]);
    } catch (error) {
      this.logger.error(`Error clearing list cache for ${id}: ${error.message}`);
    }
  }

  /**
   * Invalidate user-specific list caches
   */
  private async invalidateUserListsCache(userId: string): Promise<void> {
    try {
      await Promise.all([
        this.cacheService.invalidate(this.cacheKeyFactory.list.userLists(userId)),
        this.cacheService.invalidatePattern(`list:user:${userId}:*`)
      ]);
    } catch (error) {
      this.logger.error(`Error invalidating user lists cache: ${error.message}`);
    }
  }

  /**
   * Invalidate trending lists cache
   */
  private async invalidateTrendingListsCache(): Promise<void> {
    try {
      await this.cacheService.invalidatePattern('list:trending:*');
    } catch (error) {
      this.logger.error(`Error invalidating trending lists cache: ${error.message}`);
    }
  }

  /**
   * Invalidate category lists cache
   */
  private async invalidateCategoryListsCache(category: string): Promise<void> {
    try {
      await this.cacheService.invalidatePattern(`list:category:${category}:*`);
    } catch (error) {
      this.logger.error(`Error invalidating category lists cache: ${error.message}`);
    }
  }

  async updateList(input: UpdateListInput, user: User): Promise<List> {
    const list = await this.findOneWithPermissions(input.id, user.id);

    if (list.owner_id !== user.id) {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { listId: list.id, userId: user.id }
      });

      if (!collaborator?.permissions.includes(CollaboratorPermission.EDIT_DETAILS)) {
        throw new ForbiddenException('You do not have permission to edit this list');
      }
    }

    // Check if category changed
    const oldCategory = list.category;
    
    Object.assign(list, input);
    const saved = await this.listsRepository.save(list);
    
    // Clear list cache
    await this.clearEntityCache(saved.id);
    
    // If category changed, invalidate both old and new category caches
    if (input.category && input.category !== oldCategory) {
      await Promise.all([
        oldCategory && this.invalidateCategoryListsCache(oldCategory),
        this.invalidateCategoryListsCache(input.category)
      ]);
    }
    
    // If privacy changed, may affect trending or public lists
    if (input.privacy) {
      await this.invalidateTrendingListsCache();
    }
    
    return saved;
  }

  async deleteList(id: string, user: User): Promise<boolean> {
    const list = await this.findOneWithPermissions(id, user.id);

    if (list.owner_id !== user.id) {
      throw new ForbiddenException('Only the list owner can delete it');
    }

    if (list.type === ListType.STANDARD) {
      throw new ForbiddenException('Standard lists cannot be deleted');
    }

    // Cache relevant data before deletion
    const { owner_id, category } = list;
    
    await this.listsRepository.remove(list);
    
    // Clear caches
    await Promise.all([
      this.clearEntityCache(id),
      this.invalidateUserListsCache(owner_id),
      category && this.invalidateCategoryListsCache(category),
      this.invalidateTrendingListsCache()
    ]);
    
    return true;
  }

  async addListItem(input: AddListItemInput, user: User): Promise<ListItem> {
    const list = await this.findOneWithPermissions(input.listId, user.id);

    // Check if user has permission to add items
    if (list.owner_id !== user.id) {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { listId: list.id, userId: user.id }
      });

      if (!collaborator?.permissions.includes(CollaboratorPermission.ADD_ITEMS)) {
        throw new ForbiddenException('You do not have permission to add items to this list');
      }
    }

    // Check max entries limit for custom lists
    if (list.type === ListType.CUSTOM && list.maxEntries) {
      const itemCount = await this.listItemsRepository.count({
        where: { listId: list.id }
      });

      if (itemCount >= list.maxEntries) {
        throw new ConflictException(`This list has reached its maximum limit of ${list.maxEntries} items`);
      }
    }

    // Find the movie by its TMDB ID or create it if it doesn't exist
    // This step is crucial - we always need to get an internal Movie entity 
    // with a UUID before creating the relationship
    let movie = await this.moviesService.findByTmdbId(input.tmdbId);
    
    // If movie doesn't exist, fetch from TMDB and create it
    if (!movie) {
      try {
        const tmdbMovie = await this.moviesService.tmdbService.getMovie(input.tmdbId);
        movie = await this.moviesService.createOrUpdateFromTMDB(tmdbMovie);
      } catch (error) {
        this.logger.error(`Failed to fetch movie with TMDB ID ${input.tmdbId}:`, error);
        throw new BadRequestException(`Movie with TMDB ID ${input.tmdbId} not found`);
      }
    }
    
    // Log the internal movie ID that we'll be using for the relationship
    this.logger.log(`Using internal movie ID ${movie.id} for TMDB ID ${input.tmdbId}`);

    // Check if movie is already in the list - using the movie.id (UUID) field
    const existingItem = await this.listItemsRepository.findOne({
      where: { listId: list.id, movieId: movie.id }
    });

    if (existingItem) {
      throw new ConflictException('This movie is already in the list');
    }

    // Create the list item with the explicit UUID relationship
    const item = this.listItemsRepository.create({
      list,
      listId: list.id,
      movie,         // Set the Movie entity relationship
      movieId: movie.id, // This is the UUID, not the TMDB ID
      addedBy: user,
      addedById: user.id,
      order: input.order ?? await this.getNextItemOrder(list.id),
    });

    const saved = await this.listItemsRepository.save(item);
    
    // Invalidate list items cache
    await Promise.all([
      this.clearEntityCache(list.id),
      this.cacheService.invalidate(this.cacheKeyFactory.list.items(list.id)),
      this.cacheService.invalidate(this.cacheKeyFactory.list.stats(list.id))
    ]);
    
    return saved;
  }

  async bulkAddMovies(input: BulkMovieAddInput, user: User): Promise<ListItem[]> {
    this.logger.log(`Processing bulkAddMovies with ${input.tmdbIds.length} TMDB IDs`);
    
    const list = await this.findOneWithPermissions(input.listId, user.id);

    // Check permissions
    if (list.owner_id !== user.id) {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { listId: list.id, userId: user.id }
      });

      if (!collaborator?.permissions.includes(CollaboratorPermission.ADD_ITEMS)) {
        throw new ForbiddenException('You do not have permission to add items to this list');
      }
    }

    // Check max entries limit for custom lists
    if (list.type === ListType.CUSTOM && list.maxEntries) {
      const currentItemCount = await this.listItemsRepository.count({
        where: { listId: list.id }
      });

      if (currentItemCount + input.tmdbIds.length > list.maxEntries) {
        throw new ConflictException(`Cannot add all movies. List limit is ${list.maxEntries} items (currently has ${currentItemCount})`);
      }
    }

    // Process each movie by TMDB ID
    // Map TMDB ID to Movie entity with internal UUID
    const movieMap = new Map<number, Movie>(); 
    
    for (const tmdbId of input.tmdbIds) {
      try {
        // Find existing movie by TMDB ID
        let movie = await this.moviesService.findByTmdbId(tmdbId);
        
        // If not found, create it from TMDB
        if (!movie) {
          const tmdbMovie = await this.moviesService.tmdbService.getMovie(tmdbId);
          movie = await this.moviesService.createOrUpdateFromTMDB(tmdbMovie);
        }
        
        // Add to map if successful - the key is the TMDB ID, but the value is the Movie entity
        // with its internal UUID that we'll use for the relationship
        if (movie) {
          this.logger.log(`Using internal movie ID ${movie.id} for TMDB ID ${tmdbId}`);
          movieMap.set(tmdbId, movie);
        }
      } catch (error) {
        this.logger.error(`Error processing movie with TMDB ID ${tmdbId}:`, error);
        // Continue with other movies
      }
    }
    
    this.logger.log(`Successfully processed ${movieMap.size} movies`);

    // Get existing movie IDs in the list
    const existingItems = await this.listItemsRepository.find({
      where: { listId: list.id }
    });

    // We're working with internal UUIDs for relationships
    const existingMovieIds = existingItems.map(item => item.movieId);
    
    // Filter out movies that are already in the list (comparing internal UUID, not TMDB ID)
    const newMovies = Array.from(movieMap.values()).filter(movie => 
      !existingMovieIds.includes(movie.id)
    );
    
    this.logger.log(`Found ${newMovies.length} new movies to add to the list after filtering existing items.`);

    if (newMovies.length === 0) {
      return []; // All movies already in the list
    }

    // Get the next order number
    let nextOrder = await this.getNextItemOrder(list.id);

    // Create and save the new items - using internal UUIDs for relationships
    const items = newMovies.map(movie => {
      return this.listItemsRepository.create({
        list,
        listId: list.id,
        movie,              // Set Movie entity relationship
        movieId: movie.id,  // This is the UUID, not the TMDB ID
        addedBy: user,
        addedById: user.id,
        order: nextOrder++
      });
    });

    // Save all items
    const savedItems = await this.listItemsRepository.save(items);
    
    // Now we need to fetch the saved items with relations to ensure list is populated
    const populatedItems = await this.listItemsRepository.find({
      where: { id: In(savedItems.map(item => item.id)) },
      relations: ['list', 'addedBy', 'movie']
    });
    
    // Invalidate list caches
    await Promise.all([
      this.clearEntityCache(list.id),
      this.cacheService.invalidate(this.cacheKeyFactory.list.items(list.id)),
      this.cacheService.invalidate(this.cacheKeyFactory.list.stats(list.id))
    ]);
    
    return populatedItems;
  }

  async bulkRemoveMovies(input: BulkMovieRemoveInput, user: User): Promise<boolean> {
    const list = await this.findOneWithPermissions(input.listId, user.id);

    // Check permissions
    const isOwner = list.owner_id === user.id;
    if (!isOwner) {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { listId: list.id, userId: user.id }
      });

      if (!collaborator?.permissions.includes(CollaboratorPermission.REMOVE_ITEMS)) {
        throw new ForbiddenException('You do not have permission to remove items from this list');
      }
    }

    // Convert TMDB IDs to internal Movie UUIDs for relationship lookup
    const movieIds: string[] = [];
    for (const tmdbId of input.tmdbIds) {
      // Look up the internal Movie entity by TMDB ID
      const movie = await this.moviesService.findByTmdbId(tmdbId);
      if (movie) {
        this.logger.log(`Found internal movie ID ${movie.id} for TMDB ID ${tmdbId}`);
        movieIds.push(movie.id);  // Add the internal UUID, not the TMDB ID
      } else {
        this.logger.warn(`Movie with TMDB ID ${tmdbId} not found when attempting to remove`);
      }
    }

    if (movieIds.length === 0) {
      return true; // No movies found with these TMDB IDs
    }

    // Get items to remove
    const itemsToRemove = await this.listItemsRepository.find({
      where: { listId: list.id, movieId: In(movieIds) }
    });

    if (itemsToRemove.length === 0) {
      return true; // No items to remove
    }

    // Check if user has permission to remove specific items (if not owner)
    if (!isOwner) {
      // Check if user added all items or has remove permission
      const notAddedByUser = itemsToRemove.filter(item => item.addedById !== user.id);
      if (notAddedByUser.length > 0) {
        throw new ForbiddenException('You can only remove items that you added to the list');
      }
    }

    await this.listItemsRepository.remove(itemsToRemove);
    
    // Invalidate list caches
    await Promise.all([
      this.clearEntityCache(list.id),
      this.cacheService.invalidate(this.cacheKeyFactory.list.items(list.id)),
      this.cacheService.invalidate(this.cacheKeyFactory.list.stats(list.id))
    ]);
    
    return true;
  }

  async reorderListItems(input: BulkListItemReorderInput, user: User): Promise<boolean> {
    const list = await this.findOneWithPermissions(input.listId, user.id);

    // Check permissions
    if (list.owner_id !== user.id) {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { listId: list.id, userId: user.id }
      });

      if (!collaborator?.permissions.includes(CollaboratorPermission.EDIT_DETAILS)) {
        throw new ForbiddenException('You do not have permission to reorder items in this list');
      }
    }

    // Verify that all items exist and belong to the list
    const items = await this.listItemsRepository.find({
      where: { id: In(input.itemIds), listId: list.id }
    });

    if (items.length !== input.itemIds.length) {
      throw new BadRequestException('Some items do not exist or do not belong to this list');
    }

    // Update order for each item
    const updates = input.itemIds.map((id, index) => {
      return this.listItemsRepository.update(
        { id },
        { order: index }
      );
    });

    await Promise.all(updates);
    
    // Invalidate list items cache
    await this.cacheService.invalidate(this.cacheKeyFactory.list.items(list.id));
    
    return true;
  }

  async removeListItem(listId: string, itemId: string, user: User): Promise<boolean> {
    const list = await this.findOneWithPermissions(listId, user.id);
    const item = await this.listItemsRepository.findOne({
      where: { id: itemId, listId },
      relations: ['addedBy', 'movie']
    });

    if (!item) {
      throw new NotFoundException('List item not found');
    }

    // Check permissions
    if (list.owner_id !== user.id && item.addedById !== user.id) {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { listId, userId: user.id }
      });

      if (!collaborator?.permissions.includes(CollaboratorPermission.REMOVE_ITEMS)) {
        throw new ForbiddenException('You do not have permission to remove items from this list');
      }
    }

    await this.listItemsRepository.remove(item);
    
    // Invalidate list caches
    await Promise.all([
      this.clearEntityCache(list.id),
      this.cacheService.invalidate(this.cacheKeyFactory.list.items(list.id)),
      this.cacheService.invalidate(this.cacheKeyFactory.list.stats(list.id))
    ]);
    
    return true;
  }

  async addCollaborator(input: AddCollaboratorInput, user: User): Promise<ListCollaborator> {
    const list = await this.findOneWithPermissions(input.listId, user.id);

    // Only owner or collaborators with invite permission can add collaborators
    if (list.owner_id !== user.id) {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { listId: list.id, userId: user.id }
      });

      if (!collaborator?.permissions.includes(CollaboratorPermission.INVITE_OTHERS)) {
        throw new ForbiddenException('You do not have permission to add collaborators');
      }
    }

    // Check if user is already a collaborator
    const existingCollaborator = await this.collaboratorsRepository.findOne({
      where: { listId: list.id, userId: input.userId }
    });

    if (existingCollaborator) {
      throw new ConflictException('User is already a collaborator');
    }

    // Cannot add owner as collaborator
    if (list.owner_id === input.userId) {
      throw new ConflictException('Cannot add list owner as collaborator');
    }

    const collaborator = this.collaboratorsRepository.create({
      list,
      listId: list.id,
      userId: input.userId,
      permissions: input.permissions,
      addedBy: user,
      addedById: user.id
    });

    const saved = await this.collaboratorsRepository.save(collaborator);
    
    // Invalidate collaborator caches
    await Promise.all([
      this.clearEntityCache(list.id),
      this.cacheService.invalidate(this.cacheKeyFactory.list.collaborators(list.id)),
      this.invalidateUserListsCache(input.userId)
    ]);
    
    return saved;
  }

  async updateCollaborator(listId: string, collaboratorId: string, permissions: CollaboratorPermission[], user: User): Promise<ListCollaborator> {
    const list = await this.findOneWithPermissions(listId, user.id);
    const collaborator = await this.collaboratorsRepository.findOne({
      where: { id: collaboratorId, listId },
      relations: ['user']
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    // Only owner can update collaborator permissions
    if (list.owner_id !== user.id) {
      throw new ForbiddenException('Only the list owner can update collaborator permissions');
    }

    collaborator.permissions = permissions;
    const saved = await this.collaboratorsRepository.save(collaborator);
    
    // Invalidate collaborator caches
    await Promise.all([
      this.clearEntityCache(list.id),
      this.cacheService.invalidate(this.cacheKeyFactory.list.collaborators(list.id)),
      this.cacheService.invalidate(this.cacheKeyFactory.list.collaborator(list.id, collaborator.userId))
    ]);
    
    return saved;
  }

  async removeCollaborator(listId: string, collaboratorId: string, user: User): Promise<boolean> {
    const list = await this.findOneWithPermissions(listId, user.id);
    const collaborator = await this.collaboratorsRepository.findOne({
      where: { id: collaboratorId, listId }
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    // Allow both owner and the collaborator themselves to remove the collaboration
    if (list.owner_id !== user.id && collaborator.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to remove this collaborator');
    }

    const userId = collaborator.userId; // Save userId before removal
    
    await this.collaboratorsRepository.remove(collaborator);
    
    // Invalidate collaborator caches
    await Promise.all([
      this.clearEntityCache(list.id),
      this.cacheService.invalidate(this.cacheKeyFactory.list.collaborators(list.id)),
      this.invalidateUserListsCache(userId)
    ]);
    
    return true;
  }

  async favoriteList(listId: string, user: User): Promise<boolean> {
    const list = await this.listsRepository.findOne({
      where: { id: listId }
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Check if list is public or user has access
    if (list.privacy !== ListPrivacy.PUBLIC) {
      const hasAccess = await this.userHasAccess(list.id, user.id);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this list');
      }
    }

    // Check if already favorited
    const existingFavorite = await this.favoritesRepository.findOne({
      where: { listId, userId: user.id }
    });

    if (existingFavorite) {
      // Unlike
      await this.favoritesRepository.remove(existingFavorite);
      await this.listsRepository.decrement({ id: listId }, 'favoriteCount', 1);
      
      // Invalidate favorite caches
      await Promise.all([
        this.clearEntityCache(listId),
        this.cacheService.invalidate(this.cacheKeyFactory.list.favorites(listId)),
        this.cacheService.invalidate(this.cacheKeyFactory.user.favoritedLists(user.id)),
        this.invalidateTrendingListsCache()
      ]);
      
      return false;
    } else {
      // Like
      const favorite = this.favoritesRepository.create({
        list,
        listId,
        userId: user.id
      });
      await this.favoritesRepository.save(favorite);
      await this.listsRepository.increment({ id: listId }, 'favoriteCount', 1);
      
      // Invalidate favorite caches
      await Promise.all([
        this.clearEntityCache(listId),
        this.cacheService.invalidate(this.cacheKeyFactory.list.favorites(listId)),
        this.cacheService.invalidate(this.cacheKeyFactory.user.favoritedLists(user.id)),
        this.invalidateTrendingListsCache()
      ]);
      
      return true;
    }
  }

  async getFavoritedLists(userId: string, page = 1, limit = 10): Promise<[List[], number]> {
    const cacheKey = this.cacheKeyFactory.user.favoritedLists(userId, page, limit);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        return this.favoritesRepository.findAndCount({
          where: { userId },
          relations: ['list', 'list.owner'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' }
        }).then(([favorites, total]) => [favorites.map(f => f.list), total]);
      },
      CacheTTL.MEDIUM
    );
  }

  async getUserLists(userId: string, type?: ListType): Promise<List[]> {
    const cacheKey = this.cacheKeyFactory.list.userLists(userId, type?.toString());
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const query = this.listsRepository.createQueryBuilder('list')
          .leftJoinAndSelect('list.owner', 'owner')
          .leftJoinAndSelect('list.collaborators', 'collaborators')
          .where('list.owner_id = :userId', { userId });

        if (type) {
          query.andWhere('list.type = :type', { type });
        }

        return query.getMany().then(lists => {
          // Ensure each list has collaborators initialized
          return lists.map(list => {
            if (!list.collaborators) {
              list.collaborators = [];
            }
            return list;
          });
        });
      },
      CacheTTL.MEDIUM
    );
  }

  async getCollaborativeLists(userId: string): Promise<List[]> {
    const cacheKey = this.cacheKeyFactory.user.collaborativeLists(userId);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const collaborations = await this.collaboratorsRepository.find({
          where: { userId },
          relations: ['list', 'list.owner', 'list.collaborators']
        });

        return collaborations.map(c => {
          if (!c.list.collaborators) {
            c.list.collaborators = [];
          }
          return c.list;
        });
      },
      CacheTTL.MEDIUM
    );
  }

  async getTrendingLists(timeframe: 'day' | 'week' | 'month' = 'week', page = 1, limit = 10): Promise<[List[], number]> {
    const cacheKey = this.cacheKeyFactory.list.trending(timeframe, page, limit);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const dateLimit = new Date();
        switch (timeframe) {
          case 'day':
            dateLimit.setDate(dateLimit.getDate() - 1);
            break;
          case 'week':
            dateLimit.setDate(dateLimit.getDate() - 7);
            break;
          case 'month':
            dateLimit.setMonth(dateLimit.getMonth() - 1);
            break;
        }

        const query = this.listsRepository.createQueryBuilder('list')
          .leftJoinAndSelect('list.owner', 'owner')
          .where('list.privacy = :privacy', { privacy: ListPrivacy.PUBLIC })
          .andWhere('list.createdAt >= :dateLimit', { dateLimit })
          .orderBy('list.favoriteCount', 'DESC')
          .addOrderBy('list.createdAt', 'DESC')
          .skip((page - 1) * limit)
          .take(limit);

        return query.getManyAndCount();
      },
      timeframe === 'day' ? CacheTTL.SHORT : CacheTTL.MEDIUM
    );
  }

  async searchLists(filters: ListFiltersInput, userId: string): Promise<[List[], number]> {
    // Only cache if no search term (search results shouldn't be cached)
    if (!filters.searchTerm) {
      const filterKey = JSON.stringify({
        ...filters,
        page: filters.page || 1,
        limit: filters.limit || 10,
        userId
      });
      const cacheKey = this.cacheKeyFactory.list.search(this.hashString(filterKey));
      
      return this.cacheService.getOrFetch(
        cacheKey,
        () => this.performListSearch(filters, userId),
        CacheTTL.SHORT
      );
    }
    
    return this.performListSearch(filters, userId);
  }
  
  private async performListSearch(filters: ListFiltersInput, userId: string): Promise<[List[], number]> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    
    // Base query conditions
    const whereConditions: FindOptionsWhere<List> = {};
    
    // Check privacy conditions
    if (filters.privacy) {
      whereConditions.privacy = filters.privacy;
    } else {
      // If no privacy filter, default to available lists (public + owned + collaborative)
      const collaborativeListIds = await this.getCollaborativeListIds(userId);
      
      if (collaborativeListIds.length > 0) {
        whereConditions.privacy = ListPrivacy.PUBLIC;
        // This is a simplification. In the actual query we'll handle collaborative lists separately
      } else {
        whereConditions.privacy = ListPrivacy.PUBLIC;
      }
    }
    
    // Type filter
    if (filters.type) {
      whereConditions.type = filters.type;
    }
    
    // Category filter
    if (filters.category) {
      whereConditions.category = filters.category;
    }
    
    // Text search
    if (filters.searchTerm) {
      whereConditions.name = Like(`%${filters.searchTerm}%`);
      // For more complex search we would use a more sophisticated approach
    }
    
    // Create query builder
    let queryBuilder = this.listsRepository.createQueryBuilder('list')
      .leftJoinAndSelect('list.owner', 'owner');
    
    // Apply basic conditions
    Object.entries(whereConditions).forEach(([key, value]) => {
      if (key !== 'privacy' || value !== ListPrivacy.PUBLIC) {
        queryBuilder = queryBuilder.andWhere(`list.${key} = :${key}`, { [key]: value });
      }
    });
    
    // Handle privacy/access conditions
    if (!filters.privacy) {
      const collaborativeListIds = await this.getCollaborativeListIds(userId);
      
      queryBuilder = queryBuilder.andWhere(`(
        list.privacy = :publicPrivacy
        OR list.owner_id = :userId
        ${collaborativeListIds.length > 0 ? 'OR list.id IN (:...collaborativeListIds)' : ''}
      )`, {
        publicPrivacy: ListPrivacy.PUBLIC,
        userId,
        ...(collaborativeListIds.length > 0 && { collaborativeListIds }),
      });
    }
    
    // Handle favorites filter
    if (filters.onlyFavorites) {
      queryBuilder = queryBuilder
        .innerJoin('list_favorites', 'fav', 'fav.list_id = list.id AND fav.user_id = :favUserId', { favUserId: userId });
    }
    
    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortDirection = filters.sortDirection || 'DESC';
    queryBuilder = queryBuilder.orderBy(`list.${sortBy}`, sortDirection);
    
    // Apply pagination
    queryBuilder = queryBuilder
      .skip((page - 1) * limit)
      .take(limit);
    
    // Execute query
    const [lists, total] = await queryBuilder.getManyAndCount();
    
    return [lists, total];
  }

  async getListsByCategory(category: string, page = 1, limit = 10): Promise<[List[], number]> {
    const cacheKey = this.cacheKeyFactory.list.category(category, page, limit);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        return this.listsRepository.findAndCount({
          where: { 
            category,
            privacy: ListPrivacy.PUBLIC
          },
          relations: ['owner'],
          skip: (page - 1) * limit,
          take: limit,
          order: { favoriteCount: 'DESC' }
        });
      },
      CacheTTL.MEDIUM
    );
  }

  async getListItems(listId: string, userId: string | null): Promise<ListItem[]> {
    // First check if user has permission to view this list
    await this.findOneWithPermissions(listId, userId);
    
    const cacheKey = this.cacheKeyFactory.list.items(listId);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        return this.listItemsRepository.find({
          where: { listId },
          relations: ['list', 'addedBy'],
          order: { order: 'ASC' }
        });
      },
      CacheTTL.MEDIUM
    );
  }

  async getListStats(listId: string, userId: string): Promise<ListMovieStats> {
    // First check if user has permission to view this list
    await this.findOneWithPermissions(listId, userId);
    
    const cacheKey = this.cacheKeyFactory.list.stats(listId);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        // Get all items in the list
        const items = await this.listItemsRepository.find({
          where: { listId }
        });
        
        if (items.length === 0) {
          return {
            totalMovies: 0,
            uniqueMovies: 0,
            genreDistribution: [],
            yearDistribution: []
          };
        }
        
        // In a real implementation, you'd fetch movie data from your movies service
        // Here we'll return placeholder data
        const genreDistribution: ListGenreStats[] = [
          { genre: 'Action', count: Math.floor(items.length * 0.3) },
          { genre: 'Drama', count: Math.floor(items.length * 0.2) },
          { genre: 'Comedy', count: Math.floor(items.length * 0.15) },
          { genre: 'Sci-Fi', count: Math.floor(items.length * 0.1) },
          { genre: 'Other', count: items.length - Math.floor(items.length * 0.75) }
        ];
        
        const currentYear = new Date().getFullYear();
        const yearDistribution: ListYearStats[] = [
          { year: currentYear, count: Math.floor(items.length * 0.1) },
          { year: currentYear - 1, count: Math.floor(items.length * 0.15) },
          { year: currentYear - 2, count: Math.floor(items.length * 0.2) },
          { year: currentYear - 3, count: Math.floor(items.length * 0.25) },
          { year: currentYear - 4, count: items.length - Math.floor(items.length * 0.7) }
        ];
        
        return {
          totalMovies: items.length,
          uniqueMovies: items.length, // In this case they're all unique due to our constraints
          genreDistribution,
          yearDistribution,
          averageRating: 7.5 // Placeholder - would come from actual ratings
        };
      },
      CacheTTL.MEDIUM
    );
  }

  async cloneList(listId: string, newName: string, user: User): Promise<List> {
    // Get original list
    const originalList = await this.findOneWithPermissions(listId, user.id);
    
    // Create new list with same properties but new name
    const newList = await this.createList({
      name: newName,
      description: `Cloned from: ${originalList.name}`,
      type: originalList.type,
      privacy: originalList.privacy,
      category: originalList.category,
      maxEntries: originalList.maxEntries,
      thumbnail: originalList.thumbnail
    }, user);
    
    // Get items from original list
    const originalItems = await this.listItemsRepository.find({
      where: { listId: originalList.id },
      order: { order: 'ASC' }
    });
    
    // Copy items to new list
    for (const item of originalItems) {
      // First get the movie to retrieve its TMDB ID
      const movie = await this.listItemsRepository.findOne({
        where: { id: item.id },
        relations: ['movie']
      });
      
      if (movie?.movie?.tmdbId) {
        await this.addListItem({
          listId: newList.id,
          tmdbId: movie.movie.tmdbId,
          order: item.order
        }, user);
      }
    }
    
    return newList;
  }

  // Get a list with permission check (exposed for GraphQL query)
  async getListWithPermissions(id: string, userId: string | null): Promise<List> {
    const list = await this.findOneWithPermissions(id, userId, true);
    
    // Ensure dates are set to avoid serialization issues
    if (!list.createdAt) list.createdAt = new Date();
    if (!list.updatedAt) list.updatedAt = new Date();
    
    return list;
  }

  // Helper methods
  private async findOneWithPermissions(id: string, userId: string | null, includeRelations: boolean = false): Promise<List> {
    // When userId is null, use a special cache key
    const cacheKey = this.cacheKeyFactory.list.access(id, userId || 'anonymous');
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        // Determine which relations to include
        const relations = ['owner'];
        if (includeRelations) {
          relations.push('collaborators', 'collaborators.user', 'items', 'items.addedBy');
        }
        
        const list = await this.listsRepository.findOne({
          where: { id },
          relations: relations
        });

        if (!list) {
          throw new NotFoundException('List not found');
        }

        // If userId is null, only allow public lists and STANDARD lists (for compatibility)
        if (!userId) {
          if (list.privacy !== ListPrivacy.PUBLIC && list.type !== ListType.STANDARD) {
            throw new ForbiddenException('Authentication required to access this list');
          }
        } else if (list.owner_id !== userId) {
          const hasAccess = await this.userHasAccess(id, userId);
          if (!hasAccess) {
            throw new ForbiddenException('You do not have access to this list');
          }
        }

        return list;
      },
      CacheTTL.MEDIUM
    );
  }

  private async userHasAccess(listId: string, userId: string | null): Promise<boolean> {
    // When userId is null, use a special cache key
    const cacheKey = this.cacheKeyFactory.list.userAccess(listId, userId || 'anonymous');
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const list = await this.listsRepository.findOne({
          where: { id: listId }
        });

        if (!list) {
          return false;
        }

        // Public lists are accessible to everyone
        if (list.privacy === ListPrivacy.PUBLIC) {
          return true;
        }
        
        // STANDARD lists should be accessible by everyone
        if (list.type === ListType.STANDARD) {
          return true;
        }

        // Check if user is owner
        if (list.owner_id === userId) {
          return true;
        }

        // If userId is null, user can't be a collaborator
        if (userId) {
          // Check if user is collaborator
          const collaborator = await this.collaboratorsRepository.findOne({
            where: { listId, userId }
          });

          if (collaborator) {
            return true;
          }
        }

        // TODO: Add following check when user following system is implemented
        if (list.privacy === ListPrivacy.FOLLOWING) {
          // Implement following check here
          return false;
        }

        return false;
      },
      CacheTTL.MEDIUM
    );
  }

  private async getCollaborativeListIds(userId: string): Promise<string[]> {
    const cacheKey = this.cacheKeyFactory.user.collaborativeListIds(userId);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const collaborations = await this.collaboratorsRepository.find({
          where: { userId },
          select: ['listId']
        });
        
        return collaborations.map(c => c.listId);
      },
      CacheTTL.MEDIUM
    );
  }

  private async getNextItemOrder(listId: string): Promise<number> {
    const result = await this.listItemsRepository.createQueryBuilder('item')
      .where('item.listId = :listId', { listId })
      .select('MAX(item.order)', 'maxOrder')
      .getRawOne();

    return (result?.maxOrder ?? -1) + 1;
  }

  async getItemCount(listId: string): Promise<number> {
    const cacheKey = this.cacheKeyFactory.list.itemCount(listId);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        return this.listItemsRepository.count({
          where: { listId }
        });
      },
      CacheTTL.MEDIUM
    );
  }

  async isListFavoritedByUser(listId: string, userId: string): Promise<boolean> {
    const cacheKey = this.cacheKeyFactory.list.favorited(listId, userId);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const favorite = await this.favoritesRepository.findOne({
          where: { listId, userId }
        });
        return !!favorite;
      },
      CacheTTL.MEDIUM
    );
  }

  async isUserCollaborator(listId: string, userId: string): Promise<boolean> {
    const cacheKey = this.cacheKeyFactory.list.isCollaborator(listId, userId);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const collaborator = await this.collaboratorsRepository.findOne({
          where: { listId, userId }
        });
        return !!collaborator;
      },
      CacheTTL.MEDIUM
    );
  }

  async getCollaboratorPermissions(listId: string, userId: string): Promise<CollaboratorPermission[] | null> {
    const cacheKey = this.cacheKeyFactory.list.collaborator(listId, userId);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const collaborator = await this.collaboratorsRepository.findOne({
          where: { listId, userId }
        });
        return collaborator?.permissions || null;
      },
      CacheTTL.MEDIUM
    );
  }
  
  // Utility function to create a simple hash for cache keys
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
}