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

    // Get all users except the logged-in superadmin
    const users = await query(`
      SELECT u.id, u.username, u.email, u.password_hash, u.role, u.lgu_id, u.location, 
             to_char(u.created_at, 'Mon DD, YYYY HH:MI AM') as created,
             u.created_by, c.name as lgu_name
      FROM users u
      LEFT JOIN city_muni_master c ON u.lgu_id::text = c.id::text
      WHERE u.id != $1
      ORDER BY u.created_at DESC
    `, [userId]);

    return NextResponse.json(users.rows || []);
  } catch (error: any) {
    console.error('Superadmin Users Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch users' }, 
      { status: 500 }
    );
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
    const placeholders = userIds.map((_, index) => `$${index + 1}`).join(',');
    const userLguQuery = await query(
      `SELECT DISTINCT lgu_id FROM users WHERE id IN (${placeholders})`,
      userIds
    );
    const userLguIds = userLguQuery.rows.map((row: any) => row.lgu_id).filter((id: any) => id != null);

    // Delete specified users (except self and other superadmins)
    const result = await query(`
      DELETE FROM users 
      WHERE id IN (${placeholders}) 
      AND id != $${userIds.length + 1} 
      AND role != 'superadmin'
    `, [...userIds, userId]);
    
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
    const { username, email, password, role, location } = await request.json();
    
    console.log('User creation request:', { username, email, role, location });
    
    // Validate required fields
    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields: username, email, password, role' }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Validate role
    const validRoles = ['superadmin', 'admin', 'lgu', 'viewer'];
    if (!validRoles.includes(role.toLowerCase())) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }
    
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

    // Check if username already exists
    const existingUser = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    
    // Check if email already exists
    const existingEmail = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    // Insert new user with location
    const userSql = `
      INSERT INTO users (username, email, password_hash, role, location, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, username, email, role, location, 
                to_char(created_at, 'Mon DD, YYYY HH:MI AM') as created`;
    
    console.log('Executing user creation with params:', [username, email, '***', role, location, user.username]);
    const newUserResult = await query(userSql, [username, email, password, role, location, user.username]);
    
    // Create Audit Log entry
    await query(
      'INSERT INTO audit_logs (actor, action, details, lgu_id) VALUES ($1, $2, $3, $4)',
      [user.username, 'USER_CREATE', `Created user: ${username} (${role})`, null]
    );

    return NextResponse.json(newUserResult.rows[0]);
  } catch (error: any) {
    console.error("Superadmin User Create Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
