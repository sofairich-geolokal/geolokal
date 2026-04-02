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

async function createSampleUsers() {
  try {
    console.log('Creating sample users and LGUs...');
    
    // Create sample LGUs if they don't exist
    const lgus = [
      { name: 'Ibaan', province: 'Batangas' },
      { name: 'Batangas City', province: 'Batangas' },
      { name: 'Lipa City', province: 'Batangas' }
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
    
    // Create sample users
    const users = [
      { username: 'ibaan_admin', email: 'admin@ibaan.gov.ph', role: 'L', lguIndex: 0 },
      { username: 'batangas_admin', email: 'admin@batangas.gov.ph', role: 'L', lguIndex: 1 },
      { username: 'lipa_admin', email: 'admin@lipa.gov.ph', role: 'L', lguIndex: 2 },
      { username: 'super_admin', email: 'super@geolokal.gov.ph', role: 'S', lguIndex: 0 },
      { username: 'viewer_user', email: 'viewer@geolokal.gov.ph', role: 'V', lguIndex: 0 }
    ];
    
    for (const userData of users) {
      const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [userData.username]);
      
      if (existingUser.rows.length === 0) {
        const lguId = lgusList[userData.lguIndex]?.id;
        const hashedPassword = 'hashed_password_here'; // In production, use bcrypt
        
        await pool.query(
          `INSERT INTO users (username, email, password_hash, role, lgu_id, created_by) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userData.username, userData.email, hashedPassword, userData.role, lguId, 'system']
        );
        
        console.log(`Created user: ${userData.username} for LGU: ${lgusList[userData.lguIndex]?.name}`);
      }
    }
    
    console.log('Sample users and LGUs created successfully!');
    
  } catch (error) {
    console.error('Error creating sample data:', error.message);
  } finally {
    await pool.end();
  }
}

createSampleUsers();
