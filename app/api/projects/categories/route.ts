import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = `
      SELECT id, name 
      FROM project_categories 
      ORDER BY name;
    `;
    
    // Fix: cast 'result' to 'any' to access the .rows property
    const result = await query(sql) as any;
    
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Fetch Categories Error:", error.message);
    return NextResponse.json([], { status: 500 }); 
  }
}