import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 Testing database tables...');
    
    // Test if tables exist
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables found:', tables.rows.map(r => r.table_name));
    
    // Test specific tables
    const populationTable = await query(`
      SELECT COUNT(*) as count 
      FROM population_data 
      LIMIT 1
    `);
    
    const mapLayersTable = await query(`
      SELECT COUNT(*) as count 
      FROM map_layers 
      LIMIT 1
    `);
    
    return NextResponse.json({
      success: true,
      tables: tables.rows.map(r => r.table_name),
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
