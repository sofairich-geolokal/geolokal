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
    const creatorResult = await query('SELECT username FROM users WHERE id = $1', [userId]);
    const loggedInUser = creatorResult.rows[0]?.username;

    if (!loggedInUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch removed (inactive) viewers created by the logged-in LGU user
    const result = await query(`
      SELECT u.username, u.email, u.password_hash, u.role, 
             to_char(u.created_at, 'Mon DD, YYYY HH:MI AM') as created
      FROM users u
      WHERE u.created_by = $1 AND u.role = 'Viewer' AND u.is_active = false
      ORDER BY u.created_at DESC
    `, [loggedInUser]);
    
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Fetch Removed Users Error:", error.message);
    return NextResponse.json([], { status: 500 });
  }
}
