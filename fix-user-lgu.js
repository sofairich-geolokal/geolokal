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

async function fixUserLgu() {
  try {
    console.log('Fixing user LGU assignments...');
    
    // First, let's check the foreign key constraint
    const constraintCheck = await pool.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'users'
        AND kcu.column_name = 'lgu_id';
    `);
    
    console.log('Foreign key constraint info:', constraintCheck.rows);
    
    // Check if LGU ID 4 exists
    const lguCheck = await pool.query('SELECT id, name FROM city_muni_master WHERE id = 4');
    console.log('LGU ID 4:', lguCheck.rows);
    
    // Update user without LGU constraint temporarily
    await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_lgu_id_fkey');
    console.log('Dropped foreign key constraint temporarily');
    
    // Update user LGU assignments
    await pool.query('UPDATE users SET lgu_id = 4 WHERE username IN (\'Rukhsar\', \'ibaan.viewer1\', \'ibaan.viewer2\')');
    console.log('Updated users to LGU ID 4');
    
    await pool.query('UPDATE users SET lgu_id = 4 WHERE username = \'Rukhi\'');
    console.log('Updated Rukhi to LGU ID 4');
    
    // Re-add the foreign key constraint
    await pool.query('ALTER TABLE users ADD CONSTRAINT users_lgu_id_fkey FOREIGN KEY (lgu_id) REFERENCES city_muni_master(id)');
    console.log('Re-added foreign key constraint');
    
    // Verify updates
    const userCheck = await pool.query('SELECT id, username, lgu_id FROM users WHERE username IN (\'Rukhsar\', \'ibaan.viewer1\', \'ibaan.viewer2\', \'Rukhi\')');
    console.log('Updated users:', userCheck.rows);
    
    // Check audit logs for this LGU
    const auditCheck = await pool.query('SELECT COUNT(*) FROM audit_logs WHERE lgu_id = 4');
    console.log('Audit logs for LGU 4:', auditCheck.rows[0].count);
    
    console.log('✅ User LGU assignments fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing user LGU:', error.message);
  } finally {
    await pool.end();
  }
}

fixUserLgu();
