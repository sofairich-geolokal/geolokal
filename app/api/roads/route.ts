import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Since columns are already JSONB, we select them directly.
    const result = await query(`SELECT properties, geometry FROM roadnetworks`);
    
    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row, index) => {
        // Safety check: parse if they come back as strings, otherwise use as objects
        const geometry = typeof row.geometry === 'string' 
          ? JSON.parse(row.geometry) 
          : row.geometry;

        const properties = typeof row.properties === 'string' 
          ? JSON.parse(row.properties) 
          : row.properties;

        return {
          type: "Feature",
          id: index,
          properties: properties,
          geometry: geometry
        };
      })
    };
    
    return NextResponse.json({ success: true, data: geojson });
  } catch (error: any) {
    console.error("Fetch Roads Error:", error.message);
    return NextResponse.json({ success: false, error: 'Failed to fetch roads' }, { status: 500 });
  }
}