import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/landcover - Fetch land cover data from database or external API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const useExternal = searchParams.get('external') === 'true';
    const bbox = searchParams.get('bbox'); // bounding box: "minLon,minLat,maxLon,maxLat"
    
    // Try to fetch from database first
    const landCoverLayers = await prisma.map_layers.findMany({
      where: {
        layer_type: 'landcover',
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
    if (landCoverLayers.length > 0 && !useExternal) {
      return NextResponse.json({
        success: true,
        data: landCoverLayers,
        source: 'database'
      });
    }

    // Otherwise, fetch from NAMRIA ArcGIS API
    const arcgisUrl = 'https://services3.arcgis.com/pNwij5WvjK23c10k/ArcGIS/rest/services/Land_Cover__NAMRIA_2020_/FeatureServer/0/query';
    
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
      throw new Error(`NAMRIA API error: ${response.status}`);
    }

    const arcgisData = await response.json();

    if (arcgisData.error) {
      throw new Error(`NAMRIA API Error: ${arcgisData.error.message}`);
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
            CLASS_ID: attributes.CLASS_ID,
            CLASS_NAME: attributes.CLASS_NAME,
            PROVINCE: attributes.PROVINCE,
            REG_CODE: attributes.REG_CODE,
            REG_NAME: attributes.REG_NAME,
            AREA_HA: attributes.AREA_HA,
            Shape__Area: attributes.Shape__Area,
            Shape__Length: attributes.Shape__Length
          }
        };
      }) || []
    };

    return NextResponse.json({
      success: true,
      data: geoJsonData,
      source: 'namria_api'
    });

  } catch (error) {
    console.error('Error fetching land cover data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/landcover - Store land cover data in database
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

    // Create or update land cover layer
    const landCoverLayer = await prisma.map_layers.create({
      data: {
        layer_name,
        layer_type: 'landcover',
        metadata: {
          ...metadata,
          geojson: geojson,
          source: 'namria',
          created_at: new Date().toISOString()
        },
        is_visible: true,
        created_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: landCoverLayer
    });

  } catch (error) {
    console.error('Error storing land cover data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
