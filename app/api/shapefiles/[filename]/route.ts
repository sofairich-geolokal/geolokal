import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import shp from 'shpjs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    
    // Security check - sanitize filename to prevent path traversal
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '');

    const filesDir = join(process.cwd(), 'Files');
    
    // Check if .shp file exists
    const shpPath = join(filesDir, `${sanitizedFilename}.shp`);
    const dbfPath = join(filesDir, `${sanitizedFilename}.dbf`);
    
    if (!existsSync(shpPath)) {
      return NextResponse.json({ error: 'Shapefile not found' }, { status: 404 });
    }
    
    // Read shapefile components
    const shpBuffer = await readFile(shpPath);
    
    let combinedBuffer: Buffer;
    if (existsSync(dbfPath)) {
      const dbfBuffer = await readFile(dbfPath);
      combinedBuffer = Buffer.concat([shpBuffer, dbfBuffer]);
    } else {
      combinedBuffer = shpBuffer;
    }
    
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
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to load shapefile', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
