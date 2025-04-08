// src/database/migrations/1625824000000-CreateModerationTables.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateModerationTables1625824000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if moderation_logs table exists
    const moderationLogsTableExists = await queryRunner.hasTable('moderation_logs');
    
    // Create moderation_logs table if it doesn't exist
    if (!moderationLogsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'moderation_logs',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'action',
              type: 'enum',
              enum: [
                'REVIEW_APPROVED',
                'REVIEW_REJECTED',
                'REVIEW_FLAGGED',
                'LIST_APPROVED',
                'LIST_REJECTED',
                'LIST_FLAGGED',
                'USER_WARNED',
                'USER_SUSPENDED',
                'USER_BANNED',
              ],
            },
            {
              name: 'reason',
              type: 'text',
            },
            {
              name: 'moderator_id',
              type: 'uuid',
            },
            {
              name: 'target_user_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'target_review_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'metadata',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'now()',
            },
            {
              name: 'is_resolved',
              type: 'boolean',
              default: false,
            },
            {
              name: 'resolved_at',
              type: 'timestamp',
              isNullable: true,
            },
            {
              name: 'notes',
              type: 'text',
              isNullable: true,
            },
          ],
        }),
        true
      );
    }

    // Check if reports table exists
    const reportsTableExists = await queryRunner.hasTable('reports');
    
    // Create reports table if it doesn't exist
    if (!reportsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'reports',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'content_type',
              type: 'enum',
              enum: ['REVIEW', 'LIST', 'USER_PROFILE'],
            },
            {
              name: 'content_id',
              type: 'varchar',
            },
            {
              name: 'review_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'list_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'reporter_id',
              type: 'uuid',
            },
            {
              name: 'moderator_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'reason',
              type: 'text',
            },
            {
              name: 'status',
              type: 'enum',
              enum: ['PENDING', 'RESOLVED', 'DISMISSED'],
              default: "'PENDING'",
            },
            {
              name: 'resolution',
              type: 'enum',
              enum: ['DISMISS', 'WARNING', 'DELETE'],
              isNullable: true,
            },
            {
              name: 'moderator_notes',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'now()',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'now()',
            },
            {
              name: 'resolved_at',
              type: 'timestamp',
              isNullable: true,
            },
          ],
        }),
        true
      );
    }

    // Add foreign keys conditionally to avoid duplicate key errors
    if (!moderationLogsTableExists) {
      try {
        await queryRunner.createForeignKey(
          'moderation_logs',
          new TableForeignKey({
            name: 'FK_moderation_logs_moderator',
            columnNames: ['moderator_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
          })
        );
      } catch (error) {
        console.log('Foreign key for moderator_id already exists or could not be created');
      }

      try {
        await queryRunner.createForeignKey(
          'moderation_logs',
          new TableForeignKey({
            name: 'FK_moderation_logs_target_user',
            columnNames: ['target_user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
          })
        );
      } catch (error) {
        console.log('Foreign key for target_user_id already exists or could not be created');
      }

      try {
        await queryRunner.createForeignKey(
          'moderation_logs',
          new TableForeignKey({
            name: 'FK_moderation_logs_target_review',
            columnNames: ['target_review_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'reviews',
            onDelete: 'SET NULL',
          })
        );
      } catch (error) {
        console.log('Foreign key for target_review_id already exists or could not be created');
      }
    }

    if (!reportsTableExists) {
      try {
        await queryRunner.createForeignKey(
          'reports',
          new TableForeignKey({
            name: 'FK_reports_reporter',
            columnNames: ['reporter_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
          })
        );
      } catch (error) {
        console.log('Foreign key for reporter_id already exists or could not be created');
      }

      try {
        await queryRunner.createForeignKey(
          'reports',
          new TableForeignKey({
            name: 'FK_reports_moderator',
            columnNames: ['moderator_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
          })
        );
      } catch (error) {
        console.log('Foreign key for moderator_id already exists or could not be created');
      }

      try {
        await queryRunner.createForeignKey(
          'reports',
          new TableForeignKey({
            name: 'FK_reports_review',
            columnNames: ['review_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'reviews',
            onDelete: 'CASCADE',
          })
        );
      } catch (error) {
        console.log('Foreign key for review_id already exists or could not be created');
      }

      try {
        await queryRunner.createForeignKey(
          'reports',
          new TableForeignKey({
            name: 'FK_reports_list',
            columnNames: ['list_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'lists',
            onDelete: 'CASCADE',
          })
        );
      } catch (error) {
        console.log('Foreign key for list_id already exists or could not be created');
      }
    }

    // Add is_flagged column to reviews table if not exists
    const reviewTableHasFlaggedColumn = await this.hasColumn(queryRunner, 'reviews', 'is_flagged');
    if (!reviewTableHasFlaggedColumn) {
      await queryRunner.query(`ALTER TABLE reviews ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE`);
    }
    
    // Add status column to reviews table if not exists
    const reviewTableHasStatusColumn = await this.hasColumn(queryRunner, 'reviews', 'status');
    if (!reviewTableHasStatusColumn) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status_enum') THEN
            CREATE TYPE review_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');
          END IF;
        END$$;
      `);
      
      await queryRunner.query(`ALTER TABLE reviews ADD COLUMN status review_status_enum DEFAULT 'PENDING'`);
    }

    // Add moderation_reason column to reviews table if not exists
    const reviewTableHasReasonColumn = await this.hasColumn(queryRunner, 'reviews', 'moderation_reason');
    if (!reviewTableHasReasonColumn) {
      await queryRunner.query(`ALTER TABLE reviews ADD COLUMN moderation_reason TEXT`);
    }

    // Add moderated_at column to reviews table if not exists
    const reviewTableHasModeratedAtColumn = await this.hasColumn(queryRunner, 'reviews', 'moderated_at');
    if (!reviewTableHasModeratedAtColumn) {
      await queryRunner.query(`ALTER TABLE reviews ADD COLUMN moderated_at TIMESTAMP`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Tables should be dropped in reverse order of creation to avoid foreign key constraint errors
    try {
      // Drop foreign keys using direct queries
      const tables = ['reports', 'moderation_logs'];
      
      for (const table of tables) {
        // Get foreign key constraints from PostgreSQL information schema
        const foreignKeys = await queryRunner.query(`
          SELECT tc.constraint_name 
          FROM information_schema.table_constraints tc 
          WHERE tc.table_name = '${table}' 
          AND tc.constraint_type = 'FOREIGN KEY'
        `);
        
        // Drop each foreign key by name
        for (const fk of foreignKeys) {
          try {
            await queryRunner.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS "${fk.constraint_name}"`);
          } catch (error) {
            console.log(`Failed to drop foreign key ${fk.constraint_name} from ${table}`);
          }
        }
      }

      // Drop tables in reverse order
      await queryRunner.dropTable('reports', true);
      await queryRunner.dropTable('moderation_logs', true);

      // Remove columns from reviews table
      await queryRunner.query(`ALTER TABLE reviews DROP COLUMN IF EXISTS is_flagged`);
      await queryRunner.query(`ALTER TABLE reviews DROP COLUMN IF EXISTS status`);
      await queryRunner.query(`ALTER TABLE reviews DROP COLUMN IF EXISTS moderation_reason`);
      await queryRunner.query(`ALTER TABLE reviews DROP COLUMN IF EXISTS moderated_at`);

      // Drop enum types
      await queryRunner.query(`DROP TYPE IF EXISTS review_status_enum`);
    } catch (error) {
      console.log('Error during migration rollback:', error);
    }
  }

  // Helper method to check if a column exists in a table
  private async hasColumn(queryRunner: QueryRunner, table: string, column: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${table}' AND column_name = '${column}'
    `);
    return result.length > 0;
  }
}