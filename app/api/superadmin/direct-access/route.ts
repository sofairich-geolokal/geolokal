import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // For superadmin direct access, we need to bypass authentication
    // This endpoint should only be accessible in development or with specific IP restrictions
    // For now, we'll check if there's a superadmin user in the database
    
    const result = await query(
      `SELECT id, username, email, role FROM users WHERE role = 'superadmin' LIMIT 1`,
      []
    );

    const superadmin = result.rows[0];
    if (!superadmin) {
      return NextResponse.json({ error: 'Superadmin not found' }, { status: 404 });
    }

    // Return superadmin data for direct access
    return NextResponse.json({ 
      success: true,
      superadmin: {
        id: superadmin.id,
        username: superadmin.username,
        email: superadmin.email,
        role: superadmin.role
      }
    });

  } catch (error) {
    console.error('Error in direct access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
