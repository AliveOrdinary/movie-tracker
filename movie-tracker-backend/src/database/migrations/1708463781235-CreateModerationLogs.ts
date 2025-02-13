import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateModerationLogs1708463781235 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create moderation_action enum type with a check to prevent duplicate creation
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_action_enum') THEN
          CREATE TYPE "moderation_action_enum" AS ENUM (
            'REVIEW_APPROVED',
            'REVIEW_REJECTED',
            'REVIEW_FLAGGED',
            'USER_WARNED',
            'USER_SUSPENDED',
            'USER_BANNED'
          );
        END IF;
      END$$;
    `);

    // Create moderation_logs table
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
            type: 'moderation_action_enum',
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
            default: "'{}'"  // Fixed: Properly quoted JSON default value
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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
      true,
    );

    // Create foreign key constraints
    await queryRunner.createForeignKey(
      'moderation_logs',
      new TableForeignKey({
        name: 'FK_moderation_logs_moderator',
        columnNames: ['moderator_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'moderation_logs',
      new TableForeignKey({
        name: 'FK_moderation_logs_target_user',
        columnNames: ['target_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'moderation_logs',
      new TableForeignKey({
        name: 'FK_moderation_logs_target_review',
        columnNames: ['target_review_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'reviews',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'moderation_logs',
      new TableIndex({
        name: 'IDX_moderation_logs_action',
        columnNames: ['action'],
      }),
    );

    await queryRunner.createIndex(
      'moderation_logs',
      new TableIndex({
        name: 'IDX_moderation_logs_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'moderation_logs',
      new TableIndex({
        name: 'IDX_moderation_logs_is_resolved',
        columnNames: ['is_resolved'],
      }),
    );

    await queryRunner.createIndex(
      'moderation_logs',
      new TableIndex({
        name: 'IDX_moderation_logs_target_user',
        columnNames: ['target_user_id'],
      }),
    );

    await queryRunner.createIndex(
      'moderation_logs',
      new TableIndex({
        name: 'IDX_moderation_logs_target_review',
        columnNames: ['target_review_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('moderation_logs', 'IDX_moderation_logs_action');
    await queryRunner.dropIndex('moderation_logs', 'IDX_moderation_logs_created_at');
    await queryRunner.dropIndex('moderation_logs', 'IDX_moderation_logs_is_resolved');
    await queryRunner.dropIndex('moderation_logs', 'IDX_moderation_logs_target_user');
    await queryRunner.dropIndex('moderation_logs', 'IDX_moderation_logs_target_review');

    // Drop foreign keys
    await queryRunner.dropForeignKey('moderation_logs', 'FK_moderation_logs_moderator');
    await queryRunner.dropForeignKey('moderation_logs', 'FK_moderation_logs_target_user');
    await queryRunner.dropForeignKey('moderation_logs', 'FK_moderation_logs_target_review');

    // Drop table
    await queryRunner.dropTable('moderation_logs');

    // Only drop the enum if it exists and is not used by other tables
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'moderation_action_enum'
          AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE udt_name = 'moderation_action_enum' 
            AND table_name != 'moderation_logs'
          )
        ) THEN
          DROP TYPE IF EXISTS "moderation_action_enum";
        END IF;
      END$$;
    `);
  }
}