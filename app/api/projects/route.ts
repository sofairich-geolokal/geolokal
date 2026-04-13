import { query } from '@/lib/db';
import { NextResponse, NextRequest } from 'next/server';

export async function GET() {
  try {
    const sql = `
SELECT 
    p.id AS "Project ID",
    p.project_name AS "Project Title", 
    c.name AS "Category", 
    m.name AS "LGU Location",
    COALESCE(p.description, 'No description provided') AS "Details",
    p.data_types AS "Data Format",
    p.latitude AS "Lat",
    p.longitude AS "Long",
    p.status AS "Current Status",
    p.access_level AS "Security Level",
    p.created_at AS "Date Created"
FROM projects p
JOIN project_categories c ON p.category_id = c.id
JOIN city_muni_master m ON p.lgu_id = m.id
ORDER BY c.name, p.project_name;
    `;
    
    const result = await query(sql);
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Fetch Projects Error:", error.message);
    return NextResponse.json([], { status: 500 }); 
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'Project title is required' },
        { status: 400 }
      );
    }

    // Production Database Insert logic following GeoLokal architecture
    const insertSql = `
      INSERT INTO projects (
        project_name, category_id, description, data_types, 
        lgu_id, access_level, team, status, latitude, longitude
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    const values = [
      body.title,
      body.categoryId || 1, // References project_categories [cite: 112]
      body.description || '',
      body.dataTypes || 'Vector (SHP)',
      body.lguId || 1,      // References city_muni_master 
      body.accessLevel || 'Public',
      body.team || 'Design team',
      body.status || 'Draft',
      body.latitude || 0,
      body.longitude || 0
    ];

    const result = await query(insertSql, values);
    const newProject = result.rows[0];

    return NextResponse.json({
      success: true,
      project: newProject,
      message: 'Project created successfully'
    });

  } catch (error: any) {
    console.error('Create Project Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to create project', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const updateSql = `
      UPDATE projects 
      SET 
        project_name = $1, 
        category_id = $2, 
        description = $3, 
        data_types = $4, 
        lgu_id = $5, 
        access_level = $6, 
        status = $7,
        latitude = $8,
        longitude = $9
      WHERE id = $10
      RETURNING *;
    `;

    const values = [
      body.title,
      body.categoryId,
      body.description,
      body.dataTypes,
      body.lguId,
      body.accessLevel,
      body.status,
      body.latitude,
      body.longitude,
      id
    ];

    const result = await query(updateSql, values);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project: result.rows[0],
      message: 'Project updated successfully'
    });

  } catch (error: any) {
    console.error('Update Project Error:', error.message);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const deleteSql = `DELETE FROM projects WHERE id = $1;`;
    await query(deleteSql, [id]);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete Project Error:', error.message);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}