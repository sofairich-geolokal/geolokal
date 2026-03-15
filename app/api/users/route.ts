import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(`
      SELECT username, email, password_hash, role, 
             to_char(created_at, 'Mon DD, YYYY HH:MI AM') as created 
      FROM users 
      ORDER BY created_at DESC
    `);
    return NextResponse.json(result.rows || []); 
  } catch (error: any) {
    console.error("Fetch Error:", error.message);
    return NextResponse.json([], { status: 500 }); // Prevents "Unexpected end of JSON"
  }
}

export async function DELETE() {
  try {
    // Delete only users with 'Viewer' role created by the logged-in LGU user
    const result = await query(`
      DELETE FROM users 
      WHERE role = 'Viewer' AND created_by = 'Admin_Ibaan'
    `);
    
    console.log(`Deleted ${result.rowCount} viewer users created by Admin_Ibaan`);
    
    return NextResponse.json({ 
      message: 'Viewer users cleared successfully',
      deletedCount: result.rowCount 
    });
  } catch (error: any) {
    console.error("Delete Users Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to clear viewer users' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { username, email, password_hash } = await request.json();
    const creator = "Admin_Ibaan"; 

    // Insert User linked to LGU 1 (Ibaan) [cite: 111, 113]
    const userSql = `
      INSERT INTO users (username, email, password_hash, role, lgu_id, created_by) 
      VALUES ($1, $2, $3, 'Viewer', 1, $4) 
      RETURNING username, email, password_hash, role, 
                to_char(created_at, 'Mon DD, YYYY HH:MI AM') as created`;
    
    const userResult = await query(userSql, [username, email, password_hash, creator]);
    
    // Create Audit Log entry [cite: 21, 153]
    await query(
      'INSERT INTO audit_logs (actor, action, details, lgu_id) VALUES ($1, $2, $3, 1)',
      ['Viewer', 'USER_CREATE', `Created viewer: ${username}`]
    );

    return NextResponse.json(userResult.rows[0]);
  } catch (error: any) {
    console.error("Insert Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}