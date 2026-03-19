import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      'SELECT id, name, province FROM city_muni_master ORDER BY name ASC'
    );
    
    return NextResponse.json({ 
      success: true, 
      cities: result.rows 
    });
  } catch (error: any) {
    console.error('Error fetching cities:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}
