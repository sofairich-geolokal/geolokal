import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Test environment variables
    const envVars = {
      DB_HOST: process.env.DB_HOST ? 'SET' : 'NOT SET',
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV
    };

    // Test database connection
    const result = await query('SELECT NOW() as current_time, COUNT(*) as user_count FROM users');
    
    return NextResponse.json({
      success: true,
      environment: envVars,
      database: {
        connected: true,
        currentTime: result.rows[0].current_time,
        userCount: result.rows[0].user_count
      }
    });

  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      environment: {
        DB_HOST: process.env.DB_HOST ? 'SET' : 'NOT SET',
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER ? 'SET' : 'NOT SET'
      }
    }, { status: 500 });
  }
}
