require('dotenv').config(); // This loads the .env file
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // Required for Aiven
  },
});

async function debugAuth() {
  console.log('Debugging authentication process...\n');
  
  try {
    // Test the exact query used in auth.ts
    console.log('1. Testing user query (exact from auth.ts)...');
    const result = await pool.query(
      'SELECT id, username, lgu_id, password_hash, role FROM users WHERE username = $1',
      ['test'] // Using a test username
    );
    
    console.log('✅ Query executed successfully');
    console.log('Users found:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('Sample user:', {
        id: result.rows[0].id,
        username: result.rows[0].username,
        role: result.rows[0].role,
        lgu_id: result.rows[0].lgu_id
      });
    }
    
    console.log('\n2. Checking all users in database...');
    const allUsers = await pool.query('SELECT id, username, role, lgu_id FROM users LIMIT 5');
    console.log('✅ All users query successful');
    console.log('Available users:', allUsers.rows);
    
    // Test login with actual user
    console.log('\n3. Testing login with actual user...');
    const testUser = allUsers.rows[0]; // Use first available user
    if (testUser) {
      const loginResult = await pool.query(
        'SELECT id, username, lgu_id, password_hash, role FROM users WHERE username = $1',
        [testUser.username]
      );
      console.log('✅ Login query for user', testUser.username, ':', loginResult.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Debug query failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

debugAuth();
