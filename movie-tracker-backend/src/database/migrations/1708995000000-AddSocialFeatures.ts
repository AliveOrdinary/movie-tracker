// src/database/migrations/1708995000000-AddSocialFeatures.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSocialFeatures1708995000000 implements MigrationInterface {
  name = 'AddSocialFeatures1708995000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_follows table
    await queryRunner.query(`
      CREATE TABLE "user_follows" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "follower_id" uuid NOT NULL,
        "following_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_follows" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_follows_follower_following" UNIQUE ("follower_id", "following_id")
      )
    `);

    // Create index on user_follows
    await queryRunner.query(`
      CREATE INDEX "IDX_user_follows_follower_following" ON "user_follows" ("follower_id", "following_id")
    `);

    // Add foreign keys to user_follows
    await queryRunner.query(`
      ALTER TABLE "user_follows" ADD CONSTRAINT "FK_user_follows_follower"
      FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_follows" ADD CONSTRAINT "FK_user_follows_following"
      FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create activities table
    await queryRunner.query(`
      CREATE TYPE "activity_type_enum" AS ENUM (
        'WATCHED_MOVIE', 
        'REVIEWED_MOVIE', 
        'CREATED_LIST', 
        'UPDATED_LIST', 
        'FOLLOWED_USER', 
        'LIKED_REVIEW'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "activities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" "activity_type_enum" NOT NULL,
        "movie_id" uuid,
        "review_id" uuid,
        "list_id" uuid,
        "watch_history_id" uuid,
        "target_user_id" uuid,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activities" PRIMARY KEY ("id")
      )
    `);

    // Create index on activities
    await queryRunner.query(`
      CREATE INDEX "IDX_activities_user_created" ON "activities" ("user_id", "createdAt")
    `);

    // Add foreign keys to activities
    await queryRunner.query(`
      ALTER TABLE "activities" ADD CONSTRAINT "FK_activities_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "activities" ADD CONSTRAINT "FK_activities_movie"
      FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "activities" ADD CONSTRAINT "FK_activities_review"
      FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "activities" ADD CONSTRAINT "FK_activities_list"
      FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "activities" ADD CONSTRAINT "FK_activities_watch_history"
      FOREIGN KEY ("watch_history_id") REFERENCES "watch_history"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "activities" ADD CONSTRAINT "FK_activities_target_user"
      FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'FOLLOW', 
        'REVIEW_LIKE', 
        'REVIEW_COMMENT', 
        'LIST_FAVORITE', 
        'LIST_COLLABORATION',
        'MOVIE_RELEASE',
        'SYSTEM_MESSAGE'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "actor_id" uuid,
        "type" "notification_type_enum" NOT NULL,
        "message" text NOT NULL,
        "review_id" uuid,
        "list_id" uuid,
        "movie_id" uuid,
        "metadata" jsonb,
        "isRead" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    // Create index on notifications
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_created" ON "notifications" ("user_id", "createdAt")
    `);

    // Add foreign keys to notifications
    await queryRunner.query(`
      ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_actor"
      FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_review"
      FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_list"
      FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_movie"
      FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop notifications table and related
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_movie"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_list"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_review"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_actor"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_user_created"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);

    // Drop activities table and related
    await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_activities_target_user"`);
    await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_activities_watch_history"`);
    await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_activities_list"`);
    await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_activities_review"`);
    await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_activities_movie"`);
    await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_activities_user"`);
    await queryRunner.query(`DROP INDEX "IDX_activities_user_created"`);
    await queryRunner.query(`DROP TABLE "activities"`);
    await queryRunner.query(`DROP TYPE "activity_type_enum"`);

    // Drop user_follows table and related
    await queryRunner.query(`ALTER TABLE "user_follows" DROP CONSTRAINT "FK_user_follows_following"`);
    await queryRunner.query(`ALTER TABLE "user_follows" DROP CONSTRAINT "FK_user_follows_follower"`);
    await queryRunner.query(`DROP INDEX "IDX_user_follows_follower_following"`);
    await queryRunner.query(`DROP TABLE "user_follows"`);
  }
}
