import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface BoundaryLocation {
  id?: number;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  location_type?: string;
  boundary_type?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface BoundaryData {
  area: any;
  locations: BoundaryLocation[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaType = searchParams.get('areaType') || 'municipal';
    const includeLocations = searchParams.get('includeLocations') === 'true';

    // Fetch boundary area
    const areaQuery = `
      SELECT * FROM administrative_boundary_areas 
      WHERE is_active = true AND area_type = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const areaResult = await pool.query(areaQuery, [areaType]);
    
    let boundaryData: BoundaryData = {
      area: areaResult.rows[0] || null,
      locations: []
    };

    // Fetch locations if requested
    if (includeLocations && areaResult.rows[0]) {
      const locationsQuery = `
        SELECT * FROM administrative_boundary_locations 
        WHERE is_active = true AND boundary_type = $1
        ORDER BY name
      `;
      
      const locationsResult = await pool.query(locationsQuery, [areaType]);
      boundaryData.locations = locationsResult.rows as BoundaryLocation[];
    }

    return NextResponse.json(boundaryData);
  } catch (error) {
    console.error('Error fetching boundary data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boundary data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      latitude, 
      longitude, 
      location_type = 'boundary_point',
      boundary_type = 'municipal' 
    } = body;

    if (!name || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Name, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO administrative_boundary_locations 
      (name, description, latitude, longitude, location_type, boundary_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name, description, latitude, longitude, location_type, boundary_type
    ]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating boundary location:', error);
    return NextResponse.json(
      { error: 'Failed to create boundary location' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const query = `
      UPDATE administrative_boundary_locations 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id, ...values]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating boundary location:', error);
    return NextResponse.json(
      { error: 'Failed to update boundary location' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE administrative_boundary_locations 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting boundary location:', error);
    return NextResponse.json(
      { error: 'Failed to delete boundary location' },
      { status: 500 }
    );
  }
}
