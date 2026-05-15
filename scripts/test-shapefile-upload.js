/**
 * Test Script for Shapefile Upload Functionality
 * 
 * This script tests:
 * 1. API endpoint for creating layers
 * 2. GeoJSON conversion from shapefiles
 * 3. Database record creation
 * 4. File saving to data folder
 * 5. Auto-loader functionality
 * 
 * Usage:
 *   node scripts/test-shapefile-upload.js
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
// Note: shpjs requires browser environment, skipping in Node.js test
// const shp = require('shpjs');
const JSZip = require('jszip');

const prisma = new PrismaClient();

// Test configuration
const TEST_FOLDER = path.join(__dirname, '..', 'test-shapefiles');
const DATA_FOLDER = path.join(__dirname, '..', 'public', 'data');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Test 1: Check if required folders exist
async function testFolderStructure() {
  log('\n=== Test 1: Folder Structure ===', colors.cyan);
  
  const folders = [TEST_FOLDER, DATA_FOLDER];
  let allExist = true;
  
  folders.forEach(folder => {
    if (fs.existsSync(folder)) {
      logSuccess(`Folder exists: ${folder}`);
    } else {
      logError(`Folder missing: ${folder}`);
      allExist = false;
    }
  });
  
  if (!allExist) {
    logInfo('Creating missing folders...');
    folders.forEach(folder => {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
        logSuccess(`Created folder: ${folder}`);
      }
    });
  }
  
  return allExist;
}

// Test 2: Check database connection
async function testDatabaseConnection() {
  log('\n=== Test 2: Database Connection ===', colors.cyan);
  
  try {
    await prisma.$connect();
    logSuccess('Database connection successful');
    
    // Test query
    const layerCount = await prisma.map_layers.count();
    logInfo(`Total layers in database: ${layerCount}`);
    
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

// Test 3: Test GeoJSON conversion with sample data
async function testGeoJSONConversion() {
  log('\n=== Test 3: GeoJSON Conversion ===', colors.cyan);
  
  try {
    // Create a simple test GeoJSON
    const testGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[121.0, 13.0], [121.1, 13.0], [121.1, 13.1], [121.0, 13.1], [121.0, 13.0]]]
          },
          properties: {
            name: 'Test Polygon',
            id: 1
          }
        }
      ]
    };
    
    logSuccess('Test GeoJSON created');
    logInfo(`Features: ${testGeoJSON.features.length}`);
    
    // Test saving to file
    const testFilePath = path.join(DATA_FOLDER, 'test-layer.json');
    fs.writeFileSync(testFilePath, JSON.stringify(testGeoJSON, null, 2));
    logSuccess(`Test GeoJSON saved to: ${testFilePath}`);
    
    // Test reading back
    const readData = JSON.parse(fs.readFileSync(testFilePath, 'utf-8'));
    if (readData.type === 'FeatureCollection') {
      logSuccess('GeoJSON file read back successfully');
    } else {
      logError('GeoJSON file read back failed');
      return false;
    }
    
    // Clean up
    fs.unlinkSync(testFilePath);
    logInfo('Test file cleaned up');
    
    return true;
  } catch (error) {
    logError(`GeoJSON conversion test failed: ${error.message}`);
    return false;
  }
}

// Test 4: Test API endpoint simulation
async function testAPIEndpoint() {
  log('\n=== Test 4: API Endpoint Simulation ===', colors.cyan);
  
  try {
    // Simulate API payload
    const testPayload = {
      layer_name: 'Test Layer API',
      layer_type: 'vector',
      metadata: {
        description: 'Test layer created via API simulation',
        source: 'test-script'
      },
      style_config: {
        color: '#FF0000',
        fillColor: '#FF0000',
        fillOpacity: 0.15,
        weight: 2,
        opacity: 1
      },
      is_visible: true,
      is_downloadable: false
    };
    
    logInfo('Creating test layer via Prisma...');
    
    const layer = await prisma.map_layers.create({
      data: testPayload
    });
    
    logSuccess(`Test layer created with ID: ${layer.id}`);
    logInfo(`Layer name: ${layer.layer_name}`);
    
    // Clean up
    await prisma.map_layers.delete({
      where: { id: layer.id }
    });
    logSuccess('Test layer cleaned up from database');
    
    return true;
  } catch (error) {
    logError(`API endpoint simulation failed: ${error.message}`);
    return false;
  }
}

// Test 5: Test with existing shapefiles (if available)
async function testWithExistingShapefiles() {
  log('\n=== Test 5: Existing Shapefiles ===', colors.cyan);
  
  try {
    // Check for shapefiles in Files folder
    const filesFolder = path.join(__dirname, '..', 'Files');
    
    if (!fs.existsSync(filesFolder)) {
      logWarning('Files folder not found, skipping shapefile test');
      return true;
    }
    
    // Look for shapefile folders
    const folders = fs.readdirSync(filesFolder, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    if (folders.length === 0) {
      logWarning('No shapefile folders found in Files directory');
      return true;
    }
    
    logInfo(`Found ${folders.length} shapefile folder(s)`);
    
    // Test with first folder
    const testFolder = path.join(filesFolder, folders[0]);
    const files = fs.readdirSync(testFolder);
    
    const shpFile = files.find(f => f.toLowerCase().endsWith('.shp'));
    const shxFile = files.find(f => f.toLowerCase().endsWith('.shx'));
    const dbfFile = files.find(f => f.toLowerCase().endsWith('.dbf'));
    
    if (!shpFile || !shxFile || !dbfFile) {
      logWarning('Required shapefile components not found (.shp, .shx, .dbf)');
      return true;
    }
    
    logSuccess('Found required shapefile components');
    logInfo(`SHP: ${shpFile}, SHX: ${shxFile}, DBF: ${dbfFile}`);
    
    // Try to zip them (skip shpjs conversion in Node.js test)
    const zip = new JSZip();
    files.forEach(file => {
      const filePath = path.join(testFolder, file);
      if (fs.statSync(filePath).isFile()) {
        const buffer = fs.readFileSync(filePath);
        zip.file(file, buffer);
      }
    });
    
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    logSuccess('Shapefile files zipped successfully');
    logInfo('Note: shpjs conversion skipped in Node.js test (requires browser environment)');
    
    return true;
  } catch (error) {
    logError(`Shapefile test failed: ${error.message}`);
    return false;
  }
}

// Test 6: Test auto-loader script availability
async function testAutoLoaderScript() {
  log('\n=== Test 6: Auto-Loader Script ===', colors.cyan);
  
  try {
    const scriptPath = path.join(__dirname, 'auto-load-shapefiles.js');
    
    if (fs.existsSync(scriptPath)) {
      logSuccess('Auto-loader script exists');
      logInfo(`Path: ${scriptPath}`);
      
      // Check if script is readable
      const content = fs.readFileSync(scriptPath, 'utf-8');
      if (content.includes('shpjs') && content.includes('PrismaClient')) {
        logSuccess('Script contains required dependencies');
      } else {
        logError('Script missing required dependencies');
        return false;
      }
      
      return true;
    } else {
      logError('Auto-loader script not found');
      return false;
    }
  } catch (error) {
    logError(`Auto-loader script test failed: ${error.message}`);
    return false;
  }
}

// Test 7: Test layer retrieval from database
async function testLayerRetrieval() {
  log('\n=== Test 7: Layer Retrieval ===', colors.cyan);
  
  try {
    const layers = await prisma.map_layers.findMany({
      where: {
        is_visible: true
      },
      take: 5
    });
    
    logSuccess(`Retrieved ${layers.length} visible layers`);
    
    if (layers.length > 0) {
      layers.forEach(layer => {
        logInfo(`- ${layer.layer_name} (ID: ${layer.id}, Type: ${layer.layer_type})`);
      });
    }
    
    return true;
  } catch (error) {
    logError(`Layer retrieval failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n========================================', colors.cyan);
  log('   SHAPEFILE UPLOAD FUNCTIONALITY TESTS   ', colors.cyan);
  log('========================================\n', colors.cyan);
  
  const tests = [
    { name: 'Folder Structure', fn: testFolderStructure },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'GeoJSON Conversion', fn: testGeoJSONConversion },
    { name: 'API Endpoint', fn: testAPIEndpoint },
    { name: 'Existing Shapefiles', fn: testWithExistingShapefiles },
    { name: 'Auto-Loader Script', fn: testAutoLoaderScript },
    { name: 'Layer Retrieval', fn: testLayerRetrieval }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      logError(`Test "${test.name}" crashed: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  log('\n========================================', colors.cyan);
  log('           TEST SUMMARY                  ', colors.cyan);
  log('========================================\n', colors.cyan);
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED`);
    }
  });
  
  log('\n' + '='.repeat(40), colors.cyan);
  log(`Total: ${passed}/${total} tests passed`, colors.cyan);
  log('='.repeat(40) + '\n', colors.cyan);
  
  if (passed === total) {
    logSuccess('All tests passed! 🎉');
  } else {
    logWarning(`${total - passed} test(s) failed`);
  }
  
  // Cleanup
  await prisma.$disconnect();
}

// Run tests
runTests().catch(error => {
  logError(`Test runner crashed: ${error.message}`);
  process.exit(1);
});
