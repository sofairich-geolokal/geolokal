import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { emailService } from '@/lib/email';

export async function GET(request: Request) {
  try {
    // Check for superadmin direct access header
    const headers = request.headers;
    const superadminAccess = headers.get('x-superadmin-direct-access');
    const lguUserId = headers.get('x-lgu-user-id');
    
    if (superadminAccess === 'true') {
      // Superadmin direct access - return only viewer users (excluding superadmin and LGU)
      const result = await query(`
        SELECT u.username, u.email, u.password_hash, u.role, 
               to_char(u.created_at, 'Mon DD, YYYY HH:MI AM') as created,
               u.created_by
        FROM users u
        WHERE u.is_active = true AND u.role = 'Viewer'
        ORDER BY u.created_at DESC
      `, []) as any;
      
      return NextResponse.json(result.rows || []);
    }
    
    if (lguUserId) {
      // LGU user access via superadmin - return only viewer users created by this LGU
      const result = await query(`
        SELECT u.username, u.email, u.password_hash, u.role, 
               to_char(u.created_at, 'Mon DD, YYYY HH:MI AM') as created,
               u.created_by
        FROM users u
        WHERE u.created_by = (
          SELECT username FROM users WHERE id = $1
        ) AND u.is_active = true AND u.role = 'viewer'
        ORDER BY u.created_at DESC
      `, [lguUserId]) as any;
      
      return NextResponse.json(result.rows || []);
    }
    
    // Normal authentication flow
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch only active users created by the logged-in LGU user
    const result = await query(`
      SELECT u.username, u.email, u.password_hash, u.role, 
             to_char(u.created_at, 'Mon DD, YYYY HH:MI AM') as created,
             u.created_by
      FROM users u
      WHERE u.created_by = (
        SELECT username FROM users WHERE id = $1
      ) AND u.is_active = true
      ORDER BY u.created_at DESC
    `, [userId]) as any;
    
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Fetch Error:", error.message);
    return NextResponse.json([], { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Check for superadmin direct access header
    const headers = request.headers;
    const superadminAccess = headers.get('x-superadmin-direct-access');
    
    let loggedInUser = 'Superadmin';
    let lguId = null;
    
    if (superadminAccess !== 'true') {
      // Normal authentication flow
      const userId = await getAuthUser();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get username of logged-in user
      const creatorResult = await query('SELECT username, lgu_id FROM users WHERE id = $1', [userId]) as any;
      loggedInUser = creatorResult.rows[0]?.username;
      lguId = creatorResult.rows[0]?.lgu_id;

      if (!loggedInUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // Check if deleting a specific user or all users
    const { searchParams } = new URL(request.url);
    const usernameToDelete = searchParams.get('username');

    if (usernameToDelete) {
      // Soft delete specific user by username (set is_active = false)
      let deleteQuery, queryParams;
      
      if (superadminAccess === 'true') {
        // Superadmin can delete any viewer user
        deleteQuery = `
          UPDATE users 
          SET is_active = false
          WHERE username = $1 AND role = 'Viewer'
        `;
        queryParams = [usernameToDelete];
      } else {
        // Normal LGU user can only delete users they created
        deleteQuery = `
          UPDATE users 
          SET is_active = false
          WHERE username = $1 AND role = 'Viewer' AND created_by = $2
        `;
        queryParams = [usernameToDelete, loggedInUser];
      }
      
      const result = await query(deleteQuery, queryParams) as any;
      
      console.log(`Soft deleted user ${usernameToDelete} by ${loggedInUser}`);
      
      // Create Audit Log entry
      await query(
        'INSERT INTO audit_logs (actor, action, details, lgu_id, table_name) VALUES ($1, $2, $3, $4, $5)',
        [loggedInUser, 'USER_DELETE', `Deleted viewer: ${usernameToDelete}`, lguId, 'users']
      );
      
      return NextResponse.json({ 
        message: 'User deleted successfully',
        deletedCount: result.rowCount 
      });
    } else {
      // Soft delete all users with 'Viewer' role
      let deleteAllQuery: string, deleteAllParams: any[];
      
      if (superadminAccess === 'true') {
        // Superadmin can delete all viewer users
        deleteAllQuery = `
          UPDATE users 
          SET is_active = false
          WHERE role = 'Viewer'
        `;
        deleteAllParams = [];
      } else {
        // Normal LGU user can only delete users they created
        deleteAllQuery = `
          UPDATE users 
          SET is_active = false
          WHERE role = 'Viewer' AND created_by = $1
        `;
        deleteAllParams = [loggedInUser];
      }
      
      const result = await query(deleteAllQuery, deleteAllParams) as any;
      
      console.log(`Soft deleted ${result.rowCount} viewer users created by ${loggedInUser}`);
      
      return NextResponse.json({ 
        message: 'Viewer users cleared successfully',
        deletedCount: result.rowCount 
      });
    }
  } catch (error: any) {
    console.error("Delete Users Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to delete viewer users' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { username, email, password_hash, password } = await request.json();
    
    // Safely capture the password regardless of whether the frontend sends 'password' or 'password_hash'
    const finalPassword = password_hash || password;

    if (!finalPassword) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }
    
    // Check for superadmin direct access header
    const headers = request.headers;
    const superadminAccess = headers.get('x-superadmin-direct-access');
    
    let creatorInfo;
    
    if (superadminAccess === 'true') {
      // Superadmin direct access - use default values
      creatorInfo = {
        username: 'Superadmin',
        lgu_id: null
      };
    } else {
      // Normal authentication flow
      const userId = await getAuthUser();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get the username and LGU ID of logged-in user
      const userInfoResult = await query('SELECT username, lgu_id FROM users WHERE id = $1', [userId]) as any;
      creatorInfo = userInfoResult.rows[0];

      if (!creatorInfo) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // Insert User linked to logged-in user's LGU
    const userSql = `
      INSERT INTO users (username, email, password_hash, role, lgu_id, created_by) 
      VALUES ($1, $2, $3, 'Viewer', $4, $5) 
      RETURNING username, email, password_hash, role, 
                to_char(created_at, 'Mon DD, YYYY HH:MI AM') as created`;
    
    // Pass finalPassword here so it is never null
    const newUserResult = await query(userSql, [username, email, finalPassword, creatorInfo.lgu_id, creatorInfo.username]) as any;
    
    // Create Audit Log entry (FIXED: Added table_name column and 'users' value)
    await query(
      'INSERT INTO audit_logs (actor, action, details, lgu_id, table_name) VALUES ($1, $2, $3, $4, $5)',
      [creatorInfo.username, 'USER_CREATE', `Created viewer: ${username}`, creatorInfo.lgu_id, 'users']
    );

    // Send email to the new viewer
    try {
      const viewerPortalLink = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const emailSent = await emailService.sendViewerCreationEmail({
        username,
        email,
        password: finalPassword, // Send the extracted password in the email
        createdBy: creatorInfo.username,
        viewerPortalLink
      });

      if (emailSent) {
        console.log(`Viewer creation email sent to ${email}`);
      } else {
        console.warn(`Failed to send viewer creation email to ${email}`);
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json(newUserResult.rows[0]);
  } catch (error: any) {
    console.error("Insert Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}