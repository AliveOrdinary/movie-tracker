// src/database/migrations/1707868400000-CreateListSystem.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateListSystem1707868400000 implements MigrationInterface {
  name = 'CreateListSystem1707868400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "list_type_enum" AS ENUM ('standard', 'custom')
    `);

    await queryRunner.query(`
      CREATE TYPE "list_privacy_enum" AS ENUM ('public', 'private', 'following')
    `);

    await queryRunner.query(`
      CREATE TYPE "collaborator_permission_enum" AS ENUM (
        'view',
        'add_items',
        'remove_items',
        'edit_details',
        'invite_others'
      )
    `);

    // Create lists table
    await queryRunner.query(`
      CREATE TABLE "lists" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "thumbnail" character varying,
        "type" "list_type_enum" NOT NULL DEFAULT 'custom',
        "privacy" "list_privacy_enum" NOT NULL DEFAULT 'private',
        "category" character varying,
        "owner_id" uuid NOT NULL,
        "max_entries" integer,
        "favorite_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "pk_lists" PRIMARY KEY ("id")
      )
    `);

    // Create list_items table
    await queryRunner.query(`
      CREATE TABLE "list_items" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "list_id" uuid NOT NULL,
        "movie_id" integer NOT NULL,
        "added_by_id" uuid NOT NULL,
        "order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "pk_list_items" PRIMARY KEY ("id"),
        CONSTRAINT "uq_list_items_list_movie" UNIQUE ("list_id", "movie_id")
      )
    `);

    // Create list_collaborators table
    await queryRunner.query(`
      CREATE TABLE "list_collaborators" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "list_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "permissions" collaborator_permission_enum[] NOT NULL DEFAULT '{view}',
        "added_by_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "pk_list_collaborators" PRIMARY KEY ("id"),
        CONSTRAINT "uq_list_collaborators_list_user" UNIQUE ("list_id", "user_id")
      )
    `);

    // Create list_favorites table
    await queryRunner.query(`
      CREATE TABLE "list_favorites" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "list_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "pk_list_favorites" PRIMARY KEY ("id"),
        CONSTRAINT "uq_list_favorites_list_user" UNIQUE ("list_id", "user_id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "lists" 
      ADD CONSTRAINT "fk_lists_owner" 
      FOREIGN KEY ("owner_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "list_items" 
      ADD CONSTRAINT "fk_list_items_list" 
      FOREIGN KEY ("list_id") 
      REFERENCES "lists"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "list_items" 
      ADD CONSTRAINT "fk_list_items_added_by" 
      FOREIGN KEY ("added_by_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "list_collaborators" 
      ADD CONSTRAINT "fk_list_collaborators_list" 
      FOREIGN KEY ("list_id") 
      REFERENCES "lists"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "list_collaborators" 
      ADD CONSTRAINT "fk_list_collaborators_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "list_collaborators" 
      ADD CONSTRAINT "fk_list_collaborators_added_by" 
      FOREIGN KEY ("added_by_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "list_favorites" 
      ADD CONSTRAINT "fk_list_favorites_list" 
      FOREIGN KEY ("list_id") 
      REFERENCES "lists"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "list_favorites" 
      ADD CONSTRAINT "fk_list_favorites_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_lists_owner_type" ON "lists"("owner_id", "type")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_lists_privacy_created" ON "lists"("privacy", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_list_items_list_created" ON "list_items"("list_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_list_collaborators_list_user" ON "list_collaborators"("list_id", "user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_list_favorites_user_created" ON "list_favorites"("user_id", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "idx_list_favorites_user_created"`);
    await queryRunner.query(`DROP INDEX "idx_list_collaborators_list_user"`);
    await queryRunner.query(`DROP INDEX "idx_list_items_list_created"`);
    await queryRunner.query(`DROP INDEX "idx_lists_privacy_created"`);
    await queryRunner.query(`DROP INDEX "idx_lists_owner_type"`);

    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "list_favorites" DROP CONSTRAINT "fk_list_favorites_user"`);
    await queryRunner.query(`ALTER TABLE "list_favorites" DROP CONSTRAINT "fk_list_favorites_list"`);
    await queryRunner.query(`ALTER TABLE "list_collaborators" DROP CONSTRAINT "fk_list_collaborators_added_by"`);
    await queryRunner.query(`ALTER TABLE "list_collaborators" DROP CONSTRAINT "fk_list_collaborators_user"`);
    await queryRunner.query(`ALTER TABLE "list_collaborators" DROP CONSTRAINT "fk_list_collaborators_list"`);
    await queryRunner.query(`ALTER TABLE "list_items" DROP CONSTRAINT "fk_list_items_added_by"`);
    await queryRunner.query(`ALTER TABLE "list_items" DROP CONSTRAINT "fk_list_items_list"`);
    await queryRunner.query(`ALTER TABLE "lists" DROP CONSTRAINT "fk_lists_owner"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "list_favorites"`);
    await queryRunner.query(`DROP TABLE "list_collaborators"`);
    await queryRunner.query(`DROP TABLE "list_items"`);
    await queryRunner.query(`DROP TABLE "lists"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "collaborator_permission_enum"`);
    await queryRunner.query(`DROP TYPE "list_privacy_enum"`);
    await queryRunner.query(`DROP TYPE "list_type_enum"`);
  }
}