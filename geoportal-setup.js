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
    
    // Read and execute the schema file
    const schemaPath = path.join(__dirname, 'database-schema-geoportal.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // First, create all tables (skip indexes for now)
    for (const statement of statements) {
      try {
        // Skip index creation statements for now
        if (statement.includes('CREATE INDEX')) {
          console.log(`⏭️  Skipping index creation: ${statement.substring(0, 50)}...`);
          continue;
        }
        
        await pool.query(statement);
        console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
        successCount++;
      } catch (error) {
        console.log(`❌ Error in statement: ${error.message}`);
        console.log(`   Statement: ${statement.substring(0, 100)}...`);
        errorCount++;
      }
    }
    
    // Now create indexes after tables are created
    console.log('\n🔧 Creating indexes...');
    for (const statement of statements) {
      try {
        if (statement.includes('CREATE INDEX')) {
          await pool.query(statement);
          console.log(`✅ Created index: ${statement.substring(0, 50)}...`);
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Error creating index: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Results: ${successCount} successful, ${errorCount} errors`);
    
    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'geoportal_%'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Created/Verified Tables:');
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
      console.log('  node geoportal-setup.js init   - Initialize database tables');
      console.log('  node geoportal-setup.js test   - Test API endpoints');
      console.log('  node geoportal-setup.js all    - Initialize and test');
  }
}

main();
