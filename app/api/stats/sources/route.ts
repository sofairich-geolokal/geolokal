import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('Starting API call to /api/stats/sources');
    
    // 1. Fetch all counts in parallel
    const [osmRes, geoRes, cbmsRes, taxRes] = await Promise.all([
      query("SELECT COUNT(*)::int as count FROM map_layers WHERE source = 'OSM'"),
      query("SELECT COUNT(*)::int as count FROM map_layers WHERE source = 'Gov-PH'"),
      query("SELECT COUNT(*)::int as count FROM cbms_indicators"),
      query("SELECT COUNT(*)::int as count FROM tax_parcels")
    ]);
    
    console.log('Database queries completed successfully');

    // 2. Parse results safely (handling potential nulls/undefined)
    const osmCount = parseInt(osmRes.rows[0]?.count || '0');
    const geoCount = parseInt(geoRes.rows[0]?.count || '0');
    const cbmsCount = parseInt(cbmsRes.rows[0]?.count || '0');
    const taxCount = parseInt(taxRes.rows[0]?.count || '0');

    // 3. Calculate total for percentage logic
    const total = osmCount + geoCount + cbmsCount + taxCount;

    // 4. Helper to calculate percentage (Returns 0 if total is 0)
    const calculatePct = (count: number) => {
      if (total === 0) return 0;
      return parseFloat(((count / total) * 100).toFixed(1));
    };

    // 5. Final Data structure for the Chart
    const dynamicSourceData = [
      { 
        label: 'Open Street Map (OSM)', 
        percentage: calculatePct(osmCount), 
        value: osmCount, 
        color: '#1a1a1a',
        status: osmCount > 0 ? 'Active' : 'Inactive',
        lastUpdated: new Date().toISOString(),
        source: 'GeoLokal Database',
        description: 'Open source mapping data'
      },
      { 
        label: 'Geo portal Gov-PH', 
        percentage: calculatePct(geoCount), 
        value: geoCount, 
        color: '#f9a825',
        status: geoCount > 0 ? 'Active' : 'Inactive',
        lastUpdated: new Date().toISOString(),
        source: 'GeoLokal Database',
        description: 'Government geographic data'
      },
      { 
        label: 'Community Monitoring System', 
        percentage: calculatePct(cbmsCount), 
        value: cbmsCount, 
        color: '#4caf50',
        status: cbmsCount > 0 ? 'Active' : 'Inactive',
        lastUpdated: new Date().toISOString(),
        source: 'GeoLokal Database',
        description: 'CBMS indicators data'
      },
      { 
        label: 'Tax Parcel Mapping', 
        percentage: calculatePct(taxCount), 
        value: taxCount, 
        color: '#ef5350',
        status: taxCount > 0 ? 'Active' : 'Inactive',
        lastUpdated: new Date().toISOString(),
        source: 'GeoLokal Database',
        description: 'Tax parcel boundaries'
      },
    ];

    // Add debug logging
    console.log('API Response:', JSON.stringify(dynamicSourceData, null, 2));

    return NextResponse.json(dynamicSourceData);
  } 
  catch (error: any) {
   console.error("API Error in stats/sources:", error);
   console.error("Error message:", error?.message);
   console.error("Error stack:", error?.stack);
    
    // CRITICAL: Return an empty array [] instead of an object {}
    // This allows your frontend .map() or Array.isArray() checks to pass.
    return NextResponse.json([]);
   }
}