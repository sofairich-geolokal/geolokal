import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// 1. Define the shape of your database row
interface WaterwayRow {
  properties: any; // or a more specific interface if you know your JSON structure
  geometry: any;
}

// 2. Define the expected return type of your query helper
interface QueryResult<T> {
  rows: T[];
}

export async function GET() {
  try {
    // 3. Cast the result so TypeScript knows 'rows' exists
    const result = (await query(
      `SELECT properties, geometry FROM waterways`
    )) as QueryResult<WaterwayRow>;

    // 4. Ensure result and rows exist before mapping
    if (!result || !result.rows) {
      return NextResponse.json({ success: true, data: { type: "FeatureCollection", features: [] } });
    }

    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row, index) => ({
        type: "Feature",
        id: index,
        properties: typeof row.properties === 'string' ? JSON.parse(row.properties) : row.properties,
        geometry: typeof row.geometry === 'string' ? JSON.parse(row.geometry) : row.geometry
      }))
    };

    return NextResponse.json({ success: true, data: geojson });
  } catch (error: any) {
    console.error("Fetch Waterways Error:", error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waterways', details: error.message },
      { status: 500 }
    );
  }
}