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

async function fixAuditLogs() {
  try {
    console.log('Fixing audit logs data...');
    
    // Update existing users to have proper LGU assignments
    const users = [
      { username: 'Rukhsar', lgu_id: 10 }, // Ibaan
      { username: 'ibaan.viewer1', lgu_id: 10 }, // Ibaan
      { username: 'ibaan.viewer2', lgu_id: 10 }, // Ibaan
      { username: 'Rukhi', lgu_id: 11 } // Batangas City
    ];
    
    for (const user of users) {
      await pool.query(
        'UPDATE users SET lgu_id = $1 WHERE username = $2',
        [user.lgu_id, user.username]
      );
      console.log(`Updated ${user.username} to LGU ID: ${user.lgu_id}`);
    }
    
    // Create sample audit logs for users with LGU assignments
    const sampleLogs = [
      { username: 'Rukhsar', action: 'USER_LOGIN', details: 'User logged in successfully' },
      { username: 'Rukhsar', action: 'LAYER_VIEW', details: 'Viewed layer: Base Map' },
      { username: 'ibaan.viewer1', action: 'MEASUREMENT_CREATE', details: 'Created measurement: Distance' },
      { username: 'ibaan.viewer1', action: 'BOOKMARK_CREATE', details: 'Created bookmark: My Location' },
      { username: 'ibaan.viewer2', action: 'EXPORT_REQUEST', details: 'Requested GeoJSON export' },
      { username: 'Rukhi', action: 'MAP_PAN', details: 'Panned map to new location' },
      { username: 'Rukhi', action: 'MAP_ZOOM', details: 'Zoomed map to level 15' }
    ];
    
    for (let i = 0; i < sampleLogs.length; i++) {
      const log = sampleLogs[i];
      
      // Get user info
      const userResult = await pool.query('SELECT id, lgu_id FROM users WHERE username = $1', [log.username]);
      const user = userResult.rows[0];
      
      if (user && user.lgu_id) {
        await pool.query(
          `INSERT INTO audit_logs (actor, action, details, lgu_id, created_by, actor_id) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [log.username, log.action, log.details, user.lgu_id, log.username, user.id]
        );
        console.log(`Created audit log: ${log.username} - ${log.action}`);
      }
    }
    
    // Verify logs were created
    const countResult = await pool.query('SELECT COUNT(*) FROM audit_logs');
    console.log(`\nTotal audit logs in database: ${countResult.rows[0].count}`);
    
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
    
    console.log('\n✅ Audit logs data fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing audit logs:', error.message);
  } finally {
    await pool.end();
  }
}

fixAuditLogs();
