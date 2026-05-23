"use server";
import { query } from "@/lib/db";
import { cookies } from 'next/headers';

// Interface to define the structure of the user row from the database
interface TopbarUserRow {
  username: string;
  role: string;
  location: string | null;
}

// Helper to get the current session/logged-in user from auth token
export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token')?.value;
        
        if (!authToken) return null;
        
        const tokenParts = authToken.split('_');
        if (tokenParts.length !== 3 || tokenParts[0] !== 'token') {
            return null;
        }
        
        return tokenParts[1];
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