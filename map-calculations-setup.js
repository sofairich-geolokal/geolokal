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

async function initializeMapCalculationsTables() {
  try {
    console.log('🚀 Initializing Map Calculations database tables...');
    
    // Read and execute the schema file
    const schemaPath = path.join(__dirname, 'database-schema-map-calculations.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema as one statement
    await pool.query(schema);
    console.log('✅ Map calculations tables created successfully');
    
    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('map_calculations', 'map_customizations', 'map_measurements', 'calculation_templates')
      ORDER BY table_name
    `);
    
    console.log('\n📋 Created Tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check initial data
    const [templatesCount, calculationsCount, customizationsCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM calculation_templates'),
      pool.query('SELECT COUNT(*) as count FROM map_calculations'),
      pool.query('SELECT COUNT(*) as count FROM map_customizations')
    ]);
    
    console.log('\n📈 Initial Data:');
    console.log(`   - Templates: ${templatesCount.rows[0].count}`);
    console.log(`   - Calculations: ${calculationsCount.rows[0].count}`);
    console.log(`   - Customizations: ${customizationsCount.rows[0].count}`);
    
    console.log('\n🎉 Map calculations database initialization completed!');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  } finally {
    await pool.end();
  }
}

async function testMapCalculationsAPI() {
  try {
    console.log('\n🧪 Testing Map Calculations API endpoints...');
    
    // Test GET endpoint
    console.log('\n1. Testing GET endpoint...');
    const getResponse = await fetch('http://localhost:3000/api/map-data');
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ GET endpoint response:');
      console.log(`   - Calculations types: ${getData.dashboard?.calculations?.length || 0}`);
      console.log(`   - Customizations count: ${getData.dashboard?.customizations?.count || 0}`);
      console.log(`   - Templates count: ${getData.dashboard?.templates?.length || 0}`);
    } else {
      console.log('❌ GET endpoint failed:', getResponse.status);
    }
    
    // Test POST calculation endpoint
    console.log('\n2. Testing POST calculation endpoint...');
    const calcResponse = await fetch('http://localhost:3000/api/map-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'calculation',
        data: {
          user_id: 'test_user',
          title: 'Test Area Calculation',
          calculation_type: 'area',
          input_data: { coordinates: [[0, 0], [1, 0], [1, 1], [0, 1]] },
          result_data: { value: 1.0, unit: 'sqmeters', formatted: '1.00 sqmeters' },
          units: 'sqmeters'
        }
      })
    });
    
    if (calcResponse.ok) {
      const calcData = await calcResponse.json();
      console.log('✅ POST calculation response:', calcData.message);
      console.log(`   - Calculation ID: ${calcData.id}`);
    } else {
      console.log('❌ POST calculation endpoint failed:', calcResponse.status);
    }
    
    // Test POST customization endpoint
    console.log('\n3. Testing POST customization endpoint...');
    const custResponse = await fetch('http://localhost:3000/api/map-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'customization',
        data: {
          user_id: 'test_user',
          title: 'Test Customization',
          description: 'A test map customization',
          map_config: { basemap: 'streets', layers: [] },
          view_state: { center: [0, 0], zoom: 10 },
          is_public: false
        }
      })
    });
    
    if (custResponse.ok) {
      const custData = await custResponse.json();
      console.log('✅ POST customization response:', custData.message);
      console.log(`   - Customization ID: ${custData.id}`);
    } else {
      console.log('❌ POST customization endpoint failed:', custResponse.status);
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
      await initializeMapCalculationsTables();
      break;
    case 'test':
      await testMapCalculationsAPI();
      break;
    case 'all':
      await initializeMapCalculationsTables();
      await testMapCalculationsAPI();
      break;
    default:
      console.log('Usage:');
      console.log('  node map-calculations-setup.js init   - Initialize database tables');
      console.log('  node map-calculations-setup.js test   - Test API endpoints');
      console.log('  node map-calculations-setup.js all    - Initialize and test');
  }
}

main();
