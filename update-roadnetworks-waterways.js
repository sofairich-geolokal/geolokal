#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const DATA_DIR = path.join(__dirname, 'data');

const geojsonFiles = [
  { name: 'Ibaan_roadnetworks', file: 'Ibaan_roadnetworks.json', table: 'roadnetworks' },
  { name: 'Ibaan_waterways', file: 'Ibaan_waterways.json', table: 'Ibaan_waterways' }
];

async function addColumnIfNotExists(tableName, columnName, columnDefinition) {
  try {
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    `, [tableName, columnName]);
    
    if (checkColumn.rows.length === 0) {
      await pool.query(`ALTER TABLE "${tableName}" ADD COLUMN ${columnName} ${columnDefinition}`);
      console.log(`Added column ${columnName} to table ${tableName}`);
    }
  } catch (err) {
    console.log(`Note: Could not add column ${columnName} to ${tableName}: ${err.message}`);
  }
}

async function alterGeometryColumn(tableName, newType) {
  try {
    await pool.query(`ALTER TABLE "${tableName}" ALTER COLUMN geom TYPE ${newType} USING geom::${newType}`);
    console.log(`Altered geom column in ${tableName} to ${newType}`);
  } catch (err) {
    console.log(`Note: Could not alter geom column in ${tableName}: ${err.message}`);
  }
}

async function resetSequence(tableName) {
  try {
    await pool.query(`SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "${tableName}"`);
    console.log(`Reset sequence for ${tableName}`);
  } catch (err) {
    console.log(`Note: Could not reset sequence for ${tableName}: ${err.message}`);
  }
}

async function createTables() {
  console.log('Creating tables if they don\'t exist...');
  await pool.query('CREATE EXTENSION IF NOT EXISTS postgis');

  // Create roadnetworks table - use GEOMETRY to handle both LineString and MultiLineString
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roadnetworks (
      id SERIAL PRIMARY KEY,
      road_id VARCHAR(255) UNIQUE,
      properties JSONB,
      geom GEOMETRY(GEOMETRY, 4326)
    )
  `);

  // Create Ibaan_waterways table - use GEOMETRY to handle both LineString and MultiLineString
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Ibaan_waterways" (
      id SERIAL PRIMARY KEY,
      "Name" VARCHAR(255) UNIQUE,
      "Type" VARCHAR(255),
      geom GEOMETRY(GEOMETRY, 4326)
    )
  `);

  // Alter existing geometry columns to generic GEOMETRY type if needed
  console.log('Altering geometry columns to generic type...');
  await alterGeometryColumn('roadnetworks', 'GEOMETRY(GEOMETRY, 4326)');
  await alterGeometryColumn('Ibaan_waterways', 'GEOMETRY(GEOMETRY, 4326)');

  // Reset sequences to fix id constraint issues
  console.log('Resetting sequences...');
  await resetSequence('roadnetworks');
  await resetSequence('Ibaan_waterways');

  // Add missing columns to existing tables
  console.log('Adding missing columns...');
  await addColumnIfNotExists('roadnetworks', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');
  await addColumnIfNotExists('roadnetworks', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');
  
  await addColumnIfNotExists('Ibaan_waterways', 'properties', 'JSONB');
  await addColumnIfNotExists('Ibaan_waterways', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');
  await addColumnIfNotExists('Ibaan_waterways', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');

  // Create indexes
  console.log('Creating indexes...');
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_roads_geom ON roadnetworks USING GIST (geom)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_roads_props ON roadnetworks USING GIN (properties)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_water_geom ON "Ibaan_waterways" USING GIST (geom)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_water_props ON "Ibaan_waterways" USING GIN (properties)`);
}

async function uploadGeoJSON() {
  try {
    const client = await pool.connect();
    console.log('✓ Database connected successfully.');
    client.release();

    await createTables();

    for (const geojson of geojsonFiles) {
      const filePath = path.join(DATA_DIR, geojson.file);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${geojson.file}, skipping...`);
        continue;
      }

      console.log(`\nProcessing ${geojson.name}...`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const geojsonData = JSON.parse(fileContent);

      if (!geojsonData.features || geojsonData.features.length === 0) {
        console.log(`⚠️  No features found in ${geojson.file}, skipping...`);
        continue;
      }

      let count = 0;
      let updated = 0;

      for (const feature of geojsonData.features) {
        const props = feature.properties || {};
        const geom = JSON.stringify(feature.geometry);
        const propsJson = JSON.stringify(props);

        if (geojson.table === 'Ibaan_waterways') {
          let name = props.Name || props.name || props.waterway_name;
          // Generate fallback ID if name is null or empty
          if (!name || name === '' || name === null || name === undefined) {
            name = `waterway_${geojson.name}_${count}_${Date.now()}`;
          }
          await pool.query(
            `INSERT INTO "Ibaan_waterways" ("Name", "Type", geom, properties, updated_at) 
             VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326), $4, NOW()) 
             ON CONFLICT ("Name") DO UPDATE SET 
               "Type" = EXCLUDED."Type", 
               geom = EXCLUDED.geom, 
               properties = EXCLUDED.properties,
               updated_at = NOW()`,
            [name, props.Type || props.type || 'waterway', geom, propsJson]
          );
          updated++;
        } else if (geojson.table === 'roadnetworks') {
          const roadId = props.full_id || props.osm_id || props.id || `${props.name}_${count}`;
          await pool.query(
            `INSERT INTO roadnetworks (road_id, properties, geom, updated_at) 
             VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326), NOW()) 
             ON CONFLICT (road_id) DO UPDATE SET 
               properties = EXCLUDED.properties, 
               geom = EXCLUDED.geom,
               updated_at = NOW()`,
            [roadId, propsJson, geom]
          );
          updated++;
        }
        count++;
      }

      console.log(`✓ ${geojson.name}: Processed ${count} features, uploaded/updated ${updated} records.`);
    }

    console.log('\n--- Final Table Counts ---');
    for (const geojson of geojsonFiles) {
      try {
        const res = await pool.query(`SELECT COUNT(*) FROM "${geojson.table}"`);
        console.log(`${geojson.table}: ${res.rows[0].count} records`);
      } catch (err) {
        console.log(`${geojson.table}: Error counting records - ${err.message}`);
      }
    }

  } catch (err) {
    console.error('Database error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await pool.end();
    console.log('\n✅ Roadnetworks and Waterways upload/update complete.');
  }
}

uploadGeoJSON();
