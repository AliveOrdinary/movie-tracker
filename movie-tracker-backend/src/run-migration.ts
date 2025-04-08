// src/run-migration.ts
import { DataSource } from 'typeorm';
import * as path from 'path';
import { config } from 'dotenv';
import { AddContextTagsColumn1710643200000 } from './migrations/1710643200000-AddContextTagsColumn';

// Load environment variables
config();

// Configure the data source
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'movie_tracker',
  entities: [path.join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: [AddContextTagsColumn1710643200000],
  synchronize: false,
  logging: true,
});

// Function to run the migration
async function runMigration() {
  try {
    // Initialize the data source
    await dataSource.initialize();
    console.log('Data source has been initialized');

    // Run the migration
    await dataSource.runMigrations({ transaction: 'all' });
    console.log('Migration has been executed successfully');

    // Close the connection
    await dataSource.destroy();
    console.log('Data source has been destroyed');

    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
