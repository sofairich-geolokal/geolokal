import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log(' Simple Dashboard API: Fetching basic stats...');
    
    // Get basic user count instead of missing tables
    const userCountResult = await query('SELECT COUNT(*) as count FROM users');
    const userCount = userCountResult.rows[0]?.count || 0;
    
    // Get basic city/municipality count
    const cityCountResult = await query('SELECT COUNT(*) as count FROM city_muni_master');
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
