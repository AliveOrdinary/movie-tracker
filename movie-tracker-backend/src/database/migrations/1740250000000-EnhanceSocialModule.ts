import { MigrationInterface, QueryRunner } from "typeorm";

export class EnhanceSocialModule1740250000000 implements MigrationInterface {
    name = 'EnhanceSocialModule1740250000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Friend Request System
        await queryRunner.query(`
            CREATE TYPE "public"."friend_requests_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED')
        `);
        
        await queryRunner.query(`
            CREATE TABLE "friend_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sender_id" uuid NOT NULL,
                "recipient_id" uuid NOT NULL,
                "status" "public"."friend_requests_status_enum" NOT NULL DEFAULT 'PENDING',
                "message" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_friend_requests_sender_recipient" UNIQUE ("sender_id", "recipient_id"),
                CONSTRAINT "PK_friend_requests" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_friend_requests_sender_recipient_status" ON "friend_requests" ("sender_id", "recipient_id", "status")
        `);

        // User Block System
        await queryRunner.query(`
            CREATE TABLE "user_blocks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "blocker_id" uuid NOT NULL,
                "blocked_id" uuid NOT NULL,
                "reason" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_user_blocks_blocker_blocked" UNIQUE ("blocker_id", "blocked_id"),
                CONSTRAINT "PK_user_blocks" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_user_blocks_blocker" ON "user_blocks" ("blocker_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_user_blocks_blocked" ON "user_blocks" ("blocked_id")
        `);

        // Social Group System
        await queryRunner.query(`
            CREATE TYPE "public"."social_groups_privacy_enum" AS ENUM('PUBLIC', 'PRIVATE', 'INVITATION')
        `);

        await queryRunner.query(`
            CREATE TABLE "social_groups" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(50) NOT NULL,
                "description" text NOT NULL,
                "privacy" "public"."social_groups_privacy_enum" NOT NULL DEFAULT 'PRIVATE',
                "image_url" character varying,
                "tags" text[] DEFAULT array[]::text[],
                "member_count" integer NOT NULL DEFAULT 0,
                "creator_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_social_groups_name" UNIQUE ("name"),
                CONSTRAINT "PK_social_groups" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_social_groups_creator" ON "social_groups" ("creator_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_social_groups_privacy" ON "social_groups" ("privacy")
        `);
        
        // Social Group Members
        await queryRunner.query(`
            CREATE TYPE "public"."social_group_members_role_enum" AS ENUM('ADMIN', 'MODERATOR', 'MEMBER')
        `);

        await queryRunner.query(`
            CREATE TABLE "social_group_members" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "group_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "role" "public"."social_group_members_role_enum" NOT NULL DEFAULT 'MEMBER',
                "added_by_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_social_group_members_group_user" UNIQUE ("group_id", "user_id"),
                CONSTRAINT "PK_social_group_members" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_social_group_members_group" ON "social_group_members" ("group_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_social_group_members_user" ON "social_group_members" ("user_id")
        `);

        // Activity Interaction System
        await queryRunner.query(`
            CREATE TABLE "activity_comments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activity_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "content" text NOT NULL,
                "is_edited" boolean NOT NULL DEFAULT false,
                "like_count" integer NOT NULL DEFAULT 0,
                "parent_comment_id" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_activity_comments" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_activity_comments_activity" ON "activity_comments" ("activity_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_activity_comments_parent" ON "activity_comments" ("parent_comment_id")
        `);

        // Activity Reactions
        await queryRunner.query(`
            CREATE TYPE "public"."activity_reactions_type_enum" AS ENUM('LIKE', 'LOVE', 'LAUGH', 'SAD', 'ANGRY', 'AGREE', 'DISAGREE')
        `);

        await queryRunner.query(`
            CREATE TABLE "activity_reactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activity_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "type" "public"."activity_reactions_type_enum" NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_activity_reactions_activity_user" UNIQUE ("activity_id", "user_id"),
                CONSTRAINT "PK_activity_reactions" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_activity_reactions_activity" ON "activity_reactions" ("activity_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_activity_reactions_user" ON "activity_reactions" ("user_id")
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "friend_requests" 
            ADD CONSTRAINT "FK_friend_requests_sender" 
            FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "friend_requests" 
            ADD CONSTRAINT "FK_friend_requests_recipient" 
            FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "user_blocks" 
            ADD CONSTRAINT "FK_user_blocks_blocker" 
            FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "user_blocks" 
            ADD CONSTRAINT "FK_user_blocks_blocked" 
            FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "social_groups" 
            ADD CONSTRAINT "FK_social_groups_creator" 
            FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "social_group_members" 
            ADD CONSTRAINT "FK_social_group_members_group" 
            FOREIGN KEY ("group_id") REFERENCES "social_groups"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "social_group_members" 
            ADD CONSTRAINT "FK_social_group_members_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "social_group_members" 
            ADD CONSTRAINT "FK_social_group_members_added_by" 
            FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "activity_comments" 
            ADD CONSTRAINT "FK_activity_comments_activity" 
            FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "activity_comments" 
            ADD CONSTRAINT "FK_activity_comments_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "activity_comments" 
            ADD CONSTRAINT "FK_activity_comments_parent" 
            FOREIGN KEY ("parent_comment_id") REFERENCES "activity_comments"("id") ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "activity_reactions" 
            ADD CONSTRAINT "FK_activity_reactions_activity" 
            FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "activity_reactions" 
            ADD CONSTRAINT "FK_activity_reactions_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "activity_reactions" DROP CONSTRAINT "FK_activity_reactions_user"`);
        await queryRunner.query(`ALTER TABLE "activity_reactions" DROP CONSTRAINT "FK_activity_reactions_activity"`);
        await queryRunner.query(`ALTER TABLE "activity_comments" DROP CONSTRAINT "FK_activity_comments_parent"`);
        await queryRunner.query(`ALTER TABLE "activity_comments" DROP CONSTRAINT "FK_activity_comments_user"`);
        await queryRunner.query(`ALTER TABLE "activity_comments" DROP CONSTRAINT "FK_activity_comments_activity"`);
        await queryRunner.query(`ALTER TABLE "social_group_members" DROP CONSTRAINT "FK_social_group_members_added_by"`);
        await queryRunner.query(`ALTER TABLE "social_group_members" DROP CONSTRAINT "FK_social_group_members_user"`);
        await queryRunner.query(`ALTER TABLE "social_group_members" DROP CONSTRAINT "FK_social_group_members_group"`);
        await queryRunner.query(`ALTER TABLE "social_groups" DROP CONSTRAINT "FK_social_groups_creator"`);
        await queryRunner.query(`ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_user_blocks_blocked"`);
        await queryRunner.query(`ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_user_blocks_blocker"`);
        await queryRunner.query(`ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_friend_requests_recipient"`);
        await queryRunner.query(`ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_friend_requests_sender"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_activity_reactions_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_activity_reactions_activity"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_activity_comments_parent"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_activity_comments_activity"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_social_group_members_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_social_group_members_group"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_social_groups_privacy"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_social_groups_creator"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_blocks_blocked"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_blocks_blocker"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_friend_requests_sender_recipient_status"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "activity_reactions"`);
        await queryRunner.query(`DROP TYPE "public"."activity_reactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "activity_comments"`);
        await queryRunner.query(`DROP TABLE "social_group_members"`);
        await queryRunner.query(`DROP TYPE "public"."social_group_members_role_enum"`);
        await queryRunner.query(`DROP TABLE "social_groups"`);
        await queryRunner.query(`DROP TYPE "public"."social_groups_privacy_enum"`);
        await queryRunner.query(`DROP TABLE "user_blocks"`);
        await queryRunner.query(`DROP TABLE "friend_requests"`);
        await queryRunner.query(`DROP TYPE "public"."friend_requests_status_enum"`);
    }
}
