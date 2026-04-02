const http = require('http');

// Test the complete login flow as it happens in browser
console.log('=== TESTING COMPLETE VIEWER LOGIN FLOW ===\n');

// Step 1: Test login with selectedCityId (simulating city selection)
console.log('1. Testing login WITH selectedCityId (as browser would send)...');
const postData = JSON.stringify({
  username: 'ibaan.viewer2',
  password: 'viewer2',
  selectedCityId: '1' // This comes from sessionStorage after city selection
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/viewer/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const response = JSON.parse(data);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('User should be redirected to viewer dashboard');
      } else {
        console.log('❌ LOGIN FAILED:', response.error);
      }
    } catch (e) {
      console.log('❌ Invalid JSON response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
});

req.write(postData);
req.end();

console.log('\n2. If login still fails, check browser console for:');
console.log('   - JavaScript errors');
console.log('   - Network tab for failed requests');
console.log('   - sessionStorage for selectedCityId');
console.log('\n3. Manual test steps:');
console.log('   - Open: http://localhost:3000/viewerDashboard/location-selection');
console.log('   - Select any city');
console.log('   - Click "Continue to Login"');
console.log('   - Enter: ibaan.viewer2 / viewer2');
console.log('   - Check browser console for errors');
