// src/modules/admin/resolvers/system-config.resolver.ts
import { Resolver, Query, Mutation, Args, ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { UserRole } from 'src/common/enums';
import { SystemConfig, ConfigCategory } from '../entities/system-config.entity';
import { SystemConfigService } from '../services/system-config.service';
import { 
  CreateSystemConfigInput, 
  UpdateSystemConfigInput, 
  SystemConfigFiltersInput, 
  PaginatedSystemConfigs 
} from '../dto/system-config.dto';
import { AuditService } from '../services/audit.service';
import { AdminActionType } from '../entities/admin-audit-log.entity';

@ObjectType()
class BulkOperationResult {
  @Field(() => Int)
  successCount: number;

  @Field(() => Int)
  failureCount: number;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
class ConfigExport {
  @Field(() => String)
  key: string;

  @Field(() => String)
  value: string;
}

@InputType()
class ConfigImport {
  @Field(() => String)
  key: string;

  @Field(() => String)
  value: string;
}

@Resolver(() => SystemConfig)
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SystemConfigResolver {
  constructor(
    private readonly systemConfigService: SystemConfigService,
    private readonly auditService: AuditService
  ) {}

  @Query(() => PaginatedSystemConfigs)
  async systemConfigs(
    @Args('filters', { nullable: true }) filters?: SystemConfigFiltersInput,
  ): Promise<PaginatedSystemConfigs> {
    const filtersWithDefaults = filters || {};
    const { page = 1, limit = 20 } = filtersWithDefaults;
    
    const [items, total] = await this.systemConfigService.findConfigs(filtersWithDefaults);
    
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Query(() => SystemConfig, { nullable: true })
  async systemConfig(
    @Args('key') key: string,
    @Args('includeEncrypted', { defaultValue: false }) includeEncrypted: boolean,
  ): Promise<SystemConfig | null> {
    return this.systemConfigService.getConfigByKey(key, includeEncrypted);
  }

  @Query(() => String, { nullable: true })
  async systemConfigValue(
    @Args('key') key: string,
    @Args('defaultValue', { nullable: true }) defaultValue?: string,
  ): Promise<string | null> {
    return this.systemConfigService.getConfigValue(key, defaultValue);
  }

  @Query(() => [SystemConfig])
  async systemConfigsByCategory(
    @Args('category', { type: () => ConfigCategory }) category: ConfigCategory,
    @Args('includeEncrypted', { defaultValue: false }) includeEncrypted: boolean,
  ): Promise<SystemConfig[]> {
    return this.systemConfigService.getConfigsByCategory(category, includeEncrypted);
  }

  @Query(() => [String])
  async systemConfigCategories(): Promise<string[]> {
    return this.systemConfigService.getConfigCategories();
  }

  @Query(() => [ConfigExport])
  async exportSystemConfigs(
    @Args('includeEncrypted', { defaultValue: false }) includeEncrypted: boolean,
  ): Promise<ConfigExport[]> {
    const configs = await this.systemConfigService.exportAllConfigs(includeEncrypted);
    return Object.entries(configs).map(([key, value]) => ({
      key,
      value
    }));
  }

  @Mutation(() => SystemConfig)
  async createSystemConfig(
    @CurrentUser() admin: User,
    @Args('input') input: CreateSystemConfigInput,
  ): Promise<SystemConfig> {
    const config = await this.systemConfigService.createConfig(input);
    
    // Log the action
    await this.auditService.logAdminAction(
      admin.id,
      `Created config with key: ${input.key}, category: ${input.category}`
    );
    
    return config;
  }

  @Mutation(() => SystemConfig)
  async updateSystemConfig(
    @CurrentUser() admin: User,
    @Args('input') input: UpdateSystemConfigInput,
  ): Promise<SystemConfig> {
    const config = await this.systemConfigService.updateConfig(input);
    
    // Log the action
    await this.auditService.logAdminAction(
      admin.id,
      `Updated config with key: ${input.key}`
    );
    
    return config;
  }

  @Mutation(() => Boolean)
  async deleteSystemConfig(
    @CurrentUser() admin: User,
    @Args('key') key: string,
  ): Promise<boolean> {
    const result = await this.systemConfigService.deleteConfig(key);
    
    // Log the action
    await this.auditService.logAdminAction(
      admin.id,
      `Deleted config with key: ${key}`
    );
    
    return result;
  }

  @Mutation(() => BulkOperationResult)
  async bulkUpdateSystemConfigs(
    @CurrentUser() admin: User,
    @Args('configs', { type: () => [UpdateSystemConfigInput] }) configs: UpdateSystemConfigInput[],
  ): Promise<BulkOperationResult> {
    const result = await this.systemConfigService.bulkUpdateConfigs(configs);
    
    // Log the action
    await this.auditService.logAdminAction(
      admin.id,
      `Updated ${configs.length} configs (${result.successCount} successful, ${result.failureCount} failed)`
    );
    
    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors.length > 0 ? result.errors : undefined
    };
  }

  @Mutation(() => BulkOperationResult)
  async importSystemConfigs(
    @CurrentUser() admin: User,
    @Args('configs', { type: () => [ConfigImport] }) configs: ConfigImport[],
  ): Promise<BulkOperationResult> {
    // Convert to record format
    const configRecord: Record<string, string> = {};
    configs.forEach(config => {
      configRecord[config.key] = config.value;
    });
    
    const result = await this.systemConfigService.importConfigs(configRecord);
    
    // Log the action
    await this.auditService.logAdminAction(
      admin.id,
      `Imported ${configs.length} configs (${result.successCount} successful, ${result.failureCount} failed)`
    );
    
    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors.length > 0 ? result.errors : undefined
    };
  }

  @Mutation(() => Boolean)
  async initializeDefaultConfigs(
    @CurrentUser() admin: User,
  ): Promise<boolean> {
    await this.systemConfigService.initializeDefaultConfigs();
    
    // Log the action
    await this.auditService.logAdminAction(
      admin.id,
      `Set up default system configurations`
    );
    
    return true;
  }
}

// Export the resolver explicitly
