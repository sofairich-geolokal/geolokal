import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetches actor, action, details, and formatted timestamp 
    const sql = `
      SELECT 
        to_char(timestamp, 'Mon DD, YYYY HH:MI AM') as timestamp,
        actor, 
        action, 
        created_by,
        details
      FROM audit_logs 
      ORDER BY timestamp DESC`;
      
    const result = await query(sql);
    console.log("Database query result:", result.rows);
    return NextResponse.json(result.rows || []);
  } catch (error: any) {
    console.error("Audit Fetch Error:", error.message);
    return NextResponse.json([], { status: 500 });
  }
}