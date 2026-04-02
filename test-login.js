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

async function testLogin() {
  console.log('Testing login functionality...\n');
  
  try {
    // Test with LGU user
    console.log('1. Testing LGU login (Rukhsar)...');
    const lguResult = await pool.query(
      'SELECT id, username, lgu_id, password_hash, role FROM users WHERE username = $1',
      ['Rukhsar']
    );
    
    if (lguResult.rows.length > 0) {
      const user = lguResult.rows[0];
      console.log('✅ LGU user found:', {
        id: user.id,
        username: user.username,
        role: user.role,
        canAccessLGU: user.role.toLowerCase() !== 'viewer'
      });
    } else {
      console.log('❌ LGU user not found');
    }
    
    // Test with Viewer user
    console.log('\n2. Testing Viewer login (ibaan.viewer1)...');
    const viewerResult = await pool.query(
      'SELECT id, username, lgu_id, password_hash, role FROM users WHERE username = $1',
      ['ibaan.viewer1']
    );
    
    if (viewerResult.rows.length > 0) {
      const user = viewerResult.rows[0];
      console.log('✅ Viewer user found:', {
        id: user.id,
        username: user.username,
        role: user.role,
        canAccessViewer: user.role.toLowerCase() === 'viewer'
      });
    } else {
      console.log('❌ Viewer user not found');
    }
    
    console.log('\n3. Available credentials for testing:');
    const allUsers = await pool.query('SELECT username, role FROM users');
    allUsers.rows.forEach(user => {
      console.log(`- Username: ${user.username}, Role: ${user.role}, Password: c2SPUuIfSm`);
    });
    
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testLogin();
