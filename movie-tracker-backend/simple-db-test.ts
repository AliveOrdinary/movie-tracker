// simple-db-test.ts
import * as dotenv from 'dotenv';
import * as pg from 'pg';

console.log('Starting simple DB test...');

// Load environment variables
dotenv.config();
console.log('Environment loaded');

async function testDbConnection() {
  console.log('Testing database connection...');

  const client = new pg.Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'movie_tracker'
  });

  try {
    console.log('Connecting with:');
    console.log('- Host:', process.env.DB_HOST || 'localhost');
    console.log('- User:', process.env.DB_USERNAME || 'postgres');
    console.log('- Database:', process.env.DB_NAME || 'movie_tracker');
    
    await client.connect();
    console.log('Connected to database successfully!');

    const result = await client.query('SELECT NOW() as time');
    console.log('Database time:', result.rows[0].time);

    console.log('Testing basic schema query...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      LIMIT 5
    `);
    
    console.log('First 5 tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    await client.end();
    console.log('Connection closed successfully');
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

testDbConnection().then(() => {
  console.log('Test completed');
}).catch(err => {
  console.error('Unhandled error:', err);
});

// This should appear immediately
console.log('After testDbConnection() call');
