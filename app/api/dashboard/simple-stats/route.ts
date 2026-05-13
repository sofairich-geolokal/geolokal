import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Define the shape of a count query result
interface CountRow {
  count: string | number;
}

interface QueryResult {
  rows: CountRow[];
}

export async function GET() {
  try {
    console.log(' Simple Dashboard API: Fetching basic stats...');
    
    // Get basic user count with type assertion
    const userCountResult = (await query('SELECT COUNT(*) as count FROM users')) as QueryResult;
    const userCount = userCountResult.rows[0]?.count || 0;
    
    // Get basic city/municipality count with type assertion
    const cityCountResult = (await query('SELECT COUNT(*) as count FROM city_muni_master')) as QueryResult;
    const cityCount = cityCountResult.rows[0]?.count || 0;
    
    return NextResponse.json({
      success: true,
      message: 'Simple dashboard stats (working)',
      data: {
        userCount: userCount,
        cityCount: cityCount,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('Simple dashboard error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}