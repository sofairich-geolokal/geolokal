import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

// Define interfaces to prevent TypeScript "any" errors during build
interface CountRow {
  count: string | number;
}

interface UserRow {
  username: string;
}

interface QueryResult<T> {
  rows: T[];
}

export async function GET() {
  try {
    // Get logged-in user ID from auth token
    const userId = await getAuthUser();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get username of logged-in user with explicit typing
    const userInfoResult = (await query(
      'SELECT username FROM users WHERE id = $1', 
      [userId]
    )) as QueryResult<UserRow>;
    
    const creatorInfo = userInfoResult.rows[0];

    if (!creatorInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const loggedInUsername = creatorInfo.username;

    // Simple count queries with explicit typing
    const totalViewersResult = (await query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE role = 'Viewer'
    `)) as QueryResult<CountRow>;

    const createdByResult = (await query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE role = 'Viewer' AND created_by = $1
    `, [loggedInUsername])) as QueryResult<CountRow>;

    // Safely parse the count (Postgres returns counts as strings)
    const totalCount = totalViewersResult.rows[0] 
      ? parseInt(String(totalViewersResult.rows[0].count), 10) 
      : 0;
      
    const creatorCount = createdByResult.rows[0] 
      ? parseInt(String(createdByResult.rows[0].count), 10) 
      : 0;

    return NextResponse.json({
      totalViewers: totalCount,
      viewersByCreator: creatorCount,
      activeViewers: 0,
      loggedInViewers: 0,
      removedViewers: 0,
      debug: {
        loggedInUsername,
        totalViewers: totalViewersResult.rows[0] || { count: 0 },
        viewersByCreator: createdByResult.rows[0] || { count: 0 }
      }
    });
  } catch (error: any) {
    console.error("Simple Stats Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to fetch viewer statistics', details: error.message }, 
      { status: 500 }
    );
  }
}