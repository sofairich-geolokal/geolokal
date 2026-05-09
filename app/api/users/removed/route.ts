import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Check for superadmin direct access header
    const headers = request.headers;
    const superadminAccess = headers.get('x-superadmin-direct-access');
    
    let loggedInUser = 'Superadmin';
    
    if (superadminAccess !== 'true') {
      // Normal authentication flow
      const userId = await getAuthUser();
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get username of logged-in user
      const creatorResult = await query('SELECT username FROM users WHERE id = $1', [userId]);
      loggedInUser = creatorResult.rows[0]?.username;

      if (!loggedInUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // Fetch removed (inactive) viewers
    let queryText: string, queryParams: any[];
    
    if (superadminAccess === 'true') {
      // Superadmin can see all removed viewers
      queryText = `
        SELECT u.username, u.email, u.password_hash, u.role, 
               to_char(u.created_at, 'Mon DD, YYYY HH:MI AM') as created
        FROM users u
        WHERE u.role = 'Viewer' AND u.is_active = false
        ORDER BY u.created_at DESC
      `;
      queryParams = [];
    } else {
      // Normal LGU user can only see viewers they created
      queryText = `
        SELECT u.username, u.email, u.password_hash, u.role, 
               to_char(u.created_at, 'Mon DD, YYYY HH:MI AM') as created
        FROM users u
        WHERE u.created_by = $1 AND u.role = 'Viewer' AND u.is_active = false
        ORDER BY u.created_at DESC
      `;
      queryParams = [loggedInUser];
    }
    
    const result = await query(queryText, queryParams);
    
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Fetch Removed Users Error:", error.message);
    return NextResponse.json([], { status: 500 });
  }
}
