import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // Allow GET request to trigger seeding (useful for browser testing)
  return POST();
}

export async function POST() {
  try {
    // 1. Read your uploaded JSON file from the local filesystem
    // Adjust the path if you placed the file in a different folder
    const filePath = path.join(process.cwd(), 'data', 'Ibaan_waterways.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const geojsonData = JSON.parse(fileContents);

    let insertedCount = 0;

    // 2. Loop through every feature in your GeoJSON and save it to the DB
    for (const feature of geojsonData.features) {
      await query(
        `INSERT INTO waterways (properties, geometry) VALUES ($1, $2)`,
        [feature.properties, feature.geometry]
      );
      insertedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully saved ${insertedCount} waterways to the database!` 
    });
  } catch (error: any) {
    console.error("Seeding Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}