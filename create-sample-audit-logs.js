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

async function createSampleAuditLogs() {
  try {
    console.log('Creating sample audit logs...');
    
    // Get LGU data
    const lguResult = await pool.query('SELECT id, name FROM city_muni_master LIMIT 3');
    const lgus = lguResult.rows;
    
    if (lgus.length === 0) {
      console.log('No LGUs found. Creating sample LGU first...');
      await pool.query('INSERT INTO city_muni_master (name, province) VALUES ($1, $2)', ['Ibaan', 'Batangas']);
      await pool.query('INSERT INTO city_muni_master (name, province) VALUES ($1, $2)', ['Batangas City', 'Batangas']);
      await pool.query('INSERT INTO city_muni_master (name, province) VALUES ($1, $2)', ['Lipa City', 'Batangas']);
      
      const newLguResult = await pool.query('SELECT id, name FROM city_muni_master');
      lgus.push(...newLguResult.rows);
    }
    
    // Get users for each LGU
    for (const lgu of lgus) {
      const userResult = await pool.query('SELECT id, username FROM users WHERE lgu_id = $1 LIMIT 1', [lgu.id]);
      const user = userResult.rows[0];
      
      if (user) {
        console.log(`Creating audit logs for LGU: ${lgu.name}, User: ${user.username}`);
        
        // Insert sample audit logs
        const sampleLogs = [
          ['USER_LOGIN', 'User logged in successfully'],
          ['LAYER_VIEW', 'Viewed layer: Base Map'],
          ['MEASUREMENT_CREATE', 'Created measurement: Distance'],
          ['BOOKMARK_CREATE', 'Created bookmark: My Location'],
          ['EXPORT_REQUEST', 'Requested GeoJSON export'],
          ['MAP_PAN', 'Panned map to new location'],
          ['MAP_ZOOM', 'Zoomed map to level 15'],
          ['LAYER_TOGGLE', 'Toggled layer visibility'],
          ['SEARCH_QUERY', 'Searched for location data'],
          ['DATA_UPLOAD', 'Uploaded shapefile data']
        ];
        
        for (let i = 0; i < sampleLogs.length; i++) {
          const [action, details] = sampleLogs[i];
          const timestamp = new Date(Date.now() - (i * 3600000)); // Each log 1 hour apart
          
          await pool.query(
            `INSERT INTO audit_logs (actor, action, details, lgu_id, created_by, actor_id) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [user.username, action, details, lgu.id, user.username, user.id]
          );
        }
        
        console.log(`Created ${sampleLogs.length} sample audit logs for ${lgu.name}`);
      } else {
        console.log(`No users found for LGU: ${lgu.name}`);
      }
    }
    
    // Verify logs were created
    const countResult = await pool.query('SELECT COUNT(*) FROM audit_logs');
    console.log(`Total audit logs in database: ${countResult.rows[0].count}`);
    
    // Show sample of logs
    const sampleResult = await pool.query(`
      SELECT actor, action, details, timestamp 
      FROM audit_logs 
      ORDER BY timestamp DESC 
      LIMIT 5
    `);
    
    console.log('\nSample audit logs:');
    sampleResult.rows.forEach(log => {
      console.log(`- ${log.timestamp}: ${log.actor} - ${log.action} - ${log.details}`);
    });
    
  } catch (error) {
    console.error('Error creating sample audit logs:', error.message);
  } finally {
    await pool.end();
  }
}

createSampleAuditLogs();
