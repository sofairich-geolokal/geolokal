/**
 * Daily Demographic Data Update Script
 * This script should be run daily via cron job or task scheduler
 * 
 * Usage: node scripts/update-demographics-daily.js
 * 
 * Cron examples:
 * - Linux/Mac: 0 2 * * * cd /path/to/geolokal && node scripts/update-demographics-daily.js
 * - Windows: Create a scheduled task to run this script daily at 2 AM
 */

const fetch = require('node-fetch');

async function updateDemographics() {
  try {
    console.log('🚀 Starting daily demographic data update...');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    
    const response = await fetch('http://localhost:3000/api/update-demographics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Update successful:', result);
    } else {
      console.error('❌ Update failed:', response.statusText);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error running update:', error);
    process.exit(1);
  }
}

// Run the update
updateDemographics();
