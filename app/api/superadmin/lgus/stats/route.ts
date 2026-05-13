import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// Prevents build-time static generation errors
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Fetching LGU stats...");
    
    // Get actual LGU stats from database
    console.log('Querying LGU stats...');
    
    // Assert as 'any' to resolve 'unknown' type errors
    const roleCheck = await query('SELECT DISTINCT role FROM users WHERE role IS NOT NULL') as any;
    // Explicitly type 'r' to resolve implicit any error
    console.log('Found roles:', roleCheck.rows.map((r: { role: string }) => r.role));
    
    // Get total LGU admins (case insensitive)
    const totalLGUAdmins = await query('SELECT COUNT(*) as count FROM users WHERE LOWER(role) = LOWER($1)', ['lgu']) as any;
    console.log('Total LGU Admins query result:', totalLGUAdmins.rows[0]);
    
    // For now, use same values for other stats since we don't have is_active/last_login fields
    const activeLGUAdmins = totalLGUAdmins; // All LGU admins are considered active
    const loggedInLGUAdmins = totalLGUAdmins; // All LGU admins considered logged in for now
    
    const removedLGUAdmins = await query('SELECT COUNT(*) as count FROM users WHERE LOWER(role) = LOWER($1) AND username LIKE \'%deleted%\'', ['lgu']) as any;
    
    const stats = {
      totalLGUAdmins: totalLGUAdmins.rows[0]?.count || 0,
      activeLGUAdmins: activeLGUAdmins.rows[0]?.count || 0,
      loggedInLGUAdmins: loggedInLGUAdmins.rows[0]?.count || 0,
      removedLGUAdmins: removedLGUAdmins.rows[0]?.count || 0,
    };

    console.log("LGU stats response:", stats);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("LGU Stats Fetch Error:", error);
    
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        { error: 'Database connection failed' }, 
        { status: 500 }
      );
    }
    
    // Check if it's a connection pool error
    if (error.message?.includes('connection') || error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Database connection timeout' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to fetch LGU statistics: ${error.message}` }, 
      { status: 500 }
    );
  }
}