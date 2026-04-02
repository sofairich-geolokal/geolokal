// Test the complete login flow as it happens in browser
const http = require('http');

// Step 1: Test login with selectedCityId (as the page expects)
console.log('Testing login WITH selectedCityId...');
const postDataWithCity = JSON.stringify({
  username: 'ibaan.viewer2',
  password: 'viewer2',
  selectedCityId: '1' // Simulating city selection
});

const options1 = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/viewer/login',
  method: 'POST',
  headers: {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postDataWithCity)}
};

const req1 = http.request(options1, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { 
    console.log('WITH selectedCityId - Status:', res.statusCode);
    console.log('WITH selectedCityId - Response:', JSON.stringify(JSON.parse(data), null, 2)); 
  });
});
req1.on('error', (e) => { console.error('Problem:', e.message); });
req1.write(postDataWithCity); req1.end();

// Step 2: Test login without selectedCityId
setTimeout(() => {
  console.log('\nTesting login WITHOUT selectedCityId...');
  const postDataWithoutCity = JSON.stringify({
    username: 'ibaan.viewer2',
    password: 'viewer2'
  });

  const options2 = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/viewer/login',
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postDataWithoutCity)}
  };

  const req2 = http.request(options2, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => { 
      console.log('WITHOUT selectedCityId - Status:', res.statusCode);
      console.log('WITHOUT selectedCityId - Response:', JSON.stringify(JSON.parse(data), null, 2)); 
    });
  });
  req2.on('error', (e) => { console.error('Problem:', e.message); });
  req2.write(postDataWithoutCity); req2.end();
}, 1000);
