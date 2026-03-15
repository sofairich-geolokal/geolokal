import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT username, email, password_hash, role, created_at FROM public.users ORDER BY id DESC'
    );
    
    const users = result.rows.map(row => ({
      username: row.username,
      email: row.email,
      password_hash: row.password_hash, // MUST return this for frontend visibility 
      role: row.role,
      created: new Date(row.created_at).toLocaleString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
      })
    }));

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}