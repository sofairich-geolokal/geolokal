import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Force dynamic to prevent build-time static generation errors
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get logged-in user ID from auth token
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is superadmin
    const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]) as any;
    const user = userResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Superadmin role required.' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const action = searchParams.get('action');
    const actor = searchParams.get('actor');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (action) {
      whereClause += ` AND action ILIKE $${paramIndex}`;
      params.push(`%${action}%`);
      paramIndex++;
    }

    if (actor) {
      whereClause += ` AND actor ILIKE $${paramIndex}`;
      params.push(`%${actor}%`);
      paramIndex++;
    }

    if (dateFrom) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs 
      ${whereClause}
    `;
    const countResult = await query(countQuery, params) as any;
    const totalCount = countResult.rows[0]?.total || 0;

    // Get audit logs with pagination
    const logsQuery = `
      SELECT 
        id,
        actor,
        action,
        details,
        lgu_id,
        to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        to_char(created_at, 'Mon DD, YYYY HH:MI AM') as formatted_date
      FROM audit_logs 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const logsParams = [...params, limit, offset];
    const logsResult = await query(logsQuery, logsParams) as any;

    // Get unique actions for filter dropdown
    const actionsQuery = `
      SELECT DISTINCT action, COUNT(*) as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
    `;
    const actionsResult = await query(actionsQuery) as any;

    // Get unique actors for filter dropdown
    const actorsQuery = `
      SELECT DISTINCT actor, COUNT(*) as count
      FROM audit_logs
      GROUP BY actor
      ORDER BY count DESC
      LIMIT 50
    `;
    const actorsResult = await query(actorsQuery) as any;

    return NextResponse.json({
      logs: logsResult.rows || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      filters: {
        actions: actionsResult.rows || [],
        actors: actorsResult.rows || []
      }
    });
  } catch (error: any) {
    console.error("Superadmin Audit Logs Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get logged-in user ID from auth token
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is superadmin
    const userResult = await query('SELECT role, username FROM users WHERE id = $1', [userId]) as any;
    const user = userResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Superadmin role required.' }, { status: 403 });
    }

    const { dateFrom, dateTo, action, actor } = await request.json();

    // Build WHERE clause for deletion
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (dateFrom) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    if (action) {
      whereClause += ` AND action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (actor) {
      whereClause += ` AND actor = $${paramIndex}`;
      params.push(actor);
      paramIndex++;
    }

    // Delete audit logs
    const deleteQuery = `
      DELETE FROM audit_logs 
      ${whereClause}
    `;
    const deleteResult = await query(deleteQuery, params) as any;

    // Create audit log entry for this deletion
    await query(
      'INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)',
      [user.username, 'AUDIT_CLEANUP', `Cleared audit logs: ${deleteResult.rowCount} entries`]
    );

    return NextResponse.json({ 
      message: 'Audit logs cleared successfully',
      deletedCount: deleteResult.rowCount 
    });
  } catch (error: any) {
    console.error("Superadmin Audit Logs Delete Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to clear audit logs' },
      { status: 500 }
    );
  }
}