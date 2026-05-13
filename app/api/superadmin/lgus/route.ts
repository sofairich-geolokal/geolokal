import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Prevents static generation errors during npm run build
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get logged-in user ID from auth token
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is superadmin - Added 'as any' to resolve unknown type
    const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]) as any;
    const user = userResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Superadmin role required.' }, { status: 403 });
    }

    // Get all available LGUs - Added 'as any' to resolve unknown type
    const lgus = await query(`
      SELECT id, name, province
      FROM city_muni_master
      ORDER BY province, name
    `) as any;

    return NextResponse.json(lgus.rows || []);
  } catch (error: any) {
    console.error('Error fetching LGUs:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch LGUs' },
      { status: 500 }
    );
  }
}