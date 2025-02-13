// src/database/migrations/1707739100000-AddMissingUserColumns.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingUserColumns1707739100000 implements MigrationInterface {
    name = 'AddMissingUserColumns1707739100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add lastActivityAt column
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP
        `);

        // Add lastLoginAt column if not exists
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP
        `);

        // Add emailVerified column if not exists
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false
        `);

        // Add avatarUrl column if not exists
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "avatarUrl" text
        `);

        // Add profile settings columns if they don't exist
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "profileVisibility" text NOT NULL DEFAULT 'PUBLIC'
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "showOnlineStatus" boolean NOT NULL DEFAULT false
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "showActivity" boolean NOT NULL DEFAULT true
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "allowFriendRequests" boolean NOT NULL DEFAULT true
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "showWatchlist" boolean NOT NULL DEFAULT true
        `);

        // Add notification settings columns if they don't exist
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "emailNotifications" boolean NOT NULL DEFAULT true
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "reviewNotifications" boolean NOT NULL DEFAULT true
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "friendRequestNotifications" boolean NOT NULL DEFAULT true
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "watchlistNotifications" boolean NOT NULL DEFAULT true
        `);

        // Add display preference columns if they don't exist
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "watchlistDisplayMode" text NOT NULL DEFAULT 'GRID'
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "activityFeedFilter" text NOT NULL DEFAULT 'ALL'
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "reviewsSortOrder" text NOT NULL DEFAULT 'LATEST'
        `);

        // Add profile information columns if they don't exist
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "bio" text
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "location" text
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "website" text
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "favoriteGenres" text[]
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "socialLinks" jsonb DEFAULT '{}'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove all added columns
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lastActivityAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lastLoginAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerified"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "avatarUrl"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "profileVisibility"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "showOnlineStatus"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "showActivity"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "allowFriendRequests"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "showWatchlist"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailNotifications"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "reviewNotifications"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "friendRequestNotifications"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "watchlistNotifications"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "watchlistDisplayMode"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "activityFeedFilter"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "reviewsSortOrder"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "bio"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "location"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "website"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "favoriteGenres"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "socialLinks"`);
    }
}