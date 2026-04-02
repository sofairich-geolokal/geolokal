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
    console.log('Checking all users in database...');
    
    const result = await query('SELECT id, username, email, password_hash, role FROM users ORDER BY id');
    console.log('\nAll users:');
    result.rows.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email || 'N/A'}, Password: ${user.password_hash}, Role: ${user.role}`);
    });
    
    console.log('\nThese are the passwords that should work for viewer login:');
    const viewers = result.rows.filter(user => user.role.toLowerCase().includes('viewer'));
    viewers.forEach(viewer => {
      console.log(`Username: ${viewer.username}, Password: ${viewer.password_hash}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
