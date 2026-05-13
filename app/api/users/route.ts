import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { emailService } from '@/lib/email';

// Define interfaces for database rows to satisfy TypeScript
interface UserRow {
  id: string | number;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  created: string;
  lgu_id: string | number;
  created_by: string;
}

interface QueryResult<T> {
  rows: T[];
  rowCount: number | null;
}

export async function GET() {
  try {
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch active users created by the logged-in LGU user
    const result = (await query(`
      SELECT u.username, u.email, u.password_hash, u.role, 
             to_char(u.created_at, 'Mon DD, YYYY HH:MI AM') as created,
             u.created_by
      FROM users u
      WHERE u.created_by = (
        SELECT username FROM users WHERE id = $1
      ) AND u.is_active = true
      ORDER BY u.created_at DESC
    `, [userId])) as QueryResult<UserRow>;
    
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Fetch Error:", error.message);
    return NextResponse.json([], { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creatorResult = (await query(
      'SELECT username, lgu_id FROM users WHERE id = $1', 
      [userId]
    )) as QueryResult<Pick<UserRow, 'username' | 'lgu_id'>>;

    const creator = creatorResult.rows[0];

    if (!creator) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const loggedInUser = creator.username;
    const lguId = creator.lgu_id;

    const { searchParams } = new URL(request.url);
    const usernameToDelete = searchParams.get('username');

    if (usernameToDelete) {
      const result = (await query(`
        UPDATE users 
        SET is_active = false
        WHERE username = $1 AND role = 'Viewer' AND created_by = $2
      `, [usernameToDelete, loggedInUser])) as QueryResult<any>;
      
      await query(
        'INSERT INTO audit_logs (actor, action, details, lgu_id, table_name) VALUES ($1, $2, $3, $4, $5)',
        [loggedInUser, 'USER_DELETE', `Deleted viewer: ${usernameToDelete}`, lguId, 'users']
      );
      
      return NextResponse.json({ 
        message: 'User deleted successfully',
        deletedCount: result.rowCount || 0 
      });
    } else {
      const result = (await query(`
        UPDATE users 
        SET is_active = false
        WHERE role = 'Viewer' AND created_by = $1
      `, [loggedInUser])) as QueryResult<any>;
      
      return NextResponse.json({ 
        message: 'Viewer users cleared successfully',
        deletedCount: result.rowCount || 0 
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
    const finalPassword = password_hash || password;

    if (!finalPassword) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }
    
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userInfoResult = (await query(
      'SELECT username, lgu_id FROM users WHERE id = $1', 
      [userId]
    )) as QueryResult<Pick<UserRow, 'username' | 'lgu_id'>>;

    const creatorInfo = userInfoResult.rows[0];

    if (!creatorInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userSql = `
      INSERT INTO users (username, email, password_hash, role, lgu_id, created_by) 
      VALUES ($1, $2, $3, 'Viewer', $4, $5) 
      RETURNING username, email, password_hash, role, 
                to_char(created_at, 'Mon DD, YYYY HH:MI AM') as created`;
    
    const newUserResult = (await query(
      userSql, 
      [username, email, finalPassword, creatorInfo.lgu_id, creatorInfo.username]
    )) as QueryResult<UserRow>;
    
    await query(
      'INSERT INTO audit_logs (actor, action, details, lgu_id, table_name) VALUES ($1, $2, $3, $4, $5)',
      [creatorInfo.username, 'USER_CREATE', `Created viewer: ${username}`, creatorInfo.lgu_id, 'users']
    );

    // Email Service Flow
    try {
      const viewerPortalLink = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await emailService.sendViewerCreationEmail({
        username,
        email,
        password: finalPassword,
        createdBy: creatorInfo.username,
        viewerPortalLink
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
    }

    return NextResponse.json(newUserResult.rows[0]);
  } catch (error: any) {
    console.error("Insert Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}