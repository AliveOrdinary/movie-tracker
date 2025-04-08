// src/database/migrations/1741000000000-CreateNotificationPreferences.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateNotificationPreferences1741000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notification_preferences',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'email_notifications',
            type: 'boolean',
            default: true,
          },
          {
            name: 'push_notifications',
            type: 'boolean',
            default: true,
          },
          {
            name: 'review_notifications',
            type: 'boolean',
            default: true,
          },
          {
            name: 'friend_request_notifications',
            type: 'boolean',
            default: true,
          },
          {
            name: 'watchlist_notifications',
            type: 'boolean',
            default: true,
          },
          {
            name: 'movie_release_notifications',
            type: 'boolean',
            default: true,
          },
          {
            name: 'system_notifications',
            type: 'boolean',
            default: true,
          },
          {
            name: 'disabled_types',
            type: 'text',
            isArray: true,
            default: "'{}'",
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
        ],
      }),
      true
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'notification_preferences',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Add index on user_id
    await queryRunner.query(
      'CREATE INDEX IDX_notification_preferences_user_id ON notification_preferences(user_id)'
    );

    // Add metadata column to notifications table if it doesn't exist
    const hasMetadataColumn = await queryRunner.hasColumn('notifications', 'metadata');
    if (!hasMetadataColumn) {
      await queryRunner.query(
        'ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB'
      );
    }

    // Add index on notifications user_id + isRead for faster unread count queries
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS IDX_notifications_user_id_is_read ON notifications(user_id, "isRead")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key first
    const table = await queryRunner.getTable('notification_preferences');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('user_id') !== -1
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('notification_preferences', foreignKey);
      }
    }
  
    // Drop the indices
    await queryRunner.query('DROP INDEX IF EXISTS IDX_notification_preferences_user_id');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_notifications_user_id_is_read"');
  
    // Drop the table
    await queryRunner.dropTable('notification_preferences');
  }
}