const fs = require('fs');
const path = require('path');

// Simple setup script using the API endpoints
async function setupRoadNetworks() {
  try {
    console.log('Setting up road networks...');
    
    // Step 1: Create the table using the seed API
    console.log('Creating table and seeding data...');
    
    const response = await fetch('/api/seed-roads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success:', result.message);
    } else {
      console.error('❌ Failed to seed data:', response.status);
    }
    
    // Step 2: Verify the data was inserted
    console.log('Verifying data...');
    const verifyResponse = await fetch('/api/roads');
    if (verifyResponse.ok) {
      const verifyResult = await verifyResponse.json();
      if (verifyResult.success) {
        console.log(`✅ Verification successful: ${verifyResult.data.features.length} road features in database`);
      } else {
        console.error('❌ Verification failed:', verifyResult.error);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the setup
setupRoadNetworks();
