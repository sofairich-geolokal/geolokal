import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('Testing database connection from Next.js server...');
    
    // Test basic connection
    const timeResult = await query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful');
    
    // Test users table
    const userResult = await query('SELECT COUNT(*) as user_count FROM users');
    console.log(`✅ Users table accessible: ${userResult.rows[0].user_count} users`);
    
    // Test specific viewer user
    const viewerResult = await query('SELECT username, role FROM users WHERE username = $1', ['ibaan.viewer2']);
    console.log('✅ Viewer user query successful:', viewerResult.rows[0]);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection working perfectly',
      data: {
        currentTime: timeResult.rows[0].current_time,
        userCount: userResult.rows[0].user_count,
        viewerUser: viewerResult.rows[0]
      }
    });
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}
