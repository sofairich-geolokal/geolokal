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

    // Get username of logged-in user
    const userInfoResult = await query('SELECT username FROM users WHERE id = $1', [userId]);
    const creatorInfo = userInfoResult.rows[0];

    if (!creatorInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const loggedInUsername = creatorInfo.username;

    // Simple count queries without complex conditions
    const totalViewersResult = await query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE role = 'Viewer'
    `);

    const createdByResult = await query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE role = 'Viewer' AND created_by = $1
    `, [loggedInUsername]);

    return NextResponse.json({
      totalViewers: parseInt(totalViewersResult.rows[0]?.count) || 0,
      viewersByCreator: parseInt(createdByResult.rows[0]?.count) || 0,
      activeViewers: 0,
      loggedInViewers: 0,
      removedViewers: 0,
      debug: {
        loggedInUsername,
        totalViewers: totalViewersResult.rows[0],
        viewersByCreator: createdByResult.rows[0]
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
