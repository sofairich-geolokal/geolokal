require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createTestUsers() {
  try {
    console.log('Creating test users for login testing...');
    
    // Create sample LGUs if they don't exist
    const lgus = [
      { name: 'Ibaan', province: 'Batangas' },
      { name: 'Teresa', province: 'Rizal' },
      { name: 'Binangonan', province: 'Rizal' }
    ];
    
    for (const lguData of lgus) {
      const existingLgu = await pool.query('SELECT id FROM city_muni_master WHERE name = $1', [lguData.name]);
      
      if (existingLgu.rows.length === 0) {
        const lguResult = await pool.query(
          'INSERT INTO city_muni_master (name, province) VALUES ($1, $2) RETURNING id',
          [lguData.name, lguData.province]
        );
        console.log(`Created LGU: ${lguData.name} with ID: ${lguResult.rows[0].id}`);
      }
    }
    
    // Get LGU IDs
    const lguResult = await pool.query('SELECT id, name FROM city_muni_master ORDER BY id');
    const lgusList = lguResult.rows;
    
    // Create test users with plain text passwords (matching current auth system)
    const users = [
      { username: 'admin123', email: 'admin@ibaan.gov.ph', role: 'admin', lguIndex: 0, password: 'admin123' },
      { username: 'superadmin', email: 'super@geolokal.gov.ph', role: 'superadmin', lguIndex: 0, password: 'superadmin' },
      { username: 'viewer', email: 'viewer@geolokal.gov.ph', role: 'viewer', lguIndex: 0, password: 'viewer' }
    ];
    
    for (const userData of users) {
      const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [userData.username]);
      
      if (existingUser.rows.length === 0) {
        const lguId = lgusList[userData.lguIndex]?.id;
        
        await pool.query(
          `INSERT INTO users (username, email, password_hash, role, lgu_id, created_by) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userData.username, userData.email, userData.password, userData.role, lguId, 'system']
        );
        
        console.log(`Created user: ${userData.username} (role: ${userData.role})`);
        console.log(`  Password: ${userData.password}`);
        console.log(`  LGU: ${lgusList[userData.lguIndex]?.name}`);
      } else {
        console.log(`User ${userData.username} already exists`);
      }
    }
    
    // Display all users for testing
    console.log('\n=== Test Users Created ===');
    const allUsers = await pool.query('SELECT username, role, lgu_id, password_hash FROM users');
    allUsers.rows.forEach(user => {
      console.log(`Username: ${user.username}, Role: ${user.role}, Password: ${user.password_hash}`);
    });
    
    console.log('\nTest users ready for login!');
    
  } catch (error) {
    console.error('Error creating test data:', error.message);
  } finally {
    await pool.end();
  }
}

createTestUsers();
