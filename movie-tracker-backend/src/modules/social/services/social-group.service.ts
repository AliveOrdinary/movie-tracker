// src/modules/social/services/social-group.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SocialGroup } from '../entities/social-group.entity';
import { SocialGroupMember } from '../entities/social-group-member.entity';
import { User } from '../../users/entities/user.entity';
import { CacheService } from '../../../common/services/cache.service';
import { GroupMemberRole } from '../entities/social-group-member.entity';
import { ActivityType } from '../entities/activity.entity';
import { GroupPrivacy } from '../entities/social-group.entity';
import { CreateSocialGroupInput } from '../dto/create-social-group.input';
import { UpdateSocialGroupInput } from '../dto/update-social-group.input';
import { SocialService } from '../social.service';

@Injectable()
export class SocialGroupService {
  constructor(
    @InjectRepository(SocialGroup)
    private socialGroupRepository: Repository<SocialGroup>,
    @InjectRepository(SocialGroupMember)
    private socialGroupMemberRepository: Repository<SocialGroupMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly socialService: SocialService,
  ) {}

  async createGroup(data: CreateSocialGroupInput & { creatorId: string }): Promise<SocialGroup> {
    const { name, description, privacy, imageUrl, tags, creatorId } = data;

    // Validate user exists
    const creator = await this.userRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException('User not found');
    }

    // Check for duplicate group name
    const existingGroup = await this.socialGroupRepository.findOne({
      where: { name: ILike(name) }
    });

    if (existingGroup) {
      throw new ConflictException('A group with this name already exists');
    }

    // Create the group - use plain object with type assertion
    const newGroup = new SocialGroup();
    newGroup.name = name;
    newGroup.description = description;
    
    // Convert enum from input to the entity enum
    // This is needed because they might be different types but same values
    // Use string comparisons with typeof to avoid type issues
    const privacyStr = String(privacy);
    if (privacyStr === 'PUBLIC') {
      newGroup.privacy = GroupPrivacy.PUBLIC;
    } else if (privacyStr === 'PRIVATE') {
      newGroup.privacy = GroupPrivacy.PRIVATE;
    } else if (privacyStr === 'SECRET') {
      newGroup.privacy = GroupPrivacy.SECRET;
    } else {
      // Default to PUBLIC if none matches
      newGroup.privacy = GroupPrivacy.PUBLIC;
    }
    
    newGroup.avatarUrl = imageUrl;
    newGroup.creator = { id: creatorId } as any;

    const savedGroup = await this.socialGroupRepository.save(newGroup);

    // Add creator as admin member
    await this.addGroupMember(
      savedGroup.id, 
      creatorId, 
      GroupMemberRole.ADMIN, 
      creatorId
    );

    // Create activity
    await this.socialService.createActivity({
      userId: creatorId,
      type: ActivityType.CREATED_GROUP,
      metadata: { groupId: savedGroup.id, groupName: savedGroup.name }
    });

    // Emit event
    this.eventEmitter.emit('social-group.created', {
      groupId: savedGroup.id,
      creatorId
    });

    // Invalidate cache
    await this.invalidateGroupCache(savedGroup.id);

    return savedGroup;
  }

  async updateGroup(groupId: string, data: UpdateSocialGroupInput, userId: string): Promise<SocialGroup> {
    const group = await this.socialGroupRepository.findOne({
      where: { id: groupId }
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is admin
    const isAdmin = await this.isGroupAdmin(groupId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('You do not have permission to update this group');
    }

    // Update group fields
    Object.assign(group, data);
    
    const updatedGroup = await this.socialGroupRepository.save(group);

    // Create activity
    await this.socialService.createActivity({
      userId,
      type: ActivityType.UPDATED_LIST,
      metadata: { groupId: group.id, groupName: group.name }
    });

    // Emit event
    this.eventEmitter.emit('social-group.updated', {
      groupId,
      updaterId: userId
    });

    // Invalidate cache
    await this.invalidateGroupCache(groupId);

    return updatedGroup;
  }

  async deleteGroup(groupId: string, userId: string): Promise<boolean> {
    const group = await this.socialGroupRepository.findOne({
      where: { id: groupId }
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is creator/owner
    if (group.creator_id !== userId) {
      throw new ForbiddenException('Only the group creator can delete this group');
    }

    const groupName = group.name;
    
    await this.socialGroupRepository.remove(group);

    // Emit event
    this.eventEmitter.emit('social-group.deleted', {
      groupId,
      groupName,
      deleterId: userId
    });

    // Invalidate cache
    await this.invalidateGroupCache(groupId);

    return true;
  }

  async addGroupMember(groupId: string, userId: string, role: GroupMemberRole, addedById: string): Promise<SocialGroupMember> {
    const [group, user] = await Promise.all([
      this.socialGroupRepository.findOne({ where: { id: groupId } }),
      this.userRepository.findOne({ where: { id: userId } })
    ]);

    if (!group || !user) {
      throw new NotFoundException('Group or user not found');
    }

    // Check if user is already a member
    const existingMember = await this.socialGroupMemberRepository.findOne({
      where: { group_id: groupId, user_id: userId }
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this group');
    }

    // If not the creator adding themselves, check if adder has permission
    if (!(group.creator_id === addedById && userId === addedById)) {
      const isAdmin = await this.isGroupAdmin(groupId, addedById);
      if (!isAdmin) {
        throw new ForbiddenException('You do not have permission to add members to this group');
      }
    }

    // Create membership
    const newMember = new SocialGroupMember();
    newMember.group = { id: groupId } as any;
    newMember.user = { id: userId } as any;
    newMember.role = role;
    
    // We'll set the added_by_id in the database directly since it doesn't exist as a property
    // on the entity but exists in the database schema
    const savedMember = await this.socialGroupMemberRepository.save(newMember);
    
    // Update the added_by_id directly using a query
    await this.socialGroupMemberRepository.createQueryBuilder()
      .update(SocialGroupMember)
      .set({ added_by_id: addedById } as any) // Using 'as any' to bypass TypeScript check
      .where("id = :id", { id: savedMember.id })
      .execute();

    // Create activity if user joined themselves
    if (userId === addedById) {
      await this.socialService.createActivity({
        userId,
        type: ActivityType.JOINED_GROUP,
        metadata: { groupId: group.id, groupName: group.name }
      });
    }

    // Emit event
    this.eventEmitter.emit('social-group.member-added', {
      groupId,
      userId,
      addedById,
      role
    });

    // Invalidate cache
    await this.invalidateGroupMemberCache(groupId, userId);

    return savedMember;
  }

  async removeGroupMember(groupId: string, userId: string, removedById: string): Promise<boolean> {
    const member = await this.socialGroupMemberRepository.findOne({
      where: { group_id: groupId, user_id: userId },
      relations: ['group']
    });

    if (!member) {
      throw new NotFoundException('Group member not found');
    }

    // Check if removed by self (leaving) or by admin
    if (userId !== removedById) {
      // Check if remover is admin
      const isAdmin = await this.isGroupAdmin(groupId, removedById);
      if (!isAdmin) {
        throw new ForbiddenException('You do not have permission to remove members from this group');
      }
      
      // Cannot remove the creator/owner
      if (member.group.creator_id === userId) {
        throw new ForbiddenException('Cannot remove the group creator');
      }
    }

    const groupName = member.group.name;
    
    await this.socialGroupMemberRepository.remove(member);

    // Emit event
    this.eventEmitter.emit('social-group.member-removed', {
      groupId,
      userId,
      removedById,
      groupName
    });

    // Invalidate cache
    await this.invalidateGroupMemberCache(groupId, userId);

    return true;
  }

  async updateGroupMemberRole(groupId: string, userId: string, role: GroupMemberRole, updatedById: string): Promise<SocialGroupMember> {
    const member = await this.socialGroupMemberRepository.findOne({
      where: { group_id: groupId, user_id: userId },
      relations: ['group']
    });

    if (!member) {
      throw new NotFoundException('Group member not found');
    }

    // Check if updater is admin
    const isAdmin = await this.isGroupAdmin(groupId, updatedById);
    if (!isAdmin) {
      throw new ForbiddenException('You do not have permission to update member roles');
    }
    
    // Cannot change the role of the creator/owner
    if (member.group.creator_id === userId) {
      throw new ForbiddenException('Cannot change the role of the group creator');
    }

    member.role = role;
    const updatedMember = await this.socialGroupMemberRepository.save(member);

    // Emit event
    this.eventEmitter.emit('social-group.member-role-updated', {
      groupId,
      userId,
      updatedById,
      role
    });

    // Invalidate cache
    await this.invalidateGroupMemberCache(groupId, userId);

    return updatedMember;
  }

  async joinGroup(groupId: string, userId: string): Promise<SocialGroupMember> {
    const group = await this.socialGroupRepository.findOne({
      where: { id: groupId }
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if group is joinable (public groups only)
    // Since we might have different GroupPrivacy enums, compare by value directly
    const privacyStr = String(group.privacy);
    if (privacyStr !== 'PUBLIC') {
      throw new ForbiddenException('This group requires an invitation to join');
    }

    // Add as member
    return this.addGroupMember(
      groupId, 
      userId, 
      GroupMemberRole.MEMBER, 
      userId
    );
  }

  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    const [member, group] = await Promise.all([
      this.socialGroupMemberRepository.findOne({
        where: { group_id: groupId, user_id: userId }
      }),
      this.socialGroupRepository.findOne({
        where: { id: groupId }
      })
    ]);

    if (!member) {
      throw new NotFoundException('Group member not found');
    }

    // Cannot leave if you're the creator/owner
    if (group && group.creator_id === userId) {
      throw new ForbiddenException('Group creator cannot leave the group. Delete the group instead.');
    }

    return this.removeGroupMember(groupId, userId, userId);
  }

  async findGroups(page = 1, limit = 20, filter?: string): Promise<[SocialGroup[], number]> {
    const cacheKey = `social-groups:${page}:${limit}:${filter || 'all'}`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      () => {
        const queryBuilder = this.socialGroupRepository
          .createQueryBuilder('group')
          .leftJoinAndSelect('group.creator', 'creator')
          .where('group.privacy = :privacy', { privacy: GroupPrivacy.PUBLIC });
        
        if (filter) {
          queryBuilder.andWhere(
            '(group.name ILIKE :filter OR group.description ILIKE :filter)',
            { filter: `%${filter}%` }
          );
        }
        
        return queryBuilder
          .orderBy('group.createdAt', 'DESC')
          .skip((page - 1) * limit)
          .take(limit)
          .getManyAndCount();
      },
      3600 // 1 hour cache
    );
  }

  async getUserGroups(userId: string, page = 1, limit = 20): Promise<[SocialGroup[], number]> {
    const cacheKey = `user:${userId}:groups:${page}:${limit}`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        // Get group IDs where user is a member
        const membershipQuery = this.socialGroupMemberRepository
          .createQueryBuilder('member')
          .select('member.group_id')
          .where('member.user_id = :userId', { userId });
        
        const memberships = await membershipQuery.getMany();
        const groupIds = memberships.map(m => m.group_id);
        
        if (groupIds.length === 0) {
          return [[], 0];
        }
        
        return this.socialGroupRepository
          .createQueryBuilder('group')
          .leftJoinAndSelect('group.creator', 'creator')
          .where('group.id IN (:...groupIds)', { groupIds })
          .orderBy('group.createdAt', 'DESC')
          .skip((page - 1) * limit)
          .take(limit)
          .getManyAndCount();
      },
      3600 // 1 hour cache
    );
  }

  async findGroupById(groupId: string): Promise<SocialGroup | null> {
    const cacheKey = `social-group:${groupId}`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      () => this.socialGroupRepository.findOne({
        where: { id: groupId },
        relations: ['creator']
      }),
      3600 // 1 hour cache
    );
  }

  async getGroupMembers(groupId: string, page = 1, limit = 20): Promise<[SocialGroupMember[], number]> {
    const cacheKey = `social-group:${groupId}:members:${page}:${limit}`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      () => this.socialGroupMemberRepository.findAndCount({
        where: { group_id: groupId },
        relations: ['user'],
        order: { createdAt: 'ASC' },
        skip: (page - 1) * limit,
        take: limit
      }),
      3600 // 1 hour cache
    );
  }

  async getMemberStatus(groupId: string, userId: string): Promise<SocialGroupMember | null> {
    const cacheKey = `social-group:${groupId}:member:${userId}`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      () => this.socialGroupMemberRepository.findOne({
        where: { group_id: groupId, user_id: userId }
      }),
      3600 // 1 hour cache
    );
  }

  async getGroupMembersCount(groupId: string): Promise<number> {
    const cacheKey = `social-group:${groupId}:members:count`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      () => this.socialGroupMemberRepository.count({ where: { group_id: groupId } }),
      3600 // 1 hour cache
    );
  }

  // Helper methods
  async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
    const group = await this.socialGroupRepository.findOne({
      where: { id: groupId }
    });
    
    if (!group) {
      return false;
    }
    
    // Creator is always admin
    if (group.creator_id === userId) {
      return true;
    }
    
    const member = await this.socialGroupMemberRepository.findOne({
      where: { group_id: groupId, user_id: userId }
    });
    
    return !!member && member.role === GroupMemberRole.ADMIN;
  }

  private async invalidateGroupCache(groupId: string): Promise<void> {
    await Promise.all([
      this.cacheService.invalidatePattern(`social-groups:*`),
      this.cacheService.invalidate(`social-group:${groupId}`),
      this.cacheService.invalidatePattern(`social-group:${groupId}:*`),
      this.cacheService.invalidatePattern(`user:*:groups:*`)
    ]);
  }

  private async invalidateGroupMemberCache(groupId: string, userId: string): Promise<void> {
    await Promise.all([
      this.cacheService.invalidatePattern(`social-group:${groupId}:members:*`),
      this.cacheService.invalidate(`social-group:${groupId}:members:count`),
      this.cacheService.invalidate(`social-group:${groupId}:member:${userId}`),
      this.cacheService.invalidatePattern(`user:${userId}:groups:*`)
    ]);
  }
}
