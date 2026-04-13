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

    // Get username and LGU ID of logged-in user
    const userInfoResult = await query('SELECT username, lgu_id FROM users WHERE id = $1', [userId]);
    const creatorInfo = userInfoResult.rows[0];

    if (!creatorInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const loggedInUsername = creatorInfo.username;
    
    // Debug: Get all users to see what's in the database
    const allUsersResult = await query(`
      SELECT id, username, email, role, created_by, is_active, last_login, created_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    // Debug: Get viewers specifically created by this user
    const viewersByCreatorResult = await query(`
      SELECT id, username, email, role, created_by, is_active, last_login, created_at
      FROM users 
      WHERE role = 'Viewer' AND created_by = $1
      ORDER BY created_at DESC
    `, [loggedInUsername]);

    return NextResponse.json({
      loggedInUsername,
      allUsers: allUsersResult.rows,
      viewersByCreator: viewersByCreatorResult.rows,
      totalUsersCount: allUsersResult.rows.length,
      viewersByCreatorCount: viewersByCreatorResult.rows.length
    });
  } catch (error: any) {
    console.error("Debug Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to fetch debug info' }, 
      { status: 500 }
    );
  }
}
