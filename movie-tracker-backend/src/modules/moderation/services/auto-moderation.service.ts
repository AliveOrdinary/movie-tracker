// src/modules/moderation/services/auto-moderation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AutoModerationRule, RuleType, RuleAction } from '../entities/auto-moderation-rule.entity';
import { ModerationQueue, ContentType, ModerationPriority } from '../entities/moderation-queue.entity';
import { UserReputation, ReputationLevel } from '../entities/user-reputation.entity';
import { Review } from '../../reviews/entities/review.entity';
import { User } from '../../users/entities/user.entity';
import { List } from '../../lists/entities/list.entity';
import { CreateAutoModerationRuleInput, UpdateAutoModerationRuleInput } from '../dto/auto-moderation-rule.dto';
import { ModerationQueueService } from './moderation-queue.service';
import { UserReputationService } from './user-reputation.service';
import { CacheService } from '../../../common/services/cache.service';
import { CacheKeyFactory } from '../../../common/factories/cache-key.factory';
import { CacheTTL } from '../../../common/constants/cache-ttl.constants';

@Injectable()
export class AutoModerationService {
  private readonly logger = new Logger(AutoModerationService.name);

  constructor(
    @InjectRepository(AutoModerationRule)
    private ruleRepository: Repository<AutoModerationRule>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(List)
    private listRepository: Repository<List>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private moderationQueueService: ModerationQueueService,
    private userReputationService: UserReputationService,
    private eventEmitter: EventEmitter2,
    private readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
  ) {}
  
  /**
   * Invalidate rule-related caches
   */
  private async invalidateRuleCaches(id?: string): Promise<void> {
    try {
      // Clear specific rule cache if ID provided
      if (id) {
        await this.cacheService.invalidate(this.cacheKeyFactory.moderation.rule(id));
      }
      
      // Clear all rules pattern
      await this.cacheService.invalidatePattern('moderation:rules:*');
      
      this.logger.debug(`Invalidated rule caches ${id ? `for rule ${id}` : 'for all rules'}`);
    } catch (error) {
      this.logger.error(`Error invalidating rule caches: ${error.message}`);
    }
  }

  async createRule(input: CreateAutoModerationRuleInput, user: User): Promise<AutoModerationRule> {
    const rule = this.ruleRepository.create({
      ...input,
      createdBy: user,
      createdById: user.id,
      matchCount: 0,
    });

    const saved = await this.ruleRepository.save(rule);
    
    // Invalidate rules cache
    await this.invalidateRuleCaches();
    
    return saved;
  }

  async updateRule(input: UpdateAutoModerationRuleInput): Promise<AutoModerationRule> {
    const rule = await this.findRule(input.id);
    
    // Update fields
    if (typeof input.name !== 'undefined') rule.name = input.name;
    if (typeof input.description !== 'undefined') rule.description = input.description;
    if (typeof input.action !== 'undefined') rule.action = input.action;
    if (typeof input.pattern !== 'undefined') rule.pattern = input.pattern;
    if (typeof input.threshold !== 'undefined') rule.threshold = input.threshold;
    if (typeof input.isActive !== 'undefined') rule.isActive = input.isActive;

    const saved = await this.ruleRepository.save(rule);
    
    // Invalidate rules cache
    await this.invalidateRuleCaches(rule.id);
    
    return saved;
  }

  async findRule(id: string): Promise<AutoModerationRule> {
    const cacheKey = this.cacheKeyFactory.moderation.rule(id);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const rule = await this.ruleRepository.findOne({
          where: { id },
          relations: ['createdBy'],
        });

        if (!rule) {
          throw new Error(`Auto-moderation rule with ID ${id} not found`);
        }

        return rule;
      },
      CacheTTL.MEDIUM
    );
  }

  async findRules(
    contentType?: ContentType,
    ruleType?: RuleType,
    isActive?: boolean,
    page = 1,
    limit = 10,
  ): Promise<[AutoModerationRule[], number]> {
    const cacheKey = this.cacheKeyFactory.moderation.rules(
      contentType?.toString(), 
      ruleType?.toString(), 
      isActive
    );
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const where: FindOptionsWhere<AutoModerationRule> = {};
        
        if (contentType) where.contentType = contentType;
        if (ruleType) where.ruleType = ruleType;
        if (typeof isActive === 'boolean') where.isActive = isActive;

        return this.ruleRepository.findAndCount({
          where,
          relations: ['createdBy'],
          order: { createdAt: 'DESC' },
          skip: (page - 1) * limit,
          take: limit,
        });
      },
      CacheTTL.MEDIUM
    );
  }

  async deleteRule(id: string): Promise<boolean> {
    // First check rule exists to avoid unnecessary cache invalidation
    const rule = await this.findRule(id);
    
    const result = await this.ruleRepository.delete(id);
    
    if (result.affected && result.affected > 0) {
      // Invalidate rule cache
      await this.invalidateRuleCaches(id);
      return true;
    }
    
    return false;
  }

  // Core auto-moderation functionality
  async moderateReview(review: Review, isRecursiveCall = false): Promise<boolean> {
    try {
      // Check if this is an auto-moderation event - prevent infinite loops
      if (isRecursiveCall || review.isAutoModerated) {
        this.logger.debug(`Skipping auto-moderation for already processed review ${review.id}`);
        return false;
      }

      // Mark this review as auto-moderated to prevent future loops
      review.isAutoModerated = true;
      await this.reviewRepository.save(review);
      // Get active rules for reviews
      const rules = await this.getActiveRulesForContent(ContentType.REVIEW);

      // If no rules, exit early
      if (rules.length === 0) {
        return false;
      }

      // Get user reputation
      const userReputation = await this.userReputationService.findOrCreateForUser(review.user.id);

      // Evaluate rules
      let flagged = false;
      const matchedRules: AutoModerationRule[] = [];

      for (const rule of rules) {
        const match = await this.evaluateRule(rule, review, userReputation);
        if (match) {
          matchedRules.push(rule);
          
          // Increment rule match count
          rule.matchCount++;
          await this.ruleRepository.save(rule);
          
          // Take action based on strictest rule
          if (rule.action === RuleAction.REJECT || rule.action === RuleAction.DELETE) {
            flagged = true;
          }
        }
      }

      // If matched rules, add to moderation queue
      if (matchedRules.length > 0) {
        const highestPriorityRule = this.getHighestPriorityRule(matchedRules);
        
        // Create with preventRecursion flag to avoid infinite loops
        try {
          await this.moderationQueueService.create({
            contentType: ContentType.REVIEW,
            contentId: review.id,
            priority: this.determinePriority(userReputation, matchedRules.length),
            moderationNotes: `Auto-flagged by rules: ${matchedRules.map(r => r.name).join(', ')}`,
            isAutoFlagged: true,
            // Remove unsupported field
            // preventRecursiveModeration: true,
            metadata: {
              matchedRules: matchedRules.map(r => ({ id: r.id, name: r.name })),
              userReputation: userReputation.reputationScore,
            },
          });
        } catch (queueError) {
          // If there's an error creating the queue item (e.g., it already exists),
          // log it but don't throw as we've already done the main processing
          this.logger.warn(`Error creating moderation queue item for review ${review.id}: ${queueError.message}`);
        }

        // Emit event for auto-moderation
        this.eventEmitter.emit('moderation.auto.flagged', {
          contentType: ContentType.REVIEW,
          content: review,
          rules: matchedRules,
        });

        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error auto-moderating review ${review.id}:`, error);
      return false;
    }
  }

  async moderateList(list: List, isRecursiveCall = false): Promise<boolean> {
    try {
      // Check if this is an auto-moderation event - prevent infinite loops
      if (isRecursiveCall || list.isAutoModerated) {
        this.logger.debug(`Skipping auto-moderation for already processed list ${list.id}`);
        return false;
      }

      // Mark this list as auto-moderated to prevent future loops
      list.isAutoModerated = true;
      await this.listRepository.save(list);

      // Get active rules for lists
      const rules = await this.getActiveRulesForContent(ContentType.LIST);

      // If no rules, exit early
      if (rules.length === 0) {
        return false;
      }

      // Get user reputation
      const userReputation = await this.userReputationService.findOrCreateForUser(list.owner_id);

      // Evaluate rules
      const matchedRules: AutoModerationRule[] = [];

      for (const rule of rules) {
        const match = await this.evaluateRule(rule, list, userReputation);
        if (match) {
          matchedRules.push(rule);
          
          // Increment rule match count
          rule.matchCount++;
          await this.ruleRepository.save(rule);
        }
      }

      // If matched rules, add to moderation queue
      if (matchedRules.length > 0) {
        const highestPriorityRule = this.getHighestPriorityRule(matchedRules);
        
        // Create with preventRecursion flag to avoid infinite loops
        try {
          await this.moderationQueueService.create({
            contentType: ContentType.LIST,
            contentId: list.id,
            priority: this.determinePriority(userReputation, matchedRules.length),
            moderationNotes: `Auto-flagged by rules: ${matchedRules.map(r => r.name).join(', ')}`,
            isAutoFlagged: true,
            // Remove unsupported field
            // preventRecursiveModeration: true,
            metadata: {
              matchedRules: matchedRules.map(r => ({ id: r.id, name: r.name })),
              userReputation: userReputation.reputationScore,
            },
          });
        } catch (queueError) {
          // If there's an error creating the queue item (e.g., it already exists),
          // log it but don't throw as we've already done the main processing
          this.logger.warn(`Error creating moderation queue item for list ${list.id}: ${queueError.message}`);
        }

        // Emit event for auto-moderation
        this.eventEmitter.emit('moderation.auto.flagged', {
          contentType: ContentType.LIST,
          content: list,
          rules: matchedRules,
        });

        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error auto-moderating list ${list.id}:`, error);
      return false;
    }
  }

  async moderateUserProfile(user: User): Promise<boolean> {
    // Implementation for user profile moderation
    // ...
    return false;
  }

  /**
   * Get active rules for a specific content type with caching
   */
  private async getActiveRulesForContent(contentType: ContentType): Promise<AutoModerationRule[]> {
    const cacheKey = this.cacheKeyFactory.generate('moderation', 'activeRules', [contentType]);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        return this.ruleRepository.find({
          where: {
            contentType,
            isActive: true,
          },
        });
      },
      CacheTTL.MEDIUM
    );
  }

  // Helper methods for rule evaluation
  private async evaluateRule(
    rule: AutoModerationRule,
    content: any,
    userReputation: UserReputation,
  ): Promise<boolean> {
    try {
      switch (rule.ruleType) {
        case RuleType.KEYWORD:
          return this.evaluateKeywordRule(rule, content);
          
        case RuleType.REGEX:
          return this.evaluateRegexRule(rule, content);
          
        case RuleType.USER_REPUTATION:
          return this.evaluateReputationRule(rule, userReputation);
          
        case RuleType.CONTENT_SIMILARITY:
          return this.evaluateSimilarityRule(rule, content);
          
        case RuleType.SPAM_DETECTION:
          return this.evaluateSpamRule(rule, content);
          
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Error evaluating rule ${rule.id} of type ${rule.ruleType}:`, error);
      return false;
    }
  }

  private evaluateKeywordRule(rule: AutoModerationRule, content: any): boolean {
    if (content.contentType !== 'REVIEW') {
      return false;
    }
    
    const keywords = rule.pattern.keywords || [];
    const text = content.content?.toLowerCase() || '';
    
    // Count keyword matches
    let matchCount = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${this.escapeRegExp(keyword)}\\b`, 'i');
      if (regex.test(text)) {
        matchCount++;
      }
    }
    
    // Check if match count meets threshold percentage
    const thresholdCount = Math.ceil((keywords.length * rule.threshold) / 100);
    return matchCount >= thresholdCount;
  }

  private evaluateRegexRule(rule: AutoModerationRule, content: any): boolean {
    if (content.contentType !== 'REVIEW') {
      return false;
    }
    
    const text = content.content || '';
    const regexPattern = rule.pattern.regex || '';
    
    try {
      const regex = new RegExp(regexPattern, 'i');
      return regex.test(text);
    } catch (e) {
      this.logger.error(`Invalid regex pattern in rule ${rule.id}: ${regexPattern}`);
      return false;
    }
  }

  private evaluateReputationRule(rule: AutoModerationRule, userReputation: UserReputation): boolean {
    const threshold = rule.pattern.threshold || 0;
    return userReputation.reputationScore < threshold;
  }

  private evaluateSimilarityRule(rule: AutoModerationRule, content: any): boolean {
    // This would require a more complex implementation with text similarity algorithms
    // For now, return false as a placeholder
    return false;
  }

  private evaluateSpamRule(rule: AutoModerationRule, content: any): boolean {
    // Implementation for spam detection - could use a variety of signal detection
    // e.g., excessive links, repeated phrases, unusual post frequency
    // For now, return false as a placeholder
    return false;
  }

  private getHighestPriorityRule(rules: AutoModerationRule[]): AutoModerationRule {
    // Sort by action severity (DELETE > REJECT > FLAG > NOTIFY)
    return rules.sort((a, b) => {
      const actionPriority = {
        [RuleAction.DELETE]: 4,
        [RuleAction.REJECT]: 3,
        [RuleAction.FLAG]: 2,
        [RuleAction.NOTIFY_MODERATOR]: 1,
      };
      
      return actionPriority[b.action] - actionPriority[a.action];
    })[0];
  }

  private determinePriority(userReputation: UserReputation, ruleMatchCount: number): ModerationPriority {
    // Determine priority based on user reputation and number of matched rules
    if (userReputation.reputationLevel === ReputationLevel.RESTRICTED || ruleMatchCount > 3) {
      return ModerationPriority.URGENT;
    }
    
    if (userReputation.reputationLevel === ReputationLevel.LOW || ruleMatchCount > 2) {
      return ModerationPriority.HIGH;
    }
    
    if (userReputation.reputationLevel === ReputationLevel.NEW) {
      return ModerationPriority.MEDIUM;
    }
    
    return ModerationPriority.LOW;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}