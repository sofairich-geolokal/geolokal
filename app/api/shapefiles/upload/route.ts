import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // Create Files directory if it doesn't exist
    const filesDir = join(process.cwd(), 'Files');
    if (!existsSync(filesDir)) {
      await mkdir(filesDir, { recursive: true });
    }

    // Group files by base name
    const fileGroups: { [key: string]: File[] } = {};
    files.forEach(file => {
      const baseName = file.name.replace(/\.(shp|shx|dbf|prj|cpg)$/i, '');
      if (!fileGroups[baseName]) {
        fileGroups[baseName] = [];
      }
      fileGroups[baseName].push(file);
    });

    // Save each file group
    const results: { baseName: string; files: string[] }[] = [];
    
    for (const [baseName, fileGroup] of Object.entries(fileGroups)) {
      const savedFiles: string[] = [];
      
      for (const file of fileGroup) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = join(filesDir, file.name);
        
        await writeFile(filePath, buffer);
        savedFiles.push(file.name);
      }
      
      results.push({ baseName, files: savedFiles });
    }

    return NextResponse.json({ 
      success: true, 
      results,
      message: 'Files uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading shapefiles:', error);
    return NextResponse.json(
      { error: 'Failed to upload shapefiles' },
      { status: 500 }
    );
  }
}
