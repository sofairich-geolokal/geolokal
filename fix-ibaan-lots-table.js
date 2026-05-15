#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function fixIbaanLotsTable() {
  try {
    const client = await pool.connect();
    console.log('✓ Database connected successfully.');

    console.log('Dropping ibaan_lots table...');
    await pool.query(`DROP TABLE IF EXISTS ibaan_lots CASCADE`);
    console.log('✓ Table dropped');

    console.log('Recreating ibaan_lots table...');
    await pool.query(`
      CREATE TABLE ibaan_lots (
        id SERIAL PRIMARY KEY,
        "LotNumber" VARCHAR(255) UNIQUE,
        "Area" DOUBLE PRECISION,
        geom GEOMETRY(GEOMETRY, 4326),
        properties JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✓ Table recreated');

    console.log('Creating indexes...');
    await pool.query(`CREATE INDEX idx_lots_geom ON ibaan_lots USING GIST (geom)`);
    await pool.query(`CREATE INDEX idx_lots_props ON ibaan_lots USING GIN (properties)`);
    console.log('✓ Indexes created');

    console.log('✅ ibaan_lots table fixed successfully');

    client.release();
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixIbaanLotsTable();
