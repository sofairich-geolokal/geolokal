// Auto-sync GeoPortal layers script
// Run this to automatically fetch and save the three GeoPortal layers

const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function syncGeoPortalLayers() {
  console.log('🚀 Starting GeoPortal layer sync...');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/geoportal/sync',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    console.log('✅ GeoPortal sync completed:', response);
    
  } catch (error) {
    console.error('❌ GeoPortal sync failed:', error.message);
  }
}

// Run the sync
syncGeoPortalLayers();
