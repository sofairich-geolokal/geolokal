import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Define the interface for the database column info
interface ColumnInfo {
  column_name: string;
  data_type: string;
}

// Define the interface for the query result
interface QueryResult {
  rows: ColumnInfo[];
}

export async function GET() {
  try {
    // Cast the result to QueryResult to resolve the 'unknown' type error
    const result = (await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `)) as QueryResult;
    
    return NextResponse.json({
      success: true,
      columns: result.rows
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}