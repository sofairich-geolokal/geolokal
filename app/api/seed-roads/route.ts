import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Read the local road networks JSON file
    const filePath = path.join(process.cwd(), 'data', 'Ibaan_roadnetworks.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const roadData = JSON.parse(fileContent);

    // Clear existing road data
    await query('DELETE FROM roadnetworks');

    // Insert each road feature into the database
    for (const feature of roadData.features) {
      const properties = JSON.stringify(feature.properties || {});
      const geometry = JSON.stringify(feature.geometry || {});
      
      await query(
        'INSERT INTO roadnetworks (properties, geometry) VALUES ($1, $2)',
        [properties, geometry]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${roadData.features.length} road features` 
    });
  } catch (error: any) {
    console.error("Seed Roads Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to seed roads data' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to seed road networks data from local JSON file to database' 
  });
}
