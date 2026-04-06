import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { emailService } from '@/lib/email';

export async function GET() {
  try {
    // Get logged-in user ID from auth token
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch only users created by the logged-in LGU user
    const result = await query(`
      SELECT u.username, u.email, u.password_hash, u.role, 
             to_char(u.created_at, 'Mon DD, YYYY HH:MI AM') as created,
             u.created_by
      FROM users u
      WHERE u.created_by = (
        SELECT username FROM users WHERE id = $1
      )
      ORDER BY u.created_at DESC
    `, [userId]);
    
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Fetch Error:", error.message);
    return NextResponse.json([], { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Get logged-in user ID from auth token
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get username of logged-in user
    const creatorResult = await query('SELECT username FROM users WHERE id = $1', [userId]);
    const loggedInUser = creatorResult.rows[0]?.username;

    if (!loggedInUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete only users with 'Viewer' role created by the logged-in LGU user
    const result = await query(`
      DELETE FROM users 
      WHERE role = 'Viewer' AND created_by = $1
    `, [loggedInUser]);
    
    console.log(`Deleted ${result.rowCount} viewer users created by ${loggedInUser}`);
    
    return NextResponse.json({ 
      message: 'Viewer users cleared successfully',
      deletedCount: result.rowCount 
    });
  } catch (error: any) {
    console.error("Delete Users Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to clear viewer users' }, 
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
    
    // Get logged-in user ID and info
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the username and LGU ID of logged-in user
    const userInfoResult = await query('SELECT username, lgu_id FROM users WHERE id = $1', [userId]);
    const creatorInfo = userInfoResult.rows[0];

    if (!creatorInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Insert User linked to logged-in user's LGU
    const userSql = `
      INSERT INTO users (username, email, password_hash, role, lgu_id, created_by) 
      VALUES ($1, $2, $3, 'Viewer', $4, $5) 
      RETURNING username, email, password_hash, role, 
                to_char(created_at, 'Mon DD, YYYY HH:MI AM') as created`;
    
    // Pass finalPassword here so it is never null
    const newUserResult = await query(userSql, [username, email, finalPassword, creatorInfo.lgu_id, creatorInfo.username]);
    
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