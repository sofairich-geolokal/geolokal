import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('Starting API call to /api/stats/sources');
    
    // Query to get source types with their actual data counts
    const sourceQuery = `
      SELECT 
        st.id,
        st.name,
        st.description,
        st.color,
        st.is_active,
        COALESCE(data_counts.record_count, 0) as record_count
      FROM source_types st
      LEFT JOIN (
        SELECT 
          source_type_id,
          SUM(record_count) as record_count
        FROM (
          -- Map layers data
          SELECT 
            CASE 
              WHEN source = 'OSM' THEN 1
              WHEN source = 'Gov-PH' THEN 2
            END as source_type_id,
            COUNT(*) as record_count
          FROM map_layers 
          WHERE source IN ('OSM', 'Gov-PH')
          GROUP BY source_type_id
          
          UNION ALL
          
          -- CBMS indicators data
          SELECT 
            3 as source_type_id,
            COUNT(*) as record_count
          FROM cbms_indicators
          
          UNION ALL
          
          -- Tax parcels data
          SELECT 
            4 as source_type_id,
            COUNT(*) as record_count
          FROM tax_parcels
        ) all_data
        GROUP BY source_type_id
      ) data_counts ON st.id = data_counts.source_type_id
      WHERE st.is_active = true
      ORDER BY st.name;
    `;
    
    const result = await query(sourceQuery);
    console.log('Source types query completed successfully');

    if (!result.rows || result.rows.length === 0) {
      console.warn("No source types found, returning fallback data");
      return NextResponse.json([]);
    }

    // Calculate total for percentage logic
    const totalRecordCount = result.rows.reduce((sum, row) => sum + parseInt(row.record_count || '0'), 0);

    // Helper to calculate percentage
    const calculatePct = (count: number) => {
      if (totalRecordCount === 0) return 0;
      return parseFloat(((count / totalRecordCount) * 100).toFixed(1));
    };

    // Transform data for the chart
    const sourceData = result.rows.map((row) => ({
      label: row.name,
      percentage: calculatePct(parseInt(row.record_count || '0')),
      value: parseInt(row.record_count || '0'),
      color: row.color || '#3b82f6',
      status: parseInt(row.record_count || '0') > 0 ? 'Active' : 'Inactive',
      lastUpdated: new Date().toISOString(),
      source: 'GeoLokal Database',
      description: row.description || 'Data source',
      projectCount: 0, // No project linking yet
      linkedProjects: false
    }));

    // Add debug logging
    console.log('API Response:', JSON.stringify(sourceData, null, 2));

    return NextResponse.json(sourceData);
  } 
  catch (error: any) {
    console.error("API Error in stats/sources:", error);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    
    // Return empty array so the frontend doesn't crash
    return NextResponse.json([]);
  }
}