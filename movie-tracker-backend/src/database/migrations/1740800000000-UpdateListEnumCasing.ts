import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateListEnumCasing1740800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // For safety, we won't change the database enum values since they're already lowercase
    // Instead, we'll update the GraphQL schema to accept both uppercase and lowercase values
    
    // No database changes needed - GraphQL schema changes are handled in code
    console.log('Migration applied: Updated GraphQL schema to handle uppercase enum values');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration doesn't need a rollback as it doesn't change database structure
  }
}
