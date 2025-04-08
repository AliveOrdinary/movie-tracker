// src/database/migrations/1744000000000-FixAllEnumCasesToUppercase.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAllEnumCasesToUppercase1744000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fix ProfileVisibility enum
    await queryRunner.query(`
      -- Create a new enum type with uppercase values
      CREATE TYPE profile_visibility_enum_new AS ENUM ('PUBLIC', 'PRIVATE', 'FRIENDS_ONLY');
      
      -- Add a temporary column with text type to hold the new values
      ALTER TABLE users ADD COLUMN profile_visibility_temp text;
      
      -- Convert existing values to uppercase
      UPDATE users 
      SET profile_visibility_temp = 
        CASE 
          WHEN profile_visibility = 'public' THEN 'PUBLIC'
          WHEN profile_visibility = 'private' THEN 'PRIVATE'
          WHEN profile_visibility = 'friends_only' THEN 'FRIENDS_ONLY'
        END;
      
      -- Drop the old column and constraint
      ALTER TABLE users DROP COLUMN profile_visibility;
      
      -- Add the new column with the new enum type
      ALTER TABLE users ADD COLUMN profile_visibility profile_visibility_enum_new NOT NULL DEFAULT 'PUBLIC';
      
      -- Populate the new column with converted values
      UPDATE users 
      SET profile_visibility = profile_visibility_temp::profile_visibility_enum_new;
      
      -- Drop the temporary column
      ALTER TABLE users DROP COLUMN profile_visibility_temp;
      
      -- Drop the old enum type and rename the new one
      DROP TYPE IF EXISTS profile_visibility_enum;
      ALTER TYPE profile_visibility_enum_new RENAME TO profile_visibility_enum;
    `);

    // Fix WatchlistDisplayMode enum
    await queryRunner.query(`
      -- Create a new enum type with uppercase values
      CREATE TYPE watchlist_display_mode_enum_new AS ENUM ('LIST', 'GRID', 'DETAIL');
      
      -- Add a temporary column with text type to hold the new values
      ALTER TABLE users ADD COLUMN watchlist_display_mode_temp text;
      
      -- Convert existing values to uppercase
      UPDATE users 
      SET watchlist_display_mode_temp = 
        CASE 
          WHEN watchlist_display_mode = 'list' THEN 'LIST'
          WHEN watchlist_display_mode = 'grid' THEN 'GRID'
          WHEN watchlist_display_mode = 'detail' THEN 'DETAIL'
        END;
      
      -- Drop the old column and constraint
      ALTER TABLE users DROP COLUMN watchlist_display_mode;
      
      -- Add the new column with the new enum type
      ALTER TABLE users ADD COLUMN watchlist_display_mode watchlist_display_mode_enum_new NOT NULL DEFAULT 'GRID';
      
      -- Populate the new column with converted values
      UPDATE users 
      SET watchlist_display_mode = watchlist_display_mode_temp::watchlist_display_mode_enum_new;
      
      -- Drop the temporary column
      ALTER TABLE users DROP COLUMN watchlist_display_mode_temp;
      
      -- Drop the old enum type and rename the new one
      DROP TYPE IF EXISTS watchlist_display_mode_enum;
      ALTER TYPE watchlist_display_mode_enum_new RENAME TO watchlist_display_mode_enum;
    `);

    // Fix ActivityFeedFilter enum
    await queryRunner.query(`
      -- Create a new enum type with uppercase values
      CREATE TYPE activity_feed_filter_enum_new AS ENUM ('ALL', 'FRIENDS', 'REVIEWS');
      
      -- Add a temporary column with text type to hold the new values
      ALTER TABLE users ADD COLUMN activity_feed_filter_temp text;
      
      -- Convert existing values to uppercase
      UPDATE users 
      SET activity_feed_filter_temp = 
        CASE 
          WHEN activity_feed_filter = 'all' THEN 'ALL'
          WHEN activity_feed_filter = 'friends' THEN 'FRIENDS'
          WHEN activity_feed_filter = 'reviews' THEN 'REVIEWS'
        END;
      
      -- Drop the old column and constraint
      ALTER TABLE users DROP COLUMN activity_feed_filter;
      
      -- Add the new column with the new enum type
      ALTER TABLE users ADD COLUMN activity_feed_filter activity_feed_filter_enum_new NOT NULL DEFAULT 'ALL';
      
      -- Populate the new column with converted values
      UPDATE users 
      SET activity_feed_filter = activity_feed_filter_temp::activity_feed_filter_enum_new;
      
      -- Drop the temporary column
      ALTER TABLE users DROP COLUMN activity_feed_filter_temp;
      
      -- Drop the old enum type and rename the new one
      DROP TYPE IF EXISTS activity_feed_filter_enum;
      ALTER TYPE activity_feed_filter_enum_new RENAME TO activity_feed_filter_enum;
    `);

    // Fix ReviewsSortOrder enum
    await queryRunner.query(`
      -- Create a new enum type with uppercase values
      CREATE TYPE reviews_sort_order_enum_new AS ENUM ('LATEST', 'OLDEST', 'RATING_HIGH', 'RATING_LOW', 'MOST_POPULAR');
      
      -- Add a temporary column with text type to hold the new values
      ALTER TABLE users ADD COLUMN reviews_sort_order_temp text;
      
      -- Convert existing values to uppercase
      UPDATE users 
      SET reviews_sort_order_temp = 
        CASE 
          WHEN reviews_sort_order = 'latest' THEN 'LATEST'
          WHEN reviews_sort_order = 'oldest' THEN 'OLDEST'
          WHEN reviews_sort_order = 'rating_high' THEN 'RATING_HIGH'
          WHEN reviews_sort_order = 'rating_low' THEN 'RATING_LOW'
          WHEN reviews_sort_order = 'most_popular' THEN 'MOST_POPULAR'
        END;
      
      -- Drop the old column and constraint
      ALTER TABLE users DROP COLUMN reviews_sort_order;
      
      -- Add the new column with the new enum type
      ALTER TABLE users ADD COLUMN reviews_sort_order reviews_sort_order_enum_new NOT NULL DEFAULT 'LATEST';
      
      -- Populate the new column with converted values
      UPDATE users 
      SET reviews_sort_order = reviews_sort_order_temp::reviews_sort_order_enum_new;
      
      -- Drop the temporary column
      ALTER TABLE users DROP COLUMN reviews_sort_order_temp;
      
      -- Drop the old enum type and rename the new one
      DROP TYPE IF EXISTS reviews_sort_order_enum;
      ALTER TYPE reviews_sort_order_enum_new RENAME TO reviews_sort_order_enum;
    `);

    // Fix ListType enum
    await queryRunner.query(`
      -- Create a new enum type with uppercase values
      CREATE TYPE lists_type_enum_new AS ENUM ('STANDARD', 'CUSTOM');
      
      -- Add a temporary column with text type to hold the new values
      ALTER TABLE lists ADD COLUMN type_temp text;
      
      -- Convert existing values to uppercase
      UPDATE lists 
      SET type_temp = 
        CASE 
          WHEN type = 'standard' THEN 'STANDARD'
          WHEN type = 'custom' THEN 'CUSTOM'
        END;
      
      -- Drop the old column and constraint
      ALTER TABLE lists DROP COLUMN type;
      
      -- Add the new column with the new enum type
      ALTER TABLE lists ADD COLUMN type lists_type_enum_new NOT NULL DEFAULT 'CUSTOM';
      
      -- Populate the new column with converted values
      UPDATE lists 
      SET type = type_temp::lists_type_enum_new;
      
      -- Drop the temporary column
      ALTER TABLE lists DROP COLUMN type_temp;
      
      -- Drop the old enum type and rename the new one
      DROP TYPE IF EXISTS lists_type_enum;
      ALTER TYPE lists_type_enum_new RENAME TO lists_type_enum;
    `);

    // Fix ListPrivacy enum
    await queryRunner.query(`
      -- Create a new enum type with uppercase values
      CREATE TYPE lists_privacy_enum_new AS ENUM ('PUBLIC', 'PRIVATE', 'FOLLOWING');
      
      -- Add a temporary column with text type to hold the new values
      ALTER TABLE lists ADD COLUMN privacy_temp text;
      
      -- Convert existing values to uppercase
      UPDATE lists 
      SET privacy_temp = 
        CASE 
          WHEN privacy = 'public' THEN 'PUBLIC'
          WHEN privacy = 'private' THEN 'PRIVATE'
          WHEN privacy = 'following' THEN 'FOLLOWING'
        END;
      
      -- Drop the old column and constraint
      ALTER TABLE lists DROP COLUMN privacy;
      
      -- Add the new column with the new enum type
      ALTER TABLE lists ADD COLUMN privacy lists_privacy_enum_new NOT NULL DEFAULT 'PRIVATE';
      
      -- Populate the new column with converted values
      UPDATE lists 
      SET privacy = privacy_temp::lists_privacy_enum_new;
      
      -- Drop the temporary column
      ALTER TABLE lists DROP COLUMN privacy_temp;
      
      -- Drop the old enum type and rename the new one
      DROP TYPE IF EXISTS lists_privacy_enum;
      ALTER TYPE lists_privacy_enum_new RENAME TO lists_privacy_enum;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a one-way migration - no rollback provided
    console.log('This migration cannot be reverted as it normalizes enum values');
  }
}
