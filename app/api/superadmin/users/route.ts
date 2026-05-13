import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

// This is CRITICAL for npm run build. 
// It prevents Next.js from trying to pre-render this route as static.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get logged-in user ID from auth token
    let userId;
    try {
      userId = await getAuthUser();
    } catch (authError: any) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - No valid session' }, { status: 401 });
    }

    // Verify user is superadmin - Assert as 'any' to resolve TS18046
    let userResult: any;
    try {
      userResult = await query('SELECT role FROM users WHERE id = $1', [userId]) as any;
    } catch (dbError: any) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    const user = userResult.rows[0];
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!user.role || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Get all users - Assert as 'any'
    let users: any;
    try {
      users = await query(`
        SELECT u.id, u.username, u.email, u.password_hash, u.role, u.lgu_id, u.location, 
               to_char(u.created_at, 'Mon DD, YYYY HH:MI AM') as created,
               u.created_by, c.name as lgu_name
        FROM users u
        LEFT JOIN city_muni_master c ON u.lgu_id::text = c.id::text
        WHERE u.id != $1
        AND u.role != 'viewer'
        ORDER BY u.created_at DESC
      `, [userId]) as any;
    } catch (queryError: any) {
      return NextResponse.json({ error: `Failed to fetch users: ${queryError.message}` }, { status: 500 });
    }

    // Format the response
    const formattedUsers = users.rows.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
      lgu_id: user.lgu_id,
      location: user.location || null,
      created: user.created,
      created_by: user.created_by,
      lgu_name: user.lgu_name || null
    }));

    return NextResponse.json(formattedUsers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userResult = await query('SELECT role, username FROM users WHERE id = $1', [userId]) as any;
    const user = userResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const { userIds } = await request.json();
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    // Get lgu_ids for audit logs
    const placeholders = userIds.map((_, index) => `$${index + 1}`).join(',');
    const userLguQuery = await query(
      `SELECT DISTINCT lgu_id FROM users WHERE id IN (${placeholders})`,
      userIds
    ) as any;
    const userLguIds = userLguQuery.rows.map((row: any) => row.lgu_id).filter((id: any) => id != null);

    const result = await query(`
      DELETE FROM users 
      WHERE id IN (${placeholders}) 
      AND id != $${userIds.length + 1} 
      AND role != 'superadmin'
    `, [...userIds, userId]) as any;
    
    for (const lguId of userLguIds) {
      await query(
        'INSERT INTO audit_logs (actor, action, details, lgu_id, table_name) VALUES ($1, $2, $3, $4, $5)',
        [user.username, 'USERS_DELETE', `Deleted users: ${userIds.join(', ')}`, lguId, 'users']
      );
    }
    
    return NextResponse.json({ 
      message: 'Users deleted successfully',
      deletedCount: result.rowCount 
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { username, email, password, role, location, lgu_id } = await request.json();
    
    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const userId = await getAuthUser();
    const userResult = await query('SELECT role, username FROM users WHERE id = $1', [userId]) as any;
    const user = userResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const existingUser = await query('SELECT id FROM users WHERE username = $1', [username]) as any;
    if (existingUser.rows.length > 0) return NextResponse.json({ error: 'Username exists' }, { status: 409 });
    
    const newUserResult = await query(`
      INSERT INTO users (username, email, password_hash, role, location, lgu_id, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id, username, email, role, location, lgu_id,
                to_char(created_at, 'Mon DD, YYYY HH:MI AM') as created
    `, [username, email, password, role, location || null, lgu_id || null, user.username]) as any;
    
    await query(
      'INSERT INTO audit_logs (actor, action, details, lgu_id, table_name) VALUES ($1, $2, $3, $4, $5)',
      [user.username, 'USER_CREATE', `Created LGU admin: ${username}`, lgu_id || null, 'users']
    );

    return NextResponse.json(newUserResult.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}