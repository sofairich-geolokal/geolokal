import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log("Test: Starting simple logs test endpoint");
    
    // Test 1: Check if we can connect to database
    const testQuery = await query('SELECT 1 as test');
    console.log("Test: Database connection OK:", testQuery.rows[0].test);

    // Test 2: Check if audit_logs table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs'
      );
    `);
    console.log("Test: audit_logs table exists:", tableCheck.rows[0].exists);

    if (!tableCheck.rows[0].exists) {
      return NextResponse.json({ 
        error: 'audit_logs table does not exist', 
        tableExists: false
      }, { status: 500 });
    }

    // Test 3: Get all audit logs (no auth required)
    const allLogs: any = await query(`
      SELECT 
        to_char(timestamp, 'Mon DD, YYYY HH:MI AM') as timestamp,
        actor, 
        action, 
        created_by,
        details,
        id
      FROM audit_logs 
      ORDER BY timestamp DESC
      LIMIT 10`);
      
    console.log("Test: Found logs:", allLogs.rows.length);

    // Test 4: Check viewer_activity table
    const viewerTableCheck: any = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'viewer_activity'
      );
    `);
    console.log("Test: viewer_activity table exists:", viewerTableCheck.rows[0].exists);

    let viewerLogs: any = { rows: [] };
    if (viewerTableCheck.rows[0].exists) {
      viewerLogs = await query(`
        SELECT 
          to_char(timestamp, 'Mon DD, YYYY HH:MI AM') as timestamp,
          activity_type as action,
          activity_data::text as details,
          id
        FROM viewer_activity 
        ORDER BY timestamp DESC
        LIMIT 5`);
      console.log("Test: Found viewer activities:", viewerLogs.rows.length);
    }

    return NextResponse.json({
      success: true,
      message: "Test endpoint working",
      data: {
        auditLogs: allLogs.rows,
        viewerLogs: viewerLogs.rows,
        auditTableExists: tableCheck.rows[0].exists,
        viewerTableExists: viewerTableCheck.rows[0].exists,
        totalAuditLogs: allLogs.rows.length,
        totalViewerLogs: viewerLogs.rows.length
      }
    });

  } catch (error: any) {
    console.error("Test: Error in logs test:", error.message);
    return NextResponse.json({ 
      error: 'Test error', 
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
