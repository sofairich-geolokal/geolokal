require('dotenv').config();
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
});

async function testDB() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW() as now');
    console.log('✅ Database connection successful:', result.rows[0]);
    
    // Check if users table exists
    const usersTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    console.log('📋 Users table exists:', usersTable.rows[0].exists);
    
    if (usersTable.rows[0].exists) {
      const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log('👥 Total users:', userCount.rows[0].count);
      
      const superadminCount = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'superadmin'");
      console.log('🔐 Superadmin users:', superadminCount.rows[0].count);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await pool.end();
  }
}

testDB();
