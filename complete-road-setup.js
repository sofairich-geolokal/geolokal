const fs = require('fs');
const path = require('path');

async function completeRoadSetup() {
  try {
    console.log('🚀 Starting complete road networks setup...\n');
    
    // Step 1: Create the table
    console.log('📋 Step 1: Creating roadnetworks table...');
    const createResponse = await fetch('/api/create-road-table', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Table created:', createResult.message);
    } else {
      console.error('❌ Failed to create table:', createResponse.status);
      const errorText = await createResponse.text();
      console.error('Error details:', errorText);
      return;
    }
    
    // Wait a moment for table creation to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Seed the data
    console.log('\n🌱 Step 2: Seeding road data...');
    const seedResponse = await fetch('/api/seed-roads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (seedResponse.ok) {
      const seedResult = await seedResponse.json();
      console.log('✅ Data seeded:', seedResult.message);
    } else {
      console.error('❌ Failed to seed data:', seedResponse.status);
      const errorText = await seedResponse.text();
      console.error('Error details:', errorText);
      return;
    }
    
    // Wait a moment for data insertion to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Verify the setup
    console.log('\n🔍 Step 3: Verifying setup...');
    const verifyResponse = await fetch('/api/roads');
    
    if (verifyResponse.ok) {
      const verifyResult = await verifyResponse.json();
      if (verifyResult.success) {
        console.log(`✅ Verification successful!`);
        console.log(`📊 Found ${verifyResult.data.features.length} road features in database`);
        console.log(`🎯 Sample feature type: ${verifyResult.data.features[0]?.geometry?.type}`);
        console.log(`📍 Sample coordinates: ${JSON.stringify(verifyResult.data.features[0]?.geometry?.coordinates?.slice(0, 2))}`);
      } else {
        console.error('❌ Verification failed:', verifyResult.error);
      }
    } else {
      console.error('❌ Failed to verify:', verifyResponse.status);
    }
    
    console.log('\n🎉 Road networks setup complete!');
    console.log('💡 The road networks should now appear on the map in bright green!');
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
  }
}

// Run the complete setup
completeRoadSetup();
