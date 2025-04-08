// src/modules/admin/services/audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { AdminAuditLog, AdminActionType } from '../entities/admin-audit-log.entity';
import { User } from '../../users/entities/user.entity';
import { PaginatedAuditLogs, AuditLogFiltersInput, CreateAuditLogInput } from '../dto/audit-log.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AdminAuditLog)
    private auditLogRepository: Repository<AdminAuditLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Log an admin action for auditing purposes
   */
  async logAdminAction(
    adminIdOrUser: User | string,
    action: string,
    details?: string,
    entityId?: string,
    entityType?: string
  ): Promise<AdminAuditLog> {
    try {
      let adminUser: User | null = null;
      let adminId: string;
      
      if (typeof adminIdOrUser === 'string') {
        adminId = adminIdOrUser;
        adminUser = await this.userRepository.findOne({ where: { id: adminId } });
      } else {
        adminUser = adminIdOrUser;
        adminId = adminIdOrUser.id;
      }
      
      // Ensure we have a valid admin user
      if (!adminUser) {
        this.logger.warn(`Admin user with ID ${adminId} not found, but continuing with audit log`);
      }

      // Create the log entry - make sure we're specifying properties exactly as in the entity
      const log = new AdminAuditLog();
      log.adminId = adminId;
      log.action = action;
      log.details = details || '';
      log.entityId = entityId || undefined;
      log.entityType = entityType || undefined;
      log.timestamp = new Date();
      log.ipAddress = '127.0.0.1'; // This should be captured from the request context
      
      // Set the admin relationship
      if (adminUser) {
        log.admin = adminUser;
      }
      
      // Save the log entry
      // TypeORM's save can return an array or a single entity depending on the input
      // Add explicit type to ensure proper recognition
      const createdLog = await this.auditLogRepository.save(log) as AdminAuditLog;
      return createdLog;
    } catch (error) {
      this.logger.error(`Error logging admin action: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get paginated audit logs with optional filtering
   */
  async getAuditLogs(filter: AuditLogFiltersInput): Promise<PaginatedAuditLogs> {
    try {
      const { page = 1, limit = 25, adminId, actionType, startDate, endDate, targetUserId } = filter;
      
      const queryBuilder = this.auditLogRepository
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.admin', 'admin')
        .leftJoinAndSelect('log.targetUser', 'targetUser')
        .orderBy('log.timestamp', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);
      
      // Apply filters
      if (adminId) {
        queryBuilder.andWhere('log.adminId = :adminId', { adminId });
      }
      
      if (actionType) {
        queryBuilder.andWhere('log.actionType = :actionType', { actionType });
      }
      
      if (targetUserId) {
        queryBuilder.andWhere('log.targetUserId = :targetUserId', { targetUserId });
      }
      
      if (startDate && endDate) {
        queryBuilder.andWhere('log.timestamp BETWEEN :startDate AND :endDate', { 
          startDate, 
          endDate 
        });
      } else if (startDate) {
        queryBuilder.andWhere('log.timestamp >= :startDate', { startDate });
      } else if (endDate) {
        queryBuilder.andWhere('log.timestamp <= :endDate', { endDate });
      }
      
      // Execute query
      const [items, total] = await queryBuilder.getManyAndCount();
      
      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Error getting audit logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get recent actions by admin
   */
  async getRecentActionsByAdmin(adminId: string, limit: number = 10): Promise<AdminAuditLog[]> {
    try {
      return this.auditLogRepository.find({
        where: { adminId },
        relations: ['admin'],
        order: { timestamp: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Error getting recent actions for admin ${adminId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get entity modification history
   */
  async getEntityModificationHistory(
    entityType: string,
    entityId: string,
  ): Promise<AdminAuditLog[]> {
    try {
      return this.auditLogRepository.find({
        where: { 
          entityType, 
          entityId 
        },
        relations: ['admin'],
        order: { timestamp: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error getting modification history for ${entityType} ${entityId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user audit logs
   */
  async getUserAuditLogs(userId: string): Promise<[AdminAuditLog[], number]> {
    try {
      return this.auditLogRepository.findAndCount({
        where: { targetUserId: userId },
        relations: ['admin'],
        order: { timestamp: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error getting audit logs for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get action frequency analytics
   */
  async getActionFrequencyAnalytics(days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get all logs in the period
      const logs = await this.auditLogRepository.find({
        where: { timestamp: MoreThan(startDate) },
        select: ['action', 'actionType', 'timestamp'],
      });
      
      // Group by action type
      const actionFrequency: Record<string, number> = {};
      logs.forEach(log => {
        const actionKey = log.actionType ? log.actionType.toString() : log.action;
        actionFrequency[actionKey] = (actionFrequency[actionKey] || 0) + 1;
      });
      
      // Convert to array and sort
      const result = Object.entries(actionFrequency)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count);
      
      return result;
    } catch (error) {
      this.logger.error(`Error getting action frequency analytics: ${error.message}`);
      throw error;
    }
  }
}