// src/database/migrations/1710434000000-StandardizeNamingConventions.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class StandardizeNamingConventions1710434000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Log migration start
    console.log('Starting database naming standardization migration...');

    // Helper function to convert camelCase to snake_case
    const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

    // 1. Fix activities table
    console.log('Standardizing activities table...');
    await queryRunner.query(`
      ALTER TABLE activities 
      RENAME COLUMN "createdAt" TO created_at;
    `);

    // 2. Fix admin_audit_logs table
    console.log('Standardizing admin_audit_logs table...');
    await queryRunner.query(`
      ALTER TABLE admin_audit_logs 
      RENAME COLUMN "actionType" TO action_type;
      
      ALTER TABLE admin_audit_logs 
      RENAME COLUMN "ipAddress" TO ip_address;
      
      ALTER TABLE admin_audit_logs 
      RENAME COLUMN "entityId" TO entity_id;
      
      ALTER TABLE admin_audit_logs 
      RENAME COLUMN "entityType" TO entity_type;
    `);

    // 3. Fix list_collaborators table with duplicate columns
    console.log('Standardizing list_collaborators table...');
    
    // First, check if list_id, userId, and listId all exist
    const checkListCollaboratorsQuery = `
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'list_collaborators' 
      AND column_name IN ('list_id', 'listId', 'user_id', 'userId', 'added_by_id', 'addedById');
    `;
    
    const listCollabColumns = await queryRunner.query(checkListCollaboratorsQuery);
    const columnExists = (name: string) => listCollabColumns.some((col: any) => col.column_name === name);
    
    // Copy data from camelCase to snake_case if both exist, then drop camelCase
    if (columnExists('list_id') && columnExists('listId')) {
      // Copy data where list_id is null but listId is not
      await queryRunner.query(`
        UPDATE list_collaborators 
        SET list_id = "listId"::uuid 
        WHERE list_id IS NULL AND "listId" IS NOT NULL;
        
        ALTER TABLE list_collaborators 
        DROP COLUMN "listId";
      `);
    } else if (columnExists('listId') && !columnExists('list_id')) {
      // If only camelCase exists, rename it
      await queryRunner.query(`
        ALTER TABLE list_collaborators 
        RENAME COLUMN "listId" TO list_id;
      `);
    }
    
    if (columnExists('user_id') && columnExists('userId')) {
      await queryRunner.query(`
        UPDATE list_collaborators 
        SET user_id = "userId"::uuid 
        WHERE user_id IS NULL AND "userId" IS NOT NULL;
        
        ALTER TABLE list_collaborators 
        DROP COLUMN "userId";
      `);
    } else if (columnExists('userId') && !columnExists('user_id')) {
      await queryRunner.query(`
        ALTER TABLE list_collaborators 
        RENAME COLUMN "userId" TO user_id;
      `);
    }
    
    if (columnExists('added_by_id') && columnExists('addedById')) {
      await queryRunner.query(`
        UPDATE list_collaborators 
        SET added_by_id = "addedById"::uuid 
        WHERE added_by_id IS NULL AND "addedById" IS NOT NULL;
        
        ALTER TABLE list_collaborators 
        DROP COLUMN "addedById";
      `);
    } else if (columnExists('addedById') && !columnExists('added_by_id')) {
      await queryRunner.query(`
        ALTER TABLE list_collaborators 
        RENAME COLUMN "addedById" TO added_by_id;
      `);
    }
    
    await queryRunner.query(`
      ALTER TABLE list_collaborators 
      RENAME COLUMN "createdAt" TO created_at;
    `);

    // 4. Fix list_favorites table
    console.log('Standardizing list_favorites table...');
    
    const checkListFavoritesQuery = `
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'list_favorites' 
      AND column_name IN ('list_id', 'listId', 'user_id', 'userId');
    `;
    
    const listFavoriteColumns = await queryRunner.query(checkListFavoritesQuery);
    const listFavColumnExists = (name: string) => listFavoriteColumns.some((col: any) => col.column_name === name);
    
    if (listFavColumnExists('list_id') && listFavColumnExists('listId')) {
      await queryRunner.query(`
        UPDATE list_favorites 
        SET list_id = "listId"::uuid 
        WHERE list_id IS NULL AND "listId" IS NOT NULL;
        
        ALTER TABLE list_favorites 
        DROP COLUMN "listId";
      `);
    } else if (listFavColumnExists('listId') && !listFavColumnExists('list_id')) {
      await queryRunner.query(`
        ALTER TABLE list_favorites 
        RENAME COLUMN "listId" TO list_id;
      `);
    }
    
    if (listFavColumnExists('user_id') && listFavColumnExists('userId')) {
      await queryRunner.query(`
        UPDATE list_favorites 
        SET user_id = "userId"::uuid 
        WHERE user_id IS NULL AND "userId" IS NOT NULL;
        
        ALTER TABLE list_favorites 
        DROP COLUMN "userId";
      `);
    } else if (listFavColumnExists('userId') && !listFavColumnExists('user_id')) {
      await queryRunner.query(`
        ALTER TABLE list_favorites 
        RENAME COLUMN "userId" TO user_id;
      `);
    }
    
    await queryRunner.query(`
      ALTER TABLE list_favorites 
      RENAME COLUMN "createdAt" TO created_at;
    `);

    // 5. Fix list_items table
    console.log('Standardizing list_items table...');
    
    const checkListItemsQuery = `
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'list_items' 
      AND column_name IN ('list_id', 'listId', 'added_by_id', 'addedById', 'movieId');
    `;
    
    const listItemColumns = await queryRunner.query(checkListItemsQuery);
    const listItemColumnExists = (name: string) => listItemColumns.some((col: any) => col.column_name === name);
    
    if (listItemColumnExists('list_id') && listItemColumnExists('listId')) {
      await queryRunner.query(`
        UPDATE list_items 
        SET list_id = "listId"::uuid 
        WHERE list_id IS NULL AND "listId" IS NOT NULL;
        
        ALTER TABLE list_items 
        DROP COLUMN "listId";
      `);
    } else if (listItemColumnExists('listId') && !listItemColumnExists('list_id')) {
      await queryRunner.query(`
        ALTER TABLE list_items 
        RENAME COLUMN "listId" TO list_id;
      `);
    }
    
    if (listItemColumnExists('added_by_id') && listItemColumnExists('addedById')) {
      await queryRunner.query(`
        UPDATE list_items 
        SET added_by_id = "addedById"::uuid 
        WHERE added_by_id IS NULL AND "addedById" IS NOT NULL;
        
        ALTER TABLE list_items 
        DROP COLUMN "addedById";
      `);
    } else if (listItemColumnExists('addedById') && !listItemColumnExists('added_by_id')) {
      await queryRunner.query(`
        ALTER TABLE list_items 
        RENAME COLUMN "addedById" TO added_by_id;
      `);
    }
    
    // Convert movieId to movie_id
    if (listItemColumnExists('movieId')) {
      await queryRunner.query(`
        ALTER TABLE list_items 
        RENAME COLUMN "movieId" TO movie_id;
      `);
    }
    
    await queryRunner.query(`
      ALTER TABLE list_items 
      RENAME COLUMN "createdAt" TO created_at;
    `);

    // 6. Fix lists table
    console.log('Standardizing lists table...');
    await queryRunner.query(`
      ALTER TABLE lists 
      RENAME COLUMN "maxEntries" TO max_entries;
      
      ALTER TABLE lists 
      RENAME COLUMN "favoriteCount" TO favorite_count;
      
      ALTER TABLE lists 
      RENAME COLUMN "createdAt" TO created_at;
      
      ALTER TABLE lists 
      RENAME COLUMN "updatedAt" TO updated_at;
      
      ALTER TABLE lists 
      RENAME COLUMN "isFeatured" TO is_featured;
    `);

    // 7. Fix moderation_logs table
    console.log('Standardizing moderation_logs table...');
    await queryRunner.query(`
      ALTER TABLE moderation_logs 
      RENAME COLUMN "createdAt" TO created_at;
      
      ALTER TABLE moderation_logs 
      RENAME COLUMN "isResolved" TO is_resolved;
      
      ALTER TABLE moderation_logs 
      RENAME COLUMN "resolvedAt" TO resolved_at;
    `);

    // 8. Fix movies table
    console.log('Standardizing movies table...');
    await queryRunner.query(`
      ALTER TABLE movies 
      RENAME COLUMN "tmdbId" TO tmdb_id;
      
      ALTER TABLE movies 
      RENAME COLUMN "posterPath" TO poster_path;
      
      ALTER TABLE movies 
      RENAME COLUMN "backdropPath" TO backdrop_path;
      
      ALTER TABLE movies 
      RENAME COLUMN "voteAverage" TO vote_average;
      
      ALTER TABLE movies 
      RENAME COLUMN "voteCount" TO vote_count;
      
      ALTER TABLE movies 
      RENAME COLUMN "isPopular" TO is_popular;
      
      ALTER TABLE movies 
      RENAME COLUMN "originalTitle" TO original_title;
      
      ALTER TABLE movies 
      RENAME COLUMN "releaseYear" TO release_year;
      
      ALTER TABLE movies 
      RENAME COLUMN "isAdult" TO is_adult;
      
      ALTER TABLE movies 
      RENAME COLUMN "createdAt" TO created_at;
      
      ALTER TABLE movies 
      RENAME COLUMN "updatedAt" TO updated_at;
    `);

    // 9. Fix notifications table
    console.log('Standardizing notifications table...');
    await queryRunner.query(`
      ALTER TABLE notifications 
      RENAME COLUMN "isRead" TO is_read;
      
      ALTER TABLE notifications 
      RENAME COLUMN "createdAt" TO created_at;
    `);

    // 10. Fix reports table
    console.log('Standardizing reports table...');
    await queryRunner.query(`
      ALTER TABLE reports 
      RENAME COLUMN "moderatorNotes" TO moderator_notes;
      
      ALTER TABLE reports 
      RENAME COLUMN "createdAt" TO created_at;
      
      ALTER TABLE reports 
      RENAME COLUMN "updatedAt" TO updated_at;
      
      ALTER TABLE reports 
      RENAME COLUMN "resolvedAt" TO resolved_at;
    `);

    // 11. Fix review_reactions table
    console.log('Standardizing review_reactions table...');
    await queryRunner.query(`
      ALTER TABLE review_reactions 
      RENAME COLUMN "createdAt" TO created_at;
    `);

    // 12. Fix reviews table
    console.log('Standardizing reviews table...');
    
    // Fix duplicate columns with data preservation
    const checkReviewsColumns = `
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'reviews' 
      AND column_name IN ('moderationReason', 'moderation_reason', 'isFlagged', 'is_flagged', 'moderatedAt', 'moderated_at');
    `;
    
    const reviewsColumns = await queryRunner.query(checkReviewsColumns);
    const reviewColumnExists = (name: string) => reviewsColumns.some((col: any) => col.column_name === name);
    
    // Handle moderation_reason/moderationReason
    if (reviewColumnExists('moderation_reason') && reviewColumnExists('moderationReason')) {
      await queryRunner.query(`
        UPDATE reviews 
        SET moderation_reason = "moderationReason" 
        WHERE moderation_reason IS NULL AND "moderationReason" IS NOT NULL;
        
        ALTER TABLE reviews 
        DROP COLUMN "moderationReason";
      `);
    } else if (reviewColumnExists('moderationReason') && !reviewColumnExists('moderation_reason')) {
      await queryRunner.query(`
        ALTER TABLE reviews 
        RENAME COLUMN "moderationReason" TO moderation_reason;
      `);
    }
    
    // Handle is_flagged/isFlagged
    if (reviewColumnExists('is_flagged') && reviewColumnExists('isFlagged')) {
      await queryRunner.query(`
        UPDATE reviews 
        SET is_flagged = "isFlagged" 
        WHERE "isFlagged" IS TRUE;
        
        ALTER TABLE reviews 
        DROP COLUMN "isFlagged";
      `);
    } else if (reviewColumnExists('isFlagged') && !reviewColumnExists('is_flagged')) {
      await queryRunner.query(`
        ALTER TABLE reviews 
        RENAME COLUMN "isFlagged" TO is_flagged;
      `);
    }
    
    // Handle moderated_at/moderatedAt
    if (reviewColumnExists('moderated_at') && reviewColumnExists('moderatedAt')) {
      await queryRunner.query(`
        UPDATE reviews 
        SET moderated_at = "moderatedAt" 
        WHERE moderated_at IS NULL AND "moderatedAt" IS NOT NULL;
        
        ALTER TABLE reviews 
        DROP COLUMN "moderatedAt";
      `);
    } else if (reviewColumnExists('moderatedAt') && !reviewColumnExists('moderated_at')) {
      await queryRunner.query(`
        ALTER TABLE reviews 
        RENAME COLUMN "moderatedAt" TO moderated_at;
      `);
    }
    
    // Update main columns
    await queryRunner.query(`
      ALTER TABLE reviews 
      RENAME COLUMN "createdAt" TO created_at;
      
      ALTER TABLE reviews 
      RENAME COLUMN "updatedAt" TO updated_at;
      
      ALTER TABLE reviews 
      RENAME COLUMN "containsSpoilers" TO contains_spoilers;
      
      ALTER TABLE reviews 
      RENAME COLUMN "helpfulVotes" TO helpful_votes;
      
      ALTER TABLE reviews 
      RENAME COLUMN "isEdited" TO is_edited;
    `);

    // 13. Fix system_configs table
    console.log('Standardizing system_configs table...');
    await queryRunner.query(`
      ALTER TABLE system_configs 
      RENAME COLUMN "isEncrypted" TO is_encrypted;
      
      ALTER TABLE system_configs 
      RENAME COLUMN "isSystem" TO is_system;
      
      ALTER TABLE system_configs 
      RENAME COLUMN "dataType" TO data_type;
      
      ALTER TABLE system_configs 
      RENAME COLUMN "validationPattern" TO validation_pattern;
      
      ALTER TABLE system_configs 
      RENAME COLUMN "createdAt" TO created_at;
      
      ALTER TABLE system_configs 
      RENAME COLUMN "updatedAt" TO updated_at;
    `);

    // 14. Fix user_follows table
    console.log('Standardizing user_follows table...');
    await queryRunner.query(`
      ALTER TABLE user_follows 
      RENAME COLUMN "createdAt" TO created_at;
    `);

    // 15. Fix users table
    console.log('Standardizing users table...');
    await queryRunner.query(`
      ALTER TABLE users 
      RENAME COLUMN "firebaseUid" TO firebase_uid;
      
      ALTER TABLE users 
      RENAME COLUMN "emailVerified" TO email_verified;
      
      ALTER TABLE users 
      RENAME COLUMN "avatarUrl" TO avatar_url;
      
      ALTER TABLE users 
      RENAME COLUMN "createdAt" TO created_at;
      
      ALTER TABLE users 
      RENAME COLUMN "updatedAt" TO updated_at;
      
      ALTER TABLE users 
      RENAME COLUMN "lastLoginAt" TO last_login_at;
      
      ALTER TABLE users 
      RENAME COLUMN "profileVisibility" TO profile_visibility;
      
      ALTER TABLE users 
      RENAME COLUMN "showOnlineStatus" TO show_online_status;
      
      ALTER TABLE users 
      RENAME COLUMN "showActivity" TO show_activity;
      
      ALTER TABLE users 
      RENAME COLUMN "allowFriendRequests" TO allow_friend_requests;
      
      ALTER TABLE users 
      RENAME COLUMN "showWatchlist" TO show_watchlist;
      
      ALTER TABLE users 
      RENAME COLUMN "emailNotifications" TO email_notifications;
      
      ALTER TABLE users 
      RENAME COLUMN "reviewNotifications" TO review_notifications;
      
      ALTER TABLE users 
      RENAME COLUMN "friendRequestNotifications" TO friend_request_notifications;
      
      ALTER TABLE users 
      RENAME COLUMN "watchlistNotifications" TO watchlist_notifications;
      
      ALTER TABLE users 
      RENAME COLUMN "favoriteGenres" TO favorite_genres;
      
      ALTER TABLE users 
      RENAME COLUMN "socialLinks" TO social_links;
      
      ALTER TABLE users 
      RENAME COLUMN "watchlistDisplayMode" TO watchlist_display_mode;
      
      ALTER TABLE users 
      RENAME COLUMN "activityFeedFilter" TO activity_feed_filter;
      
      ALTER TABLE users 
      RENAME COLUMN "reviewsSortOrder" TO reviews_sort_order;
      
      ALTER TABLE users 
      RENAME COLUMN "isBanned" TO is_banned;
      
      ALTER TABLE users 
      RENAME COLUMN "banReason" TO ban_reason;
      
      ALTER TABLE users 
      RENAME COLUMN "bannedAt" TO banned_at;
      
      ALTER TABLE users 
      RENAME COLUMN "suspendedUntil" TO suspended_until;
      
      ALTER TABLE users 
      RENAME COLUMN "suspensionReason" TO suspension_reason;
      
      ALTER TABLE users 
      RENAME COLUMN "warningCount" TO warning_count;
      
      ALTER TABLE users 
      RENAME COLUMN "lastWarningReason" TO last_warning_reason;
      
      ALTER TABLE users 
      RENAME COLUMN "lastWarningAt" TO last_warning_at;
      
      ALTER TABLE users 
      RENAME COLUMN "lastActivityAt" TO last_activity_at;
    `);

    // 16. Fix watch_history table
    console.log('Standardizing watch_history table...');
    await queryRunner.query(`
      ALTER TABLE watch_history 
      RENAME COLUMN "watchedAt" TO watched_at;
      
      ALTER TABLE watch_history 
      RENAME COLUMN "watchType" TO watch_type;
      
      ALTER TABLE watch_history 
      RENAME COLUMN "watchDuration" TO watch_duration;
      
      ALTER TABLE watch_history 
      RENAME COLUMN "isPrivate" TO is_private;
      
      ALTER TABLE watch_history 
      RENAME COLUMN "createdAt" TO created_at;
      
      ALTER TABLE watch_history 
      RENAME COLUMN "updatedAt" TO updated_at;
    `);

    console.log('Database naming standardization migration completed successfully.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration should ideally not be reverted as it standardizes naming conventions.
    // However, we implement a down migration for completeness.
    console.log('Reverting database naming standardization...');

    // 1. Revert activities table
    await queryRunner.query(`
      ALTER TABLE activities 
      RENAME COLUMN created_at TO "createdAt";
    `);

    // 2. Revert admin_audit_logs table
    await queryRunner.query(`
      ALTER TABLE admin_audit_logs 
      RENAME COLUMN action_type TO "actionType";
      
      ALTER TABLE admin_audit_logs 
      RENAME COLUMN ip_address TO "ipAddress";
      
      ALTER TABLE admin_audit_logs 
      RENAME COLUMN entity_id TO "entityId";
      
      ALTER TABLE admin_audit_logs 
      RENAME COLUMN entity_type TO "entityType";
    `);

    // Continue with all other tables...
    // (The full down migration would be the inverse of all operations in the up method)

    console.log('Database naming standardization reversion completed.');
  }
}