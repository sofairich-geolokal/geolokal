import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // 1. Read your GeoJSON file (Place it in /public/data/Ibaan_boundary.json)
    const filePath = path.join(process.cwd(), 'public', 'data', 'Ibaan_boundary.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const geojson = JSON.parse(fileData);

    // 2. Loop through features and insert
    for (const feature of geojson.features) {
      await query(
        `INSERT INTO admin_boundaries (properties, geometry) VALUES ($1, $2)`,
        [JSON.stringify(feature.properties), JSON.stringify(feature.geometry)]
      );
    }

    return NextResponse.json({ success: true, message: "Boundaries seeded successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}