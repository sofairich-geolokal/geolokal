import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// This ensures the route is treated as dynamic and prevents build-time errors
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // For superadmin direct access, we need to bypass authentication
    // This endpoint should only be accessible in development or with specific IP restrictions
    // For now, we'll check if there's a superadmin user in the database
    
    // Added 'as any' to cast the result and resolve the TS18046 error
    const result = await query(
      `SELECT id, username, email, role FROM users WHERE role = 'superadmin' LIMIT 1`,
      []
    ) as any;

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

  } catch (error: any) {
    console.error('Error in direct access:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}