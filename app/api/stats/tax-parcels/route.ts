import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        parcel_no,
        owner_name,
        valuation,
        created_at
      FROM tax_parcels 
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching tax parcels data:", error.message);
    return NextResponse.json([]);
  }
}
