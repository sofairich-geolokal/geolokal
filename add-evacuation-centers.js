#!/usr/bin/env node

// Update database with evacuation centers
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

async function addEvacuationCenters() {
  try {
    console.log('🏥 Adding evacuation centers to database...\n');
    
    const evacuationCenters = [
      {
        name: 'Ibaan Evacuation Center - North',
        address: 'Barangay San Isidro, Ibaan, Batangas',
        latitude: 13.7756,
        longitude: 121.1250,
        location_type: 'evacuation_center',
        category: 'infrastructure',
        description: 'Northern evacuation center for disaster response'
      },
      {
        name: 'Ibaan Evacuation Center - South',
        address: 'Barangay Sabang, Ibaan, Batangas',
        latitude: 13.7421,
        longitude: 121.1250,
        location_type: 'evacuation_center',
        category: 'infrastructure',
        description: 'Southern evacuation center for disaster response'
      },
      {
        name: 'Ibaan Evacuation Center - Central',
        address: 'Poblacion, Ibaan, Batangas',
        latitude: 13.7588,
        longitude: 121.1250,
        location_type: 'evacuation_center',
        category: 'infrastructure',
        description: 'Central evacuation center at municipal grounds'
      },
      {
        name: 'Ibaan Sports Complex Evacuation',
        address: 'Barangay Tala, Ibaan, Batangas',
        latitude: 13.7588,
        longitude: 121.1412,
        location_type: 'evacuation_center',
        category: 'infrastructure',
        description: 'Sports complex used as evacuation facility'
      }
    ];

    for (const center of evacuationCenters) {
      await pool.query(`
        INSERT INTO boundary_locations (name, address, latitude, longitude, location_type, category, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        center.name,
        center.address,
        center.latitude,
        center.longitude,
        center.location_type,
        center.category,
        center.description
      ]);
      console.log(`   ✅ Added: ${center.name}`);
    }

    // Check final data
    const result = await pool.query(`
      SELECT name, location_type FROM boundary_locations 
      WHERE location_type IN ('evacuation_center', 'healthcare')
      ORDER BY location_type, name
    `);
    
    console.log('\n📍 Updated evacuation/healthcare locations:');
    result.rows.forEach(row => {
      console.log(`   - ${row.name} (${row.location_type})`);
    });

  } catch (error) {
    console.error('❌ Error adding evacuation centers:', error);
  } finally {
    await pool.end();
  }
}

addEvacuationCenters();
