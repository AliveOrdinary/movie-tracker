import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddModerationFieldsToLists1741900000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the columns already exist before adding
    const hasIsFlagged = await this.columnExists(queryRunner, 'lists', 'is_flagged');
    const hasModerationReason = await this.columnExists(queryRunner, 'lists', 'moderation_reason');
    const hasModeratedAt = await this.columnExists(queryRunner, 'lists', 'moderated_at');
    const hasIsRejected = await this.columnExists(queryRunner, 'lists', 'is_rejected');
    const hasIsAutoModerated = await this.columnExists(queryRunner, 'lists', 'is_auto_moderated');

    // Add isFlagged column to lists table
    if (!hasIsFlagged) {
      await queryRunner.addColumn(
        'lists',
        new TableColumn({
          name: 'is_flagged',
          type: 'boolean',
          default: false,
        }),
      );
    }

    // Add moderationReason column to lists table
    if (!hasModerationReason) {
      await queryRunner.addColumn(
        'lists',
        new TableColumn({
          name: 'moderation_reason',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    // Add moderatedAt column to lists table
    if (!hasModeratedAt) {
      await queryRunner.addColumn(
        'lists',
        new TableColumn({
          name: 'moderated_at',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    // Add isRejected column to lists table
    if (!hasIsRejected) {
      await queryRunner.addColumn(
        'lists',
        new TableColumn({
          name: 'is_rejected',
          type: 'boolean',
          default: false,
        }),
      );
    }

    // Add isAutoModerated column to lists table
    if (!hasIsAutoModerated) {
      await queryRunner.addColumn(
        'lists',
        new TableColumn({
          name: 'is_auto_moderated',
          type: 'boolean',
          default: false,
        }),
      );
    }

    // Create indexes for moderation fields
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_lists_is_flagged" ON "lists" ("is_flagged")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_lists_is_rejected" ON "lists" ("is_rejected")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_lists_moderated_at" ON "lists" ("moderated_at")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_lists_is_flagged"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_lists_is_rejected"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_lists_moderated_at"');

    // Drop columns from lists table
    const hasIsFlagged = await this.columnExists(queryRunner, 'lists', 'is_flagged');
    const hasModerationReason = await this.columnExists(queryRunner, 'lists', 'moderation_reason');
    const hasModeratedAt = await this.columnExists(queryRunner, 'lists', 'moderated_at');
    const hasIsRejected = await this.columnExists(queryRunner, 'lists', 'is_rejected');
    const hasIsAutoModerated = await this.columnExists(queryRunner, 'lists', 'is_auto_moderated');

    if (hasIsFlagged) {
      await queryRunner.dropColumn('lists', 'is_flagged');
    }
    
    if (hasModerationReason) {
      await queryRunner.dropColumn('lists', 'moderation_reason');
    }
    
    if (hasModeratedAt) {
      await queryRunner.dropColumn('lists', 'moderated_at');
    }
    
    if (hasIsRejected) {
      await queryRunner.dropColumn('lists', 'is_rejected');
    }
    
    if (hasIsAutoModerated) {
      await queryRunner.dropColumn('lists', 'is_auto_moderated');
    }
  }

  private async columnExists(queryRunner: QueryRunner, table: string, column: string): Promise<boolean> {
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${table}' AND column_name = '${column}'
    `;
    
    const result = await queryRunner.query(checkQuery);
    return result.length > 0;
  }
}