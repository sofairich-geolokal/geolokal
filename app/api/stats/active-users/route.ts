import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Cast the result to 'any' to allow access to .rows
    const result = (await query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.created_at,
        u.is_active
      FROM users u
      WHERE u.is_active = true
      ORDER BY u.created_at DESC
      LIMIT 20
    `)) as any;
    
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching active users data:", error.message);
    return NextResponse.json([]);
  }
}