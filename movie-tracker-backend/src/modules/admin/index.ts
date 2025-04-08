// src/modules/admin/index.ts
// Main module
export * from './admin.module';
export * from './admin.service';
export * from './admin.controller';

// Resolvers
export * from './resolvers/admin-stats.resolver';
export * from './resolvers/content-management.resolver';
export * from './resolvers/user-management.resolver';

// DTOs
export * from './dto/admin-dashboard-stats.dto';
export * from './dto/admin-content-stats.dto';
export * from './dto/admin-user-stats.dto';
export * from './dto/create-moderation-log.input';

export * from './dto/report.dto';
export * from './dto/update-admin.input';
export * from './dto/user-role-stats.dto';
export { 
    CreateModerationLogInput as AdminCreateModerationLogInput 
  } from './dto/moderation-log.dto';
  export {
    ReportStats as AdminReportStats 
  } from './dto/report-stats.type';