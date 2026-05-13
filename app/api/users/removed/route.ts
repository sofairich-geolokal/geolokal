import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

// Define the shape of the user row to satisfy the TypeScript compiler
interface UserRow {
  username: string;
  email: string;
  password_hash: string;
  role: string;
  created: string;
}

interface QueryResult<T> {
  rows: T[];
}

export async function GET(request: Request) {
  try {
    // Check for superadmin access headers
    const headers = request.headers;
    const superadminDirectAccess = headers.get('x-superadmin-direct-access');
    const superadminViaLGU = headers.get('x-superadmin-access');
    // const lguUserId = headers.get('x-lgu-user-id'); // Declared but unused in original logic
    const isSuperadmin = superadminDirectAccess === 'true' || superadminViaLGU === 'true';
    
    let loggedInUser = 'Superadmin';
    
    if (!isSuperadmin) {
      // Normal authentication flow
      const userId = await getAuthUser();
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get username of logged-in user
      const creatorResult = (await query('SELECT username FROM users WHERE id = $1', [userId])) as QueryResult<{ username: string }>;
      
      // Use optional chaining and check existence
      if (!creatorResult.rows || creatorResult.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      loggedInUser = creatorResult.rows[0].username;
    }

    // Fetch removed (inactive) viewers
    let queryText: string;
    let queryParams: any[];
    
    if (isSuperadmin) {
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
    
    const result = (await query(queryText, queryParams)) as QueryResult<UserRow>;
    
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Fetch Removed Users Error:", error.message);
    // Returning an empty array on error as per your original logic, but with a 500 status
    return NextResponse.json([], { status: 500 });
  }
}