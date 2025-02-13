// src/modules/admin/admin.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModerationLog, ModerationAction } from './entities/moderation-log.entity';
import { Report, ReportStatus } from './entities/report.entity';
import { User } from '../users/entities/user.entity';
import { UpdateAdminInput } from './dto/update-admin.input';
import { ResolveReportInput } from './dto/report.dto';
import { ReportStats } from './dto/report-stats.type';
import { CreateModerationLogInput } from './dto/create-moderation-log.input';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(ModerationLog)
    private moderationLogRepository: Repository<ModerationLog>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
  ) {}

  async findOne(id: string): Promise<ModerationLog> {
    const log = await this.moderationLogRepository.findOne({
      where: { id },
      relations: ['moderator', 'targetUser', 'targetReview'],
    });

    if (!log) {
      throw new NotFoundException(`Moderation log with ID ${id} not found`);
    }

    return log;
  }

  async create(moderator: User, input: CreateModerationLogInput): Promise<ModerationLog> {
    const log = this.moderationLogRepository.create({
      ...input,
      moderator,
      isResolved: false,
    });
    
    return this.moderationLogRepository.save(log);
  }

  async update(id: string, input: UpdateAdminInput): Promise<ModerationLog> {
    const log = await this.findOne(id);
    
    if (input.notes) {
      log.notes = input.notes;
    }
    
    if (typeof input.isResolved !== 'undefined') {
      log.isResolved = input.isResolved;
      if (input.isResolved) {
        log.resolvedAt = new Date();
      }
    }

    return this.moderationLogRepository.save(log);
  }

  async moderateUser(
    moderator: User,
    userId: string,
    action: ModerationAction,
    reason: string,
  ): Promise<ModerationLog> {
    const log = this.moderationLogRepository.create({
      moderator,
      action,
      reason,
      createdAt: new Date(),
      targetUser: { id: userId } as User,
    });

    return this.moderationLogRepository.save(log);
  }

  async getReportStats(): Promise<ReportStats> {
    const [total, pending, resolved, dismissed] = await Promise.all([
      this.reportRepository.count(),
      this.reportRepository.count({ where: { status: ReportStatus.PENDING } }),
      this.reportRepository.count({ where: { status: ReportStatus.RESOLVED } }),
      this.reportRepository.count({ where: { status: ReportStatus.DISMISSED } }),
    ]);

    return {
      totalReports: total,
      pendingReports: pending,
      resolvedReports: resolved,
      dismissedReports: dismissed,
    };
  }

  async getPendingReportsCount(): Promise<number> {
    return this.reportRepository.count({
      where: { status: ReportStatus.PENDING },
    });
  }

  async resolveReport(moderator: User, input: ResolveReportInput): Promise<ModerationLog> {
    const report = await this.reportRepository.findOne({
      where: { id: input.reportId },
      relations: ['review'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${input.reportId} not found`);
    }

    report.status = ReportStatus.RESOLVED;
    report.moderator = moderator;
    report.resolvedAt = new Date();
    await this.reportRepository.save(report);

    // Create moderation log
    const log = this.moderationLogRepository.create({
      moderator,
      action: ModerationAction.REVIEW_APPROVED,
      reason: input.moderatorNotes || 'Report resolved',
      targetReview: report.review,
      createdAt: new Date(),
      isResolved: true,
      resolvedAt: new Date(),
    });

    return this.moderationLogRepository.save(log);
  }

  async findAll(filters: {
    isResolved?: boolean;
    moderatorId?: string;
    targetUserId?: string;
    take?: number;
    skip?: number;
  } = {}): Promise<[ModerationLog[], number]> {
    const query = this.moderationLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.moderator', 'moderator')
      .leftJoinAndSelect('log.targetUser', 'targetUser')
      .leftJoinAndSelect('log.targetReview', 'targetReview');

    if (typeof filters.isResolved !== 'undefined') {
      query.andWhere('log.isResolved = :isResolved', {
        isResolved: filters.isResolved,
      });
    }

    if (filters.moderatorId) {
      query.andWhere('moderator.id = :moderatorId', {
        moderatorId: filters.moderatorId,
      });
    }

    if (filters.targetUserId) {
      query.andWhere('targetUser.id = :targetUserId', {
        targetUserId: filters.targetUserId,
      });
    }

    if (filters.take) {
      query.take(filters.take);
    }

    if (filters.skip) {
      query.skip(filters.skip);
    }

    return query.getManyAndCount();
  }
}