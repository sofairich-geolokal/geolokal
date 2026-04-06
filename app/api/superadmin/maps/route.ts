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
    const categoryId = searchParams.get('categoryId');
    const projectId = searchParams.get('projectId');
    const lguId = searchParams.get('lguId');

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (categoryId) {
      whereClause += ` AND ml.category_id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (projectId) {
      whereClause += ` AND ml.project_id = $${paramIndex}`;
      params.push(projectId);
      paramIndex++;
    }

    if (lguId) {
      whereClause += ` AND ml.lgu_id = $${paramIndex}`;
      params.push(lguId);
      paramIndex++;
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM map_layers ml
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const totalCount = countResult.rows[0]?.total || 0;

    // Get maps with pagination and related data
    const mapsQuery = `
      SELECT 
        ml.id,
        ml.name,
        ml.category_id,
        ml.project_id,
        ml.lgu_id,
        ml.created_by,
        ml.created_at,
        ml.updated_at,
        to_char(ml.created_at, 'Mon DD, YYYY HH:MI AM') as formatted_created,
        to_char(ml.updated_at, 'Mon DD, YYYY HH:MI AM') as formatted_updated,
        CASE 
          WHEN ml.geom IS NOT NULL THEN ST_GeometryType(ml.geom)
          ELSE 'No Geometry'
        END as geometry_type,
        CASE 
          WHEN ml.geom IS NOT NULL THEN ST_Area(ml.geom::geography)
          ELSE 0
        END as area_sqm,
        c.name as category_name,
        p.name as project_name,
        cm.name as lgu_name,
        u.username as creator_name
      FROM map_layers ml
      LEFT JOIN categories c ON ml.category_id = c.id
      LEFT JOIN projects p ON ml.project_id = p.id
      LEFT JOIN city_muni_master cm ON ml.lgu_id = cm.id
      LEFT JOIN users u ON ml.created_by = u.username
      ${whereClause}
      ORDER BY ml.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const mapsResult = await query(mapsQuery, params);

    // Get map statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_maps,
        COUNT(CASE WHEN geom IS NOT NULL THEN 1 END) as maps_with_geometry,
        COUNT(DISTINCT category_id) as unique_categories,
        COUNT(DISTINCT project_id) as unique_projects,
        COUNT(DISTINCT lgu_id) as unique_lgus,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_maps_30_days,
        COALESCE(SUM(CASE WHEN geom IS NOT NULL THEN ST_Area(geom::geography) END), 0) as total_area_sqm
      FROM map_layers
    `;
    const statsResult = await query(statsQuery);

    // Get category statistics
    const categoryStatsQuery = `
      SELECT 
        ml.category_id,
        c.name as category_name,
        COUNT(*) as map_count,
        COUNT(CASE WHEN ml.geom IS NOT NULL THEN 1 END) as with_geometry_count,
        COALESCE(SUM(CASE WHEN ml.geom IS NOT NULL THEN ST_Area(ml.geom::geography) END), 0) as total_area_sqm
      FROM map_layers ml
      LEFT JOIN categories c ON ml.category_id = c.id
      GROUP BY ml.category_id, c.name
      ORDER BY map_count DESC
    `;
    const categoryStatsResult = await query(categoryStatsQuery);

    // Get LGU statistics for maps
    const lguStatsQuery = `
      SELECT 
        ml.lgu_id,
        cm.name as lgu_name,
        COUNT(*) as map_count,
        COUNT(DISTINCT ml.category_id) as unique_categories,
        COALESCE(SUM(CASE WHEN ml.geom IS NOT NULL THEN ST_Area(ml.geom::geography) END), 0) as total_area_sqm
      FROM map_layers ml
      LEFT JOIN city_muni_master cm ON ml.lgu_id = cm.id
      WHERE ml.lgu_id IS NOT NULL
      GROUP BY ml.lgu_id, cm.name
      ORDER BY map_count DESC
    `;
    const lguStatsResult = await query(lguStatsQuery);

    return NextResponse.json({
      maps: mapsResult.rows || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: statsResult.rows[0] || {},
      categoryStats: categoryStatsResult.rows || [],
      lguStats: lguStatsResult.rows || []
    });
  } catch (error: any) {
    console.error("Superadmin Maps Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to fetch maps' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { mapIds } = await request.json();
    
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

    if (!mapIds || !Array.isArray(mapIds)) {
      return NextResponse.json({ error: 'Invalid request. Map IDs array required.' }, { status: 400 });
    }

    // Get map details for audit log before deletion
    const mapDetailsQuery = `
      SELECT name, lgu_id 
      FROM map_layers 
      WHERE id = ANY($1)
    `;
    const mapDetailsResult = await query(mapDetailsQuery, [mapIds]);

    // Delete maps
    const placeholders = mapIds.map((_, index) => `$${index + 1}`).join(',');
    const deleteResult = await query(`
      DELETE FROM map_layers 
      WHERE id IN (${placeholders})
    `, mapIds);
    
    // Create Audit Log entries for each affected LGU
    const affectedLguIds = [...new Set(mapDetailsResult.rows.map(row => row.lgu_id).filter(id => id != null))];
    const mapNames = mapDetailsResult.rows.map(row => row.name).join(', ');
    
    for (const lguId of affectedLguIds) {
      await query(
        'INSERT INTO audit_logs (actor, action, details, lgu_id) VALUES ($1, $2, $3, $4)',
        [user.username, 'MAPS_DELETE', `Deleted maps: ${mapNames}`, lguId]
      );
    }
    
    return NextResponse.json({ 
      message: 'Maps deleted successfully',
      deletedCount: deleteResult.rowCount 
    });
  } catch (error: any) {
    console.error("Superadmin Maps Delete Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to delete maps' },
      { status: 500 }
    );
  }
}
