"use server";
import { query } from "@/lib/db";

// Helper to simulate getting the current session/logged-in user
// Replace the return '5' with your actual session logic later
export async function getCurrentUser() {
    try {
        // For now, returning Rukhsar's ID from your DB screenshot
        return 5; 
    } catch (error) {
        console.error("Auth Error:", error);
        return null;
    }
}

export async function getTopbarData(userId: number | string) {
  try {
    const text = `
      SELECT 
        username, 
        role,
        location
      FROM public.users
      WHERE id = $1
    `;
    
    const result = await query(text, [userId]);

    if (result.rows.length === 0) {
      return { username: 'Guest', location: 'N/A', role: 'Viewer' };
    }

    const row = result.rows[0];
    return {
      username: row.username,
      role: row.role, 
      location: row.location || 'Global Access',
    };
  } catch (error) {
    console.error("Database Error:", error);
    return { username: 'Error', location: 'Database Fail', role: '' };
  }
}