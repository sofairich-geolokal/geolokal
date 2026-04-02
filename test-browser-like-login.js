const http = require('http');

// Test exactly like browser does
const postData = JSON.stringify({
  username: 'ibaan.viewer2',
  password: 'viewer2',
  selectedCityId: '1'
});

console.log('Request body:', postData);
console.log('Request body length:', Buffer.byteLength(postData));

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

console.log('Request options:', options);

const req = http.request(options, (res) => {
  console.log('Response status:', res.statusCode);
  console.log('Response headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => { 
    data += chunk; 
    console.log('Received chunk:', chunk.length, 'bytes');
  });
  
  res.on('end', () => {
    console.log('Complete response:', data);
    try {
      const response = JSON.parse(data);
      console.log('Parsed response:', JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('JSON parse error:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(postData);
req.end();
console.log('Request sent');
