import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = `
      SELECT 
        pc.name as category,
        COUNT(p.id) as project_count
      FROM project_categories pc 
      LEFT JOIN projects p ON pc.id = p.category_id 
      GROUP BY pc.name 
      ORDER BY project_count DESC, pc.name
    `;
    
    const result = await query(sql);
    
    // Define colors for categories
    const categoryColors: { [key: string]: string } = {
      'Environmental': '#10b981',
      'Infrastructure': '#f59e0b', 
      'Health': '#ef4444',
      'Education': '#3b82f6',
      'DRRM': '#8b5cf6',
      'Land Use': '#22c55e',
      'Revenue': '#000000',
      'Socio-Eco': '#fb8c00',
      'Smart City': '#ef5350'
    };

    // Map the DB results to frontend interface
    const mappedData = result.rows.map((row) => ({
      category: row.category,
      count: Number(row.project_count) || 0,
      color: categoryColors[row.category] || "#3b82f6",
    }));

    return NextResponse.json(mappedData); 
  } catch (error: any) {
    console.error("Fetch Projects by Category Error:", error.message);
    return NextResponse.json([], { status: 500 }); 
  }
}
