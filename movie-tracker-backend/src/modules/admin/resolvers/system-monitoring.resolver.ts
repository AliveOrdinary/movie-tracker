// src/modules/admin/resolvers/system-monitoring.resolver.ts
import { Resolver, Query, Int, ObjectType, Field, Float, registerEnumType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import { SystemStatsDto } from '../dto/system-stats.dto';

// Define missing enum and types
enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy'
}

// Register the enum with GraphQL
registerEnumType(HealthStatus, {
  name: 'HealthStatus',
  description: 'Health status of the system',
});

@ObjectType()
class SystemHealthStatus {
  @Field(() => HealthStatus)
  status: HealthStatus;
  
  @Field(() => Date)
  timestamp: Date;
  
  @Field(() => [String], { nullable: true })
  issues: string[] | null;
}

@ObjectType()
class MemoryStats {
  @Field(() => Int)
  totalMemory: number;
  
  @Field(() => Int)
  freeMemory: number;
  
  @Field(() => Int)
  usedMemory: number;
  
  @Field(() => Float)
  usagePercentage: number;
}

@ObjectType()
class CpuStats {
  @Field(() => Float)
  cpuUsage: number;
  
  @Field(() => Int)
  numCores: number;
}

@ObjectType()
class DatabaseStats {
  @Field(() => Int, { nullable: true })
  totalTables?: number;
  
  @Field(() => Int, { nullable: true })
  totalRows?: number;
  
  @Field(() => Float, { nullable: true })
  databaseSize?: number;
  
  @Field(() => Int, { nullable: true })
  activeConnections?: number;
}

@ObjectType()
class SystemStats {
  @Field(() => MemoryStats)
  memory: {
    totalMemory: number;
    freeMemory: number;
    usedMemory: number;
    usagePercentage: number;
  };
  
  @Field(() => CpuStats)
  cpu: {
    cpuUsage: number;
    numCores: number;
  };
  
  @Field(() => DatabaseStats, { nullable: true })
  database: any;
  
  @Field(() => SystemHealthStatus)
  health: SystemHealthStatus;
  
  @Field(() => Int)
  uptime: number;
}
import * as os from 'os';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Resolver()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SystemMonitoringResolver {
  private startTime: number;

  constructor(
    @InjectDataSource() private dataSource: DataSource
  ) {
    this.startTime = Date.now();
  }

  @Query(() => SystemStats)
  async systemStats(): Promise<SystemStats> {
    // Memory stats
    const totalMemory = Math.round(os.totalmem() / (1024 * 1024));
    const freeMemory = Math.round(os.freemem() / (1024 * 1024));
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercentage = Math.round((usedMemory / totalMemory) * 100);

    // CPU stats
    const cpuUsage = await this.getCpuUsage();
    const numCores = os.cpus().length;

    // Database stats
    const dbStats = await this.getDatabaseStats();

    // Health check
    const health = await this.checkSystemHealth();

    // Calculate uptime
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    // Return complete system stats
    return {
      memory: {
        totalMemory,
        freeMemory,
        usedMemory,
        usagePercentage: memoryUsagePercentage
      },
      cpu: {
        cpuUsage,
        numCores
      },
      database: dbStats,
      health,
      uptime
    };
  }

  @Query(() => SystemHealthStatus)
  async systemHealth(): Promise<SystemHealthStatus> {
    return this.checkSystemHealth();
  }

  @Query(() => Int)
  async serverUptime(): Promise<number> {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Get the current CPU usage percentage
   */
  private async getCpuUsage(): Promise<number> {
    // Simple CPU usage calculation
    const startMeasure = os.cpus().map(cpu => {
      return Object.values(cpu.times).reduce((a, b) => a + b);
    });

    // Wait a short period to measure difference
    await new Promise(resolve => setTimeout(resolve, 100));

    const endMeasure = os.cpus().map(cpu => {
      return Object.values(cpu.times).reduce((a, b) => a + b);
    });

    const idleDiffs: number[] = [];
    const totalDiffs: number[] = [];

    for (let i = 0; i < startMeasure.length; i++) {
      const totalDiff = endMeasure[i] - startMeasure[i];
      totalDiffs.push(totalDiff);

      const endIdle = os.cpus()[i].times.idle;
      const startIdle = os.cpus()[i].times.idle;
      const idleDiff = endIdle - startIdle;
      idleDiffs.push(idleDiff);
    }

    const idleAvg = idleDiffs.reduce((a, b) => a + b) / idleDiffs.length;
    const totalAvg = totalDiffs.reduce((a, b) => a + b) / totalDiffs.length;
    const usageAvg = 100 - (100 * idleAvg / totalAvg);

    return Math.round(usageAvg * 100) / 100;
  }

  /**
   * Get basic database statistics
   */
  private async getDatabaseStats() {
    try {
      // Query for number of tables
      const tableCountResult = await this.dataSource.query(
        `SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public'`
      );
      const totalTables = parseInt(tableCountResult[0].count);

      // Query for database size
      const dbSizeResult = await this.dataSource.query(
        `SELECT pg_database_size(current_database()) / (1024 * 1024) as size_mb`
      );
      const databaseSize = parseFloat(dbSizeResult[0].size_mb);

      // Query for active connections
      const connectionsResult = await this.dataSource.query(
        `SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'`
      );
      const activeConnections = parseInt(connectionsResult[0].count);

      // Approximate total rows
      const rowCountResult = await this.dataSource.query(`
        SELECT 
          sum(n_live_tup) as total_rows
        FROM 
          pg_stat_user_tables
      `);
      const totalRows = parseInt(rowCountResult[0].total_rows) || 0;

      return {
        totalTables,
        totalRows,
        databaseSize,
        activeConnections
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }

  /**
   * Check overall system health
   */
  private async checkSystemHealth(): Promise<SystemHealthStatus> {
    const issues: string[] = [];
    let status = 'healthy';

    // Check memory usage
    const memUsage = 1 - (os.freemem() / os.totalmem());
    if (memUsage > 0.9) {
      issues.push('High memory usage (>90%)');
      status = 'degraded';
    } else if (memUsage > 0.75) {
      issues.push('Elevated memory usage (>75%)');
    }

    // Check database connection
    try {
      await this.dataSource.query('SELECT 1');
    } catch (error) {
      issues.push('Database connection error');
      status = 'unhealthy';
    }

    // Return health status
    return {
      status: status as HealthStatus,
      timestamp: new Date(),
      issues: issues.length > 0 ? issues : null
    };
  }
}
