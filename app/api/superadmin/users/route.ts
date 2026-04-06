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

    // Verify user is superadmin
    const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Superadmin role required.' }, { status: 403 });
    }

    // Fetch ALL users in the system (superadmin can see everyone)
    const result = await query(`
      SELECT u.id, u.username, u.email, u.role, u.lgu_id, u.location,
             to_char(u.created_at, 'Mon DD, YYYY HH:MI AM') as created,
             u.created_by, c.name as lgu_name
      FROM users u
      LEFT JOIN city_muni_master c ON u.lgu_id = c.id
      ORDER BY u.created_at DESC
    `);
    
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Superadmin Users Fetch Error:", error.message);
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

    // Verify user is superadmin
    const userResult = await query('SELECT role, username FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Superadmin role required.' }, { status: 403 });
    }

    const { userIds } = await request.json();
    
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Invalid request. User IDs array required.' }, { status: 400 });
    }

    // Get lgu_ids of deleted users for audit logs
    const placeholders = userIds.map((_, index) => `$${index + 2}`).join(',');
    const userLguQuery = await query(
      `SELECT DISTINCT lgu_id FROM users WHERE id IN (${placeholders})`,
      userIds
    );
    const userLguIds = userLguQuery.rows.map((row: any) => row.lgu_id).filter((id: any) => id != null);

    // Delete specified users (except self and other superadmins)
    const result = await query(`
      DELETE FROM users 
      WHERE id IN (${placeholders}) 
      AND id != $1 
      AND role != 'superadmin'
    `, [userId, ...userIds]);
    
    // Create audit log for each affected LGU
    for (const lguId of userLguIds) {
      await query(
        'INSERT INTO audit_logs (actor, action, details, lgu_id) VALUES ($1, $2, $3, $4)',
        [user.username, 'USERS_DELETE', `Deleted users: ${userIds.join(', ')}`, lguId]
      );
    }
    
    return NextResponse.json({ 
      message: 'Users deleted successfully',
      deletedCount: result.rowCount 
    });
  } catch (error: any) {
    console.error("Superadmin Users Delete Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to delete users' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { username, email, password, role, lgu_id } = await request.json();
    
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

    // Insert new user
    const userSql = `
      INSERT INTO users (username, email, password_hash, role, lgu_id, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, username, email, role, lgu_id, 
                to_char(created_at, 'Mon DD, YYYY HH:MI AM') as created`;
    
    const newUserResult = await query(userSql, [username, email, password, role, lgu_id, user.username]);
    
    // Create Audit Log entry
    await query(
      'INSERT INTO audit_logs (actor, action, details, lgu_id) VALUES ($1, $2, $3, $4)',
      [user.username, 'USER_CREATE', `Created user: ${username} (${role})`, lgu_id]
    );

    return NextResponse.json(newUserResult.rows[0]);
  } catch (error: any) {
    console.error("Superadmin User Create Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
