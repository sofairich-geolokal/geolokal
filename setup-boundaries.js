const { query } = require('./app/lib/db');
const fs = require('fs');
const path = require('path');

async function setupBoundaries() {
  try {
    console.log('🔧 Creating admin_boundaries table...');
    
    // Create table
    await query(`
      CREATE TABLE IF NOT EXISTS admin_boundaries (
          id SERIAL PRIMARY KEY,
          properties JSONB NOT NULL,
          geometry JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_admin_boundaries_geometry ON admin_boundaries USING GIN (geometry)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_admin_boundaries_properties ON admin_boundaries USING GIN (properties)`);

    console.log('✅ Table created successfully');

    // Clear existing data
    await query(`DELETE FROM admin_boundaries`);
    console.log('🧹 Cleared existing boundary data');

    // Read and seed data
    const filePath = path.join(__dirname, 'public', 'data', 'Ibaan_boundary.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const geojson = JSON.parse(fileData);

    console.log(`📊 Found ${geojson.features.length} boundary features to seed...`);

    // Insert features
    for (const feature of geojson.features) {
      await query(
        `INSERT INTO admin_boundaries (properties, geometry) VALUES ($1, $2)`,
        [JSON.stringify(feature.properties), JSON.stringify(feature.geometry)]
      );
    }

    console.log('✅ Boundaries seeded successfully!');
    console.log(`🎉 Successfully processed ${geojson.features.length} boundary features`);

  } catch (error) {
    console.error('❌ Error setting up boundaries:', error.message);
    process.exit(1);
  }
}

setupBoundaries();
