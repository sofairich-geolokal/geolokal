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
    console.log('Testing users table...');
    const result = await query('SELECT COUNT(*) FROM users');
    console.log('Users table exists, count:', result.rows[0].count);
    
    console.log('Testing table structure...');
    const structure = await query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'users\' ORDER BY ordinal_position');
    console.log('Table structure:');
    structure.rows.forEach(row => console.log(`  ${row.column_name}: ${row.data_type}`));
    
    console.log('Testing sample user query...');
    const sampleUser = await query('SELECT id, username, role FROM users LIMIT 1');
    console.log('Sample user:', sampleUser.rows[0]);
    
    console.log('Testing login query...');
    const loginTest = await query('SELECT id, username, lgu_id, password_hash, role FROM users WHERE username = $1', ['test']);
    console.log('Login test result:', loginTest.rows.length > 0 ? 'Found user' : 'No user found');
    
  } catch (error) {
    console.error('Database error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
})();
