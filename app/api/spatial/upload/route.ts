import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import shp from 'shpjs';
import JSZip from 'jszip';

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

    // Create data directory for GeoJSON files
    const dataDir = join(process.cwd(), 'public', 'data');
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }

    // Group files by base name
    const fileGroups: { [key: string]: File[] } = {};
    files.forEach(file => {
      const baseName = file.name.replace(/\.(shp|shx|dbf|prj|cpg|qmd|zip)$/i, '');
      if (!fileGroups[baseName]) {
        fileGroups[baseName] = [];
      }
      fileGroups[baseName].push(file);
    });

    const savedLayers: { name: string; layerType: string; files: string[]; geojsonFile?: string }[] = [];
    
    // Save each file group and create database entry
    for (const [baseName, fileGroup] of Object.entries(fileGroups)) {
      const savedFiles: string[] = [];
      let geojsonFile: string | undefined;
      
      // Check if zip file
      const zipFile = fileGroup.find(f => f.name.toLowerCase().endsWith('.zip'));
      
      if (zipFile) {
        // Extract zip file
        const zip = new JSZip();
        const zipBuffer = await zipFile.arrayBuffer();
        const loadedZip = await zip.loadAsync(zipBuffer);
        
        const extractedFiles: File[] = [];
        for (const [filename, file] of Object.entries(loadedZip.files)) {
          if (!file.dir) {
            const blob = await file.async('blob');
            const extractedFile = new File([blob], filename, { type: blob.type });
            extractedFiles.push(extractedFile);
          }
        }
        
        // Save extracted files
        for (const file of extractedFiles) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const filePath = join(filesDir, file.name);
          await writeFile(filePath, buffer);
          savedFiles.push(file.name);
        }
        
        // Convert to GeoJSON
        try {
          const shpFile = extractedFiles.find(f => f.name.toLowerCase().endsWith('.shp'));
          const shxFile = extractedFiles.find(f => f.name.toLowerCase().endsWith('.shx'));
          const dbfFile = extractedFiles.find(f => f.name.toLowerCase().endsWith('.dbf'));
          
          if (shpFile && shxFile && dbfFile) {
            // Re-zip for shpjs
            const rezip = new JSZip();
            for (const file of extractedFiles) {
              const bytes = await file.arrayBuffer();
              rezip.file(file.name, bytes);
            }
            const rezipBuffer = await rezip.generateAsync({ type: 'arraybuffer' });
            const geojson = await shp(rezipBuffer);
            
            // Save GeoJSON to data folder
            const sanitizedFileName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
            const geojsonPath = join(dataDir, `${sanitizedFileName}.json`);
            await writeFile(geojsonPath, JSON.stringify(geojson, null, 2));
            geojsonFile = `${sanitizedFileName}.json`;
          }
        } catch (geoError) {
          console.error('Error converting to GeoJSON:', geoError);
        }
      } else {
        // Save individual files
        for (const file of fileGroup) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const filePath = join(filesDir, file.name);
          await writeFile(filePath, buffer);
          savedFiles.push(file.name);
        }
        
        // Convert to GeoJSON if shapefile components are present
        try {
          const shpFile = fileGroup.find(f => f.name.toLowerCase().endsWith('.shp'));
          const shxFile = fileGroup.find(f => f.name.toLowerCase().endsWith('.shx'));
          const dbfFile = fileGroup.find(f => f.name.toLowerCase().endsWith('.dbf'));
          
          if (shpFile && shxFile && dbfFile) {
            const zip = new JSZip();
            for (const file of fileGroup) {
              const bytes = await file.arrayBuffer();
              zip.file(file.name, bytes);
            }
            const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
            const geojson = await shp(zipBuffer);
            
            // Save GeoJSON to data folder
            const sanitizedFileName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
            const geojsonPath = join(dataDir, `${sanitizedFileName}.json`);
            await writeFile(geojsonPath, JSON.stringify(geojson, null, 2));
            geojsonFile = `${sanitizedFileName}.json`;
          }
        } catch (geoError) {
          console.error('Error converting to GeoJSON:', geoError);
        }
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
          opacity: 0.8,
          fillColor: layerType === 'waterways' ? '#3b82f6' : 
                   layerType === 'roads' ? '#ef4444' : 
                   layerType === 'boundaries' ? '#10b981' : '#6b7280',
          fillOpacity: 0.15
        };
        
        const metadata: any = {
          source: 'upload',
          files: savedFiles,
          uploadDate: new Date().toISOString(),
          category: layerType
        };
        
        if (geojsonFile) {
          metadata.geojson_file = geojsonFile;
        }
        
        // Insert into map_layers table using Prisma
        const layer = await prisma.map_layers.create({
          data: {
            layer_name: layerName,
            layer_type: layerType,
            is_active: true,
            is_visible: true,
            style_config: styleConfig,
            metadata: metadata,
            created_at: new Date(),
            category_id: null, // Explicitly set to null since it's optional
            uploaded_by: null // Explicitly set to null since it's optional
          }
        });
        
        if (layer.id) {
          savedLayers.push({
            name: layerName,
            layerType,
            files: savedFiles,
            geojsonFile
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
