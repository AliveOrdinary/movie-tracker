import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateReportsTable1708463781237 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create report status enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status_enum') THEN
          CREATE TYPE "report_status_enum" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');
        END IF;
      END$$;
    `);

    // Create report resolution enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_resolution_enum') THEN
          CREATE TYPE "report_resolution_enum" AS ENUM ('DELETE', 'WARNING', 'DISMISS');
        END IF;
      END$$;
    `);

    // Create reports table
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
            name: 'review_id',
            type: 'uuid',
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
            type: 'report_status_enum',
            default: "'PENDING'",
          },
          {
            name: 'resolution',
            type: 'report_resolution_enum',
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
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'resolved_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'reports',
      new TableForeignKey({
        name: 'FK_reports_review',
        columnNames: ['review_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'reviews',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reports',
      new TableForeignKey({
        name: 'FK_reports_reporter',
        columnNames: ['reporter_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reports',
      new TableForeignKey({
        name: 'FK_reports_moderator',
        columnNames: ['moderator_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'reports',
      new TableIndex({
        name: 'IDX_reports_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'reports',
      new TableIndex({
        name: 'IDX_reports_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'reports',
      new TableIndex({
        name: 'IDX_reports_review',
        columnNames: ['review_id'],
      }),
    );

    await queryRunner.createIndex(
      'reports',
      new TableIndex({
        name: 'IDX_reports_reporter',
        columnNames: ['reporter_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('reports', 'IDX_reports_status');
    await queryRunner.dropIndex('reports', 'IDX_reports_created_at');
    await queryRunner.dropIndex('reports', 'IDX_reports_review');
    await queryRunner.dropIndex('reports', 'IDX_reports_reporter');

    // Drop foreign keys
    await queryRunner.dropForeignKey('reports', 'FK_reports_review');
    await queryRunner.dropForeignKey('reports', 'FK_reports_reporter');
    await queryRunner.dropForeignKey('reports', 'FK_reports_moderator');

    // Drop table
    await queryRunner.dropTable('reports');

    // Drop enums
    await queryRunner.query(`
      DO $$
      BEGIN
        DROP TYPE IF EXISTS "report_status_enum";
        DROP TYPE IF EXISTS "report_resolution_enum";
      END$$;
    `);
  }
}