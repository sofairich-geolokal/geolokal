require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function fixUsersTable() {
  try {
    console.log('Checking users table structure...');
    
    // Check if is_active column exists
    const columnCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_active'
      );
    `);
    
    console.log('is_active column exists:', columnCheck.rows[0].exists);
    
    // Add is_active column if it doesn't exist
    if (!columnCheck.rows[0].exists) {
      console.log('Adding is_active column to users table...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN is_active BOOLEAN DEFAULT true
      `);
      console.log('✅ is_active column added');
    }
    
    // Check if created_at column exists and has the right type
    const createdatCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'created_at'
      );
    `);
    
    if (!createdatCheck.rows[0].exists) {
      console.log('Adding created_at column to users table...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ created_at column added');
    }
    
    // Update existing users to have is_active = true if null
    await pool.query(`
      UPDATE users 
      SET is_active = true 
      WHERE is_active IS NULL
    `);
    
    console.log('\nTesting updated queries...');
    const parcelResult = await pool.query('SELECT COUNT(*) as count FROM tax_parcels');
    const cbmsResult = await pool.query('SELECT COUNT(*) as count FROM cbms_indicators');
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    const logsResult = await pool.query("SELECT COUNT(*) as count FROM audit_logs");
    
    console.log(`Tax parcels: ${parcelResult.rows[0].count}`);
    console.log(`CBMS indicators: ${cbmsResult.rows[0].count}`);
    console.log(`Active users: ${usersResult.rows[0].count}`);
    console.log(`Audit logs: ${logsResult.rows[0].count}`);
    
    // Test growth calculation queries
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const oldParcelResult = await pool.query('SELECT COUNT(*) as count FROM tax_parcels WHERE created_at < $1', [thirtyDaysAgo]);
    const oldCbmsResult = await pool.query('SELECT COUNT(*) as count FROM cbms_indicators WHERE created_at < $1', [thirtyDaysAgo]);
    
    console.log(`Old tax parcels (30+ days): ${oldParcelResult.rows[0].count}`);
    console.log(`Old CBMS indicators (30+ days): ${oldCbmsResult.rows[0].count}`);
    
    console.log('\n🎉 Users table fixed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixUsersTable();
