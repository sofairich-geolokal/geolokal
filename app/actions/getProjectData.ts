"use server";

import { query } from '@/lib/db';

export async function fetchAccessData() {
  const startTime = Date.now();
  
  try {
    // Calculate project progress by category with optimized query
    const result = await query(`
      SELECT 
        pc.name as category_name,
        COUNT(p.id) as total_projects,
        COUNT(CASE WHEN p.status = 'Completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN p.status = 'In Progress' THEN 1 END) as in_progress_projects,
        COUNT(CASE WHEN p.status = 'Pending' THEN 1 END) as pending_projects,
        COUNT(CASE WHEN p.status = 'On Hold' THEN 1 END) as on_hold_projects,
        ROUND(
          (COUNT(CASE WHEN p.status = 'Completed' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(p.id), 0)), 2
        ) as completion_percentage
      FROM project_categories pc 
      LEFT JOIN projects p ON pc.id = p.category_id 
      GROUP BY pc.name 
      ORDER BY completion_percentage DESC
    `);

    const queryTime = Date.now() - startTime;
    console.log(`Project progress query executed in ${queryTime}ms`);
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

    // Map the DB results to frontend interface with progress data
    const mappedData = result.rows.map((row) => ({
      label: row.category_name,
      value: Number(row.completion_percentage) || 0,
      totalProjects: Number(row.total_projects) || 0,
      completedProjects: Number(row.completed_projects) || 0,
      inProgressProjects: Number(row.in_progress_projects) || 0,
      pendingProjects: Number(row.pending_projects) || 0,
      onHoldProjects: Number(row.on_hold_projects) || 0,
      color: categoryColors[row.category_name] || "#3b82f6",
    }));

    console.log(`Mapped ${mappedData.length} categories with project progress data`);
    return mappedData;

  } catch (error) {
    const queryTime = Date.now() - startTime;
    console.error(`Database Error in fetchAccessData (after ${queryTime}ms):`, error);
    
    // Return empty array on error to prevent frontend crashes
    return [];
  }
}