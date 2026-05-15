/**
 * Auto-Loader Script for Shapefiles
 * 
 * This script automatically watches a folder for new shapefile uploads,
 * converts them to GeoJSON, saves to the data folder, and updates the database.
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

// Configuration
const WATCH_FOLDER = path.join(__dirname, '..', 'uploads');
const PROCESSED_FOLDER = path.join(WATCH_FOLDER, 'processed');
const DATA_FOLDER = path.join(__dirname, '..', 'public', 'data');
const DEFAULT_COLOR = '#318855';
const CHECK_INTERVAL = 5000; // Check every 5 seconds

const prisma = new PrismaClient();

// Ensure folders exist
function ensureFolders() {
  [WATCH_FOLDER, PROCESSED_FOLDER, DATA_FOLDER].forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      console.log(`Created folder: ${folder}`);
    }
  });
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
      }
    });
    
    console.log(`✅ Layer created successfully with ID: ${layer.id}`);
    
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
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\nShutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the watcher
startWatcher();
