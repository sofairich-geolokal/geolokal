import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// This ensures the route is treated as dynamic and prevents build-time static generation errors
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all users - Assert as 'any' to resolve 'unknown' type error (TS18046)
    const allUsersResult = await query(`
      SELECT id, username, email, role, created_by, is_active, last_login, created_at
      FROM users 
      WHERE role = 'Viewer'
      ORDER BY created_at DESC
    `) as any;

    // Get all usernames - Assert as 'any'
    const allCreatorsResult = await query(`
      SELECT DISTINCT username, role 
      FROM users 
      WHERE role != 'Viewer' OR role IS NULL
      ORDER BY username
    `) as any;

    return NextResponse.json({
      totalViewerUsers: allUsersResult.rows.length,
      viewerUsers: allUsersResult.rows,
      potentialCreators: allCreatorsResult.rows,
      sampleCreatedBy: allUsersResult.rows.map((u: any) => u.created_by)
    });
  } catch (error: any) {
    console.error("Test Stats Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to fetch test stats' }, 
      { status: 500 }
    );
  }
}