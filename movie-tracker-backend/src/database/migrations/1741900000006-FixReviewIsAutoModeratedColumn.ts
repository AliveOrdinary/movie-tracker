import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class FixReviewIsAutoModeratedColumn1741900000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the isAutoModerated column exists
    const isAutoModeratedExists = await this.columnExists(queryRunner, 'reviews', 'isAutoModerated');
    // Check if the is_auto_moderated column exists
    const isSnakeCaseExists = await this.columnExists(queryRunner, 'reviews', 'is_auto_moderated');

    if (!isAutoModeratedExists && !isSnakeCaseExists) {
      // If neither column exists, add the snake_case version
      await queryRunner.addColumn(
        'reviews',
        new TableColumn({
          name: 'is_auto_moderated',
          type: 'boolean',
          default: false,
        }),
      );
    } else if (isAutoModeratedExists && !isSnakeCaseExists) {
      // If only the camelCase version exists, rename it to snake_case
      await queryRunner.renameColumn('reviews', 'isAutoModerated', 'is_auto_moderated');
    }

    // Check for other columns that need to be renamed
    const columnsToCheck = [
      { camel: 'isFlagged', snake: 'is_flagged' },
      { camel: 'moderationReason', snake: 'moderation_reason' },
      { camel: 'moderatedAt', snake: 'moderated_at' },
    ];

    for (const column of columnsToCheck) {
      const camelExists = await this.columnExists(queryRunner, 'reviews', column.camel);
      const snakeExists = await this.columnExists(queryRunner, 'reviews', column.snake);

      if (camelExists && !snakeExists) {
        // If only the camelCase version exists, rename it to snake_case
        await queryRunner.renameColumn('reviews', column.camel, column.snake);
      } else if (!camelExists && !snakeExists) {
        // If neither column exists, add the snake_case version
        let columnType = 'boolean';
        let isNullable = false;
        let defaultValue: string | boolean | null = false;

        if (column.snake === 'moderation_reason') {
          columnType = 'text';
          isNullable = true;
          // Use a string type for the TableColumn default property
          defaultValue = 'NULL';
        } else if (column.snake === 'moderated_at') {
          columnType = 'timestamp';
          isNullable = true;
          // Use a string type for the TableColumn default property
          defaultValue = 'NULL';
        }

        await queryRunner.addColumn(
          'reviews',
          new TableColumn({
            name: column.snake,
            type: columnType,
            isNullable,
            // Convert boolean to string, otherwise pass the value directly
            default: typeof defaultValue === 'boolean' ? `${defaultValue}` : defaultValue,
          }),
        );
      }
    }

    // Create indexes for the columns
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_reviews_is_flagged" ON "reviews" ("is_flagged")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_reviews_is_auto_moderated" ON "reviews" ("is_auto_moderated")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // We're not undoing these changes as they're fixing column names to match the entity
    // But if needed, we could rename back to camelCase

    // Remove the indexes
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_reviews_is_flagged"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_reviews_is_auto_moderated"');
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