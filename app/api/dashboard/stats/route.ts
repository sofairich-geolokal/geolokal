import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get population, households, land area data
    const populationData = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total_population,
        COUNT(DISTINCT household_id) as total_households
      FROM population_data
    `;

    // Get land area data (from map layers with area info)
    const landAreaData = await prisma.$queryRaw<any[]>`
      SELECT 
        SUM(ST_Area(geom::geography)) as total_area_sqm
      FROM map_layers 
      WHERE geom IS NOT NULL
    `;

    // Get building distribution data
    const buildingData = await prisma.$queryRaw<any[]>`
      SELECT 
        category_id,
        COUNT(*) as count
      FROM map_layers 
      WHERE category_id IS NOT NULL
      GROUP BY category_id
    `;

    // Get CBMS indicators
    const cbmsData = await prisma.$queryRaw<any[]>`
      SELECT 
        indicator_code,
        AVG(indicator_value::numeric) as average_value
      FROM cbms_indicators 
      WHERE indicator_value IS NOT NULL
      GROUP BY indicator_code
      ORDER BY indicator_code
    `;

    // Get road network data
    const roadData = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total_roads,
        SUM(ST_Length(geom::geography)) as total_length_km
      FROM map_layers 
      WHERE category_id = 1
    `;

    return NextResponse.json({
      population: (populationData as any[])[0] || { total_population: 0, total_households: 0 },
      landArea: (landAreaData as any[])[0] || { total_area_sqm: 0 },
      buildingDistribution: buildingData,
      cbmsIndicators: cbmsData,
      roadNetworks: (roadData as any[])[0] || { total_roads: 0, total_length_km: 0 }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
