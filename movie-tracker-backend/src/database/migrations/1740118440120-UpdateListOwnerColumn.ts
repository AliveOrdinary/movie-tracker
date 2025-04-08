import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateListOwnerColumn1740118440120 implements MigrationInterface {
    name = 'UpdateListOwnerColumn1740118440120'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_8bceed52a4e05a90d0fd681058"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_11df0deb9c7115715f5c15dda9"`);
        await queryRunner.query(`ALTER TABLE "lists" DROP COLUMN "ownerId"`);
        await queryRunner.query(`ALTER TABLE "lists" DROP CONSTRAINT "FK_eb962e2db9730b4e73dfb580861"`);
        await queryRunner.query(`ALTER TABLE "lists" ALTER COLUMN "owner_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lists" ADD CONSTRAINT "FK_eb962e2db9730b4e73dfb580861" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lists" DROP CONSTRAINT "FK_eb962e2db9730b4e73dfb580861"`);
        await queryRunner.query(`ALTER TABLE "lists" ALTER COLUMN "owner_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lists" ADD CONSTRAINT "FK_eb962e2db9730b4e73dfb580861" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lists" ADD "ownerId" character varying NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_11df0deb9c7115715f5c15dda9" ON "lists" ("type", "ownerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8bceed52a4e05a90d0fd681058" ON "lists" ("privacy", "createdAt") `);
    }

}
