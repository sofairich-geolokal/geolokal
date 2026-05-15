#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'Ibaan_roadnetworks.json');

console.log('Reading Ibaan_roadnetworks.json...');
const fileContent = fs.readFileSync(filePath, 'utf8');
const geojsonData = JSON.parse(fileContent);

console.log(`Total features: ${geojsonData.features.length}`);

let invalidCount = 0;
let validCount = 0;

for (let i = 0; i < geojsonData.features.length; i++) {
  const feature = geojsonData.features[i];
  const geom = feature.geometry;
  
  if (!geom || !geom.type || !geom.coordinates) {
    console.log(`\n❌ Invalid geometry at index ${i}: Missing type or coordinates`);
    console.log(JSON.stringify(feature, null, 2));
    invalidCount++;
    continue;
  }
  
  // Check if coordinates are valid
  const coords = geom.coordinates;
  let isValid = true;
  
  try {
    if (geom.type === 'Point') {
      if (!Array.isArray(coords) || coords.length < 2) isValid = false;
    } else if (geom.type === 'LineString') {
      if (!Array.isArray(coords) || coords.length < 2) isValid = false;
      for (const coord of coords) {
        if (!Array.isArray(coord) || coord.length < 2) isValid = false;
      }
    } else if (geom.type === 'Polygon') {
      if (!Array.isArray(coords) || coords.length < 1) isValid = false;
      for (const ring of coords) {
        if (!Array.isArray(ring) || ring.length < 4) isValid = false;
        for (const coord of ring) {
          if (!Array.isArray(coord) || coord.length < 2) isValid = false;
        }
      }
    } else if (geom.type === 'MultiLineString') {
      if (!Array.isArray(coords) || coords.length < 1) isValid = false;
      for (const line of coords) {
        if (!Array.isArray(line) || line.length < 2) isValid = false;
        for (const coord of line) {
          if (!Array.isArray(coord) || coord.length < 2) isValid = false;
        }
      }
    } else if (geom.type === 'MultiPolygon') {
      if (!Array.isArray(coords) || coords.length < 1) isValid = false;
      for (const poly of coords) {
        if (!Array.isArray(poly) || poly.length < 1) isValid = false;
        for (const ring of poly) {
          if (!Array.isArray(ring) || ring.length < 4) isValid = false;
          for (const coord of ring) {
            if (!Array.isArray(coord) || coord.length < 2) isValid = false;
          }
        }
      }
    }
  } catch (err) {
    isValid = false;
  }
  
  if (!isValid) {
    console.log(`\n❌ Invalid geometry at index ${i}: type=${geom.type}`);
    console.log(JSON.stringify(geom, null, 2));
    invalidCount++;
  } else {
    validCount++;
  }
}

console.log(`\n=== Summary ===`);
console.log(`Valid geometries: ${validCount}`);
console.log(`Invalid geometries: ${invalidCount}`);

if (invalidCount > 0) {
  console.log('\n⚠️  Found invalid GeoJSON geometries that need to be fixed');
} else {
  console.log('\n✅ All geometries are valid');
}
