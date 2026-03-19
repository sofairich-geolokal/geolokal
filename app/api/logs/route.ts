import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
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

    // Fetch logs for the logged-in user's LGU and all users from that LGU
    const sql = `
      SELECT 
        to_char(timestamp, 'Mon DD, YYYY HH:MI AM') as timestamp,
        actor, 
        action, 
        created_by,
        details,
        id
      FROM audit_logs 
      WHERE lgu_id = $1
      ORDER BY timestamp DESC`;
      
    const result = await query(sql, [loggedInUser.lgu_id]);
    console.log("Database query result:", result.rows);
    return NextResponse.json(result.rows || []);
  } catch (error: any) {
    console.error("Audit Fetch Error:", error.message);
    return NextResponse.json([], { status: 500 });
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
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No valid IDs provided' }, { status: 400 });
    }

    // Create placeholders for IN clause and add LGU filter
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    
    const result = await query(
      `DELETE FROM audit_logs WHERE id IN (${placeholders}) AND lgu_id = $${ids.length + 1}`,
      [...ids, loggedInUser.lgu_id]
    );
    
    console.log(`Deleted ${result.rowCount} audit log records with IDs: ${ids.join(', ')} from LGU ${loggedInUser.lgu_id}`);
    
    return NextResponse.json({ 
      message: 'Selected audit logs deleted successfully',
      deletedCount: result.rowCount,
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