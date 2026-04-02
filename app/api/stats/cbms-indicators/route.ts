import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        indicator_code,
        indicator_value,
        status,
        updated_at
      FROM cbms_indicators 
      ORDER BY updated_at DESC
      LIMIT 20
    `);
    
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching CBMS indicators data:", error.message);
    return NextResponse.json([]);
  }
}
