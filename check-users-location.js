#!/usr/bin/env node

// Check if location column exists in users table
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

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table structure...\n');
    
    // Get table structure
    const structureResult = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Users table columns:');
    structureResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable}) ${col.column_default || ''}`);
    });
    
    // Check existing data
    const dataResult = await query('SELECT id, username, location FROM users LIMIT 5');
    console.log(`\n📊 Existing user data (${dataResult.rows.length} rows):`);
    dataResult.rows.forEach(row => {
      console.log(`   - ID: ${row.id}, Username: ${row.username}, Location: ${row.location || 'NULL'}`);
    });
    
    // Check if location column exists
    const hasLocationColumn = structureResult.rows.some(col => col.column_name === 'location');
    if (!hasLocationColumn) {
      console.log('\n⚠️  Location column does not exist. Adding it...');
      await query('ALTER TABLE users ADD COLUMN location VARCHAR(255)');
      console.log('✅ Location column added successfully');
      
      // Update with sample data
      await query(`
        UPDATE users 
        SET location = CASE 
          WHEN username LIKE '%admin%' THEN 'Ibaan, Batangas'
          WHEN username LIKE '%user%' THEN 'Batangas Province'
          ELSE 'Not Assigned'
        END
      `);
      console.log('✅ Sample location data added');
    } else {
      console.log('\n✅ Location column already exists');
    }
    
  } catch (error) {
    console.error('❌ Error checking users table:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkUsersTable();
}
