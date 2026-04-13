import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get all users to see the data structure
    const allUsersResult = await query(`
      SELECT id, username, email, role, created_by, is_active, last_login, created_at
      FROM users 
      WHERE role = 'Viewer'
      ORDER BY created_at DESC
    `);

    // Get all usernames (potential creators)
    const allCreatorsResult = await query(`
      SELECT DISTINCT username, role 
      FROM users 
      WHERE role != 'Viewer' OR role IS NULL
      ORDER BY username
    `);

    return NextResponse.json({
      totalViewerUsers: allUsersResult.rows.length,
      viewerUsers: allUsersResult.rows,
      potentialCreators: allCreatorsResult.rows,
      sampleCreatedBy: allUsersResult.rows.map(u => u.created_by)
    });
  } catch (error: any) {
    console.error("Test Stats Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to fetch test stats' }, 
      { status: 500 }
    );
  }
}
