import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMovieEntity1740006714712 implements MigrationInterface {
    name = 'UpdateMovieEntity1740006714712'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "watch_history" DROP CONSTRAINT "FK_cff7480bc2d70fc9e78f4ec6204"`);
        await queryRunner.query(`ALTER TABLE "review_reactions" DROP CONSTRAINT "FK_review_reactions_review"`);
        await queryRunner.query(`ALTER TABLE "review_reactions" DROP CONSTRAINT "FK_review_reactions_user"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_watch_history"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_563501cf3faa75a1ca40be84f82"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_MOVIES_TMDB_ID"`);
        await queryRunner.query(`ALTER TABLE "review_reactions" RENAME COLUMN "created_at" TO "createdAt"`);
        await queryRunner.query(`CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reason" text NOT NULL, "status" "public"."reports_status_enum" NOT NULL DEFAULT 'PENDING', "resolution" "public"."reports_resolution_enum", "moderatorNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "resolvedAt" TIMESTAMP, "review_id" uuid, "reporter_id" uuid, "moderator_id" uuid, CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "releaseDate"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "tmdbData"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "is_edited"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "contains_spoilers"`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "releaseYear" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "runtime" integer`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "languages" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "isAdult" boolean NOT NULL`);
        await queryRunner.query(`ALTER TABLE "movies" DROP CONSTRAINT "UQ_e9d4a90d2d6a56fd9f9300c9370"`);
        await queryRunner.query(`ALTER TABLE "movies" ALTER COLUMN "originalTitle" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "movies" ALTER COLUMN "overview" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "genres"`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "genres" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "watch_history" ADD CONSTRAINT "FK_cff7480bc2d70fc9e78f4ec6204" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review_reactions" ADD CONSTRAINT "FK_fe875fe823e5a692b530e50ed1e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review_reactions" ADD CONSTRAINT "FK_73aef9bcca484a58ced48e6a75d" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_563501cf3faa75a1ca40be84f82" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_3047a8dfe9747484c369f6bf5d0" FOREIGN KEY ("watch_history_id") REFERENCES "watch_history"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_628fb90b2d3a87f2bb236befa66" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_14aa567cf50dcaa93deba2b0b12" FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_14aa567cf50dcaa93deba2b0b12"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_628fb90b2d3a87f2bb236befa66"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_3047a8dfe9747484c369f6bf5d0"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_563501cf3faa75a1ca40be84f82"`);
        await queryRunner.query(`ALTER TABLE "review_reactions" DROP CONSTRAINT "FK_73aef9bcca484a58ced48e6a75d"`);
        await queryRunner.query(`ALTER TABLE "review_reactions" DROP CONSTRAINT "FK_fe875fe823e5a692b530e50ed1e"`);
        await queryRunner.query(`ALTER TABLE "watch_history" DROP CONSTRAINT "FK_cff7480bc2d70fc9e78f4ec6204"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "genres"`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "genres" text array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "movies" ALTER COLUMN "overview" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "movies" ALTER COLUMN "originalTitle" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "movies" ADD CONSTRAINT "UQ_e9d4a90d2d6a56fd9f9300c9370" UNIQUE ("tmdbId")`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "isAdult"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "languages"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "runtime"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "releaseYear"`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD "contains_spoilers" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD "is_edited" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "tmdbData" jsonb`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "releaseDate" character varying NOT NULL`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`ALTER TABLE "review_reactions" RENAME COLUMN "createdAt" TO "created_at"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_MOVIES_TMDB_ID" ON "movies" ("tmdbId") `);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_563501cf3faa75a1ca40be84f82" FOREIGN KEY ("movie_id") REFERENCES "movie"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_watch_history" FOREIGN KEY ("watch_history_id") REFERENCES "watch_history"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review_reactions" ADD CONSTRAINT "FK_review_reactions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review_reactions" ADD CONSTRAINT "FK_review_reactions_review" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "watch_history" ADD CONSTRAINT "FK_cff7480bc2d70fc9e78f4ec6204" FOREIGN KEY ("movie_id") REFERENCES "movie"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
