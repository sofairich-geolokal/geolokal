import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = `
    SELECT 
    p.id,
    p.project_name AS title, 
    c.name AS category, 
    COALESCE(p.description, 'No description provided') AS description,
    p.status, 
    m.name AS lgu,
    p.created_at AS "lastUpdated"
FROM projects p
JOIN project_categories c ON p.category_id = c.id
JOIN city_muni_master m ON p.lgu_id = m.id
ORDER BY p.created_at DESC;
    `;
    
    const result = await query(sql);
    // CRITICAL: Ensure we return the rows array, or an empty array if null
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Fetch Projects Error:", error.message);
    // Return empty array so the frontend .map() doesn't crash
    return NextResponse.json([], { status: 500 }); 
  }
}