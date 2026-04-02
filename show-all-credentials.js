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
    console.log('=== ALL USER CREDENTIALS ===\n');
    
    const result = await query('SELECT id, username, email, password_hash, role FROM users ORDER BY role, id');
    
    console.log('🏛️  LGU USERS:');
    const lguUsers = result.rows.filter(user => user.role.toLowerCase().includes('lgu') || user.role.toLowerCase() === 's');
    lguUsers.forEach(user => {
      console.log(`   Username: ${user.username.padEnd(15)} Password: ${user.password_hash.padEnd(15)} Role: ${user.role}`);
    });
    
    console.log('\n👁️  VIEWER USERS:');
    const viewerUsers = result.rows.filter(user => user.role.toLowerCase().includes('viewer'));
    viewerUsers.forEach(user => {
      console.log(`   Username: ${user.username.padEnd(15)} Password: ${user.password_hash.padEnd(15)} Role: ${user.role}`);
    });
    
    console.log('\n📋 LOGIN INSTRUCTIONS:');
    console.log('For LGU Portal: http://localhost:3001/lgu-login');
    console.log('For Viewer Portal: http://localhost:3001/viewerDashboard/viewerlogin');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
