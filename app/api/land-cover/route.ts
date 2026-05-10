import { NextRequest, NextResponse } from 'next/server';

// ArcGIS Land Cover API configuration
const ARCGIS_LAND_COVER_URL = 'https://services3.arcgis.com/pNwij5WvjK23c10k/ArcGIS/rest/services/Land_Cover__NAMRIA_2020_/FeatureServer/0';

// Land cover class colors for styling based on NAMRIA classification
const LAND_COVER_COLORS = {
  'Open Forest': '#228B22',
  'Brush/Shrubs': '#8FBC8F', 
  'Grassland': '#90EE90',
  'Perennial Crop': '#FFD700',
  'Annual Crop': '#FFA500',
  'Built-up': '#FF6347',
  'Open/Barren': '#DEB887',
  'Fishpond': '#4682B4',
  'Inland Water': '#1E90FF',
  'Mangrove Forest': '#006400'
};

// Convert ESRI polygon rings to GeoJSON polygon format
const esriPolygonToGeoJSON = (rings: number[][][]): any => {
  // ESRI rings format: first ring is exterior, subsequent rings are holes
  const coordinates = rings.map(ring => 
    ring.map(coord => [coord[0], coord[1]]) // [longitude, latitude]
  );
  
  return {
    type: 'Polygon',
    coordinates: coordinates
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bbox = searchParams.get('bbox');
    const where = searchParams.get('where') || '1=1';
    const outFields = searchParams.get('outFields') || '*';
    const resultOffset = searchParams.get('resultOffset');
    const resultRecordCount = searchParams.get('resultRecordCount') || '1000';
    const geometry = searchParams.get('geometry');
    const geometryType = searchParams.get('geometryType');
    const spatialRel = searchParams.get('spatialRel') || 'esriSpatialRelIntersects';
    const returnGeometry = searchParams.get('returnGeometry') || 'true';
    const outSR = searchParams.get('outSR') || '4326';
    const f = searchParams.get('f') || 'json';

    // Build query parameters for ArcGIS REST API
    const params = new URLSearchParams({
      where,
      outFields,
      returnGeometry,
      outSR,
      spatialRel,
      f,
    });

    // Add optional parameters
    if (bbox) params.append('bbox', bbox);
    if (resultOffset) params.append('resultOffset', resultOffset);
    if (resultRecordCount) params.append('resultRecordCount', resultRecordCount);
    if (geometry) params.append('geometry', geometry);
    if (geometryType) params.append('geometryType', geometryType);

    console.log('Fetching ArcGIS Land Cover data from:', `${ARCGIS_LAND_COVER_URL}/query?${params.toString()}`);

    // Make request to ArcGIS REST API
    const response = await fetch(`${ARCGIS_LAND_COVER_URL}/query?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ArcGIS API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('ArcGIS Land Cover response:', data);

    // Check for ArcGIS API errors
    if (data.error) {
      throw new Error(`ArcGIS API Error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    // Transform ArcGIS features to GeoJSON format if needed
    let transformedData = data;
    
    if (data.features && Array.isArray(data.features)) {
      // Convert ArcGIS features to GeoJSON format
      transformedData = {
        type: 'FeatureCollection',
        features: data.features.map((feature: any) => {
          const { attributes, geometry } = feature;
          
          // Convert ESRI polygon geometry to GeoJSON if needed
          let geoJsonGeometry = geometry;
          if (geometry && geometry.rings) {
            geoJsonGeometry = esriPolygonToGeoJSON(geometry.rings);
          }
          
          // Get styling based on land cover class
          const className = attributes.CLASS_NAME as keyof typeof LAND_COVER_COLORS;
          const fillColor = LAND_COVER_COLORS[className] || '#CCCCCC';
          
          return {
            type: 'Feature',
            geometry: geoJsonGeometry,
            properties: {
              ...attributes,
              // Keep original ArcGIS attributes
              OBJECTID: attributes.OBJECTID,
              CLASS_ID: attributes.CLASS_ID,
              CLASS_NAME: className,
              PROVINCE: attributes.PROVINCE,
              REG_CODE: attributes.REG_CODE,
              REG_NAME: attributes.REG_NAME,
              AREA_HA: attributes.AREA_HA,
              Shape__Area: attributes.Shape__Area,
              Shape__Length: attributes.Shape__Length,
              // Add styling properties for map rendering
              _style: {
                fillColor: fillColor,
                fillOpacity: 0.7,
                strokeColor: '#000000',
                strokeOpacity: 0.8,
                strokeWidth: 1
              }
            }
          };
        }),
        // Preserve metadata from ArcGIS response
        metadata: {
          source: 'ArcGIS Land Cover NAMRIA 2020',
          totalFeatures: data.totalFeatures || data.features.length,
          exceededTransferLimit: data.exceededTransferLimit || false,
          objectIdFieldName: data.objectIdFieldName,
          uniqueIdField: data.uniqueIdField,
          globalIdFieldName: data.globalIdFieldName,
          geometryType: data.geometryType,
          spatialReference: data.spatialReference,
          fields: data.fields,
          // Add land cover specific metadata
          landCoverClasses: Object.keys(LAND_COVER_COLORS),
          colorScheme: LAND_COVER_COLORS
        }
      };
    }

    return NextResponse.json({
      success: true,
      data: transformedData,
      source: 'ArcGIS Land Cover NAMRIA 2020',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching ArcGIS Land Cover data:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch ArcGIS Land Cover data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Helper function to get layer metadata
export async function POST(request: NextRequest) {
  try {
    // Return layer metadata for UI display
    const layerMetadata = {
      id: 'land-cover-namria-2020',
      title: 'Land Cover - NAMRIA 2020',
      agency: 'NAMRIA',
      description: 'Land Cover map of the entire Philippines from NAMRIA 2020 dataset',
      source: 'ArcGIS Online',
      url: ARCGIS_LAND_COVER_URL,
      type: 'Feature Service',
      geometryType: 'Polygon',
      spatialReference: 'EPSG:4326',
      fields: [
        { name: 'OBJECTID', type: 'esriFieldTypeOID', alias: 'Object ID' },
        { name: 'LAND_COVER', type: 'esriFieldTypeString', alias: 'Land Cover Type' },
        { name: 'CLASS_NAME', type: 'esriFieldTypeString', alias: 'Classification Name' },
        { name: 'AREA', type: 'esriFieldTypeDouble', alias: 'Area' },
      ],
      category: 'Environmental',
      subcategory: 'Land Cover',
      tags: ['land cover', 'namria', 'philippines', 'environmental', '2020'],
      opacity: 0.7,
      visible: true,
      style: {
        type: 'categorical',
        field: 'LAND_COVER',
        defaultSymbol: {
          type: 'simple',
          symbolType: 'fill',
          color: [128, 128, 128, 128],
          outline: {
            color: [0, 0, 0, 255],
            width: 0.5
          }
        },
        uniqueValueInfos: [
          { value: 'Forest', symbol: { color: [34, 139, 34, 180], outline: { color: [0, 100, 0, 255], width: 0.5 } } },
          { value: 'Agriculture', symbol: { color: [255, 255, 0, 180], outline: { color: [200, 200, 0, 255], width: 0.5 } } },
          { value: 'Urban', symbol: { color: [128, 128, 128, 180], outline: { color: [64, 64, 64, 255], width: 0.5 } } },
          { value: 'Water', symbol: { color: [0, 100, 200, 180], outline: { color: [0, 50, 150, 255], width: 0.5 } } },
          { value: 'Grassland', symbol: { color: [154, 205, 50, 180], outline: { color: [100, 150, 0, 255], width: 0.5 } } },
          { value: 'Wetland', symbol: { color: [0, 150, 150, 180], outline: { color: [0, 100, 100, 255], width: 0.5 } } },
          { value: 'Barren', symbol: { color: [238, 203, 173, 180], outline: { color: [200, 150, 100, 255], width: 0.5 } } },
        ]
      }
    };

    return NextResponse.json({
      success: true,
      data: layerMetadata,
    });

  } catch (error) {
    console.error('Error getting Land Cover metadata:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get Land Cover metadata',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
