// Test database connection
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '16443'),
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false,
  } : false,
  max: 1,
  min: 0,
  idleTimeoutMillis: 300,
  connectionTimeoutMillis: 1000,
  maxUses: 25,
  allowExitOnIdle: true,
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log('DB_SSL:', process.env.DB_SSL);
    
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('Database connected successfully!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('Database version:', result.rows[0].db_version);
    
    // Test user table
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('Total users in database:', userCount.rows[0].count);
    
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
  } finally {
    await pool.end();
  }
}

testConnection();
