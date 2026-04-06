import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(`SELECT id, properties, geometry FROM admin_boundaries`);
    
    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row) => ({
        type: "Feature",
        id: row.id,
        properties: typeof row.properties === 'string' ? JSON.parse(row.properties) : row.properties,
        geometry: typeof row.geometry === 'string' ? JSON.parse(row.geometry) : row.geometry
      }))
    };
    
    return NextResponse.json({ success: true, data: geojson });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch boundaries' }, { status: 500 });
  }
}