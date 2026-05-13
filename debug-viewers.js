const { query } = require('./lib/db');

async function debugViewers() {
  try {
    console.log('=== DEBUGGING VIEWERS ===');
    
    // Check all users in database
    const allUsers = await query('SELECT id, username, email, role, created_by, is_active FROM users ORDER BY created_at DESC');
    console.log('\nAll users in database:');
    console.table(allUsers.rows);
    
    // Check only viewers
    const viewersOnly = await query('SELECT id, username, email, role, created_by, is_active FROM users WHERE role = \'viewer\' ORDER BY created_at DESC');
    console.log('\nViewers only:');
    console.table(viewersOnly.rows);
    
    // Check LGU users
    const lguUsers = await query('SELECT id, username, email, role FROM users WHERE role = \'lgu\' ORDER BY created_at DESC');
    console.log('\nLGU users:');
    console.table(lguUsers.rows);
    
    // Check created_by values
    const createdByValues = await query('SELECT DISTINCT created_by FROM users WHERE role = \'viewer\'');
    console.log('\nDistinct created_by values for viewers:');
    console.table(createdByValues.rows);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
  
  process.exit(0);
}

debugViewers();
