import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Fetch source links for a specific project
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const result = await query(`
      SELECT 
        st.id,
        st.name,
        st.description,
        st.color,
        psl.created_at as linked_at
      FROM project_source_links psl
      JOIN source_types st ON psl.source_type_id = st.id
      WHERE psl.project_id = $1 AND st.is_active = true
      ORDER BY st.name
    `, [projectId]);

    return NextResponse.json(result.rows || []);
  } catch (error: any) {
    console.error("Error fetching project source links:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST - Link a source type to a project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, sourceTypeId } = body;

    if (!projectId || !sourceTypeId) {
      return NextResponse.json({ error: "Project ID and Source Type ID are required" }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO project_source_links (project_id, source_type_id)
      VALUES ($1, $2)
      ON CONFLICT (project_id, source_type_id) DO NOTHING
      RETURNING *
    `, [projectId, sourceTypeId]);

    return NextResponse.json(result.rows[0] || { message: "Link already exists" }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project source link:", error);
    return NextResponse.json({ error: "Failed to link source type to project" }, { status: 500 });
  }
}

// DELETE - Remove a source type link from a project
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const sourceTypeId = searchParams.get('sourceTypeId');

    if (!projectId || !sourceTypeId) {
      return NextResponse.json({ error: "Project ID and Source Type ID are required" }, { status: 400 });
    }

    await query(`
      DELETE FROM project_source_links 
      WHERE project_id = $1 AND source_type_id = $2
    `, [projectId, sourceTypeId]);

    return NextResponse.json({ message: "Link removed successfully" });
  } catch (error: any) {
    console.error("Error removing project source link:", error);
    return NextResponse.json({ error: "Failed to remove link" }, { status: 500 });
  }
}
