import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  try {
    // Find user in DB using direct query
    // Fix: cast result as 'any' so TypeScript allows accessing .rows
    const userResult = await query(
      'SELECT id, username, email, role, lgu_id FROM users WHERE username = $1 AND password_hash = $2',
      [username, password]
    ) as any;
    
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    // Check if user has proper role (LGU or Superadmin)
    if (user.role.toLowerCase() !== 'lgu' && user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ success: false, message: "Access denied. LGU admin role required." }, { status: 403 });
    }

    // Create authentication token
    const token = `token_${user.id}_${Date.now()}`;
    
    // Get LGU name if available
    let lguName = null;
    if (user.lgu_id) {
      // Fix: cast result as 'any'
      const lguResult = await query('SELECT name FROM city_muni_master WHERE id = $1', [user.lgu_id]) as any;
      lguName = lguResult.rows[0]?.name;
    }

    // Set authentication cookie and return user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lgu_id: user.lgu_id,
        lgu_name: lguName
      }
    });

    // Set auth token cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('LGU Login Error:', error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}