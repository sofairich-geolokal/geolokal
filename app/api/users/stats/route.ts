import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

// Define types to satisfy the TypeScript compiler
interface UserInfo {
  id: string | number;
  lgu_id: string | number;
}

interface StatsRow {
  totalviewers: string | number;
  activeviewers: string | number;
  removedviewers: string | number;
}

interface QueryResult<T> {
  rows: T[];
}

export async function GET(request: Request) {
  try {
    const headers = request.headers;
    const superadminDirectAccess = headers.get('x-superadmin-direct-access');
    const superadminViaLGU = headers.get('x-superadmin-access');
    const lguUserId = headers.get('x-lgu-user-id');
    const isSuperadmin = superadminDirectAccess === 'true' || superadminViaLGU === 'true';
    
    let loggedInUserId: string | number | null = null;
    // let lguId = null; // Declared but unused in original logic - keeping for structure

    if (!isSuperadmin) {
      if (lguUserId) {
        const userInfoResult = (await query('SELECT id, lgu_id FROM users WHERE id = $1', [lguUserId])) as QueryResult<UserInfo>;
        const creatorInfo = userInfoResult.rows[0];
        if (creatorInfo) {
          loggedInUserId = creatorInfo.id;
          // lguId = creatorInfo.lgu_id;
        }
      } else {
        const userId = await getAuthUser();
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userInfoResult = (await query('SELECT id, lgu_id FROM users WHERE id = $1', [userId])) as QueryResult<UserInfo>;
        const creatorInfo = userInfoResult.rows[0];

        if (!creatorInfo) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        loggedInUserId = creatorInfo.id;
        // lguId = creatorInfo.lgu_id;
      }
    }

    // Handle Debug queries with proper typing
    let allViewersDebugResult: QueryResult<any>;
    if (isSuperadmin) {
      allViewersDebugResult = (await query(`
        SELECT id, username, created_by, role, created_at
        FROM users 
        WHERE role = 'Viewer'
        ORDER BY created_at DESC
        LIMIT 10
      `)) as QueryResult<any>;
    } else {
      allViewersDebugResult = (await query(`
        SELECT id, username, created_by, role, created_at
        FROM users 
        WHERE role = 'Viewer' AND created_by = $1
        ORDER BY created_at DESC
        LIMIT 10
      `, [loggedInUserId])) as QueryResult<any>;
    }

    let statsQuery: string;
    let queryParams: any[];
    
    if (isSuperadmin) {
      statsQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE role = 'Viewer') as totalviewers,
          COUNT(*) FILTER (WHERE role = 'Viewer' AND is_active = true) as activeviewers,
          COUNT(*) FILTER (WHERE role = 'Viewer' AND is_active = false) as removedviewers
        FROM users 
      `;
      queryParams = [];
    } else {
      statsQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE role = 'Viewer' AND created_by = $1) as totalviewers,
          COUNT(*) FILTER (WHERE role = 'Viewer' AND is_active = true AND created_by = $1) as activeviewers,
          COUNT(*) FILTER (WHERE role = 'Viewer' AND is_active = false AND created_by = $1) as removedviewers
        FROM users 
      `;
      queryParams = [loggedInUserId];
    }

    const statsResult = (await query(statsQuery, queryParams)) as QueryResult<StatsRow>;
    const statsData = statsResult.rows[0];

    // parse strings to integers (Postgres COUNT returns strings)
    const activeViewers = parseInt(String(statsData?.activeviewers || 0), 10);
    const removedViewers = parseInt(String(statsData?.removedviewers || 0), 10);
    const totalViewers = parseInt(String(statsData?.totalviewers || 0), 10);

    const stats = {
      totalViewers,
      activeViewers,
      loggedInViewers: activeViewers,
      removedViewers,
      debug: {
        loggedInUserId,
        allViewersDebug: allViewersDebugResult.rows,
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