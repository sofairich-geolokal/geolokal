"use server";

import { query } from '@/lib/db';

export async function fetchAccessData() {
  try {
    // Count projects by category
    const result = await query(`
      SELECT 
        pc.name as category_name,
        COUNT(p.id) as project_count
      FROM project_categories pc 
      LEFT JOIN projects p ON pc.id = p.category_id 
      GROUP BY pc.name 
      ORDER BY project_count DESC
    `);

    console.log("RAW DB ROWS:", result.rows);

    if (!result.rows || result.rows.length === 0) {
      console.warn("DB Warning: No project categories found.");
      return [];
    }

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
    return result.rows.map((row) => ({
      label: row.category_name,
      value: Number(row.project_count) || 0,
      color: categoryColors[row.category_name] || "#3b82f6",
    }));

  } catch (error) {
    console.error("Direct Database Error:", error);
    return [];
  }
}