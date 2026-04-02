require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

async function testSaveMapAPI() {
  try {
    console.log('🧪 Testing saved maps API...');
    
    // Test POST endpoint (save map)
    console.log('\n1. Testing save map endpoint...');
    const testMapData = {
      user_id: 1,
      map_name: 'Test Map ' + Date.now(),
      map_description: 'Test map for verification',
      map_config: {
        layers: [],
        basemap: 'Open Street Map',
        timestamp: new Date().toISOString()
      },
      basemap: 'Open Street Map',
      center_lat: 13.4124,
      center_lng: 122.5619,
      zoom_level: 6,
      layers_config: []
    };
    
    try {
      const response = await fetch('http://localhost:3001/api/saved-maps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMapData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Save map successful:', result.message);
        console.log('   - Map ID:', result.data.id);
        console.log('   - Map Name:', result.data.map_name);
      } else {
        console.log('❌ Save map failed:', response.status);
        const errorText = await response.text();
        console.log('   - Error:', errorText);
      }
    } catch (fetchError) {
      console.log('❌ Fetch error:', fetchError.message);
    }
    
    // Test GET endpoint (fetch saved maps)
    console.log('\n2. Testing fetch saved maps endpoint...');
    try {
      const getResponse = await fetch('http://localhost:3001/api/saved-maps?userId=1');
      
      if (getResponse.ok) {
        const getResult = await getResponse.json();
        console.log('✅ Fetch saved maps successful');
        console.log(`   - Found ${getResult.data?.length || 0} saved maps`);
        
        if (getResult.data?.length > 0) {
          console.log('   - Latest map:', getResult.data[0].map_name);
        }
      } else {
        console.log('❌ Fetch saved maps failed:', getResponse.status);
        const errorText = await getResponse.text();
        console.log('   - Error:', errorText);
      }
    } catch (fetchError) {
      console.log('❌ Fetch error:', fetchError.message);
    }
    
    console.log('\n🎯 API testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testSaveMapAPI();
