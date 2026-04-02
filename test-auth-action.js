// Test the auth action directly to see what error occurs
require('dotenv').config();

// Simulate the server action environment
async function testAuthAction() {
  const { login } = require('./app/actions/auth.ts');
  
  try {
    console.log('Testing auth action with viewer credentials...');
    const result = await login('ibaan.viewer2', 'viewer2', '1', 'viewer');
    console.log('Auth action result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Auth action error:', error.message);
    console.error('Full error:', error);
  }
}

testAuthAction();
