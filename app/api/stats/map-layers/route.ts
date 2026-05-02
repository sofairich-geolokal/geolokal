import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const sql = `
    SELECT 
        ml.layer_name AS "layer_name",
        COALESCE(pc.name, 'Uncategorized') AS "category",
        COALESCE(m.name, 'Unknown') AS "lgu_name",
        COALESCE(ml.layer_type, 'Unknown') AS "layer_type",
        ml.created_at AS "created_at"
    FROM map_layers ml
    LEFT JOIN project_categories pc ON ml.category_id = pc.id
    LEFT JOIN city_muni_master m ON ml.lgu_id = m.id
    WHERE ml.is_active = true
    ORDER BY ml.created_at DESC;
    `;
    
    const result = await query(sql);
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Fetch Map Layers Stats Error:", error.message);
    return NextResponse.json([], { status: 500 }); 
  }
}
