import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const sql = `
    SELECT 
        p.id AS "id",
        p.project_name AS "project_name", 
        c.name AS "category", 
        m.name AS "lgu_location",
        COALESCE(p.description, 'No description provided') AS "description",
        p.status AS "status",
        p.created_at AS "created_at"
    FROM projects p
    JOIN project_categories c ON p.category_id = c.id
    JOIN city_muni_master m ON p.lgu_id = m.id
    ORDER BY p.created_at DESC;
    `;
    
    const result = await query(sql);
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Fetch Projects Stats Error:", error.message);
    return NextResponse.json([], { status: 500 }); 
  }
}
