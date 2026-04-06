import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    console.log("Logs API: Starting GET request");
    
    // Get logged-in user ID from auth token
    const userId = await getAuthUser();
    console.log("Logs API: User ID from auth:", userId);
    
    if (!userId) {
      console.log("Logs API: No user ID found, returning 401");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the logged-in user's LGU ID
    const userResult = await query('SELECT lgu_id, username FROM users WHERE id = $1', [userId]);
    console.log("Logs API: User query result:", userResult.rows);
    
    const loggedInUser = userResult.rows[0];

    if (!loggedInUser) {
      console.log("Logs API: User not found in database");
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log("Logs API: Found user:", loggedInUser.username, "LGU ID:", loggedInUser.lgu_id);

    // Check if audit_logs table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log("Logs API: audit_logs table does not exist");
      return NextResponse.json({ error: 'audit_logs table does not exist' }, { status: 500 });
    }

    // Fetch ALL audit logs (show all actions to LGU users)
    const auditSql = `
      SELECT 
        to_char(created_at, 'Mon DD, YYYY HH:MI AM') as timestamp,
        actor, 
        action, 
        created_by,
        details,
        id,
        'audit' as log_type
      FROM audit_logs 
      ORDER BY created_at DESC`;
      
    const auditResult = await query(auditSql);
    console.log("Logs API: Found audit logs:", auditResult.rows.length);

    // Check if viewer_activity table exists
    const viewerTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'viewer_activity'
      );
    `);

    let viewerResult: any = { rows: [] };
    if (viewerTableCheck.rows[0].exists) {
      // Fetch viewer activities for users from the same LGU
      const viewerSql = `
        SELECT 
          to_char(va.timestamp, 'Mon DD, YYYY HH:MI AM') as timestamp,
          COALESCE(u.username, 'Anonymous') as actor,
          va.activity_type as action,
          COALESCE(u.username, 'Anonymous') as created_by,
          va.activity_data::text as details,
          va.id,
          'viewer' as log_type
        FROM viewer_activity va
        LEFT JOIN users u ON va.user_id = u.id
        WHERE u.lgu_id = $1 OR va.session_id IS NOT NULL`;
        
      viewerResult = await query(viewerSql, [loggedInUser.lgu_id]);
      console.log("Logs API: Found viewer logs:", viewerResult.rows.length);
    }

    // Combine both results
    const allLogs = [
      ...auditResult.rows,
      ...viewerResult.rows
    ].sort((a, b) => {
      // Sort by timestamp (most recent first)
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });

    console.log("Logs API: Combined logs result:", allLogs.length, "entries");
    return NextResponse.json(allLogs || []);
  } catch (error: any) {
    console.error("Logs API: Fetch Error:", error.message);
    console.error("Logs API: Full error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Get logged-in user ID from auth token
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the logged-in user's LGU ID
    const userResult = await query('SELECT lgu_id FROM users WHERE id = $1', [userId]);
    const loggedInUser = userResult.rows[0];

    if (!loggedInUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { ids, log_types } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No valid IDs provided' }, { status: 400 });
    }

    let deletedCount = 0;
    let deletedAuditLogs = 0;
    let deletedViewerLogs = 0;

    // Delete audit logs if any
    const auditIds = ids.filter((id, index) => !log_types || log_types[index] === 'audit');
    if (auditIds.length > 0) {
      const placeholders = auditIds.map((_, index) => `$${index + 1}`).join(',');
      const auditResult = await query(
        `DELETE FROM audit_logs WHERE id IN (${placeholders}) AND lgu_id = $${auditIds.length + 1}`,
        [...auditIds, loggedInUser.lgu_id]
      );
      deletedAuditLogs = auditResult.rowCount || 0;
    }

    // Delete viewer activities if any
    const viewerIds = ids.filter((id, index) => !log_types || log_types[index] === 'viewer');
    if (viewerIds.length > 0) {
      const placeholders = viewerIds.map((_, index) => `$${index + 1}`).join(',');
      const viewerResult = await query(
        `DELETE FROM viewer_activity WHERE id IN (${placeholders})`,
        viewerIds
      );
      deletedViewerLogs = viewerResult.rowCount || 0;
    }

    deletedCount = deletedAuditLogs + deletedViewerLogs;
    
    console.log(`Deleted ${deletedAuditLogs} audit logs and ${deletedViewerLogs} viewer activities from LGU ${loggedInUser.lgu_id}`);
    
    return NextResponse.json({ 
      message: 'Logs deleted successfully',
      deletedCount: deletedCount,
      deletedAuditLogs: deletedAuditLogs,
      deletedViewerLogs: deletedViewerLogs,
      deletedIds: ids
    });
  } catch (error: any) {
    console.error("Delete Logs Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to delete selected logs' }, 
      { status: 500 }
    );
  }
}