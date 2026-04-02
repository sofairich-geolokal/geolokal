require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

async function initializeGeoportalTables() {
  try {
    console.log('🚀 Initializing Geoportal database tables...');
    
    // Read and execute the simple schema file
    const schemaPath = path.join(__dirname, 'database-schema-geoportal-simple.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema as one statement
    await pool.query(schema);
    console.log('✅ Tables created successfully');
    
    // Insert default categories
    const categoriesQuery = `
      INSERT INTO geoportal_categories (category_id, name, description) VALUES
      ('boundaries', 'Administrative Boundaries', 'Administrative and political boundaries'),
      ('elevation', 'Elevation', 'Digital elevation models and terrain data'),
      ('hydrology', 'Hydrology', 'Water resources and hydrological features'),
      ('land_cover', 'Land Cover', 'Land use and land cover classifications'),
      ('transportation', 'Transportation', 'Roads, railways, and transportation networks'),
      ('utilities', 'Utilities', 'Utility infrastructure and services'),
      ('environment', 'Environment', 'Environmental and ecological data'),
      ('hazards', 'Hazards', 'Natural hazards and risk assessment'),
      ('imagery', 'Imagery', 'Satellite and aerial imagery'),
      ('demographics', 'Demographics', 'Population and demographic data')
      ON CONFLICT (category_id) DO NOTHING
    `;
    
    await pool.query(categoriesQuery);
    console.log('✅ Default categories inserted');
    
    // Insert default agencies
    const agenciesQuery = `
      INSERT INTO geoportal_agencies (agency_id, name, acronym, website) VALUES
      ('NAMRIA', 'National Mapping and Resource Information Authority', 'NAMRIA', 'https://www.namria.gov.ph'),
      ('DENR', 'Department of Environment and Natural Resources', 'DENR', 'https://www.denr.gov.ph'),
      ('DOST', 'Department of Science and Technology', 'DOST', 'https://www.dost.gov.ph'),
      ('DPWH', 'Department of Public Works and Highways', 'DPWH', 'https://www.dpwh.gov.ph'),
      ('DA', 'Department of Agriculture', 'DA', 'https://www.da.gov.ph'),
      ('DOH', 'Department of Health', 'DOH', 'https://www.doh.gov.ph'),
      ('DepEd', 'Department of Education', 'DepEd', 'https://www.deped.gov.ph'),
      ('DILG', 'Department of the Interior and Local Government', 'DILG', 'https://www.dilg.gov.ph'),
      ('DOT', 'Department of Tourism', 'DOT', 'https://www.tourism.gov.ph'),
      ('PSA', 'Philippine Statistics Authority', 'PSA', 'https://psa.gov.ph')
      ON CONFLICT (agency_id) DO NOTHING
    `;
    
    await pool.query(agenciesQuery);
    console.log('✅ Default agencies inserted');
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_geoportal_layers_agency ON geoportal_layers(agency)',
      'CREATE INDEX IF NOT EXISTS idx_geoportal_layers_data_type ON geoportal_layers(data_type)',
      'CREATE INDEX IF NOT EXISTS idx_geoportal_layers_active ON geoportal_layers(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_geoportal_sync_logs_date ON geoportal_sync_logs(sync_date)',
      'CREATE INDEX IF NOT EXISTS idx_geoportal_download_requests_status ON geoportal_download_requests(status)'
    ];
    
    for (const indexQuery of indexes) {
      await pool.query(indexQuery);
      console.log('✅ Index created');
    }
    
    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'geoportal_%'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Created Tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check initial data
    const [categoriesCount, agenciesCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM geoportal_categories'),
      pool.query('SELECT COUNT(*) as count FROM geoportal_agencies')
    ]);
    
    console.log('\n📈 Initial Data:');
    console.log(`   - Categories: ${categoriesCount.rows[0].count}`);
    console.log(`   - Agencies: ${agenciesCount.rows[0].count}`);
    
    console.log('\n🎉 Geoportal database initialization completed!');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  } finally {
    await pool.end();
  }
}

async function testGeoportalAPI() {
  try {
    console.log('\n🧪 Testing Geoportal API endpoints...');
    
    // Test sync endpoint
    console.log('\n1. Testing sync endpoint...');
    const syncResponse = await fetch('http://localhost:3000/api/geoportal/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (syncResponse.ok) {
      const syncData = await syncResponse.json();
      console.log('✅ Sync endpoint response:', syncData.message);
    } else {
      console.log('❌ Sync endpoint failed:', syncResponse.status);
    }
    
    // Test search endpoint
    console.log('\n2. Testing search endpoint...');
    const searchResponse = await fetch('http://localhost:3000/api/geoportal/layers?limit=5');
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('✅ Search endpoint response:');
      console.log(`   - Found ${searchData.data?.length || 0} layers`);
      console.log(`   - Total: ${searchData.pagination?.total || 0}`);
      
      if (searchData.data?.length > 0) {
        console.log('   - Sample layer:', searchData.data[0].title);
      }
    } else {
      console.log('❌ Search endpoint failed:', searchResponse.status);
    }
    
    // Test sync status
    console.log('\n3. Testing sync status...');
    const statusResponse = await fetch('http://localhost:3000/api/geoportal/sync');
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Status endpoint response:');
      console.log(`   - Latest sync: ${statusData.syncStatus?.sync_date || 'No sync yet'}`);
      console.log(`   - Total layers: ${statusData.statistics?.total_layers || 0}`);
      console.log(`   - Active layers: ${statusData.statistics?.active_layers || 0}`);
    } else {
      console.log('❌ Status endpoint failed:', statusResponse.status);
    }
    
    console.log('\n🎯 API testing completed!');
    
  } catch (error) {
    console.error('❌ API testing failed:', error);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'init':
      await initializeGeoportalTables();
      break;
    case 'test':
      await testGeoportalAPI();
      break;
    case 'all':
      await initializeGeoportalTables();
      await testGeoportalAPI();
      break;
    default:
      console.log('Usage:');
      console.log('  node geoportal-setup-simple.js init   - Initialize database tables');
      console.log('  node geoportal-setup-simple.js test   - Test API endpoints');
      console.log('  node geoportal-setup-simple.js all    - Initialize and test');
  }
}

main();
