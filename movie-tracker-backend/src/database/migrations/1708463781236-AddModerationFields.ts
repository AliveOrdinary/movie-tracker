import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddModerationFields1708463781236 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to users table
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'suspended_until',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'suspension_reason',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'warning_count',
        type: 'integer',
        default: 0,
      }),
      new TableColumn({
        name: 'last_warning_reason',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'last_warning_at',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'last_activity_at',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'is_banned',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'ban_reason',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'banned_at',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);

    // Create review_status enum if it doesn't exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status_enum') THEN
          CREATE TYPE "review_status_enum" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');
        END IF;
      END$$;
    `);

    // Add movie_id column first
    await queryRunner.addColumn(
      'reviews',
      new TableColumn({
        name: 'movie_id',
        type: 'uuid',
        isNullable: true, // Initially allow null for existing records
      }),
    );

    // Add new columns to reviews table
    await queryRunner.addColumns('reviews', [
      new TableColumn({
        name: 'status',
        type: 'review_status_enum',
        default: "'PENDING'",
      }),
      new TableColumn({
        name: 'moderation_reason',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'moderated_at',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'tags',
        type: 'text',
        isArray: true,
        isNullable: true,
      }),
      new TableColumn({
        name: 'contains_spoilers',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'helpful_votes',
        type: 'integer',
        default: 0,
      }),
      new TableColumn({
        name: 'is_edited',
        type: 'boolean',
        default: false,
      }),
    ]);

    // Create indexes one by one to better handle errors
    await queryRunner.query('CREATE INDEX "IDX_users_warning_count" ON "users" ("warning_count")');
    await queryRunner.query('CREATE INDEX "IDX_users_suspended_until" ON "users" ("suspended_until")');
    await queryRunner.query('CREATE INDEX "IDX_users_is_banned" ON "users" ("is_banned")');
    await queryRunner.query('CREATE INDEX "IDX_reviews_status" ON "reviews" ("status")');
    await queryRunner.query('CREATE INDEX "IDX_reviews_moderated_at" ON "reviews" ("moderated_at")');
    await queryRunner.query('CREATE INDEX "IDX_reviews_helpful_votes" ON "reviews" ("helpful_votes")');
    await queryRunner.query('CREATE INDEX "IDX_reviews_movie_id" ON "reviews" ("movie_id")');

    // Check if movies table exists before creating foreign key
    const tableExists = await queryRunner.hasTable('movies');
    if (tableExists) {
      await queryRunner.createForeignKey(
        'reviews',
        new TableForeignKey({
          name: 'FK_reviews_movie_id',
          columnNames: ['movie_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'movies',
          onDelete: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_warning_count"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_suspended_until"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_is_banned"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_reviews_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_reviews_moderated_at"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_reviews_helpful_votes"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_reviews_movie_id"');

    // Drop foreign key if it exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_name = 'reviews' AND constraint_name = 'FK_reviews_movie_id'
        ) THEN
          ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_movie_id";
        END IF;
      END$$;
    `);

    // Drop columns from users table
    await queryRunner.dropColumns('users', [
      'suspended_until',
      'suspension_reason',
      'warning_count',
      'last_warning_reason',
      'last_warning_at',
      'last_activity_at',
      'is_banned',
      'ban_reason',
      'banned_at',
    ]);

    // Drop columns from reviews table
    await queryRunner.dropColumns('reviews', [
      'movie_id',
      'status',
      'moderation_reason',
      'moderated_at',
      'tags',
      'contains_spoilers',
      'helpful_votes',
      'is_edited',
    ]);

    // Drop review_status enum if it exists and is not used
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'review_status_enum'
          AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE udt_name = 'review_status_enum'
          )
        ) THEN
          DROP TYPE "review_status_enum";
        END IF;
      END$$;
    `);
  }
}