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
    const lguId = creatorInfo.lgu_id;

    // Debug: Get all viewers to see what created_by values exist
    // Only select columns that definitely exist to avoid errors
    const allViewersDebug = await query(`
      SELECT id, username, created_by, role, created_at
      FROM users 
      WHERE role = 'Viewer'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Count viewers by status
    const activeViewersResult = await query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE role = 'Viewer' AND is_active = true
    `);

    const removedViewersResult = await query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE role = 'Viewer' AND is_active = false
    `);

    const totalViewersResult = await query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE role = 'Viewer'
    `);

    const activeViewers = parseInt(activeViewersResult.rows[0]?.count) || 0;
    const removedViewers = parseInt(removedViewersResult.rows[0]?.count) || 0;
    const totalViewers = parseInt(totalViewersResult.rows[0]?.count) || 0;

    const stats = {
      totalViewers,
      activeViewers,
      loggedInViewers: activeViewers, // Simplified: active viewers are considered logged in
      removedViewers,
      debug: {
        loggedInUsername,
        allViewersDebug: allViewersDebug.rows,
      }
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Stats Fetch Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to fetch viewer statistics', details: error.message }, 
      { status: 500 }
    );
  }
}
