"use server";

import { query } from '@/lib/db';

export async function fetchAccessData() {
  try {
    // 1. Execute a raw SQL query
    const result = await query(`
      SELECT project_name, value, color 
      FROM public.projects 
      ORDER BY created_at ASC
    `);

    // 2. LOG THE OUTPUT TO YOUR VS CODE TERMINAL
    // This will tell us if the database is actually sending rows
    console.log("RAW DB ROWS:", result.rows);

    if (!result.rows || result.rows.length === 0) {
      console.warn("DB Warning: No rows found in 'projects' table.");
      return [];
    }

    // 3. Map the DB columns to your Frontend interface
    return result.rows.map((row) => ({
      label: row.project_name,
      value: row.value ? Number(row.value) : 0,
      color: row.color || "#3b82f6",
    }));

  } catch (error) {
    console.error("Direct Database Error:", error);
    return [];
  }
}