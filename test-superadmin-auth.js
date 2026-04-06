// Test script to verify superadmin role validation
const { login } = require('./app/actions/auth');

async function testSuperadminAuth() {
  console.log('Testing superadmin authentication...');
  
  // Test 1: Valid superadmin credentials (assuming there's a superadmin user)
  try {
    const result = await login('superadmin', 'password', undefined, 'superadmin');
    console.log('Superadmin login result:', result);
  } catch (error) {
    console.error('Superadmin login error:', error.message);
  }
  
  // Test 2: Non-superadmin user trying to access superadmin
  try {
    const result = await login('regularuser', 'password', undefined, 'superadmin');
    console.log('Regular user superadmin login result:', result);
  } catch (error) {
    console.error('Regular user superadmin login error:', error.message);
  }
  
  // Test 3: LGU user trying to access superadmin
  try {
    const result = await login('lguuser', 'password', undefined, 'superadmin');
    console.log('LGU user superadmin login result:', result);
  } catch (error) {
    console.error('LGU user superadmin login error:', error.message);
  }
}

testSuperadminAuth().then(() => {
  console.log('Auth tests completed');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
