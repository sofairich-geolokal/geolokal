/**
 * Auto-Loader Script for Shapefiles
 * 
 * This script automatically watches a folder for new shapefile uploads,
 * converts them to GeoJSON, saves to the data folder, creates dynamic tables,
 * and updates the database.
 * 
 * Usage:
 *   node scripts/auto-load-shapefiles.js
 * 
 * Configuration:
 *   - WATCH_FOLDER: Folder to watch for new shapefiles (default: ./uploads)
 *   - PROCESSED_FOLDER: Folder to move processed files (default: ./uploads/processed)
 *   - DEFAULT_COLOR: Default color for layers (default: #318855)
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const shp = require('shpjs');
const JSZip = require('jszip');
const { Pool } = require('pg');

// Configuration
const WATCH_FOLDER = path.join(__dirname, '..', 'uploads');
const PROCESSED_FOLDER = path.join(WATCH_FOLDER, 'processed');
const DATA_FOLDER = path.join(__dirname, '..', 'public', 'data');
const DEFAULT_COLOR = '#318855';
const CHECK_INTERVAL = 5000; // Check every 5 seconds

const prisma = new PrismaClient();

// PostgreSQL pool for dynamic table creation
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '16443'),
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false,
  } : false,
});

// Ensure folders exist
function ensureFolders() {
  [WATCH_FOLDER, PROCESSED_FOLDER, DATA_FOLDER].forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      console.log(`Created folder: ${folder}`);
    }
  });
}

// Create dynamic table for layer data
async function createDynamicTable(tableName, properties) {
  const client = await pool.connect();
  try {
    // Sanitize table name
    const sanitizedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    
    // Check if table already exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `;
    const tableExists = (await client.query(checkTableQuery, [sanitizedTableName])).rows[0].exists;
    
    if (tableExists) {
      console.log(`Table ${sanitizedTableName} already exists, skipping creation`);
      return sanitizedTableName;
    }
    
    // Build column definitions from GeoJSON properties
    const columnDefs = ['id SERIAL PRIMARY KEY', 'geom GEOMETRY(Geometry, 4326)', 'layer_id INTEGER'];
    
    for (const [key, value] of Object.entries(properties)) {
      const colName = key.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      let colType = 'TEXT';
      
      if (typeof value === 'number') {
        colType = Number.isInteger(value) ? 'INTEGER' : 'DECIMAL(20,6)';
      } else if (typeof value === 'boolean') {
        colType = 'BOOLEAN';
      }
      
      columnDefs.push(`${colName} ${colType}`);
    }
    
    // Create table
    const createTableQuery = `
      CREATE TABLE ${sanitizedTableName} (
        ${columnDefs.join(', ')}
      );
    `;
    
    await client.query(createTableQuery);
    console.log(`✅ Created table: ${sanitizedTableName}`);
    
    // Create spatial index
    await client.query(`CREATE INDEX idx_${sanitizedTableName}_geom ON ${sanitizedTableName} USING GIST (geom);`);
    console.log(`✅ Created spatial index on ${sanitizedTableName}`);
    
    return sanitizedTableName;
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Insert GeoJSON data into dynamic table
async function insertGeoJSONData(tableName, layerId, geojson) {
  const client = await pool.connect();
  try {
    const sanitizedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    
    if (!geojson.features || geojson.features.length === 0) {
      console.log('No features to insert');
      return;
    }
    
    // Get column names from first feature
    const firstFeature = geojson.features[0];
    const properties = firstFeature.properties || {};
    const columns = ['layer_id', 'geom'];
    const placeholders = ['$1', 'ST_SetSRID(ST_GeomFromGeoJSON($2), 4326)'];
    let paramIndex = 3;
    
    for (const key of Object.keys(properties)) {
      const colName = key.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      columns.push(colName);
      placeholders.push(`$${paramIndex}`);
      paramIndex++;
    }
    
    // Insert each feature
    for (const feature of geojson.features) {
      const values = [layerId, JSON.stringify(feature.geometry)];
      
      for (const key of Object.keys(properties)) {
        const colName = key.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        values.push(feature.properties?.[key] || null);
      }
      
      const insertQuery = `
        INSERT INTO ${sanitizedTableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
      `;
      
      await client.query(insertQuery, values);
    }
    
    console.log(`✅ Inserted ${geojson.features.length} features into ${sanitizedTableName}`);
  } catch (error) {
    console.error(`Error inserting data into ${tableName}:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Process a single shapefile (zip or individual files)
async function processShapefile(filePath) {
  try {
    console.log(`\nProcessing: ${filePath}`);
    
    let filesToProcess = [];
    const fileName = path.basename(filePath);
    
    // Check if it's a zip file
    if (fileName.toLowerCase().endsWith('.zip')) {
      const zip = new JSZip();
      const zipBuffer = fs.readFileSync(filePath);
      const loadedZip = await zip.loadAsync(zipBuffer);
      
      // Extract all files from zip
      for (const [filename, file] of Object.entries(loadedZip.files)) {
        if (!file.dir) {
          const buffer = await file.async('nodebuffer');
          const extractedPath = path.join(WATCH_FOLDER, filename);
          fs.writeFileSync(extractedPath, buffer);
          filesToProcess.push(extractedPath);
        }
      }
    } else {
      // Single file - find all related files
      const baseName = path.basename(filePath, path.extname(filePath));
      const folder = path.dirname(filePath);
      const extensions = ['.shp', '.shx', '.dbf', '.prj', '.cpg'];
      
      extensions.forEach(ext => {
        const relatedFile = path.join(folder, baseName + ext);
        if (fs.existsSync(relatedFile)) {
          filesToProcess.push(relatedFile);
        }
      });
    }
    
    // Check for required files
    const shpFile = filesToProcess.find(f => f.toLowerCase().endsWith('.shp'));
    const shxFile = filesToProcess.find(f => f.toLowerCase().endsWith('.shx'));
    const dbfFile = filesToProcess.find(f => f.toLowerCase().endsWith('.dbf'));
    
    if (!shpFile || !shxFile || !dbfFile) {
      console.error('Missing required shapefile components (.shp, .shx, .dbf)');
      return false;
    }
    
    // Zip files together for shpjs
    const zip = new JSZip();
    await Promise.all(filesToProcess.map(async (file) => {
      const buffer = fs.readFileSync(file);
      zip.file(path.basename(file), buffer);
    }));
    
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // Convert to GeoJSON
    console.log('Converting to GeoJSON...');
    const geojson = await shp(zipBuffer);
    
    // Generate layer name from filename
    const layerName = path.basename(shpFile, path.extname(shpFile))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_/g, ' ');
    
    // Save GeoJSON to data folder
    const sanitizedFileName = layerName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const geojsonFilePath = path.join(DATA_FOLDER, `${sanitizedFileName}.json`);
    fs.writeFileSync(geojsonFilePath, JSON.stringify(geojson, null, 2));
    console.log(`GeoJSON saved to: ${geojsonFilePath}`);
    
    // Create database record
    console.log('Creating database record...');
    const layer = await prisma.map_layers.create({
      data: {
        layer_name: layerName,
        layer_type: 'vector',
        metadata: {
          geojson_file: `${sanitizedFileName}.json`,
          description: `Auto-imported layer from ${fileName}`,
          source: 'auto-loader'
        },
        style_config: {
          color: DEFAULT_COLOR,
          fillColor: DEFAULT_COLOR,
          fillOpacity: 0.15,
          weight: 2,
          opacity: 1
        },
        projection: 'EPSG:4326',
        min_zoom: 0,
        max_zoom: 20,
        opacity: 1.0,
        z_index: 0,
        is_visible: true,
        is_downloadable: false,
        category_id: null,
        uploaded_by: null
      }
    });
    
    console.log(`✅ Layer created successfully with ID: ${layer.id}`);
    
    // Create dynamic table and insert data
    if (geojson.features && geojson.features.length > 0) {
      const firstFeature = geojson.features[0];
      const properties = firstFeature.properties || {};
      
      try {
        const tableName = await createDynamicTable(sanitizedFileName, properties);
        await insertGeoJSONData(tableName, layer.id, geojson);
        
        // Update metadata with table name
        await prisma.map_layers.update({
          where: { id: layer.id },
          data: {
            metadata: {
              geojson_file: `${sanitizedFileName}.json`,
              table_name: tableName,
              description: `Auto-imported layer from ${fileName}`,
              source: 'auto-loader'
            }
          }
        });
        
        console.log(`✅ Dynamic table ${tableName} created and populated`);
      } catch (tableError) {
        console.error(`Error creating dynamic table: ${tableError.message}`);
        // Continue without dynamic table - layer still works with GeoJSON file
      }
    }
    
    // Move processed files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const processedSubfolder = path.join(PROCESSED_FOLDER, `${sanitizedFileName}_${timestamp}`);
    fs.mkdirSync(processedSubfolder, { recursive: true });
    
    filesToProcess.forEach(file => {
      const dest = path.join(processedSubfolder, path.basename(file));
      fs.renameSync(file, dest);
    });
    
    // If original was a zip, move it too
    if (fileName.toLowerCase().endsWith('.zip')) {
      fs.renameSync(filePath, path.join(processedSubfolder, fileName));
    }
    
    console.log(`Files moved to: ${processedSubfolder}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Scan watch folder for new files
function scanFolder() {
  try {
    const files = fs.readdirSync(WATCH_FOLDER);
    const processableFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.zip', '.shp'].includes(ext);
    });
    
    if (processableFiles.length > 0) {
      console.log(`\nFound ${processableFiles.length} file(s) to process`);
      
      processableFiles.forEach(async (file) => {
        const filePath = path.join(WATCH_FOLDER, file);
        await processShapefile(filePath);
      });
    }
  } catch (error) {
    console.error('Error scanning folder:', error.message);
  }
}

// Main loop
function startWatcher() {
  console.log('=== Shapefile Auto-Loader Started ===');
  console.log(`Watching folder: ${WATCH_FOLDER}`);
  console.log(`Data folder: ${DATA_FOLDER}`);
  console.log(`Processed folder: ${PROCESSED_FOLDER}`);
  console.log(`Check interval: ${CHECK_INTERVAL}ms`);
  console.log('Press Ctrl+C to stop\n');
  
  ensureFolders();
  
  // Initial scan
  scanFolder();
  
  // Periodic scanning
  setInterval(scanFolder, CHECK_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down...');
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\nShutting down...');
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
});

// Start the watcher
startWatcher();
