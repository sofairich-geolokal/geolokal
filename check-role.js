require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '16443'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function checkRole() {
  try {
    const result = await pool.query("SELECT username, email, role, role::text as role_text FROM users WHERE role ILIKE '%superadmin%'");
    console.log('🔍 Superadmin role details:');
    result.rows.forEach(user => {
      console.log(`  - Username: ${user.username}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Role (raw): ${user.role}`);
      console.log(`  - Role (text): ${user.role_text}`);
      console.log(`  - Role lowercase: ${user.role_text.toLowerCase()}`);
      console.log(`  - Is 'superadmin': ${user.role_text.toLowerCase() === 'superadmin'}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkRole();
