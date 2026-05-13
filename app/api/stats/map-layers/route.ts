import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get total count of distinct layer types
    const countSql = `
      SELECT COUNT(DISTINCT COALESCE(ml.layer_type, 'Unknown')) as total_types
      FROM map_layers ml
      WHERE ml.is_active = true
    `;
    
    // Cast to any to resolve the 'unknown' type error
    const countResult = (await query(countSql)) as any;
    const totalTypes = countResult.rows[0]?.total_types || 0;
    
    // Get detailed breakdown of layer types
    const detailSql = `
      SELECT 
        COALESCE(ml.layer_type, 'Unknown') AS layer_type,
        COUNT(*) AS count,
        MIN(ml.created_at) AS first_created,
        MAX(ml.created_at) AS last_created,
        array_agg(DISTINCT ml.layer_name) AS sample_layers
      FROM map_layers ml
      WHERE ml.is_active = true
      GROUP BY COALESCE(ml.layer_type, 'Unknown')
      ORDER BY count DESC, layer_type ASC
    `;
    
    // Cast to any to resolve the 'unknown' type error
    const detailResult = (await query(detailSql)) as any;
    
    return NextResponse.json({
      total_types: totalTypes,
      layer_types: detailResult.rows || []
    }); 
  } catch (error: any) {
    console.error("Fetch Map Layers Stats Error:", error.message);
    return NextResponse.json({ 
      total_types: 0, 
      layer_types: [] 
    }, { status: 500 }); 
  }
}