import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();
    
    console.log('🔍 DEBUG: Testing user lookup for:', username);
    
    // Test direct database query
    const result = await query(
      'SELECT id, username, lgu_id, password_hash, role FROM users WHERE username = $1',
      [username]
    );
    
    console.log('📊 DEBUG: Query result:', result.rows);
    console.log('📊 DEBUG: Row count:', result.rows.length);
    
    let allUsers = [];
    if (result.rows.length === 0) {
      console.log('❌ DEBUG: No user found for username:', username);
      
      // Test if user exists with different case
      const allUsersResult = await query('SELECT username FROM users');
      allUsers = allUsersResult.rows.map(r => r.username);
      console.log('📋 DEBUG: All usernames in database:', allUsers);
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        username,
        found: result.rows.length > 0,
        user: result.rows[0] || null,
        allUsers: allUsers
      }
    });
    
  } catch (error: any) {
    console.error('❌ DEBUG ERROR:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
