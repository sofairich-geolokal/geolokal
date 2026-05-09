import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // First get the total count for percentage calculation
    const countSql = `
      SELECT COUNT(*) as total
      FROM map_layers ml
      WHERE ml.is_active = true
    `;
    
    const countResult = await query(countSql);
    const total = countResult.rows[0]?.total || 0;
    
    if (total === 0) {
      return NextResponse.json([]);
    }

    // Get data grouped by layer types for the pie chart (since category_id doesn't exist)
    const sql = `
      SELECT 
        COALESCE(ml.layer_type, 'Unknown') AS label,
        COUNT(*) AS value,
        COALESCE(ml.style_config->>'color', '#3b82f6') AS color,
        ROUND((COUNT(*) * 100.0 / $1), 2) AS percentage,
        'Active' AS status,
        CURRENT_TIMESTAMP AS last_updated,
        'map_layers' AS source,
        'Data layers by type' AS description
      FROM map_layers ml
      WHERE ml.is_active = true
      GROUP BY ml.layer_type, ml.style_config->>'color'
      ORDER BY value DESC;
    `;

    const result = await query(sql, [total]);
    
    // Format the data to match the expected interface
    const formattedData = result.rows.map(row => ({
      label: row.label,
      value: parseInt(row.value),
      percentage: parseFloat(row.percentage),
      color: row.color,
      status: row.status,
      lastUpdated: row.last_updated,
      source: row.source,
      description: row.description
    }));

    return NextResponse.json(formattedData);
  }
  catch (error: any) {
    console.error("API Error in stats/sources:", error);
    return NextResponse.json([]);
  }
}