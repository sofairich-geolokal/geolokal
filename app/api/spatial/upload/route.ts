import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const layerType = formData.get('layerType') as string || 'unknown';
    
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
      const baseName = file.name.replace(/\.(shp|shx|dbf|prj|cpg|qmd)$/i, '');
      if (!fileGroups[baseName]) {
        fileGroups[baseName] = [];
      }
      fileGroups[baseName].push(file);
    });

    const savedLayers: { name: string; layerType: string; files: string[] }[] = [];
    
    // Save each file group and create database entry
    for (const [baseName, fileGroup] of Object.entries(fileGroups)) {
      const savedFiles: string[] = [];
      
      // Save files to filesystem
      for (const file of fileGroup) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = join(filesDir, file.name);
        
        await writeFile(filePath, buffer);
        savedFiles.push(file.name);
      }
      
      // Save to database
      try {
        const layerName = baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        const styleConfig = {
          color: layerType === 'waterways' ? '#3b82f6' : 
                  layerType === 'roads' ? '#ef4444' : 
                  layerType === 'boundaries' ? '#10b981' : '#6b7280',
          weight: layerType === 'waterways' ? 2 : 
                  layerType === 'roads' ? 3 : 
                  layerType === 'boundaries' ? 2 : 1,
          opacity: 0.8
        };
        
        const metadata = {
          source: 'upload',
          files: savedFiles,
          uploadDate: new Date().toISOString(),
          category: layerType
        };
        
        // Insert into map_layers table using Prisma
        const layer = await prisma.map_layers.create({
          data: {
            layer_name: layerName,
            layer_type: layerType,
            is_active: true,
            is_visible: true,
            style_config: styleConfig,
            metadata: metadata,
            created_at: new Date()
          }
        });
        
        if (layer.id) {
          savedLayers.push({
            name: layerName,
            layerType,
            files: savedFiles
          });
        }
        
      } catch (dbError) {
        console.error('Database error saving layer:', dbError);
        // Continue with file saving even if database fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      layers: savedLayers,
      count: savedLayers.length,
      message: `Successfully uploaded and saved ${savedLayers.length} layers to database`
    });
    
  } catch (error) {
    console.error('Error uploading spatial data:', error);
    return NextResponse.json(
      { error: 'Failed to upload spatial data' },
      { status: 500 }
    );
  }
}
