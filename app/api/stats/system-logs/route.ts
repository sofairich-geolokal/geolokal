import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        id,
        actor,
        action,
        details,
        created_at as timestamp
      FROM audit_logs 
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching system logs data:", error.message);
    return NextResponse.json([]);
  }
}
