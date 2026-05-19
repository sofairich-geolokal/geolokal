import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/climate - Fetch climate type data from database or external API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const useExternal = searchParams.get('external') === 'true';
    const bbox = searchParams.get('bbox'); // bounding box: "minLon,minLat,maxLon,maxLat"
    
    // Try to fetch from database first
    const climateLayers = await prisma.map_layers.findMany({
      where: {
        layer_type: 'climate',
        is_visible: true
      },
      include: {
        city_muni_master: true,
        project_categories: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // If we have data in database, return it
    if (climateLayers.length > 0 && !useExternal) {
      return NextResponse.json({
        success: true,
        data: climateLayers,
        source: 'database'
      });
    }

    // Otherwise, fetch from PAGASA ArcGIS API
    const arcgisUrl = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/Philippine_Climate_Type/FeatureServer/0/query';
    
    const params = new URLSearchParams({
      f: 'json',
      where: bbox ? `INTERSECTS(Envelope, ${bbox})` : '1=1',
      outFields: '*',
      returnGeometry: 'true',
      outSR: '4326',
      resultRecordCount: '1000'
    });

    const response = await fetch(`${arcgisUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'GeoLokal/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`PAGASA API error: ${response.status}`);
    }

    const arcgisData = await response.json();

    if (arcgisData.error) {
      throw new Error(`PAGASA API Error: ${arcgisData.error.message}`);
    }

    // Transform to GeoJSON format
    const geoJsonData = {
      type: 'FeatureCollection',
      features: arcgisData.features?.map((feature: any) => {
        const { attributes, geometry } = feature;
        
        let geoJsonGeometry = geometry;
        if (geometry?.rings) {
          const coordinates = geometry.rings.map((ring: number[][]) => 
            ring.map(coord => [coord[0], coord[1]])
          );
          geoJsonGeometry = {
            type: 'Polygon',
            coordinates: coordinates
          };
        }
        
        return {
          type: 'Feature',
          geometry: geoJsonGeometry,
          properties: {
            ...attributes,
            OBJECTID: attributes.OBJECTID,
            CLIMATE_TYPE: attributes.CLIMATE_TYPE || attributes.Type || 'Unknown',
            DESCRIPTION: attributes.DESCRIPTION || attributes.Description || '',
            REGION: attributes.REGION || attributes.Region || '',
            PROVINCE: attributes.PROVINCE || attributes.Province || '',
            Shape__Area: attributes.Shape__Area,
            Shape__Length: attributes.Shape__Length
          }
        };
      }) || []
    };

    return NextResponse.json({
      success: true,
      data: geoJsonData,
      source: 'pagasa_api'
    });

  } catch (error) {
    console.error('Error fetching climate type data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/climate - Store climate type data in database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { layer_name, description, geojson, metadata } = body;

    if (!layer_name || !geojson) {
      return NextResponse.json({
        success: false,
        error: 'Layer name and GeoJSON data are required'
      }, { status: 400 });
    }

    // Create or update climate type layer
    const climateLayer = await prisma.map_layers.create({
      data: {
        layer_name,
        layer_type: 'climate',
        metadata: {
          ...metadata,
          geojson: geojson,
          source: 'pagasa',
          created_at: new Date().toISOString()
        },
        is_visible: true,
        created_at: new Date(),
        category_id: null,
        uploaded_by: null
      }
    });

    return NextResponse.json({
      success: true,
      data: climateLayer
    });

  } catch (error) {
    console.error('Error storing climate type data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
