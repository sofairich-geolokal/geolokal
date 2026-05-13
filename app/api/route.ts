import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 1. Define the interface for the database row
interface UserRow {
  username: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date | string;
}

export async function GET() {
  try {
    // 2. Pass the interface to the query generic
    const result = await pool.query<UserRow>(
      'SELECT username, email, password_hash, role, created_at FROM public.users ORDER BY id DESC'
    );

    const users = result.rows.map(row => ({
      username: row.username,
      email: row.email,
      // ⚠️ SECURITY WARNING: Even for an admin panel, 
      // never send hashes to the client. This is a major security risk.
      password_hash: row.password_hash, 
      role: row.role,
      created: new Date(row.created_at).toLocaleString('en-US', {
        month: 'short', 
        day: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true
      })
    }));

    return NextResponse.json(users);
  } catch (error) {
    // 3. Log the actual error to your server console for debugging
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}