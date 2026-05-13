import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Define the structure of a single row from the database
interface LocationRow {
  id: number | string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  location_type: string;
  category: string;
  description: string;
  created_at: string;
}

// Define the structure of the result object
interface QueryResult {
  rows: LocationRow[];
}

export async function GET() {
  try {
    // Cast the result to QueryResult to tell TypeScript what to expect
    const result = (await query(`
      SELECT id, name, address, latitude, longitude, location_type, category, description, created_at
      FROM boundary_locations 
      ORDER BY category, name
    `)) as QueryResult;

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No boundary locations found' },
        { status: 404 }
      );
    }

    // Group locations by category for better organization
    const groupedLocations = result.rows.reduce((acc: Record<string, any[]>, location) => {
      const category = location.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: location.id,
        name: location.name,
        address: location.address,
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        type: location.location_type,
        description: location.description,
        createdAt: location.created_at
      });
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: groupedLocations,
      total: result.rows.length,
      message: `Found ${result.rows.length} boundary locations`
    });

  } catch (error) {
    console.error('Error fetching boundary locations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch boundary locations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}