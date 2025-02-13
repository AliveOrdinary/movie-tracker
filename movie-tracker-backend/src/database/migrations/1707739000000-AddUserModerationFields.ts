// src/database/migrations/1707739000000-AddUserModerationFields.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserModerationFields1707739000000 implements MigrationInterface {
    name = 'AddUserModerationFields1707739000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add isBanned column
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "isBanned" boolean NOT NULL DEFAULT false
        `);

        // Add banReason column
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "banReason" text
        `);

        // Add bannedAt column
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMP
        `);

        // Add suspendedUntil column
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "suspendedUntil" TIMESTAMP
        `);

        // Add suspensionReason column
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "suspensionReason" text
        `);

        // Add warningCount column
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "warningCount" integer NOT NULL DEFAULT 0
        `);

        // Add lastWarningReason column
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "lastWarningReason" text
        `);

        // Add lastWarningAt column
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "lastWarningAt" TIMESTAMP
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove all added columns
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "isBanned"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "banReason"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "bannedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "suspendedUntil"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "suspensionReason"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "warningCount"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lastWarningReason"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lastWarningAt"`);
    }
}