import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

// Define interfaces for TypeScript build stability
interface UserRow {
  id: string | number;
  username: string;
  email: string;
  role: string;
  created_by: string | null;
  is_active: boolean;
  last_login: string | Date | null;
  created_at: string | Date;
  lgu_id?: string | number;
}

interface QueryResult<T> {
  rows: T[];
}

export async function GET() {
  try {
    // 1. Get logged-in user ID from auth token
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get username and LGU ID of logged-in user
    // Casting 'as QueryResult' helps TypeScript understand the shape of the database response
    const userInfoResult = (await query(
      'SELECT username, lgu_id FROM users WHERE id = $1',
      [userId]
    )) as QueryResult<Pick<UserRow, 'username' | 'lgu_id'>>;

    if (userInfoResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const creatorInfo = userInfoResult.rows[0];
    const loggedInUsername = creatorInfo.username;

    // 3. Debug: Get all users to see what's in the database
    const allUsersResult = (await query(`
      SELECT id, username, email, role, created_by, is_active, last_login, created_at
      FROM users 
      ORDER BY created_at DESC
    `)) as QueryResult<UserRow>;

    // 4. Debug: Get viewers specifically created by this user
    const viewersByCreatorResult = (await query(`
      SELECT id, username, email, role, created_by, is_active, last_login, created_at
      FROM users 
      WHERE role = 'Viewer' AND created_by = $1
      ORDER BY created_at DESC
    `, [loggedInUsername])) as QueryResult<UserRow>;

    // 5. Return organized debug response
    return NextResponse.json({
      loggedInUsername,
      allUsers: allUsersResult.rows,
      viewersByCreator: viewersByCreatorResult.rows,
      totalUsersCount: allUsersResult.rows.length,
      viewersByCreatorCount: viewersByCreatorResult.rows.length
    });

  } catch (error: any) {
    // Explicitly logging error for server-side debugging
    console.error("Debug Route Error:", error.message);
    
    return NextResponse.json(
      { error: 'Failed to fetch debug info', details: error.message },
      { status: 500 }
    );
  }
}