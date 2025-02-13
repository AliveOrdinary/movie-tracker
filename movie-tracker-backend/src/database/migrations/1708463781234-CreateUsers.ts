import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsers1708463781234 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types conditionally
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
          CREATE TYPE "user_role_enum" AS ENUM ('user', 'admin', 'moderator');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_visibility_enum') THEN
          CREATE TYPE "profile_visibility_enum" AS ENUM ('public', 'private', 'friends');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'watchlist_display_mode_enum') THEN
          CREATE TYPE "watchlist_display_mode_enum" AS ENUM ('grid', 'list', 'compact');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_feed_filter_enum') THEN
          CREATE TYPE "activity_feed_filter_enum" AS ENUM ('all', 'reviews', 'ratings', 'watchlist');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reviews_sort_order_enum') THEN
          CREATE TYPE "reviews_sort_order_enum" AS ENUM ('latest', 'oldest', 'rating_high', 'rating_low');
        END IF;
      END$$;
    `);

    // Check if users table already exists
    const tableExists = await queryRunner.hasTable('users');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'users',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'firebase_uid',
              type: 'varchar',
              isUnique: true,
            },
            {
              name: 'username',
              type: 'varchar',
            },
            {
              name: 'email',
              type: 'varchar',
              isUnique: true,
            },
            {
              name: 'roles',
              type: 'user_role_enum',
              isArray: true,
              default: "'{user}'",
            },
            {
              name: 'profile_visibility',
              type: 'profile_visibility_enum',
              default: "'public'",
            },
            {
              name: 'show_online_status',
              type: 'boolean',
              default: false,
            },
            {
              name: 'show_activity',
              type: 'boolean',
              default: true,
            },
            {
              name: 'allow_friend_requests',
              type: 'boolean',
              default: true,
            },
            {
              name: 'show_watchlist',
              type: 'boolean',
              default: true,
            },
            {
              name: 'email_notifications',
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
              name: 'bio',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'location',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'website',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'favorite_genres',
              type: 'text',
              isArray: true,
              isNullable: true,
            },
            {
              name: 'social_links',
              type: 'jsonb',
              default: "'{}'",
            },
            {
              name: 'watchlist_display_mode',
              type: 'watchlist_display_mode_enum',
              default: "'grid'",
            },
            {
              name: 'activity_feed_filter',
              type: 'activity_feed_filter_enum',
              default: "'all'",
            },
            {
              name: 'reviews_sort_order',
              type: 'reviews_sort_order_enum',
              default: "'latest'",
            },
            {
              name: 'email_verified',
              type: 'boolean',
              default: false,
            },
            {
              name: 'avatar_url',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'is_banned',
              type: 'boolean',
              default: false,
            },
            {
              name: 'ban_reason',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'banned_at',
              type: 'timestamp',
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
              name: 'last_login_at',
              type: 'timestamp',
              isNullable: true,
            },
          ],
        }),
        true,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true, true, true);

    // Only drop enums if they exist and are not used by other tables
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'user_role_enum'
          AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE udt_name = 'user_role_enum' 
            AND table_name != 'users'
          )
        ) THEN
          DROP TYPE IF EXISTS "user_role_enum";
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'profile_visibility_enum'
          AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE udt_name = 'profile_visibility_enum' 
            AND table_name != 'users'
          )
        ) THEN
          DROP TYPE IF EXISTS "profile_visibility_enum";
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'watchlist_display_mode_enum'
          AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE udt_name = 'watchlist_display_mode_enum' 
            AND table_name != 'users'
          )
        ) THEN
          DROP TYPE IF EXISTS "watchlist_display_mode_enum";
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'activity_feed_filter_enum'
          AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE udt_name = 'activity_feed_filter_enum' 
            AND table_name != 'users'
          )
        ) THEN
          DROP TYPE IF EXISTS "activity_feed_filter_enum";
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'reviews_sort_order_enum'
          AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE udt_name = 'reviews_sort_order_enum' 
            AND table_name != 'users'
          )
        ) THEN
          DROP TYPE IF EXISTS "reviews_sort_order_enum";
        END IF;
      END$$;
    `);
  }
}