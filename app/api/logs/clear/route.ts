import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function DELETE() {
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

    // Delete only records from the logged-in user's LGU
    const result = await query('DELETE FROM audit_logs WHERE lgu_id = $1', [loggedInUser.lgu_id]);
    
    console.log(`Deleted ${result.rowCount} audit log records from LGU ${loggedInUser.lgu_id}`);
    
    return NextResponse.json({ 
      message: 'Audit logs cleared successfully for your LGU',
      deletedCount: result.rowCount,
      lguId: loggedInUser.lgu_id
    });
  } catch (error: any) {
    console.error("Clear Logs Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to clear logs' }, 
      { status: 500 }
    );
  }
}
