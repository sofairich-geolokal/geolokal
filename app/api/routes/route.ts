import { NextRequest, NextResponse } from 'next/server';
import { getMapLayers } from '@/lib/db-direct';

export async function GET(request: NextRequest) {
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not configured');
      return NextResponse.json({
        success: false,
        error: 'Database connection not configured. Please set DATABASE_URL environment variable.',
        data: [],
        statistics: {
          totalPopulation: 0,
          totalHouseholds: 0,
          avgPovertyRate: '0%',
          avgEmploymentRate: '0%',
          totalRoutes: 0,
        },
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const bounds = searchParams.get('bounds');
    let category: string | null | undefined = searchParams.get('category');

    // Note: bbox filtering disabled due to JSON filtering complexity
    // Can be re-enabled with proper PostgreSQL JSON operator implementation

    const result = await getMapLayers(bounds || undefined, category || undefined);
    const routeData = result.rows.map((row: any) => {
      // Parse numeric fields properly
      const population = row.population ? parseInt(row.population) : null;
      const households = row.households ? parseInt(row.households) : null;
      const latitude = row.latitude ? parseFloat(row.latitude) : 13.86;
      const longitude = row.longitude ? parseFloat(row.longitude) : 121.15;

      return {
        id: row.id,
        location: row.location,
        population,
        households,
        povertyRate: row.poverty_rate,
        employmentRate: row.employment_rate,
        status: row.status,
        agency: row.agency,
        category: row.category,
        layerType: row.layerType,
        opacity: row.opacity,
        downloadable: row.downloadable,
        latitude,
        longitude,
        bbox: row.bbox,
        metadata: row.metadata,
        lastUpdated: row.lastUpdated,
      };
    });

    const totalPopulation = routeData.reduce((sum, r) => sum + (r.population || 0), 0);
    const totalHouseholds = routeData.reduce((sum, r) => sum + (r.households || 0), 0);
    const validPovertyRates = routeData.filter(r => r.povertyRate !== null);
    const avgPovertyRate = validPovertyRates.length > 0 
      ? (validPovertyRates.reduce((sum, r) => sum + parseFloat(r.povertyRate), 0) / validPovertyRates.length).toFixed(1) + '%'
      : '0%';
    const validEmploymentRates = routeData.filter(r => r.employmentRate !== null);
    const avgEmploymentRate = validEmploymentRates.length > 0
      ? (validEmploymentRates.reduce((sum, r) => sum + parseFloat(r.employmentRate), 0) / validEmploymentRates.length).toFixed(1) + '%'
      : '0%';

    return NextResponse.json({
      success: true,
      data: routeData,
      statistics: {
        totalPopulation,
        totalHouseholds,
        avgPovertyRate,
        avgEmploymentRate,
        totalRoutes: routeData.length,
      },
      count: routeData.length,
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}