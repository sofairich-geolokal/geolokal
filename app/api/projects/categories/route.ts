import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = `
      SELECT id, name 
      FROM project_categories 
      ORDER BY name;
    `;
    
    const result = await query(sql);
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Fetch Categories Error:", error.message);
    return NextResponse.json([], { status: 500 }); 
  }
}
