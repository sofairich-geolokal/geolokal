import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Use dynamic import for simplify-geojson to avoid TypeScript issues
const simplifyGeoJSON = (geojson: any, options?: {
  tolerance?: number;
  highQuality?: boolean;
  mutate?: (original: any) => any;
}): any => {
  try {
    // Dynamic import to avoid module declaration issues
    const simplifyModule = require('simplify-geojson');
    return simplifyModule(geojson, options);
  } catch (error) {
    console.error('Simplification module not available:', error);
    return geojson; // Return original if simplification fails
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const lguId = searchParams.get('lguId');
    const visible = searchParams.get('visible');

    // Build where clause
    const whereClause: any = {};
  
    if (category) {
      whereClause.category_id = parseInt(category);
    }
  
    // Temporarily disable lgu_id filter until database schema is fixed
    // if (lguId) {
    //   whereClause.lgu_id = parseInt(lguId);
    // }
  
    if (visible !== null) {
      whereClause.is_visible = visible === 'true';
    }

    const layers = await prisma.map_layers.findMany({
      where: whereClause as any,
    });

    return NextResponse.json({
      success: true,
      data: layers,
      count: layers.length,
    });
  } catch (error) {
    console.error('Error fetching layers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch layers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      layer_name, // Received from frontend
      lgu_id,
      category_id,
      layer_type,
      metadata,
      style_config,
      bbox,
      projection,
      min_zoom,
      max_zoom,
      attribution,
      opacity,
      z_index,
      is_visible,
      is_downloadable,
    } = body;

    const data: any = {
      layer_name,
      layer_type: layer_type || 'vector',
      metadata: metadata || {},
      style_config: style_config || {},
      projection: projection || 'EPSG:4326',
      min_zoom: min_zoom ? parseInt(min_zoom) : 0,
      max_zoom: max_zoom ? parseInt(max_zoom) : 20,
      opacity: opacity ? parseFloat(opacity) : 1.0,
      z_index: z_index ? parseInt(z_index) : 0,
      is_visible: is_visible !== undefined ? is_visible : true,
      is_downloadable: is_downloadable !== undefined ? is_downloadable : false,
    };

    if (lgu_id !== undefined && lgu_id !== null && lgu_id !== '') {
      data.lgu_id = parseInt(lgu_id);
    }
    if (category_id !== undefined && category_id !== null && category_id !== '') {
      data.category_id = parseInt(category_id);
    }
    if (bbox) {
      data.bbox = bbox;
    }
    if (attribution) {
      data.attribution = attribution;
    }

    console.log('Creating layer with data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.layer_name) {
      return NextResponse.json(
        { success: false, error: 'Layer name is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data.layer_name || data.layer_name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Layer name is required' },
        { status: 400 }
      );
    }

    if (!data.layer_type) {
      return NextResponse.json(
        { success: false, error: 'Layer type is required' },
        { status: 400 }
      );
    }

    // Try creating with minimal data first
    try {
      // Clean and validate metadata
      let cleanMetadata = data.metadata || {};
      if (typeof cleanMetadata !== 'object') {
        cleanMetadata = {};
      }

      // Simplify geometry if it's too large
      if (cleanMetadata.geojson) {
        try {
          const originalSize = JSON.stringify(cleanMetadata.geojson).length;
          console.log('Original GeoJSON size:', originalSize, 'bytes');
          
          let simplifiedGeoJSON = cleanMetadata.geojson;
          let currentSize = originalSize;
          const maxAllowedSize = 50000000; // 50MB limit
          
          // Progressive simplification with increasing tolerance
          const tolerances = [0.0001, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1];
          
          for (const tolerance of tolerances) {
            if (currentSize <= maxAllowedSize) break;
            
            simplifiedGeoJSON = simplifyGeoJSON(simplifiedGeoJSON, {
              tolerance: tolerance,
              highQuality: tolerance <= 0.005, // Use high quality for smaller tolerances
              mutate: (original: any) => original
            });
            
            currentSize = JSON.stringify(simplifiedGeoJSON).length;
            console.log(`Simplified with tolerance ${tolerance}:`, currentSize, 'bytes');
            
            if (currentSize <= maxAllowedSize) break;
          }
          
          // If still too large, try feature reduction
          if (currentSize > maxAllowedSize && simplifiedGeoJSON.features) {
            const totalFeatures = simplifiedGeoJSON.features.length;
            const maxFeatures = Math.floor(totalFeatures * (maxAllowedSize / currentSize));
            
            if (maxFeatures > 0 && maxFeatures < totalFeatures) {
              simplifiedGeoJSON = {
                ...simplifiedGeoJSON,
                features: simplifiedGeoJSON.features.slice(0, maxFeatures)
              };
              currentSize = JSON.stringify(simplifiedGeoJSON).length;
              console.log(`Reduced features from ${totalFeatures} to ${maxFeatures}:`, currentSize, 'bytes');
            }
          }
          
          const finalSizeReduction = ((originalSize - currentSize) / originalSize * 100).toFixed(1);
          console.log('Final GeoJSON size:', currentSize, 'bytes');
          console.log('Total size reduction:', finalSizeReduction + '%');
          
          cleanMetadata.geojson = simplifiedGeoJSON;
          
          // Final size check with higher limit
          if (currentSize > maxAllowedSize) {
            return NextResponse.json(
              { 
                success: false, 
                error: `Layer data too large (${(currentSize / 1000000).toFixed(1)}MB). Please reduce geometry complexity or split into smaller layers. Maximum allowed size is 15MB.` 
              },
              { status: 400 }
            );
          }
          
        } catch (simplifyError) {
          console.error('Geometry simplification failed:', simplifyError);
          
          // Check if original is still too large
          const originalSize = JSON.stringify(cleanMetadata.geojson).length;
          if (originalSize > 50000000) {
            return NextResponse.json(
              { 
                success: false, 
                error: 'Layer data too large even after simplification. Please reduce geometry complexity.' 
              },
              { status: 400 }
            );
          }
        }
      }

      const layer = await prisma.map_layers.create({
        data: {
          layer_name: data.layer_name.trim().substring(0, 100), // Limit to 100 chars
          metadata: cleanMetadata,
        } as any,
      });
      console.log('Layer created successfully:', layer.id);
      return NextResponse.json({
        success: true,
        data: layer,
      });
    } catch (createError) {
      console.error('Error creating layer with minimal data:', createError);
      console.error('Prisma error code:', (createError as any).code);
      console.error('Prisma error meta:', (createError as any).meta);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create layer';
      if ((createError as any).code === 'P2002') {
        errorMessage = 'Layer name already exists. Please use a different name.';
      } else if ((createError as any).code?.startsWith('P')) {
        errorMessage = `Database error: ${(createError as any).message}`;
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage, details: createError instanceof Error ? createError.message : String(createError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating layer:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { success: false, error: 'Failed to create layer', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, layer_name, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Layer ID is required' },
        { status: 400 }
      );
    }

    // Map layer_name if provided
    if (layer_name) {
      (updateData as any).layer_name = layer_name;
    }

    if (updateData.lgu_id) updateData.lgu_id = parseInt(updateData.lgu_id);
    if (updateData.category_id) updateData.category_id = parseInt(updateData.category_id);
    if (updateData.min_zoom) updateData.min_zoom = parseInt(updateData.min_zoom);
    if (updateData.max_zoom) updateData.max_zoom = parseInt(updateData.max_zoom);
    if (updateData.opacity) updateData.opacity = parseFloat(updateData.opacity);
    if (updateData.z_index) updateData.z_index = parseInt(updateData.z_index);

    const layer = await prisma.map_layers.update({
      where: { id: parseInt(id) },
      data: updateData as any,
    });

    return NextResponse.json({
      success: true,
      data: layer,
    });
  } catch (error) {
    console.error('Error updating layer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update layer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Layer ID is required' },
        { status: 400 }
      );
    }

    await prisma.map_layers.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Layer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting layer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete layer' },
      { status: 500 }
    );
  }
}