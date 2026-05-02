const { query } = require('./lib/db-direct');

(async () => {
  try {
    console.log('=== CHECKING USER ROLES AND LOGIN ACCESS ===\n');
    
    // Get all users with their roles
    const usersResult = await query('SELECT id, username, role, lgu_id FROM users ORDER BY id');
    console.log('All Users in Database:');
    console.log('ID | Username | Role | LGU_ID');
    console.log('---|----------|------|-------');
    usersResult.rows.forEach(user => {
      console.log(`${user.id} | ${user.username} | ${user.role} | ${user.lgu_id}`);
    });
    
    console.log('\n=== ROLE VALIDATION LOGIC ===\n');
    
    // Test role-based access logic
    usersResult.rows.forEach(user => {
      const role = user.role.toLowerCase();
      const canAccessLgu = role !== 'viewer' && role !== 'superadmin';
      const canAccessViewer = role === 'viewer';
      const canAccessSuperadmin = role === 'superadmin';
      
      console.log(`User: ${user.username} (${role})`);
      console.log(`  - LGU Dashboard: ${canAccessLgu ? '✓ ALLOWED' : '✗ DENIED'}`);
      console.log(`  - Viewer Dashboard: ${canAccessViewer ? '✓ ALLOWED' : '✗ DENIED'}`);
      console.log(`  - Superadmin Dashboard: ${canAccessSuperadmin ? '✓ ALLOWED' : '✗ DENIED'}`);
      console.log('');
    });
    
    console.log('\n=== AUTH FUNCTION CHECKS ===\n');
    console.log('requireLguRole() allows: All roles EXCEPT viewer and superadmin');
    console.log('requireViewerRole() allows: ONLY viewer role');
    console.log('requireSuperadminRole() allows: ONLY superadmin role');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
