import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const { username, password, selectedCityId } = await req.json();
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return NextResponse.json({ success: false, error: 'No DATABASE_URL' }, { status: 500 });

    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    try {
      const res = await pool.query('SELECT id, username, password_hash, role FROM users WHERE lower(username) = lower($1) LIMIT 1', [username]);
      if (res.rows.length === 0) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      const user = res.rows[0];
      const hash = user.password_hash;
      let ok = false;
      if (!hash) ok = false;
      else if (typeof hash === 'string' && hash.startsWith('$2')) {
        ok = await bcrypt.compare(password, hash);
      } else {
        ok = password === hash;
      }
      await pool.end();
      return NextResponse.json({ success: ok, user: ok ? { id: user.id, username: user.username, role: user.role } : null, debug: { hashPreview: hash ? hash.substring(0,40) + '...' : null } });
    } catch (e: any) {
      await pool.end();
      return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
