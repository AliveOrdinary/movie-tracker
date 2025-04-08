//src/modules/admin/dto/index.ts
export * from './user-management.dto';
export * from './admin-dashboard-stats.dto';
export * from './admin-content-stats.dto';
export * from './admin-user-stats.dto';
export * from './bulk-operations.dto';
export * from './system-stats.dto';
export * from './user-role-stats.dto';
export * from './update-admin.input';

// Re-export specific members to avoid naming conflicts
export { CreateModerationLogInput, UpdateModerationLogInput, ModerationLogFiltersInput } from './moderation-log.dto';
export { CreateReportInput, ResolveReportInput, ReportFiltersInput, ReportStats } from './report.dto';
export { ReportStats as ReportStatsType } from './report-stats.type';
export { ResolveReportInput as ResolveReportInputType } from './resolve-report.input';
export { ModerationLogFiltersInput as ModerationLogFiltersInputType } from './moderation-log-filters.input';
export { CreateModerationLogInput as CreateModerationLogInputType } from './create-moderation-log.input';
export { UpdateModerationLogInput as UpdateModerationLogInputType } from './update-moderation-log.input';