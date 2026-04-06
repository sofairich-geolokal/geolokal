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
    console.log('Checking viewer user credentials...');
    
    // Get all viewer users
    const viewers = await query('SELECT id, username, password_hash, role FROM users WHERE role ILIKE \'%viewer%\'');
    console.log('Found', viewers.rows.length, 'viewer users:');
    
    viewers.rows.forEach(user => {
      console.log(`  ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Password: ${user.password_hash}`);
    });
    
    // Test login logic exactly as in auth.ts
    console.log('\nTesting login logic...');
    const testUsername = 'ibaan.viewer1';
    const result = await query(
      'SELECT id, username, lgu_id, password_hash, role FROM users WHERE username = $1',
      [testUsername]
    );
    
    const user = result.rows[0];
    if (user) {
      console.log('User found:', user.username);
      console.log('Password hash:', user.password_hash);
      console.log('Role:', user.role);
      
      // Test different common passwords
      const testPasswords = ['test', 'password', 'admin', 'viewer', 'ibaan', 'ibaan.viewer1'];
      
      for (const testPwd of testPasswords) {
        if (user.password_hash === testPwd) {
          console.log(`✅ Password matches: "${testPwd}"`);
          break;
        }
      }
      
      console.log('Note: The auth.ts file uses plain text comparison (line 22)');
    } else {
      console.log('User not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
