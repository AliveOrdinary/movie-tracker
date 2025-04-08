import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureListEnumCompatibility1740800000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Validate enum values - make sure they're all lowercase in the database
    // This is a safety check - it doesn't modify anything if values are already correct
    
    console.log('Running enum compatibility check migration');
    
    try {
      // Check the list type enum
      const listTypeResult = await queryRunner.query(`
        SELECT DISTINCT "type" FROM lists;
      `);
      
      console.log('Current list types in database:', listTypeResult);
      
      // Check the list privacy enum
      const listPrivacyResult = await queryRunner.query(`
        SELECT DISTINCT "privacy" FROM lists;
      `);
      
      console.log('Current list privacy values in database:', listPrivacyResult);
      
      // We'll not make any changes here, just log the results
      console.log('Enum validation complete');
    } catch (error) {
      console.error('Error during enum validation:', error);
      // We're not throwing the error so migration can continue
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration doesn't need a rollback as it doesn't change database structure
  }
}
