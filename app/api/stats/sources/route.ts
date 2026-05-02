import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const sql = `
      SELECT 
        ml.layer_name AS "Layer",
        COALESCE(m.name, 'Unknown') AS "Location",
        COALESCE(ml.style_config->>'color', '#3b82f6') AS "Color",
        COALESCE(pc.name, 'Uncategorized') AS "Category",
        COALESCE(u.username, 'System') AS "Agency"
      FROM map_layers ml
      LEFT JOIN city_muni_master m ON ml.lgu_id = m.id
      LEFT JOIN project_categories pc ON ml.category_id = pc.id
      LEFT JOIN users u ON ml.uploaded_by = u.id
      WHERE ml.is_active = true
      ORDER BY ml.created_at DESC;
    `;

    const result = await query(sql);
    return NextResponse.json(result.rows || []);
  }
  catch (error: any) {
    console.error("API Error in stats/sources:", error);
    return NextResponse.json([]);
  }
}