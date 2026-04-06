import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('Creating roadnetworks table...');
    
    // Create the table
    await query(`
      CREATE TABLE IF NOT EXISTS roadnetworks (
          id SERIAL PRIMARY KEY,
          properties JSONB,
          geometry JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Table created successfully!');
    
    // Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_roadnetworks_geometry ON roadnetworks USING GIN (geometry)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_roadnetworks_properties ON roadnetworks USING GIN (properties)
    `);
    
    console.log('Indexes created successfully!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Road networks table created successfully' 
    });
  } catch (error: any) {
    console.error("Create Table Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to create the roadnetworks table' 
  });
}
