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

async function createSimpleAuditLogs() {
  try {
    console.log('Creating simple audit logs...');
    
    // Create audit logs without LGU constraint first
    const sampleLogs = [
      { actor: 'Rukhsar', action: 'USER_LOGIN', details: 'User logged in successfully' },
      { actor: 'Rukhsar', action: 'LAYER_VIEW', details: 'Viewed layer: Base Map' },
      { actor: 'ibaan.viewer1', action: 'MEASUREMENT_CREATE', details: 'Created measurement: Distance' },
      { actor: 'ibaan.viewer1', action: 'BOOKMARK_CREATE', details: 'Created bookmark: My Location' },
      { actor: 'ibaan.viewer2', action: 'EXPORT_REQUEST', details: 'Requested GeoJSON export' },
      { actor: 'Rukhi', action: 'MAP_PAN', details: 'Panned map to new location' },
      { actor: 'Rukhi', action: 'MAP_ZOOM', details: 'Zoomed map to level 15' },
      { actor: 'Admin', action: 'SYSTEM_START', details: 'System started successfully' },
      { actor: 'Admin', action: 'BACKUP_COMPLETE', details: 'Database backup completed' },
      { actor: 'Viewer', action: 'DATA_ACCESS', details: 'Accessed geospatial data' }
    ];
    
    for (let i = 0; i < sampleLogs.length; i++) {
      const log = sampleLogs[i];
      
      await pool.query(
        `INSERT INTO audit_logs (actor, action, details, created_by) 
         VALUES ($1, $2, $3, $4)`,
        [log.actor, log.action, log.details, log.actor]
      );
      console.log(`Created audit log: ${log.actor} - ${log.action}`);
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
    
    console.log('\n✅ Simple audit logs created successfully!');
    
  } catch (error) {
    console.error('Error creating audit logs:', error.message);
  } finally {
    await pool.end();
  }
}

createSimpleAuditLogs();
