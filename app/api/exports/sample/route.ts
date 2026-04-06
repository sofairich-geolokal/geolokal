import { NextRequest, NextResponse } from 'next/server';

// Sample GeoJSON data
const sampleGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Sample Point 1',
        type: 'landmark',
        elevation: 100,
      },
      geometry: {
        type: 'Point',
        coordinates: [120.9842, 14.5995],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Sample Point 2',
        type: 'building',
        elevation: 50,
      },
      geometry: {
        type: 'Point',
        coordinates: [121.0000, 14.6000],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Sample Line',
        type: 'road',
        length: 1000,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [120.9842, 14.5995],
          [120.9900, 14.6000],
          [121.0000, 14.6000],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Sample Polygon',
        type: 'area',
        area_sqm: 10000,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [120.9800, 14.5900],
          [120.9900, 14.5900],
          [120.9900, 14.6000],
          [120.9800, 14.6000],
          [120.9800, 14.5900],
        ]],
      },
    },
  ],
};

// Sample CSV data
const sampleCSV = `name,type,elevation,longitude,latitude
Sample Point 1,landmark,100,120.9842,14.5995
Sample Point 2,building,50,121.0000,14.6000
Sample Line,road,,120.9842,14.5995
Sample Polygon,area,,120.9800,14.5900`;

// Sample KML data
const sampleKML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Sample Data</name>
    <Placemark>
      <name>Sample Point 1</name>
      <description>A sample point feature</description>
      <Point>
        <coordinates>120.9842,14.5995,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Sample Polygon</name>
      <description>A sample polygon feature</description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>120.9800,14.5900,0 120.9900,14.5900,0 120.9900,14.6000,0 120.9800,14.6000,0 120.9800,14.5900,0</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    let data: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'geojson':
        data = JSON.stringify(sampleGeoJSON, null, 2);
        contentType = 'application/json';
        filename = 'sample-data.geojson';
        break;
      
      case 'csv':
        data = sampleCSV;
        contentType = 'text/csv';
        filename = 'sample-data.csv';
        break;
      
      case 'kml':
        data = sampleKML;
        contentType = 'application/vnd.google-earth.kml+xml';
        filename = 'sample-data.kml';
        break;
      
      case 'shapefile':
        // For shapefile, we'll return a ZIP file with multiple components
        // This is a simplified version - in production, you'd generate actual shapefile components
        data = 'Shapefile export would be a ZIP file containing .shp, .shx, .dbf, .prj files';
        contentType = 'application/zip';
        filename = 'sample-data.zip';
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported format' },
          { status: 400 }
        );
    }

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Sample download error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate sample data' },
      { status: 500 }
    );
  }
}
