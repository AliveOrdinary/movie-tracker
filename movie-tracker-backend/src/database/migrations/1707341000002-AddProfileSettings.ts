import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileSettings1707341000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE profile_visibility_enum AS ENUM ('public', 'private', 'followers')
    `);

    await queryRunner.query(`
      CREATE TYPE watchlist_display_mode_enum AS ENUM ('grid', 'list')
    `);

    await queryRunner.query(`
      CREATE TYPE activity_feed_filter_enum AS ENUM ('all', 'friends', 'reviews')
    `);

    await queryRunner.query(`
      CREATE TYPE reviews_sort_order_enum AS ENUM ('latest', 'rating', 'likes')
    `);

    // Add privacy settings
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "profileVisibility" profile_visibility_enum NOT NULL DEFAULT 'public',
      ADD COLUMN IF NOT EXISTS "showOnlineStatus" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "showActivity" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "allowFriendRequests" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "showWatchlist" boolean NOT NULL DEFAULT true
    `);

    // Add notification preferences
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "emailNotifications" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "reviewNotifications" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "friendRequestNotifications" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "watchlistNotifications" boolean NOT NULL DEFAULT true
    `);

    // Add profile customization
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "bio" text,
      ADD COLUMN IF NOT EXISTS "location" varchar,
      ADD COLUMN IF NOT EXISTS "website" varchar,
      ADD COLUMN IF NOT EXISTS "favoriteGenres" text[],
      ADD COLUMN IF NOT EXISTS "socialLinks" jsonb DEFAULT '{}'::jsonb
    `);

    // Add display preferences
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "watchlistDisplayMode" watchlist_display_mode_enum NOT NULL DEFAULT 'grid',
      ADD COLUMN IF NOT EXISTS "activityFeedFilter" activity_feed_filter_enum NOT NULL DEFAULT 'all',
      ADD COLUMN IF NOT EXISTS "reviewsSortOrder" reviews_sort_order_enum NOT NULL DEFAULT 'latest'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop display preferences columns
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "watchlistDisplayMode",
      DROP COLUMN IF EXISTS "activityFeedFilter",
      DROP COLUMN IF EXISTS "reviewsSortOrder"
    `);

    // Drop profile customization columns
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "bio",
      DROP COLUMN IF EXISTS "location",
      DROP COLUMN IF EXISTS "website",
      DROP COLUMN IF EXISTS "favoriteGenres",
      DROP COLUMN IF EXISTS "socialLinks"
    `);

    // Drop notification preferences columns
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "emailNotifications",
      DROP COLUMN IF EXISTS "reviewNotifications",
      DROP COLUMN IF EXISTS "friendRequestNotifications",
      DROP COLUMN IF EXISTS "watchlistNotifications"
    `);

    // Drop privacy settings columns
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "profileVisibility",
      DROP COLUMN IF EXISTS "showOnlineStatus",
      DROP COLUMN IF EXISTS "showActivity",
      DROP COLUMN IF EXISTS "allowFriendRequests",
      DROP COLUMN IF EXISTS "showWatchlist"
    `);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS reviews_sort_order_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS activity_feed_filter_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS watchlist_display_mode_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS profile_visibility_enum`);
  }
}
