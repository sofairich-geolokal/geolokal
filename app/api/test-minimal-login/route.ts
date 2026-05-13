import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Prevents build errors by ensuring the route is treated as dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();
    
    // Direct database query - Assert as 'any' to resolve the 'unknown' type error (TS18046)
    const result = await query(
      'SELECT id, username, lgu_id, password_hash, role FROM users WHERE username = $1',
      [username]
    ) as any;
    
    console.log('MINIMAL TEST: Query result for', username, ':', result.rows);
    
    return NextResponse.json({
      success: true,
      user: result.rows[0] || null,
      rowCount: result.rows.length
    });
    
  } catch (error: any) {
    console.error('MINIMAL TEST ERROR:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}