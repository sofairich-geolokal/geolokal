import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { username, email, password, role, location } = await request.json();
    const { id: userId } = await params;
    
    console.log('User update request:', { userId, username, email, role, location });
    
    // Get current user data to validate against
    const currentUserResult = await query('SELECT username, email, role FROM users WHERE id = $1', [userId]);
    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const currentUser = currentUserResult.rows[0];
    
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

    // Verify user is superadmin
    const userResult = await query('SELECT role, username FROM users WHERE id = $1', [loggedInUserId]);
    const user = userResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Superadmin role required.' }, { status: 403 });
    }

    // Check if username is already taken by another user (only if username is being updated)
    if (username && username !== currentUser.username) {
      const usernameCheck = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
      if (usernameCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
      }
    }
    
    // Check if email is already taken by another user (only if email is being updated)
    if (email && email !== currentUser.email) {
      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
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
    
    console.log('Executing user update with query:', updateQuery);
    console.log('With params:', updateParams.map((p, i) => i < 2 ? p : '***'));

    const updatedUserResult = await query(updateQuery, updateParams);
    
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
