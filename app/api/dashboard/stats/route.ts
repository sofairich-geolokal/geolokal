import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Dashboard API: Fetching stats...');
    
    // Get population, households, land area data
    const populationData = await query(`
      SELECT 
        COUNT(*) as total_population,
        COUNT(DISTINCT household_id) as total_households
      FROM population_data
    `);
    
    console.log('📊 Dashboard API: Population data:', populationData);

    // Get land area data (from map layers with area info)
    const landAreaData = await query(`
      SELECT 
        SUM(ST_Area(geom::geography)) as total_area_sqm
      FROM map_layers 
      WHERE geom IS NOT NULL
    `);

    // Get building distribution data
    const buildingData = await query(`
      SELECT 
        category_id,
        COUNT(*) as count
      FROM map_layers 
      WHERE category_id IS NOT NULL
      GROUP BY category_id
    `);

    // Get CBMS indicators
    const cbmsData = await query(`
      SELECT 
        indicator_code,
        AVG(indicator_value::numeric) as average_value
      FROM cbms_indicators 
      WHERE indicator_value IS NOT NULL
      GROUP BY indicator_code
      ORDER BY indicator_code
    `);

    // Get road network data
    const roadData = await query(`
      SELECT 
        COUNT(*) as total_roads,
        SUM(ST_Length(geom::geography)) as total_length_km
      FROM map_layers 
      WHERE category_id = 1
    `);

    const populationResult = populationData.rows || [];
    const landAreaResult = landAreaData.rows || [];
    const roadResult = roadData.rows || [];
    
    return NextResponse.json({
      population: populationResult[0] || { total_population: 0, total_households: 0 },
      landArea: landAreaResult[0] || { total_area_sqm: 0 },
      buildingDistribution: buildingData,
      cbmsIndicators: cbmsData,
      roadNetworks: roadResult[0] || { total_roads: 0, total_length_km: 0 }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
