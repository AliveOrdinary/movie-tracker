// src/modules/admin/admin.controller.ts
import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Body, 
    Param, 
    Query, 
    UseGuards,
    ValidationPipe,
    UsePipes,
    HttpStatus,
    HttpCode
  } from '@nestjs/common';
  import { AdminService } from './admin.service';
  import { ModerationService } from '../moderation/moderation.service';
  import { AuthGuard } from '../../auth/guards/auth.guard';
  import { RolesGuard } from '../../auth/guards/roles.guard';
  import { Roles } from '../../auth/decorators/roles.decorator';
  import { CurrentUser } from '../../auth/decorators/current-user.decorator';
  import { UserRole, ModerationAction } from '../../common/enums';
  import { User } from '../users/entities/user.entity';
  
  // DTOs
  class ModerateUserDto {
    action: ModerationAction;
    reason: string;
  }
  
  class UpdateUserRoleDto {
    role: UserRole;
    add: boolean;
  }
  
  class PaginationQueryDto {
    page?: number = 1;
    limit?: number = 10;
  }
  
  class SearchQueryDto extends PaginationQueryDto {
    query: string;
  }
  
  class DeleteUserDto {
    keepContent?: boolean = true;
  }
  
  @Controller('admin')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  export class AdminController {
    constructor(
      private readonly adminService: AdminService,
      private readonly moderationService: ModerationService
    ) {}
  
    // Dashboard statistics
    @Get('dashboard/stats')
    async getDashboardStats() {
      return this.adminService.getDashboardStats();
    }
  
    @Get('content/stats')
    async getContentStats() {
      return this.adminService.getContentStats();
    }
  
    @Get('users/stats')
    async getUserStats() {
      return this.adminService.getUserStats();
    }
  
    @Get('reports/stats')
    async getReportStats() {
      return this.adminService.getReportStats();
    }
  
    // User management
    @Get('users')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getAllUsers(@Query() query: PaginationQueryDto) {
      const [users, total] = await this.adminService.findAll({
        skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),

        take: query.limit,
      });
  
      return {
        users: users.map(log => log.targetUser).filter(Boolean),
        total,
        page: query.page,
        totalPages: Math.ceil(total / (query.limit ?? 10)),
      };
    }
  
    @Get('users/search')
    @UsePipes(new ValidationPipe({ transform: true }))
    async searchUsers(@Query() query: SearchQueryDto) {
      const [users, total] = await this.adminService.searchUsers(
        query.query,
        query.page,
        query.limit
      );
  
      return {
        users,
        total,
        page: query.page,
        totalPages: Math.ceil(total / (query.limit ?? 10)),
      };
    }
  
    @Put('users/:userId/role')
    async updateUserRole(
      @Param('userId') userId: string,
      @Body() body: UpdateUserRoleDto
    ) {
      return this.adminService.setUserRole(userId, body.role, body.add);
    }
  
    @Post('users/:userId/moderate')
    async moderateUser(
      @Param('userId') userId: string,
      @Body() body: ModerateUserDto,
      @CurrentUser() moderator: User
    ) {
      return this.adminService.moderateUser(
        moderator,
        userId,
        body.action,
        body.reason
      );
    }
  
    @Post('users/:userId/ban')
    async banUser(
      @Param('userId') userId: string,
      @Body('reason') reason: string,
      @CurrentUser() moderator: User
    ) {
      await this.adminService.moderateUser(
        moderator,
        userId,
        ModerationAction.USER_BANNED,
        reason
      );
      return this.adminService.banUser(userId, reason);
    }
  
    @Post('users/:userId/unban')
    async unbanUser(@Param('userId') userId: string) {
      return this.adminService.unbanUser(userId);
    }
  
    @Delete('users/:userId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteUser(
      @Param('userId') userId: string,
      @Body() body: DeleteUserDto
    ) {
      return this.adminService.deleteUser(userId, body.keepContent);
    }
  
    // Content management
    @Get('reviews/flagged')
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFlaggedReviews(@Query() query: PaginationQueryDto) {
      const [reviews, total] = await this.moderationService.getFlaggedReviews(
        query.page,
        query.limit
      );
      
      return {
        reviews,
        total,
        page: query.page,
        totalPages: Math.ceil(total / (query.limit ?? 10)),
      };
    }
  
    @Get('content/reported')
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @UsePipes(new ValidationPipe({ transform: true }))
    async getReportedContent(@Query() query: PaginationQueryDto) {
      const [reports, total] = await this.moderationService.getReportedContent(
        query.page,
        query.limit
      );
      
      return {
        reports,
        total,
        page: query.page,
        totalPages: Math.ceil(total / (query.limit ?? 10)),
      };
    }
  
    @Put('reviews/:reviewId/approve')
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    async approveReview(
      @Param('reviewId') reviewId: string,
      @CurrentUser() moderator: User
    ) {
      return this.moderationService.approveReview(reviewId, moderator);
    }
  
    @Put('reviews/:reviewId/reject')
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    async rejectReview(
      @Param('reviewId') reviewId: string,
      @Body('reason') reason: string,
      @CurrentUser() moderator: User
    ) {
      return this.moderationService.rejectReview(reviewId, reason, moderator);
    }
  
    @Put('reviews/:reviewId/flag')
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    async flagReview(
      @Param('reviewId') reviewId: string,
      @Body('reason') reason: string,
      @CurrentUser() moderator: User
    ) {
      return this.moderationService.flagReview(reviewId, reason, moderator);
    }
  
    // Reports management
    @Post('reports/:reportId/resolve')
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    async resolveReport(
      @Param('reportId') reportId: string,
      @Body() body: any,
      @CurrentUser() moderator: User
    ) {
      return this.moderationService.resolveReport(
        reportId,  // Use parameter directly 
        body.resolution,
        moderator,
        body.notes  // Assuming this is the correct property name
      );
    }
  }