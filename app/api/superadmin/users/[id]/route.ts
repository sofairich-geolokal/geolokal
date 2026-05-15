import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Force dynamic behavior to prevent build-time static generation errors
export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { username, email, password, role, location } = await request.json();
    const { id: userId } = await params;
    
    console.log('User update request:', { userId, username, email, role, location });
    
    // Get current user data to validate against - Added 'as any'
    const currentUserResult = await query('SELECT username, email, role FROM users WHERE id = $1', [userId]) as any;
    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const currentUser = currentUserResult.rows[0];
    
    // Prevent superadmin from updating LGU admin or admin records
    if (currentUser.role.toLowerCase() === 'lgu' || currentUser.role.toLowerCase() === 'admin') {
      return NextResponse.json({ error: 'Access denied. Cannot update LGU admin or admin records.' }, { status: 403 });
    }
    
    // Use provided values or fall back to current values
    const updateUsername = username || currentUser.username;
    const updateEmail = email || currentUser.email;
    const updateRole = role || currentUser.role;
    
    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
    }
    
    // Validate role if provided
    if (role) {
      const validRoles = ['superadmin', 'admin', 'lgu', 'viewer'];
      if (!validRoles.includes(role.toLowerCase())) {
        return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
      }
    }
    
    // Get logged-in user ID and info
    const loggedInUserId = await getAuthUser();
    if (!loggedInUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is superadmin - Added 'as any'
    const userResult = await query('SELECT role, username FROM users WHERE id = $1', [loggedInUserId]) as any;
    const user = userResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Superadmin role required.' }, { status: 403 });
    }

    // Check if username is already taken by another user - Added 'as any'
    if (username && username !== currentUser.username) {
      const usernameCheck = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]) as any;
      if (usernameCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
      }
    }
    
    // Check if email is already taken by another user - Added 'as any'
    if (email && email !== currentUser.email) {
      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]) as any;
      if (emailCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
    }

    // Build dynamic update query based on provided fields
    const updateFields = [];
    const updateParams = [];
    let paramIndex = 1;

    if (username) {
      updateFields.push(`username = $${paramIndex++}`);
      updateParams.push(username);
    }
    if (email) {
      updateFields.push(`email = $${paramIndex++}`);
      updateParams.push(email);
    }
    if (password && password.trim() !== '') {
      updateFields.push(`password_hash = $${paramIndex++}`);
      updateParams.push(password);
    }
    if (role) {
      updateFields.push(`role = $${paramIndex++}`);
      updateParams.push(role);
    }
    if (location !== undefined) {
      updateFields.push(`location = $${paramIndex++}`);
      updateParams.push(location);
    }

    // Add user ID as last parameter
    updateParams.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, role, location, 
                to_char(created_at, 'Mon DD, YYYY HH:MI AM') as created`;
    
    // Added 'as any' to resolve the 'unknown' result type
    const updatedUserResult = await query(updateQuery, updateParams) as any;
    
    // Create Audit Log entry
    await query(
      'INSERT INTO audit_logs (actor, action, details, lgu_id) VALUES ($1, $2, $3, $4)',
      [user.username, 'USER_UPDATE', `Updated user: ${updateUsername} (${updateRole})`, null]
    );

    return NextResponse.json(updatedUserResult.rows[0]);
  } catch (error: any) {
    console.error("Superadmin User Update Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}