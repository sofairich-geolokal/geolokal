import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Forces the route to be dynamic, preventing static generation errors during build
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Testing database tables...');
    
    // Test if tables exist - Assert as 'any' to resolve 'unknown' type error
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `) as any;
    
    // Explicitly type 'r' to avoid implicit 'any' linting errors
    console.log('Tables found:', tables.rows.map((r: { table_name: string }) => r.table_name));
    
    // Test specific tables - Assert as 'any'
    const populationTable = await query(`
      SELECT COUNT(*) as count 
      FROM population_data 
      LIMIT 1
    `) as any;
    
    const mapLayersTable = await query(`
      SELECT COUNT(*) as count 
      FROM map_layers 
      LIMIT 1
    `) as any;
    
    return NextResponse.json({
      success: true,
      tables: tables.rows.map((r: { table_name: string }) => r.table_name),
      populationTableCount: populationTable.rows[0]?.count || 0,
      mapLayersCount: mapLayersTable.rows[0]?.count || 0
    });
    
  } catch (error: any) {
    console.error('Table test error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}