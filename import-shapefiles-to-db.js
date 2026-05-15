#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const BASE_PATH = 'C:\\Dev\\geolokal';
const FILES_DIR = path.join(BASE_PATH, 'Files');

const shapefiles = [
  { name: 'Ibaan_boundary', table: 'Ibaan_boundary', folder: 'Ibaan_boundary', shpFile: 'Ibaan_boundary.shp' },
  { name: 'Ibaan_roadnetworks', table: 'roadnetworks', folder: 'Ibaan_roadnetworks', shpFile: 'Ibaan_roadnetworks.shp' },
  { name: 'Ibaan_waterways', table: 'Ibaan_waterways', folder: 'Ibaan_waterways', shpFile: 'Ibaan_waterways.shp' },
  { name: 'ibaan_lots', table: 'ibaan_lots', folder: 'ibaan_lots', shpFile: 'ibaan_lots.shp' }
];

async function createTables() {
  console.log('Creating tables if they don\'t exist...');
  await pool.query('CREATE EXTENSION IF NOT EXISTS postgis');

  // Drop and recreate roadnetworks table to clear any index issues
  console.log('Recreating roadnetworks table...');
  await pool.query(`DROP TABLE IF EXISTS roadnetworks CASCADE`);

  // Tables
  await pool.query(`CREATE TABLE IF NOT EXISTS "Ibaan_boundary" (id SERIAL PRIMARY KEY, lotno VARCHAR(255) UNIQUE, brgy VARCHAR(255), shape_area DOUBLE PRECISION, geom GEOMETRY(MULTIPOLYGON, 4326))`);
  await pool.query(`CREATE TABLE roadnetworks (id SERIAL PRIMARY KEY, road_id VARCHAR(255) UNIQUE, properties JSONB, geom GEOMETRY(MULTILINESTRING, 4326))`);
  await pool.query(`CREATE TABLE IF NOT EXISTS "Ibaan_waterways" (id SERIAL PRIMARY KEY, "Name" VARCHAR(255) UNIQUE, "Type" VARCHAR(255), geom GEOMETRY(MULTILINESTRING, 4326))`);
  await pool.query(`CREATE TABLE IF NOT EXISTS ibaan_lots (id SERIAL PRIMARY KEY, "LotNumber" VARCHAR(255) UNIQUE, "Area" DOUBLE PRECISION, geom GEOMETRY(MULTIPOLYGON, 4326))`);

  // Indexes
  console.log('Creating indexes...');
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_boundary_geom ON "Ibaan_boundary" USING GIST (geom)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_roads_geom ON roadnetworks USING GIST (geom)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_water_geom ON "Ibaan_waterways" USING GIST (geom)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_lots_geom ON ibaan_lots USING GIST (geom)`);
  
  // Use GIN for JSONB (not GIST)
  await pool.query(`CREATE INDEX idx_roadnetworks_props ON roadnetworks USING GIN (properties)`);
}

async function runImport() {
  try {
    const client = await pool.connect();
    console.log('✓ Database connected successfully.');
    client.release();

    await createTables();

    for (const shp of shapefiles) {
      const shpPath = path.join(FILES_DIR, shp.folder, shp.shpFile);
      const jsonPath = path.join(FILES_DIR, shp.folder, `${shp.name}.json`);

      if (!fs.existsSync(shpPath)) continue;

      console.log(`Processing ${shp.name}...`);
      execSync(`npx mapshaper "${shpPath}" -o format=geojson "${jsonPath}"`, { stdio: 'ignore' });
      
      const geojson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      let count = 0;

      for (const feature of geojson.features) {
        const props = feature.properties || {};
        const geom = JSON.stringify(feature.geometry);

        if (shp.table === 'ibaan_lots') {
          await pool.query(`INSERT INTO ibaan_lots ("LotNumber", "Area", "geom") VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326)) ON CONFLICT ("LotNumber") DO UPDATE SET "Area" = EXCLUDED."Area", "geom" = EXCLUDED."geom"`, [props.LotNumber || props.lotno, parseFloat(props.Area || 0), geom]);
        } else if (shp.table === 'Ibaan_waterways') {
          await pool.query(`INSERT INTO "Ibaan_waterways" ("Name", "Type", "geom") VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326)) ON CONFLICT ("Name") DO UPDATE SET "Type" = EXCLUDED."Type", "geom" = EXCLUDED."geom"`, [props.Name, props.Type, geom]);
        } else if (shp.table === 'Ibaan_boundary') {
          await pool.query(`INSERT INTO "Ibaan_boundary" (lotno, brgy, shape_area, geom) VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326)) ON CONFLICT (lotno) DO UPDATE SET brgy = EXCLUDED.brgy, shape_area = EXCLUDED.shape_area, geom = EXCLUDED.geom`, [props.lotno, props.brgy, parseFloat(props.shape_area || 0), geom]);
        } else if (shp.table === 'roadnetworks') {
          // Using a combination of properties as a unique ID for road updates
          const roadId = props.full_id || props.osm_id || `${props.name}_${count}`;
          await pool.query(`INSERT INTO roadnetworks (road_id, properties, geom) VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326)) ON CONFLICT (road_id) DO UPDATE SET properties = EXCLUDED.properties, geom = EXCLUDED.geom`, [roadId, JSON.stringify(props), geom]);
        }
        count++;
      }
      console.log(`✓ ${shp.name}: Synced ${count} features.`);
      if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
    }

    console.log('\n--- Final Table Counts ---');
    for (const shp of shapefiles) {
      const res = await pool.query(`SELECT COUNT(*) FROM "${shp.table}"`);
      console.log(`${shp.table}: ${res.rows[0].count} records`);
    }

  } catch (err) {
    console.error('Database error:', err.message);
  } finally {
    await pool.end();
    console.log('\nSynchronization complete.');
  }
}

runImport();