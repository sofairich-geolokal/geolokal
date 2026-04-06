import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(`SELECT properties, geometry FROM waterways`);
    
    // Reconstruct the data back into standard GeoJSON format for Leaflet
    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row, index) => ({
        type: "Feature",
        id: index,
        // Force parse just in case the database driver returned a string
        properties: typeof row.properties === 'string' ? JSON.parse(row.properties) : row.properties,
        geometry: typeof row.geometry === 'string' ? JSON.parse(row.geometry) : row.geometry
      }))
    };
    
    return NextResponse.json({ success: true, data: geojson });
  } catch (error: any) {
    console.error("Fetch Waterways Error:", error.message);
    return NextResponse.json({ success: false, error: 'Failed to fetch waterways' }, { status: 500 });
  }
}