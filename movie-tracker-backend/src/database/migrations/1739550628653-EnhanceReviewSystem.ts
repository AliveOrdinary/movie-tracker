// src/database/migrations/1739550628653-EnhanceReviewSystem.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class EnhanceReviewSystem1739550628653 implements MigrationInterface {
    name = 'EnhanceReviewSystem1739550628653'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First check and create enum types if they don't exist
        const checkEnumExists = async (enumName: string): Promise<boolean> => {
            const result = await queryRunner.query(
                `SELECT EXISTS (
                    SELECT 1 FROM pg_type 
                    WHERE typname = '${enumName}'
                );`
            );
            return result[0].exists;
        };

        // Create review_reactions_type_enum if it doesn't exist
        const reactionEnumExists = await checkEnumExists('review_reactions_type_enum');
        if (!reactionEnumExists) {
            await queryRunner.query(`
                CREATE TYPE "public"."review_reactions_type_enum" AS ENUM(
                    'LIKE', 'LOVE', 'FUNNY', 'INSIGHTFUL', 'DISAGREE'
                )
            `);
        }

        // Drop existing reports table and its dependencies
        await queryRunner.query(`DROP TABLE IF EXISTS "reports" CASCADE`);

        // Create review_reactions table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "review_reactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" "public"."review_reactions_type_enum" NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid,
                "review_id" uuid,
                CONSTRAINT "PK_b82cdf2aa25d47c14de0200e86b" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_3828e0e19fe30c61cf92df0c2f7" UNIQUE ("user_id", "review_id", "type")
            )
        `);

        // Modify reviews table
        const hasTitleColumn = await queryRunner.hasColumn('reviews', 'title');
        if (hasTitleColumn) {
            await queryRunner.dropColumn('reviews', 'title');
        }

        // Add new columns to reviews
        await queryRunner.query(`
            ALTER TABLE "reviews" 
            ADD COLUMN IF NOT EXISTS "reaction_count" integer NOT NULL DEFAULT '0',
            ADD COLUMN IF NOT EXISTS "watch_history_id" uuid,
            ADD COLUMN IF NOT EXISTS "is_edited" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "contains_spoilers" boolean NOT NULL DEFAULT false
        `);

        // Change content column
        await queryRunner.query(`
            ALTER TABLE "reviews" 
            ALTER COLUMN "content" TYPE character varying(300)
        `);

        // Add unique constraint for watch_history_id if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'UQ_3047a8dfe9747484c369f6bf5d0'
                ) THEN
                    ALTER TABLE "reviews" 
                    ADD CONSTRAINT "UQ_3047a8dfe9747484c369f6bf5d0" 
                    UNIQUE ("watch_history_id");
                END IF;
            END $$;
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "review_reactions" 
            ADD CONSTRAINT "FK_review_reactions_user" 
            FOREIGN KEY ("user_id") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "review_reactions" 
            ADD CONSTRAINT "FK_review_reactions_review" 
            FOREIGN KEY ("review_id") 
            REFERENCES "reviews"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "reviews" 
            ADD CONSTRAINT "FK_reviews_watch_history" 
            FOREIGN KEY ("watch_history_id") 
            REFERENCES "watch_history"("id") 
            ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "review_reactions" 
            DROP CONSTRAINT IF EXISTS "FK_review_reactions_review"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "review_reactions" 
            DROP CONSTRAINT IF EXISTS "FK_review_reactions_user"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "reviews" 
            DROP CONSTRAINT IF EXISTS "FK_reviews_watch_history"
        `);

        // Drop new columns from reviews
        await queryRunner.query(`
            ALTER TABLE "reviews" 
            DROP COLUMN IF EXISTS "reaction_count",
            DROP COLUMN IF EXISTS "watch_history_id",
            DROP COLUMN IF EXISTS "is_edited",
            DROP COLUMN IF EXISTS "contains_spoilers"
        `);

        // Drop review_reactions table
        await queryRunner.query(`DROP TABLE IF EXISTS "review_reactions"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."review_reactions_type_enum"`);
    }
}