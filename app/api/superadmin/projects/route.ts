import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get logged-in user ID from auth token
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is superadmin
    const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Superadmin role required.' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const status = searchParams.get('status');
    const lguId = searchParams.get('lguId');

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (lguId) {
      whereClause += ` AND p.lgu_id = $${paramIndex}`;
      params.push(lguId);
      paramIndex++;
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM projects p
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const totalCount = countResult.rows[0]?.total || 0;

    // Get projects with pagination and related data
    const projectsQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.lgu_id,
        p.created_by,
        p.created_at,
        p.updated_at,
        to_char(p.created_at, 'Mon DD, YYYY HH:MI AM') as formatted_created,
        to_char(p.updated_at, 'Mon DD, YYYY HH:MI AM') as formatted_updated,
        c.name as lgu_name,
        u.username as creator_name,
        COUNT(DISTINCT ml.id) as map_count,
        COUNT(DISTINCT al.id) as activity_count
      FROM projects p
      LEFT JOIN city_muni_master c ON p.lgu_id = c.id
      LEFT JOIN users u ON p.created_by = u.username
      LEFT JOIN map_layers ml ON p.id = ml.project_id
      LEFT JOIN audit_logs al ON p.id::text = al.details AND al.action = 'PROJECT_CREATE'
      ${whereClause}
      GROUP BY p.id, c.name, u.username
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const projectsResult = await query(projectsQuery, params);

    // Get project statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_projects,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_projects_30_days
      FROM projects
    `;
    const statsResult = await query(statsQuery);

    // Get LGU statistics for projects
    const lguStatsQuery = `
      SELECT 
        p.lgu_id,
        c.name as lgu_name,
        COUNT(*) as project_count,
        COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_count
      FROM projects p
      LEFT JOIN city_muni_master c ON p.lgu_id = c.id
      GROUP BY p.lgu_id, c.name
      ORDER BY project_count DESC
    `;
    const lguStatsResult = await query(lguStatsQuery);

    return NextResponse.json({
      projects: projectsResult.rows || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: statsResult.rows[0] || {},
      lguStats: lguStatsResult.rows || []
    });
  } catch (error: any) {
    console.error("Superadmin Projects Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, lgu_id, status } = await request.json();
    
    // Get logged-in user ID and info
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is superadmin
    const userResult = await query('SELECT role, username FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Superadmin role required.' }, { status: 403 });
    }

    // Insert new project
    const projectQuery = `
      INSERT INTO projects (name, description, lgu_id, status, created_by) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, name, description, lgu_id, status, created_by, 
                to_char(created_at, 'Mon DD, YYYY HH:MI AM') as created,
                to_char(updated_at, 'Mon DD, YYYY HH:MI AM') as updated
    `;
    
    const projectResult = await query(projectQuery, [name, description, lgu_id, status || 'active', user.username]);
    
    // Create Audit Log entry
    await query(
      'INSERT INTO audit_logs (actor, action, details, lgu_id) VALUES ($1, $2, $3, $4)',
      [user.username, 'PROJECT_CREATE', `Created project: ${name}`, lgu_id]
    );

    return NextResponse.json(projectResult.rows[0]);
  } catch (error: any) {
    console.error("Superadmin Project Create Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, description, lgu_id, status } = await request.json();
    
    // Get logged-in user ID and info
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is superadmin
    const userResult = await query('SELECT role, username FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Superadmin role required.' }, { status: 403 });
    }

    // Update project
    const updateQuery = `
      UPDATE projects 
      SET name = $1, description = $2, lgu_id = $3, status = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, description, lgu_id, status, created_by,
                to_char(created_at, 'Mon DD, YYYY HH:MI AM') as created,
                to_char(updated_at, 'Mon DD, YYYY HH:MI AM') as updated
    `;
    
    const updateResult = await query(updateQuery, [name, description, lgu_id, status, id]);
    
    if (updateResult.rowCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create Audit Log entry
    await query(
      'INSERT INTO audit_logs (actor, action, details, lgu_id) VALUES ($1, $2, $3, $4)',
      [user.username, 'PROJECT_UPDATE', `Updated project: ${name}`, lgu_id]
    );

    return NextResponse.json(updateResult.rows[0]);
  } catch (error: any) {
    console.error("Superadmin Project Update Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { projectIds } = await request.json();
    
    // Get logged-in user ID and info
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is superadmin
    const userResult = await query('SELECT role, username FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Superadmin role required.' }, { status: 403 });
    }

    if (!projectIds || !Array.isArray(projectIds)) {
      return NextResponse.json({ error: 'Invalid request. Project IDs array required.' }, { status: 400 });
    }

    // Get lgu_ids of deleted projects for audit logs
    const placeholders = projectIds.map((_, index) => `$${index + 1}`).join(',');
    const projectLguQuery = await query(
      `SELECT DISTINCT lgu_id FROM projects WHERE id IN (${placeholders})`,
      projectIds
    );
    const projectLguIds = projectLguQuery.rows.map((row: any) => row.lgu_id).filter((id: any) => id != null);

    // Delete projects
    const deleteResult = await query(`
      DELETE FROM projects 
      WHERE id IN (${placeholders})
    `, projectIds);
    
    // Create Audit Log entry for each affected LGU
    for (const lguId of projectLguIds) {
      await query(
        'INSERT INTO audit_logs (actor, action, details, lgu_id) VALUES ($1, $2, $3, $4)',
        [user.username, 'PROJECTS_DELETE', `Deleted projects: ${projectIds.join(', ')}`, lguId]
      );
    }
    
    return NextResponse.json({ 
      message: 'Projects deleted successfully',
      deletedCount: deleteResult.rowCount 
    });
  } catch (error: any) {
    console.error("Superadmin Projects Delete Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to delete projects' },
      { status: 500 }
    );
  }
}
