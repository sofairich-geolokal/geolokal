import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

// Prevents build-time static generation errors by forcing dynamic execution
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token');

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Extract user ID from token (simple parsing for demo)
    const tokenParts = authToken.value.split('_');
    if (tokenParts.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = tokenParts[1];

    // Get user's city information - Assert as 'any' to resolve the 'unknown' type error
    const result = await query(`
      SELECT u.id, u.lgu_id, c.name as city_name, c.province 
      FROM users u 
      LEFT JOIN city_muni_master c ON u.lgu_id = c.id 
      WHERE u.id = $1 AND u.role = 'Viewer'
    `, [userId]) as any;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    if (!user.lgu_id) {
      return NextResponse.json(
        { success: false, error: 'No city selected' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      city: {
        id: user.lgu_id,
        name: user.city_name,
        province: user.province
      }
    });

  } catch (error: any) {
    console.error('Error fetching user city:', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}