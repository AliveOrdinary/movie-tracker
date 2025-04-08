// src/modules/social/services/activity-interaction.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityComment } from '../entities/activity-comment.entity';
import { ActivityReaction } from '../entities/activity-reaction.entity';
import { Activity } from '../entities/activity.entity';
import { User } from '../../users/entities/user.entity';
import { CacheService } from '../../../common/services/cache.service';
import { ReactionType } from '../../../common/enums';

@Injectable()
export class ActivityInteractionService {
  constructor(
    @InjectRepository(ActivityComment)
    private commentRepository: Repository<ActivityComment>,
    @InjectRepository(ActivityReaction)
    private reactionRepository: Repository<ActivityReaction>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Comments
  async addComment(data: { activityId: string; userId: string; content: string; parentCommentId?: string }): Promise<ActivityComment> {
    const { activityId, userId, content, parentCommentId } = data;

    // Validate activity exists
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // If parent comment ID provided, validate it exists
    if (parentCommentId) {
      const parentComment = await this.commentRepository.findOne({ where: { id: parentCommentId } });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    // Create the comment
    const newComment = new ActivityComment();
    newComment.activity = { id: activityId } as any;
    newComment.user = { id: userId } as any;
    newComment.content = content;
    
    if (parentCommentId) {
      newComment.parentComment = { id: parentCommentId } as any;
    }
    // Note: We don't set parentComment to null explicitly - it will be undefined

    const savedComment = await this.commentRepository.save(newComment);

    // Emit event for notification processing
    this.eventEmitter.emit('activity.comment.created', {
      activityId,
      commentId: savedComment.id,
      userId,
      activityOwnerId: activity.user_id
    });

    // Invalidate cache
    await this.invalidateCommentCache(activityId);

    return savedComment;
  }

  async updateComment(commentId: string, content: string, userId: string): Promise<ActivityComment> {
    const comment = await this.commentRepository.findOne({ 
      where: { id: commentId },
      relations: ['activity']
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user owns the comment
    if (comment.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to update this comment');
    }

    comment.content = content;
    comment.isEdited = true;
    
    const updatedComment = await this.commentRepository.save(comment);

    // Invalidate cache
    await this.invalidateCommentCache(comment.activity_id);

    return updatedComment;
  }

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const comment = await this.commentRepository.findOne({ 
      where: { id: commentId },
      relations: ['activity'] 
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user owns the comment
    if (comment.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    const activityId = comment.activity_id;
    await this.commentRepository.remove(comment);

    // Invalidate cache
    await this.invalidateCommentCache(activityId);

    return true;
  }

  async getActivityComments(activityId: string, page = 1, limit = 20): Promise<[ActivityComment[], number]> {
    const cacheKey = `activity:${activityId}:comments:${page}:${limit}`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      () => {
        return this.commentRepository.findAndCount({
          where: {
            activity: { id: activityId },
            'parent_comment_id': 'IS NULL' // Use raw SQL condition
          } as any, // Use type assertion to bypass type checking
          relations: ['user', 'childComments', 'childComments.user'],
          order: { createdAt: 'ASC' },
          skip: (page - 1) * limit,
          take: limit
        });
      },
      3600 // 1 hour cache
    );
  }

  async getActivityCommentsCount(activityId: string): Promise<number> {
    const cacheKey = `activity:${activityId}:comments:count`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      () => this.commentRepository.count({ where: { activity: { id: activityId } } }),
      3600 // 1 hour cache
    );
  }

  // Reactions
  async addReaction(data: { activityId: string; userId: string; type: ReactionType }): Promise<ActivityReaction> {
    const { activityId, userId, type } = data;

    // Validate activity exists
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Check if user already reacted
    const existingReaction = await this.reactionRepository.findOne({
      where: { activity: { id: activityId }, user: { id: userId } }
    });

    if (existingReaction) {
      // If reaction type is the same, throw error
      if (existingReaction.type === type) {
        throw new ConflictException('You have already reacted to this activity');
      }
      
      // Otherwise, update the existing reaction
      existingReaction.type = type;
      const updatedReaction = await this.reactionRepository.save(existingReaction);
      
      // Invalidate cache
      await this.invalidateReactionCache(activityId);
      
      return updatedReaction;
    }

    // Create new reaction
    const newReaction = new ActivityReaction();
    newReaction.activity = { id: activityId } as any;
    newReaction.user = { id: userId } as any;
    newReaction.type = type;

    const savedReaction = await this.reactionRepository.save(newReaction);

    // Emit event for notification processing
    this.eventEmitter.emit('activity.reaction.created', {
      activityId,
      reactionId: savedReaction.id,
      userId,
      activityOwnerId: activity.user_id,
      reactionType: type
    });

    // Invalidate cache
    await this.invalidateReactionCache(activityId);

    return savedReaction;
  }

  async removeReaction(activityId: string, userId: string): Promise<boolean> {
    const reaction = await this.reactionRepository.findOne({
      where: { activity: { id: activityId }, user: { id: userId } }
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.reactionRepository.remove(reaction);

    // Invalidate cache
    await this.invalidateReactionCache(activityId);

    return true;
  }

  async getActivityReactions(activityId: string, page = 1, limit = 20): Promise<[ActivityReaction[], number]> {
    const cacheKey = `activity:${activityId}:reactions:${page}:${limit}`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      () => this.reactionRepository.findAndCount({
        where: { activity: { id: activityId } },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit
      }),
      3600 // 1 hour cache
    );
  }

  async getActivityReactionsCount(activityId: string): Promise<number> {
    const cacheKey = `activity:${activityId}:reactions:count`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      () => this.reactionRepository.count({ where: { activity: { id: activityId } } }),
      3600 // 1 hour cache
    );
  }

  async getReactionSummary(activityId: string): Promise<Record<ReactionType, number>> {
    const cacheKey = `activity:${activityId}:reactions:summary`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const reactions = await this.reactionRepository
          .createQueryBuilder('reaction')
          .select('reaction.type')
          .addSelect('COUNT(reaction.id)', 'count')
          .where('reaction.activity_id = :activityId', { activityId })
          .groupBy('reaction.type')
          .getRawMany();
        
        const result = {} as Record<ReactionType, number>;
        
        // Initialize all reaction types with 0
        Object.values(ReactionType).forEach(type => {
          result[type] = 0;
        });
        
        // Update counts from query
        reactions.forEach(row => {
          result[row.type] = parseInt(row.count, 10);
        });
        
        return result;
      },
      3600 // 1 hour cache
    );
  }

  // Helper methods
  private async invalidateCommentCache(activityId: string): Promise<void> {
    await this.cacheService.invalidatePattern(`activity:${activityId}:comments:*`);
  }

  private async invalidateReactionCache(activityId: string): Promise<void> {
    await this.cacheService.invalidatePattern(`activity:${activityId}:reactions:*`);
  }
}
