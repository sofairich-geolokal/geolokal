"use server";
import { query } from "@/lib/db";

// Interface to define the structure of the user row from the database
interface TopbarUserRow {
  username: string;
  role: string;
  location: string | null;
}

// Helper to simulate getting the current session/logged-in user
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
    
    // Explicitly casting the result to fix the 'unknown' type error
    const result = (await query(text, [userId])) as { rows: TopbarUserRow[] };

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