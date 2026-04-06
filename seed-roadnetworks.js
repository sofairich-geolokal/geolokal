const fs = require('fs');
const path = require('path');

// Simple script to seed road networks data
async function seedRoadNetworks() {
  try {
    console.log('Reading road networks data...');
    
    // Read the local road networks JSON file
    const filePath = path.join(__dirname, 'data', 'Ibaan_roadnetworks.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const roadData = JSON.parse(fileContent);
    
    console.log(`Found ${roadData.features.length} road features`);
    console.log('Sample feature:', roadData.features[0]);
    
    // You can use the API endpoint to seed the data
    console.log('\nTo seed the data to database:');
    console.log('1. Run the SQL script: create-roadnetworks-table.sql');
    console.log('2. Make a POST request to: /api/seed-roads');
    console.log('Or use curl:');
    console.log('curl -X POST http://localhost:3000/api/seed-roads');
    
  } catch (error) {
    console.error('Error reading road data:', error);
  }
}

seedRoadNetworks();
