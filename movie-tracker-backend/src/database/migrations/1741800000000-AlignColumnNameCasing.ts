import { MigrationInterface, QueryRunner } from "typeorm";

export class AlignColumnNameCasing1741800000000 implements MigrationInterface {
    name = 'AlignColumnNameCasing1741800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the lists table exists
        const listsTableExists = await queryRunner.hasTable('lists');
        if (listsTableExists) {
            // Check for snake_case column naming and update to camelCase to match entity
            const columns = await queryRunner.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'lists'
            `);
            const columnNames = columns.map((col: any) => col.column_name);
            
            // Check for duplicated columns (both snake_case and camelCase exist)
            // and handle the is_featured/isFeatured conflict
            if (columnNames.includes('is_featured')) {
                if (columnNames.includes('isfeatured') || columnNames.includes('isFeatured')) {
                    // Both columns exist - drop the snake_case version
                    await queryRunner.query(`
                        ALTER TABLE "lists" 
                        DROP COLUMN "is_featured"
                    `);
                    console.log('Dropped duplicate is_featured column since isFeatured already exists');
                } else {
                    // Only snake_case exists - rename it
                    await queryRunner.query(`
                        ALTER TABLE "lists" 
                        RENAME COLUMN "is_featured" TO "isFeatured"
                    `);
                    console.log('Renamed is_featured to isFeatured in lists table');
                }
            }
        }

        // Check if the users table exists and align column names with entity
        const usersTableExists = await queryRunner.hasTable('users');
        if (usersTableExists) {
            const columns = await queryRunner.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users'
            `);
            const columnNames = columns.map((col: any) => col.column_name);
            
            // Map of snake_case to camelCase column names to check and rename
            const columnMappings = {
                'firebase_uid': 'firebaseUid',
                'email_verified': 'emailVerified',
                'avatar_url': 'avatarUrl',
                'created_at': 'createdAt',
                'updated_at': 'updatedAt',
                'last_login_at': 'lastLoginAt',
                'profile_visibility': 'profileVisibility',
                'show_online_status': 'showOnlineStatus',
                'show_activity': 'showActivity',
                'allow_friend_requests': 'allowFriendRequests',
                'show_watchlist': 'showWatchlist',
                'email_notifications': 'emailNotifications',
                'review_notifications': 'reviewNotifications',
                'friend_request_notifications': 'friendRequestNotifications',
                'watchlist_notifications': 'watchlistNotifications',
                'favorite_genres': 'favoriteGenres',
                'social_links': 'socialLinks',
                'watchlist_display_mode': 'watchlistDisplayMode',
                'activity_feed_filter': 'activityFeedFilter',
                'reviews_sort_order': 'reviewsSortOrder',
                'is_banned': 'isBanned',
                'ban_reason': 'banReason',
                'banned_at': 'bannedAt'
            };
            
            // Rename snake_case columns to camelCase if they exist
            for (const [snakeCase, camelCase] of Object.entries(columnMappings)) {
                if (columnNames.includes(snakeCase) && !columnNames.includes(camelCase.toLowerCase())) {
                    try {
                        await queryRunner.query(`
                            ALTER TABLE "users" 
                            RENAME COLUMN "${snakeCase}" TO "${camelCase}"
                        `);
                        console.log(`Renamed ${snakeCase} to ${camelCase} in users table`);
                    } catch (error) {
                        console.error(`Error renaming ${snakeCase} to ${camelCase}: ${error.message}`);
                    }
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert column naming changes (optional, as this is mainly a cleanup migration)
        // In practice, it's better to keep consistent naming going forward
        console.log('No rollback implemented for column name alignment');
    }
}
