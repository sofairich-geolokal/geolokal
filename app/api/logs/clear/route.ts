import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    // Delete all records from audit_logs table
    const result = await query('DELETE FROM audit_logs');
    
    console.log(`Deleted ${result.rowCount} audit log records`);
    
    return NextResponse.json({ 
      message: 'All audit logs cleared successfully',
      deletedCount: result.rowCount 
    });
  } catch (error: any) {
    console.error("Clear Logs Error:", error.message);
    return NextResponse.json(
      { error: 'Failed to clear logs' }, 
      { status: 500 }
    );
  }
}
