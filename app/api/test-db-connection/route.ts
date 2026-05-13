import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Prevents build-time static generation errors by forcing dynamic execution
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing database connection from Next.js server...');
    
    // Test basic connection - Added 'as any' to resolve 'unknown' type
    const timeResult = await query('SELECT NOW() as current_time') as any;
    console.log('✅ Database connection successful');
    
    // Test users table - Added 'as any'
    const userResult = await query('SELECT COUNT(*) as user_count FROM users') as any;
    console.log(`✅ Users table accessible: ${userResult.rows[0].user_count} users`);
    
    // Test specific viewer user - Added 'as any'
    const viewerResult = await query('SELECT username, role FROM users WHERE username = $1', ['ibaan.viewer2']) as any;
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