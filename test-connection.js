const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Rukhsar',
  port: 5432,
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful:', result.rows[0].now);
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Users table does not exist. Creating it...');
      
      // Create users table
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          lgu_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Users table created successfully');
      
      // Insert a test user
      await pool.query(`
        INSERT INTO users (username, password_hash, lgu_id) 
        VALUES ($1, $2, $3)
      `, ['admin', 'admin123', 1]);
      
      console.log('✅ Test user created (username: admin, password: admin123)');
    } else {
      console.log('✅ Users table exists');
      
      // Show existing users
      const users = await pool.query('SELECT id, username, lgu_id FROM users');
      console.log('Existing users:', users.rows);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
