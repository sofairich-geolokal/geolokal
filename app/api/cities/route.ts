import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Define the interface for a city row
interface CityRow {
  id: number | string;
  name: string;
  province: string;
}

// Define the interface for the query result
interface QueryResult {
  rows: CityRow[];
}

export async function GET() {
  try {
    // Cast the result to QueryResult to resolve the 'unknown' type error
    const result = (await query(
      'SELECT id, name, province FROM city_muni_master ORDER BY name ASC'
    )) as QueryResult;
    
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