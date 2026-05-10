import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Check for superadmin direct access header
    const headers = request.headers;
    const superadminAccess = headers.get('x-superadmin-direct-access');
    const lguUserId = headers.get('x-lgu-user-id');
    
    let loggedInUsername = 'Superadmin';
    let lguId = null;
    
    if (superadminAccess !== 'true') {
      if (lguUserId) {
        // LGU user access via superadmin
        const userInfoResult = await query('SELECT username, lgu_id FROM users WHERE id = $1', [lguUserId]);
        const creatorInfo = userInfoResult.rows[0];
        if (creatorInfo) {
          loggedInUsername = creatorInfo.username;
          lguId = creatorInfo.lgu_id;
        }
      } else {
        // Normal authentication flow
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

        loggedInUsername = creatorInfo.username;
        lguId = creatorInfo.lgu_id;
      }
    }

    // Debug: Get viewers to see what created_by values exist (filtered for LGU users)
    // Only select columns that definitely exist to avoid errors
    let allViewersDebug;
    if (superadminAccess === 'true') {
      allViewersDebug = await query(`
        SELECT id, username, created_by, role, created_at
        FROM users 
        WHERE role = 'Viewer'
        ORDER BY created_at DESC
        LIMIT 10
      `);
    } else {
      allViewersDebug = await query(`
        SELECT id, username, created_by, role, created_at
        FROM users 
        WHERE role = 'Viewer' AND created_by = $1
        ORDER BY created_at DESC
        LIMIT 10
      `, [loggedInUsername]);
    }

    // Count viewers by status (filtered for LGU users)
    let activeViewersResult, removedViewersResult, totalViewersResult;
    
    if (superadminAccess === 'true') {
      // Superadmin sees all viewer stats
      activeViewersResult = await query(`
        SELECT COUNT(*) as count
        FROM users 
        WHERE role = 'Viewer' AND is_active = true
      `);

      removedViewersResult = await query(`
        SELECT COUNT(*) as count
        FROM users 
        WHERE role = 'Viewer' AND is_active = false
      `);

      totalViewersResult = await query(`
        SELECT COUNT(*) as count
        FROM users 
        WHERE role = 'Viewer'
      `);
    } else {
      // LGU users only see stats for viewers they created
      activeViewersResult = await query(`
        SELECT COUNT(*) as count
        FROM users 
        WHERE role = 'Viewer' AND is_active = true AND created_by = $1
      `, [loggedInUsername]);

      removedViewersResult = await query(`
        SELECT COUNT(*) as count
        FROM users 
        WHERE role = 'Viewer' AND is_active = false AND created_by = $1
      `, [loggedInUsername]);

      totalViewersResult = await query(`
        SELECT COUNT(*) as count
        FROM users 
        WHERE role = 'Viewer' AND created_by = $1
      `, [loggedInUsername]);
    }

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
