#!/usr/bin/env node

// Check what location types are in the database
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

async function checkLocationTypes() {
  try {
    const result = await pool.query('SELECT id, name, location_type, address FROM boundary_locations ORDER BY location_type');
    
    console.log('📍 All locations in database:');
    result.rows.forEach(row => {
      console.log(`   - ${row.name} (${row.location_type}): ${row.address}`);
    });
    
    console.log('\n🏥 Evacuation/Healthcare locations:');
    const evacuationLocations = result.rows.filter(row => 
      row.location_type === 'evacuation_center' || row.location_type === 'healthcare'
    );
    evacuationLocations.forEach(row => {
      console.log(`   - ${row.name} (${row.location_type}): ${row.address}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkLocationTypes();
