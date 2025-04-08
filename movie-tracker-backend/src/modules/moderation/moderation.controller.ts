// src/modules/moderation/moderation.controller.ts
import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Body, 
    Param, 
    Query, 
    UseGuards,
    ValidationPipe,
    UsePipes,
    Logger,
    NotFoundException,
    BadRequestException
  } from '@nestjs/common';
  import { ModerationService } from './moderation.service';
  import { ModerationQueueService } from './services/moderation-queue.service';
  import { UserReputationService } from './services/user-reputation.service';
  import { AutoModerationService } from './services/auto-moderation.service';
  import { AuthGuard } from '../../auth/guards/auth.guard';
  import { RolesGuard } from '../../auth/guards/roles.guard';
  import { Roles } from '../../auth/decorators/roles.decorator';
  import { UserRole } from '../../common/enums';
  import { CurrentUser } from '../../auth/decorators/current-user.decorator';
  import { User } from '../users/entities/user.entity';
  import { ContentType } from './entities/moderation-queue.entity';
  
  // Import the DTOs
  import { 
    CreateReportDto, 
    ResolveReportDto, 
    ModerateContentDto, 
    PaginationQueryDto,
    ModerationStatsResponseDto,
    QueueStatisticsResponseDto,
    AssignQueueItemDto
  } from './dto/api-dtos';
  
  @Controller('moderation')
  export class ModerationController {
    private readonly logger = new Logger(ModerationController.name);
  
    constructor(
      private readonly moderationService: ModerationService,
      private readonly moderationQueueService: ModerationQueueService,
      private readonly userReputationService: UserReputationService,
      private readonly autoModerationService: AutoModerationService
    ) {}
  
    // ==================== REPORT MANAGEMENT ====================
  
    @Post('reports')
    @UseGuards(AuthGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async createReport(
      @Body() createReportDto: CreateReportDto,
      @CurrentUser() reporter: User
    ) {
      try {
        switch (createReportDto.contentType) {
          case ContentType.REVIEW:
            return await this.moderationService.reportReview(
              createReportDto.contentId,
              createReportDto.reason,
              reporter
            );
          case ContentType.LIST:
            return await this.moderationService.reportList(
              createReportDto.contentId,
              createReportDto.reason,
              reporter
            );
          case ContentType.USER_PROFILE:
            return await this.moderationService.reportUser(
              createReportDto.contentId,
              createReportDto.reason,
              reporter
            );
          default:
            throw new BadRequestException(`Invalid content type: ${createReportDto.contentType}`);
        }
      } catch (error) {
        this.logger.error(`Error creating report: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Get('reports')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async getReportedContent(@Query() query: PaginationQueryDto) {
      try {
        return await this.moderationService.getReportedContent(
          query.page,
          query.limit
        );
      } catch (error) {
        this.logger.error(`Error getting reported content: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Get('reports/:reportId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    async getReportById(@Param('reportId') reportId: string) {
      try {
        const report = await this.moderationService['reportRepository'].findOne({
          where: { id: reportId },
          relations: ['review', 'list', 'reporter', 'moderator'],
        });
  
        if (!report) {
          throw new NotFoundException(`Report with ID ${reportId} not found`);
        }
  
        return report;
      } catch (error) {
        this.logger.error(`Error getting report: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Put('reports/:reportId/resolve')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async resolveReport(
      @Param('reportId') reportId: string,
      @Body() resolveReportDto: ResolveReportDto,
      @CurrentUser() moderator: User
    ) {
      try {
        return await this.moderationService.resolveReport(
          reportId,
          resolveReportDto.resolution,
          moderator,
          resolveReportDto.notes
        );
      } catch (error) {
        this.logger.error(`Error resolving report: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    // ==================== REVIEW MODERATION ====================
  
    @Put('reviews/:reviewId/approve')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    async approveReview(
      @Param('reviewId') reviewId: string,
      @CurrentUser() moderator: User
    ) {
      try {
        return await this.moderationService.approveReview(reviewId, moderator);
      } catch (error) {
        this.logger.error(`Error approving review: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Put('reviews/:reviewId/reject')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async rejectReview(
      @Param('reviewId') reviewId: string,
      @Body() moderateContentDto: ModerateContentDto,
      @CurrentUser() moderator: User
    ) {
      if (!moderateContentDto.reason) {
        throw new BadRequestException('Reason is required for rejection');
      }
  
      try {
        return await this.moderationService.rejectReview(
          reviewId,
          moderateContentDto.reason,
          moderator
        );
      } catch (error) {
        this.logger.error(`Error rejecting review: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Put('reviews/:reviewId/flag')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async flagReview(
      @Param('reviewId') reviewId: string,
      @Body() moderateContentDto: ModerateContentDto,
      @CurrentUser() moderator: User
    ) {
      if (!moderateContentDto.reason) {
        throw new BadRequestException('Reason is required for flagging');
      }
  
      try {
        return await this.moderationService.flagReview(
          reviewId,
          moderateContentDto.reason,
          moderator
        );
      } catch (error) {
        this.logger.error(`Error flagging review: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Get('reviews/flagged')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFlaggedReviews(@Query() query: PaginationQueryDto) {
      try {
        return await this.moderationService.getFlaggedReviews(
          query.page,
          query.limit
        );
      } catch (error) {
        this.logger.error(`Error getting flagged reviews: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    // ==================== LIST MODERATION ====================
  
    @Put('lists/:listId/approve')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    async approveList(
      @Param('listId') listId: string,
      @CurrentUser() moderator: User
    ) {
      try {
        return await this.moderationService.approveList(listId, moderator);
      } catch (error) {
        this.logger.error(`Error approving list: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Put('lists/:listId/reject')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async rejectList(
      @Param('listId') listId: string,
      @Body() moderateContentDto: ModerateContentDto,
      @CurrentUser() moderator: User
    ) {
      if (!moderateContentDto.reason) {
        throw new BadRequestException('Reason is required for rejection');
      }
  
      try {
        return await this.moderationService.rejectList(
          listId,
          moderateContentDto.reason,
          moderator
        );
      } catch (error) {
        this.logger.error(`Error rejecting list: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Put('lists/:listId/flag')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async flagList(
      @Param('listId') listId: string,
      @Body() moderateContentDto: ModerateContentDto,
      @CurrentUser() moderator: User
    ) {
      if (!moderateContentDto.reason) {
        throw new BadRequestException('Reason is required for flagging');
      }
  
      try {
        return await this.moderationService.flagList(
          listId,
          moderateContentDto.reason,
          moderator
        );
      } catch (error) {
        this.logger.error(`Error flagging list: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Get('lists/flagged')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFlaggedLists(@Query() query: PaginationQueryDto) {
      try {
        return await this.moderationService.getFlaggedLists(
          query.page,
          query.limit
        );
      } catch (error) {
        this.logger.error(`Error getting flagged lists: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    // ==================== MODERATION QUEUE MANAGEMENT ====================
  
    @Get('queue')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async getModerationQueue(@Query() query: PaginationQueryDto) {
      try {
        return await this.moderationQueueService.findAll({
          page: query.page,
          limit: query.limit
        });
      } catch (error) {
        this.logger.error(`Error getting moderation queue: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Get('queue/next')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    async getNextModerationItem(@CurrentUser() moderator: User) {
      try {
        return await this.moderationQueueService.getNextItemForModeration(moderator);
      } catch (error) {
        this.logger.error(`Error getting next moderation item: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Put('queue/:queueId/assign')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    async assignQueueItem(
      @Param('queueId') queueId: string,
      @Body() assignQueueItemDto: AssignQueueItemDto,
      @CurrentUser() moderator: User
    ) {
      try {
        const moderatorId = assignQueueItemDto.moderatorId || moderator.id;
        return await this.moderationQueueService.assignToModerator(queueId, moderatorId);
      } catch (error) {
        this.logger.error(`Error assigning queue item: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Put('queue/:queueId/unassign')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    async unassignQueueItem(
      @Param('queueId') queueId: string,
      @CurrentUser() moderator: User
    ) {
      try {
        return await this.moderationQueueService.unassign(queueId);
      } catch (error) {
        this.logger.error(`Error unassigning queue item: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Put('queue/:queueId/approve')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    async approveQueueItem(
      @Param('queueId') queueId: string,
      @Body() moderateContentDto: ModerateContentDto,
      @CurrentUser() moderator: User
    ) {
      try {
        return await this.moderationQueueService.approve(queueId, moderator, moderateContentDto.reason);
      } catch (error) {
        this.logger.error(`Error approving queue item: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Put('queue/:queueId/reject')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    async rejectQueueItem(
      @Param('queueId') queueId: string,
      @Body() moderateContentDto: ModerateContentDto,
      @CurrentUser() moderator: User
    ) {
      if (!moderateContentDto.reason) {
        throw new BadRequestException('Reason is required for rejection');
      }
  
      try {
        return await this.moderationQueueService.reject(queueId, moderator, moderateContentDto.reason);
      } catch (error) {
        this.logger.error(`Error rejecting queue item: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    // ==================== AUTO-MODERATION MANAGEMENT ====================
  
    @Get('auto-moderation/rules')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async getAutoModerationRules() {
      try {
        const [rules] = await this.autoModerationService.findRules();
        return rules;
      } catch (error) {
        this.logger.error(`Error getting auto-moderation rules: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Post('auto-moderation/rules')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async createAutoModerationRule(
      @Body() ruleData: any,
      @CurrentUser() user: User
    ) {
      try {
        return await this.autoModerationService.createRule(ruleData, user);
      } catch (error) {
        this.logger.error(`Error creating auto-moderation rule: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Put('auto-moderation/rules/:ruleId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateAutoModerationRule(
      @Param('ruleId') ruleId: string,
      @Body() ruleData: any
    ) {
      try {
        return await this.autoModerationService.updateRule({
          id: ruleId,
          ...ruleData
        });
      } catch (error) {
        this.logger.error(`Error updating auto-moderation rule: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Get('auto-moderation/rules/:ruleId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async getAutoModerationRule(@Param('ruleId') ruleId: string) {
      try {
        return await this.autoModerationService.findRule(ruleId);
      } catch (error) {
        this.logger.error(`Error getting auto-moderation rule: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    // ==================== USER REPUTATION MANAGEMENT ====================
  
    @Get('reputation/:userId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    async getUserReputation(@Param('userId') userId: string) {
      try {
        return await this.userReputationService.findOrCreateForUser(userId);
      } catch (error) {
        this.logger.error(`Error getting user reputation: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Put('reputation/:userId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateUserReputation(
      @Param('userId') userId: string,
      @Body() reputationData: any
    ) {
      try {
        return await this.userReputationService.updateReputation({
          userId,
          ...reputationData
        });
      } catch (error) {
        this.logger.error(`Error updating user reputation: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    // ==================== STATISTICS ====================
  
    @Get('statistics')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    async getModerationStats(): Promise<ModerationStatsResponseDto> {
      try {
        return await this.moderationService.getModerationStats();
      } catch (error) {
        this.logger.error(`Error getting moderation statistics: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Get('queue/statistics')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    async getQueueStatistics(): Promise<QueueStatisticsResponseDto> {
      try {
        return await this.moderationQueueService.getStatistics();
      } catch (error) {
        this.logger.error(`Error getting queue statistics: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    // ==================== MODERATION LOGS ====================
  
    @Get('logs')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async getModerationLogs(@Query() query: PaginationQueryDto) {
      try {
        const [logs, count] = await this.moderationService['moderationLogRepository'].findAndCount({
          relations: ['moderator', 'targetUser', 'targetReview'],
          order: { createdAt: 'DESC' },
          skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
          take: query.limit
        });
        
        return {
          items: logs,
          total: count,
          page: query.page,
          totalPages: Math.ceil(count / (query.limit ?? 10))
        };
      } catch (error) {
        this.logger.error(`Error getting moderation logs: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    @Get('logs/:logId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    async getModerationLog(@Param('logId') logId: string) {
      try {
        const log = await this.moderationService['moderationLogRepository'].findOne({
          where: { id: logId },
          relations: ['moderator', 'targetUser', 'targetReview']
        });
  
        if (!log) {
          throw new NotFoundException(`Moderation log with ID ${logId} not found`);
        }
  
        return log;
      } catch (error) {
        this.logger.error(`Error getting moderation log: ${error.message}`, error.stack);
        throw error;
      }
    }
  }