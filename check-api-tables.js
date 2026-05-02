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

async function checkTables() {
  console.log('Checking database tables...\n');
  
  try {
    // Check map_layers table
    const mapLayersCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'map_layers'
      );
    `);
    console.log('map_layers table exists:', mapLayersCheck.rows[0].exists);
    
    if (mapLayersCheck.rows[0].exists) {
      const count = await pool.query('SELECT COUNT(*) FROM map_layers');
      console.log('map_layers row count:', count.rows[0].count);
    }
    
    // Check geoportal_layers table
    const geoportalLayersCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'geoportal_layers'
      );
    `);
    console.log('geoportal_layers table exists:', geoportalLayersCheck.rows[0].exists);
    
    if (geoportalLayersCheck.rows[0].exists) {
      const count = await pool.query('SELECT COUNT(*) FROM geoportal_layers');
      console.log('geoportal_layers row count:', count.rows[0].count);
    }
    
    // Check layer_categories table
    const layerCategoriesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'layer_categories'
      );
    `);
    console.log('layer_categories table exists:', layerCategoriesCheck.rows[0].exists);
    
    // Check geoportal_categories table
    const geoportalCategoriesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'geoportal_categories'
      );
    `);
    console.log('geoportal_categories table exists:', geoportalCategoriesCheck.rows[0].exists);
    
    // List all tables
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('\nAll tables in public schema:');
    allTables.rows.forEach(row => console.log('  -', row.table_name));
    
  } catch (error) {
    console.error('Error checking tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
