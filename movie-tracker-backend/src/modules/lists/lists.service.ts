// src/modules/lists/lists.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { List, ListType, ListPrivacy } from './entities/list.entity';
import { ListItem } from './entities/list-item.entity';
import { ListCollaborator, CollaboratorPermission } from './entities/list-collaborator.entity';
import { ListFavorite } from './entities/list-favorite.entity';
import { CreateListInput } from './dto/create-list.input';
import { UpdateListInput } from './dto/update-list.input';
import { AddListItemInput } from './dto/add-list-item.input';
import { AddCollaboratorInput } from './dto/add-collaborator.input';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(List)
    private listsRepository: Repository<List>,
    @InjectRepository(ListItem)
    private listItemsRepository: Repository<ListItem>,
    @InjectRepository(ListCollaborator)
    private collaboratorsRepository: Repository<ListCollaborator>,
    @InjectRepository(ListFavorite)
    private favoritesRepository: Repository<ListFavorite>,
  ) {}

  async createList(input: CreateListInput, user: User): Promise<List> {
    // For custom lists, enforce max entries limit
    if (input.type === ListType.CUSTOM && !input.maxEntries) {
      input.maxEntries = 10; // Default limit for custom lists
    }

    const list = this.listsRepository.create({
      ...input,
      owner: user,
    });

    return this.listsRepository.save(list);
  }

  async updateList(input: UpdateListInput, user: User): Promise<List> {
    const list = await this.findOneWithPermissions(input.id, user.id);

    if (list.ownerId !== user.id) {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { listId: list.id, userId: user.id }
      });

      if (!collaborator?.permissions.includes(CollaboratorPermission.EDIT_DETAILS)) {
        throw new ForbiddenException('You do not have permission to edit this list');
      }
    }

    Object.assign(list, input);
    return this.listsRepository.save(list);
  }

  async deleteList(id: string, user: User): Promise<boolean> {
    const list = await this.findOneWithPermissions(id, user.id);

    if (list.ownerId !== user.id) {
      throw new ForbiddenException('Only the list owner can delete it');
    }

    if (list.type === ListType.STANDARD) {
      throw new ForbiddenException('Standard lists cannot be deleted');
    }

    await this.listsRepository.remove(list);
    return true;
  }

  async addListItem(input: AddListItemInput, user: User): Promise<ListItem> {
    const list = await this.findOneWithPermissions(input.listId, user.id);

    // Check if user has permission to add items
    if (list.ownerId !== user.id) {
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

    // Check if movie is already in the list
    const existingItem = await this.listItemsRepository.findOne({
      where: { listId: list.id, movieId: input.movieId }
    });

    if (existingItem) {
      throw new ConflictException('This movie is already in the list');
    }

    const item = this.listItemsRepository.create({
      list,
      movieId: input.movieId,
      addedBy: user,
      order: input.order ?? await this.getNextItemOrder(list.id),
    });

    return this.listItemsRepository.save(item);
  }

  async removeListItem(listId: string, itemId: string, user: User): Promise<boolean> {
    const list = await this.findOneWithPermissions(listId, user.id);
    const item = await this.listItemsRepository.findOne({
      where: { id: itemId, listId },
      relations: ['addedBy']
    });

    if (!item) {
      throw new NotFoundException('List item not found');
    }

    // Check permissions
    if (list.ownerId !== user.id && item.addedById !== user.id) {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { listId, userId: user.id }
      });

      if (!collaborator?.permissions.includes(CollaboratorPermission.REMOVE_ITEMS)) {
        throw new ForbiddenException('You do not have permission to remove items from this list');
      }
    }

    await this.listItemsRepository.remove(item);
    return true;
  }

  async addCollaborator(input: AddCollaboratorInput, user: User): Promise<ListCollaborator> {
    const list = await this.findOneWithPermissions(input.listId, user.id);

    // Only owner or collaborators with invite permission can add collaborators
    if (list.ownerId !== user.id) {
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
    if (list.ownerId === input.userId) {
      throw new ConflictException('Cannot add list owner as collaborator');
    }

    const collaborator = this.collaboratorsRepository.create({
      list,
      userId: input.userId,
      permissions: input.permissions,
      addedBy: user,
    });

    return this.collaboratorsRepository.save(collaborator);
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
    if (list.ownerId !== user.id) {
      throw new ForbiddenException('Only the list owner can update collaborator permissions');
    }

    collaborator.permissions = permissions;
    return this.collaboratorsRepository.save(collaborator);
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
    if (list.ownerId !== user.id && collaborator.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to remove this collaborator');
    }

    await this.collaboratorsRepository.remove(collaborator);
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
      return false;
    } else {
      // Like
      const favorite = this.favoritesRepository.create({
        list,
        userId: user.id
      });
      await this.favoritesRepository.save(favorite);
      await this.listsRepository.increment({ id: listId }, 'favoriteCount', 1);
      return true;
    }
  }

  async getFavoritedLists(userId: string, page = 1, limit = 10): Promise<[List[], number]> {
    const [favorites, total] = await this.favoritesRepository.findAndCount({
      where: { userId },
      relations: ['list', 'list.owner'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return [favorites.map(f => f.list), total];
  }

  async getUserLists(userId: string, type?: ListType): Promise<List[]> {
    const query = this.listsRepository.createQueryBuilder('list')
      .leftJoinAndSelect('list.owner', 'owner')
      .where('list.ownerId = :userId', { userId });

    if (type) {
      query.andWhere('list.type = :type', { type });
    }

    return query.getMany();
  }

  async getCollaborativeLists(userId: string): Promise<List[]> {
    const collaborations = await this.collaboratorsRepository.find({
      where: { userId },
      relations: ['list', 'list.owner']
    });

    return collaborations.map(c => c.list);
  }

  async getTrendingLists(timeframe: 'day' | 'week' | 'month' = 'week', page = 1, limit = 10): Promise<[List[], number]> {
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
  }

  // Helper methods
  private async findOneWithPermissions(id: string, userId: string): Promise<List> {
    const list = await this.listsRepository.findOne({
      where: { id },
      relations: ['owner']
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    if (list.ownerId !== userId) {
      const hasAccess = await this.userHasAccess(id, userId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this list');
      }
    }

    return list;
  }

  private async userHasAccess(listId: string, userId: string): Promise<boolean> {
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

    // Check if user is owner
    if (list.ownerId === userId) {
      return true;
    }

    // Check if user is collaborator
    const collaborator = await this.collaboratorsRepository.findOne({
      where: { listId, userId }
    });

    if (collaborator) {
      return true;
    }

    // TODO: Add following check when user following system is implemented
    if (list.privacy === ListPrivacy.FOLLOWING) {
      // Implement following check here
      return false;
    }

    return false;
  }

  private async getNextItemOrder(listId: string): Promise<number> {
    const result = await this.listItemsRepository.createQueryBuilder('item')
      .where('item.listId = :listId', { listId })
      .select('MAX(item.order)', 'maxOrder')
      .getRawOne();

    return (result?.maxOrder ?? -1) + 1;
  }

  async getItemCount(listId: string): Promise<number> {
    return this.listItemsRepository.count({
      where: { listId }
    });
  }

  async isListFavoritedByUser(listId: string, userId: string): Promise<boolean> {
    const favorite = await this.favoritesRepository.findOne({
      where: { listId, userId }
    });
    return !!favorite;
  }

  async isUserCollaborator(listId: string, userId: string): Promise<boolean> {
    const collaborator = await this.collaboratorsRepository.findOne({
      where: { listId, userId }
    });
    return !!collaborator;
  }

  async getCollaboratorPermissions(listId: string, userId: string): Promise<CollaboratorPermission[] | null> {
    const collaborator = await this.collaboratorsRepository.findOne({
      where: { listId, userId }
    });
    return collaborator?.permissions || null;
  }
}
