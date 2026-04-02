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
    console.log('Updating viewer passwords to plain text for testing...');
    
    // Update viewer passwords to simple plain text passwords
    const updates = [
      { username: 'ibaan.viewer1', password: 'viewer1' },
      { username: 'ibaan.viewer2', password: 'viewer2' },
      { username: 'Rukhi', password: 'rukhi123' }
    ];
    
    for (const user of updates) {
      await query(
        'UPDATE users SET password_hash = $1 WHERE username = $2',
        [user.password, user.username]
      );
      console.log(`✅ Updated ${user.username} password to: "${user.password}"`);
    }
    
    console.log('\nTesting the updated credentials...');
    for (const user of updates) {
      const result = await query(
        'SELECT username, password_hash FROM users WHERE username = $1',
        [user.username]
      );
      
      if (result.rows.length > 0) {
        const dbUser = result.rows[0];
        console.log(`${dbUser.username}: password = "${dbUser.password_hash}"`);
      }
    }
    
    console.log('\nYou can now login with:');
    console.log('Username: ibaan.viewer1, Password: viewer1');
    console.log('Username: ibaan.viewer2, Password: viewer2');
    console.log('Username: Rukhi, Password: rukhi123');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
