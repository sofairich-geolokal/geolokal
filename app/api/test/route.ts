import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Test endpoint called');
    const testData = [
      { 
        label: 'Open Street Map (OSM)', 
        value: 45, 
        percentage: 35,
        color: '#1a1a1a',
        status: 'Active',
        lastUpdated: new Date().toISOString(),
        source: 'GeoLokal Database',
        description: 'Open source mapping data',
        projectCount: 12,
        linkedProjects: true
      },
      { 
        label: 'Geo portal Gov-PH', 
        value: 38, 
        percentage: 30,
        color: '#f9a825',
        status: 'Active',
        lastUpdated: new Date().toISOString(),
        source: 'GeoLokal Database',
        description: 'Government geographic data',
        projectCount: 8,
        linkedProjects: true
      },
      { 
        label: 'Community Monitoring System', 
        value: 28, 
        percentage: 22,
        color: '#4caf50',
        status: 'Active',
        lastUpdated: new Date().toISOString(),
        source: 'GeoLokal Database',
        description: 'CBMS indicators data',
        projectCount: 6,
        linkedProjects: true
      },
      { 
        label: 'Tax Parcel Mapping', 
        value: 17, 
        percentage: 13,
        color: '#ef5350',
        status: 'Active',
        lastUpdated: new Date().toISOString(),
        source: 'GeoLokal Database',
        description: 'Tax parcel boundaries',
        projectCount: 4,
        linkedProjects: false
      }
    ];
    console.log('Returning test data:', JSON.stringify(testData));
    return NextResponse.json(testData);
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json([]);
  }
}
