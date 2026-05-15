import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// Define the shape of your database row
interface LotRow {
  id: string | number;
  properties: any;
  geometry: any;
}

// Define the shape of the query result
interface QueryResult {
  rows: LotRow[];
}

export async function GET() {
  try {
    // Cast the result to the QueryResult type
    const result = await query(`SELECT id, properties, geom as geometry FROM ibaan_lots`) as QueryResult;
    
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
    console.error("Fetch Lots Error:", error.message);
    return NextResponse.json({ success: false, error: 'Failed to fetch lots' }, { status: 500 });
  }
}
