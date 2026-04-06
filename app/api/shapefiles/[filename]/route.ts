import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import shp from 'shpjs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    
    // Security check - only allow specific filenames
    const allowedFiles = ['Ibaan_boundary', 'Ibaan_roadnetworks', 'Ibaan_waterways'];
    if (!allowedFiles.includes(filename)) {
      return NextResponse.json({ error: 'File not allowed' }, { status: 403 });
    }

    const filesDir = join(process.cwd(), 'Files');
    
    // Read all shapefile components
    const [shpBuffer, dbfBuffer] = await Promise.all([
      readFile(join(filesDir, `${filename}.shp`)),
      readFile(join(filesDir, `${filename}.dbf`))
    ]);

    // Combine buffers for shpjs
    const combinedBuffer = Buffer.concat([shpBuffer, dbfBuffer]);
    
    // Parse shapefile
    const geojson = await shp(combinedBuffer);
    
    return new NextResponse(JSON.stringify(geojson), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Error serving shapefile:', error);
    return NextResponse.json(
      { error: 'Failed to load shapefile' },
      { status: 500 }
    );
  }
}
