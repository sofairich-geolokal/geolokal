import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Fetch all source types
export async function GET() {
  try {
    const result = await query(`
      SELECT id, name, description, color, is_active, created_at
      FROM source_types 
      WHERE is_active = true
      ORDER BY name
    `);
    
    return NextResponse.json(result.rows || []);
  } catch (error: any) {
    console.error("Error fetching source types:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST - Create a new source type
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO source_types (name, description, color)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, description || null, color || '#3b82f6']);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error("Error creating source type:", error);
    return NextResponse.json({ error: "Failed to create source type" }, { status: 500 });
  }
}
