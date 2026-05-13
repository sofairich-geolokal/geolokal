import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Cast the result to 'any' to resolve the 'unknown' type error
    const result = (await query(`SELECT properties, geometry FROM roadnetworks`)) as any;
    
    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row: any, index: number) => {
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