import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireSuperadminRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify superadmin authentication
    const superadmin = await requireSuperadminRole();
    if (!superadmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lguUserId } = await request.json();
    
    if (!lguUserId) {
      return NextResponse.json({ error: 'LGU User ID is required' }, { status: 400 });
    }

    // Get LGU user data
    const result = await query(
      `SELECT u.id, u.username, u.email, u.role, u.lgu_id, c.name as lgu_name, c.province,
       COALESCE(c.province, 'Batangas') as province_display,
       COALESCE(c.name, 'Ibaan') as city_display
       FROM users u 
       LEFT JOIN city_muni_master c ON u.lgu_id = c.id 
       WHERE u.id = $1 AND u.role = 'lgu'`,
      [lguUserId]
    );

    const lguUser = result.rows[0];
    if (!lguUser) {
      return NextResponse.json({ error: 'LGU User not found' }, { status: 404 });
    }

    // Format location string
    lguUser.location = `${lguUser.province_display}, ${lguUser.city_display}`;

    // Create a temporary session token for superadmin to access LGU dashboard
    const tempToken = `superadmin_lgu_access_${lguUser.id}_${Date.now()}`;

    return NextResponse.json({ 
      success: true,
      lguUser,
      tempToken 
    });

  } catch (error) {
    console.error('Error accessing LGU dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
