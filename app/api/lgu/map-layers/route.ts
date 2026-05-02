import { NextResponse } from 'next/server';
import { query } from '@/lib/db-direct';

export async function GET() {
  try {
    console.log('Fetching LGU map layers data...');
    
    // Same query as viewer demographics
    const queryText = `
      SELECT 
        ml.layer_name as "area",
        ml.layer_type as "layerType",
        ml.population,
        ml.households,
        ml.poverty_rate as "povertyRate",
        ml.employment_rate as "employmentRate",
        ml.demographic_status as "status",
        cmm.name as "location",
        'NAMRIA' as "agency",
        'DRRM' as "category"
      FROM map_layers ml
      LEFT JOIN city_muni_master cmm ON ml.lgu_id = cmm.id
      WHERE ml.layer_type IN ('boundary', 'road', 'waterway')
        AND ml.population IS NOT NULL
      ORDER BY ml.population DESC
    `;
    
    const result = await query(queryText);
    console.log(`Found ${result.rows.length} map layers`);
    
    return NextResponse.json(result.rows || []);
  } catch (error: any) {
    console.error("Fetch LGU Map Layers Error:", error.message);
    return NextResponse.json([], { status: 500 });
  }
}
