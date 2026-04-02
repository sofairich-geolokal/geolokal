import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log("Debug: Starting logs debug endpoint");
    
    // Test 1: Check auth
    const userId = await getAuthUser();
    console.log("Debug: User ID from auth:", userId);
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized - No auth token found', 
        step: 'auth',
        userId: null 
      }, { status: 401 });
    }

    // Test 2: Get user info
    const userResult = await query('SELECT lgu_id, username FROM users WHERE id = $1', [userId]);
    console.log("Debug: User query result:", userResult.rows);
    
    if (!userResult.rows[0]) {
      return NextResponse.json({ 
        error: 'User not found', 
        step: 'user_query',
        userId: userId,
        userResult: userResult.rows
      }, { status: 404 });
    }

    const loggedInUser = userResult.rows[0];

    // Test 3: Check audit_logs table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs'
      );
    `);
    console.log("Debug: audit_logs table exists:", tableCheck.rows[0].exists);

    if (!tableCheck.rows[0].exists) {
      return NextResponse.json({ 
        error: 'audit_logs table does not exist', 
        step: 'table_check',
        tableExists: false
      }, { status: 500 });
    }

    // Test 4: Count logs for this LGU
    const countResult = await query('SELECT COUNT(*) as count FROM audit_logs WHERE lgu_id = $1', [loggedInUser.lgu_id]);
    console.log("Debug: Log count for LGU:", countResult.rows[0].count);

    // Test 5: Try to fetch actual logs
    const auditSql = `
      SELECT 
        to_char(timestamp, 'Mon DD, YYYY HH:MI AM') as timestamp,
        actor, 
        action, 
        created_by,
        details,
        id,
        'audit' as log_type
      FROM audit_logs 
      WHERE lgu_id = $1
      LIMIT 5`;
      
    const auditResult = await query(auditSql, [loggedInUser.lgu_id]);
    console.log("Debug: Sample logs:", auditResult.rows);

    return NextResponse.json({
      success: true,
      debug: {
        step: 'success',
        userId: userId,
        userInfo: loggedInUser,
        tableExists: tableCheck.rows[0].exists,
        logCount: countResult.rows[0].count,
        sampleLogs: auditResult.rows
      }
    });

  } catch (error: any) {
    console.error("Debug: Error in logs debug:", error.message);
    return NextResponse.json({ 
      error: 'Debug error', 
      message: error.message,
      step: 'exception'
    }, { status: 500 });
  }
}
