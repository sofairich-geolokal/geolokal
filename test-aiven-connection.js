require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '16443'),
  ssl: {
    rejectUnauthorized: false,
  },
});

const query = (text, params) => pool.query(text, params);

(async () => {
  try {
    console.log('Testing Aiven database connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    console.log('Database:', process.env.DB_NAME);
    
    const result = await query('SELECT NOW()');
    console.log('✅ Connection successful:', result.rows[0].now);
    
    console.log('Testing users table...');
    const userCount = await query('SELECT COUNT(*) FROM users');
    console.log('Users table exists, count:', userCount.rows[0].count);
    
    console.log('Testing sample user...');
    const sampleUser = await query('SELECT id, username, role FROM users LIMIT 1');
    if (sampleUser.rows.length > 0) {
      console.log('Sample user found:', sampleUser.rows[0]);
    } else {
      console.log('No users found in table');
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
})();
