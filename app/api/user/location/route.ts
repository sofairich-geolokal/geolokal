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

    // Fetch user location from database - handle missing location column gracefully
    let result;
    try {
      result = await query(
        'SELECT username, location, last_login FROM users WHERE id = $1',
        [userId]
      );
    } catch (dbError: any) {
      // If location column doesn't exist, fetch without it
      if (dbError.message.includes('column') && dbError.message.includes('location')) {
        result = await query(
          'SELECT username, last_login FROM users WHERE id = $1',
          [userId]
        );
        // Return default location for users without location column
        if (result.rows.length > 0) {
          return NextResponse.json({ 
            username: result.rows[0].username,
            location: 'Ibaan, Batangas', // Default fallback
            lastLogin: result.rows[0].last_login
          });
        }
      } else {
        throw dbError;
      }
    }
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];
    return NextResponse.json({ 
      username: user.username,
      location: user.location || 'Ibaan, Batangas',
      lastLogin: user.last_login
    });
  } catch (error: any) {
    console.error("Fetch user location error:", error.message);
    return NextResponse.json({ error: 'Failed to fetch user location' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { location } = await request.json();
    
    if (!location) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    // Get logged-in user ID from auth token
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update user location and last login timestamp - handle missing location column
    let result: any = null;
    try {
      result = await query(
        `UPDATE users 
         SET location = $1, last_login = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING username, location, last_login`,
        [location, userId]
      );
    } catch (dbError: any) {
      // If location column doesn't exist, update only last_login
      if (dbError.message.includes('column') && dbError.message.includes('location')) {
        await query(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
          [userId]
        );
        // Get user info without location
        const userResult = await query(
          'SELECT username, last_login FROM users WHERE id = $1',
          [userId]
        );
        if (userResult.rows.length > 0) {
          return NextResponse.json({ 
            message: 'Location saved to localStorage (database column missing)',
            username: userResult.rows[0].username,
            location: location, // Return the provided location
            lastLogin: userResult.rows[0].last_login
          });
        }
      } else {
        throw dbError;
      }
    }
    
    if (!result || result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = result.rows[0];
    return NextResponse.json({ 
      message: 'Location updated successfully',
      username: updatedUser.username,
      location: updatedUser.location,
      lastLogin: updatedUser.last_login
    });
  } catch (error: any) {
    console.error("Update user location error:", error.message);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}
