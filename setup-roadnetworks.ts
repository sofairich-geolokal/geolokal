import { query } from './lib/db';
import fs from 'fs';
import path from 'path';

async function setupRoadNetworks() {
  try {
    console.log('Setting up road networks database...');
    
    // Step 1: Create the table
    console.log('Creating roadnetworks table...');
    await query(`
      CREATE TABLE IF NOT EXISTS roadnetworks (
          id SERIAL PRIMARY KEY,
          properties JSONB,
          geometry JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Table created successfully!');
    
    // Step 2: Create indexes
    console.log('Creating indexes...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_roadnetworks_geometry ON roadnetworks USING GIN (geometry)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_roadnetworks_properties ON roadnetworks USING GIN (properties)
    `);
    
    console.log('Indexes created successfully!');
    
    // Step 3: Clear existing data
    console.log('Clearing existing road data...');
    await query('DELETE FROM roadnetworks');
    
    // Step 4: Read and insert road data
    console.log('Reading road networks data...');
    const filePath = path.join(__dirname, 'data', 'Ibaan_roadnetworks.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const roadData = JSON.parse(fileContent);
    
    console.log(`Found ${roadData.features.length} road features`);
    
    // Step 5: Insert road features
    console.log('Inserting road features...');
    for (let i = 0; i < roadData.features.length; i++) {
      const feature = roadData.features[i];
      const properties = JSON.stringify(feature.properties || {});
      const geometry = JSON.stringify(feature.geometry || {});
      
      await query(
        'INSERT INTO roadnetworks (properties, geometry) VALUES ($1, $2)',
        [properties, geometry]
      );
      
      if ((i + 1) % 10 === 0) {
        console.log(`Inserted ${i + 1}/${roadData.features.length} features...`);
      }
    }
    
    console.log(`Successfully inserted ${roadData.features.length} road features!`);
    console.log('Road networks setup complete!');
    
  } catch (error: any) {
    console.error('Error setting up road networks:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the setup
setupRoadNetworks();
