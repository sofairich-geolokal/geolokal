import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

// Define the shape of the user from the DB
interface UserRow {
  id: string | number;
  username: string;
  lgu_id: string | number | null;
  password_hash: string;
  role: string;
}

interface QueryResult<T> {
  rows: T[];
}

export async function POST(request: Request) {
  try {
    const { username, password, selectedCityId }: { username: string; password: string; selectedCityId?: string } = await request.json();
    
    console.log('NEW LOGIN API: Request received:', { username, password: '***', selectedCityId });

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Direct database query with explicit typing
    const result = (await query(
      'SELECT id, username, lgu_id, password_hash, role FROM users WHERE username = $1',
      [username]
    )) as QueryResult<UserRow>;
    
    const user = result.rows[0];
    
    if (!user) {
      console.log('NEW LOGIN API: User not found:', username);
      return NextResponse.json(
        { success: false, error: 'User not found. Please check your username.' },
        { status: 401 }
      );
    }

    // Password comparison (Note: In production, use bcrypt.compare)
    if (user.password_hash !== password) {
      console.log('NEW LOGIN API: Password mismatch');
      return NextResponse.json(
        { success: false, error: 'Incorrect password.' },
        { status: 401 }
      );
    }

    // Role validation
    const userRole = user.role || 'viewer';
    if (userRole.toLowerCase() !== 'viewer') {
      console.log('NEW LOGIN API: Role validation failed:', userRole);
      return NextResponse.json(
        { success: false, error: 'Access denied. Viewer role required.' },
        { status: 403 }
      );
    }

    // Update location for viewer
    let finalLguId = user.lgu_id;
    let finalLocation: string | null = null;
    
    if (userRole.toLowerCase() === 'viewer' && selectedCityId) {
      const locationMap: Record<string, string> = {
        '1': 'Ibaan, Batangas',
        '2': 'Teresa, Rizal', 
        '3': 'Binangonan, Rizal'
      };
      
      const locationName = locationMap[selectedCityId] || 'Ibaan, Batangas';
      
      await query(
        'UPDATE users SET lgu_id = $1, location = $2 WHERE id = $3',
        [selectedCityId, locationName, user.id]
      );
      finalLguId = selectedCityId;
      finalLocation = locationName;
    }
    
    // Set auth token
    const authToken = `token_${user.id}_${Date.now()}`;
    
    // Correctly await cookies() for Next.js build compliance
    const cookieStore = await cookies();
    
    cookieStore.set('auth_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    
    console.log('NEW LOGIN API: Login successful for:', username);
    
    return NextResponse.json({
      success: true,
      user: {
        id: String(user.id),
        username: user.username,
        lgu_id: String(finalLguId || ''),
        location: finalLocation,
        role: userRole
      }
    });

  } catch (error: any) {
    console.error('NEW LOGIN API: Error:', error.message);
    return NextResponse.json(
      { success: false, error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}