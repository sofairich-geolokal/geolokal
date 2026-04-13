require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '16443'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function checkMapLayersColumns() {
  try {
    console.log('🗺️ Checking map_layers table structure...');
    
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'map_layers' 
      ORDER BY ordinal_position
    `);
    
    console.log('📝 map_layers table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Also check sample data
    const sample = await pool.query('SELECT * FROM map_layers LIMIT 3');
    console.log('\n📊 Sample data:');
    console.log(JSON.stringify(sample.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkMapLayersColumns();
