import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

// Define types to satisfy the TypeScript compiler
interface UserInfo {
  id: string | number;
  lgu_id: string | number;
  username: string;
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
    const isSuperadminViaLGU = superadminViaLGU === 'true';
    
    let loggedInUserId: string | number | null = null;

    // If accessing via LGU user (even in superadmin mode), filter by that LGU user
    if (lguUserId) {
      try {
        const userInfoResult = (await query('SELECT id, lgu_id, username FROM users WHERE id = $1', [lguUserId])) as QueryResult<UserInfo>;
        const creatorInfo = userInfoResult.rows[0];
        if (creatorInfo) {
          loggedInUserId = creatorInfo.username; // Use username for created_by filtering
        }
      } catch (err) {
        console.error("Error fetching LGU user info:", err);
        return NextResponse.json({ error: 'Failed to fetch LGU user info' }, { status: 500 });
      }
    } else if (!isSuperadmin) {
      const userId = await getAuthUser();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      try {
        const userInfoResult = (await query('SELECT id, lgu_id, username FROM users WHERE id = $1', [userId])) as QueryResult<UserInfo>;
        const creatorInfo = userInfoResult.rows[0];

        if (!creatorInfo) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        loggedInUserId = creatorInfo.username; // Use username for created_by filtering
      } catch (err) {
        console.error("Error fetching user info:", err);
        return NextResponse.json({ error: 'Failed to fetch user info' }, { status: 500 });
      }
    }

    let statsQuery: string;
    let queryParams: any[];
    
    // Filter by LGU user if accessing via LGU (even in superadmin mode)
    if (isSuperadmin && !isSuperadminViaLGU && !loggedInUserId) {
      statsQuery = `
        SELECT 
          COUNT(*) as totalviewers,
          COUNT(*) FILTER (WHERE is_active = true) as activeviewers,
          COUNT(*) FILTER (WHERE is_active = false) as removedviewers
        FROM users 
        WHERE role = 'Viewer'
      `;
      queryParams = [];
    } else {
      statsQuery = `
        SELECT 
          COUNT(*) as totalviewers,
          COUNT(*) FILTER (WHERE is_active = true) as activeviewers,
          COUNT(*) FILTER (WHERE is_active = false) as removedviewers
        FROM users 
        WHERE role = 'Viewer' AND created_by = $1
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