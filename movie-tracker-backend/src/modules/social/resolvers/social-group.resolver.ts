// src/modules/social/resolvers/social-group.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SocialGroup } from '../entities/social-group.entity';
import { SocialGroupMember } from '../entities/social-group-member.entity';
import { SocialGroupService } from '../services/social-group.service';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { CreateSocialGroupInput } from '../dto/create-social-group.input';
import { UpdateSocialGroupInput } from '../dto/update-social-group.input';
import { SocialGroupResponse } from '../dto/social-group.dto';
import { SocialGroupMemberResponse } from '../dto/social-group-member.dto';
import { GroupMemberRole } from '../entities/social-group-member.entity';

@Resolver(() => SocialGroup)
@UseGuards(AuthGuard)
export class SocialGroupResolver {
  constructor(private readonly socialGroupService: SocialGroupService) {}

  @Mutation(() => SocialGroup)
  async createSocialGroup(
    @CurrentUser() user: User,
    @Args('input') input: CreateSocialGroupInput,
  ): Promise<SocialGroup> {
    return this.socialGroupService.createGroup({
      ...input,
      creatorId: user.id,
    });
  }

  @Mutation(() => SocialGroup)
  async updateSocialGroup(
    @CurrentUser() user: User,
    @Args('groupId') groupId: string,
    @Args('input') input: UpdateSocialGroupInput,
  ): Promise<SocialGroup> {
    return this.socialGroupService.updateGroup(groupId, input, user.id);
  }

  @Mutation(() => Boolean)
  async deleteSocialGroup(
    @CurrentUser() user: User,
    @Args('groupId') groupId: string,
  ): Promise<boolean> {
    return this.socialGroupService.deleteGroup(groupId, user.id);
  }

  @Mutation(() => SocialGroupMember)
  async addGroupMember(
    @CurrentUser() user: User,
    @Args('groupId') groupId: string,
    @Args('userId') userId: string,
    @Args('role', { defaultValue: GroupMemberRole.MEMBER }) role: GroupMemberRole,
  ): Promise<SocialGroupMember> {
    return this.socialGroupService.addGroupMember(groupId, userId, role, user.id);
  }

  @Mutation(() => Boolean)
  async removeGroupMember(
    @CurrentUser() user: User,
    @Args('groupId') groupId: string,
    @Args('userId') userId: string,
  ): Promise<boolean> {
    return this.socialGroupService.removeGroupMember(groupId, userId, user.id);
  }

  @Mutation(() => SocialGroupMember)
  async updateGroupMemberRole(
    @CurrentUser() user: User,
    @Args('groupId') groupId: string,
    @Args('userId') userId: string,
    @Args('role') role: GroupMemberRole,
  ): Promise<SocialGroupMember> {
    return this.socialGroupService.updateGroupMemberRole(groupId, userId, role, user.id);
  }

  @Mutation(() => SocialGroupMember)
  async joinGroup(
    @CurrentUser() user: User,
    @Args('groupId') groupId: string,
  ): Promise<SocialGroupMember> {
    return this.socialGroupService.joinGroup(groupId, user.id);
  }

  @Mutation(() => Boolean)
  async leaveGroup(
    @CurrentUser() user: User,
    @Args('groupId') groupId: string,
  ): Promise<boolean> {
    return this.socialGroupService.leaveGroup(groupId, user.id);
  }

  @Query(() => SocialGroupResponse)
  async socialGroups(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('filter', { nullable: true }) filter?: string,
  ): Promise<SocialGroupResponse> {
    const [items, total] = await this.socialGroupService.findGroups(page, limit, filter);
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  @Query(() => SocialGroupResponse)
  async userGroups(
    @Args('userId') userId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<SocialGroupResponse> {
    const [items, total] = await this.socialGroupService.getUserGroups(userId, page, limit);
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  @Query(() => SocialGroup, { nullable: true })
  async socialGroup(
    @Args('groupId') groupId: string,
  ): Promise<SocialGroup | null> {
    return this.socialGroupService.findGroupById(groupId);
  }

  @Query(() => SocialGroupMemberResponse)
  async groupMembers(
    @Args('groupId') groupId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<SocialGroupMemberResponse> {
    const [items, total] = await this.socialGroupService.getGroupMembers(groupId, page, limit);
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  @Query(() => SocialGroupMember, { nullable: true })
  async groupMemberStatus(
    @CurrentUser() user: User,
    @Args('groupId') groupId: string,
  ): Promise<SocialGroupMember | null> {
    return this.socialGroupService.getMemberStatus(groupId, user.id);
  }

  @Query(() => Int)
  async groupMembersCount(
    @Args('groupId') groupId: string,
  ): Promise<number> {
    return this.socialGroupService.getGroupMembersCount(groupId);
  }
}
