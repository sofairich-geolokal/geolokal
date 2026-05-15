#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'Ibaan_roadnetworks.json');

console.log('Reading Ibaan_roadnetworks.json...');
const fileContent = fs.readFileSync(filePath, 'utf8');
const geojsonData = JSON.parse(fileContent);

console.log(`Total features before fix: ${geojsonData.features.length}`);

// Filter out features with null or invalid geometry
const validFeatures = geojsonData.features.filter((feature, index) => {
  const geom = feature.geometry;
  
  if (!geom || !geom.type || !geom.coordinates) {
    console.log(`Removing feature at index ${index} (null geometry)`);
    return false;
  }
  
  return true;
});

console.log(`Total features after fix: ${validFeatures.length}`);
console.log(`Removed ${geojsonData.features.length - validFeatures.length} features with null geometry`);

// Update the GeoJSON with valid features only
geojsonData.features = validFeatures;

// Write the fixed file
const outputPath = path.join(__dirname, 'data', 'Ibaan_roadnetworks.json');
fs.writeFileSync(outputPath, JSON.stringify(geojsonData, null, 2));
console.log(`\n✅ Fixed file written to: ${outputPath}`);
