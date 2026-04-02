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

async function createWorkingAuditLogs() {
  try {
    console.log('Creating working audit logs...');
    
    // Create audit logs with the actual database schema
    const sampleLogs = [
      { 
        table_name: 'users', 
        action: 'LOGIN', 
        actor: 'Rukhsar', 
        created_by: 'Rukhsar',
        actor_id: 7,
        lgu_id: 4,
        details: 'User logged in successfully'
      },
      { 
        table_name: 'map_layers', 
        action: 'VIEW', 
        actor: 'Rukhsar', 
        created_by: 'Rukhsar',
        actor_id: 7,
        lgu_id: 4,
        details: 'Viewed layer: Base Map'
      },
      { 
        table_name: 'map_layers', 
        action: 'MEASURE', 
        actor: 'ibaan.viewer1', 
        created_by: 'ibaan.viewer1',
        actor_id: 8,
        lgu_id: 4,
        details: 'Created measurement: Distance'
      },
      { 
        table_name: 'map_layers', 
        action: 'BOOKMARK', 
        actor: 'ibaan.viewer1', 
        created_by: 'ibaan.viewer1',
        actor_id: 8,
        lgu_id: 4,
        details: 'Created bookmark: My Location'
      },
      { 
        table_name: 'users', 
        action: 'EXPORT', 
        actor: 'ibaan.viewer2', 
        created_by: 'ibaan.viewer2',
        actor_id: 10,
        lgu_id: 4,
        details: 'Requested GeoJSON export'
      },
      { 
        table_name: 'map_layers', 
        action: 'PAN', 
        actor: 'Rukhi', 
        created_by: 'Rukhi',
        actor_id: 11,
        lgu_id: 4,
        details: 'Panned map to new location'
      },
      { 
        table_name: 'map_layers', 
        action: 'ZOOM', 
        actor: 'Rukhi', 
        created_by: 'Rukhi',
        actor_id: 11,
        lgu_id: 4,
        details: 'Zoomed map to level 15'
      },
      { 
        table_name: 'system', 
        action: 'START', 
        actor: 'Admin', 
        created_by: 'Admin',
        lgu_id: 4,
        details: 'System started successfully'
      },
      { 
        table_name: 'system', 
        action: 'BACKUP', 
        actor: 'Admin', 
        created_by: 'Admin',
        lgu_id: 4,
        details: 'Database backup completed'
      },
      { 
        table_name: 'map_layers', 
        action: 'ACCESS', 
        actor: 'Viewer', 
        created_by: 'Viewer',
        lgu_id: 4,
        details: 'Accessed geospatial data'
      }
    ];
    
    for (let i = 0; i < sampleLogs.length; i++) {
      const log = sampleLogs[i];
      
      await pool.query(
        `INSERT INTO audit_logs (table_name, action, actor, created_by, actor_id, lgu_id, details) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [log.table_name, log.action, log.actor, log.created_by, log.actor_id, log.lgu_id, log.details]
      );
      console.log(`Created audit log: ${log.actor} - ${log.action}`);
    }
    
    // Verify logs were created
    const countResult = await pool.query('SELECT COUNT(*) FROM audit_logs');
    console.log(`\nTotal audit logs in database: ${countResult.rows[0].count}`);
    
    // Show sample of logs
    const sampleResult = await pool.query(`
      SELECT actor, action, details, created_at 
      FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\nSample audit logs:');
    sampleResult.rows.forEach(log => {
      console.log(`- ${log.created_at}: ${log.actor} - ${log.action} - ${log.details}`);
    });
    
    console.log('\n✅ Working audit logs created successfully!');
    
  } catch (error) {
    console.error('Error creating audit logs:', error.message);
  } finally {
    await pool.end();
  }
}

createWorkingAuditLogs();
