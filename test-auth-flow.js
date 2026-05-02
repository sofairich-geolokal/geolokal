require('dotenv').config();

// Test the login functionality by simulating the auth flow
async function testAuthFlow() {
  console.log('=== Testing Authentication Flow ===\n');
  
  const testUsers = [
    { username: 'admin123', password: 'admin123', role: 'admin', expectedDashboard: '/lgu-dashboard/(portal)/dashboard' },
    { username: 'superadmin', password: 'superadmin', role: 'superadmin', expectedDashboard: '/superadmin/(auth)/dashboard' },
    { username: 'viewer', password: 'viewer', role: 'viewer', expectedDashboard: '/viewerDashboard/dashboard' }
  ];

  for (const user of testUsers) {
    console.log(`Testing user: ${user.username} (${user.role})`);
    
    try {
      // Simulate the login API call
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          password: user.password,
          targetDashboard: user.role === 'admin' ? 'lgu' : user.role === 'superadmin' ? 'superadmin' : 'viewer'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Login successful for ${user.username}`);
        console.log(`   Expected dashboard: ${user.expectedDashboard}`);
        console.log(`   User role: ${result.user?.role}`);
        console.log(`   User ID: ${result.user?.id}`);
      } else {
        const error = await response.text();
        console.log(`❌ Login failed for ${user.username}: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Network error for ${user.username}: ${error.message}`);
    }
    
    console.log('---');
  }
  
  console.log('\n=== Testing Dashboard Access ===');
  console.log('The following URLs should be accessible after login:');
  console.log('1. http://localhost:3000/lgu-dashboard/(portal)/dashboard (Admin)');
  console.log('2. http://localhost:3000/superadmin/(auth)/dashboard (Superadmin)');
  console.log('3. http://localhost:3000/viewerDashboard/dashboard (Viewer)');
  console.log('\nTest with these credentials:');
  console.log('- Admin: username=admin123, password=admin123');
  console.log('- Superadmin: username=superadmin, password=superadmin');
  console.log('- Viewer: username=viewer, password=viewer');
}

// Check if the server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Server is running on http://localhost:3000');
      testAuthFlow();
    } else {
      console.log('❌ Server responded with error');
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start the server with: npm run dev');
  }
}

checkServer();
